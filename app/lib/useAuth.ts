import { useMemo } from "react";
import { useSession, signOut } from "next-auth/react";

export interface DBUser {
  id: string;
  username: string;
  role: "admin" | "teacher" | "student";
  student_id?: string;
  homeroom_classroom_id?: string;
  subjects?: string[];
  email?: string | null;
}

export function useAuth() {
  const { data: session, status, update } = useSession();

  const loading = status === "loading";

  // useMemo เพื่อให้ reference ของ user คงที่ระหว่าง render ถ้า session ไม่เปลี่ยน
  // ไม่งั้น useEffect ที่มี user เป็น dependency (ในหน้า admin/teacher/student) จะ fire ซ้ำไม่รู้จบ
  const user: DBUser | null = useMemo(() => {
    if (!session?.user) return null;
    const su = session.user as any;
    return {
      id: su.id,
      username: session.user!.name || "",
      role: su.role,
      student_id: su.student_id,
      homeroom_classroom_id: su.homeroom_classroom_id,
      subjects: su.subjects,
      email: su.email,
    };
  }, [session]);

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return { user, token: "next-auth-cookie", loading, logout, update };
}
