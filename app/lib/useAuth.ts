import { useEffect, useState } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

export interface DBUser {
  id: string;
  firebase_uid: string;
  username: string;
  role: "admin" | "teacher" | "student";
  student_id?: string;
  homeroom_classroom_id?: string;
  subjects?: string[];
}

// Firebase ID token หมดอายุทุก 1 ชม. -> บังคับ refresh ทุก 10 นาทีกันหลุดระหว่างใช้งาน
const TOKEN_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function useAuth() {
  const [user, setUser] = useState<DBUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiration, setTokenExpiration] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setToken(null);
        setTokenExpiration(null);
        setLoading(false);
        return;
      }
      const idTokenResult = await firebaseUser.getIdTokenResult();
      setToken(idTokenResult.token);
      setTokenExpiration(new Date(idTokenResult.expirationTime));
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${idTokenResult.token}` },
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const interval = setInterval(() => {
      auth.currentUser?.getIdToken(true);
    }, TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setToken(null);
    setTokenExpiration(null);
  };

  return { user, token, tokenExpiration, loading, logout };
}
