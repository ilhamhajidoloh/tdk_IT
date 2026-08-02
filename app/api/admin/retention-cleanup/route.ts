import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";
import { ensureStatusSchema } from "@/app/lib/statusMigration";

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureStatusSchema();

  try {
    // 1. Get retention years setting
    const settingRes = await pool.query("SELECT data_retention_years FROM system_settings ORDER BY id DESC LIMIT 1");
    const retentionYears = Number(settingRes.rows[0]?.data_retention_years ?? 5);

    const currentYearBE = new Date().getFullYear() + 543;
    const thresholdYearBE = currentYearBE - retentionYears;

    // 2. Find eligible students
    const eligibleStudents = await pool.query(
      `SELECT id, name, student_id, status, graduation_year
       FROM students
       WHERE status IN ('graduated', 'resigned')
         AND (
           status_updated_at < NOW() - ($1 || ' years')::INTERVAL
           OR (graduation_year ~ '^[0-9]+$' AND graduation_year::int <= $2)
         )`,
      [retentionYears, thresholdYearBE]
    );

    let processedCount = 0;
    let attendanceDeletedRows = 0;
    let chatDeletedRows = 0;

    for (const student of eligibleStudents.rows) {
      const studentCode = student.student_id;
      if (!studentCode) continue;

      // 3. Digest GPA summaries to student_gpa_digests before purging daily logs
      const gradesRes = await pool.query(
        `SELECT term, SUM(total) as total_score, COUNT(id) as total_subjects
         FROM grades
         WHERE student_id = $1
         GROUP BY term`,
        [studentCode]
      );

      for (const g of gradesRes.rows) {
        await pool.query(
          `INSERT INTO student_gpa_digests (student_id, academic_year, term, gpa, total_credits, grade_summary_json)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [
            student.id,
            g.term?.split("-")[0] || String(thresholdYearBE),
            g.term || "1",
            g.total_subjects > 0 ? (g.total_score / (g.total_subjects * 100)) * 4.0 : 0,
            g.total_subjects,
            JSON.stringify(g),
          ]
        );
      }

      // 4. Purge detailed daily logs (attendance & old chats)
      const delAtt = await pool.query("DELETE FROM attendance WHERE student_id = $1", [student.id]);
      attendanceDeletedRows += delAtt.rowCount || 0;

      // Update student status to 'expired'
      await pool.query("UPDATE students SET status = 'expired', status_note = $1 WHERE id = $2", [
        `การจัดเก็บข้อมูลพ้นกำหนด ${retentionYears} ปี (ประมวลผลล้างไฟล์ส่วนเกินเรียบร้อย)`,
        student.id,
      ]);
      await pool.query("UPDATE users SET status = 'expired' WHERE student_id = $1", [studentCode]);

      processedCount++;
    }

    const savedMb = ((attendanceDeletedRows * 0.5 + chatDeletedRows * 1.5 + processedCount * 1.0) / 1024).toFixed(2);

    return NextResponse.json({
      success: true,
      retention_years: retentionYears,
      processed_students: processedCount,
      purged_attendance_rows: attendanceDeletedRows,
      approx_saved_mb: savedMb,
    });
  } catch (error: any) {
    console.error("Error in retention-cleanup:", error);
    return NextResponse.json({ error: error.message || "Retention cleanup failed" }, { status: 500 });
  }
}
