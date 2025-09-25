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

export default function ChatPage() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") as Role
  const classroom = searchParams.get("classroom") as Classroom
  const { currentUser, setCurrentUser } = useChat()

  useEffect(() => {
    if (role && classroom && !currentUser) {
      // Set current user based on URL params
      const userId = role === "teacher" ? "teacher1" : "student1"
      const userName = role === "teacher" ? "先生" : "生徒"

      setCurrentUser({
        id: userId,
        name: userName,
        role,
        classroomId: classroom,
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

  if (role === "teacher") {
    return <TeacherChatView />
  } else {
    return <StudentChatView />
  }
}
