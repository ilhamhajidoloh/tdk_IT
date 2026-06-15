import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ดึง users ที่มีบทบาทเป็น student และมี student_id เพื่อมาสร้างในตาราง students อัตโนมัติ
  try {
    const studentUsers = await pool.query(
      "SELECT username, student_id FROM users WHERE role = 'student' AND student_id IS NOT NULL AND student_id != ''"
    );

    for (const u of studentUsers.rows) {
      const checkRes = await pool.query("SELECT id FROM students WHERE student_id = $1", [u.student_id]);
      if (checkRes.rows.length === 0) {
        await pool.query(
          "INSERT INTO students (name, student_id, classroom_id) VALUES ($1, $2, null)",
          [u.username, u.student_id]
        );
      }
    }
  } catch (e) {
    console.error("Error auto-syncing students from users:", e);
  }

  const classroomId = req.nextUrl.searchParams.get("classroomId");

  let result;
  if (classroomId) {
    result = await pool.query(
      "SELECT * FROM students WHERE classroom_id = $1 ORDER BY name",
      [classroomId]
    );
  } else {
    result = await pool.query("SELECT * FROM students ORDER BY name");
  }
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, student_id, classroom_id } = await req.json();

  if (!name?.trim() || !student_id?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const studentIdVal = student_id?.trim() || null;

  if (studentIdVal) {
    const checkExists = await pool.query("SELECT id FROM students WHERE student_id = $1", [studentIdVal]);
    if (checkExists.rows.length > 0) {
      return NextResponse.json({ error: "รหัสนักเรียนนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }
  }

  const result = await pool.query(
    "INSERT INTO students (name, student_id, classroom_id) VALUES ($1, $2, $3) RETURNING *",
    [name.trim(), studentIdVal, classroom_id || null]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
