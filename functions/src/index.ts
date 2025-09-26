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
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
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
        logger.info(`Teacher left classroom ${classroomId}. Deleting all rooms.`);
        const roomsPath = `classrooms/${classroomId}/rooms`;
        await deleteCollection(roomsPath, 50);
        await firestore.collection("classrooms").doc(classroomId).update({ teacherId: null });

      } else if (deletedUserData.role === "student") {
        const studentId = deletedUserData.anonymousId;
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