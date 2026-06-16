import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

async function hasScheduleTeacherColumn(): Promise<boolean> {
  try {
    await pool.query("SELECT teacher_id FROM class_schedules LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

async function hasSubjectTeachersTable(): Promise<boolean> {
  try {
    await pool.query("SELECT 1 FROM subject_teachers LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settingId = req.nextUrl.searchParams.get("settingId");
  if (!settingId) {
    return NextResponse.json({ error: "Missing settingId" }, { status: 400 });
  }

  const [hasTeacherCol, hasSTTable] = await Promise.all([
    hasScheduleTeacherColumn(),
    hasSubjectTeachersTable(),
  ]);

  const teacherOverrideCols = hasTeacherCol
    ? `cs.teacher_id as teacher_id, u_cs.username as teacher_name,`
    : `NULL as teacher_id, NULL as teacher_name,`;

  const teacherNamesCols = hasSTTable
    ? `COALESCE(
         (SELECT array_agg(st_u.username ORDER BY st_u.username)
          FROM subject_teachers st
          JOIN users st_u ON st_u.id = st.user_id
          WHERE st.subject_id = cs.subject_id),
         CASE WHEN u_sub.username IS NOT NULL THEN ARRAY[u_sub.username] ELSE '{}' END
       ) as teacher_names,`
    : `CASE WHEN u_sub.username IS NOT NULL THEN ARRAY[u_sub.username] ELSE '{}' END as teacher_names,`;

  const overrideJoin = hasTeacherCol
    ? `LEFT JOIN users u_cs ON u_cs.id = cs.teacher_id`
    : "";

  const result = await pool.query(
    `SELECT cs.id, cs.classroom_id, c.name as classroom_name,
            cs.subject_id, sub.name as subject_name,
            ${teacherOverrideCols}
            ${teacherNamesCols}
            cs.day_of_week, cs.period_id, sp.period_no, sp.start_time, sp.end_time, sp.label
     FROM class_schedules cs
     JOIN classrooms c ON c.id = cs.classroom_id
     JOIN subjects sub ON sub.id = cs.subject_id
     LEFT JOIN users u_sub ON u_sub.id = sub.teacher_id
     ${overrideJoin}
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

  const { setting_id, classroom_id, subject_id, day_of_week, period_id, teacher_id } = await req.json();
  if (!setting_id || !classroom_id || !subject_id || day_of_week === undefined || day_of_week === null || !period_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const hasTeacherCol = await hasScheduleTeacherColumn();

  if (hasTeacherCol) {
    const result = await pool.query(
      `INSERT INTO class_schedules (setting_id, classroom_id, subject_id, day_of_week, period_id, teacher_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (classroom_id, day_of_week, period_id)
       DO UPDATE SET subject_id = EXCLUDED.subject_id, teacher_id = EXCLUDED.teacher_id
       RETURNING *`,
      [setting_id, classroom_id, subject_id, day_of_week, period_id, teacher_id || null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
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
