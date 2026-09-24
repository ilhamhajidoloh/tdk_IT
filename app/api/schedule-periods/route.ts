import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { requirePermission } from "@/app/lib/permissions/middleware";
import { getSchoolContext } from "@/app/lib/schoolContext";

const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settingId = req.nextUrl.searchParams.get("settingId");
  const schoolId = (await getSchoolContext(req))?.schoolId || DEFAULT_SCHOOL_ID;
  if (!settingId) {
    return NextResponse.json({ error: "Missing settingId" }, { status: 400 });
  }

  const result = await pool.query(
    "SELECT * FROM schedule_periods WHERE setting_id = $1 AND (school_id = $2 OR school_id IS NULL) ORDER BY period_no",
    [settingId, schoolId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const permError = await requirePermission(req, "schedules.create");
  if (permError) return permError;

  const { setting_id, period_no, start_time, end_time, label, is_break } = await req.json();
  const schoolId = (await getSchoolContext(req))?.schoolId || DEFAULT_SCHOOL_ID;
  if (!setting_id || !start_time || !end_time) {
    return NextResponse.json({ error: "Missing required fields: setting_id, start_time, end_time" }, { status: 400 });
  }

  let nextPeriodNo = period_no;
  if (!nextPeriodNo) {
    const maxResult = await pool.query(
      "SELECT COALESCE(MAX(period_no), 0) + 1 as next FROM schedule_periods WHERE setting_id = $1 AND (school_id = $2 OR school_id IS NULL)",
      [setting_id, schoolId]
    );
    nextPeriodNo = maxResult.rows[0].next;
  }

  const result = await pool.query(
    "INSERT INTO schedule_periods (setting_id, period_no, start_time, end_time, label, is_break, school_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [setting_id, nextPeriodNo, start_time, end_time, label || null, is_break || false, schoolId]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
