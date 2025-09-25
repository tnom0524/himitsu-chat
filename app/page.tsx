"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getStudentId } from "@/lib/auth"
import { getClassroom, joinAsTeacher } from "@/lib/chat" // 👈 データベース操作関数をインポート
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, MessageCircle } from "lucide-react"

type Role = "student" | "teacher" | null
type Classroom = "A" | "B" | "C" | null

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false) // 👈 ローディング状態を追加
  const router = useRouter()

  // ▼▼▼ クラスルームに入る処理を、データベースと連携するように大幅に修正 ▼▼▼
  const handleEnterClassroom = async () => {
    if (!selectedRole || !selectedClassroom) return

    setIsLoading(true)
    setError(null)

    try {
      const classroomData = await getClassroom(selectedClassroom)
      const teacherExists = classroomData && classroomData.teacherId

      let userId = ""

      if (selectedRole === "teacher") {
        if (teacherExists) {
          setError("このクラスには既に他の先生がいます。")
          setIsLoading(false)
          return
        }
        // 先生として入室し、データベースを更新
        userId = `teacher_for_${selectedClassroom}`
        await joinAsTeacher(selectedClassroom, userId)
      } else { // role is student
        if (!teacherExists) {
          setError("このクラスにはまだ先生がいません。")
          setIsLoading(false)
          return
        }
        userId = getStudentId()
      }

      router.push(`/chat?role=${selectedRole}&classroom=${selectedClassroom}&id=${userId}`)

    } catch (e) {
      console.error("入室処理エラー:", e)
      setError("エラーが発生しました。時間をおいて再度お試しください。")
      setIsLoading(false)
    }
  }
  // ▲▲▲

  const temporaryMemberCount = 28

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-balance">クラスルーム チャット</h1>
          </div>
          <p className="text-muted-foreground text-lg text-pretty">学習をサポートするコミュニケーションツール</p>
        </div>

        {/* Classroom Selection */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              クラスルームを選択
            </CardTitle>
            <CardDescription>参加するクラスルームを選んでください</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(["A", "B", "C"] as const).map((classroom) => (
                <Button
                  key={classroom}
                  variant={selectedClassroom === classroom ? "default" : "outline"}
                  className="h-20 flex flex-col gap-2 text-lg font-semibold"
                  onClick={() => setSelectedClassroom(classroom)}
                >
                  <div className="text-2xl">クラス {classroom}</div>
                  <Badge variant="secondary" className="text-xs">
                    {/* TODO: 将来的にFirebaseから取得する */}
                    - 名
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Selection */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-accent" />
              ロールを選択
            </CardTitle>
            <CardDescription>あなたの役割を選んでください</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={selectedRole === "student" ? "default" : "outline"}
                className="h-16 flex flex-col gap-2"
                onClick={() => setSelectedRole("student")}
              >
                <Users className="h-6 w-6" />
                <span className="font-semibold">生徒</span>
              </Button>
              <Button
                variant={selectedRole === "teacher" ? "default" : "outline"}
                className="h-16 flex flex-col gap-2"
                onClick={() => setSelectedRole("teacher")}
              >
                <GraduationCap className="h-6 w-6" />
                <span className="font-semibold">教師</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enter Button */}
        <div className="text-center space-y-4">
          {error && <p className="font-semibold text-red-500">{error}</p>}
          <Button
            size="lg"
            className="px-12 py-6 text-lg font-semibold"
            disabled={!selectedRole || !selectedClassroom || isLoading}
            onClick={handleEnterClassroom}
          >
            {isLoading ? "入室処理中..." : "クラスルームに入る"}
          </Button>
        </div>

        {/* Selection Summary */}
        {(selectedRole || selectedClassroom) && (
          <Card className="bg-muted/30 border-border/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                {selectedClassroom && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>クラス {selectedClassroom}</span>
                  </div>
                )}
                {selectedRole && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{selectedRole === "student" ? "生徒" : "教師"}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}