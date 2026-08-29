import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { requirePermission } from "@/app/lib/permissions/middleware";

export async function POST(req: NextRequest) {
  const permError = await requirePermission(req, "students.promote");
  if (permError) return permError;

  try {
    const { current_setting_id, new_setting_id, graduation_date, graduation_year, student_ids } = await req.json();

    if (!current_setting_id || !graduation_date) {
      return NextResponse.json({ error: "กรุณาระบุปีการศึกษาปัจจุบันและวันที่จบการศึกษา" }, { status: 400 });
    }

    // Get system highest grade level
    const settingRes = await pool.query("SELECT highest_grade_level FROM system_settings WHERE id = $1", [current_setting_id]);
    const highestGradeLevel = settingRes.rows[0]?.highest_grade_level?.trim() || "";

    // Query active students in current setting
    let studentQuery = `
      SELECT s.id, s.name, s.student_id, c.id AS classroom_id, c.name AS classroom_name
      FROM students s
      JOIN classroom_students cs ON cs.student_id = s.id AND cs.setting_id = $1
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE COALESCE(s.status, 'active') = 'active'
    `;
    const queryParams: any[] = [current_setting_id];

    if (Array.isArray(student_ids) && student_ids.length > 0) {
      studentQuery += ` AND s.id = ANY($2::bigint[])`;
      queryParams.push(student_ids);
    }

    const studentsRes = await pool.query(studentQuery, queryParams);
    const activeStudents = studentsRes.rows;

    let graduatedCount = 0;
    let promotedCount = 0;
    const logDetails: string[] = [];

    for (const student of activeStudents) {
      const clsName = student.classroom_name.trim(); // e.g. "ม.6/1" or "ม.6"
      const gradePrefix = clsName.split("/")[0].trim(); // "ม.6"

      // Check if student is in highest grade level (e.g. "ม.6")
      const isGraduating = highestGradeLevel
        ? gradePrefix === highestGradeLevel || clsName === highestGradeLevel
        : (gradePrefix.includes("6") || gradePrefix.includes("3"));

      if (isGraduating) {
        // Mark as graduated
        await pool.query(
          `UPDATE students
           SET status = 'graduated', graduation_date = $1, graduation_year = $2, status_updated_at = NOW(), status_note = 'อนุมัติจบการศึกษาโดยผู้ดูแลระบบ'
           WHERE id = $3`,
          [graduation_date, graduation_year || new Date(graduation_date).getFullYear().toString(), student.id]
        );

        if (student.student_id) {
          await pool.query("UPDATE users SET status = 'graduated' WHERE student_id = $1", [student.student_id]);
        }

        graduatedCount++;
        logDetails.push(`🎓 ${student.name} (${clsName}) -> จบการศึกษาแล้ว`);
      } else if (new_setting_id) {
        // Promoted to next grade level (e.g. ม.1 -> ม.2)
        const match = gradePrefix.match(/^([^\d]+)(\d+)$/);
        let nextGradePrefix = gradePrefix;
        if (match) {
          const prefixText = match[1]; // "ม."
          const num = parseInt(match[2], 10);
          nextGradePrefix = `${prefixText}${num + 1}`; // "ม.2"
        }

        // Find target classroom in new_setting_id
        const sectionMatch = clsName.includes("/") ? "/" + clsName.split("/")[1] : "";
        const targetClassroomName = `${nextGradePrefix}${sectionMatch}`;

        let targetClass = await pool.query(
          "SELECT id FROM classrooms WHERE setting_id = $1 AND name = $2",
          [new_setting_id, targetClassroomName]
        );

        if (targetClass.rows.length === 0) {
          // Fallback to any classroom starting with nextGradePrefix in new setting
          targetClass = await pool.query(
            "SELECT id FROM classrooms WHERE setting_id = $1 AND name LIKE $2 LIMIT 1",
            [new_setting_id, `${nextGradePrefix}%`]
          );
        }

        if (targetClass.rows.length > 0) {
          const newClassroomId = targetClass.rows[0].id;
          await pool.query(
            `INSERT INTO classroom_students (student_id, classroom_id, setting_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (student_id, setting_id) DO UPDATE SET classroom_id = excluded.classroom_id`,
            [student.id, newClassroomId, new_setting_id]
          );
          promotedCount++;
          logDetails.push(`⬆️ ${student.name} (${clsName}) -> เลื่อนชั้นเป็น ${targetClassroomName}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      graduatedCount,
      promotedCount,
      totalProcessed: activeStudents.length,
      logDetails,
    });
  } catch (err: any) {
    console.error("Error in batch-promote route:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
