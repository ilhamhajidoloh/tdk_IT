import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settingId = req.nextUrl.searchParams.get("settingId");
  if (!settingId) return NextResponse.json({ error: "settingId required" }, { status: 400 });

  const settingRes = await pool.query(
    "SELECT academic_year, term, midterm_max_score, final_max_score FROM system_settings WHERE id = $1",
    [settingId]
  );
  if (settingRes.rows.length === 0) {
    return NextResponse.json({ error: "Setting not found" }, { status: 404 });
  }
  const { academic_year, term: settingTerm, midterm_max_score: defaultMidMax, final_max_score: defaultFinMax } = settingRes.rows[0];
  const termKey = `${settingTerm}/${academic_year}`;

  const subjectsRes = await pool.query(
    `SELECT id, name, subject_type, midterm_max_score, final_max_score, credit_hours
     FROM subjects WHERE setting_id = $1`,
    [settingId]
  );
  const subjects = subjectsRes.rows;

  const studentsRes = await pool.query(
    `SELECT st.id, st.name, st.student_id, st.student_number, st.classroom_id, c.name AS classroom_name
     FROM students st
     JOIN classrooms c ON c.id = st.classroom_id
     WHERE c.setting_id = $1
     ORDER BY c.name, st.student_number NULLS LAST, st.name`,
    [settingId]
  );

  const studentIds = studentsRes.rows.map((s: any) => s.student_id);
  if (studentIds.length === 0) {
    return NextResponse.json([]);
  }

  const gradesRes = await pool.query(
    `SELECT student_id, subject, midterm_score, final_score
     FROM grades WHERE term = $1 AND student_id = ANY($2)`,
    [termKey, studentIds]
  );

  const gradeMap = new Map<string, { subject: string; midterm_score: number | null; final_score: number | null }[]>();
  for (const g of gradesRes.rows) {
    if (!gradeMap.has(g.student_id)) gradeMap.set(g.student_id, []);
    gradeMap.get(g.student_id)!.push({
      subject: g.subject,
      midterm_score: g.midterm_score !== null ? Number(g.midterm_score) : null,
      final_score: g.final_score !== null ? Number(g.final_score) : null,
    });
  }

  const subjectMap = new Map(subjects.map((s: any) => [s.name?.trim().toLowerCase(), s]));

  const studentScores = studentsRes.rows.map((st: any) => {
    const sg = gradeMap.get(st.student_id) || [];
    let totalScore = 0;
    let maxPossible = 0;
    let totalGpaPoints = 0;
    let totalCredits = 0;

    sg.forEach(g => {
      const sub = subjectMap.get(g.subject?.trim().toLowerCase()) as any;
      if (sub?.subject_type === "activity") return;
      const mMax = Number(sub?.midterm_max_score) || Number(defaultMidMax) || 50;
      const fMax = Number(sub?.final_max_score) || Number(defaultFinMax) || 50;
      const credits = Number(sub?.credit_hours) || 1;
      const mid = g.midterm_score ?? 0;
      const fin = g.final_score ?? 0;
      const subTotal = mid + fin;
      const subMax = mMax + fMax;

      totalScore += subTotal;
      maxPossible += subMax;

      const pct = subMax > 0 ? (subTotal / subMax) * 100 : 0;
      let point = 0;
      if (pct >= 80) point = 4;
      else if (pct >= 75) point = 3.5;
      else if (pct >= 70) point = 3;
      else if (pct >= 65) point = 2.5;
      else if (pct >= 60) point = 2;
      else if (pct >= 55) point = 1.5;
      else if (pct >= 50) point = 1;
      totalGpaPoints += point * credits;
      totalCredits += credits;
    });

    const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
    const gpa = totalCredits > 0 ? totalGpaPoints / totalCredits : 0;

    return {
      student_id: st.student_id,
      student_name: st.name,
      student_number: st.student_number,
      classroom_id: st.classroom_id,
      classroom_name: st.classroom_name,
      total_score: totalScore,
      max_possible: maxPossible,
      percentage: Math.round(percentage * 100) / 100,
      gpa: Math.round(gpa * 100) / 100,
      subject_count: sg.filter(g => {
        const sub = subjectMap.get(g.subject?.trim().toLowerCase()) as any;
        return sub?.subject_type !== "activity";
      }).length,
    };
  });

  studentScores.sort((a, b) => b.percentage - a.percentage || b.total_score - a.total_score);
  let schoolRank = 0;
  let prevPct = -1;
  let sameCount = 0;
  for (const s of studentScores) {
    if (s.percentage !== prevPct) {
      schoolRank += 1 + sameCount;
      sameCount = 0;
    } else {
      sameCount++;
    }
    (s as any).school_rank = schoolRank;
    prevPct = s.percentage;
  }

  const classroomGroups = new Map<string, typeof studentScores>();
  for (const s of studentScores) {
    if (!classroomGroups.has(s.classroom_id)) classroomGroups.set(s.classroom_id, []);
    classroomGroups.get(s.classroom_id)!.push(s);
  }
  for (const group of classroomGroups.values()) {
    group.sort((a, b) => b.percentage - a.percentage || b.total_score - a.total_score);
    let rank = 0;
    let prev = -1;
    let same = 0;
    for (const s of group) {
      if (s.percentage !== prev) {
        rank += 1 + same;
        same = 0;
      } else {
        same++;
      }
      (s as any).classroom_rank = rank;
      prev = s.percentage;
    }
  }

  const totalStudents = studentScores.length;
  const result = studentScores.map(s => ({
    ...s,
    school_rank: (s as any).school_rank,
    classroom_rank: (s as any).classroom_rank,
    school_total: totalStudents,
    classroom_total: classroomGroups.get(s.classroom_id)?.length || 0,
  }));

  return NextResponse.json(result);
}
