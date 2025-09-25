"use client"

import type React from "react"
import { createContext, useContext, useCallback, useEffect, useReducer } from "react"
import type { ChatState, ChatActions, User, Message, Student, StampType } from "./types"
import { ChatStorage } from "./storage"

type ChatContextType = ChatState & ChatActions

type ChatAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CURRENT_USER"; payload: User }
  | { type: "SET_STUDENTS"; payload: Student[] }
  | { type: "SET_PRIVATE_ROOMS"; payload: Record<string, Message[]> }
  | { type: "SET_PUBLIC_MESSAGES"; payload: Message[] }
  | { type: "SET_SELECTED_STUDENT"; payload: Student | null }
  | { type: "ADD_PRIVATE_MESSAGE"; payload: { studentId: string; message: Message } }
  | { type: "ADD_PUBLIC_MESSAGE"; payload: Message }
  | { type: "UPDATE_STUDENT"; payload: { studentId: string; updates: Partial<Student> } }
  | { type: "ADD_STAMP"; payload: { messageId: string; stampType: StampType } }

const initialState: ChatState = {
  currentUser: null,
  students: [],
  privateRooms: {},
  publicMessages: [],
  selectedStudent: null,
  isLoading: false,
  error: null,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "SET_ERROR":
      return { ...state, error: action.payload }

    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload }

    case "SET_STUDENTS":
      return { ...state, students: action.payload }

    case "SET_PRIVATE_ROOMS":
      return { ...state, privateRooms: action.payload }

    case "SET_PUBLIC_MESSAGES":
      return { ...state, publicMessages: action.payload }

    case "SET_SELECTED_STUDENT":
      return { ...state, selectedStudent: action.payload }

    case "ADD_PRIVATE_MESSAGE":
      const { studentId, message } = action.payload
      return {
        ...state,
        privateRooms: {
          ...state.privateRooms,
          [studentId]: [...(state.privateRooms[studentId] || []), message],
        },
      }

    case "ADD_PUBLIC_MESSAGE":
      return {
        ...state,
        publicMessages: [...state.publicMessages, action.payload],
      }

    case "UPDATE_STUDENT":
      return {
        ...state,
        students: state.students.map((student) =>
          student.id === action.payload.studentId ? { ...student, ...action.payload.updates } : student,
        ),
      }

    case "ADD_STAMP":
      return {
        ...state,
        publicMessages: state.publicMessages.map((message) => {
          if (message.id === action.payload.messageId) {
            const stamps = message.stamps || []
            const existingStamp = stamps.find((s) => s.type === action.payload.stampType)

            if (existingStamp) {
              return {
                ...message,
                stamps: stamps.map((s) => (s.type === action.payload.stampType ? { ...s, count: s.count + 1 } : s)),
              }
            } else {
              return {
                ...message,
                stamps: [...stamps, { type: action.payload.stampType, count: 1 }],
              }
            }
          }
          return message
        }),
      }

    default:
      return state
  }
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Sample data
const sampleStudents: Student[] = [
  {
    id: "s1",
    name: "田中太郎",
    lastMessage: "数学の宿題について質問があります",
    lastMessageTime: new Date(Date.now() - 3000000),
    unreadCount: 1,
  },
  {
    id: "s2",
    name: "佐藤花子",
    lastMessage: "ありがとうございました！",
    lastMessageTime: new Date(Date.now() - 7200000),
    unreadCount: 0,
  },
  {
    id: "s3",
    name: "鈴木一郎",
    lastMessage: "明日の授業について",
    lastMessageTime: new Date(Date.now() - 10800000),
    unreadCount: 2,
  },
  {
    id: "s4",
    name: "高橋美咲",
    lastMessage: "",
    lastMessageTime: undefined,
    unreadCount: 0,
  },
]

const samplePrivateRooms: Record<string, Message[]> = {
  s1: [
    {
      id: "1",
      content: "こんにちは！何か質問はありますか？",
      sender: "teacher",
      timestamp: new Date(Date.now() - 3600000),
      studentId: "s1",
    },
    {
      id: "2",
      content: "数学の宿題について質問があります",
      sender: "student",
      timestamp: new Date(Date.now() - 3000000),
      studentId: "s1",
    },
  ],
  s2: [
    {
      id: "3",
      content: "お疲れ様でした！",
      sender: "teacher",
      timestamp: new Date(Date.now() - 7200000),
      studentId: "s2",
    },
    {
      id: "4",
      content: "ありがとうございました！",
      sender: "student",
      timestamp: new Date(Date.now() - 7200000),
      studentId: "s2",
    },
  ],
  s3: [
    {
      id: "5",
      content: "明日の授業について",
      sender: "student",
      timestamp: new Date(Date.now() - 10800000),
      studentId: "s3",
    },
  ],
  s4: [],
}

const samplePublicMessages: Message[] = [
  {
    id: "p1",
    content: "明日の授業は体育館で行います。体操服を忘れずに持参してください。",
    sender: "teacher",
    timestamp: new Date(Date.now() - 7200000),
    stamps: [
      { type: "わかった", count: 12 },
      { type: "いいね", count: 8 },
    ],
  },
  {
    id: "p2",
    content: "来週の中間テストの範囲を配布しました。しっかり準備しましょう！",
    sender: "teacher",
    timestamp: new Date(Date.now() - 1800000),
    stamps: [
      { type: "理解", count: 15 },
      { type: "すごい", count: 3 },
    ],
  },
]

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  useEffect(() => {
    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const storedStudents = ChatStorage.loadStudents()
      const storedPrivateRooms = ChatStorage.loadPrivateRooms()
      const storedPublicMessages = ChatStorage.loadPublicMessages()

      dispatch({
        type: "SET_STUDENTS",
        payload: storedStudents.length > 0 ? storedStudents : sampleStudents,
      })
      dispatch({
        type: "SET_PRIVATE_ROOMS",
        payload: Object.keys(storedPrivateRooms).length > 0 ? storedPrivateRooms : samplePrivateRooms,
      })
      dispatch({
        type: "SET_PUBLIC_MESSAGES",
        payload: storedPublicMessages.length > 0 ? storedPublicMessages : samplePublicMessages,
      })
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "データの読み込みに失敗しました" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [])

  useEffect(() => {
    if (state.students.length > 0) {
      ChatStorage.saveStudents(state.students)
    }
  }, [state.students])

  useEffect(() => {
    if (Object.keys(state.privateRooms).length > 0) {
      ChatStorage.savePrivateRooms(state.privateRooms)
    }
  }, [state.privateRooms])

  useEffect(() => {
    if (state.publicMessages.length > 0) {
      ChatStorage.savePublicMessages(state.publicMessages)
    }
  }, [state.publicMessages])

  const setCurrentUser = useCallback((user: User) => {
    dispatch({ type: "SET_CURRENT_USER", payload: user })
  }, [])

  const sendPrivateMessage = useCallback(
    async (studentId: string, content: string) => {
      if (!state.currentUser || !content.trim()) return

      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })

      try {
        const message: Message = {
          id: Date.now().toString(),
          content: content.trim(),
          sender: state.currentUser.role,
          timestamp: new Date(),
          studentId,
        }

        dispatch({ type: "ADD_PRIVATE_MESSAGE", payload: { studentId, message } })

        // Update student's last message info
        dispatch({
          type: "UPDATE_STUDENT",
          payload: {
            studentId,
            updates: {
              lastMessage: content.trim(),
              lastMessageTime: new Date(),
              unreadCount:
                state.currentUser.role === "student"
                  ? 0
                  : (state.students.find((s) => s.id === studentId)?.unreadCount || 0) + 1,
            },
          },
        })

        // Simulate teacher response for demo purposes
        if (state.currentUser.role === "student") {
          setTimeout(() => {
            const teacherResponse: Message = {
              id: (Date.now() + 1).toString(),
              content: "メッセージを受け取りました。詳しく教えてください。",
              sender: "teacher",
              timestamp: new Date(),
              studentId,
            }

            dispatch({ type: "ADD_PRIVATE_MESSAGE", payload: { studentId, message: teacherResponse } })
          }, 2000)
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "メッセージの送信に失敗しました" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [state.currentUser, state.students],
  )

  const sendPublicMessage = useCallback(
    async (content: string) => {
      if (!state.currentUser || !content.trim() || state.currentUser.role !== "teacher") return

      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })

      try {
        const message: Message = {
          id: Date.now().toString(),
          content: content.trim(),
          sender: "teacher",
          timestamp: new Date(),
          stamps: [],
        }

        dispatch({ type: "ADD_PUBLIC_MESSAGE", payload: message })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "メッセージの送信に失敗しました" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [state.currentUser],
  )

  const addStamp = useCallback(
    (messageId: string, stampType: StampType) => {
      if (!state.currentUser) return

      dispatch({ type: "ADD_STAMP", payload: { messageId, stampType } })
    },
    [state.currentUser],
  )

  const selectStudent = useCallback(
    (student: Student) => {
      dispatch({ type: "SET_SELECTED_STUDENT", payload: student })
      // Mark messages as read when selecting a student
      if (state.currentUser?.role === "teacher") {
        markAsRead(student.id)
      }
    },
    [state.currentUser],
  )

  const markAsRead = useCallback((studentId: string) => {
    dispatch({
      type: "UPDATE_STUDENT",
      payload: { studentId, updates: { unreadCount: 0 } },
    })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null })
  }, [])

  // Initialize selected student for teachers
  useEffect(() => {
    if (state.currentUser?.role === "teacher" && !state.selectedStudent && state.students.length > 0) {
      dispatch({ type: "SET_SELECTED_STUDENT", payload: state.students[0] })
    }
  }, [state.currentUser, state.selectedStudent, state.students])

  const value: ChatContextType = {
    ...state,
    setCurrentUser,
    sendPrivateMessage,
    sendPublicMessage,
    addStamp,
    selectStudent,
    markAsRead,
    clearError,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
