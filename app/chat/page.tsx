"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { User } from "@/lib/chat-context"
import { StudentChatView } from "@/components/chat/student-chat-view"
import { TeacherChatView } from "@/components/chat/teacher-chat-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { setUserOnline } from "@/lib/presence";

type Role = "student" | "teacher"
type Classroom = "A" | "B" | "C"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // currentUserが既に設定されている場合は、このeffectを再実行しないためのガード
    if (currentUser) {
      return;
    }

    const role = searchParams.get("role") as Role | null;
    const classroom = searchParams.get("classroom") as Classroom | null;
    const userId = searchParams.get("id");

    if (role && classroom && userId) {
      // Contextにユーザー情報を設定
      setCurrentUser({
        id: userId,
        role,
        classroomId: classroom,
      });
      // 在室管理システムを起動
      setUserOnline(classroom, role, userId);
    }
  }, [searchParams, currentUser, setCurrentUser]);

  // ▼▼▼ URLパラメータが不足している場合のエラー表示 ▼▼▼
  const role = searchParams.get("role")
  const classroom = searchParams.get("classroom")
  const userId = searchParams.get("id")

  if (!role || !classroom || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">無効なアクセスです。情報が不足しています。</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/")}>
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  // ▲▲▲

  // ユーザー情報がContextに設定されるまでのローディング表示
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // ユーザーの役割に応じて、表示するコンポーネントを切り替える
  if (currentUser.role === "teacher") {
    return <TeacherChatView currentUser={currentUser} />
  } else {
    return <StudentChatView currentUser={currentUser} />
  }
}
