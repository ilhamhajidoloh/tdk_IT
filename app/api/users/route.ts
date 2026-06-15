import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await pool.query(
    "SELECT id, username, role, student_id, homeroom_classroom_id, subjects FROM users ORDER BY role, username"
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username, password, role, student_id, homeroom_classroom_id, subjects } = await req.json();

  if (!username?.trim() || !password?.trim() || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (role === "admin") {
    return NextResponse.json(
      { error: "ไม่สามารถสร้างผู้ใช้แอดมินผ่านทางหน้าแอดมินได้ ต้องสร้างผ่านการเขียน SQL ลงฐานข้อมูลโดยตรงเท่านั้น" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password.trim(), 10);

  // Insert ลง DB
  let result;
  try {
     result = await pool.query(
      `INSERT INTO users (username, password, role, student_id, homeroom_classroom_id, subjects)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role, student_id, homeroom_classroom_id, subjects`,
      [username.trim(), hashedPassword, role, student_id ?? null, homeroom_classroom_id ?? null, subjects ?? null]
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // ถ้าเป็น student ให้สร้างในตาราง students อัตโนมัติ
  if (role === "student" && student_id) {
    try {
      const checkRes = await pool.query("SELECT id FROM students WHERE student_id = $1", [student_id]);
      if (checkRes.rows.length === 0) {
        await pool.query(
          "INSERT INTO students (name, student_id, classroom_id) VALUES ($1, $2, null)",
          [username.trim(), student_id.trim()]
        );
      }
    } catch (err) {
      console.error("Error auto-inserting student on user creation:", err);
    }
  }

  return NextResponse.json(result.rows[0], { status: 201 });
}
