import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";

// ผลสรุปต่อ (นักเรียน, หมวด, หัวข้อ) = ผลที่ดีที่สุด (MAX rating) จากทุกวิชา/ครูที่เคยประเมิน
export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settingId = req.nextUrl.searchParams.get("settingId");
  const classroomId = req.nextUrl.searchParams.get("classroomId");
  let studentId = req.nextUrl.searchParams.get("studentId");

  if (!settingId) {
    return NextResponse.json({ error: "Missing settingId" }, { status: 400 });
  }

  if (user.role === "student") {
    studentId = user.student_id;
    if (!studentId) return NextResponse.json([], { status: 200 });
  }

  const conditions = ["sub.setting_id = $1"];
  const params: (string | number)[] = [Number(settingId)];

  if (studentId) {
    params.push(studentId);
    conditions.push(`er.student_id = $${params.length}`);
  } else if (classroomId) {
    params.push(classroomId);
    params.push(Number(settingId));
    conditions.push(`er.student_id IN (
      SELECT st.student_id FROM classroom_students cs
      JOIN students st ON st.id = cs.student_id
      WHERE cs.classroom_id = $${params.length - 1} AND cs.setting_id = $${params.length}
    )`);
  }

  const result = await pool.query(
    `SELECT er.student_id, er.category, er.topic_key, MAX(er.rating) AS rating
     FROM evaluation_records er
     JOIN subjects sub ON sub.id = er.subject_id
     WHERE ${conditions.join(" AND ")}
     GROUP BY er.student_id, er.category, er.topic_key`,
    params
  );

  return NextResponse.json(result.rows.map((r) => ({ ...r, rating: Number(r.rating) })));
}
