import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [token.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { newPassword, email } = await req.json();

  if (email !== undefined) {
    const trimmedEmail = email?.trim() || null;
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
    }
    try {
      await pool.query("UPDATE users SET email = $1 WHERE id = $2", [trimmedEmail, token.id]);
      return NextResponse.json({ success: true });
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
        return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานโดยผู้ใช้คนอื่นแล้ว" }, { status: 400 });
      }
      throw err;
    }
  }

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, token.id]);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update password";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
