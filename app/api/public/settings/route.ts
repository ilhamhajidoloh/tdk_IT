import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

function formatRow(row: Record<string, unknown>) {
  return {
    ...row,
    midterm_max_score: Number(row.midterm_max_score ?? 50),
    final_max_score: Number(row.final_max_score ?? 50),
    schedule_days: Array.isArray(row.schedule_days) ? row.schedule_days : [1, 2, 3, 4, 5],
  };
}

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all");
  if (all === "true") {
    const result = await pool.query("SELECT id, academic_year, term, start_date, end_date, midterm_max_score, final_max_score, schedule_days, (CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date) AS is_active FROM system_settings ORDER BY academic_year DESC, term DESC");
    return NextResponse.json(result.rows.map(formatRow));
  }

  // Find the active term or the NEXT upcoming term
  const result = await pool.query(`
    SELECT id, academic_year, term, start_date, end_date, midterm_max_score, final_max_score, schedule_days, 
           (CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date) AS is_active 
    FROM system_settings 
    WHERE end_date >= CURRENT_DATE 
    ORDER BY start_date ASC 
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    // Fallback: If no current or future term, get the latest past term
    const fallback = await pool.query(`
      SELECT id, academic_year, term, start_date, end_date, midterm_max_score, final_max_score, schedule_days, 
             false AS is_active 
      FROM system_settings 
      ORDER BY end_date DESC 
      LIMIT 1
    `);
    if (fallback.rows.length === 0) {
      return NextResponse.json({ academic_year: "2568", term: "1", midterm_max_score: 50, final_max_score: 50, is_active: false });
    }
    return NextResponse.json(formatRow(fallback.rows[0]));
  }
  return NextResponse.json(formatRow(result.rows[0]));
}
