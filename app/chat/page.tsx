"use client"

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"
import { useChat } from "@/lib/chat-context"
import { StudentChatView } from "@/components/chat/student-chat-view"
import { TeacherChatView } from "@/components/chat/teacher-chat-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";

type Role = "student" | "teacher"
type Classroom = "A" | "B" | "C"

// ▼▼▼ テスト用のメッセージの型を定義 ▼▼▼
interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
}
// ▲▲▲ ここまで追加 ▲▲▲

export default function ChatPage() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") as Role
  const classroom = searchParams.get("classroom") as Classroom
  const { currentUser, setCurrentUser } = useChat()

    // ▼▼▼ Firestoreから読み込んだデータを保持するstateを追加 ▼▼▼
  const [messages, setMessages] = useState<Message[]>([]);
  // ▲▲▲ ここまで追加 ▲▲▲

  // ▼▼▼ Firestoreへの書き込みテスト用関数を追加 ▼▼▼
  const addTestData = async () => {
    try {
      const docRef = await addDoc(collection(db, "testMessages"), {
        text: "Hello, Firestore! " + new Date().toLocaleTimeString(),
        createdAt: Timestamp.now(),
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };
  // ▲▲▲ ここまで追加 ▲▲▲

  // ▼▼▼ Firestoreからのリアルタイム読み込みテスト用useEffectを追加 ▼▼▼
  useEffect(() => {
    // 'testMessages'コレクションへの参照を作成し、createdAtで並び替えるクエリを作成
    const q = query(collection(db, "testMessages"), orderBy("createdAt", "desc"));

    // onSnapshotでリアルタイムの変更を監視
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(newMessages);
    });

    // コンポーネントがアンマウントされる時に監視を解除
    return () => unsubscribe();
  }, []); // 空の配列を渡すことで、コンポーネントのマウント時に一度だけ実行
  // ▲▲▲ ここまで追加 ▲▲▲


  useEffect(() => {
    if (role && classroom && !currentUser) {
      // Set current user based on URL params
      const userId = role === "teacher" ? "teacher1" : "student1"
      const userName = role === "teacher" ? "先生" : "生徒"

      setCurrentUser({
        id: userId,
        name: userName,
        role,
        classroom,
      })
    }
  }, [role, classroom, currentUser, setCurrentUser])

  if (!role || !classroom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">無効なアクセスです。</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/")}>
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

//   if (role === "teacher") {
//     return <TeacherChatView />
//   } else {
//     return <StudentChatView />
//   }
return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firestore 接続テスト</h1>
      
      <Button onClick={addTestData}>
        テストデータを書き込む
      </Button>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">リアルタイムデータ:</h2>
        <div className="mt-4 p-4 border rounded-md min-h-[200px]">
          {messages.map((msg) => (
            <div key={msg.id}>{msg.text}</div>
          ))}
          {messages.length === 0 && <p>まだデータがありません。</p>}
        </div>
      </div>
    </div>
  )
}
