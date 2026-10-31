import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureStatusSchema } from "@/app/lib/statusMigration";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function GET(req: NextRequest) {
  try {
    await ensureStatusSchema();
    const context = await getSchoolContext(req);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const settingId = searchParams.get("settingId");

    if (!settingId) {
      return NextResponse.json({ error: "settingId is required" }, { status: 400 });
    }

    let schoolId = context.schoolId;
    if (context.isSuperAdmin && searchParams.get("schoolId")) {
      schoolId = searchParams.get("schoolId");
    }
    if (!schoolId) {
      schoolId = "00000000-0000-0000-0000-000000000001";
    }

    const query = `
      SELECT 
        u.id, 
        u.username AS name, 
        u.email,
        u.color,
        tts.signature_key,
        tts.updated_at,
        CASE WHEN tts.signature_key IS NOT NULL THEN true ELSE false END AS has_term_signature
      FROM users u
      LEFT JOIN teacher_term_signatures tts 
        ON tts.user_id = u.id AND tts.setting_id = $1
      WHERE u.role = 'teacher' 
        AND COALESCE(u.status, 'active') != 'resigned'
        AND (u.school_id = $2 OR u.school_id IS NULL)
      ORDER BY u.username ASC
    `;

    const result = await pool.query(query, [settingId, schoolId]);

    const teachers = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      color: row.color,
      has_signature: row.has_term_signature,
      signature_url: row.has_term_signature
        ? `/api/signatures/proxy?type=teacher&id=${row.id}&settingId=${settingId}`
        : null,
      updated_at: row.updated_at,
    }));

    return NextResponse.json(teachers);
  } catch (error: unknown) {
    console.error("Error fetching term teachers signatures:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers", details: (error as Error).message },
      { status: 500 }
    );
  }
}

