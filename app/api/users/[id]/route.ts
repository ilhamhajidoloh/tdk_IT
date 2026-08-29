import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";
import { requirePermission } from "@/app/lib/permissions/middleware";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permError = await requirePermission(req, "users.edit");
  if (permError) return permError;

  const { id } = await params;
  const {
    username,
    password,
    role,
    student_id,
    homeroom_classroom_id,
    subjects,
    email,
    is_clerical,
    status,
    resignation_reason,
    replacement_teacher_id,
  } = await req.json();
  const finalEmail = email?.trim() || null;
  const statusVal = status || 'active';

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

  // หากเป็นครูและปรับสถานะเป็น resigned (พ้นสภาพ)
  if (statusVal === 'resigned' && oldRole === 'teacher' && replacement_teacher_id) {
    await pool.query("UPDATE subjects SET teacher_id = $1 WHERE teacher_id = $2", [replacement_teacher_id, id]);
    await pool.query("UPDATE classrooms SET teacher_id = $1 WHERE teacher_id = $2", [replacement_teacher_id, id]);
  }

  let result;
  try {
    if (password?.trim()) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      result = await pool.query(
        `UPDATE users SET username = $1, password = $2, role = $3, student_id = $4, homeroom_classroom_id = $5, subjects = $6, email = $7, is_clerical = $8, status = $10, resigned_at = CASE WHEN $10 = 'resigned' THEN NOW() ELSE resigned_at END, resignation_reason = $11
         WHERE id = $9
         RETURNING id, username, email, role, student_id, homeroom_classroom_id, subjects, is_clerical, status, resigned_at, resignation_reason`,
        [username.trim(), hashedPassword, role, student_id ?? null, homeroom_classroom_id ?? null, subjects ?? null, finalEmail, is_clerical ?? false, id, statusVal, resignation_reason ?? null]
      );
    } else {
      result = await pool.query(
        `UPDATE users SET username = $1, role = $2, student_id = $3, homeroom_classroom_id = $4, subjects = $5, email = $6, is_clerical = $7, status = $9, resigned_at = CASE WHEN $9 = 'resigned' THEN NOW() ELSE resigned_at END, resignation_reason = $10
         WHERE id = $8
         RETURNING id, username, email, role, student_id, homeroom_classroom_id, subjects, is_clerical, status, resigned_at, resignation_reason`,
        [username.trim(), role, student_id ?? null, homeroom_classroom_id ?? null, subjects ?? null, finalEmail, is_clerical ?? false, id, statusVal, resignation_reason ?? null]
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
  const permError = await requirePermission(req, "users.delete");
  if (permError) return permError;

  const { id } = await params;

  // ดึง role และ student_id ก่อนลบ
  const userRow = await pool.query("SELECT role, student_id FROM users WHERE id = $1", [id]);
  if (userRow.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const { role, student_id: studentCode } = userRow.rows[0];

  // ตรวจสอบประวัติของนักเรียนก่อนลบ
  if (role === "student" && studentCode) {
    const historyCheck = await pool.query(
      `SELECT 1 FROM grades WHERE student_id = $1
       UNION
       SELECT 1 FROM evaluations WHERE student_id = $1
       UNION
       SELECT 1 FROM attendance WHERE student_id = $1
       LIMIT 1`,
      [studentCode]
    );
    if (historyCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "ผู้ใช้นักเรียนคนนี้มีประวัติผลการเรียน/การประเมิน/การเช็คชื่อในระบบแล้ว ไม่สามารถลบถาวรได้ โปรดเปลี่ยนสถานะเป็น 'จบการศึกษา' หรือ 'ลาออก' แทน" },
        { status: 400 }
      );
    }
  }

  // ตรวจสอบประวัติของครูก่อนลบ
  if (role === "teacher") {
    const historyCheck = await pool.query(
      `SELECT 1 FROM attendance WHERE teacher_id = $1
       UNION
       SELECT 1 FROM evaluations WHERE evaluated_by = $1
       LIMIT 1`,
      [id]
    );
    if (historyCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "ผู้ใช้ครูท่านนี้มีประวัติการประเมินหรือเช็คชื่อในระบบแล้ว ไม่สามารถลบถาวรได้ โปรดเปลี่ยนสถานะเป็น 'พ้นสภาพ/ลาออก' แทน" },
        { status: 400 }
      );
    }
  }

  // ลบ student ถ้าผู้ใช้เป็น student
  if (role === "student" && studentCode) {
    try {
      await pool.query("DELETE FROM students WHERE student_id = $1", [studentCode]);
    } catch (err) {
      console.error("Error auto-deleting student when user is deleted:", err);
    }
  }

  // ยกเลิกการผูกวิชาที่ผู้ใช้นี้สอน ถ้าผู้ใช้เป็น teacher
  if (role === "teacher") {
    try {
      await pool.query("UPDATE subjects SET teacher_id = NULL WHERE teacher_id = $1", [id]);
    } catch (err) {
      console.error("Error unlinking subjects when teacher user is deleted:", err);
    }
  }

  await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
