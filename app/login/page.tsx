"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  LogIn,
  GraduationCap,
  BookOpen,
  Settings,
  ShieldCheck,
  Users,
  Zap,
  ArrowLeft,
  Link2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import GuestChatWidget from "../components/GuestChatWidget";
import ThemeToggle from "../components/ThemeToggle";

type LoginTab = "staff" | "teacher" | "student";

interface Classroom { id: string; name: string; }
interface Teacher { id: string; username: string; }
interface Student { id: string; name: string; student_id: string; student_number?: number | null; }

const TAB_META: Record<LoginTab, { label: string; icon: React.ReactNode; gradient: string; ring: string }> = {
  student: { label: "นักเรียน", icon: <GraduationCap className="w-4 h-4" />, gradient: "from-violet-500 to-purple-600", ring: "ring-violet-500/40" },
  teacher: { label: "คุณครู", icon: <BookOpen className="w-4 h-4" />, gradient: "from-indigo-500 to-blue-600", ring: "ring-indigo-500/40" },
  staff:   { label: "บุคลากร", icon: <Settings className="w-4 h-4" />, gradient: "from-amber-500 to-orange-600", ring: "ring-amber-500/40" },
};

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="ui-label">รหัสผ่าน</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ui-input pr-11"
          placeholder="กรอกรหัสผ่าน"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-subtle-foreground hover:text-primary focus:outline-none transition-colors"
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LoginTab>("student");
  const [isClient, setIsClient] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentYear, setStudentYear] = useState("2568");

  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");

  const [studentClassroom, setStudentClassroom] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [linkEmail, setLinkEmail] = useState("");
  const [linkProvider, setLinkProvider] = useState("");
  const [linkSig, setLinkSig] = useState("");

  useEffect(() => {
    setShowPassword(false);
  }, [activeTab]);

  useEffect(() => {
    setIsClient(true);

    fetch("/api/public/classrooms")
      .then(r => r.json())
      .then((data: Classroom[]) => {
        setClassrooms(data);
        if (data.length > 0) setStudentClassroom(data[0].id);
      });

    fetch("/api/public/teachers")
      .then(r => r.json())
      .then((data: Teacher[]) => {
        setTeachers(data);
        if (data.length > 0) setTeacherUsername(data[0].username);
      });

    fetch("/api/public/settings")
      .then(r => r.json())
      .then(data => setStudentYear(data.academic_year ?? "2568"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const google = params.get("google");
    const emailParam = params.get("linkEmail");
    const providerParam = params.get("provider");
    const sigParam = params.get("sig");

    if (emailParam && providerParam && sigParam) {
      setLinkEmail(emailParam);
      setLinkProvider(providerParam);
      setLinkSig(sigParam);
      window.history.replaceState({}, "", "/login");
      return;
    }

    if (error) {
      Swal.fire({ icon: "error", title: "เข้าสู่ระบบไม่สำเร็จ", text: error });
      window.history.replaceState({}, "", "/login");
      return;
    }

    const redirectAfterLogin = () => {
      fetch("/api/me")
        .then(res => res.ok ? res.json() : null)
        .then(user => {
          if (!user) return;
          Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ", timer: 1000, showConfirmButton: false });
          if (user.role === "admin") router.push("/admin");
          else if (user.role === "teacher") router.push("/teacher");
          else router.push("/student");
        });
    };

    if (google === "1") {
      window.history.replaceState({}, "", "/login");
      redirectAfterLogin();
    }

    if (params.get("line") === "1") {
      window.history.replaceState({}, "", "/login");
      redirectAfterLogin();
    }

    if (params.get("facebook") === "1") {
      window.history.replaceState({}, "", "/login");
      redirectAfterLogin();
    }
  }, [router]);

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/login?google=1" });
  };

  const handleLineLogin = () => {
    signIn("line", { callbackUrl: "/login?line=1" });
  };

  const handleFacebookLogin = () => {
    signIn("facebook", { callbackUrl: "/login?facebook=1" });
  };

  useEffect(() => {
    if (!studentClassroom) return;
    fetch(`/api/public/students?classroomId=${studentClassroom}`)
      .then(r => r.json())
      .then((data: Student[]) => {
        setStudents(data);
        setStudentId(data.length > 0 ? data[0].student_id : "");
      });
  }, [studentClassroom]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    let username = "";
    let password = "";

    if (activeTab === "staff") {
      username = staffUsername;
      password = staffPassword;
    } else if (activeTab === "teacher") {
      username = teacherUsername;
      password = teacherPassword;
    } else {
      username = studentId;
      password = studentPassword;
    }

    try {
      if (linkEmail) {
        Swal.fire({
          title: "กำลังเชื่อมต่อบัญชี...",
          text: "กรุณารอสักครู่",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const linkRes = await fetch("/api/auth/link-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: linkEmail,
            provider: linkProvider,
            sig: linkSig,
            username,
            role: activeTab,
            password,
          }),
        });

        const linkData = await linkRes.json();
        if (!linkRes.ok) {
          throw new Error(linkData.error || "เกิดข้อผิดพลาดในการเชื่อมโยงบัญชี");
        }
      }

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
         throw new Error(result.error);
      }

      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("User not found");
      const user = await res.json();

      setIsRedirecting(true);
      const roleLabel = user.role === "admin" ? "บุคลากร" : user.role === "teacher" ? "คุณครู" : "นักเรียน";
      const roleGradient = user.role === "admin" ? "from-amber-500 to-orange-600" : user.role === "teacher" ? "from-indigo-500 to-blue-600" : "from-violet-500 to-purple-600";

      Swal.fire({
        icon: "success",
        title: linkEmail ? "เชื่อมต่อบัญชีและเข้าสู่ระบบสำเร็จ" : "เข้าสู่ระบบสำเร็จ",
        html: `
          <div class="flex flex-col items-center gap-3 mt-2">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white shadow-lg">
              ${user.role === "admin" ? '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>' : user.role === "teacher" ? '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>' : '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>'}
            </div>
            <span class="text-sm font-bold text-muted-foreground">กำลังเข้าสู่ระบบในฐานะ <span class="text-foreground">${roleLabel}</span></span>
          </div>
        `,
        timer: 1200,
        showConfirmButton: false,
      });

      if (user.role === "admin") router.push("/admin");
      else if (user.role === "teacher") router.push("/teacher");
      else router.push("/student");

    } catch (err: any) {
      setIsRedirecting(false);
      Swal.fire({ icon: "error", title: linkEmail ? "เชื่อมต่อบัญชีไม่สำเร็จ" : "เข้าสู่ระบบไม่สำเร็จ", text: err.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
  };

  if (!isClient) return null;

  const features = [
    { icon: <ShieldCheck className="w-5 h-5" />, title: "จัดการคะแนน", desc: "บันทึกและติดตามผลการเรียนแบบเรียลไทม์" },
    { icon: <Users className="w-5 h-5" />, title: "รวมทุกบทบาท", desc: "นักเรียน คุณครู และบุคลากรในที่เดียว" },
    { icon: <Zap className="w-5 h-5" />, title: "รวดเร็วทันสมัย", desc: "ใช้งานง่าย ลื่นไหล ทั้งบนมือถือและคอมพิวเตอร์" },
  ];

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      {/* ===================== LEFT — BRAND PANEL (desktop) ===================== */}
      <aside className="aurora-panel hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white">
        <Link href="/" className="relative z-10 flex items-center gap-3 animate-fade-in-down">
          <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 overflow-hidden shadow-lg">
            <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-lg font-bold tracking-tight">ระบบจัดการโรงเรียน</span>
        </Link>

        <div className="relative z-10 max-w-md animate-fade-in-up">
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
            บริหารจัดการ<br />ทั้งโรงเรียน<br />
            <span className="text-white/80">ในระบบเดียว</span>
          </h2>
          <p className="mt-5 text-white/75 text-base leading-relaxed">
            แพลตฟอร์มจัดการคะแนนและข้อมูลนักเรียน ออกแบบใหม่ให้ทันสมัย ใช้งานง่าย และรวดเร็ว
          </p>

          <ul className="mt-9 space-y-4">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  {f.icon}
                </span>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-white/70">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-white/60">
          &copy; {new Date().getFullYear()} ระบบจัดการโรงเรียน
        </p>
      </aside>

      {/* ===================== RIGHT — FORM ===================== */}
      <main className="relative flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-70" />

        <div className="absolute top-5 right-5 z-20">
          <ThemeToggle />
        </div>

        <Link
          href="/"
          className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          หน้าแรก
        </Link>

        <div className="relative z-10 w-full max-w-md animate-fade-in-up">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl overflow-hidden ring-1 ring-border shadow-md mb-3">
              <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
            </div>
          </div>

          {/* Heading */}
          {linkEmail ? (
            <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm flex flex-col gap-2 animate-fade-in-down">
              <div className="flex items-center gap-2 font-bold text-base">
                <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-500" />
                <span>โหมดเชื่อมโยงบัญชี</span>
              </div>
              <p>
                ไม่พบอีเมล <strong className="underline decoration-yellow-500/50">{linkEmail}</strong> ({linkProvider}) ในระบบ
                เพื่อความปลอดภัย กรุณาเลือกบัญชีของคุณด้านล่างและป้อนรหัสผ่านเพื่อทำการเชื่อมโยง
              </p>
              <button
                type="button"
                onClick={() => {
                  setLinkEmail("");
                  setLinkProvider("");
                  setLinkSig("");
                }}
                className="mt-2 self-start text-xs font-semibold px-3 py-1.5 rounded-lg border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 transition-colors"
              >
                ยกเลิกการเชื่อมโยง
              </button>
            </div>
          ) : (
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                ยินดีต้อนรับ<span className="brand-text"> กลับมา</span>
              </h1>
              <p className="mt-1.5 text-muted-foreground text-sm">
                เลือกบทบาทของคุณและเข้าสู่ระบบเพื่อดำเนินการต่อ
              </p>
            </div>
          )}

          {/* Segmented tabs */}
          <div className="ui-segment mb-6">
            {(["student", "teacher", "staff"] as LoginTab[]).map((key) => {
              const meta = TAB_META[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  data-active={activeTab === key}
                  className="ui-segment-item"
                >
                  {meta.icon}
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Card */}
          <div className="ui-card p-6 sm:p-7">
            {/* Role indicator strip */}
            <div className={`h-1 rounded-full bg-gradient-to-r ${TAB_META[activeTab].gradient} mb-5`} />

            <form onSubmit={handleLogin} className="space-y-4">
              {/* STUDENT TAB */}
              {activeTab === "student" && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="ui-label">ปีการศึกษา</label>
                    <div className="relative">
                      <input value={studentYear} disabled className="ui-input pr-16" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 ui-chip ui-chip-warning">ล็อก</span>
                    </div>
                  </div>
                  <div>
                    <label className="ui-label">ชั้นเรียน</label>
                    <select
                      value={studentClassroom}
                      onChange={(e) => setStudentClassroom(e.target.value)}
                      className="ui-input"
                      required
                    >
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="ui-label">ชื่อนักเรียน</label>
                    <select
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="ui-input"
                      required
                    >
                      {students.length === 0 ? (
                        <option value="" disabled>ไม่มีนักเรียนในชั้นนี้</option>
                      ) : (
                        students.map((s) => (
                          <option key={s.id} value={s.student_id}>
                            {s.student_number ? `เลขที่ ${s.student_number} : ` : ""}{s.name} ({s.student_id})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <PasswordField value={studentPassword} onChange={setStudentPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
              )}

              {/* TEACHER TAB */}
              {activeTab === "teacher" && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="ui-label">ชื่อคุณครู</label>
                    <select
                      value={teacherUsername}
                      onChange={(e) => setTeacherUsername(e.target.value)}
                      className="ui-input"
                      required
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.username}>{t.username}</option>
                      ))}
                    </select>
                  </div>
                  <PasswordField value={teacherPassword} onChange={setTeacherPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
              )}

              {/* STAFF TAB */}
              {activeTab === "staff" && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="ui-label">ชื่อผู้ใช้งาน (Username)</label>
                    <input
                      type="text"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      className="ui-input"
                      placeholder="admin"
                      required
                    />
                  </div>
                  <PasswordField value={staffPassword} onChange={setStaffPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
              )}

              <button
                type="submit"
                disabled={isRedirecting}
                className="ui-btn ui-btn-primary w-full py-3.5 text-base mt-2 group disabled:opacity-60"
              >
                {isRedirecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    {linkEmail ? "ผูกบัญชีและเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
                  </>
                )}
              </button>
            </form>

            {!linkEmail && (
              <>
                <div className="ui-divider my-6 text-xs font-semibold uppercase tracking-wider">หรือ</div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="ui-btn ui-btn-outline w-full py-3 group"
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    เข้าสู่ระบบด้วย Google
                  </button>
                  <button
                    type="button"
                    onClick={handleLineLogin}
                    className="ui-btn w-full py-3 text-white group"
                    style={{ background: "#06C755" }}
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="white">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                    เข้าสู่ระบบด้วย LINE
                  </button>
                  <button
                    type="button"
                    onClick={handleFacebookLogin}
                    className="ui-btn w-full py-3 text-white group"
                    style={{ background: "#1877F2" }}
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    เข้าสู่ระบบด้วย Facebook
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="lg:hidden text-center text-xs text-subtle-foreground mt-6">
            ระบบจัดการโรงเรียน &copy; {new Date().getFullYear()}
          </p>
        </div>
      </main>

      <GuestChatWidget />
    </div>
  );
}
