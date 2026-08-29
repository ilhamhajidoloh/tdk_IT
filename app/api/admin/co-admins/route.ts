import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { requireFullAdmin } from "@/app/lib/permissions/middleware";
import { sanitizeAndValidatePermissions } from "@/app/lib/permissions/definitions";
import { ensureStatusSchema } from "@/app/lib/statusMigration";

// GET /api/admin/co-admins - Fetch all co-admins and available teachers for appointment (Full Admin Only)
export async function GET(req: NextRequest) {
  const permError = await requireFullAdmin(req);
  if (permError) return permError;

  await ensureStatusSchema();

  const ctx = await getSchoolContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const targetSchool = ctx.isSuperAdmin
    ? url.searchParams.get("schoolId") || url.searchParams.get("school_id") || ctx.schoolId
    : ctx.schoolId;

  try {
    // 1. Fetch current Co-admins
    const coAdminsQuery = targetSchool
      ? `SELECT id, username, email, role, is_co_admin, admin_permissions, school_id, created_at, subjects, homeroom_classroom_id, status
         FROM users
         WHERE is_co_admin = true AND school_id = $1
         ORDER BY username ASC`
      : `SELECT id, username, email, role, is_co_admin, admin_permissions, school_id, created_at, subjects, homeroom_classroom_id, status
         FROM users
         WHERE is_co_admin = true
         ORDER BY username ASC`;

    const coAdminsParams = targetSchool ? [targetSchool] : [];
    const coAdminsResult = await pool.query(coAdminsQuery, coAdminsParams);

    // 2. Fetch all teachers (eligible to be Co-admin)
    const teachersQuery = targetSchool
      ? `SELECT id, username, email, role, is_co_admin, admin_permissions, school_id, created_at, subjects, homeroom_classroom_id, status
         FROM users
         WHERE role = 'teacher' AND school_id = $1
         ORDER BY username ASC`
      : `SELECT id, username, email, role, is_co_admin, admin_permissions, school_id, created_at, subjects, homeroom_classroom_id, status
         FROM users
         WHERE role = 'teacher'
         ORDER BY username ASC`;

    const teachersParams = targetSchool ? [targetSchool] : [];
    const teachersResult = await pool.query(teachersQuery, teachersParams);

    return NextResponse.json({
      coAdmins: coAdminsResult.rows,
      teachers: teachersResult.rows,
    });
  } catch (error: any) {
    console.error("Error fetching co-admins:", error);
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล Co-admin" }, { status: 500 });
  }
}

// POST /api/admin/co-admins - Appoint a teacher as Co-admin with permissions (Full Admin Only)
export async function POST(req: NextRequest) {
  const permError = await requireFullAdmin(req);
  if (permError) return permError;

  await ensureStatusSchema();

  const ctx = await getSchoolContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, admin_permissions } = body;

    if (!userId) {
      return NextResponse.json({ error: "กรุณาระบุผู้ใช้ที่ต้องการแต่งตั้งเป็น Co-admin" }, { status: 400 });
    }

    // Validate and sanitize permissions
    const validation = sanitizeAndValidatePermissions(admin_permissions);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "ชุดสิทธิ์ไม่ถูกต้อง" }, { status: 400 });
    }

    // Check user existence and role
    const userCheck = await pool.query(
      "SELECT id, username, role, school_id FROM users WHERE id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้ที่ระบุ" }, { status: 404 });
    }

    const targetUser = userCheck.rows[0];

    // Only teachers can be appointed as Co-admin (admins are already full admins)
    if (targetUser.role !== "teacher") {
      return NextResponse.json({ error: "สามารถแต่งตั้งเฉพาะผู้ใช้ Role ครู (Teacher) เป็น Co-admin ได้เท่านั้น" }, { status: 400 });
    }

    // Check school isolation
    if (!ctx.isSuperAdmin && targetUser.school_id !== ctx.schoolId) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการผู้ใช้ของโรงเรียนอื่น" }, { status: 403 });
    }

    const permissionsJson = JSON.stringify(validation.permissions || {});

    const updateResult = await pool.query(
      `UPDATE users
       SET is_co_admin = true, admin_permissions = $1::jsonb
       WHERE id = $2
       RETURNING id, username, email, role, is_co_admin, admin_permissions, school_id, created_at, subjects, homeroom_classroom_id`,
      [permissionsJson, userId]
    );

    return NextResponse.json({
      success: true,
      message: `แต่งตั้ง ${targetUser.username} เป็น Co-admin สำเร็จ`,
      coAdmin: updateResult.rows[0],
    });
  } catch (error: any) {
    console.error("Error creating co-admin:", error);
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการแต่งตั้ง Co-admin" }, { status: 500 });
  }
}

