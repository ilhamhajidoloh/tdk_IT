import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { encode } from "next-auth/jwt";
import pool from "@/app/lib/db";

// Endpoint สำหรับแอปมือถือ (Flutter) โดยเฉพาะ: NextAuth ปกติใช้ httpOnly cookie
// ซึ่งแอปเนทีฟรับ/ส่งไม่ได้ตามธรรมชาติ endpoint นี้ตรวจรหัสผ่านแบบเดียวกับ
// CredentialsProvider.authorize() ใน app/api/auth/[...nextauth]/route.ts แล้วคืน JWT
// ที่ encode ด้วย secret เดียวกัน เพื่อให้ getAuthToken() (ใช้ใน verifyUser/verifyAdmin)
// decode ผ่าน Authorization: Bearer <token> ได้เหมือนกับ getToken() จาก cookie
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 วัน เท่ากับ session ฝั่งเว็บ

export async function POST(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password;
  if (!username || !password) {
    return NextResponse.json({ error: "กรุณากรอก Username และ Password" }, { status: 400 });
  }

  const result = await pool.query(
    "SELECT id, username, password, role, student_id, homeroom_classroom_id, subjects, email, is_clerical, school_id, COALESCE(status, 'active') AS status FROM users WHERE username = $1 OR student_id = $1",
    [username]
  );
  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ error: "ไม่พบชื่อผู้ใช้นี้" }, { status: 401 });
  }

  if (user.role === "teacher" && user.status === "resigned") {
    return NextResponse.json({ error: "บัญชีผู้ใช้นี้พ้นสภาพการทำงานแล้ว ไม่สามารถเข้าสู่ระบบได้" }, { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const isReadOnly = user.role === "student" && (user.status === "graduated" || user.status === "resigned");

  const tokenPayload = {
    id: user.id.toString(),
    name: user.username,
    role: user.role,
    student_id: user.student_id,
    homeroom_classroom_id: user.homeroom_classroom_id,
    subjects: user.subjects,
    email: user.email,
    is_clerical: user.is_clerical,
    school_id: user.school_id,
    status: user.status,
    is_read_only: isReadOnly,
  };

  const token = await encode({
    token: tokenPayload,
    secret,
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ token, user: tokenPayload });
}
