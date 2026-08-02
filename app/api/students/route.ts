import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-sync students from users using a single fast query
  try {
    await pool.query(`
      INSERT INTO students (name, student_id)
      SELECT username, student_id FROM users
      WHERE role = 'student' AND student_id IS NOT NULL AND student_id != ''
      ON CONFLICT (student_id) DO NOTHING
    `);
  } catch (e) {
    console.error("Error auto-syncing students from users:", e);
  }

  const classroomId = req.nextUrl.searchParams.get("classroomId");
  const settingIdParam = req.nextUrl.searchParams.get("settingId");
  const statusParam = req.nextUrl.searchParams.get("status"); // active | graduated | resigned | all

  let statusClause = "";
  const params: any[] = [];

  if (statusParam && statusParam !== "all") {
    params.push(statusParam);
    statusClause = `AND COALESCE(s.status, 'active') = $${params.length}`;
  }

  let result;
  if (classroomId) {
    const classParamIdx = params.length + 1;
    params.push(classroomId);
    result = await pool.query(
      `SELECT s.id, s.name, s.student_id, COALESCE(s.status, 'active') AS status, s.graduation_year, s.status_updated_at, s.status_note, s.enrollment_date, s.graduation_date, cs.classroom_id, cs.student_number
       FROM students s
       JOIN classroom_students cs ON cs.student_id = s.id
       WHERE cs.classroom_id = $${classParamIdx} ${statusClause}
       ORDER BY cs.student_number ASC NULLS LAST, s.name ASC`,
      params
    );
  } else {
    // Resolve target setting ID cleanly in JS
    let targetSettingId = settingIdParam;
    if (!targetSettingId) {
      try {
        const activeRes = await pool.query(
          `SELECT id FROM system_settings WHERE is_active = true ORDER BY id DESC LIMIT 1`
        );
        if (activeRes.rows.length > 0) {
          targetSettingId = activeRes.rows[0].id.toString();
        } else {
          const dateRes = await pool.query(
            `SELECT id FROM system_settings WHERE CURRENT_DATE BETWEEN start_date AND end_date ORDER BY id DESC LIMIT 1`
          );
          if (dateRes.rows.length > 0) {
            targetSettingId = dateRes.rows[0].id.toString();
          }
        }
      } catch (e) {
        console.error("Error fetching active setting ID:", e);
      }
    }

    const settingParamIdx = params.length + 1;
    params.push(targetSettingId || null);

    result = await pool.query(
      `SELECT s.id, s.name, s.student_id, COALESCE(s.status, 'active') AS status, s.graduation_year, s.status_updated_at, s.status_note, s.enrollment_date, s.graduation_date, cs.classroom_id, cs.student_number
       FROM students s
       LEFT JOIN classroom_students cs ON cs.student_id = s.id
         AND (cs.setting_id = $${settingParamIdx}::bigint OR cs.setting_id IS NULL)
       WHERE 1=1 ${statusClause}
       ORDER BY cs.student_number ASC NULLS LAST, s.name ASC`,
      params
    );
  }
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, student_id, classroom_id, setting_id } = await req.json();

  if (!name?.trim() || !student_id?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const studentIdVal = student_id?.trim() || null;

  if (studentIdVal) {
    const checkExists = await pool.query("SELECT id FROM students WHERE student_id = $1", [studentIdVal]);
    if (checkExists.rows.length > 0) {
      return NextResponse.json({ error: "รหัสนักเรียนนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const studentRes = await client.query(
      "INSERT INTO students (name, student_id) VALUES ($1, $2) RETURNING id, name, student_id",
      [name.trim(), studentIdVal]
    );
    const newStudent = studentRes.rows[0];

    if (classroom_id) {
      let targetSettingId = setting_id;
      if (!targetSettingId) {
        const settingRes = await client.query(
          "SELECT id FROM system_settings WHERE is_active = true ORDER BY id DESC LIMIT 1"
        );
        if (settingRes.rows.length > 0) {
          targetSettingId = settingRes.rows[0].id;
        }
      }

      await client.query(
        "INSERT INTO classroom_students (student_id, classroom_id, setting_id) VALUES ($1, $2, $3)",
        [newStudent.id, classroom_id, targetSettingId || null]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error creating student:", error);
    return NextResponse.json({ error: error.message || "Failed to create student" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, classroom_id, student_number, setting_id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
  }

  try {
    let targetSettingId = setting_id;
    if (!targetSettingId) {
      const settingRes = await pool.query(
        "SELECT id FROM system_settings WHERE is_active = true ORDER BY id DESC LIMIT 1"
      );
      if (settingRes.rows.length > 0) {
        targetSettingId = settingRes.rows[0].id;
      }
    }

    if (classroom_id && targetSettingId) {
      await pool.query(
        `INSERT INTO classroom_students (student_id, classroom_id, setting_id, student_number)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, setting_id)
         DO UPDATE SET classroom_id = EXCLUDED.classroom_id, student_number = EXCLUDED.student_number`,
        [id, classroom_id, targetSettingId, student_number || null]
      );
    }

    return NextResponse.json({ message: "Student classroom updated successfully" });
  } catch (error: any) {
    console.error("Error updating student classroom:", error);
    return NextResponse.json({ error: error.message || "Failed to update student classroom" }, { status: 500 });
  }
}
