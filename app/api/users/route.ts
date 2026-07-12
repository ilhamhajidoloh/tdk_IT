import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";

async function hasSubjectTeachersTable(): Promise<boolean> {
  try {
    await pool.query("SELECT 1 FROM subject_teachers LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const multiTeacherReady = await hasSubjectTeachersTable();

  let queryText = "";
  if (multiTeacherReady) {
    queryText = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.student_id, 
        u.homeroom_classroom_id,
        u.is_clerical,
        COALESCE(
          (
            SELECT array_agg(DISTINCT s.name)
            FROM subjects s
            LEFT JOIN subject_teachers st ON st.subject_id = s.id
            WHERE s.teacher_id = u.id OR st.user_id = u.id
          ),
          '{}'::text[]
        ) as subjects
      FROM users u
      ORDER BY u.role, u.username
    `;
  } else {
    queryText = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.student_id, 
        u.homeroom_classroom_id,
        u.is_clerical,
        COALESCE(
          (
            SELECT array_agg(DISTINCT s.name)
            FROM subjects s
            WHERE s.teacher_id = u.id
          ),
          '{}'::text[]
        ) as subjects
      FROM users u
      ORDER BY u.role, u.username
    `;
  }

  const result = await pool.query(queryText);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, username, password, role, student_id, homeroom_classroom_id, subjects, email, is_clerical } = await req.json();

  let finalName = name?.trim();
  let finalUsername = username?.trim();
  let finalPassword = password?.trim();
  let finalStudentId = student_id?.trim();
  const finalEmail = email?.trim() || null;

  if (role === 'student') {
    if (!finalStudentId) {
      finalStudentId = `S${Math.floor(10000 + Math.random() * 90000)}`;
    }
    if (!finalUsername) {
      finalUsername = `std${Math.floor(10000 + Math.random() * 90000)}`;
    }
    if (!finalPassword) {
      finalPassword = "password123"; // Default password
    }
  } else if (role === 'teacher') {
    if (!finalUsername) {
      finalUsername = finalName || `tch${Math.floor(10000 + Math.random() * 90000)}`;
    }
    if (!finalPassword) {
      finalPassword = "password123";
    }
  }

  if (!finalUsername || !finalPassword || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (role === "admin") {
    return NextResponse.json(
      { error: "ไม่สามารถสร้างผู้ใช้แอดมินผ่านทางหน้าแอดมินได้ ต้องสร้างผ่านการเขียน SQL ลงฐานข้อมูลโดยตรงเท่านั้น" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(finalPassword, 10);

  // Insert ลง DB
  let result;
  try {
     result = await pool.query(
      `INSERT INTO users (username, password, role, student_id, homeroom_classroom_id, subjects, email, is_clerical)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, username, email, role, student_id, homeroom_classroom_id, subjects, is_clerical`,
      [finalUsername, hashedPassword, role, finalStudentId ?? null, homeroom_classroom_id ?? null, subjects ?? null, finalEmail, is_clerical ?? false]
    );
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // ถ้าเป็น student ให้สร้างในตาราง students อัตโนมัติ
  if (role === "student" && finalStudentId) {
    try {
      const checkRes = await pool.query("SELECT id FROM students WHERE student_id = $1", [finalStudentId]);
      if (checkRes.rows.length === 0) {
        const studentName = finalName || finalUsername;
        await pool.query(
          "INSERT INTO students (name, student_id) VALUES ($1, $2)",
          [studentName, finalStudentId]
        );
      }
    } catch (err) {
      console.error("Error auto-inserting student on user creation:", err);
    }
  }

  return NextResponse.json(result.rows[0], { status: 201 });
}
