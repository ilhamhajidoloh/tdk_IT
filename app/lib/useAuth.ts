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

  const user: DBUser | null = session?.user
    ? {
        id: (session.user as any).id,
        username: session.user.name || "",
        role: (session.user as any).role,
        student_id: (session.user as any).student_id,
        homeroom_classroom_id: (session.user as any).homeroom_classroom_id,
        subjects: (session.user as any).subjects,
        email: (session.user as any).email,
      }
    : null;

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return { user, token: "next-auth-cookie", loading, logout, update };
}
