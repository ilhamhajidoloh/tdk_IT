import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { username, password, role, student_id, homeroom_classroom_id, subjects, email, is_clerical } = await req.json();
  const finalEmail = email?.trim() || null;

  if (!username?.trim() || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ดึงข้อมูลผู้ใช้งานเดิมก่อน
  const oldUserRow = await pool.query("SELECT student_id, role FROM users WHERE id = $1", [id]);
  if (oldUserRow.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const oldRole = oldUserRow.rows[0].role;
  const oldStudentId = oldUserRow.rows[0].student_id;

  if (role === "admin" && oldRole !== "admin") {
    return NextResponse.json(
      { error: "ไม่สามารถตั้งค่าบทบาทเป็นแอดมินผ่านทางหน้าแอดมินได้ ต้องตั้งค่าผ่านฐานข้อมูลโดยตรงเท่านั้น" },
      { status: 400 }
    );
  }

  let result;
  // ถ้ามี password ให้เข้ารหัสและอัปเดตด้วย
  try {
    if (password?.trim()) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      result = await pool.query(
        `UPDATE users SET username = $1, password = $2, role = $3, student_id = $4, homeroom_classroom_id = $5, subjects = $6, email = $7, is_clerical = $8
         WHERE id = $9
         RETURNING id, username, email, role, student_id, homeroom_classroom_id, subjects, is_clerical`,
        [username.trim(), hashedPassword, role, student_id ?? null, homeroom_classroom_id ?? null, subjects ?? null, finalEmail, is_clerical ?? false, id]
      );
    } else {
      result = await pool.query(
        `UPDATE users SET username = $1, role = $2, student_id = $3, homeroom_classroom_id = $4, subjects = $5, email = $6, is_clerical = $7
         WHERE id = $8
         RETURNING id, username, email, role, student_id, homeroom_classroom_id, subjects, is_clerical`,
        [username.trim(), role, student_id ?? null, homeroom_classroom_id ?? null, subjects ?? null, finalEmail, is_clerical ?? false, id]
      );
    }
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 });
    }
    throw err;
  }

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // ซิงค์ตาราง students
  if (role === "student" && student_id) {
    try {
      if (oldStudentId && oldStudentId !== student_id) {
        await pool.query("UPDATE students SET student_id = $1 WHERE student_id = $2", [student_id.trim(), oldStudentId]);
      } else {
        const checkRes = await pool.query("SELECT id FROM students WHERE student_id = $1", [student_id]);
        if (checkRes.rows.length === 0) {
          await pool.query(
            "INSERT INTO students (name, student_id) VALUES ($1, $2)",
            [username.trim(), student_id.trim()]
          );
        }
      }
    } catch (err) {
      console.error("Error syncing student on user update:", err);
    }
  } else if (role !== "student" && oldStudentId) {
    try {
      await pool.query("DELETE FROM students WHERE student_id = $1", [oldStudentId]);
    } catch (err) {
      console.error("Error deleting student when role changed:", err);
    }
  }

  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // ดึง role และ student_id ก่อนลบ
  const userRow = await pool.query("SELECT role, student_id FROM users WHERE id = $1", [id]);
  if (userRow.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // ลบ student และเกรดที่เกี่ยวข้อง ถ้าผู้ใช้เป็น student
  if (userRow.rows[0].role === "student" && userRow.rows[0].student_id) {
    try {
      await pool.query("DELETE FROM grades WHERE student_id = $1", [userRow.rows[0].student_id]);
      await pool.query("DELETE FROM students WHERE student_id = $1", [userRow.rows[0].student_id]);
    } catch (err) {
      console.error("Error auto-deleting student when user is deleted:", err);
    }
  }

  // ยกเลิกการผูกวิชาที่ผู้ใช้นี้สอน ถ้าผู้ใช้เป็น teacher
  if (userRow.rows[0].role === "teacher") {
    try {
      await pool.query("UPDATE subjects SET teacher_id = NULL WHERE teacher_id = $1", [id]);
    } catch (err) {
      console.error("Error unlinking subjects when teacher user is deleted:", err);
    }
  }

  await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
