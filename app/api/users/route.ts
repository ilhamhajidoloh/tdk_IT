import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { requirePermission } from "@/app/lib/permissions/middleware";

async function hasSubjectTeachersTable(): Promise<boolean> {
  try {
    await pool.query("SELECT 1 FROM subject_teachers LIMIT 0");
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const permError = await requirePermission(req, "users.view");
  if (permError) return permError;

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

  let queryText = "";
  const params: any[] = [];
  let whereClause = "";

  if (schoolId) {
    params.push(schoolId);
    whereClause = `WHERE u.school_id = $1 OR u.school_id IS NULL`;
  }

  if (multiTeacherReady) {
    queryText = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.school_id,
        u.student_id, 
        u.homeroom_classroom_id,
        u.is_clerical,
        COALESCE(
          (
            SELECT array_agg(DISTINCT s.name)
            FROM subjects s
            LEFT JOIN subject_teachers st ON st.subject_id = s.id
            WHERE s.teacher_id = u.id OR st.user_id = u.id
          ),
          '{}'::text[]
        ) as subjects
      FROM users u
      ${whereClause}
      ORDER BY u.role, u.username
    `;
  } else {
    queryText = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.school_id,
        u.student_id, 
        u.homeroom_classroom_id,
        u.is_clerical,
        COALESCE(
          (
            SELECT array_agg(DISTINCT s.name)
            FROM subjects s
            WHERE s.teacher_id = u.id
          ),
          '{}'::text[]
        ) as subjects
      FROM users u
      ${whereClause}
      ORDER BY u.role, u.username
    `;
  }

  const result = await pool.query(queryText, params);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const permError = await requirePermission(req, "users.create");
  if (permError) return permError;

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId || "00000000-0000-0000-0000-000000000001";

  const { name, username, password, role, student_id, homeroom_classroom_id, subjects, email, is_clerical } = await req.json();

  let finalName = name?.trim();
  let finalUsername = username?.trim();
  let finalPassword = password?.trim();
  let finalStudentId = student_id?.trim();
  const finalEmail = email?.trim() || null;

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
      `INSERT INTO users (username, password, role, student_id, homeroom_classroom_id, email, is_clerical, school_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, role, student_id, homeroom_classroom_id, email, is_clerical, school_id`,
      [finalUsername, hashedPassword, role, finalStudentId || null, homeroom_classroom_id || null, finalEmail, is_clerical || false, schoolId]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "ชื่อผู้ใช้ หรือ รหัสนักเรียน หรือ อีเมล นี้ถูกใช้งานแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}
