import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import pool from "@/app/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: string;
  let role: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userResult = await pool.query(
      "SELECT id, role FROM users WHERE firebase_uid = $1",
      [decoded.uid]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = userResult.rows[0].id;
    role = userResult.rows[0].role;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { score_display_mode } = await req.json();
  if (score_display_mode !== "separate" && score_display_mode !== "combined") {
    return NextResponse.json({ error: "Invalid score_display_mode" }, { status: 400 });
  }

  const { id } = await params;

  const subjectResult = await pool.query("SELECT teacher_id, subject_type FROM subjects WHERE id = $1", [id]);
  if (subjectResult.rows.length === 0) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }
  const subject = subjectResult.rows[0];

  if (role !== "admin" && subject.teacher_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (subject.subject_type !== "activity") {
    return NextResponse.json({ error: "Only activity subjects support score display mode" }, { status: 400 });
  }

  const result = await pool.query(
    "UPDATE subjects SET score_display_mode = $1 WHERE id = $2 RETURNING *",
    [score_display_mode, id]
  );

  return NextResponse.json(result.rows[0]);
}
