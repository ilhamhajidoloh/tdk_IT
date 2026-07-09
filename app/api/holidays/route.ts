import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const result = await pool.query(
    "SELECT id, date, reason, is_published, created_at FROM school_holidays ORDER BY date DESC"
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { date, reason, is_published } = await req.json();
  if (!date || !reason) {
    return NextResponse.json({ error: "Missing required fields: date, reason" }, { status: 400 });
  }
  try {
    const result = await pool.query(
      "INSERT INTO school_holidays (date, reason, is_published) VALUES ($1, $2, $3) RETURNING *",
      [date, reason, is_published ?? true]
    );
    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "วันที่นี้มีวันหยุดพิเศษอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
