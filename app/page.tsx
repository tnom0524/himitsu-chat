"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getDatabase, ref, get, onValue, off } from "firebase/database" // onValueとoffを追加
import { getStudentId } from "@/lib/auth"
import { getClassroom, joinAsTeacher } from "@/lib/chat"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils" // cnユーティリティを追加

type Role = "student" | "teacher" | null
type ClassroomId = "A" | "B" | "C" // ClassroomIdを定義

// 各クラスルームの在室状況を保持する型
interface ClassroomStatus {
  totalUsers: number;
  teacherPresent: boolean;
}

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomId | null>(null) // ClassroomIdを使用
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [classroomStatuses, setClassroomStatuses] = useState<Record<ClassroomId, ClassroomStatus>>({ // ClassroomIdを使用
    A: { totalUsers: 0, teacherPresent: false },
    B: { totalUsers: 0, teacherPresent: false },
    C: { totalUsers: 0, teacherPresent: false },
  });
  const router = useRouter()
  const db = getDatabase(); // Firebase Realtime Databaseのインスタンスを取得

  useEffect(() => {
    const classroomIds: ClassroomId[] = ["A", "B", "C"]; // ClassroomIdを使用
    const unsubscribeFunctions: (() => void)[] = [];

    classroomIds.forEach((classroomId) => {
      const statusRef = ref(db, `status/${classroomId}`);
      const unsubscribe = onValue(statusRef, (snapshot) => {
        const activeUsers = snapshot.val();
        let totalUsers = 0;
        let teacherPresent = false;

        if (activeUsers) {
          const usersArray = Object.values(activeUsers) as { role: Role }[];
          totalUsers = usersArray.length;
          teacherPresent = usersArray.some((user) => user.role === "teacher");
        }

        setClassroomStatuses((prevStatuses) => ({
          ...prevStatuses,
          [classroomId]: { totalUsers, teacherPresent },
        }));
      });
      unsubscribeFunctions.push(unsubscribe);
    });

    // コンポーネントのアンマウント時に購読を解除
    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
  }, [db]); // dbインスタンスは変更されないので依存配列はこれでOK

  const handleEnterClassroom = async () => {
    console.log("1. handleEnterClassroom が開始されました。");

    if (!selectedRole || !selectedClassroom) {
      console.log("2. ロールまたはクラスルームが選択されていません。処理を中断します。");
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(`3. Stateを更新。isLoading: true, Role: ${selectedRole}, Classroom: ${selectedClassroom}`);

    try {
      console.log("4. tryブロックに入りました。getClassroomを呼び出します。");
      const classroomData = await getClassroom(selectedClassroom);
      console.log("5. getClassroomからの戻り値:", classroomData);

      let userId = "";

      if (selectedRole === "teacher") {
        console.log("6. 教師として入室処理を開始します。RTDBで在室状況を確認します。");
        // const db = getDatabase(); // 既に上で取得済み
        const statusRef = ref(db, `status/${selectedClassroom}`);
        const statusSnapshot = await get(statusRef);
        const activeUsers = statusSnapshot.val();
        
        let teacherExists = false;
        if (activeUsers) {
          // Realtime Databaseのキーは anonymousId または teacher_for_classroomId なので、
          // そのキーの下の role フィールドを確認する
          teacherExists = Object.values(activeUsers).some((user: any) => user.role === 'teacher');
        }
        console.log("7. 先生は存在しますか？:", teacherExists);

        if (teacherExists) {
          console.error("8. エラー: このクラスには既に他の先生がいます。");
          setError("このクラスには既に他の先生がいます。");
          setIsLoading(false);
          return;
        }
        
        userId = `teacher_for_${selectedClassroom}`;
        console.log("9. joinAsTeacherを呼び出します。Classroom:", selectedClassroom, "TeacherID:", userId);
        await joinAsTeacher(selectedClassroom, userId);
        console.log("10. joinAsTeacherが成功しました。");

      } else { // role is student
        console.log("11. 生徒として入室処理を開始します。RTDBで教師の在室状況を確認します。");
        // const db = getDatabase(); // 既に上で取得済み
        const statusRef = ref(db, `status/${selectedClassroom}`);
        const statusSnapshot = await get(statusRef);
        const activeUsers = statusSnapshot.val();
        
        let teacherExists = false;
        if (activeUsers) {
          teacherExists = Object.values(activeUsers).some((user: any) => user.role === 'teacher');
        }
        console.log("12. 先生は存在しますか？:", teacherExists);

        if (!teacherExists) {
          console.error("13. エラー: このクラスにはまだ先生がいません。");
          setError("このクラスにはまだ先生がいません。");
          setIsLoading(false);
          return;
        }
        userId = getStudentId();
        console.log("14. 生徒IDを取得しました:", userId);
      }
      
      const targetUrl = `/chat?role=${selectedRole}&classroom=${selectedClassroom}&id=${userId}`;
      console.log("15. 全ての処理が成功しました。チャットページに遷移します:", targetUrl);
      router.push(targetUrl);

    } catch (e) {
      console.error("16. catchブロックでエラーを捕捉しました:", e);
      setError("エラーが発生しました。時間をおいて再度お試しください。");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-balance">クラスルーム チャット</h1>
          </div>
          <p className="text-muted-foreground text-lg text-pretty">学習をサポートするコミュニケーションツール</p>
        </div>

        {/* Classroom Selection */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              クラスルームを選択
            </CardTitle>
            <CardDescription>参加するクラスルームを選んでください</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(["A", "B", "C"] as const).map((classroom) => {
                const status = classroomStatuses[classroom];
                const isTeacherPresent = status?.teacherPresent;
                const totalUsers = status?.totalUsers || 0;

                return (
                  <Button
                    key={classroom}
                    variant={selectedClassroom === classroom ? "default" : "outline"}
                    className={cn(
                      "h-20 flex flex-col gap-2 text-lg font-semibold",
                      !isTeacherPresent && "opacity-50" // 教師がいない場合は濃淡を薄くする
                    )}
                    onClick={() => setSelectedClassroom(classroom)}
                  >
                    <div className="text-2xl">クラス {classroom}</div>
                    <Badge variant="secondary" className="text-xs">
                      {totalUsers} 名
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Role Selection */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-accent" />
              ロールを選択
            </CardTitle>
            <CardDescription>あなたの役割を選んでください</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={selectedRole === "student" ? "default" : "outline"}
                className="h-16 flex flex-col gap-2"
                onClick={() => setSelectedRole("student")}
              >
                <Users className="h-6 w-6" />
                <span className="font-semibold">生徒</span>
              </Button>
              <Button
                variant={selectedRole === "teacher" ? "default" : "outline"}
                className="h-16 flex flex-col gap-2"
                onClick={() => setSelectedRole("teacher")}
              >
                <GraduationCap className="h-6 w-6" />
                <span className="font-semibold">教師</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center space-y-4">
          {error && <p className="font-semibold text-red-500">{error}</p>}
          <Button
            size="lg"
            className="px-12 py-6 text-lg font-semibold"
            disabled={!selectedRole || !selectedClassroom || isLoading}
            onClick={handleEnterClassroom}
          >
            {isLoading ? "入室処理中..." : "クラスルームに入る"}
          </Button>
        </div>
        
        {(selectedRole || selectedClassroom) && (
          <Card className="bg-muted/30 border-border/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                {selectedClassroom && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>クラス {selectedClassroom}</span>
                  </div>
                )}
                {selectedRole && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{selectedRole === "student" ? "生徒" : "教師"}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
