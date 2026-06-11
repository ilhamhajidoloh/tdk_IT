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
    `SELECT cs.id, cs.classroom_id, c.name as classroom_name,
            cs.subject_id, sub.name as subject_name, sub.teacher_id, u.username as teacher_name,
            cs.day_of_week, cs.period_id, sp.period_no, sp.start_time, sp.end_time, sp.label
     FROM class_schedules cs
     JOIN classrooms c ON c.id = cs.classroom_id
     JOIN subjects sub ON sub.id = cs.subject_id
     LEFT JOIN users u ON u.id = sub.teacher_id
     JOIN schedule_periods sp ON sp.id = cs.period_id
     WHERE cs.setting_id = $1
     ORDER BY cs.day_of_week, sp.period_no`,
    [settingId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { setting_id, classroom_id, subject_id, day_of_week, period_id } = await req.json();
  if (!setting_id || !classroom_id || !subject_id || day_of_week === undefined || day_of_week === null || !period_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO class_schedules (setting_id, classroom_id, subject_id, day_of_week, period_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (classroom_id, day_of_week, period_id)
     DO UPDATE SET subject_id = EXCLUDED.subject_id
     RETURNING *`,
    [setting_id, classroom_id, subject_id, day_of_week, period_id]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
