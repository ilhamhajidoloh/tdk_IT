import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settingId = req.nextUrl.searchParams.get("settingId");

  let result;
  if (settingId) {
    result = await pool.query(
      `SELECT c.*, s.academic_year, s.term
       FROM classrooms c
       LEFT JOIN system_settings s ON c.setting_id = s.id
       WHERE c.setting_id = $1
       ORDER BY c.name`,
      [settingId]
    );
  } else {
    result = await pool.query(
      `SELECT c.*, s.academic_year, s.term
       FROM classrooms c
       LEFT JOIN system_settings s ON c.setting_id = s.id
       ORDER BY s.academic_year DESC, s.term DESC, c.name`
    );
  }

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, setting_id } = await req.json();
  if (!name?.trim() || !setting_id) {
    return NextResponse.json({ error: "Missing required fields: name, setting_id" }, { status: 400 });
  }

  const result = await pool.query(
    "INSERT INTO classrooms (name, setting_id) VALUES ($1, $2) RETURNING *",
    [name.trim(), setting_id]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
