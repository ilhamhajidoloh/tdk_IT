import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

function formatRow(row: Record<string, unknown> | undefined) {
  if (!row) {
    return {
      teacher_anchor_date: "2026-05-18",
      cook_anchor_date: "2026-05-18",
      teacher_anchor_offset: 0,
      cook_anchor_offset: 0,
    };
  }
  return {
    teacher_anchor_date: row.teacher_anchor_date instanceof Date
      ? row.teacher_anchor_date.toISOString().split("T")[0]
      : row.teacher_anchor_date,
    cook_anchor_date: row.cook_anchor_date instanceof Date
      ? row.cook_anchor_date.toISOString().split("T")[0]
      : row.cook_anchor_date,
    teacher_anchor_offset: Number(row.teacher_anchor_offset ?? 0),
    cook_anchor_offset: Number(row.cook_anchor_offset ?? 0),
  };
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const context = await getSchoolContext();
  let schoolId = context?.schoolId;
  if (context?.isSuperAdmin) {
    schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
  }
  if (!schoolId) schoolId = "00000000-0000-0000-0000-000000000001";

  const result = await pool.query(
    "SELECT teacher_anchor_date, cook_anchor_date, teacher_anchor_offset, cook_anchor_offset FROM duty_settings WHERE school_id = $1 OR school_id IS NULL ORDER BY id LIMIT 1",
    [schoolId]
  );
  return NextResponse.json(formatRow(result.rows[0]));
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const context = await getSchoolContext();
  let schoolId = context?.schoolId;
  if (context?.isSuperAdmin) {
    schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
  }
  if (!schoolId) schoolId = "00000000-0000-0000-0000-000000000001";

  const { teacher_anchor_date, cook_anchor_date, teacher_anchor_offset, cook_anchor_offset } = await req.json();
  if (!teacher_anchor_date || !cook_anchor_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO duty_settings (id, teacher_anchor_date, cook_anchor_date, teacher_anchor_offset, cook_anchor_offset, school_id)
     VALUES (1, $1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE
     SET teacher_anchor_date = EXCLUDED.teacher_anchor_date,
         cook_anchor_date = EXCLUDED.cook_anchor_date,
         teacher_anchor_offset = EXCLUDED.teacher_anchor_offset,
         cook_anchor_offset = EXCLUDED.cook_anchor_offset,
         school_id = EXCLUDED.school_id
     RETURNING *`,
    [teacher_anchor_date, cook_anchor_date, teacher_anchor_offset ?? 0, cook_anchor_offset ?? 0, schoolId]
  );
  return NextResponse.json(formatRow(result.rows[0]));
}
