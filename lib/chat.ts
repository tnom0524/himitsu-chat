import { db } from "./firebase";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  DocumentData,
  doc,
  updateDoc,
  getDoc,
  getDocs, // 👈 getDocs を追加
  where,    // 👈 where を追加
} from "firebase/firestore";
import type { User } from "./chat-context"; // 👈 User 型をインポート

// メッセージの型を定義
export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

/**
 * 特定の部屋のメッセージをリアルタイムで取得する関数
 * @param classroomId - クラスルームID (例: "A")
 * @param roomId - ルームID (例: "large_room" or "small_room_with_student1")
 * @param callback - メッセージが更新されるたびに呼び出される関数
 * @returns 購読を停止するための関数
 */
export const getMessages = (
  classroomId: string,
  roomId: string,
  callback: (messages: Message[]) => void
) => {
  const messagesRef = collection(db, "classrooms", classroomId, "rooms", roomId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc")); // 古い順に並び替え

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc: DocumentData) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    callback(messages);
  });

  return unsubscribe; // 後で監視を停止するためにunsubscribe関数を返す
};

export const getStudentsInClassroom = async (classroomId: string): Promise<User[]> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("classroomId", "==", classroomId), where("role", "==", "student"));
  
  const querySnapshot = await getDocs(q);
  const students: User[] = [];
  querySnapshot.forEach((doc) => {
    students.push({ id: doc.id, ...doc.data() } as User);
  });

  return students;
};

/**
 * メッセージを送信する関数
 * @param classroomId - クラスルームID
 * @param roomId - ルームID
 * @param text - 送信するメッセージのテキスト
 * @param senderId - 送信者のID
 */
export const sendMessage = async (
  classroomId: string,
  roomId: string,
  text: string,
  senderId: string
) => {
  if (!text.trim()) return; // 空のメッセージは送信しない

  const messagesRef = collection(db, "classrooms", classroomId, "rooms", roomId, "messages");
  await addDoc(messagesRef, {
    text: text,
    senderId: senderId,
    createdAt: Timestamp.now(),
  });
};

// ▼▼▼ ここから下を追記 ▼▼▼

// 小部屋の情報を表す型
export interface PrivateRoomInfo {
  id: string; // ルームID (生徒の匿名IDと同じ)
  studentId: string;
}

/**
 * 特定のクラスルームに存在する小部屋の一覧を取得する関数
 * @param classroomId - クラスルームID
 * @param callback - 小部屋一覧が更新されるたびに呼び出される関数
 * @returns 購読を停止するための関数
 */
export const getPrivateRooms = (
  classroomId: string,
  callback: (rooms: PrivateRoomInfo[]) => void
) => {
  const roomsRef = collection(db, "classrooms", classroomId, "rooms");
  // IDが "large_room" ではない、つまり小部屋だけをクエリする
  const q = query(roomsRef, where("__name__", "!=", "large_room"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const rooms: PrivateRoomInfo[] = [];
    querySnapshot.forEach((doc) => {
      // ドキュメントIDが生徒のIDなので、それをそのまま利用
      rooms.push({ id: doc.id, studentId: doc.id });
    });
    callback(rooms);
});

  return unsubscribe;
};

export const getClassroom = async (classroomId: string) => {
  const roomRef = doc(db, "classrooms", classroomId);
  const roomSnap = await getDoc(roomRef);
  return roomSnap.exists() ? roomSnap.data() : null;
};

// 先生がクラスルームに入室する関数
export const joinAsTeacher = async (classroomId: string, teacherId: string) => {
  const roomRef = doc(db, "classrooms", classroomId);
  await updateDoc(roomRef, { teacherId: teacherId });
};

// 先生がクラスルームから退出する関数（将来的に使う）
export const leaveAsTeacher = async (classroomId: string) => {
  const roomRef = doc(db, "classrooms", classroomId);
  await updateDoc(roomRef, { teacherId: null });
};