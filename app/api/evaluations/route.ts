import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";

async function ownsSubject(userId: string, subjectId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM subjects s
     LEFT JOIN subject_teachers st ON st.subject_id = s.id
     WHERE s.id = $1 AND (s.teacher_id = $2 OR st.user_id = $2)
     LIMIT 1`,
    [subjectId, userId]
  );
  return result.rows.length > 0;
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) {
    return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
  }

  if (user.role !== "admin" && !(await ownsSubject(user.id, subjectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    "SELECT id, student_id, subject_id, category, topic_key, rating, term FROM evaluation_records WHERE subject_id = $1",
    [subjectId]
  );
  return NextResponse.json(result.rows);
}

export async function DELETE(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = req.nextUrl.searchParams.get("studentId");
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const term = req.nextUrl.searchParams.get("term");

  if (!studentId || !subjectId || !term) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (user.role !== "admin" && !(await ownsSubject(user.id, subjectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pool.query(
    "DELETE FROM evaluation_records WHERE student_id = $1 AND subject_id = $2 AND term = $3",
    [studentId, subjectId, term]
  );

  return NextResponse.json({ success: true });
}
