import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { verifyUser } from "@/app/lib/verifyUser";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settingId = req.nextUrl.searchParams.get("settingId");
    if (!settingId) return NextResponse.json({ error: "settingId required" }, { status: 400 });

    // Ensure column exists
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS subject_display_names JSONB DEFAULT '{}'::jsonb");

    const settingRes = await pool.query(
      "SELECT academic_year, term, midterm_max_score, final_max_score, subject_display_names, school_id FROM system_settings WHERE id = $1",
      [settingId]
    );
    if (settingRes.rows.length === 0) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    const { academic_year, term: settingTerm, midterm_max_score: defaultMidMax, final_max_score: defaultFinMax, subject_display_names, school_id: settingSchoolId } = settingRes.rows[0];
    const termKey = `${settingTerm}/${academic_year}`;

    let schoolNameTh = "";
    if (settingSchoolId) {
      const sRes = await pool.query("SELECT name FROM public.schools WHERE id = $1", [settingSchoolId]);
      if (sRes.rows.length > 0) schoolNameTh = sRes.rows[0].name || "";
    }
    if (!schoolNameTh) {
      const sRes = await pool.query("SELECT name FROM public.schools WHERE is_active = true ORDER BY created_at ASC LIMIT 1");
      if (sRes.rows.length > 0) schoolNameTh = sRes.rows[0].name || "";
    }

    // 1. Fetch Classrooms, Subjects, Students, and Grades
    const [classroomsRes, subjectsRes, subjectClassroomsRes, studentsRes, translationsRes] = await Promise.all([
      pool.query(
        "SELECT id, name, name_thai, name_rumi, name_jawi FROM classrooms WHERE setting_id = $1 ORDER BY name",
        [settingId]
      ),
      pool.query(
        `SELECT id, name, subject_type, midterm_max_score, final_max_score, credit_hours, sort_order 
         FROM subjects WHERE setting_id = $1 ORDER BY COALESCE(sort_order, 999) ASC, name ASC`,
        [settingId]
      ),
      pool.query(
        `SELECT sc.subject_id, sc.classroom_id
         FROM subject_classrooms sc
         JOIN subjects s ON s.id = sc.subject_id
         WHERE s.setting_id = $1
           AND COALESCE(sc.score_enabled, TRUE) = TRUE`,
        [settingId]
      ),
      pool.query(
        `SELECT st.id, st.name, st.student_id, cs.classroom_id, c.name AS classroom_name
         FROM students st
         JOIN classroom_students cs ON cs.student_id = st.id
         JOIN classrooms c ON c.id = cs.classroom_id
         WHERE cs.setting_id = $1`,
        [settingId]
      ),
      pool.query("SELECT key, thai, malay_rumi, malay_jawi FROM translations"),
    ]);

    const includeActivity = req.nextUrl.searchParams.get("includeActivity") === "true";

    const classrooms = classroomsRes.rows;
    // Include only subjects with configured scores. Scoreless activities and
    // scoreless subjects must not appear in the achievement report.
    const scoreEnabledClassroomsBySubject = new Map<string, Set<string>>();
    subjectClassroomsRes.rows.forEach((row: any) => {
      if (!scoreEnabledClassroomsBySubject.has(row.subject_id)) {
        scoreEnabledClassroomsBySubject.set(row.subject_id, new Set());
      }
      scoreEnabledClassroomsBySubject.get(row.subject_id)!.add(row.classroom_id);
    });

    let subjects = subjectsRes.rows.filter((subject: any) => {
      const midMax = subject.midterm_max_score !== null ? Number(subject.midterm_max_score) : Number(defaultMidMax) || 50;
      const finalMax = subject.final_max_score !== null ? Number(subject.final_max_score) : Number(defaultFinMax) || 50;
      // An activity with both maximum-score fields unset is a scoreless
      // activity. Do not fall back to the term defaults for this case.
      const activityHasScores =
        subject.subject_type !== "activity" ||
        ((subject.midterm_max_score !== null || subject.final_max_score !== null) &&
          Number(subject.midterm_max_score || 0) + Number(subject.final_max_score || 0) > 0);
      // Activity subjects must have at least one classroom where score entry is
      // enabled. This prevents activities configured as "ไม่เก็บคะแนน" from
      // being pulled into the report when the activity toggle is on.
      return activityHasScores && midMax + finalMax > 0 && (
        subject.subject_type !== "activity" ||
        (scoreEnabledClassroomsBySubject.get(subject.id)?.size ?? 0) > 0
      );
    });
    if (!includeActivity) {
      subjects = subjects.filter((subject: any) => subject.subject_type !== "activity");
    }

    const mergedDisplayNames: Record<string, any> = { ...(subject_display_names || {}) };
    translationsRes.rows.forEach((t: any) => {
      const entry = {
        thai: t.thai || t.key,
        rumi: t.malay_rumi || "",
        arabic: t.malay_jawi || "",
      };
      if (t.key) mergedDisplayNames[t.key] = { ...entry, ...(typeof mergedDisplayNames[t.key] === "object" ? mergedDisplayNames[t.key] : {}) };
      if (t.thai) mergedDisplayNames[t.thai] = { ...entry, ...(typeof mergedDisplayNames[t.thai] === "object" ? mergedDisplayNames[t.thai] : {}) };
    });

    subjects.forEach((s: any) => {
      const t = translationsRes.rows.find((tr: any) =>
        tr.key === s.name ||
        tr.key === `subj_${s.id}` ||
        (tr.thai && tr.thai.trim().toLowerCase() === s.name.trim().toLowerCase()) ||
        (tr.malay_rumi && tr.malay_rumi.trim().toLowerCase() === s.name.trim().toLowerCase()) ||
        (tr.malay_jawi && tr.malay_jawi.trim().toLowerCase() === s.name.trim().toLowerCase())
      );
      if (t) {
        const entry = {
          thai: t.thai || s.name,
          rumi: t.malay_rumi || "",
          arabic: t.malay_jawi || "",
        };
        mergedDisplayNames[s.id] = { ...entry, ...(typeof mergedDisplayNames[s.id] === "object" ? mergedDisplayNames[s.id] : {}) };
        mergedDisplayNames[s.name] = { ...entry, ...(typeof mergedDisplayNames[s.name] === "object" ? mergedDisplayNames[s.name] : {}) };
      }
    });
    const students = studentsRes.rows;

    const studentIds = students.map((s: any) => s.student_id);
    let grades: any[] = [];
    if (studentIds.length > 0) {
      const gradesRes = await pool.query(
        `SELECT student_id, subject, midterm_score, final_score 
         FROM grades WHERE term = $1 AND student_id = ANY($2)`,
        [termKey, studentIds]
      );
      grades = gradesRes.rows;
    }

    // Map student_id -> classroom_id
    const studentClassroomMap = new Map<string, string>();
    const classroomStudentsMap = new Map<string, string[]>(); // classroomId -> array of student_ids

    students.forEach((s: any) => {
      studentClassroomMap.set(s.student_id, s.classroom_id);
      if (!classroomStudentsMap.has(s.classroom_id)) {
        classroomStudentsMap.set(s.classroom_id, []);
      }
      classroomStudentsMap.get(s.classroom_id)!.push(s.student_id);
    });

    // Map (student_id + '_' + subject_name_normalized) -> totalScore
    const gradeScoreMap = new Map<string, number>();
    grades.forEach((g: any) => {
      const subjKey = g.subject ? g.subject.trim().toLowerCase() : "";
      const key = `${g.student_id}_${subjKey}`;
      const mid = g.midterm_score !== null ? Number(g.midterm_score) : 0;
      const fin = g.final_score !== null ? Number(g.final_score) : 0;
      gradeScoreMap.set(key, mid + fin);
    });

    // Calculate maximum score per subject
    const subjectMaxMap = new Map<string, number>();
    subjects.forEach((s: any) => {
      const midMax = s.midterm_max_score !== null ? Number(s.midterm_max_score) : defaultMidMax || 50;
      const finMax = s.final_max_score !== null ? Number(s.final_max_score) : defaultFinMax || 50;
      const totalMax = midMax + finMax;
      subjectMaxMap.set(s.name.trim().toLowerCase(), totalMax > 0 ? totalMax : 100);
    });

    // Calculate matrix rows per classroom
    const matrixRows = classrooms.map((cls: any) => {
      const clsStudentIds = classroomStudentsMap.get(cls.id) || [];
      const studentCount = clsStudentIds.length;

      let rowAllSubjectsTotal = 0;
      let rowAllSubjectsMaxTotal = 0;

      const subjectStats = subjects.map((subj: any) => {
        const subjKey = subj.name.trim().toLowerCase();
        const isScoreEnabledForClassroom =
          subj.subject_type !== "activity" ||
          scoreEnabledClassroomsBySubject.get(subj.id)?.has(cls.id) === true;
        const maxScorePerStudent = isScoreEnabledForClassroom
          ? subjectMaxMap.get(subjKey) || 100
          : 0;

        let totalClassroomScore = 0;
        if (isScoreEnabledForClassroom) {
          clsStudentIds.forEach((stdId) => {
            const key = `${stdId}_${subjKey}`;
            const score = gradeScoreMap.get(key) || 0;
            totalClassroomScore += score;
          });
        }

        const totalMaxClassroomScore = studentCount * maxScorePerStudent;
        const avgPercentage =
          totalMaxClassroomScore > 0
            ? (totalClassroomScore * 100) / totalMaxClassroomScore
            : 0;

        rowAllSubjectsTotal += totalClassroomScore;
        rowAllSubjectsMaxTotal += totalMaxClassroomScore;

        return {
          subject_id: subj.id,
          subject_name: subj.name,
          total_score: totalClassroomScore,
          max_possible_score: totalMaxClassroomScore,
          avg_percentage: parseFloat(avgPercentage.toFixed(2)),
        };
      });

      const overallAvgPercentage =
        rowAllSubjectsMaxTotal > 0
          ? (rowAllSubjectsTotal * 100) / rowAllSubjectsMaxTotal
          : 0;

      return {
        classroom_id: cls.id,
        classroom_name: cls.name,
        classroom_name_thai: cls.name_thai || null,
        classroom_name_rumi: cls.name_rumi || null,
        classroom_name_jawi: cls.name_jawi || null,
        student_count: studentCount,
        subject_stats: subjectStats,
        total_all_subjects: rowAllSubjectsTotal,
        max_possible_all_subjects: rowAllSubjectsMaxTotal,
        overall_avg_percentage: parseFloat(overallAvgPercentage.toFixed(2)),
      };
    }).filter((classroom) => classroom.student_count > 0 && subjects.length > 0);

    // Calculate School-wide totals (รวมทุกระดับชั้น)
    const schoolTotalStudents = matrixRows.reduce((total, classroom) => total + classroom.student_count, 0);
    let schoolAllSubjectsTotal = 0;
    let schoolAllSubjectsMaxTotal = 0;

    const schoolSubjectStats = subjects.map((subj: any) => {
      const subjKey = subj.name.trim().toLowerCase();

      let totalSchoolSubjectScore = 0;
      let totalMaxSchoolScore = 0;
      students.forEach((std: any) => {
        const classroomId = studentClassroomMap.get(std.student_id);
        const isScoreEnabledForClassroom =
          subj.subject_type !== "activity" ||
          (classroomId !== undefined && scoreEnabledClassroomsBySubject.get(subj.id)?.has(classroomId) === true);
        if (!isScoreEnabledForClassroom) return;
        const key = `${std.student_id}_${subjKey}`;
        const score = gradeScoreMap.get(key) || 0;
        totalSchoolSubjectScore += score;
        totalMaxSchoolScore += subjectMaxMap.get(subjKey) || 100;
      });

      const avgPercentage =
        totalMaxSchoolScore > 0
          ? (totalSchoolSubjectScore * 100) / totalMaxSchoolScore
          : 0;

      schoolAllSubjectsTotal += totalSchoolSubjectScore;
      schoolAllSubjectsMaxTotal += totalMaxSchoolScore;

      return {
        subject_id: subj.id,
        subject_name: subj.name,
        total_score: totalSchoolSubjectScore,
        max_possible_score: totalMaxSchoolScore,
        avg_percentage: parseFloat(avgPercentage.toFixed(2)),
      };
    });

    const schoolOverallAvgPercentage =
      schoolAllSubjectsMaxTotal > 0
        ? (schoolAllSubjectsTotal * 100) / schoolAllSubjectsMaxTotal
        : 0;

    const schoolSummary = {
      total_students: schoolTotalStudents,
      subject_stats: schoolSubjectStats,
      total_all_subjects: schoolAllSubjectsTotal,
      max_possible_all_subjects: schoolAllSubjectsMaxTotal,
      overall_avg_percentage: parseFloat(schoolOverallAvgPercentage.toFixed(2)),
    };

    return NextResponse.json({
      academic_year,
      term: settingTerm,
      term_key: termKey,
      school_name: schoolNameTh,
      subject_display_names: mergedDisplayNames,
      subjects: subjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        subject_type: s.subject_type,
        score_enabled_classroom_ids: s.subject_type === "activity"
          ? Array.from(scoreEnabledClassroomsBySubject.get(s.id) || [])
          : undefined,
        max_score: subjectMaxMap.get(s.name.trim().toLowerCase()) || 100,
      })),
      matrix_rows: matrixRows,
      school_summary: schoolSummary,
    });
  } catch (error: any) {
    console.error("Error calculating achievement matrix:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { settingId, subjectDisplayNames } = body;

    if (!settingId) {
      return NextResponse.json({ error: "settingId required" }, { status: 400 });
    }

    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS subject_display_names JSONB DEFAULT '{}'::jsonb");
    await pool.query(
      "UPDATE system_settings SET subject_display_names = $1 WHERE id = $2",
      [JSON.stringify(subjectDisplayNames || {}), settingId]
    );

    return NextResponse.json({
      success: true,
      subject_display_names: subjectDisplayNames || {},
    });
  } catch (error: any) {
    console.error("Error updating subject_display_names:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
