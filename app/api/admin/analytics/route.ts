import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { RWT_TOPICS } from "@/app/lib/evaluation";
import { requirePermission } from "@/app/lib/permissions/middleware";

export async function GET(req: NextRequest) {
  try {
    const permError = await requirePermission(req, "analytics.view");
    if (permError) return permError;

    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingId = req.nextUrl.searchParams.get("settingId");
    if (!settingId) {
      return NextResponse.json({ error: "settingId is required" }, { status: 400 });
    }

    // 1. Get Setting info
    const settingRes = await pool.query(
      `SELECT id, academic_year, term, midterm_max_score, final_max_score, school_id 
       FROM system_settings WHERE id = $1`,
      [settingId]
    );
    if (settingRes.rows.length === 0) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    const {
      academic_year,
      term: settingTerm,
      midterm_max_score: defaultMidMax,
      final_max_score: defaultFinMax,
    } = settingRes.rows[0];
    const termKey = `${settingTerm}/${academic_year}`;

    // 2. Fetch Classrooms, Subjects, Students, and Active Topics
    const [classroomsRes, subjectsRes, studentsRes, evalTopicsRes] = await Promise.all([
      pool.query(
        `SELECT id, name, name_thai, name_rumi, name_jawi 
         FROM classrooms WHERE setting_id = $1 ORDER BY name ASC`,
        [settingId]
      ),
      pool.query(
        `SELECT id, name, subject_type, midterm_max_score, final_max_score, credit_hours, sort_order 
         FROM subjects WHERE setting_id = $1 ORDER BY COALESCE(sort_order, 999) ASC, name ASC`,
        [settingId]
      ),
      pool.query(
        `SELECT st.id, st.name, st.student_id, cs.classroom_id, c.name AS classroom_name,
                c.name_thai AS classroom_name_thai, c.name_rumi AS classroom_name_rumi, c.name_jawi AS classroom_name_jawi
         FROM students st
         JOIN classroom_students cs ON cs.student_id = st.id
         JOIN classrooms c ON c.id = cs.classroom_id
         WHERE cs.setting_id = $1`,
        [settingId]
      ),
      pool.query(
        `SELECT id, name_th, name_rumi, name_jawi, sort_order, is_active 
         FROM evaluation_topics WHERE is_active = true ORDER BY sort_order ASC, name_th ASC`
      ),
    ]);

    const classrooms = classroomsRes.rows;
    const subjects = subjectsRes.rows;
    const students = studentsRes.rows;
    const evalTopics = evalTopicsRes.rows;

    const studentIds = students.map((s: any) => s.student_id);

    // 3. Fetch Grades
    let grades: any[] = [];
    if (studentIds.length > 0) {
      const gradesRes = await pool.query(
        `SELECT student_id, subject, midterm_score, final_score 
         FROM grades WHERE term = $1 AND student_id = ANY($2)`,
        [termKey, studentIds]
      );
      grades = gradesRes.rows;
    }

    // 4. Fetch Evaluation Records
    let evalRecords: any[] = [];
    const subjectIds = subjects.map((s: any) => s.id);
    if (subjectIds.length > 0) {
      const evalRes = await pool.query(
        `SELECT er.student_id, er.category, er.topic_key, MAX(er.rating) AS rating
         FROM evaluation_records er
         WHERE er.subject_id = ANY($1)
         GROUP BY er.student_id, er.category, er.topic_key`,
        [subjectIds]
      );
      evalRecords = evalRes.rows;
    }

    // Maps
    const studentToClassroomMap = new Map<string, any>();
    const classroomStudentsMap = new Map<string, any[]>();
    students.forEach((s: any) => {
      studentToClassroomMap.set(s.student_id, s);
      if (!classroomStudentsMap.has(s.classroom_id)) {
        classroomStudentsMap.set(s.classroom_id, []);
      }
      classroomStudentsMap.get(s.classroom_id)!.push(s);
    });

    const subjectMaxMap = new Map<string, number>();
    subjects.forEach((s: any) => {
      const midMax = s.midterm_max_score !== null ? Number(s.midterm_max_score) : Number(defaultMidMax) || 50;
      const finMax = s.final_max_score !== null ? Number(s.final_max_score) : Number(defaultFinMax) || 50;
      const totalMax = midMax + finMax;
      subjectMaxMap.set(s.name.trim().toLowerCase(), totalMax > 0 ? totalMax : 100);
    });

    // Helper to calculate Grade from 100% scaled score
    const getGradePoint = (percentage: number): { grade: string; point: number } => {
      if (percentage >= 80) return { grade: "4.0", point: 4.0 };
      if (percentage >= 75) return { grade: "3.5", point: 3.5 };
      if (percentage >= 70) return { grade: "3.0", point: 3.0 };
      if (percentage >= 65) return { grade: "2.5", point: 2.5 };
      if (percentage >= 60) return { grade: "2.0", point: 2.0 };
      if (percentage >= 55) return { grade: "1.5", point: 1.5 };
      if (percentage >= 50) return { grade: "1.0", point: 1.0 };
      return { grade: "0.0", point: 0.0 };
    };

    // Calculate Grades per student per subject
    const studentSubjectScores = new Map<string, Map<string, any>>();
    grades.forEach((g: any) => {
      const stdId = g.student_id;
      const subjKey = g.subject ? g.subject.trim().toLowerCase() : "";
      if (!subjKey) return;

      const mid = g.midterm_score !== null ? Number(g.midterm_score) : 0;
      const fin = g.final_score !== null ? Number(g.final_score) : 0;
      const total = mid + fin;
      const maxScore = subjectMaxMap.get(subjKey) || 100;
      const percentage = maxScore > 0 ? (total * 100) / maxScore : 0;
      const { grade, point } = getGradePoint(percentage);

      if (!studentSubjectScores.has(stdId)) {
        studentSubjectScores.set(stdId, new Map());
      }
      studentSubjectScores.get(stdId)!.set(subjKey, {
        total,
        maxScore,
        percentage,
        grade,
        point,
      });
    });

    // Grade Distribution Across School
    const overallGradeCounts: Record<string, number> = {
      "4.0": 0,
      "3.5": 0,
      "3.0": 0,
      "2.5": 0,
      "2.0": 0,
      "1.5": 0,
      "1.0": 0,
      "0.0": 0,
    };
    let totalGradeEntries = 0;

    studentSubjectScores.forEach((subjMap) => {
      subjMap.forEach((info) => {
        if (overallGradeCounts[info.grade] !== undefined) {
          overallGradeCounts[info.grade]++;
          totalGradeEntries++;
        }
      });
    });

    const gradeDistribution = Object.entries(overallGradeCounts).map(([grade, count]) => ({
      grade,
      count,
      percentage: totalGradeEntries > 0 ? parseFloat(((count * 100) / totalGradeEntries).toFixed(1)) : 0,
    }));

    // Classroom Comparisons
    const classroomStats = classrooms.map((cls: any) => {
      const clsStudents = classroomStudentsMap.get(cls.id) || [];
      const studentCount = clsStudents.length;

      let clsTotalScore = 0;
      let clsMaxPossible = 0;
      let totalGpaPoints = 0;
      let studentWithGpaCount = 0;

      const subjectBreakdown = subjects.map((subj: any) => {
        const subjKey = subj.name.trim().toLowerCase();
        const maxScorePerStudent = subjectMaxMap.get(subjKey) || 100;

        let totalSubjScore = 0;
        let gradedCount = 0;

        clsStudents.forEach((std: any) => {
          const scoreInfo = studentSubjectScores.get(std.student_id)?.get(subjKey);
          if (scoreInfo) {
            totalSubjScore += scoreInfo.total;
            gradedCount++;
          }
        });

        const totalMaxSubjScore = studentCount * maxScorePerStudent;
        const avgPercentage = totalMaxSubjScore > 0 ? (totalSubjScore * 100) / totalMaxSubjScore : 0;

        clsTotalScore += totalSubjScore;
        clsMaxPossible += totalMaxSubjScore;

        return {
          subject_id: subj.id,
          subject_name: subj.name,
          subject_type: subj.subject_type,
          avg_percentage: parseFloat(avgPercentage.toFixed(2)),
          total_score: totalSubjScore,
          max_score: totalMaxSubjScore,
          graded_count: gradedCount,
        };
      });

      // Calculate GPA for each student in classroom
      clsStudents.forEach((std: any) => {
        const subjMap = studentSubjectScores.get(std.student_id);
        if (subjMap && subjMap.size > 0) {
          let stdPoints = 0;
          let stdCount = 0;
          subjMap.forEach((info) => {
            stdPoints += info.point;
            stdCount++;
          });
          if (stdCount > 0) {
            totalGpaPoints += stdPoints / stdCount;
            studentWithGpaCount++;
          }
        }
      });

      const overallAvgPercentage = clsMaxPossible > 0 ? (clsTotalScore * 100) / clsMaxPossible : 0;
      const gpaAvg = studentWithGpaCount > 0 ? totalGpaPoints / studentWithGpaCount : 0;

      return {
        classroom_id: cls.id,
        classroom_name: cls.name,
        classroom_name_thai: cls.name_thai,
        classroom_name_rumi: cls.name_rumi,
        classroom_name_jawi: cls.name_jawi,
        student_count: studentCount,
        overall_avg_percentage: parseFloat(overallAvgPercentage.toFixed(2)),
        gpa_avg: parseFloat(gpaAvg.toFixed(2)),
        subjects: subjectBreakdown,
      };
    });

    // Subject Comparisons
    const subjectStats = subjects.map((subj: any) => {
      const subjKey = subj.name.trim().toLowerCase();
      const maxScorePerStudent = subjectMaxMap.get(subjKey) || 100;

      let totalSubjectScore = 0;
      let totalMaxSubjectScore = 0;
      let gradedCount = 0;
      let highestScore = 0;
      let lowestScore = maxScorePerStudent;
      let passingCount = 0;
      const subjGradeCounts: Record<string, number> = {
        "4.0": 0, "3.5": 0, "3.0": 0, "2.5": 0, "2.0": 0, "1.5": 0, "1.0": 0, "0.0": 0,
      };

      const clsBreakdown = classrooms.map((cls: any) => {
        const clsStudents = classroomStudentsMap.get(cls.id) || [];
        let clsSubjScore = 0;
        let clsGradedCount = 0;

        clsStudents.forEach((std: any) => {
          const scoreInfo = studentSubjectScores.get(std.student_id)?.get(subjKey);
          if (scoreInfo) {
            clsSubjScore += scoreInfo.total;
            gradedCount++;
            clsGradedCount++;
            if (scoreInfo.total > highestScore) highestScore = scoreInfo.total;
            if (scoreInfo.total < lowestScore) lowestScore = scoreInfo.total;
            if (scoreInfo.percentage >= 50) passingCount++;
            if (subjGradeCounts[scoreInfo.grade] !== undefined) {
              subjGradeCounts[scoreInfo.grade]++;
            }
          }
        });

        const clsMaxScore = clsStudents.length * maxScorePerStudent;
        const clsAvgPercentage = clsMaxScore > 0 ? (clsSubjScore * 100) / clsMaxScore : 0;
        const clsRawAvg = clsGradedCount > 0 ? (clsSubjScore / clsGradedCount) : 0;

        totalSubjectScore += clsSubjScore;
        totalMaxSubjectScore += clsMaxScore;

        return {
          classroom_id: cls.id,
          classroom_name: cls.name,
          student_count: clsStudents.length,
          graded_count: clsGradedCount,
          avg_percentage: parseFloat(clsAvgPercentage.toFixed(2)),
          raw_avg_score: parseFloat(clsRawAvg.toFixed(2)),
        };
      });

      const avgPercentage = totalMaxSubjectScore > 0 ? (totalSubjectScore * 100) / totalMaxSubjectScore : 0;
      const rawAvgScore = gradedCount > 0 ? (totalSubjectScore / gradedCount) : 0;
      const passRate = gradedCount > 0 ? (passingCount * 100) / gradedCount : 0;

      const subjGradeDistribution = Object.entries(subjGradeCounts).map(([grade, count]) => ({
        grade,
        count,
        percentage: gradedCount > 0 ? parseFloat(((count * 100) / gradedCount).toFixed(1)) : 0,
      }));

      return {
        subject_id: subj.id,
        subject_name: subj.name,
        subject_type: subj.subject_type,
        credit_hours: subj.credit_hours,
        avg_percentage: parseFloat(avgPercentage.toFixed(2)),
        raw_avg_score: parseFloat(rawAvgScore.toFixed(2)),
        max_possible_score: maxScorePerStudent,
        highest_score: highestScore,
        lowest_score: gradedCount > 0 ? lowestScore : 0,
        graded_students: gradedCount,
        pass_rate: parseFloat(passRate.toFixed(1)),
        grade_distribution: subjGradeDistribution,
        classroom_breakdown: clsBreakdown,
      };
    });

    // Evaluations Analytics (Character & RWT)
    const characterTopicStatsMap = new Map<string, { excellent: number; good: number; pass: number; fail: number }>();
    const rwtTopicStatsMap = new Map<string, { excellent: number; good: number; pass: number; fail: number }>();

    let totalCharEvaluations = 0;
    let charRatingSum = { 3: 0, 2: 0, 1: 0, 0: 0 };
    let totalRwtEvaluations = 0;
    let rwtRatingSum = { 3: 0, 2: 0, 1: 0, 0: 0 };

    evalRecords.forEach((r: any) => {
      const rating = Number(r.rating);
      const isChar = r.category === "character";
      const targetMap = isChar ? characterTopicStatsMap : rwtTopicStatsMap;

      if (!targetMap.has(r.topic_key)) {
        targetMap.set(r.topic_key, { excellent: 0, good: 0, pass: 0, fail: 0 });
      }
      const entry = targetMap.get(r.topic_key)!;

      if (rating === 3) {
        entry.excellent++;
        if (isChar) charRatingSum[3]++;
        else rwtRatingSum[3]++;
      } else if (rating === 2) {
        entry.good++;
        if (isChar) charRatingSum[2]++;
        else rwtRatingSum[2]++;
      } else if (rating === 1) {
        entry.pass++;
        if (isChar) charRatingSum[1]++;
        else rwtRatingSum[1]++;
      } else {
        entry.fail++;
        if (isChar) charRatingSum[0]++;
        else rwtRatingSum[0]++;
      }

      if (isChar) totalCharEvaluations++;
      else totalRwtEvaluations++;
    });

    const characterTopics = evalTopics.map((t: any) => {
      const stats = characterTopicStatsMap.get(t.id) || { excellent: 0, good: 0, pass: 0, fail: 0 };
      const total = stats.excellent + stats.good + stats.pass + stats.fail;
      return {
        topic_key: t.id,
        name: t.name_th,
        name_rumi: t.name_rumi,
        name_jawi: t.name_jawi,
        excellent: stats.excellent,
        good: stats.good,
        pass: stats.pass,
        fail: stats.fail,
        total,
        excellent_percent: total > 0 ? parseFloat(((stats.excellent * 100) / total).toFixed(1)) : 0,
        pass_rate: total > 0 ? parseFloat((((stats.excellent + stats.good + stats.pass) * 100) / total).toFixed(1)) : 0,
      };
    });

    const rwtTopics = RWT_TOPICS.map((t) => {
      const stats = rwtTopicStatsMap.get(t.key) || { excellent: 0, good: 0, pass: 0, fail: 0 };
      const total = stats.excellent + stats.good + stats.pass + stats.fail;
      return {
        topic_key: t.key,
        name: t.th,
        name_rumi: t.rumi,
        name_jawi: t.jawi,
        excellent: stats.excellent,
        good: stats.good,
        pass: stats.pass,
        fail: stats.fail,
        total,
        excellent_percent: total > 0 ? parseFloat(((stats.excellent * 100) / total).toFixed(1)) : 0,
        pass_rate: total > 0 ? parseFloat((((stats.excellent + stats.good + stats.pass) * 100) / total).toFixed(1)) : 0,
      };
    });

    // School KPI Calculations
    let totalAllScores = 0;
    let totalMaxAllScores = 0;
    classroomStats.forEach((c) => {
      totalAllScores += c.overall_avg_percentage * c.student_count;
      totalMaxAllScores += 100 * c.student_count;
    });
    const schoolAvgPercentage = totalMaxAllScores > 0 ? parseFloat(((totalAllScores * 100) / totalMaxAllScores).toFixed(2)) : 0;

    const sortedClassrooms = [...classroomStats].sort((a, b) => b.overall_avg_percentage - a.overall_avg_percentage);
    const sortedSubjects = [...subjectStats].filter((s) => s.graded_students > 0).sort((a, b) => b.avg_percentage - a.avg_percentage);

    const kpiSummary = {
      school_avg_percentage: schoolAvgPercentage,
      total_students: students.length,
      total_classrooms: classrooms.length,
      total_subjects: subjects.length,
      top_classroom: sortedClassrooms[0] || null,
      lowest_classroom: sortedClassrooms[sortedClassrooms.length - 1] || null,
      top_subject: sortedSubjects[0] || null,
      lowest_subject: sortedSubjects[sortedSubjects.length - 1] || null,
      character_pass_rate: totalCharEvaluations > 0 ? parseFloat((((charRatingSum[3] + charRatingSum[2] + charRatingSum[1]) * 100) / totalCharEvaluations).toFixed(1)) : 0,
      character_excellent_rate: totalCharEvaluations > 0 ? parseFloat(((charRatingSum[3] * 100) / totalCharEvaluations).toFixed(1)) : 0,
      rwt_pass_rate: totalRwtEvaluations > 0 ? parseFloat((((rwtRatingSum[3] + rwtRatingSum[2] + rwtRatingSum[1]) * 100) / totalRwtEvaluations).toFixed(1)) : 0,
    };

    return NextResponse.json({
      academic_year,
      term: settingTerm,
      term_key: termKey,
      kpi: kpiSummary,
      classrooms: classroomStats,
      subjects: subjectStats,
      grade_distribution: gradeDistribution,
      character_topics: characterTopics,
      rwt_topics: rwtTopics,
    });
  } catch (error: any) {
    console.error("Error in admin analytics route:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

