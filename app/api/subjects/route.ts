import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const settingId = searchParams.get("settingId");

    const whereClause = settingId ? `WHERE s.setting_id = $1` : "";
    const params = settingId ? [settingId] : [];

    const result = await pool.query(`
      SELECT s.id, s.name, s.teacher_id, s.setting_id, s.midterm_max_score, s.final_max_score,
             s.subject_type, s.credit_hours, s.score_display_mode,
             u.username as teacher_name,
             COALESCE(array_agg(sc.classroom_id) FILTER (WHERE sc.classroom_id IS NOT NULL), '{}') as classroom_ids,
             COALESCE(array_agg(c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as classroom_names
      FROM subjects s
      LEFT JOIN users u ON s.teacher_id = u.id
      LEFT JOIN subject_classrooms sc ON sc.subject_id = s.id
      LEFT JOIN classrooms c ON c.id = sc.classroom_id
      ${whereClause}
      GROUP BY s.id, s.name, s.teacher_id, s.setting_id, s.subject_type, s.credit_hours, s.score_display_mode, u.username
      ORDER BY s.name
    `, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("GET /api/subjects error:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, teacher_id, classroom_ids, setting_id, midterm_max_score, final_max_score, subject_type, credit_hours } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const result = await pool.query(
    "INSERT INTO subjects (name, teacher_id, setting_id, midterm_max_score, final_max_score, subject_type, credit_hours) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [name.trim(), teacher_id || null, setting_id || null, midterm_max_score || null, final_max_score || null, subject_type === "activity" ? "activity" : "main", credit_hours ?? 1]
  );
  const subject = result.rows[0];

  if (Array.isArray(classroom_ids) && classroom_ids.length > 0) {
    const values = classroom_ids.map((_: string, i: number) => `($1, $${i + 2})`).join(", ");
    await pool.query(
      `INSERT INTO subject_classrooms (subject_id, classroom_id) VALUES ${values}`,
      [subject.id, ...classroom_ids]
    );
  }

  return NextResponse.json({ ...subject, classroom_ids: classroom_ids || [] }, { status: 201 });
}
