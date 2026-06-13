import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import { adminAuth } from "@/app/lib/firebase-admin";
import pool from "@/app/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, student_id, classroom_id } = await req.json();

  if (!name?.trim() || !student_id?.trim() || !classroom_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await pool.query(
    "UPDATE students SET name = $1, student_id = $2, classroom_id = $3 WHERE id = $4 RETURNING *",
    [name.trim(), student_id.trim(), classroom_id, id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
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

  const studentRow = await pool.query("SELECT student_id FROM students WHERE id = $1", [id]);
  if (studentRow.rows.length === 0) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
  const studentCode = studentRow.rows[0].student_id;

  // ลบบัญชีผู้ใช้ที่ผูกกับนักเรียนคนนี้ (รวม Firebase)
  const userRow = await pool.query("SELECT id, firebase_uid FROM users WHERE student_id = $1", [studentCode]);
  for (const u of userRow.rows) {
    try {
      await adminAuth.deleteUser(u.firebase_uid);
    } catch {
      // ถ้า Firebase user ไม่มีอยู่แล้ว ก็ลบ DB ต่อได้
    }
    await pool.query("DELETE FROM users WHERE id = $1", [u.id]);
  }

  await pool.query("DELETE FROM grades WHERE student_id = $1", [studentCode]);
  await pool.query("DELETE FROM students WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
