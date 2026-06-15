import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

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
  };
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const result = await pool.query("SELECT id, academic_year, term, start_date, end_date, midterm_max_score, final_max_score, schedule_days, (CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date) AS is_active FROM system_settings ORDER BY academic_year DESC, term DESC");
  return NextResponse.json(result.rows.map(formatRow));
}

export async function PUT(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const { id, academic_year, term, start_date, end_date, midterm_max_score, final_max_score, schedule_days } = await req.json();

  if (!academic_year || !term || !start_date || !end_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (start_date > end_date) {
    return NextResponse.json({ error: "start_date must not be after end_date" }, { status: 400 });
  }

  const midtermMax = midterm_max_score ?? 50;
  const finalMax = final_max_score ?? 50;
  const days = Array.isArray(schedule_days) ? schedule_days : [1, 2, 3, 4, 5];

  if (id) {
    // Update
    const result = await pool.query(
      `UPDATE system_settings
       SET academic_year = $1, term = $2, start_date = $3, end_date = $4, midterm_max_score = $5, final_max_score = $6, schedule_days = $8
       WHERE id = $7
       RETURNING *`,
      [academic_year, term, start_date, end_date, midtermMax, finalMax, id, JSON.stringify(days)]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Setting not found" }, { status: 444 });
    }
    return NextResponse.json(formatRow(result.rows[0]));
  } else {
    // Create
    const result = await pool.query(
      `INSERT INTO system_settings (academic_year, term, start_date, end_date, midterm_max_score, final_max_score, is_active, schedule_days)
       VALUES ($1, $2, $3, $4, $5, $6, false, $7)
       RETURNING *`,
      [academic_year, term, start_date, end_date, midtermMax, finalMax, JSON.stringify(days)]
    );
    return NextResponse.json(formatRow(result.rows[0]));
  }
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

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

