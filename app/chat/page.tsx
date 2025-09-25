"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useChat } from "@/lib/chat-context"
import { StudentChatView } from "@/components/chat/student-chat-view"
import { TeacherChatView } from "@/components/chat/teacher-chat-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Role = "student" | "teacher"
type Classroom = "A" | "B" | "C"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const { currentUser, setCurrentUser } = useChat()

  // ▼▼▼ URLパラメータからユーザー情報を取得し、Contextに設定する処理 ▼▼▼
  useEffect(() => {
    const role = searchParams.get("role") as Role | null
    const classroom = searchParams.get("classroom") as Classroom | null
    const userId = searchParams.get("id") // 匿名IDを取得

    // 必要な情報が揃っており、かつユーザーがまだ設定されていない場合のみ実行
    if (role && classroom && userId && !currentUser) {
      setCurrentUser({
        id: userId,
        // nameプロパティは不要になったので削除
        role,
        classroomId: classroom, // 正しいプロパティ名に設定
      })
    }
  }, [searchParams, currentUser, setCurrentUser]) // 依存配列
  // ▲▲▲

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
    return <TeacherChatView />
  } else {
    return <StudentChatView />
  }
}