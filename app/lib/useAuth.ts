import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
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

export function useAuth() {
  const [user, setUser] = useState<DBUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
  };

  return { user, token, loading, logout };
}
