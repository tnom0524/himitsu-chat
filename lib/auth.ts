"use client";

import { v4 as uuidv4 } from 'uuid';

const STUDENT_ID_KEY = "anonymous_student_session_id";

/**
 * sessionStorageから生徒の匿名IDを取得、なければ新規作成して保存する関数
 * @returns 生徒の一意な匿名ID
 */
export const getStudentId = (): string => {
  if (typeof window === "undefined") return "";

  let studentId = sessionStorage.getItem(STUDENT_ID_KEY);

  if (!studentId) {
    studentId = uuidv4();
    sessionStorage.setItem(STUDENT_ID_KEY, studentId);
  }

  return studentId;
};