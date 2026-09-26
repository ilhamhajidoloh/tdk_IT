import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { ensureStatusSchema } from "@/app/lib/statusMigration";

const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

async function ownsSubject(userId: string, subjectId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM subjects s
     LEFT JOIN subject_teachers st ON st.subject_id = s.id
     WHERE s.id = $1 AND (s.teacher_id = $2 OR st.user_id = $2)
     LIMIT 1`,
    [subjectId, userId]
  );
  return result.rows.length > 0;
}

async function getTotalWeeks(schoolId: string, academicYear: string): Promise<number> {
  const result = await pool.query(
    `SELECT MAX(attendance_total_weeks) AS total_weeks
     FROM system_settings
     WHERE academic_year = $1 AND (school_id = $2 OR school_id IS NULL)`,
    [academicYear, schoolId]
  );
  return Number(result.rows[0]?.total_weeks ?? 0);
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureStatusSchema();

  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const classroomId = req.nextUrl.searchParams.get("classroomId");
  const academicYear = req.nextUrl.searchParams.get("academicYear");
  if (!subjectId || !classroomId || !academicYear) {
    return NextResponse.json({ error: "Missing subjectId, classroomId, or academicYear" }, { status: 400 });
  }
  if (user.role !== "admin" && !(await ownsSubject(user.id, subjectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = (await getSchoolContext(req))?.schoolId || DEFAULT_SCHOOL_ID;
  const [records, totalWeeks] = await Promise.all([
    pool.query(
      `SELECT student_id, present_days, sick_leave_days, personal_leave_days
       FROM attendance_yearly_summaries
       WHERE school_id = $1 AND academic_year = $2 AND subject_id = $3 AND classroom_id = $4`,
      [schoolId, academicYear, subjectId, classroomId]
    ),
    getTotalWeeks(schoolId, academicYear),
  ]);

  return NextResponse.json({
    total_weeks: totalWeeks,
    records: records.rows.map((row) => ({
      student_id: row.student_id,
      present_days: Number(row.present_days),
      sick_leave_days: Number(row.sick_leave_days),
      personal_leave_days: Number(row.personal_leave_days),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureStatusSchema();

  const { subjectId, classroomId, academicYear, records } = await req.json();
  if (!subjectId || !classroomId || !academicYear || !Array.isArray(records)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (user.role !== "admin" && !(await ownsSubject(user.id, subjectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = (await getSchoolContext(req))?.schoolId || DEFAULT_SCHOOL_ID;
  const totalWeeks = await getTotalWeeks(schoolId, academicYear);
  if (totalWeeks <= 0) {
    return NextResponse.json({ error: "Admin must set the total weeks for this academic year first" }, { status: 400 });
  }

  for (const record of records) {
    const values = [record.presentDays, record.sickLeaveDays, record.personalLeaveDays];
    if (!record.studentId || values.some((value) => !Number.isInteger(value) || value < 0) || values.reduce((sum, value) => sum + value, 0) > totalWeeks) {
      return NextResponse.json({ error: "Each student's total days must be a non-negative integer and not exceed the total weeks" }, { status: 400 });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const record of records) {
      await client.query(
        `INSERT INTO attendance_yearly_summaries
          (school_id, academic_year, subject_id, classroom_id, student_id, present_days, sick_leave_days, personal_leave_days, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT ON CONSTRAINT unique_yearly_attendance_summary
         DO UPDATE SET present_days = EXCLUDED.present_days, sick_leave_days = EXCLUDED.sick_leave_days,
           personal_leave_days = EXCLUDED.personal_leave_days, recorded_by = EXCLUDED.recorded_by, updated_at = NOW()`,
        [schoolId, academicYear, subjectId, classroomId, record.studentId, record.presentDays, record.sickLeaveDays, record.personalLeaveDays, user.id]
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/attendance/yearly error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
