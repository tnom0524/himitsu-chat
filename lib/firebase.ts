import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ▼▼▼ ここに、Firebaseコンソールからコピーしたあなたの設定情報を貼り付けます ▼▼▼
const firebaseConfig = {
  apiKey: "AIzaSyBOzUv70ioTMNbVVZxDusDXVwAKvwteosE",
  authDomain: "himitsuroom.firebaseapp.com",
  projectId: "himitsuroom",
  storageBucket: "himitsuroom.appspot.com",
  messagingSenderId: "509991768131",
  appId: "1:509991768131:web:3c0077cd5bb32f6ac904f6",
  measurementId: "G-6XG1QJ5JHM"
};
// ▲▲▲ ここまで ▲▲▲

// アプリケーションが既に初期化されていない場合のみ、Firebaseを初期化します。
// これにより、ページの再読み込みなどで複数回初期化が実行されるのを防ぎます。
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firestoreデータベースへの参照を取得し、他のファイルで使えるようにエクスポートします。
export const db = getFirestore(app);