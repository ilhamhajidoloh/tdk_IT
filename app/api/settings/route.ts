import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureStatusSchema } from "@/app/lib/statusMigration";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { requirePermission } from "@/app/lib/permissions/middleware";
import { verifyUser } from "@/app/lib/verifyUser";

function formatRow(row: Record<string, unknown>) {
  if (!row) return row;
  return {
    ...row,
    start_date: row.start_date instanceof Date
      ? row.start_date.toISOString().split("T")[0]
      : row.start_date ?? null,
    end_date: row.end_date instanceof Date
      ? row.end_date.toISOString().split("T")[0]
      : row.end_date ?? null,
    midterm_max_score: Number(row.midterm_max_score ?? 50),
    final_max_score: Number(row.final_max_score ?? 50),
    schedule_days: Array.isArray(row.schedule_days) ? row.schedule_days : [1, 2, 3, 4, 5],
    highest_grade_level: row.highest_grade_level ?? "",
    data_retention_years: Number(row.data_retention_years ?? 5),
    auto_cleanup_enabled: row.auto_cleanup_enabled !== false,
    is_grade_released: row.is_grade_released !== false,
    grade_release_date: row.grade_release_date ? String(row.grade_release_date) : null,
  };
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;

  const requestedSchoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id");

  if (context?.isSuperAdmin) {
    schoolId = requestedSchoolId || schoolId;
  } else if (requestedSchoolId && requestedSchoolId !== schoolId) {
    return NextResponse.json({ error: "Forbidden: Cannot access other school's data" }, { status: 403 });
  }

  if (!schoolId) {
    schoolId = "00000000-0000-0000-0000-000000000001";
  }

  await ensureStatusSchema();
  const result = await pool.query(
    "SELECT id, academic_year, term, start_date, end_date, academic_head, midterm_max_score, final_max_score, schedule_days, highest_grade_level, data_retention_years, auto_cleanup_enabled, is_grade_released, grade_release_date, (CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date) AS is_active FROM system_settings WHERE school_id = $1 OR school_id IS NULL ORDER BY academic_year DESC, term DESC",
    [schoolId]
  );
  return NextResponse.json(result.rows.map(formatRow));
}

export async function PUT(req: NextRequest) {
  const permError = await requirePermission(req, "settings.edit");
  if (permError) return permError;

  await ensureStatusSchema();
  const {
    id,
    academic_year,
    term,
    start_date,
    end_date,
    academic_head,
    midterm_max_score,
    final_max_score,
    schedule_days,
    highest_grade_level,
    data_retention_years,
    auto_cleanup_enabled,
    is_grade_released,
    grade_release_date,
  } = await req.json();

  if (!academic_year || !term || !start_date || !end_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (start_date > end_date) {
    return NextResponse.json({ error: "start_date must not be after end_date" }, { status: 400 });
  }

  const midtermMax = midterm_max_score ?? 50;
  const finalMax = final_max_score ?? 50;
  const days = Array.isArray(schedule_days) ? schedule_days : [1, 2, 3, 4, 5];
  const highestLevel = highest_grade_level || "ม.6";
  const retentionYears = Number(data_retention_years ?? 5);
  const autoCleanup = auto_cleanup_enabled !== false;
  const isReleased = is_grade_released !== false;
  const releaseDate = grade_release_date ? String(grade_release_date) : null;
  const academicHeadValue = academic_head || null;

  if (id) {
    // Update
    const result = await pool.query(
      `UPDATE system_settings
       SET academic_year = $1, term = $2, start_date = $3, end_date = $4, academic_head = $5, midterm_max_score = $6, final_max_score = $7, schedule_days = $9, highest_grade_level = $10, data_retention_years = $11, auto_cleanup_enabled = $12, is_grade_released = $13, grade_release_date = $14
       WHERE id = $8
       RETURNING *`,
      [academic_year, term, start_date, end_date, academicHeadValue, midtermMax, finalMax, id, JSON.stringify(days), highestLevel, retentionYears, autoCleanup, isReleased, releaseDate]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Setting not found" }, { status: 444 });
    }
    return NextResponse.json(formatRow(result.rows[0]));
  } else {
    // Create
    const result = await pool.query(
      `INSERT INTO system_settings (academic_year, term, start_date, end_date, academic_head, midterm_max_score, final_max_score, is_active, schedule_days, highest_grade_level, data_retention_years, auto_cleanup_enabled, is_grade_released, grade_release_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [academic_year, term, start_date, end_date, academicHeadValue, midtermMax, finalMax, JSON.stringify(days), highestLevel, retentionYears, autoCleanup, isReleased, releaseDate]
    );
    return NextResponse.json(formatRow(result.rows[0]));
  }
}

export async function DELETE(req: NextRequest) {
  const permError = await requirePermission(req, "settings.academic_year");
  if (permError) return permError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  // ตรวจสอบว่ากำลังลบปีการศึกษาที่ใช้อยู่หรือไม่
  const checkActive = await pool.query("SELECT (CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date) AS is_active FROM system_settings WHERE id = $1", [id]);
  if (checkActive.rows.length > 0 && checkActive.rows[0].is_active) {
    return NextResponse.json({ error: "Cannot delete the active academic year" }, { status: 400 });
  }

  // ห้ามลบถ้ายังมีห้องเรียน/วิชา/คาบเรียนผูกอยู่กับปีการศึกษานี้
  const classroomCheck = await pool.query("SELECT 1 FROM classrooms WHERE setting_id = $1 LIMIT 1", [id]);
  if (classroomCheck.rows.length > 0) {
    return NextResponse.json({ error: "Cannot delete an academic year that still has classrooms" }, { status: 400 });
  }

  const subjectCheck = await pool.query("SELECT 1 FROM subjects WHERE setting_id = $1 LIMIT 1", [id]);
  if (subjectCheck.rows.length > 0) {
    return NextResponse.json({ error: "Cannot delete an academic year that still has subjects" }, { status: 400 });
  }

  const periodCheck = await pool.query("SELECT 1 FROM schedule_periods WHERE setting_id = $1 LIMIT 1", [id]);
  if (periodCheck.rows.length > 0) {
    return NextResponse.json({ error: "Cannot delete an academic year that still has schedule periods" }, { status: 400 });
  }

  await pool.query("DELETE FROM system_settings WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}

