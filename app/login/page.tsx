"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
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
  Shield,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Lock,
  User,
  Calendar,
  Layers,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Zap,
  ChevronRight
} from "lucide-react";
import GuestChatWidget from "../components/GuestChatWidget";
import ThemeToggle from "../components/ThemeToggle";
import { SchoolLogo, type SchoolInfo, updateSchoolDocumentMeta } from "../components/SchoolBrand";

type LoginTab = "student" | "teacher" | "staff";

interface Classroom {
  id: string;
  name: string;
  student_count?: number | string;
}

interface Teacher {
  id: string;
  username: string;
}

interface Student {
  id: string;
  name: string;
  student_id: string;
  student_number?: number | null;
}

interface TabThemeConfig {
  label: string;
  sublabel: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeTabBg: string;
  btnGradient: string;
  btnShadow: string;
  cardBorder: string;
  inputFocusRing: string;
}

const TAB_CONFIG: Record<LoginTab, TabThemeConfig> = {
  student: {
    label: "นักเรียน",
    sublabel: "Student Portal",
    badge: "พอร์ทัลนักเรียน",
    icon: GraduationCap,
    accentColor: "text-emerald-600 dark:text-emerald-400",
    activeTabBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    btnGradient: "from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600",
    btnShadow: "shadow-emerald-600/25 hover:shadow-emerald-600/35",
    cardBorder: "border-emerald-500/30",
    inputFocusRing: "focus:border-emerald-500 focus:ring-emerald-500/10",
  },
  teacher: {
    label: "คุณครู",
    sublabel: "Teacher Portal",
    badge: "พอร์ทัลครูอาจารย์",
    icon: BookOpen,
    accentColor: "text-indigo-600 dark:text-indigo-400",
    activeTabBg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/40 text-indigo-700 dark:text-indigo-300",
    btnGradient: "from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:via-blue-500 hover:to-indigo-600",
    btnShadow: "shadow-indigo-600/25 hover:shadow-indigo-600/35",
    cardBorder: "border-indigo-500/30",
    inputFocusRing: "focus:border-indigo-500 focus:ring-indigo-500/10",
  },
  staff: {
    label: "บุคลากร / แอดมิน",
    sublabel: "Staff & Admin",
    badge: "เจ้าหน้าที่ฝ่ายบริหาร",
    icon: Shield,
    accentColor: "text-amber-600 dark:text-amber-400",
    activeTabBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-500/40 text-amber-700 dark:text-amber-300",
    btnGradient: "from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:via-orange-500 hover:to-amber-600",
    btnShadow: "shadow-amber-600/25 hover:shadow-amber-600/35",
    cardBorder: "border-amber-500/30",
    inputFocusRing: "focus:border-amber-500 focus:ring-amber-500/10",
  },
};

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder = "กรอกรหัสผ่านของคุณ",
  focusRingClass = "focus:border-indigo-500 focus:ring-indigo-500/10",
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  focusRingClass?: string;
}) {
  const [capsLock, setCapsLock] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          รหัสผ่าน
        </label>
        {capsLock && (
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Caps Lock เปิดอยู่
          </span>
        )}
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-700 dark:group-focus-within:text-slate-200 transition-colors">
          <Lock className="w-4 h-4" />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => setCapsLock(e.getModifierState && e.getModifierState("CapsLock"))}
          onKeyUp={(e) => setCapsLock(e.getModifierState && e.getModifierState("CapsLock"))}
          placeholder={placeholder}
          required
          className={`w-full pl-10 pr-11 py-3 text-sm bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 ${focusRingClass} focus:ring-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none font-medium`}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

  // Data states
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentYear, setStudentYear] = useState("2568");

  // Form field states
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [studentClassroom, setStudentClassroom] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Account linking states
  const [linkEmail, setLinkEmail] = useState("");
  const [linkProvider, setLinkProvider] = useState("");
  const [linkSig, setLinkSig] = useState("");
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  // Current school key
  const [currentSchoolKey, setCurrentSchoolKey] = useState("main");

  useEffect(() => {
    return () => Swal.close();
  }, []);

  useEffect(() => {
    setShowPassword(false);
  }, [activeTab]);

  // Initial Public Data Fetching
  useEffect(() => {
    setIsClient(true);
    const urlParams = new URLSearchParams(window.location.search);
    const schoolParam =
      urlParams.get("school") ||
      (typeof window !== "undefined" ? localStorage.getItem("selectedSchool") : null) ||
      "main";

    setCurrentSchoolKey(schoolParam);

    fetch(`/api/public/schools/${encodeURIComponent(schoolParam)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setSchoolInfo(data);
        updateSchoolDocumentMeta(data);
      })
      .catch(() => setSchoolInfo(null));

    fetch(`/api/public/classrooms?school=${encodeURIComponent(schoolParam)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Classroom[]) => {
        if (Array.isArray(data)) {
          const populatedClassrooms = data.filter(
            (classroom) => Number(classroom.student_count ?? 0) > 0
          );
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

  // Handle URL callback parameters and oauth redirects
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
      Swal.fire({
        icon: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: error,
        confirmButtonColor: "#4f46e5",
      });
      window.history.replaceState({}, "", "/login");
      return;
    }

    const redirectAfterLogin = () => {
      fetch("/api/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((user) => {
          if (!user) return;
          setIsRedirecting(true);
          Swal.fire({
            title: "กำลังเตรียมข้อมูลระบบ...",
            text: "โปรดรอสักครู่ ระบบกำลังจัดเตรียมข้อมูลบัญชีของคุณ",
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

  // Social Login Triggers
  const handleGoogleLogin = () => {
    const school =
      new URLSearchParams(window.location.search).get("school") ||
      localStorage.getItem("selectedSchool") ||
      "main";
    signIn("google", { callbackUrl: `/login?google=1&school=${encodeURIComponent(school)}` });
  };

  const handleLineLogin = () => {
    const school =
      new URLSearchParams(window.location.search).get("school") ||
      localStorage.getItem("selectedSchool") ||
      "main";
    signIn("line", { callbackUrl: `/login?line=1&school=${encodeURIComponent(school)}` });
  };

  const handleFacebookLogin = () => {
    const school =
      new URLSearchParams(window.location.search).get("school") ||
      localStorage.getItem("selectedSchool") ||
      "main";
    signIn("facebook", { callbackUrl: `/login?facebook=1&school=${encodeURIComponent(school)}` });
  };

  // Student list load on classroom change
  useEffect(() => {
    if (!studentClassroom) return;
    const urlParams = new URLSearchParams(window.location.search);
    const schoolParam =
      urlParams.get("school") ||
      (typeof window !== "undefined" ? localStorage.getItem("selectedSchool") : null) ||
      "main";

    fetch(
      `/api/public/students?classroomId=${studentClassroom}&school=${encodeURIComponent(schoolParam)}`
    )
      .then((r) => r.json())
      .then((data: Student[]) => {
        setStudents(data);
        setStudentId(data.length > 0 ? data[0].student_id : "");
      })
      .catch(() => setStudents([]));
  }, [studentClassroom]);

  // Handle Form Submission
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
          text: "ระบบกำลังผูกบัญชีเพื่อความสะดวกในการเข้าใช้งาน",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
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
            school:
              new URLSearchParams(window.location.search).get("school") ||
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
        school:
          new URLSearchParams(window.location.search).get("school") ||
          localStorage.getItem("selectedSchool") ||
          "main",
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("ไม่พบบัญชีผู้ใช้งานในระบบ");
      const user = await res.json();

      setIsRedirecting(true);
      const isCoAdminUser = user.role === "teacher" && Boolean(user.is_co_admin);
      const roleLabel =
        user.role === "admin" || user.role === "super_admin"
          ? user.role === "super_admin"
            ? "ผู้ดูแลระบบสูงสุด (Super Admin)"
            : "บุคลากร / เจ้าหน้าที่"
          : isCoAdminUser
          ? "คุณครู (Co-admin)"
          : user.role === "teacher"
          ? "คุณครู"
          : "นักเรียน";

      const roleGradient =
        user.role === "admin" || user.role === "super_admin" || isCoAdminUser
          ? "from-amber-500 to-orange-600"
          : user.role === "teacher"
          ? "from-indigo-500 to-blue-600"
          : "from-emerald-500 to-teal-600";

      Swal.fire({
        icon: "success",
        title: linkEmail ? "ผูกบัญชีและเข้าสู่ระบบสำเร็จ" : "เข้าสู่ระบบสำเร็จ",
        html: `
          <div class="flex flex-col items-center gap-3 mt-3">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white shadow-xl ring-4 ring-white/10">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">ยินดีต้อนรับเข้าสู่ระบบ</p>
              <p class="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">${roleLabel}</p>
            </div>
          </div>
        `,
        text: "กำลังนำคุณเข้าสู่หน้าจัดการ...",
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
      Swal.fire({
        icon: "error",
        title: linkEmail ? "เชื่อมต่อบัญชีไม่สำเร็จ" : "เข้าสู่ระบบไม่สำเร็จ",
        text: err.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        confirmButtonColor: "#4f46e5",
      });
    }
  };

  if (!isClient) return null;

  const currentTab = TAB_CONFIG[activeTab];
  const TabIconComponent = currentTab.icon;

  return (
    <div className="min-h-screen bg-slate-900 selection:bg-indigo-600 selection:text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Dynamic Ambient Backgrounds */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-10 right-1/4 w-[40rem] h-[36rem] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute -bottom-24 left-10 w-[32rem] h-[32rem] rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href={`/home?school=${encodeURIComponent(currentSchoolKey)}`}
          className="group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl p-1 transition-all"
        >
          <div className="h-10 w-10 rounded-2xl overflow-hidden bg-slate-800/90 border border-slate-700/60 p-1.5 shadow-md shadow-black/20 group-hover:scale-105 group-hover:border-indigo-500/60 transition-all flex items-center justify-center">
            <SchoolLogo
              school={schoolInfo}
              schoolKey={schoolInfo?.id || schoolInfo?.subdomain || currentSchoolKey}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                {schoolInfo?.name || "ระบบจัดการโรงเรียน"}
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                School Network
              </span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
              {schoolInfo?.name_en || "School Management System"}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>เปลี่ยนโรงเรียน</span>
          </Link>

          <ThemeToggle className="bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 shadow-sm h-9 w-9" />
        </div>
      </header>

      {/* Main Content: Balanced Layout (Compact Explanation + Heroic Login Block) */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex items-center">
        <div className="w-full grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* =========================================================================
              Column 1: Compact, Non-Intrusive Description & School Showcase (5 cols)
              ========================================================================= */}
          <section className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6 pr-2">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/70 border border-slate-700/60 shadow-xs backdrop-blur-md w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-300">ระบบคลาวด์เปิดให้บริการ</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-medium text-slate-400">ปีการศึกษา {studentYear}</span>
            </div>

            {/* Concise Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
                ระบบบริหารสถานศึกษา{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">
                  อัจฉริยะครบวงจร
                </span>
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                เข้าถึงข้อมูลผลการเรียน จัดการชั้นเรียน และติดตามความคืบหน้าของสถานศึกษาได้ทุกที่ทุกเวลา ด้วยความปลอดภัยระดับองค์กร
              </p>
            </div>

            {/* Compact Highlight List (Mini Feature Cards) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">ความปลอดภัยมาตรฐานสากล</h4>
                  <p className="text-[11px] text-slate-400">แยกสิทธิ์การใช้งานของนักเรียน คุณครู และฝ่ายบริหารอย่างชัดเจน</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">ข้อมูลเรียลไทม์ ซิงค์ทันใจ</h4>
                  <p className="text-[11px] text-slate-400">อัปเดตเกรด คะแนน และการเช็คชื่อเข้าเรียนแบบทันที</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">รองรับทุกอุปกรณ์</h4>
                  <p className="text-[11px] text-slate-400">ใช้งานสะดวกทั้งบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ทโฟน</p>
                </div>
              </div>
            </div>

            {/* Quick Link to Public Portal */}
            <div className="pt-1">
              <Link
                href={`/home?school=${encodeURIComponent(currentSchoolKey)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors group"
              >
                <span>ไปยังเว็บไซต์หลักของโรงเรียน</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>

          {/* =========================================================================
              Column 2: THE HERO — Prominent, Commanding Login Block (7 cols)
              ========================================================================= */}
          <section className="lg:col-span-7 w-full max-w-xl mx-auto">
            <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-9 space-y-6 transition-all duration-300">
              
              {/* Card Header & Title */}
              <div>
                {/* Account Linking Warning Banner */}
                {linkEmail ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>โหมดเชื่อมโยงบัญชีโซเชียล</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                      ไม่พบบัญชี <strong>{linkEmail}</strong> ({linkProvider}) ในระบบ กรุณาเลือกบัญชีและป้อนรหัสผ่านเพื่อทำการผูกบัญชี
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkEmail("");
                        setLinkProvider("");
                        setLinkSig("");
                      }}
                      className="text-xs font-bold px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/30 transition-colors"
                    >
                      ยกเลิกการผูกบัญชี
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-1">
                        Portal Login
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        เข้าสู่ระบบ
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {schoolInfo?.name || "ระบบจัดการโรงเรียน"} • ปีการศึกษา {studentYear}
                      </p>
                    </div>

                    <div className="h-12 w-12 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-1.5 shadow-sm hidden sm:flex items-center justify-center shrink-0">
                      <SchoolLogo
                        school={schoolInfo}
                        schoolKey={schoolInfo?.id || schoolInfo?.subdomain || currentSchoolKey}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Segmented Role Selector - Highly Prominent */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  เลือกบทบาทของคุณ
                </label>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl">
                  {(["student", "teacher", "staff"] as LoginTab[]).map((tab) => {
                    const config = TAB_CONFIG[tab];
                    const Icon = config.icon;
                    const isActive = activeTab === tab;

                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`
                          relative py-2.5 sm:py-3 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 outline-none
                          ${
                            isActive
                              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md shadow-black/5 dark:shadow-black/25"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-900/40"
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive ? config.accentColor + " scale-110" : ""}`} />
                        <span className="truncate w-full text-center text-xs">{config.label}</span>
                        {isActive && (
                          <span className={`absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-gradient-to-r ${config.btnGradient}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Role Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div
                  className={`p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border ${currentTab.cardBorder} space-y-3.5 transition-all duration-200`}
                >
                  {/* Active Role Notice */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <TabIconComponent className={`w-4 h-4 ${currentTab.accentColor}`} />
                      <span className={`text-xs font-bold ${currentTab.accentColor}`}>
                        เข้าใช้งานในฐานะ{currentTab.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {currentTab.badge}
                    </span>
                  </div>

                  {/* 1. STUDENT TAB */}
                  {activeTab === "student" && (
                    <div className="space-y-3">
                      {/* Academic Year */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            ปีการศึกษา
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            ปีปัจจุบัน
                          </span>
                        </label>
                        <input
                          value={`ปีการศึกษา ${studentYear}`}
                          disabled
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 font-semibold cursor-not-allowed"
                        />
                      </div>

                      {/* Classroom Selector */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          ชั้นเรียน / ห้องเรียน
                        </label>
                        <select
                          value={studentClassroom}
                          onChange={(e) => setStudentClassroom(e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${currentTab.inputFocusRing} focus:ring-4 text-slate-900 dark:text-slate-100 font-medium outline-none transition-all cursor-pointer`}
                          required
                        >
                          {classrooms.length === 0 ? (
                            <option value="" disabled>ไม่มีข้อมูลห้องเรียน</option>
                          ) : (
                            classrooms.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} {c.student_count ? `(${c.student_count} คน)` : ""}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Student Selector */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            เลือกรายชื่อนักเรียน
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {students.length} คน
                          </span>
                        </div>

                        <select
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${currentTab.inputFocusRing} focus:ring-4 text-slate-900 dark:text-slate-100 font-medium outline-none transition-all cursor-pointer`}
                          required
                        >
                          {students.length === 0 ? (
                            <option value="" disabled>
                              ไม่มีนักเรียนในชั้นนี้
                            </option>
                          ) : (
                            students.map((s) => (
                              <option key={s.id} value={s.student_id}>
                                {s.student_number ? `เลขที่ ${s.student_number} : ` : ""}
                                {s.name} ({s.student_id})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Student Password */}
                      <PasswordInput
                        value={studentPassword}
                        onChange={setStudentPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword(!showPassword)}
                        focusRingClass={currentTab.inputFocusRing}
                      />
                    </div>
                  )}

                  {/* 2. TEACHER TAB */}
                  {activeTab === "teacher" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            เลือกชื่อคุณครู
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {teachers.length} บัญชี
                          </span>
                        </label>
                        <select
                          value={teacherUsername}
                          onChange={(e) => setTeacherUsername(e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${currentTab.inputFocusRing} focus:ring-4 text-slate-900 dark:text-slate-100 font-medium outline-none transition-all cursor-pointer`}
                          required
                        >
                          {teachers.length === 0 ? (
                            <option value="" disabled>ไม่มีข้อมูลคุณครู</option>
                          ) : (
                            teachers.map((t) => (
                              <option key={t.id} value={t.username}>
                                {t.username}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <PasswordInput
                        value={teacherPassword}
                        onChange={setTeacherPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword(!showPassword)}
                        focusRingClass={currentTab.inputFocusRing}
                      />
                    </div>
                  )}

                  {/* 3. STAFF TAB */}
                  {activeTab === "staff" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          ชื่อผู้ใช้งาน (Username)
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={staffUsername}
                            onChange={(e) => setStaffUsername(e.target.value)}
                            placeholder="กรอกชื่อผู้ใช้ เช่น admin"
                            required
                            className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${currentTab.inputFocusRing} focus:ring-4 text-slate-900 dark:text-slate-100 font-medium outline-none transition-all`}
                          />
                        </div>
                      </div>

                      <PasswordInput
                        value={staffPassword}
                        onChange={setStaffPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword(!showPassword)}
                        focusRingClass={currentTab.inputFocusRing}
                      />
                    </div>
                  )}
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={isRedirecting}
                  className={`
                    w-full py-3.5 px-6 rounded-2xl font-bold text-white text-sm
                    bg-gradient-to-r ${currentTab.btnGradient}
                    shadow-lg ${currentTab.btnShadow}
                    hover:scale-[1.01] active:scale-[0.98]
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                    transition-all duration-200
                    flex items-center justify-center gap-2.5
                  `}
                >
                  {isRedirecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{linkEmail ? "ผูกบัญชีและเข้าสู่ระบบ" : `เข้าสู่ระบบ${currentTab.label}`}</span>
                      <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
                    </>
                  )}
                </button>
              </form>

              {/* Social Authentication Connectors */}
              {!linkEmail && (
                <div className="space-y-3 pt-1">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-bold">
                      <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">
                        หรือเข้าสู่ระบบด้วย
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Google */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 transition-all group"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Google</span>
                    </button>

                    {/* LINE */}
                    <button
                      type="button"
                      onClick={handleLineLogin}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold shadow-xs active:scale-95 transition-all group"
                    >
                      <svg className="w-4 h-4 fill-white transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                      <span>LINE</span>
                    </button>

                    {/* Facebook */}
                    <button
                      type="button"
                      onClick={handleFacebookLogin}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-xs active:scale-95 transition-all group"
                    >
                      <svg className="w-4 h-4 fill-white transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Support & Security Assurance */}
              <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>การเชื่อมต่อปลอดภัยด้วยการเข้ารหัส SSL 256-bit</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  หากพบปัญหาในการเข้าสู่ระบบ กรุณาติดต่อคุณครูประจำชั้นหรือผู้ดูแลระบบโรงเรียน
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Subtle Footer Bar */}
      <footer className="relative z-10 py-3 px-4 text-center">
        <p className="text-[11px] text-slate-500">
          © {new Date().getFullYear()} TDK IT School Network. ระบบบริหารจัดการสถานศึกษา
        </p>
      </footer>

      {/* Floating Guest Chat Widget */}
      <GuestChatWidget />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">กำลังโหลดระบบเข้าสู่ระบบ...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
