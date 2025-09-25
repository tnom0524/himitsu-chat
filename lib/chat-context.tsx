"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// ユーザーの型定義
export interface User {
  id: string;
  name: string;
  role: "student" | "teacher";
  classroomId: "A" | "B" | "C";
}

// Contextが提供する値の型定義
interface ChatContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

// Contextを作成
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// アプリ全体にContextを提供するためのProviderコンポーネント
export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const value = {
    currentUser,
    setCurrentUser,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// 各コンポーネントから簡単にContextを呼び出すためのカスタムフック
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}