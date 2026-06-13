import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET() {
  // หาเป้าหมาย setting_id: 1. ปัจจุบันหรืออนาคตอันใกล้สุด 2. (ถ้าไม่มี) อดีตล่าสุด
  const result = await pool.query(`
    WITH target_setting AS (
      SELECT id FROM system_settings 
      WHERE end_date >= CURRENT_DATE 
      ORDER BY start_date ASC LIMIT 1
    ),
    fallback_setting AS (
      SELECT id FROM system_settings 
      ORDER BY end_date DESC LIMIT 1
    ),
    final_setting AS (
      SELECT id FROM target_setting
      UNION ALL
      SELECT id FROM fallback_setting WHERE NOT EXISTS (SELECT 1 FROM target_setting)
    )
    SELECT c.id, c.name, c.setting_id
    FROM classrooms c
    JOIN final_setting fs ON c.setting_id = fs.id
    ORDER BY c.name
  `);

  // fallback: ถ้ายังไม่มี active setting ให้คืนทั้งหมด
  if (result.rows.length === 0) {
    const fallback = await pool.query("SELECT id, name, setting_id FROM classrooms ORDER BY name");
    return NextResponse.json(fallback.rows);
  }

  return NextResponse.json(result.rows);
}
