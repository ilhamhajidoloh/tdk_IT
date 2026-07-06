import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const classroomId = req.nextUrl.searchParams.get("classroomId");
  if (!classroomId) {
    return NextResponse.json({ error: "classroomId is required" }, { status: 400 });
  }
  const result = await pool.query(
    `SELECT st.id, st.name, st.student_id, cs.student_number
     FROM classroom_students cs
     JOIN students st ON st.id = cs.student_id
     WHERE cs.classroom_id = $1
     ORDER BY cs.student_number ASC NULLS LAST, st.name ASC`,
    [classroomId]
  );
  return NextResponse.json(result.rows);
}
