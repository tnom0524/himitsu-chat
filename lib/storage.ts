import type { Message, Student } from "./types"

const STORAGE_KEYS = {
  PRIVATE_ROOMS: "chat_private_rooms",
  PUBLIC_MESSAGES: "chat_public_messages",
  STUDENTS: "chat_students",
  CURRENT_USER: "chat_current_user",
} as const

export class ChatStorage {
  static savePrivateRooms(rooms: Record<string, Message[]>): void {
    try {
      const serializedRooms = JSON.stringify(rooms, (key, value) => {
        if (key === "timestamp" && value instanceof Date) {
          return value.toISOString()
        }
        return value
      })
      localStorage.setItem(STORAGE_KEYS.PRIVATE_ROOMS, serializedRooms)
    } catch (error) {
      console.error("Failed to save private rooms:", error)
    }
  }

  static loadPrivateRooms(): Record<string, Message[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRIVATE_ROOMS)
      if (!stored) return {}

      return JSON.parse(stored, (key, value) => {
        if (key === "timestamp" && typeof value === "string") {
          return new Date(value)
        }
        return value
      })
    } catch (error) {
      console.error("Failed to load private rooms:", error)
      return {}
    }
  }

  static savePublicMessages(messages: Message[]): void {
    try {
      const serializedMessages = JSON.stringify(messages, (key, value) => {
        if (key === "timestamp" && value instanceof Date) {
          return value.toISOString()
        }
        return value
      })
      localStorage.setItem(STORAGE_KEYS.PUBLIC_MESSAGES, serializedMessages)
    } catch (error) {
      console.error("Failed to save public messages:", error)
    }
  }

  static loadPublicMessages(): Message[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PUBLIC_MESSAGES)
      if (!stored) return []

      return JSON.parse(stored, (key, value) => {
        if (key === "timestamp" && typeof value === "string") {
          return new Date(value)
        }
        return value
      })
    } catch (error) {
      console.error("Failed to load public messages:", error)
      return []
    }
  }

  static saveStudents(students: Student[]): void {
    try {
      const serializedStudents = JSON.stringify(students, (key, value) => {
        if (key === "lastMessageTime" && value instanceof Date) {
          return value.toISOString()
        }
        return value
      })
      localStorage.setItem(STORAGE_KEYS.STUDENTS, serializedStudents)
    } catch (error) {
      console.error("Failed to save students:", error)
    }
  }

  static loadStudents(): Student[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS)
      if (!stored) return []

      return JSON.parse(stored, (key, value) => {
        if (key === "lastMessageTime" && typeof value === "string") {
          return new Date(value)
        }
        return value
      })
    } catch (error) {
      console.error("Failed to load students:", error)
      return []
    }
  }

  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error("Failed to clear storage:", error)
    }
  }
}
