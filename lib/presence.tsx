import { getDatabase, ref, set, onDisconnect, serverTimestamp } from "firebase/database";
import { getAuth, onAuthStateChanged, signInAnonymously, User as AuthUser } from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);
const rtDb = getDatabase(app);

// 認証ユーザーをPromiseで管理し、一度だけ初期化する
let authPromise: Promise<AuthUser | null> | null = null;
const initializeAuth = (): Promise<AuthUser | null> => {
  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      signInAnonymously(auth).then(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      }).catch(error => {
        console.error("Anonymous sign-in failed:", error);
        resolve(null);
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
  const authUserId = user.uid; // 匿名認証の永続ID
  
  const presenceRef = ref(rtDb, `status/${classroomId}/${authUserId}`);
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