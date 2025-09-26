// ユーザーの型定義
export interface User {
  id: string;
  role: "student" | "teacher";
  classroomId: "A" | "B" | "C";
}
