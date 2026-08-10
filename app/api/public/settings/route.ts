import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolFromUrl } from "@/app/lib/getSchoolByParam";

function formatRow(row: Record<string, unknown>) {
  return {
    ...row,
    midterm_max_score: Number(row.midterm_max_score ?? 50),
    final_max_score: Number(row.final_max_score ?? 50),
    schedule_days: Array.isArray(row.schedule_days) ? row.schedule_days : [1, 2, 3, 4, 5],
    is_grade_released: row.is_grade_released !== false,
    grade_release_date: row.grade_release_date ? String(row.grade_release_date) : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const subdomain = getSchoolFromUrl(req);

    const schoolResult = await pool.query(
      "SELECT id FROM public.schools WHERE LOWER(subdomain) = LOWER($1) AND is_active = true LIMIT 1",
      [subdomain]
    );
    const schoolId = schoolResult.rows[0]?.id || "00000000-0000-0000-0000-000000000001";

    const all = req.nextUrl.searchParams.get("all");
    if (all === "true") {
      const result = await pool.query(
        "SELECT id, academic_year, term, start_date, end_date, midterm_max_score, final_max_score, schedule_days, is_grade_released, grade_release_date, (CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date) AS is_active FROM system_settings WHERE school_id = $1 OR school_id IS NULL ORDER BY academic_year DESC, term DESC",
        [schoolId]
      );
      return NextResponse.json(result.rows.map(formatRow));
    }

    // Find active term or next upcoming term
    const result = await pool.query(`
      SELECT id, academic_year, term, start_date, end_date, midterm_max_score, final_max_score, schedule_days, is_grade_released, grade_release_date,
             (CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date) AS is_active
      FROM system_settings
      WHERE end_date >= CURRENT_DATE AND (school_id = $1 OR school_id IS NULL)
      ORDER BY start_date ASC
      LIMIT 1
    `, [schoolId]);

    if (result.rows.length === 0) {
      const fallback = await pool.query(`
        SELECT id, academic_year, term, start_date, end_date, midterm_max_score, final_max_score, schedule_days, is_grade_released, grade_release_date,
               false AS is_active
        FROM system_settings
        WHERE school_id = $1 OR school_id IS NULL
        ORDER BY end_date DESC
        LIMIT 1
      `, [schoolId]);
      if (fallback.rows.length === 0) {
        return NextResponse.json({ academic_year: "2569", term: "1", midterm_max_score: 50, final_max_score: 50, is_active: false, is_grade_released: true, grade_release_date: null });
      }
      return NextResponse.json(formatRow(fallback.rows[0]));
    }
    return NextResponse.json(formatRow(result.rows[0]));
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return NextResponse.json({ academic_year: "2569", term: "1", midterm_max_score: 50, final_max_score: 50, is_active: false, is_grade_released: true, grade_release_date: null });
  }
}
