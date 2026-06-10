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
  await pool.query("DELETE FROM students WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
