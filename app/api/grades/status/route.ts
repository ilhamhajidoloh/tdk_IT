import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settingId = req.nextUrl.searchParams.get("settingId");
  if (!settingId) return NextResponse.json({ error: "settingId required" }, { status: 400 });

  const settingRes = await pool.query(
    "SELECT academic_year, term FROM system_settings WHERE id = $1",
    [settingId]
  );
  if (settingRes.rows.length === 0) {
    return NextResponse.json({ error: "Setting not found" }, { status: 404 });
  }
  const { academic_year, term: settingTerm } = settingRes.rows[0];
  const termKey = `${settingTerm}/${academic_year}`;

  const result = await pool.query(`
    SELECT
      s.id AS subject_id,
      s.name AS subject_name,
      s.subject_type,
      s.midterm_max_score,
      s.final_max_score,
      s.credit_hours,
      u.id AS teacher_id,
      u.username AS teacher_name,
      sc.classroom_id,
      c.name AS classroom_name,
      COUNT(st.id) AS total_students,
      COUNT(g.id) AS graded_students,
      COUNT(CASE WHEN g.midterm_score IS NOT NULL THEN 1 END) AS midterm_entered,
      COUNT(CASE WHEN g.final_score IS NOT NULL THEN 1 END) AS final_entered
    FROM subjects s
    LEFT JOIN subject_teachers stch ON stch.subject_id = s.id
    LEFT JOIN users u ON u.id = stch.user_id
    LEFT JOIN subject_classrooms sc ON sc.subject_id = s.id
    LEFT JOIN classrooms c ON c.id = sc.classroom_id
    LEFT JOIN students st ON st.classroom_id = sc.classroom_id
    LEFT JOIN grades g ON g.student_id = st.student_id AND g.subject = s.name AND g.term = $2
    WHERE s.setting_id = $1
      AND (COALESCE(s.midterm_max_score, 0) + COALESCE(s.final_max_score, 0)) > 0
    GROUP BY s.id, s.name, s.subject_type, s.midterm_max_score, s.final_max_score, s.credit_hours,
             u.id, u.username, sc.classroom_id, c.name
    ORDER BY u.username NULLS LAST, s.name, c.name
  `, [settingId, termKey]);

  return NextResponse.json(result.rows);
}
