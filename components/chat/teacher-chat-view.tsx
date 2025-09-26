"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/lib/chat-context";
import { getPrivateRooms, getMessages, sendMessage, leaveAsTeacher, Message, PrivateRoomInfo } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, LogOut, Users, MessageCircle } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { GraduationCap } from "lucide-react";

export function TeacherChatView() {
  const { currentUser } = useChat();
  const router = useRouter();
  
  const [privateRooms, setPrivateRooms] = useState<PrivateRoomInfo[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);
  const [publicMessages, setPublicMessages] = useState<Message[]>([]);
  
  const [newPrivateMessage, setNewPrivateMessage] = useState("");
  const [newPublicMessage, setNewPublicMessage] = useState("");

  const privateScrollAreaRef = useRef<HTMLDivElement>(null);
  const publicScrollAreaRef = useRef<HTMLDivElement>(null);

  // 1. クラスの小部屋一覧をリアルタイムで取得
  useEffect(() => {
    if (currentUser?.classroomId) {
      const unsubscribe = getPrivateRooms(currentUser.classroomId, setPrivateRooms);
      return () => unsubscribe();
    }
  }, [currentUser]);

  // 2. 最初に表示する小部屋を選択
  useEffect(() => {
    if (privateRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(privateRooms[0].id);
    }
  }, [privateRooms, selectedRoomId]);

  // 3. 選択された小部屋のメッセージをリアルタイムで取得
  useEffect(() => {
    if (selectedRoomId && currentUser?.classroomId) {
      const unsubscribe = getMessages(currentUser.classroomId, selectedRoomId, setPrivateMessages);
      return () => unsubscribe();
    } else {
      setPrivateMessages([]);
    }
  }, [selectedRoomId, currentUser?.classroomId]);

  // 4. 大部屋のメッセージをリアルタイムで取得
  useEffect(() => {
    if (currentUser?.classroomId) {
      const largeRoomId = "large_room";
      const unsubscribe = getMessages(currentUser.classroomId, largeRoomId, setPublicMessages);
      return () => unsubscribe();
    }
  }, [currentUser?.classroomId]);

  // メッセージ送信処理
  const handleSendPrivateMessage = () => {
    if (newPrivateMessage.trim() && currentUser && selectedRoomId) {
      sendMessage(currentUser.classroomId, selectedRoomId, newPrivateMessage, currentUser.id);
      setNewPrivateMessage("");
    }
  };

  const handleSendPublicMessage = () => {
    if (newPublicMessage.trim() && currentUser) {
      const largeRoomId = "large_room";
      sendMessage(currentUser.classroomId, largeRoomId, newPublicMessage, currentUser.id);
      setNewPublicMessage("");
    }
  };

  const handleLeaveRoom = async () => {
    if (currentUser) {
      await leaveAsTeacher(currentUser.classroomId);
      router.push("/");
    }
  };
  
  // 自動スクロール処理
  useEffect(() => {
    if (privateScrollAreaRef.current) {
      privateScrollAreaRef.current.scrollTo({ top: privateScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [privateMessages]);

  useEffect(() => {
    if (publicScrollAreaRef.current) {
      publicScrollAreaRef.current.scrollTo({ top: publicScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [publicMessages]);

  if (!currentUser) return <div>読み込み中...</div>;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Student/Room List (Left Panel) */}
      <div className="w-1/4 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold text-lg">生徒とのチャット</h2>
          <Button variant="ghost" size="icon" onClick={handleLeaveRoom} title="クラスルームから退出する">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <ScrollArea>
          {privateRooms.map((room) => (
            <div
              key={room.id}
              className={cn(
                "p-4 cursor-pointer border-b border-border hover:bg-muted",
                selectedRoomId === room.id && "bg-muted"
              )}
              onClick={() => setSelectedRoomId(room.id)}
            >
              <p className="font-semibold">生徒 {room.studentId.substring(0, 8)}</p>
            </div>
          ))}
          {privateRooms.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">まだ生徒からのメッセージはありません。</p>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area (Right Panel) */}
      <div className="flex-1 flex">
        {/* Private Chat (Middle Panel) */}
        <div className="flex-1 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">{selectedRoomId ? `生徒 ${selectedRoomId.substring(0, 8)} とのチャット` : "生徒を選択してください"}</h2>
          </div>
          <ScrollArea className="flex-1 p-4" ref={privateScrollAreaRef}>
            <div className="space-y-4">
              {privateMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={{
                    id: msg.id,
                    content: msg.text,
                    sender: msg.senderId === currentUser.id ? 'teacher' : 'student',
                    timestamp: msg.createdAt.toDate(),
                  }}
                  currentUserRole="teacher"
                  isOwnMessage={msg.senderId === currentUser.id}
                  senderName={msg.senderId === currentUser.id ? "自分" : `生徒 ${selectedRoomId?.substring(0, 8)}`}
                />
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="メッセージを入力..."
                value={newPrivateMessage}
                onChange={(e) => setNewPrivateMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendPrivateMessage()}
                disabled={!selectedRoomId}
              />
              <Button onClick={handleSendPrivateMessage} disabled={!selectedRoomId}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ▼▼▼ Public Chat (Rightmost Panel) - この中身を完全なものに修正 ▼▼▼ */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">大部屋（クラス全体）</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">クラス全体にお知らせを送信します</p>
          </div>
          <ScrollArea className="flex-1 p-4" ref={publicScrollAreaRef}>
            <div className="space-y-6">
              {publicMessages.map((message) => (
                <div key={message.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/10 rounded-full">
                      <GraduationCap className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">先生（あなた）</span>
                        <span className="text-xs text-muted-foreground">
                          {message.createdAt.toDate().toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">{message.text}</div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="全体にメッセージを送信..."
                value={newPublicMessage}
                onChange={(e) => setNewPublicMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendPublicMessage()}
              />
              <Button onClick={handleSendPublicMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* ▲▲▲ */}
      </div>
    </div>
  );
}