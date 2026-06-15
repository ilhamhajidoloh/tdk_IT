import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settingId = req.nextUrl.searchParams.get("settingId");
  if (!settingId) {
    return NextResponse.json({ error: "Missing settingId" }, { status: 400 });
  }

  const result = await pool.query(
    "SELECT * FROM schedule_periods WHERE setting_id = $1 ORDER BY period_no",
    [settingId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { setting_id, period_no, start_time, end_time, label, is_break } = await req.json();
  if (!setting_id || !start_time || !end_time) {
    return NextResponse.json({ error: "Missing required fields: setting_id, start_time, end_time" }, { status: 400 });
  }

  let nextPeriodNo = period_no;
  if (!nextPeriodNo) {
    const maxResult = await pool.query(
      "SELECT COALESCE(MAX(period_no), 0) + 1 as next FROM schedule_periods WHERE setting_id = $1",
      [setting_id]
    );
    nextPeriodNo = maxResult.rows[0].next;
  }

  const result = await pool.query(
    "INSERT INTO schedule_periods (setting_id, period_no, start_time, end_time, label, is_break) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [setting_id, nextPeriodNo, start_time, end_time, label || null, is_break || false]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
