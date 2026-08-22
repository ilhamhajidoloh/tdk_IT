import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function GET(req: NextRequest) {
  if (!(await verifyUser(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;
  if (context?.isSuperAdmin) {
    schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
  }
  if (!schoolId) schoolId = "00000000-0000-0000-0000-000000000001";

  const result = await pool.query(
    "SELECT id, name_th, name_rumi, name_jawi, sort_order, is_active FROM evaluation_topics WHERE school_id = $1 ORDER BY sort_order, created_at",
    [schoolId]
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;
  if (context?.isSuperAdmin) {
    schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
  }
  if (!schoolId) schoolId = "00000000-0000-0000-0000-000000000001";

  const { name_th, name_rumi, name_jawi } = await req.json();
  if (!name_th?.trim()) {
    return NextResponse.json({ error: "Missing name_th" }, { status: 400 });
  }

  const maxOrderResult = await pool.query(
    "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM evaluation_topics WHERE school_id = $1",
    [schoolId]
  );
  const nextOrder = Number(maxOrderResult.rows[0].max_order) + 1;

  const result = await pool.query(
    `INSERT INTO evaluation_topics (name_th, name_rumi, name_jawi, sort_order, school_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name_th, name_rumi, name_jawi, sort_order, is_active`,
    [name_th.trim(), name_rumi?.trim() || null, name_jawi?.trim() || null, nextOrder, schoolId]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
