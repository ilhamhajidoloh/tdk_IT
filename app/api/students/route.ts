import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ดึง users ที่มีบทบาทเป็น student และมี student_id เพื่อมาสร้างในตาราง students อัตโนมัติ
  try {
    const studentUsers = await pool.query(
      "SELECT username, student_id FROM users WHERE role = 'student' AND student_id IS NOT NULL AND student_id != ''"
    );

    for (const u of studentUsers.rows) {
      const checkRes = await pool.query("SELECT id FROM students WHERE student_id = $1", [u.student_id]);
      if (checkRes.rows.length === 0) {
        await pool.query(
          "INSERT INTO students (name, student_id) VALUES ($1, $2)",
          [u.username, u.student_id]
        );
      }
    }
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
    const settingParamIdx = params.length + 1;
    params.push(settingIdParam);
    result = await pool.query(
      `SELECT s.id, s.name, s.student_id, COALESCE(s.status, 'active') AS status, s.graduation_year, s.status_updated_at, s.status_note, s.enrollment_date, s.graduation_date, cs.classroom_id, cs.student_number
       FROM students s
       LEFT JOIN classroom_students cs ON cs.student_id = s.id
         AND (
           cs.setting_id = COALESCE(
             $${settingParamIdx}::bigint,
             (SELECT id FROM system_settings WHERE is_active = true ORDER BY id DESC LIMIT 1),
             (SELECT id FROM system_settings WHERE CURRENT_DATE BETWEEN start_date AND end_date ORDER BY id DESC LIMIT 1)
           )
           OR cs.setting_id IS NULL
         )
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

  const result = await pool.query(
    "INSERT INTO students (name, student_id) VALUES ($1, $2) RETURNING id, name, student_id",
    [name.trim(), studentIdVal]
  );
  const newStudent = result.rows[0];

  if (classroom_id && setting_id) {
    await pool.query(
      "INSERT INTO classroom_students (student_id, classroom_id, setting_id) VALUES ($1, $2, $3)",
      [newStudent.id, classroom_id, setting_id]
    );
  }

  return NextResponse.json({ ...newStudent, classroom_id: classroom_id || null }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, student_number, setting_id } = body;

  if (!id || !setting_id) {
    return NextResponse.json({ error: "Missing student ID or setting ID" }, { status: 400 });
  }

  try {
    const numberVal = student_number === "" || student_number === null ? null : Number(student_number);
    const result = await pool.query(
      "UPDATE classroom_students SET student_number = $1 WHERE student_id = $2 AND setting_id = $3 RETURNING *",
      [numberVal, id, setting_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Student not enrolled in this term" }, { status: 404 });
    }

    return NextResponse.json({ id, student_number: numberVal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
