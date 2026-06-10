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
    "UPDATE subjects SET name = $1 WHERE id = $2 RETURNING *",
    [name.trim(), id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
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
  await pool.query("DELETE FROM subjects WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
