import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebaseコンソールからコピーした設定情報を環境変数から読み込むように変更します
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// アプリケーションが既に初期化されていない場合のみ、Firebaseを初期化します。
// これにより、ページの再読み込みなどで複数回初期化が実行されるのを防ぎます。
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firestoreデータベースへの参照を取得し、他のファイルで使えるようにエクスポートします。
export const db = getFirestore(app);
