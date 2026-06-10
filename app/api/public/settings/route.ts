import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET() {
  const result = await pool.query("SELECT * FROM system_settings WHERE is_active = true LIMIT 1");
  if (result.rows.length === 0) {
    const fallback = await pool.query("SELECT * FROM system_settings ORDER BY id ASC LIMIT 1");
    if (fallback.rows.length === 0) {
      return NextResponse.json({ academic_year: "2568", term: "1" });
    }
    return NextResponse.json(fallback.rows[0]);
  }
  return NextResponse.json(result.rows[0]);
}
