import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { requirePermission, requireAnyPermission } from "@/app/lib/permissions/middleware";

export async function GET(req: NextRequest) {
  const permError = await requireAnyPermission(
    req,
    "classrooms.view",
    "students.view",
    "subjects.view",
    "schedules.view",
    "scores.view",
    "attendance.view"
  );
  if (permError) return permError;

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;

  const requestedSchoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id");

  if (context?.isSuperAdmin) {
    schoolId = requestedSchoolId || schoolId;
  } else if (requestedSchoolId && requestedSchoolId !== schoolId) {
    // Non-super admin cannot request data from other schools
    return NextResponse.json({ error: "Forbidden: Cannot access other school's data" }, { status: 403 });
  }
  if (!schoolId) schoolId = "00000000-0000-0000-0000-000000000001";

  const settingId = req.nextUrl.searchParams.get("settingId");

  let result;
  if (settingId) {
    result = await pool.query(
      `SELECT c.*, s.academic_year, s.term,
        (SELECT COUNT(*) FROM classroom_students cs WHERE cs.classroom_id = c.id AND cs.setting_id = c.setting_id) AS student_count
       FROM classrooms c
       LEFT JOIN system_settings s ON c.setting_id = s.id
       WHERE (c.school_id = $1 OR c.school_id IS NULL) AND c.setting_id = $2
       ORDER BY c.name`,
      [schoolId, settingId]
    );
  } else {
    result = await pool.query(
      `SELECT c.*, s.academic_year, s.term,
        (SELECT COUNT(*) FROM classroom_students cs WHERE cs.classroom_id = c.id AND cs.setting_id = c.setting_id) AS student_count
       FROM classrooms c
       LEFT JOIN system_settings s ON c.setting_id = s.id
       WHERE (c.school_id = $1 OR c.school_id IS NULL)
       ORDER BY s.academic_year DESC, s.term DESC, c.name`,
      [schoolId]
    );
  }

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const permError = await requirePermission(req, "classrooms.create");
  if (permError) return permError;

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId || "00000000-0000-0000-0000-000000000001";

  const { name, name_thai, name_rumi, name_jawi, setting_id } = await req.json();
  if (!name?.trim() || !setting_id) {
    return NextResponse.json({ error: "Missing required fields: name, setting_id" }, { status: 400 });
  }

  const result = await pool.query(
    "INSERT INTO classrooms (name, name_thai, name_rumi, name_jawi, setting_id, school_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [name.trim(), name_thai || null, name_rumi || null, name_jawi || null, setting_id, schoolId]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
