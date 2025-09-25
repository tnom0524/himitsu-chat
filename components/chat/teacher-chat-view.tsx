"use client"

import { useState } from "react"
import { useChat } from "@/lib/chat-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageBubble } from "./message-bubble"
import { STAMP_TYPES } from "./stamp-selector"
import { ArrowLeft, Send, Users, MessageCircle, GraduationCap, MessageSquare } from "lucide-react"

export function TeacherChatView() {
  const {
    currentUser,
    students,
    privateRooms,
    publicMessages,
    selectedStudent,
    sendPrivateMessage,
    sendPublicMessage,
    selectStudent,
  } = useChat()

  const [newPrivateMessage, setNewPrivateMessage] = useState("")
  const [newPublicMessage, setNewPublicMessage] = useState("")

  if (!currentUser) return null

  const currentMessages = selectedStudent ? privateRooms[selectedStudent.id] || [] : []

  const handleSendPrivateMessage = () => {
    if (newPrivateMessage.trim() && selectedStudent) {
      sendPrivateMessage(selectedStudent.id, newPrivateMessage)
      setNewPrivateMessage("")
    }
  }

  const handleSendPublicMessage = () => {
    if (newPublicMessage.trim()) {
      sendPublicMessage(newPublicMessage)
      setNewPublicMessage("")
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">クラス {currentUser.classroom}</h1>
                <p className="text-sm text-muted-foreground">教師として参加中</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            教師
          </Badge>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Student List (Left Sidebar) */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">小部屋一覧</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">生徒との個人チャット</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedStudent?.id === student.id ? "bg-muted" : ""
                  }`}
                  onClick={() => selectStudent(student)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{student.name}</p>
                        {student.lastMessageTime && (
                          <span className="text-xs text-muted-foreground">{formatDate(student.lastMessageTime)}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {student.lastMessage || "メッセージなし"}
                      </p>
                    </div>
                    {student.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                        {student.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedStudent ? (
            <>
              {/* Private Chat Header */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedStudent.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedStudent.name}</h3>
                    <p className="text-sm text-muted-foreground">個人チャット</p>
                  </div>
                </div>
              </div>

              {/* Private Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {currentMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      currentUserRole="teacher"
                      isOwnMessage={message.sender === "teacher"}
                      senderName={message.sender === "teacher" ? "あなた" : selectedStudent.name}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Private Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder={`${selectedStudent.name}にメッセージを送る...`}
                    value={newPrivateMessage}
                    onChange={(e) => setNewPrivateMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendPrivateMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendPrivateMessage} disabled={!newPrivateMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">生徒を選択してチャットを開始</p>
              </div>
            </div>
          )}
        </div>

        {/* Public Room (Right Panel) */}
        <div className="w-96 border-l border-border flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">大部屋（クラス全体）</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">全体へのお知らせ</p>
          </div>

          {/* Public Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {publicMessages.map((message) => (
                <div key={message.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/10 rounded-full">
                      <GraduationCap className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">あなた</span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">{message.content}</div>
                    </div>
                  </div>

                  {/* Stamps Display */}
                  {message.stamps && message.stamps.length > 0 && (
                    <div className="ml-11 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {message.stamps.map((stamp) => {
                          const stampType = STAMP_TYPES.find((s) => s.label === stamp.type)
                          if (!stampType) return null
                          const StampIcon = stampType.icon

                          return (
                            <div
                              key={stamp.type}
                              className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1"
                            >
                              <StampIcon className={`h-3 w-3 ${stampType.color}`} />
                              <span className="text-xs">{stamp.type}</span>
                              <Badge variant="secondary" className="h-4 px-1 text-xs">
                                {stamp.count}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Public Message Input */}
          <div className="p-4 border-t border-border">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="クラス全体にお知らせを送る..."
                  value={newPublicMessage}
                  onChange={(e) => setNewPublicMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendPublicMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendPublicMessage} disabled={!newPublicMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">生徒はスタンプで反応できます</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
