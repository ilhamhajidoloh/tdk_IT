import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

function formatRow(row: Record<string, unknown>) {
  return {
    teacher_anchor_date: row.teacher_anchor_date instanceof Date
      ? row.teacher_anchor_date.toISOString().split("T")[0]
      : row.teacher_anchor_date,
    cook_anchor_date: row.cook_anchor_date instanceof Date
      ? row.cook_anchor_date.toISOString().split("T")[0]
      : row.cook_anchor_date,
  };
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const result = await pool.query("SELECT teacher_anchor_date, cook_anchor_date FROM duty_settings WHERE id = 1");
  return NextResponse.json(formatRow(result.rows[0]));
}

export async function PUT(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { teacher_anchor_date, cook_anchor_date } = await req.json();
  if (!teacher_anchor_date || !cook_anchor_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const result = await pool.query(
    `UPDATE duty_settings SET teacher_anchor_date = $1, cook_anchor_date = $2 WHERE id = 1 RETURNING *`,
    [teacher_anchor_date, cook_anchor_date]
  );
  return NextResponse.json(formatRow(result.rows[0]));
}
