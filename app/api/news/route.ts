import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const result = await pool.query(
    "SELECT id, title, content, is_published, created_at FROM news ORDER BY created_at DESC"
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { title, content, is_published } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const result = await pool.query(
    "INSERT INTO news (title, content, is_published) VALUES ($1, $2, $3) RETURNING *",
    [title, content, is_published ?? true]
  );
  return NextResponse.json(result.rows[0]);
}
