import { getDatabase, ref, set, onDisconnect, serverTimestamp } from "firebase/database";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { app } from "./firebase"; // 👈 firebase.tsからappをインポート

// Firebase SDKのインスタンスを取得
const auth = getAuth(app);
const rtDb = getDatabase(app);

let currentUserId: string | null = null;
let isAuthInitialized = false;

// 匿名認証でユーザーIDを確保し、一度だけ実行されるようにする
const initializeAuth = () => {
  if (isAuthInitialized) return;
  isAuthInitialized = true;

  signInAnonymously(auth).catch((error) => {
    console.error("Anonymous sign-in failed:", error);
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      console.log("Anonymous user signed in with UID:", currentUserId);
    } else {
      currentUserId = null;
    }
  });
};

// アプリの初期化時に認証を開始
initializeAuth();

/**
 * ユーザーのオンライン状態を設定し、切断時の処理を予約する関数
 * @param classroomId クラスルームID
 * @param userRole ユーザーの役割
 * @param anonymousId ページ遷移で使っている匿名ID
 */
export const setUserOnline = (classroomId: string, userRole: 'student' | 'teacher', anonymousId: string) => {
  // 認証が完了し、currentUserIdが取得できるまで待つ
  const checkAuth = setInterval(() => {
    if (currentUserId) {
      clearInterval(checkAuth); // 待つのをやめる

      const presenceRef = ref(rtDb, `status/${classroomId}/${currentUserId}`);
      
      const userData = {
        isOnline: true,
        role: userRole,
        anonymousId: anonymousId,
        lastChanged: serverTimestamp(),
      };
      
      // ユーザーがオンラインであることを書き込む
      set(presenceRef, userData);

      // 接続が切れたら、このデータを自動で削除するように予約
      onDisconnect(presenceRef).remove();
    }
  }, 100); // 100ミリ秒ごとに確認
};