import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { id } = await params;
  const { title, content, is_published } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const result = await pool.query(
    "UPDATE news SET title = $1, content = $2, is_published = $3 WHERE id = $4 RETURNING *",
    [title, content, is_published ?? true, id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "News not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { id } = await params;
  await pool.query("DELETE FROM news WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
