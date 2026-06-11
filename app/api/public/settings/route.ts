import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

function formatRow(row: Record<string, unknown>) {
  return {
    ...row,
    midterm_max_score: Number(row.midterm_max_score ?? 50),
    final_max_score: Number(row.final_max_score ?? 50),
    schedule_days: Array.isArray(row.schedule_days) ? row.schedule_days : [1, 2, 3, 4, 5],
  };
}

export async function GET() {
  const result = await pool.query("SELECT * FROM system_settings WHERE is_active = true LIMIT 1");
  if (result.rows.length === 0) {
    const fallback = await pool.query("SELECT * FROM system_settings ORDER BY id ASC LIMIT 1");
    if (fallback.rows.length === 0) {
      return NextResponse.json({ academic_year: "2568", term: "1", midterm_max_score: 50, final_max_score: 50 });
    }
    return NextResponse.json(formatRow(fallback.rows[0]));
  }
  return NextResponse.json(formatRow(result.rows[0]));
}
