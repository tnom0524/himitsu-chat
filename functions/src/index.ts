import { onValueDeleted } from "firebase-functions/v2/database"; // 👈 onDelete を onValueDeleted に修正
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { DatabaseEvent, DataSnapshot } from "firebase-functions/v2/database"; // 👈 型をインポート

admin.initializeApp();
const firestore = admin.firestore();

export const onUserStatusChanged = onValueDeleted( // 👈 onDelete を onValueDeleted に修正
  "/status/{classroomId}/{userId}",
  async (event: DatabaseEvent<DataSnapshot>) => { // 👈 eventに型を追加
    const { classroomId } = event.params;
    const deletedUserData = event.data.val();

    if (!deletedUserData) {
      logger.info("No data found in deleted snapshot.");
      return;
    }

    if (deletedUserData.role === "teacher") {
      logger.info(`Teacher left classroom ${classroomId}. Deleting all rooms.`);
      const classroomRef = firestore.collection("classrooms").doc(classroomId);
      
      // サブコレクションの削除処理（バッチ処理）
      const collections = await classroomRef.listCollections();
      for (const collection of collections) {
        const docs = await collection.listDocuments();
        if (docs.length > 0) {
            const batch = firestore.batch();
            docs.forEach((doc) => batch.delete(doc));
            await batch.commit();
        }
      }
      
      await classroomRef.set({ teacherId: null }, { merge: true });

    } else if (deletedUserData.role === "student") {
      const studentId = deletedUserData.anonymousId;
      logger.info(`Student ${studentId} left classroom ${classroomId}. Deleting private room.`);

      const smallRoomRef = firestore
        .collection("classrooms").doc(classroomId)
        .collection("rooms").doc(studentId);
        
      // サブコレクションの削除処理（バッチ処理）
      const collections = await smallRoomRef.listCollections();
      for (const collection of collections) {
        const docs = await collection.listDocuments();
         if (docs.length > 0) {
            const batch = firestore.batch();
            docs.forEach((doc) => batch.delete(doc));
            await batch.commit();
        }
      }
      await smallRoomRef.delete();
    }
  });