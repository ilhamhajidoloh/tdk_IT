import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolFromUrl } from "@/app/lib/getSchoolByParam";

const PUBLIC_CACHE_HEADERS = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };

export async function GET(req: NextRequest) {
  try {
    const subdomain = getSchoolFromUrl(req);

    const schoolResult = await pool.query(
      "SELECT id FROM public.schools WHERE LOWER(subdomain) = LOWER($1) AND is_active = true LIMIT 1",
      [subdomain]
    );
    const schoolId = schoolResult.rows[0]?.id || "00000000-0000-0000-0000-000000000001";
    const settingId = req.nextUrl.searchParams.get("settingId");

    const result = await pool.query(`
      WITH target_setting AS (
        SELECT id FROM system_settings
        WHERE (school_id = $1 OR school_id IS NULL)
          AND (($3::boolean AND id = $2::bigint) OR (NOT $3::boolean AND end_date >= CURRENT_DATE))
        ORDER BY start_date ASC LIMIT 1
      ),
      fallback_setting AS (
        SELECT id FROM system_settings
        WHERE NOT $3::boolean AND (school_id = $1 OR school_id IS NULL)
        ORDER BY end_date DESC LIMIT 1
      ),
      final_setting AS (
        SELECT id FROM target_setting
        UNION ALL
        SELECT id FROM fallback_setting WHERE NOT EXISTS (SELECT 1 FROM target_setting)
      )
      SELECT c.id, c.name, c.name_thai, c.name_rumi, c.name_jawi, c.setting_id,
        COALESCE((SELECT array_agg(cht.teacher_id::text) FROM classroom_homeroom_teachers cht WHERE cht.classroom_id = c.id), ARRAY[]::text[]) AS homeroom_teacher_ids,
        COALESCE((SELECT array_agg(u.username ORDER BY u.username) FROM classroom_homeroom_teachers cht JOIN users u ON u.id = cht.teacher_id WHERE cht.classroom_id = c.id), ARRAY[]::text[]) AS homeroom_teacher_names,
        (SELECT COUNT(*) FROM classroom_students cs WHERE cs.classroom_id = c.id AND cs.setting_id = c.setting_id) AS student_count
      FROM classrooms c
      JOIN final_setting fs ON c.setting_id = fs.id
      WHERE (c.school_id = $1 OR c.school_id IS NULL)
        AND EXISTS (
          SELECT 1 FROM classroom_students cs
          WHERE cs.classroom_id = c.id AND cs.setting_id = c.setting_id
        )
      ORDER BY c.name
    `, [schoolId, settingId || null, Boolean(settingId)]);

    if (result.rows.length === 0) {
      // A requested term must not silently fall back to a different term.
      if (settingId) return NextResponse.json([], { headers: PUBLIC_CACHE_HEADERS });
      const fallback = await pool.query(
        `SELECT id, name, name_thai, name_rumi, name_jawi, setting_id,
          COALESCE((SELECT array_agg(cht.teacher_id::text) FROM classroom_homeroom_teachers cht WHERE cht.classroom_id = classrooms.id), ARRAY[]::text[]) AS homeroom_teacher_ids,
          COALESCE((SELECT array_agg(u.username ORDER BY u.username) FROM classroom_homeroom_teachers cht JOIN users u ON u.id = cht.teacher_id WHERE cht.classroom_id = classrooms.id), ARRAY[]::text[]) AS homeroom_teacher_names,
          (SELECT COUNT(*) FROM classroom_students cs WHERE cs.classroom_id = classrooms.id AND cs.setting_id = classrooms.setting_id) AS student_count
         FROM classrooms
         WHERE (school_id = $1 OR school_id IS NULL)
           AND EXISTS (
             SELECT 1 FROM classroom_students cs
             WHERE cs.classroom_id = classrooms.id AND cs.setting_id = classrooms.setting_id
           )
         ORDER BY name`,
        [schoolId]
      );
      return NextResponse.json(fallback.rows, { headers: PUBLIC_CACHE_HEADERS });
    }

    return NextResponse.json(result.rows, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    console.error("Error fetching public classrooms:", error);
    return NextResponse.json([]);
  }
}
