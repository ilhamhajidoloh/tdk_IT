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
  const { name, student_id, classroom_id, setting_id } = await req.json();

  if (!name?.trim() || !student_id?.trim() || classroom_id === undefined || !setting_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const studentIdVal = student_id?.trim() || null;

  if (studentIdVal) {
    const checkExists = await pool.query("SELECT id FROM students WHERE student_id = $1 AND id != $2", [studentIdVal, id]);
    if (checkExists.rows.length > 0) {
      return NextResponse.json({ error: "รหัสนักเรียนนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }
  }

  const result = await pool.query(
    "UPDATE students SET name = $1, student_id = $2 WHERE id = $3 RETURNING id, name, student_id",
    [name.trim(), studentIdVal, id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // classroom_id is scoped to this specific term (setting_id) only — it never
  // touches the student's enrollment in any other term.
  if (classroom_id) {
    await pool.query(
      `INSERT INTO classroom_students (student_id, classroom_id, setting_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, setting_id) DO UPDATE SET classroom_id = excluded.classroom_id`,
      [id, classroom_id, setting_id]
    );
  } else {
    await pool.query("DELETE FROM classroom_students WHERE student_id = $1 AND setting_id = $2", [id, setting_id]);
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
    // ลบบัญชีผู้ใช้ที่ผูกกับนักเรียนคนนี้
    const userRow = await pool.query("SELECT id FROM users WHERE student_id = $1", [studentCode]);
    for (const u of userRow.rows) {
      await pool.query("DELETE FROM users WHERE id = $1", [u.id]);
    }

    await pool.query("DELETE FROM grades WHERE student_id = $1", [studentCode]);
  }
  await pool.query("DELETE FROM students WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
