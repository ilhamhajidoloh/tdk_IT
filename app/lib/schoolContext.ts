import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { getAuthToken } from "@/app/lib/getAuthToken";
import { headers } from "next/headers";
import { decode } from "next-auth/jwt";

export interface SchoolContext {
  isSuperAdmin: boolean;
  schoolId: string | null;
  userId: string;
  role: string;
}

export async function getSchoolContext(req?: NextRequest): Promise<SchoolContext | null> {
  // 1. ตรวจสอบผ่าน NextRequest (รองรับ Authorization: Bearer <jwt> จาก Flutter และ NextAuth cookies)
  if (req) {
    const token = await getAuthToken(req);
    if (token?.id) {
      const isSuperAdmin = token.role === "super_admin";
      return {
        isSuperAdmin,
        schoolId: (token.school_id as string | undefined) || null,
        userId: String(token.id),
        role: String(token.role),
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
          const isSuperAdmin = token.role === "super_admin";
          return {
            isSuperAdmin,
            schoolId: (token.school_id as string | undefined) || null,
            userId: String(token.id),
            role: String(token.role),
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

  if (user.role === "super_admin") {
    return {
      isSuperAdmin: true,
      schoolId: null,
      userId: String(user.id),
      role: String(user.role),
    };
  }

  return {
    isSuperAdmin: false,
    schoolId: user.school_id || null,
    userId: String(user.id),
    role: String(user.role),
  };
}
