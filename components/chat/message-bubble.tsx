"use client"

import { GraduationCap, User } from "lucide-react"
import type { Message, UserRole } from "@/lib/types"

interface MessageBubbleProps {
  message: Message
  currentUserRole: UserRole
  isOwnMessage: boolean
  showAvatar?: boolean
  senderName?: string
}

export function MessageBubble({
  message,
  currentUserRole,
  isOwnMessage,
  showAvatar = true,
  senderName,
}: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isOwnMessage ? "order-2" : "order-1"}`}>
        <div className="flex items-center gap-2 mb-1">
          {!isOwnMessage && showAvatar && (
            <>
              {message.sender === "teacher" ? (
                <GraduationCap className="h-3 w-3 text-accent" />
              ) : (
                <User className="h-3 w-3 text-primary" />
              )}
            </>
          )}
          <span className="text-xs text-muted-foreground">
            {isOwnMessage ? "あなた" : senderName || (message.sender === "teacher" ? "先生" : "生徒")}
          </span>
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
        </div>
        <div
          className={`p-3 rounded-lg ${
            isOwnMessage
              ? currentUserRole === "teacher"
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}
