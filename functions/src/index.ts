import { onValueDeleted } from "firebase-functions/v2/database";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { DatabaseEvent, DataSnapshot } from "firebase-functions/v2/database";

admin.initializeApp();
const firestore = admin.firestore();

// コレクションを再帰的に削除する、より堅牢なヘルパー関数
async function deleteCollection(collectionPath: string, batchSize: number) {
  const collectionRef = firestore.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(
  query: admin.firestore.Query,
  resolve: (value: unknown) => void
) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    resolve(0);
    return;
  }

  const batch = firestore.batch();
  for (const doc of snapshot.docs) {
    // サブコレクションを再帰的に削除
    const subcollections = await doc.ref.listCollections();
    for (const subcollection of subcollections) {
      await deleteCollection(subcollection.path, 50);
    }
    batch.delete(doc.ref);
  }
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
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
