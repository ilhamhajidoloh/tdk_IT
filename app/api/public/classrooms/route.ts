import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolFromUrl } from "@/app/lib/getSchoolByParam";

export async function GET(req: NextRequest) {
  const subdomain = getSchoolFromUrl(req);

  const schoolResult = await pool.query(
    "SELECT id FROM public.schools WHERE LOWER(subdomain) = LOWER($1) AND is_active = true LIMIT 1",
    [subdomain]
  );
  const schoolId = schoolResult.rows[0]?.id || "00000000-0000-0000-0000-000000000001";

  const result = await pool.query(`
    WITH target_setting AS (
      SELECT id FROM system_settings
      WHERE end_date >= CURRENT_DATE AND (school_id = $1 OR school_id IS NULL)
      ORDER BY start_date ASC LIMIT 1
    ),
    fallback_setting AS (
      SELECT id FROM system_settings
      WHERE (school_id = $1 OR school_id IS NULL)
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
    WHERE c.school_id = $1 OR c.school_id IS NULL
    ORDER BY c.name
  `, [schoolId]);

  if (result.rows.length === 0) {
    const fallback = await pool.query(
      "SELECT id, name, setting_id FROM classrooms WHERE school_id = $1 OR school_id IS NULL ORDER BY name",
      [schoolId]
    );
    return NextResponse.json(fallback.rows);
  }

  return NextResponse.json(result.rows);
}
