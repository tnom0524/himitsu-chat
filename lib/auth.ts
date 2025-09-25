"use client";

import { v4 as uuidv4 } from 'uuid';

const STUDENT_ID_KEY = "anonymous_student_id";

/**
 * localStorageから生徒の匿名IDを取得、なければ新規作成して保存する関数
 * @returns 生徒の一意な匿名ID
 */
export const getStudentId = (): string => {
  // ブラウザ環境でのみ実行
  if (typeof window === "undefined") {
    return "";
  }

  let studentId = localStorage.getItem(STUDENT_ID_KEY);

  if (!studentId) {
    studentId = uuidv4(); // 新しいユニークIDを生成
    localStorage.setItem(STUDENT_ID_KEY, studentId);
  }

  return studentId;
};

// uuidをインストールする必要があります
// ターミナルで `npm install uuid` と `npm install -D @types/uuid` を実行してください