import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";
import { requireFullAdmin } from "@/app/lib/permissions/middleware";
import { sanitizeAndValidatePermissions } from "@/app/lib/permissions/definitions";
import { ensureStatusSchema } from "@/app/lib/statusMigration";

// PATCH /api/admin/co-admins/[id] - Update permissions for Co-admin (Full Admin Only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const permError = await requireFullAdmin(req);
  if (permError) return permError;

  await ensureStatusSchema();

  const ctx = await getSchoolContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const targetId = resolvedParams.id;

  try {
    const body = await req.json();
    const { admin_permissions } = body;

    const validation = sanitizeAndValidatePermissions(admin_permissions);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "ชุดสิทธิ์ไม่ถูกต้อง" }, { status: 400 });
    }

    // Check user existence
    const userCheck = await pool.query(
      "SELECT id, username, role, school_id, is_co_admin FROM users WHERE id = $1",
      [targetId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้ที่ระบุ" }, { status: 404 });
    }

    const targetUser = userCheck.rows[0];

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
      [permissionsJson, targetId]
    );

    return NextResponse.json({
      success: true,
      message: `อัปเดตสิทธิ์ของ ${targetUser.username} สำเร็จ`,
      coAdmin: updateResult.rows[0],
    });
  } catch (error: any) {
    console.error("Error updating co-admin permissions:", error);
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการอัปเดตสิทธิ์ Co-admin" }, { status: 500 });
  }
}

// DELETE /api/admin/co-admins/[id] - Revoke Co-admin status (Full Admin Only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const permError = await requireFullAdmin(req);
  if (permError) return permError;

  await ensureStatusSchema();

  const ctx = await getSchoolContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const targetId = resolvedParams.id;

  try {
    const userCheck = await pool.query(
      "SELECT id, username, role, school_id, is_co_admin FROM users WHERE id = $1",
      [targetId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้ที่ระบุ" }, { status: 404 });
    }

    const targetUser = userCheck.rows[0];

    // Check school isolation
    if (!ctx.isSuperAdmin && targetUser.school_id !== ctx.schoolId) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการผู้ใช้ของโรงเรียนอื่น" }, { status: 403 });
    }

    await pool.query(
      `UPDATE users
       SET is_co_admin = false, admin_permissions = NULL
       WHERE id = $1`,
      [targetId]
    );

    return NextResponse.json({
      success: true,
      message: `ถอดสิทธิ์ Co-admin ของ ${targetUser.username} เรียบร้อยแล้ว (กลับเป็นครูปกติ)`,
    });
  } catch (error: any) {
    console.error("Error revoking co-admin:", error);
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการถอดสิทธิ์ Co-admin" }, { status: 500 });
  }
}

