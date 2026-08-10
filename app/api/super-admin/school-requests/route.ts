import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function GET() {
  const context = await getSchoolContext();
  if (!context?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT id, requested_by, requester_username, requester_email, school_name, school_name_en,
            subdomain, logo_url, address, phone, email, requested_modules, reason, status,
            review_note, created_at, reviewed_at
     FROM public.school_creation_requests
     ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, created_at DESC`
  );
  return NextResponse.json(result.rows);
}
