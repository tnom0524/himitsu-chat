import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const firestore = admin.firestore();

// Realtime Databaseの/status/{classroomId}/{userId}パスからデータが削除されたら起動
export const onUserStatusChanged = functions.database
  .ref("/status/{classroomId}/{userId}")
  .onDelete(async (snapshot, context) => {
    const { classroomId } = context.params;
    const deletedUserData = snapshot.val();

    if (deletedUserData.role === "teacher") {
      // 削除されたのが教師だった場合
      functions.logger.log(`Teacher left classroom ${classroomId}. Deleting all rooms.`);
      
      // クラスルームの全サブコレクション（rooms, messages）を削除
      const classroomRef = firestore.collection("classrooms").doc(classroomId);
      await firestore.recursiveDelete(classroomRef);

      // teacherIdをnullに戻す
      await classroomRef.set({ teacherId: null }, { merge: true });

    } else if (deletedUserData.role === "student") {
      // 削除されたのが生徒だった場合
      const studentId = deletedUserData.anonymousId;
      functions.logger.log(`Student ${studentId} left classroom ${classroomId}. Deleting private room.`);

      // その生徒の小部屋（と中のメッセージ）だけを削除
      const smallRoomRef = firestore.collection("classrooms").doc(classroomId).collection("rooms").doc(studentId);
      await firestore.recursiveDelete(smallRoomRef);
    }
  });