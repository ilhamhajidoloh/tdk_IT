import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, student_id, classroom_id, setting_id, status, graduation_year, status_note, enrollment_date, graduation_date } = await req.json();

  if (!name?.trim() || !student_id?.trim() || (classroom_id === undefined && !status) || (!setting_id && !status)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const studentIdVal = student_id?.trim() || null;

  if (studentIdVal) {
    const checkExists = await pool.query("SELECT id FROM students WHERE student_id = $1 AND id != $2", [studentIdVal, id]);
    if (checkExists.rows.length > 0) {
      return NextResponse.json({ error: "รหัสนักเรียนนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }
  }

  const statusVal = status || 'active';
  const gradYearVal = graduation_year || null;
  const noteVal = status_note || null;
  const enrollDateVal = enrollment_date || null;
  const gradDateVal = graduation_date || null;

  const oldStudent = await pool.query("SELECT student_id, name FROM students WHERE id = $1", [id]);
  const oldStudentCode = oldStudent.rows[0]?.student_id;

  const result = await pool.query(
    `UPDATE students
     SET name = $1, student_id = $2, status = $4, graduation_year = $5, status_updated_at = NOW(), status_note = $6, enrollment_date = $7, graduation_date = $8
     WHERE id = $3 RETURNING *`,
    [name.trim(), studentIdVal, id, statusVal, gradYearVal, noteVal, enrollDateVal, gradDateVal]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (oldStudentCode) {
    await pool.query(
      `UPDATE users
       SET student_id = $1, status = $2, username = CASE WHEN username = $3 THEN $1 ELSE username END
       WHERE student_id = $3`,
      [studentIdVal, statusVal, oldStudentCode]
    );
  }

  // classroom_id is scoped to this specific term (setting_id) only
  if (setting_id) {
    if (classroom_id && statusVal === 'active') {
      await pool.query(
        `INSERT INTO classroom_students (student_id, classroom_id, setting_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (student_id, setting_id) DO UPDATE SET classroom_id = excluded.classroom_id`,
        [id, classroom_id, setting_id]
      );
    } else {
      await pool.query("DELETE FROM classroom_students WHERE student_id = $1 AND setting_id = $2", [id, setting_id]);
    }
  }

  return NextResponse.json({ ...result.rows[0], classroom_id: classroom_id || null });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const studentRow = await pool.query("SELECT student_id FROM students WHERE id = $1", [id]);
  if (studentRow.rows.length === 0) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
  const studentCode = studentRow.rows[0].student_id;

  if (studentCode) {
    // ป้องกันการลบถาวรหากมีประวัติเกรด การประเมิน หรือการเช็คชื่อในระบบแล้ว
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
        { error: "นักเรียนคนนี้มีประวัติผลการเรียน/การประเมิน/การเช็คชื่อในระบบแล้ว ไม่สามารถลบถาวรได้ โปรดเปลี่ยนสถานะเป็น 'จบการศึกษา' หรือ 'ลาออก' แทน" },
        { status: 400 }
      );
    }

    // ลบบัญชีผู้ใช้ที่ผูกกับนักเรียนคนนี้
    const userRow = await pool.query("SELECT id FROM users WHERE student_id = $1", [studentCode]);
    for (const u of userRow.rows) {
      await pool.query("DELETE FROM users WHERE id = $1", [u.id]);
    }
  }

  await pool.query("DELETE FROM students WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
