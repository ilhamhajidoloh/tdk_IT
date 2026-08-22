import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;

  const requestedSchoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id");

  if (context?.isSuperAdmin) {
    schoolId = requestedSchoolId || schoolId;
  } else if (requestedSchoolId && requestedSchoolId !== schoolId) {
    return NextResponse.json({ error: "Forbidden: Cannot access other school's data" }, { status: 403 });
  }

  if (!schoolId) {
    schoolId = "00000000-0000-0000-0000-000000000001";
  }

  const result = await pool.query(
    "SELECT id, date, reason, is_published, applies_to, created_at FROM school_holidays WHERE school_id = $1 ORDER BY date DESC",
    [schoolId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const context = await getSchoolContext();
  let schoolId = context?.schoolId;

  if (context?.isSuperAdmin) {
    schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
  } else if (req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id")) {
    return NextResponse.json({ error: "Forbidden: Cannot access other school's data" }, { status: 403 });
  }

  if (!schoolId) {
    schoolId = "00000000-0000-0000-0000-000000000001";
  }

  const { date, reason, is_published, applies_to } = await req.json();
  if (!date || !reason) {
    return NextResponse.json({ error: "Missing required fields: date, reason" }, { status: 400 });
  }
  try {
    const result = await pool.query(
      "INSERT INTO school_holidays (date, reason, is_published, applies_to, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [date, reason, is_published ?? true, applies_to ?? 'all', schoolId]
    );
    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "วันที่นี้มีวันหยุดพิเศษอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
