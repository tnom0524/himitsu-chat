"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, MessageCircle } from "lucide-react"

type Role = "student" | "teacher" | null
type Classroom = "A" | "B" | "C" | null

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom>(null)

  const handleEnterClassroom = () => {
    if (selectedRole && selectedClassroom) {
      // Navigate to chat interface
      window.location.href = `/chat?role=${selectedRole}&classroom=${selectedClassroom}`
    }
  }
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
                    {/* {Math.floor(Math.random() * 20) + 15}名 */}
                    {temporaryMemberCount}名
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
        <div className="flex justify-center">
          <Button
            size="lg"
            className="px-12 py-6 text-lg font-semibold"
            disabled={!selectedRole || !selectedClassroom}
            onClick={handleEnterClassroom}
          >
            クラスルームに入る
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
  )
}
