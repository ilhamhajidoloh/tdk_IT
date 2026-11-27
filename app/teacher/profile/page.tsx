"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/useAuth";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  GraduationCap,
  User,
  Mail,
  Lock,
  LogOut,
  BookOpen,
  Home,
  ShieldCheck,
  KeyRound,
  Loader2,
} from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import { DBUser, DBSubject, DBClassroom } from "../components/types";

export default function TeacherProfilePage() {
  const { user, loading, logout, token, update } = useAuth();
  const router = useRouter();
  const [, setProfileData] = useState<DBUser | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [subjects, setSubjects] = useState<DBSubject[]>([]);
  const [homeroomClass, setHomeroomClass] = useState<DBClassroom | null>(null);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setEmail(data.email || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }, [token]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "teacher") {
      router.push("/login");
      return;
    }
    if (!token) return;

    let cancelled = false;
    const userId = user.id;

    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !cancelled) {
          setProfileData(data);
          setEmail(data.email || "");
        }
      })
      .catch((error) => console.error("Error loading profile:", error));

    fetch("/api/subjects", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((allSubjects: DBSubject[]) => {
        if (cancelled) return;
        const mySubjects = allSubjects.filter(
          (s) => s.teacher_id === userId || s.teacher_ids?.includes(userId)
        );
        setSubjects(mySubjects);
      })
      .catch((error) => console.error("Error loading subjects:", error));

    fetch("/api/public/classrooms")
      .then((res) => (res.ok ? res.json() : []))
      .then((classrooms: DBClassroom[]) => {
        if (cancelled) return;
        setHomeroomClass(classrooms.find((c) => c.homeroom_teacher_ids?.includes(userId)) || null);
      })
      .catch((error) => console.error("Error loading classrooms:", error));

    return () => {
      cancelled = true;
    };
  }, [user, loading, router, token]);

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      Swal.fire("ข้อผิดพลาด", "กรุณากรอกอีเมล", "error");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        await update();
        Swal.fire("สำเร็จ!", "อัปเดตอีเมลเรียบร้อยแล้ว", "success");
        void loadProfile();
      } else {
        Swal.fire("ข้อผิดพลาด", result.error || "ไม่สามารถอัปเดตอีเมลได้", "error");
      }
    } catch {
      Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Swal.fire("ข้อผิดพลาด", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire("ข้อผิดพลาด", "รหัสผ่านไม่ตรงกัน", "error");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire("สำเร็จ!", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "success");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Swal.fire("ข้อผิดพลาด", result.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้", "error");
      }
    } catch {
      Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "ออกจากระบบ?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
    });

    if (result.isConfirmed) {
      await logout();
      router.push("/login");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const displayName = user.username || "T";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 grid-backdrop opacity-50 -z-10" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.push("/teacher")}
              aria-label="กลับหน้าหลัก"
              className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-foreground truncate">โปรไฟล์ของฉัน</h1>
              <p className="text-xs text-muted-foreground truncate">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
            </div>
          </div>

          <ThemeToggle className="!h-9 !w-9 !rounded-xl shrink-0" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 space-y-6 animate-fade-in-up">
        {/* Hero Profile Card */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/8 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-sky-500/8 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary/12 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <span className="text-3xl sm:text-4xl font-extrabold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 w-full text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2.5">
                {displayName}
              </h2>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  ครูผู้สอน
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ใช้งานอยู่
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/50 border border-border p-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    วิชาที่สอน
                  </div>
                  <div className="text-sm sm:text-base font-bold text-foreground">
                    {subjects.length} วิชา
                  </div>
                </div>

                <div className="rounded-xl bg-muted/50 border border-border p-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                    <Home className="w-3.5 h-3.5 text-primary" />
                    ห้องประจำชั้น
                  </div>
                  <div className="text-sm sm:text-base font-bold text-foreground truncate">
                    {homeroomClass?.name_thai || homeroomClass?.name || "ไม่มี"}
                  </div>
                </div>

                <div className="rounded-xl bg-muted/50 border border-border p-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    บทบาท
                  </div>
                  <div className="text-sm sm:text-base font-bold text-primary">Teacher</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Account & Email Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Information */}
          <section className="ui-card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">ข้อมูลบัญชี</h3>
                <p className="text-xs text-muted-foreground">รายละเอียดสำหรับเข้าสู่ระบบ</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="ui-label">ชื่อผู้ใช้</label>
                <div className="px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-sm font-semibold text-foreground">
                  {user.username}
                </div>
              </div>
              <div>
                <label className="ui-label">รหัสผู้ใช้</label>
                <div className="px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-xs font-mono text-muted-foreground break-all">
                  {user.id}
                </div>
              </div>
            </div>
          </section>

          {/* Email Settings */}
          <section className="ui-card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">อีเมล</h3>
                <p className="text-xs text-muted-foreground">อัปเดตอีเมลสำหรับการติดต่อและการแจ้งเตือน</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="teacher-email" className="ui-label">
                  ที่อยู่อีเมล
                </label>
                <input
                  id="teacher-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ui-input"
                  placeholder="example@email.com"
                />
              </div>
              <button
                type="button"
                onClick={handleUpdateEmail}
                disabled={isUpdating}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกอีเมล"
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Password Section */}
        <section className="ui-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">ความปลอดภัย</h3>
              <p className="text-xs text-muted-foreground">เปลี่ยนรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="teacher-new-password" className="ui-label">
                รหัสผ่านใหม่
              </label>
              <input
                id="teacher-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="ui-input"
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>
            <div>
              <label htmlFor="teacher-confirm-password" className="ui-label">
                ยืนยันรหัสผ่าน
              </label>
              <input
                id="teacher-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="ui-input"
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleUpdatePassword}
            disabled={isUpdating}
            className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                เปลี่ยนรหัสผ่าน
              </>
            )}
          </button>
        </section>

        {/* Logout Section */}
        <section className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">ออกจากระบบ</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  เมื่อคุณออกจากระบบ คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อใช้งานต่อ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
