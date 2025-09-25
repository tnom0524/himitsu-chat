"use client";

import { useState, useEffect } from "react";
import { useChat } from "@/lib/chat-context";
import { getPrivateRooms, getMessages, sendMessage, Message, PrivateRoomInfo } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils";

export function TeacherChatView() {
  const { currentUser } = useChat();
  
  // State管理
  const [privateRooms, setPrivateRooms] = useState<PrivateRoomInfo[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);
  const [publicMessages, setPublicMessages] = useState<Message[]>([]);
  
  const [newPrivateMessage, setNewPrivateMessage] = useState("");
  const [newPublicMessage, setNewPublicMessage] = useState("");

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
      setPrivateMessages([]); // 部屋が選択されていない場合はメッセージを空にする
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

  if (!currentUser) return <div>読み込み中...</div>;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Student/Room List (Left Panel) */}
      <div className="w-1/4 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg">生徒とのチャット (クラス {currentUser.classroomId})</h2>
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
              {/* 匿名なので、生徒IDを短くして表示 */}
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
          <ScrollArea className="flex-1 p-4">
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

        {/* Public Chat (Rightmost Panel) */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">大部屋（クラス全体）</h2>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {publicMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={{
                    id: msg.id,
                    content: msg.text,
                    sender: 'teacher',
                    timestamp: msg.createdAt.toDate(),
                  }}
                  currentUserRole="teacher"
                  isOwnMessage={true}
                  senderName="自分（先生）"
                />
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
      </div>
    </div>
  );
}