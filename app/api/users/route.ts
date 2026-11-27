import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { requirePermission } from "@/app/lib/permissions/middleware";
import { ensureStatusSchema } from "@/app/lib/statusMigration";

let subjectTeachersTableReady = false;

async function hasSubjectTeachersTable(): Promise<boolean> {
  if (subjectTeachersTableReady) return true;
  try {
    await pool.query("SELECT 1 FROM subject_teachers LIMIT 0");
    subjectTeachersTableReady = true;
    return true;
  } catch {
    return false;
  }
}

import { verifyCoAdminOrAdmin } from "@/app/lib/verifyAdmin";

export async function GET(req: NextRequest) {
  if (!(await verifyCoAdminOrAdmin(req))) {
    const permError = await requirePermission(req, "users.view");
    if (permError) return permError;
  }

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;

  const requestedSchoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id");

  if (context?.isSuperAdmin) {
    schoolId = requestedSchoolId || schoolId;
  } else if (requestedSchoolId && requestedSchoolId !== schoolId) {
    // Non-super admin cannot access other school's data
    return NextResponse.json({ error: "Forbidden: Cannot access other school's data" }, { status: 403 });
  }

  const multiTeacherReady = await hasSubjectTeachersTable();

  const params: string[] = [];
  let whereClause = `WHERE u.role != 'super_admin'`;

  if (schoolId) {
    params.push(schoolId);
    whereClause = `WHERE u.school_id = $1 AND u.role != 'super_admin'`;
  }

  // Build the subject list once for the school's users. The previous correlated
  // subquery scanned subjects (and subject_teachers) again for every user,
  // including students who have no teaching assignments.
  const assignmentQuery = multiTeacherReady
    ? `SELECT s.teacher_id AS user_id, s.name
         FROM subjects s
         JOIN scoped_users su ON su.id = s.teacher_id
       UNION ALL
       SELECT st.user_id, s.name
         FROM subject_teachers st
         JOIN scoped_users su ON su.id = st.user_id
         JOIN subjects s ON s.id = st.subject_id`
    : `SELECT s.teacher_id AS user_id, s.name
         FROM subjects s
         JOIN scoped_users su ON su.id = s.teacher_id`;

  const queryText = `
    WITH scoped_users AS (
      SELECT u.id, u.username, u.email, u.role, u.school_id,
             u.student_id, u.homeroom_classroom_id, u.is_clerical,
             u.color, COALESCE(u.status, 'active') AS status,
             u.resigned_at, u.resignation_reason
        FROM users u
        ${whereClause}
    ), teacher_subjects AS (
      SELECT assignments.user_id, array_agg(DISTINCT assignments.name) AS subjects
        FROM (${assignmentQuery}) assignments
       GROUP BY assignments.user_id
    )
    SELECT u.*, COALESCE(ts.subjects, '{}'::text[]) AS subjects
      FROM scoped_users u
      LEFT JOIN teacher_subjects ts ON ts.user_id = u.id
     ORDER BY u.role, u.username
  `;

  try {
    const result = await pool.query(queryText, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    // Old databases may still lack status columns. Migrate only when the query
    // actually needs them, so a new server instance does not run DDL on GET.
    if ((error as { code?: string }).code !== "42703") throw error;
    await ensureStatusSchema();
    const result = await pool.query(queryText, params);
    return NextResponse.json(result.rows);
  }
}

export async function POST(req: NextRequest) {
  const permError = await requirePermission(req, "users.create");
  if (permError) return permError;

  const context = await getSchoolContext(req);
  const schoolId = context?.schoolId || "00000000-0000-0000-0000-000000000001";

  const { name, username, password, role, student_id, homeroom_classroom_id, email, is_clerical, color } = await req.json();

  const finalName = name?.trim();
  let finalUsername = username?.trim();
  let finalPassword = password?.trim();
  let finalStudentId = student_id?.trim();
  const finalEmail = email?.trim() || null;
  const finalColor = typeof color === "string" && color.trim() ? color.trim() : null;

  if (role === "student") {
    if (!finalStudentId) {
      finalStudentId = `S${Math.floor(10000 + Math.random() * 90000)}`;
    }
    if (!finalUsername) {
      finalUsername = `std${Math.floor(10000 + Math.random() * 90000)}`;
    }
    if (!finalPassword) {
      finalPassword = "password123";
    }
  } else if (role === "teacher") {
    if (!finalUsername) {
      finalUsername = finalName || `tch${Math.floor(10000 + Math.random() * 90000)}`;
    }
    if (!finalPassword) {
      finalPassword = "password123";
    }
  } else {
    if (!finalUsername || !finalPassword) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password, role, student_id, homeroom_classroom_id, email, is_clerical, color, school_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, username, role, student_id, homeroom_classroom_id, email, is_clerical, color, school_id`,
      [finalUsername, hashedPassword, role, finalStudentId || null, homeroom_classroom_id || null, finalEmail, is_clerical || false, finalColor, schoolId]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "ชื่อผู้ใช้ หรือ รหัสนักเรียน หรือ อีเมล นี้ถูกใช้งานแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create user" }, { status: 500 });
  }
}
