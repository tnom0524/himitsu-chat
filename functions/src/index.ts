import { onValueDeleted } from "firebase-functions/v2/database";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { DatabaseEvent, DataSnapshot } from "firebase-functions/v2/database";

admin.initializeApp();
const firestore = admin.firestore();

// コレクションを再帰的に削除する、より堅牢なヘルパー関数
// コレクションを再帰的に削除する、より堅牢なヘルパー関数
async function deleteCollection(collectionPath: string, batchSize: number) {
  const collectionRef = firestore.collection(collectionPath);
  let query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise<void>(async (resolve, reject) => {
    try {
      let snapshot = await query.get();
      while (snapshot.size > 0) {
        const batch = firestore.batch();
        for (const doc of snapshot.docs) {
          // サブコレクションを再帰的に削除
          const subcollections = await doc.ref.listCollections();
          for (const subcollection of subcollections) {
            await deleteCollection(subcollection.path, 50); // 再帰呼び出し
          }
          batch.delete(doc.ref);
        }
        await batch.commit();

        // 次のバッチのためにクエリを更新
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        query = collectionRef.orderBy("__name__").startAfter(lastVisible).limit(batchSize);
        snapshot = await query.get();
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export const onUserStatusChanged = onValueDeleted(
  "/status/{classroomId}/{authUserId}",
  async (event: DatabaseEvent<DataSnapshot>) => {
    const { classroomId, authUserId } = event.params;
    const deletedUserData = event.data.val();

    if (!deletedUserData) {
      return logger.info("No user data on delete for user:", authUserId);
    }

    try {
      if (deletedUserData.role === "teacher") {
        logger.info(`Teacher left classroom ${classroomId}. Deleting classroom and all sub-collections.`);
        
        // 1. roomsサブコレクションとその中のmessagesサブコレクションを再帰的に削除
        const roomsPath = `classrooms/${classroomId}/rooms`;
        await deleteCollection(roomsPath, 50);
        logger.info(`Successfully deleted all rooms in classroom ${classroomId}.`);

        // 2. クラスルームのドキュメント自体を削除
        await firestore.collection("classrooms").doc(classroomId).delete();
        logger.info(`Successfully deleted classroom document ${classroomId}.`);

        // 3. Realtime Databaseのクラスルームのstatusを全て削除
        const rtDbClassroomStatusRef = admin.database().ref(`status/${classroomId}`);
        await rtDbClassroomStatusRef.remove();
        logger.info(`Successfully deleted all status entries for classroom ${classroomId} in Realtime Database.`);

      } else if (deletedUserData.role === "student") {
        // event.params.authUserId は Realtime Database のキーであり、学生の場合は anonymousId に相当する
        const studentId = authUserId; 
        logger.info(`Student ${studentId} left classroom ${classroomId}. Deleting their private room.`);
        
        const teacherId = `teacher_for_${classroomId}`;
        const roomId = [studentId, teacherId].sort().join("_");
        
        const messagesPath = `classrooms/${classroomId}/rooms/${roomId}/messages`;
        await deleteCollection(messagesPath, 50); // まずメッセージを削除
        await firestore.collection("classrooms").doc(classroomId).collection("rooms").doc(roomId).delete(); // 次に部屋を削除
      }
    } catch (error) {
      logger.error(`Cleanup failed for user ${authUserId} in classroom ${classroomId}:`, error);
    }
  }
);

export const updateRoomOnNewMessage = onDocumentCreated(
  "classrooms/{classroomId}/rooms/{roomId}/messages/{messageId}",
  async (event) => {
    const { classroomId, roomId } = event.params;
    const messageData = event.data?.data();

    if (!messageData) {
      logger.info("No message data found, exiting function.");
      return;
    }

    // 大部屋のメッセージは処理対象外
    if (roomId === "large_room") {
      logger.info("Message in large_room, skipping room update.");
      return;
    }

    // 教師からのメッセージの場合は、未読カウントを増やさず、ルーム情報も更新しない
    const senderId = messageData.senderId;
    if (senderId.startsWith("teacher_")) {
      logger.info(`Message from teacher ${senderId}, skipping room update.`);
      return;
    }

    // 対応するルームドキュメントを更新
    const roomRef = firestore
      .collection("classrooms")
      .doc(classroomId)
      .collection("rooms")
      .doc(roomId);

    try {
      // increment() を使ってアトミックに未読件数を増やす
      await roomRef.update({
        lastMessage: messageData.text,
        lastMessageTimestamp: messageData.createdAt,
        unreadCount: FieldValue.increment(1),
      });
      logger.info(`Successfully updated room ${roomId} with new message info.`);
    } catch (error) {
      // ドキュメントが存在しない場合も考慮（基本的には存在するはず）
      logger.error(`Failed to update room ${roomId}:`, error);
    }
  }
);
