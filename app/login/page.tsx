"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LogIn, GraduationCap, BookOpen, Shield, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import GuestChatWidget from "../components/GuestChatWidget";
import ThemeToggle from "../components/ThemeToggle";
import { SchoolLogo, type SchoolInfo, updateSchoolDocumentMeta } from "../components/SchoolBrand";

type LoginTab = "staff" | "teacher" | "student";

interface Classroom { id: string; name: string; student_count?: number | string; }
interface Teacher { id: string; username: string; }
interface Student { id: string; name: string; student_id: string; student_number?: number | null; }

const TAB_CONFIG: Record<LoginTab, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgGradient: string; borderColor: string; }> = {
  student: { label: "นักเรียน", icon: GraduationCap, color: "text-violet-600 dark:text-violet-400", bgGradient: "from-violet-500/10 via-purple-500/5 to-transparent", borderColor: "border-violet-500/50" },
  teacher: { label: "คุณครู", icon: BookOpen, color: "text-blue-600 dark:text-blue-400", bgGradient: "from-blue-500/10 via-indigo-500/5 to-transparent", borderColor: "border-blue-500/50" },
  staff: { label: "บุคลากร", icon: Shield, color: "text-amber-600 dark:text-amber-400", bgGradient: "from-amber-500/10 via-orange-500/5 to-transparent", borderColor: "border-amber-500/50" },
};

function PasswordField({ value, onChange, show, onToggle }: { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">รหัสผ่าน</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" placeholder="กรอกรหัสผ่าน" required />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg transition-colors" aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
          {show ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

function LoginContent() {
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
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => { return () => Swal.close(); }, []);
  useEffect(() => { setShowPassword(false); }, [activeTab]);

  useEffect(() => {
    setIsClient(true);
    const urlParams = new URLSearchParams(window.location.search);
    const schoolParam = urlParams.get("school") || (typeof window !== "undefined" ? localStorage.getItem("selectedSchool") : null) || "main";

    fetch(`/api/public/schools/${encodeURIComponent(schoolParam)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setSchoolInfo(data); updateSchoolDocumentMeta(data); })
      .catch(() => setSchoolInfo(null));

    fetch(`/api/public/classrooms?school=${encodeURIComponent(schoolParam)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Classroom[]) => {
        if (Array.isArray(data)) {
          const populatedClassrooms = data.filter((classroom) => Number(classroom.student_count ?? 0) > 0);
          setClassrooms(populatedClassrooms);
          if (populatedClassrooms.length > 0) setStudentClassroom(populatedClassrooms[0].id);
        }
      })
      .catch(() => setClassrooms([]));

    fetch(`/api/public/teachers?school=${encodeURIComponent(schoolParam)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Teacher[]) => {
        if (Array.isArray(data)) {
          setTeachers(data);
          if (data.length > 0) setTeacherUsername(data[0].username);
        }
      })
      .catch(() => setTeachers([]));

    fetch(`/api/public/settings?school=${encodeURIComponent(schoolParam)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStudentYear(data?.academic_year ?? "2568"))
      .catch(() => setStudentYear("2568"));
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
          setIsRedirecting(true);
          Swal.fire({
            title: "กำลังเตรียมข้อมูล...",
            text: "โปรดรอสักครู่ ระบบกำลังโหลดข้อมูลสำหรับบัญชีของคุณ",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => Swal.showLoading(),
          });
          if (user.role === "super_admin") router.push("/super-admin");
          else if (user.role === "admin") router.push("/admin");
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
    const school = new URLSearchParams(window.location.search).get("school") || localStorage.getItem("selectedSchool") || "main";
    signIn("google", { callbackUrl: `/login?google=1&school=${encodeURIComponent(school)}` });
  };

  const handleLineLogin = () => {
    const school = new URLSearchParams(window.location.search).get("school") || localStorage.getItem("selectedSchool") || "main";
    signIn("line", { callbackUrl: `/login?line=1&school=${encodeURIComponent(school)}` });
  };

  const handleFacebookLogin = () => {
    const school = new URLSearchParams(window.location.search).get("school") || localStorage.getItem("selectedSchool") || "main";
    signIn("facebook", { callbackUrl: `/login?facebook=1&school=${encodeURIComponent(school)}` });
  };

  useEffect(() => {
    if (!studentClassroom) return;
    const urlParams = new URLSearchParams(window.location.search);
    const schoolParam = urlParams.get("school") || (typeof window !== "undefined" ? localStorage.getItem("selectedSchool") : null) || "main";
    fetch(`/api/public/students?classroomId=${studentClassroom}&school=${encodeURIComponent(schoolParam)}`)
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
            school: new URLSearchParams(window.location.search).get("school") ||
              localStorage.getItem("selectedSchool") ||
              "main",
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
        school: new URLSearchParams(window.location.search).get("school") ||
          localStorage.getItem("selectedSchool") ||
          "main",
        redirect: false,
      });

      if (result?.error) {
         throw new Error(result.error);
      }

      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("User not found");
      const user = await res.json();

      setIsRedirecting(true);
      const isCoAdminUser = user.role === "teacher" && Boolean(user.is_co_admin);
      const roleLabel = (user.role === "admin" || user.role === "super_admin")
        ? (user.role === "super_admin" ? "ผู้ดูแลระบบสูงสุด (Super Admin)" : "บุคลากร")
        : isCoAdminUser
        ? "คุณครู (Co-admin)"
        : user.role === "teacher" ? "คุณครู" : "นักเรียน";
      const roleGradient = (user.role === "admin" || user.role === "super_admin" || isCoAdminUser) ? "from-amber-500 to-orange-600" : user.role === "teacher" ? "from-indigo-500 to-blue-600" : "from-violet-500 to-purple-600";

      Swal.fire({
        icon: "success",
        title: linkEmail ? "เชื่อมต่อบัญชีและเข้าสู่ระบบสำเร็จ" : "เข้าสู่ระบบสำเร็จ",
        html: `
          <div class="flex flex-col items-center gap-3 mt-2">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white shadow-lg">
              ${(user.role === "admin" || user.role === "super_admin" || isCoAdminUser) ? '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>' : user.role === "teacher" ? '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>' : '<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>'}
            </div>
            <span class="text-sm font-bold text-muted-foreground">กำลังเข้าสู่ระบบในฐานะ <span class="text-foreground">${roleLabel}</span></span>
          </div>
        `,
        text: "กำลังโหลดข้อมูลของคุณ...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
        showConfirmButton: false,
      });

      if (user.role === "super_admin") router.push("/super-admin");
      else if (user.role === "admin") router.push("/admin");
      else if (user.role === "teacher") router.push("/teacher");
      else router.push("/student");

    } catch (err: any) {
      setIsRedirecting(false);
      Swal.fire({ icon: "error", title: linkEmail ? "เชื่อมต่อบัญชีไม่สำเร็จ" : "เข้าสู่ระบบไม่สำเร็จ", text: err.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
  };

  if (!isClient) return null;

  const config = TAB_CONFIG[activeTab];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-border shadow-lg group-hover:ring-primary transition-all">
                <SchoolLogo school={schoolInfo} schoolKey={schoolInfo?.id || schoolInfo?.subdomain} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">ระบบจัดการโรงเรียน</h2>
                <p className="text-sm text-muted-foreground">{schoolInfo?.name || "School Management System"}</p>
              </div>
            </Link>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              จัดการโรงเรียน<br />
              <span className="bg-gradient-to-r from-primary via-violet-600 to-blue-600 bg-clip-text text-transparent">
                ได้อย่างมีประสิทธิภาพ
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              ระบบครบวงจรสำหรับบริหารจัดการคะแนน ข้อมูลนักเรียน และงานธุรการ ด้วยเทคโนโลยีที่ทันสมัย
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">ใช้งานง่าย</h3>
                <p className="text-xs text-muted-foreground mt-0.5">ออกแบบให้ใช้งานสะดวก</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">ปลอดภัย</h3>
                <p className="text-xs text-muted-foreground mt-0.5">ข้อมูลเข้ารหัสและปลอดภัย</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-border shadow-lg">
                <SchoolLogo school={schoolInfo} schoolKey={schoolInfo?.id || schoolInfo?.subdomain} className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-foreground">ระบบจัดการโรงเรียน</h2>
                <p className="text-xs text-muted-foreground">{schoolInfo?.name || "School Management"}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Link account warning */}
            {linkEmail ? (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 space-y-2">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-semibold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>โหมดเชื่อมโยงบัญชี</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ไม่พบอีเมล <strong>{linkEmail}</strong> ({linkProvider}) ในระบบ กรุณาเลือกบัญชีของคุณและป้อนรหัสผ่านเพื่อทำการเชื่อมโยง
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLinkEmail("");
                    setLinkProvider("");
                    setLinkSig("");
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 transition-colors"
                >
                  ยกเลิกการเชื่อมโยง
                </button>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">ยินดีต้อนรับกลับ</h2>
                <p className="text-sm text-muted-foreground">เลือกบทบาทของคุณเพื่อเข้าสู่ระบบ</p>
              </div>
            )}

            {/* Role tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted/50 rounded-xl">
              {(["student", "teacher", "staff"] as LoginTab[]).map((tab) => {
                const tabConfig = TAB_CONFIG[tab];
                const TabIcon = tabConfig.icon;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`
                      relative px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                      flex flex-col items-center gap-1.5
                      ${isActive
                        ? 'bg-card shadow-md text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                      }
                    `}
                  >
                    <TabIcon className={`w-5 h-5 ${isActive ? tabConfig.color : ''}`} />
                    <span className="text-xs">{tabConfig.label}</span>
                    {isActive && (
                      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r ${tabConfig.bgGradient.replace('/10', '').replace('/5', '')}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className={`rounded-xl p-4 bg-gradient-to-br ${config.bgGradient} border ${config.borderColor}`}>
                <div className="flex items-center gap-2 mb-3">
                  <IconComponent className={`w-5 h-5 ${config.color}`} />
                  <span className={`font-semibold ${config.color}`}>เข้าสู่ระบบในฐานะ{config.label}</span>
                </div>

                <div className="space-y-3">
                  {activeTab === "student" && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground">ปีการศึกษา</label>
                        <div className="relative">
                          <input value={studentYear} disabled className="w-full px-4 py-3 bg-muted/50 border-2 border-border rounded-xl text-muted-foreground cursor-not-allowed" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded">ล็อก</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground">ชั้นเรียน</label>
                        <select value={studentClassroom} onChange={(e) => setStudentClassroom(e.target.value)} className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required>
                          {classrooms.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground">ชื่อนักเรียน</label>
                        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required>
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
                    </>
                  )}

                  {activeTab === "teacher" && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground">ชื่อคุณครู</label>
                        <select value={teacherUsername} onChange={(e) => setTeacherUsername(e.target.value)} className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" required>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.username}>{t.username}</option>
                          ))}
                        </select>
                      </div>
                      <PasswordField value={teacherPassword} onChange={setTeacherPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                    </>
                  )}

                  {activeTab === "staff" && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground">ชื่อผู้ใช้งาน</label>
                        <input type="text" value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)} className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" placeholder="admin" required />
                      </div>
                      <PasswordField value={staffPassword} onChange={setStaffPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isRedirecting}
                className={`
                  w-full py-3.5 px-6 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90
                  shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-200
                  flex items-center justify-center gap-2
                `}
              >
                {isRedirecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>{linkEmail ? "ผูกบัญชีและเข้าสู่ระบบ" : "เข้าสู่ระบบ"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {!linkEmail && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground font-semibold">หรือเข้าสู่ระบบด้วย</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button type="button" onClick={handleGoogleLogin} className="w-full py-3 px-4 rounded-xl border-2 border-border hover:bg-muted/50 transition-all flex items-center justify-center gap-2 font-medium group">
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-foreground">Google</span>
                  </button>
                  <button type="button" onClick={handleLineLogin} className="w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 font-medium group text-white" style={{ background: "#06C755" }}>
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="white">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                    <span>LINE</span>
                  </button>
                  <button type="button" onClick={handleFacebookLogin} className="w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 font-medium group text-white" style={{ background: "#1877F2" }}>
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>กลับสู่หน้าแรก</span>
            </Link>
          </div>
        </div>
      </div>

      <GuestChatWidget />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
