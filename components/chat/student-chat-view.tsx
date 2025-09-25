"use client"

import { useState } from "react"
import { useChat } from "@/lib/chat-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageBubble } from "./message-bubble"
import { StampSelector } from "./stamp-selector"
import { ArrowLeft, Send, Users, MessageCircle, User, GraduationCap } from "lucide-react"

export function StudentChatView() {
  const { currentUser, privateRooms, publicMessages, sendPrivateMessage, addStamp } = useChat()
  const [newPrivateMessage, setNewPrivateMessage] = useState("")

  if (!currentUser) return null

  const studentMessages = privateRooms[currentUser.id] || []

  const handleSendPrivateMessage = () => {
    if (newPrivateMessage.trim()) {
      sendPrivateMessage(currentUser.id, newPrivateMessage)
      setNewPrivateMessage("")
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
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">クラス {currentUser.classroom}</h1>
                <p className="text-sm text-muted-foreground">生徒として参加中</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            生徒
          </Badge>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Private Room (Left Half) */}
        <div className="flex-1 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">小部屋（先生との個人チャット）</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">先生に直接質問できます</p>
          </div>

          {/* Private Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {studentMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserRole="student"
                  isOwnMessage={message.sender === "student"}
                  senderName={message.sender === "teacher" ? "先生" : "あなた"}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Private Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="先生にメッセージを送る..."
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
        </div>

        {/* Public Room (Right Half) */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">大部屋（クラス全体）</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">先生からのお知らせ・スタンプで反応できます</p>
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
                        <span className="font-medium text-sm">先生</span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">{message.content}</div>
                    </div>
                  </div>

                  {/* Stamps */}
                  <div className="ml-11 space-y-3">
                    <StampSelector messageId={message.id} stamps={message.stamps} onStamp={addStamp} />
                  </div>

                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
