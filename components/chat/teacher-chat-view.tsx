"use client";

import { useState, useEffect } from "react";
import { useChat, User } from "@/lib/chat-context";
import { getStudentsInClassroom, getMessages, sendMessage, Message } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Users, MessageCircle } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils";

export function TeacherChatView() {
  const { currentUser } = useChat();
  
  // State管理
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);
  const [publicMessages, setPublicMessages] = useState<Message[]>([]);
  const [newPrivateMessage, setNewPrivateMessage] = useState("");
  const [newPublicMessage, setNewPublicMessage] = useState("");

  // 1. クラスの生徒一覧を取得
  useEffect(() => {
    if (currentUser?.classroomId) {
      getStudentsInClassroom(currentUser.classroomId).then(setStudents);
    }
  }, [currentUser]);

  // 2. 最初に表示する生徒を選択
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

  // 3. 選択された生徒とのメッセージをリアルタイムで取得
  useEffect(() => {
    if (selectedStudent && currentUser?.classroomId) {
      const smallRoomId = `small_room_with_${selectedStudent.id}`;
      const unsubscribe = getMessages(currentUser.classroomId, smallRoomId, setPrivateMessages);
      return () => unsubscribe();
    }
  }, [selectedStudent, currentUser?.classroomId]);

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
    if (newPrivateMessage.trim() && currentUser && selectedStudent) {
      const smallRoomId = `small_room_with_${selectedStudent.id}`;
      sendMessage(currentUser.classroomId, smallRoomId, newPrivateMessage, currentUser.id);
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
      {/* Student List (Left Panel) */}
      <div className="w-1/4 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg">生徒一覧 (クラス {currentUser.classroomId})</h2>
        </div>
        <ScrollArea>
          {students.map((student) => (
            <div
              key={student.id}
              className={cn(
                "p-4 cursor-pointer border-b border-border hover:bg-muted",
                selectedStudent?.id === student.id && "bg-muted"
              )}
              onClick={() => setSelectedStudent(student)}
            >
              <p className="font-semibold">{student.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {/* TODO: 最後のメッセージを表示 */}
              </p>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area (Right Panel) */}
      <div className="flex-1 flex">
        {/* Private Chat (Middle Panel) */}
        <div className="flex-1 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">{selectedStudent ? `${selectedStudent.name}さんとのチャット` : "生徒を選択してください"}</h2>
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
                  senderName={msg.senderId === currentUser.id ? "自分" : selectedStudent?.name || "生徒"}
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
                disabled={!selectedStudent}
              />
              <Button onClick={handleSendPrivateMessage} disabled={!selectedStudent}>
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