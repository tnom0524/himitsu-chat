export type UserRole = "student" | "teacher"
export type ClassroomId = "A" | "B" | "C"
export type StampType = "いいね" | "わかった" | "すごい" | "理解"

export interface Message {
  id: string
  content: string
  sender: UserRole
  timestamp: Date
  stamps?: Stamp[]
  studentId?: string
}

export interface Stamp {
  type: StampType
  count: number
}

export interface Student {
  id: string
  name: string
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount: number
}

export interface User {
  id: string
  name: string
  role: UserRole
  classroom: ClassroomId
}

export interface ChatState {
  currentUser: User | null
  students: Student[]
  privateRooms: Record<string, Message[]>
  publicMessages: Message[]
  selectedStudent: Student | null
  isLoading: boolean
  error: string | null
}

export interface ChatActions {
  setCurrentUser: (user: User) => void
  sendPrivateMessage: (studentId: string, content: string) => Promise<void>
  sendPublicMessage: (content: string) => Promise<void>
  addStamp: (messageId: string, stampType: StampType) => void
  selectStudent: (student: Student) => void
  markAsRead: (studentId: string) => void
  clearError: () => void
}
