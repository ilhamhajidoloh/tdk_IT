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
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const result = await pool.query(
    "UPDATE classrooms SET name = $1 WHERE id = $2 RETURNING *",
    [name.trim(), id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
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

  const studentCheck = await pool.query("SELECT 1 FROM classroom_students WHERE classroom_id = $1 LIMIT 1", [id]);
  if (studentCheck.rows.length > 0) {
    return NextResponse.json({ error: "ไม่สามารถลบห้องเรียนที่มีนักเรียนอยู่ได้ กรุณาย้ายนักเรียนออกก่อน" }, { status: 400 });
  }

  const teacherCheck = await pool.query("SELECT 1 FROM users WHERE homeroom_classroom_id = $1 LIMIT 1", [id]);
  if (teacherCheck.rows.length > 0) {
    return NextResponse.json({ error: "ไม่สามารถลบห้องเรียนที่มีครูประจำชั้นอยู่ได้ กรุณายกเลิกครูประจำชั้นก่อน" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM subject_classrooms WHERE classroom_id = $1", [id]);
    await client.query("DELETE FROM class_schedules WHERE classroom_id = $1", [id]);
    const result = await client.query("DELETE FROM classrooms WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
