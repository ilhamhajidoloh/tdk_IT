import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET() {
  // ดึง classrooms ของ active setting
  const result = await pool.query(`
    SELECT c.id, c.name, c.setting_id
    FROM classrooms c
    JOIN system_settings s ON c.setting_id = s.id
    WHERE s.is_active = true
    ORDER BY c.name
  `);

  // fallback: ถ้ายังไม่มี active setting ให้คืนทั้งหมด
  if (result.rows.length === 0) {
    const fallback = await pool.query("SELECT id, name, setting_id FROM classrooms ORDER BY name");
    return NextResponse.json(fallback.rows);
  }

  return NextResponse.json(result.rows);
}
