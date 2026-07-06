import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjectName = req.nextUrl.searchParams.get("subjectName");
  const classroomId = req.nextUrl.searchParams.get("classroomId");
  const term = req.nextUrl.searchParams.get("term");

  if (!subjectName || !classroomId || !term) {
    return NextResponse.json({ error: "subjectName, classroomId, term required" }, { status: 400 });
  }

  const result = await pool.query(`
    SELECT
      st.id,
      st.name AS student_name,
      st.student_id,
      cs.student_number,
      g.midterm_score,
      g.final_score
    FROM classroom_students cs
    JOIN students st ON st.id = cs.student_id
    LEFT JOIN grades g ON g.student_id = st.student_id AND g.subject = $1 AND g.term = $3
    WHERE cs.classroom_id = $2
    ORDER BY cs.student_number ASC NULLS LAST, st.name ASC
  `, [subjectName, classroomId, term]);

  return NextResponse.json(result.rows.map(row => ({
    ...row,
    midterm_score: row.midterm_score !== null ? Number(row.midterm_score) : null,
    final_score: row.final_score !== null ? Number(row.final_score) : null,
  })));
}
