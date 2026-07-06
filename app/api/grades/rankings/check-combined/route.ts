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
    return NextResponse.json({ combined_available: false, settings: [] });
  }

  const { academic_year } = settingRes.rows[0];

  const allTermsRes = await pool.query(
    `SELECT id, term, academic_year FROM system_settings WHERE academic_year = $1 ORDER BY term`,
    [academic_year]
  );

  if (allTermsRes.rows.length < 2) {
    return NextResponse.json({
      combined_available: false,
      settings: allTermsRes.rows,
      reason: "มีแค่ 1 เทอมในปีการศึกษานี้",
    });
  }

  const termKeys = allTermsRes.rows.map((s: any) => `${s.term}/${academic_year}`);
  const settingIds = allTermsRes.rows.map((s: any) => s.id);

  const studentIds = await pool.query(
    `SELECT DISTINCT st.student_id FROM students st
     JOIN classroom_students cs ON cs.student_id = st.id
     WHERE cs.setting_id = ANY($1)`,
    [settingIds]
  );

  if (studentIds.rows.length === 0) {
    return NextResponse.json({
      combined_available: false,
      settings: allTermsRes.rows,
      reason: "ไม่มีนักเรียน",
    });
  }

  const ids = studentIds.rows.map((r: any) => r.student_id);

  const gradeCountRes = await pool.query(
    `SELECT term, COUNT(*) as cnt FROM grades
     WHERE term = ANY($1) AND student_id = ANY($2)
     GROUP BY term`,
    [termKeys, ids]
  );

  const termCounts: Record<string, number> = {};
  for (const r of gradeCountRes.rows) {
    termCounts[r.term] = Number(r.cnt);
  }

  const hasAllTerms = termKeys.every(tk => (termCounts[tk] || 0) > 0);

  return NextResponse.json({
    combined_available: hasAllTerms,
    settings: allTermsRes.rows,
    term_counts: termCounts,
    reason: hasAllTerms ? undefined : "ยังไม่มีคะแนนครบทั้ง 2 เทอม",
  });
}
