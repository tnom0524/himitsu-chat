import { db } from "./firebase";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  DocumentData,
} from "firebase/firestore";

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