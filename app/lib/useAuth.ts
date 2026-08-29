import { useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import type { AdminPermissions } from "./permissions/types";

export interface DBUser {
  id: string;
  username: string;
  role: "super_admin" | "admin" | "teacher" | "student";
  school_id?: string;
  student_id?: string;
  homeroom_classroom_id?: string;
  subjects?: string[];
  email?: string | null;
  is_clerical?: boolean;
  is_co_admin?: boolean;
  admin_permissions?: AdminPermissions | null;
}

export function useAuth() {
  const { data: session, status, update } = useSession();

  const loading = status === "loading";

  const user: DBUser | null = useMemo(() => {
    if (!session?.user) return null;
    const su = session.user as any;
    return {
      id: su.id,
      username: session.user!.name || "",
      role: su.role,
      school_id: su.school_id,
      student_id: su.student_id,
      homeroom_classroom_id: su.homeroom_classroom_id,
      subjects: su.subjects,
      email: su.email,
      is_clerical: su.is_clerical,
      is_co_admin: su.is_co_admin ?? false,
      admin_permissions: su.admin_permissions ?? null,
    };
  }, [session]);

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return { user, token: "next-auth-cookie", loading, logout, update };
}

