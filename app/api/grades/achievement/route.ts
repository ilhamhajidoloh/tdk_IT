import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settingId = req.nextUrl.searchParams.get("settingId");
    if (!settingId) return NextResponse.json({ error: "settingId required" }, { status: 400 });

    // Ensure column exists
    await pool.query("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS subject_display_names JSONB DEFAULT '{}'::jsonb");

    const settingRes = await pool.query(
      "SELECT academic_year, term, midterm_max_score, final_max_score, subject_display_names FROM system_settings WHERE id = $1",
      [settingId]
    );
    if (settingRes.rows.length === 0) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    const { academic_year, term: settingTerm, midterm_max_score: defaultMidMax, final_max_score: defaultFinMax, subject_display_names } = settingRes.rows[0];
    const termKey = `${settingTerm}/${academic_year}`;

    // 1. Fetch Classrooms, Subjects, Students, and Grades
    const [classroomsRes, subjectsRes, studentsRes] = await Promise.all([
      pool.query(
        "SELECT id, name FROM classrooms WHERE setting_id = $1 ORDER BY name",
        [settingId]
      ),
      pool.query(
        `SELECT id, name, subject_type, midterm_max_score, final_max_score, credit_hours 
         FROM subjects WHERE setting_id = $1 ORDER BY name`,
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
    ]);

    const includeActivity = req.nextUrl.searchParams.get("includeActivity") === "true";

    const classrooms = classroomsRes.rows;
    let subjects = subjectsRes.rows;
    if (!includeActivity) {
      subjects = subjects.filter((s: any) => s.subject_type !== "activity");
    }
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
        const maxScorePerStudent = subjectMaxMap.get(subjKey) || 100;

        let totalClassroomScore = 0;
        clsStudentIds.forEach((stdId) => {
          const key = `${stdId}_${subjKey}`;
          const score = gradeScoreMap.get(key) || 0;
          totalClassroomScore += score;
        });

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
        student_count: studentCount,
        subject_stats: subjectStats,
        total_all_subjects: rowAllSubjectsTotal,
        max_possible_all_subjects: rowAllSubjectsMaxTotal,
        overall_avg_percentage: parseFloat(overallAvgPercentage.toFixed(2)),
      };
    });

    // Calculate School-wide totals (รวมทุกระดับชั้น)
    const schoolTotalStudents = students.length;
    let schoolAllSubjectsTotal = 0;
    let schoolAllSubjectsMaxTotal = 0;

    const schoolSubjectStats = subjects.map((subj: any) => {
      const subjKey = subj.name.trim().toLowerCase();
      const maxScorePerStudent = subjectMaxMap.get(subjKey) || 100;

      let totalSchoolSubjectScore = 0;
      students.forEach((std: any) => {
        const key = `${std.student_id}_${subjKey}`;
        const score = gradeScoreMap.get(key) || 0;
        totalSchoolSubjectScore += score;
      });

      const totalMaxSchoolScore = schoolTotalStudents * maxScorePerStudent;
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
      subject_display_names: subject_display_names || {},
      subjects: subjects.map((s: any) => ({
        id: s.id,
        name: s.name,
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
