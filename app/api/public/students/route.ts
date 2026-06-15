import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const classroomId = req.nextUrl.searchParams.get("classroomId");
  if (!classroomId) {
    return NextResponse.json({ error: "classroomId is required" }, { status: 400 });
  }
  const result = await pool.query(
    "SELECT id, name, student_id, student_number FROM students WHERE classroom_id = $1 ORDER BY student_number ASC NULLS LAST, name ASC",
    [classroomId]
  );
  return NextResponse.json(result.rows);
}
