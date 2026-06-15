import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

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
  const { data: session, status } = useSession();
  const [user, setUser] = useState<DBUser | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  
  const loading = status === "loading" || isFetching;

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      // Fetch full details from /api/me just like before to ensure compatibility
      fetch("/api/me")
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setUser(data);
          setIsFetching(false);
        })
        .catch(() => {
          setUser(null);
          setIsFetching(false);
        });
    } else {
      setUser(null);
      setIsFetching(false);
    }
  }, [session, status]);

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return { user, token: "next-auth-cookie", loading, logout };
}
