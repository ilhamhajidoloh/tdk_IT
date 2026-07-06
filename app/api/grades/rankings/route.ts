import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settingId = req.nextUrl.searchParams.get("settingId");
  if (!settingId) return NextResponse.json({ error: "settingId required" }, { status: 400 });

  const mode = req.nextUrl.searchParams.get("mode") || "single";

  const settingRes = await pool.query(
    "SELECT academic_year, term, midterm_max_score, final_max_score FROM system_settings WHERE id = $1",
    [settingId]
  );
  if (settingRes.rows.length === 0) {
    return NextResponse.json({ error: "Setting not found" }, { status: 404 });
  }
  const { academic_year, term: settingTerm, midterm_max_score: defaultMidMax, final_max_score: defaultFinMax } = settingRes.rows[0];

  if (mode === "combined") {
    return handleCombined(settingId, academic_year, defaultMidMax, defaultFinMax);
  }

  const termKey = `${settingTerm}/${academic_year}`;
  return handleSingleTerm(settingId, termKey, defaultMidMax, defaultFinMax);
}

async function handleSingleTerm(settingId: string, termKey: string, defaultMidMax: number, defaultFinMax: number) {
  const [subjectsRes, studentsRes] = await Promise.all([
    pool.query(
      `SELECT id, name, subject_type, midterm_max_score, final_max_score, credit_hours
       FROM subjects WHERE setting_id = $1`,
      [settingId]
    ),
    pool.query(
      `SELECT st.id, st.name, st.student_id, cs.student_number, cs.classroom_id, c.name AS classroom_name
       FROM students st
       JOIN classroom_students cs ON cs.student_id = st.id
       JOIN classrooms c ON c.id = cs.classroom_id
       WHERE cs.setting_id = $1
       ORDER BY c.name, cs.student_number NULLS LAST, st.name`,
      [settingId]
    ),
  ]);
  const subjects = subjectsRes.rows;

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

  const subjectMap = new Map<string, any>(subjects.map((s: any) => [s.name?.trim().toLowerCase(), s]));

  const studentScores = calcStudentScores(studentsRes.rows, gradeMap, subjectMap, defaultMidMax, defaultFinMax);
  const result = assignRanks(studentScores);
  return NextResponse.json(result);
}

async function handleCombined(settingId: string, academicYear: string, defaultMidMax: number, defaultFinMax: number) {
  const bothSettingsRes = await pool.query(
    `SELECT id, term, midterm_max_score, final_max_score FROM system_settings WHERE academic_year = $1 ORDER BY term`,
    [academicYear]
  );

  if (bothSettingsRes.rows.length < 2) {
    return NextResponse.json({ error: "ยังไม่มีข้อมูลครบทั้ง 2 เทอม", combined_available: false }, { status: 400 });
  }

  const settingIds = bothSettingsRes.rows.map((s: any) => s.id);
  const termKeys = bothSettingsRes.rows.map((s: any) => `${s.term}/${academicYear}`);

  const [allSubjectsRes, enrollmentsRes] = await Promise.all([
    pool.query(
      `SELECT id, name, subject_type, midterm_max_score, final_max_score, credit_hours, setting_id
       FROM subjects WHERE setting_id = ANY($1)`,
      [settingIds]
    ),
    pool.query(
      `SELECT st.id, st.name, st.student_id, cs.student_number, cs.classroom_id, cs.setting_id, c.name AS classroom_name
       FROM students st
       JOIN classroom_students cs ON cs.student_id = st.id
       JOIN classrooms c ON c.id = cs.classroom_id
       WHERE cs.setting_id = ANY($1)
       ORDER BY c.name, cs.student_number NULLS LAST, st.name`,
      [settingIds]
    ),
  ]);

  // A student may have changed classrooms between the two terms; keep exactly
  // one row per student for the combined ranking, preferring the later term's
  // classroom for display.
  const latestSettingId = settingIds[settingIds.length - 1];
  const studentRowMap = new Map<string, any>();
  for (const row of enrollmentsRes.rows) {
    const existing = studentRowMap.get(row.student_id);
    if (!existing || row.setting_id === latestSettingId) {
      studentRowMap.set(row.student_id, row);
    }
  }
  const students = Array.from(studentRowMap.values());

  const studentIds = students.map((s: any) => s.student_id);
  if (studentIds.length === 0) {
    return NextResponse.json([]);
  }

  const gradesRes = await pool.query(
    `SELECT student_id, subject, midterm_score, final_score, term
     FROM grades WHERE term = ANY($1) AND student_id = ANY($2)`,
    [termKeys, studentIds]
  );

  const hasT1Grades = gradesRes.rows.some((g: any) => g.term === termKeys[0]);
  const hasT2Grades = gradesRes.rows.some((g: any) => g.term === termKeys[1]);

  if (!hasT1Grades || !hasT2Grades) {
    return NextResponse.json({ error: "ยังไม่มีคะแนนครบทั้ง 2 เทอม", combined_available: false }, { status: 400 });
  }

  const subjectMap = new Map<string, any>();
  for (const s of allSubjectsRes.rows) {
    const key = s.name?.trim().toLowerCase();
    if (!subjectMap.has(key)) {
      subjectMap.set(key, s);
    }
  }

  const gradeMap = new Map<string, { subject: string; midterm_score: number | null; final_score: number | null }[]>();
  const combinedGrades = new Map<string, Map<string, { midterm_total: number; final_total: number; count: number }>>();

  for (const g of gradesRes.rows) {
    if (!combinedGrades.has(g.student_id)) combinedGrades.set(g.student_id, new Map());
    const studentMap = combinedGrades.get(g.student_id)!;
    const subKey = g.subject?.trim().toLowerCase();
    if (!studentMap.has(subKey)) studentMap.set(subKey, { midterm_total: 0, final_total: 0, count: 0 });
    const entry = studentMap.get(subKey)!;
    entry.midterm_total += g.midterm_score !== null ? Number(g.midterm_score) : 0;
    entry.final_total += g.final_score !== null ? Number(g.final_score) : 0;
    entry.count++;
  }

  combinedGrades.forEach((subMap, studentId) => {
    const arr: { subject: string; midterm_score: number | null; final_score: number | null }[] = [];
    subMap.forEach((scores, subKey) => {
      arr.push({
        subject: subKey,
        midterm_score: scores.midterm_total,
        final_score: scores.final_total,
      });
    });
    gradeMap.set(studentId, arr);
  });

  const combinedSubjectMap = new Map<string, any>();
  subjectMap.forEach((sub, key) => {
    const subjectsForName = allSubjectsRes.rows.filter((s: any) => s.name?.trim().toLowerCase() === key);
    const totalMidMax = subjectsForName.reduce((sum: number, s: any) => sum + (Number(s.midterm_max_score) || Number(defaultMidMax) || 50), 0);
    const totalFinMax = subjectsForName.reduce((sum: number, s: any) => sum + (Number(s.final_max_score) || Number(defaultFinMax) || 50), 0);
    combinedSubjectMap.set(key, {
      ...sub,
      midterm_max_score: totalMidMax,
      final_max_score: totalFinMax,
    });
  });

  const combinedDefaultMidMax = Number(defaultMidMax) * 2;
  const combinedDefaultFinMax = Number(defaultFinMax) * 2;

  const studentScores = calcStudentScores(students, gradeMap, combinedSubjectMap, combinedDefaultMidMax, combinedDefaultFinMax);
  const result = assignRanks(studentScores);
  return NextResponse.json(result);
}

function calcStudentScores(
  students: any[],
  gradeMap: Map<string, { subject: string; midterm_score: number | null; final_score: number | null }[]>,
  subjectMap: Map<string, any>,
  defaultMidMax: number,
  defaultFinMax: number
) {
  return students.map((st: any) => {
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
}

function assignRanks(studentScores: any[]) {
  studentScores.sort((a: any, b: any) => b.percentage - a.percentage || b.total_score - a.total_score);
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
    s.school_rank = schoolRank;
    prevPct = s.percentage;
  }

  const classroomGroups = new Map<string, typeof studentScores>();
  for (const s of studentScores) {
    if (!classroomGroups.has(s.classroom_id)) classroomGroups.set(s.classroom_id, []);
    classroomGroups.get(s.classroom_id)!.push(s);
  }
  classroomGroups.forEach(group => {
    group.sort((a: any, b: any) => b.percentage - a.percentage || b.total_score - a.total_score);
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
      s.classroom_rank = rank;
      prev = s.percentage;
    }
  });

  const totalStudents = studentScores.length;
  return studentScores.map((s: any) => ({
    ...s,
    school_total: totalStudents,
    classroom_total: classroomGroups.get(s.classroom_id)?.length || 0,
  }));
}
