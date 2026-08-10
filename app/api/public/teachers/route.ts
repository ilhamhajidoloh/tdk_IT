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

  const result = await pool.query(
    "SELECT id, username FROM users WHERE role = 'teacher' AND (school_id = $1 OR school_id IS NULL) ORDER BY username",
    [schoolId]
  );
  return NextResponse.json(result.rows);
}
