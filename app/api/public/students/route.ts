import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolFromUrl } from "@/app/lib/getSchoolByParam";

export async function GET(req: NextRequest) {
  const classroomId = req.nextUrl.searchParams.get("classroomId");
  if (!classroomId) {
    return NextResponse.json({ error: "classroomId is required" }, { status: 400 });
  }

  const subdomain = getSchoolFromUrl(req);

  const schoolResult = await pool.query(
    "SELECT id FROM public.schools WHERE LOWER(subdomain) = LOWER($1) AND is_active = true LIMIT 1",
    [subdomain]
  );
  const schoolId = schoolResult.rows[0]?.id || "00000000-0000-0000-0000-000000000001";

  const result = await pool.query(
    `SELECT st.id, st.name, st.student_id, cs.student_number
     FROM classroom_students cs
     JOIN students st ON st.id = cs.student_id
     WHERE cs.classroom_id = $1 AND (cs.school_id = $2 OR cs.school_id IS NULL)
     ORDER BY cs.student_number ASC NULLS LAST, st.name ASC`,
    [classroomId, schoolId]
  );
  return NextResponse.json(result.rows);
}
