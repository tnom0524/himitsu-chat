import { db, app } from "./firebase"; // 👈 appもインポート
import {
  collection, addDoc, onSnapshot, query, orderBy, Timestamp,
  doc, getDoc, setDoc, where, getDocs, DocumentData, updateDoc
} from "firebase/firestore";
import type { User } from "./chat-context";

// Message, PrivateRoomInfoの型定義 (変更なし)
export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}
export interface PrivateRoomInfo {
  id: string;
  studentId: string;
}

// ▼▼▼ この関数が抜けていたため、追加します ▼▼▼
/**
 * 2人のユーザー間のプライベートチャットルームを取得、または作成する関数
 * @param user1Id ユーザー1のID
 * @param user2Id ユーザー2のID
 * @param classroomId クラスルームID
 * @returns ルームID
 */
export const getOrCreatePrivateRoom = async (user1Id: string, user2Id: string, classroomId: string): Promise<string> => {
  // IDをアルファベット順にソートして、常に同じルームIDを生成する
  const members = [user1Id, user2Id].sort();
  const roomId = members.join("_");

  // 小部屋のパスを修正
  const roomRef = doc(db, "classrooms", classroomId, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    // ルームが存在しない場合は、新しく作成する
    await setDoc(roomRef, {
      members: members,
      createdAt: Timestamp.now(),
    });
  }
  return roomId;
};
// ▲▲▲

// getMessages, sendMessage (変更なし)
export const getMessages = (classroomId: string, roomId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = collection(db, "classrooms", classroomId, "rooms", roomId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    callback(messages);
  });
  return unsubscribe;
};

export const sendMessage = async (classroomId: string, roomId: string, text: string, senderId: string) => {
  if (!text.trim()) return;
  const messagesRef = collection(db, "classrooms", classroomId, "rooms", roomId, "messages");
  await addDoc(messagesRef, {
    text: text,
    senderId: senderId,
    createdAt: Timestamp.now(),
  });
};

export const getPrivateRooms = (
  classroomId: string,
  callback: (rooms: PrivateRoomInfo[]) => void
) => {
  const roomsRef = collection(db, "classrooms", classroomId, "rooms");
  // where("members", "array-contains-any", [currentUser.id])のようなロジックが理想だが、
  // 匿名設計のため、ここでは__name__ != "large_room" を使う
  const q = query(roomsRef, where("__name__", "!=", "large_room"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const rooms: PrivateRoomInfo[] = [];
    snapshot.forEach((doc) => {
      // ドキュメントが存在する場合のみリストに追加
      if (doc.exists()) {
        const members = doc.data().members;
        // membersフィールドがあり、配列であることを確認
        if (Array.isArray(members)) {
          const studentId = members.find((id: string) => !id.startsWith('teacher_'));
          if (studentId) {
            rooms.push({ id: doc.id, studentId: studentId });
          }
        }
      }
    });
    callback(rooms);
  });

  return unsubscribe;
};
// getClassroom, joinAsTeacher, leaveAsTeacher (変更なし)
export const getClassroom = async (classroomId: string) => {
  const roomRef = doc(db, "classrooms", classroomId);
  const roomSnap = await getDoc(roomRef);
  return roomSnap.exists() ? roomSnap.data() : null;
};

export const joinAsTeacher = async (classroomId: string, teacherId: string) => {
  const classroomRef = doc(db, "classrooms", classroomId);
  const largeRoomRef = doc(db, "classrooms", classroomId, "rooms", "large_room");

  // 先生のIDを書き込む
  await setDoc(classroomRef, { teacherId: teacherId }, { merge: true });
  
  // 同時に、大部屋のドキュメントも（なければ）作成する
  await setDoc(largeRoomRef, {
    type: "public",
    createdAt: Timestamp.now(),
  });
};

/**
 * 特定のクラスルームの状態（先生の在室状況など）をリアルタイムで監視する関数
 * @param classroomId - クラスルームID
 * @param callback - データが更新されるたびに呼び出される関数
 * @returns 購読を停止するための関数
 */
export const onClassroomStateChange = (
  classroomId: string,
  callback: (data: DocumentData | null) => void
) => {
  const roomRef = doc(db, "classrooms", classroomId);
  return onSnapshot(roomRef, (doc) => {
    callback(doc.exists() ? doc.data() : null);
  });
};
