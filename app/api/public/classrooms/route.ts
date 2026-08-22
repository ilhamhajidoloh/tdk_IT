import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolFromUrl } from "@/app/lib/getSchoolByParam";

export async function GET(req: NextRequest) {
  try {
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
      SELECT c.id, c.name, c.name_thai, c.name_rumi, c.name_jawi, c.setting_id,
        (SELECT COUNT(*) FROM classroom_students cs WHERE cs.classroom_id = c.id AND cs.setting_id = c.setting_id) AS student_count
      FROM classrooms c
      JOIN final_setting fs ON c.setting_id = fs.id
      WHERE c.school_id = $1 OR c.school_id IS NULL
      ORDER BY c.name
    `, [schoolId]);

    if (result.rows.length === 0) {
      const fallback = await pool.query(
        `SELECT id, name, name_thai, name_rumi, name_jawi, setting_id,
          (SELECT COUNT(*) FROM classroom_students cs WHERE cs.classroom_id = classrooms.id AND cs.setting_id = classrooms.setting_id) AS student_count
         FROM classrooms WHERE school_id = $1 OR school_id IS NULL ORDER BY name`,
        [schoolId]
      );
      return NextResponse.json(fallback.rows);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching public classrooms:", error);
    return NextResponse.json([]);
  }
}
