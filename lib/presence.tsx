import { getDatabase, ref, set, onDisconnect, serverTimestamp } from "firebase/database";
import { getAuth, onAuthStateChanged, signInAnonymously, signOut, User as AuthUser } from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);
const rtDb = getDatabase(app);

// 認証ユーザーをPromiseで管理し、一度だけ初期化する（シングルトンパターン）
let authPromise: Promise<AuthUser | null> | null = null;

const initializeAuth = (): Promise<AuthUser | null> => {
  // 教師が明示的にサインアウトした場合など、認証が切れている場合はPromiseをリセットする
  if (auth.currentUser === null) {
    authPromise = null;
  }

  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe(); // 一度だけ実行されれば良いので、すぐに解除
        if (user) {
          resolve(user);
        } else {
          // ユーザーがいない場合（初回アクセスまたはサインアウト後）は、匿名サインインを実行
          signInAnonymously(auth)
            .then(cred => resolve(cred.user))
            .catch(error => {
              console.error("Anonymous sign-in failed:", error);
              resolve(null);
            });
        }
      });
    });
  }
  return authPromise;
};


/**
 * ユーザーのオンライン状態を設定し、切断時の処理を予約する
 */
export const setUserOnline = async (classroomId: string, userRole: 'student' | 'teacher', anonymousId: string) => {
  const user = await initializeAuth();
  if (!user) {
    console.error("Authentication failed. Cannot set user online.");
    return;
  }
  // 認証ID(user.uid)はタブ間で共有されてしまうため、キーとして使用しない。
  // 代わりに、セッションごとに一意なanonymousIdをキーとして使用する。
  const presenceRef = ref(rtDb, `status/${classroomId}/${anonymousId}`);
  const userData = {
    role: userRole,
    anonymousId: anonymousId, // フロントで使うID
    lastChanged: serverTimestamp(),
  };
  
  try {
    await onDisconnect(presenceRef).remove();
    await set(presenceRef, userData);
  } catch (error) {
    console.error("Failed to set user online status:", error);
  }
};
