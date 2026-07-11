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

// สรุปจำนวนครั้ง มา/ขาด/สาย/ลา ของนักเรียนแต่ละคน ต่อวิชา+เทอม
export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const term = req.nextUrl.searchParams.get("term");
  const classroomId = req.nextUrl.searchParams.get("classroomId");
  if (!subjectId || !term) {
    return NextResponse.json({ error: "Missing subjectId or term" }, { status: 400 });
  }

  if (user.role !== "admin" && !(await ownsSubject(user.id, subjectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conditions = ["subject_id = $1", "term = $2"];
  const params: string[] = [subjectId, term];
  if (classroomId) {
    params.push(classroomId);
    conditions.push(`classroom_id = $${params.length}`);
  }

  const result = await pool.query(
    `SELECT student_id,
       COUNT(*) FILTER (WHERE status = 'present') AS present,
       COUNT(*) FILTER (WHERE status = 'absent') AS absent,
       COUNT(*) FILTER (WHERE status = 'late') AS late,
       COUNT(*) FILTER (WHERE status = 'leave') AS leave,
       COUNT(*) AS total
     FROM attendance_records
     WHERE ${conditions.join(" AND ")}
     GROUP BY student_id`,
    params
  );

  return NextResponse.json(
    result.rows.map((r) => ({
      student_id: r.student_id,
      present: Number(r.present),
      absent: Number(r.absent),
      late: Number(r.late),
      leave: Number(r.leave),
      total: Number(r.total),
    }))
  );
}
