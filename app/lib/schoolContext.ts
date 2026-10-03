import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { getAuthToken } from "@/app/lib/getAuthToken";
import { headers } from "next/headers";
import { decode } from "next-auth/jwt";
import type { AdminPermissions } from "./permissions/types";
import pool from "./db";

async function isResignedTeacher(userId: unknown, role: unknown) {
  if (role !== "teacher" || !userId) return false;
  try {
    const result = await pool.query(
      "SELECT COALESCE(status, 'active') AS status FROM users WHERE id = $1",
      [userId]
    );
    return result.rows[0]?.status === "resigned";
  } catch {
    // Keep legacy databases available until their status columns are migrated.
    return false;
  }
}

export interface SchoolContext {
  isSuperAdmin: boolean;
  schoolId: string | null;
  userId: string;
  role: string;
  isCoAdmin: boolean;
  adminPermissions: AdminPermissions | null;
  canAccessAdmin: boolean;
}

export async function getSchoolContext(req?: NextRequest): Promise<SchoolContext | null> {
  // 1. ตรวจสอบผ่าน NextRequest (รองรับ Authorization: Bearer <jwt> จาก Flutter และ NextAuth cookies)
  if (req) {
    const token = await getAuthToken(req);
    if (token?.id) {
      if (await isResignedTeacher(token.id, token.role)) return null;
      const isSuperAdmin = token.role === "super_admin";
      const isCoAdmin = Boolean(token.is_co_admin);
      const canAccessAdmin = isSuperAdmin || token.role === "admin" || isCoAdmin;
      return {
        isSuperAdmin,
        schoolId: (token.school_id as string | undefined) || null,
        userId: String(token.id),
        role: String(token.role),
        isCoAdmin,
        adminPermissions: (token.admin_permissions as AdminPermissions) || null,
        canAccessAdmin,
      };
    }
  }

  // 2. ถ้าไม่ได้ส่ง req มา ลองดึง Authorization header จาก next/headers (สำหรับ Route Handler)
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const raw = authHeader.slice(7).trim();
      const secret = process.env.NEXTAUTH_SECRET;
      if (raw && secret) {
        const token = await decode({ token: raw, secret });
        if (token?.id) {
          if (await isResignedTeacher(token.id, token.role)) return null;
          const isSuperAdmin = token.role === "super_admin";
          const isCoAdmin = Boolean(token.is_co_admin);
          const canAccessAdmin = isSuperAdmin || token.role === "admin" || isCoAdmin;
          return {
            isSuperAdmin,
            schoolId: (token.school_id as string | undefined) || null,
            userId: String(token.id),
            role: String(token.role),
            isCoAdmin,
            adminPermissions: (token.admin_permissions as AdminPermissions) || null,
            canAccessAdmin,
          };
        }
      }
    }
  } catch {
    // next/headers might fail if not in request scope
  }

  // 3. Fallback สำหรับ Server Actions / Server Components บนเว็บผ่าน Session Cookies
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = session.user as any;
  if (await isResignedTeacher(user.id, user.role)) return null;
  const isSuperAdmin = user.role === "super_admin";
  const isCoAdmin = Boolean(user.is_co_admin);
  const canAccessAdmin = isSuperAdmin || user.role === "admin" || isCoAdmin;

  if (isSuperAdmin) {
    return {
      isSuperAdmin: true,
      schoolId: null,
      userId: String(user.id),
      role: String(user.role),
      isCoAdmin: false,
      adminPermissions: null,
      canAccessAdmin: true,
    };
  }

  return {
    isSuperAdmin: false,
    schoolId: user.school_id || null,
    userId: String(user.id),
    role: String(user.role),
    isCoAdmin,
    adminPermissions: user.admin_permissions || null,
    canAccessAdmin,
  };
}
