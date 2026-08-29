import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/app/lib/getAuthToken";
import { Permission, AdminPermissions } from "./types";
import { hasPermission, hasAnyPermission, hasAllPermissions, isFullAdmin, UserPermissionContext } from "./checker";
import pool from "@/app/lib/db";

export interface RequestAuthContext {
  userId: string;
  role: string;
  schoolId: string | null;
  isCoAdmin: boolean;
  adminPermissions: AdminPermissions | null;
}

/**
 * Retrieve user permission context from Request JWT or DB.
 */
export async function getRequestUserPermissions(req: NextRequest): Promise<UserPermissionContext | null> {
  const token = await getAuthToken(req);
  if (!token?.id) return null;

  // If role is admin or super_admin, fast-path
  if (token.role === "admin" || token.role === "super_admin") {
    return {
      role: token.role as string,
      is_co_admin: false,
      admin_permissions: null,
    };
  }

  // If token already has is_co_admin and admin_permissions
  if (token.is_co_admin !== undefined) {
    return {
      role: token.role as string,
      is_co_admin: Boolean(token.is_co_admin),
      admin_permissions: (token.admin_permissions as AdminPermissions) || null,
    };
  }

  // Otherwise query database for real-time permissions
  try {
    const res = await pool.query(
      "SELECT role, is_co_admin, admin_permissions FROM users WHERE id = $1",
      [token.id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      role: row.role,
      is_co_admin: Boolean(row.is_co_admin),
      admin_permissions: (row.admin_permissions as AdminPermissions) || null,
    };
  } catch (err) {
    console.error("Failed to query user permissions:", err);
    return null;
  }
}

/**
 * Check if the request is made by a Full Admin (role === 'admin' | 'super_admin').
 * Returns NextResponse 401/403 if not authorized, or null if allowed.
 */
export async function requireFullAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = await getAuthToken(req);
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized: กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  if (token.role !== "admin" && token.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden: สิทธิ์นี้สำหรับผู้ดูแลระบบสูงสุด (Full Admin) เท่านั้น" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Check if the request has the required permission.
 * Returns NextResponse 401/403 if not authorized, or null if allowed.
 */
export async function requirePermission(
  req: NextRequest,
  permission: Permission
): Promise<NextResponse | null> {
  const user = await getRequestUserPermissions(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized: กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  if (isFullAdmin(user)) {
    return null;
  }

  if (!hasPermission(user, permission)) {
    return NextResponse.json(
      {
        error: `Forbidden: คุณไม่มีสิทธิ์สำหรับงานนี้ (${permission})`,
        requiredPermission: permission,
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Check if the request has ANY of the required permissions.
 * Returns NextResponse 401/403 if not authorized, or null if allowed.
 */
export async function requireAnyPermission(
  req: NextRequest,
  ...permissions: Permission[]
): Promise<NextResponse | null> {
  const user = await getRequestUserPermissions(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized: กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  if (isFullAdmin(user)) {
    return null;
  }

  if (!hasAnyPermission(user, ...permissions)) {
    return NextResponse.json(
      {
        error: `Forbidden: คุณไม่มีสิทธิ์เข้าถึงส่วนนี้`,
        requiredPermissions: permissions,
      },
      { status: 403 }
    );
  }

  return null;
}

