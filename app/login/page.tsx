"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ArrowRight,
  AlertTriangle,
  Lock,
  User,
  Calendar,
  Layers,
  Building2,
  ShieldCheck,
  Smartphone,
  Zap,
  ChevronRight,
  ChevronDown,
  Globe,
} from "lucide-react";
import GuestChatWidget from "../components/GuestChatWidget";
import ThemeToggle from "../components/ThemeToggle";
import {
  SchoolLogo,
  type SchoolInfo,
  updateSchoolDocumentMeta,
} from "../components/SchoolBrand";

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
  shortLabel: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentText: string;
  softBg: string;
  softBorder: string;
  activePill: string;
  btnClass: string;
  focusRing: string;
  indicatorClass: string;
}

const TAB_CONFIG: Record<LoginTab, TabThemeConfig> = {
  student: {
    label: "นักเรียน",
    shortLabel: "นักเรียน",
    badge: "Student Portal",
    icon: GraduationCap,
    accentText: "text-teal-700 dark:text-teal-300",
    softBg: "bg-teal-50/70 dark:bg-teal-950/30",
    softBorder: "border-teal-200/80 dark:border-teal-800/50",
    activePill:
      "bg-white dark:bg-[#2a3548] text-teal-800 dark:text-teal-200 shadow-sm ring-1 ring-teal-500/25 dark:ring-teal-400/30",
    btnClass:
      "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 dark:from-teal-500 dark:to-emerald-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white shadow-teal-700/20 dark:shadow-teal-950/40",
    focusRing:
      "focus:border-teal-500 dark:focus:border-teal-400 focus:ring-teal-500/15 dark:focus:ring-teal-400/20",
    indicatorClass: "bg-teal-600 dark:bg-teal-400",
  },
  teacher: {
    label: "คุณครู",
    shortLabel: "คุณครู",
    badge: "Teacher Portal",
    icon: BookOpen,
    accentText: "text-indigo-700 dark:text-indigo-300",
    softBg: "bg-indigo-50/70 dark:bg-indigo-950/30",
    softBorder: "border-indigo-200/80 dark:border-indigo-800/50",
    activePill:
      "bg-white dark:bg-[#2a3548] text-indigo-800 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/25 dark:ring-indigo-400/30",
    btnClass:
      "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 dark:from-indigo-500 dark:to-blue-500 dark:hover:from-indigo-400 dark:hover:to-blue-400 text-white shadow-indigo-700/20 dark:shadow-indigo-950/40",
    focusRing:
      "focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/15 dark:focus:ring-indigo-400/20",
    indicatorClass: "bg-indigo-600 dark:bg-indigo-400",
  },
  staff: {
    label: "บุคลากร / แอดมิน",
    shortLabel: "บุคลากร",
    badge: "Staff & Admin",
    icon: Shield,
    accentText: "text-amber-700 dark:text-amber-300",
    softBg: "bg-amber-50/70 dark:bg-amber-950/25",
    softBorder: "border-amber-200/80 dark:border-amber-800/50",
    activePill:
      "bg-white dark:bg-[#2a3548] text-amber-800 dark:text-amber-200 shadow-sm ring-1 ring-amber-500/25 dark:ring-amber-400/30",
    btnClass:
      "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 text-white shadow-amber-800/20 dark:shadow-amber-950/40",
    focusRing:
      "focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500/15 dark:focus:ring-amber-400/20",
    indicatorClass: "bg-amber-600 dark:bg-amber-400",
  },
};

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder = "กรอกรหัสผ่านของคุณ",
  focusRingClass = "focus:border-indigo-500 focus:ring-indigo-500/15",
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
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
          รหัสผ่าน
        </label>
        {capsLock && (
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Caps Lock เปิดอยู่
          </span>
        )}
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-400 group-focus-within:text-slate-700 dark:group-focus-within:text-slate-200 transition-colors">
          <Lock className="w-4 h-4" />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) =>
            setCapsLock(Boolean(e.getModifierState && e.getModifierState("CapsLock")))
          }
          onKeyUp={(e) =>
            setCapsLock(Boolean(e.getModifierState && e.getModifierState("CapsLock")))
          }
          placeholder={placeholder}
          required
          className={`w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm bg-white dark:bg-[#192231] border border-slate-200/90 dark:border-slate-700/80 rounded-xl ${focusRingClass} focus:ring-4 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none font-medium`}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors border-0 bg-transparent cursor-pointer"
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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<LoginTab>("student");
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

  // Account linking states (initialized from URL params without setState in effect)
  const [linkEmail, setLinkEmail] = useState(() => {
    const email = searchParams.get("linkEmail");
    const provider = searchParams.get("provider");
    const sig = searchParams.get("sig");
    return email && provider && sig ? email : "";
  });
  const [linkProvider, setLinkProvider] = useState(() => {
    const email = searchParams.get("linkEmail");
    const provider = searchParams.get("provider");
    const sig = searchParams.get("sig");
    return email && provider && sig ? provider : "";
  });
  const [linkSig, setLinkSig] = useState(() => {
    const email = searchParams.get("linkEmail");
    const provider = searchParams.get("provider");
    const sig = searchParams.get("sig");
    return email && provider && sig ? sig : "";
  });
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  // Current school key
  const [currentSchoolKey, setCurrentSchoolKey] = useState(
    () => searchParams.get("school") || "main"
  );

  useEffect(() => {
    return () => Swal.close();
  }, []);

  const handleTabChange = (tab: LoginTab) => {
    setActiveTab(tab);
    setShowPassword(false);
  };

  // Initial Public Data Fetching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const schoolParam =
      urlParams.get("school") ||
      (typeof window !== "undefined" ? localStorage.getItem("selectedSchool") : null) ||
      "main";

    fetch(`/api/public/schools/${encodeURIComponent(schoolParam)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setCurrentSchoolKey(schoolParam);
        setSchoolInfo(data);
        updateSchoolDocumentMeta(data);
      })
      .catch(() => {
        setCurrentSchoolKey(schoolParam);
        setSchoolInfo(null);
      });

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
    signIn("google", {
      callbackUrl: `/login?google=1&school=${encodeURIComponent(school)}`,
    });
  };

  const handleLineLogin = () => {
    const school =
      new URLSearchParams(window.location.search).get("school") ||
      localStorage.getItem("selectedSchool") ||
      "main";
    signIn("line", {
      callbackUrl: `/login?line=1&school=${encodeURIComponent(school)}`,
    });
  };

  const handleFacebookLogin = () => {
    const school =
      new URLSearchParams(window.location.search).get("school") ||
      localStorage.getItem("selectedSchool") ||
      "main";
    signIn("facebook", {
      callbackUrl: `/login?facebook=1&school=${encodeURIComponent(school)}`,
    });
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
          ? "from-amber-500 to-amber-600"
          : user.role === "teacher"
          ? "from-indigo-500 to-blue-600"
          : "from-teal-500 to-emerald-600";

      Swal.fire({
        icon: "success",
        title: linkEmail ? "ผูกบัญชีและเข้าสู่ระบบสำเร็จ" : "เข้าสู่ระบบสำเร็จ",
        html: `
          <div class="flex flex-col items-center gap-3 mt-3">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white shadow-lg ring-4 ring-white/10">
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
    } catch (err: unknown) {
      setIsRedirecting(false);
      const message =
        err instanceof Error
          ? err.message
          : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
      Swal.fire({
        icon: "error",
        title: linkEmail ? "เชื่อมต่อบัญชีไม่สำเร็จ" : "เข้าสู่ระบบไม่สำเร็จ",
        text: message,
        confirmButtonColor: "#4f46e5",
      });
    }
  };

  const currentTab = TAB_CONFIG[activeTab];
  const TabIconComponent = currentTab.icon;
  const resolvedSchoolKey = schoolInfo?.id || schoolInfo?.subdomain || currentSchoolKey;

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-x-hidden font-sans bg-gradient-to-br from-[#eef2f7] via-[#f4f6fb] to-[#e9eef6] dark:from-[#161c28] dark:via-[#1b2333] dark:to-[#171f2e] text-slate-800 dark:text-slate-100 selection:bg-indigo-500/25 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      {/* Soft, Balanced Ambient Backdrop (Never too dark, never too bright, never garish) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] rounded-full bg-indigo-400/12 dark:bg-indigo-400/10 blur-[120px]" />
        <div className="absolute -bottom-28 -left-20 w-[30rem] h-[30rem] rounded-full bg-teal-400/12 dark:bg-teal-400/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-[22rem] h-[22rem] rounded-full bg-amber-300/10 dark:bg-amber-400/6 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(100,116,139,0.12)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:26px_26px] opacity-70" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full border-b border-slate-200/70 dark:border-slate-700/50 bg-white/65 dark:bg-[#1c2434]/75 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link
            href={`/home?school=${encodeURIComponent(currentSchoolKey)}`}
            className="group inline-flex items-center gap-3 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl py-1"
          >
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-white dark:bg-[#253045] border border-slate-200/90 dark:border-slate-700/80 p-1 shadow-xs group-hover:border-indigo-400/60 transition-all shrink-0 flex items-center justify-center">
              <SchoolLogo
                school={schoolInfo}
                schoolKey={resolvedSchoolKey}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                  {schoolInfo?.name || "ระบบจัดการโรงเรียน"}
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
                  ปีการศึกษา {studentYear}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {schoolInfo?.name_en || "School Management System"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              title="เปลี่ยนโรงเรียน"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3.5 text-xs font-bold text-slate-600 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 bg-white/85 dark:bg-[#242e42] hover:bg-white dark:hover:bg-[#2b374e] border border-slate-200/90 dark:border-slate-700/80 rounded-xl transition-all shadow-2xs"
            >
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">เปลี่ยนโรงเรียน</span>
            </Link>

            <ThemeToggle className="!h-9 !w-9 bg-white/85 dark:bg-[#242e42] border-slate-200/90 dark:border-slate-700/80 text-slate-600 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          {/* =================================================================
              Desktop Left Column: Balanced Editorial School Showcase (5 cols)
              ================================================================= */}
          <section className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6">
            {/* Academic Year Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#232d40]/85 border border-slate-200/85 dark:border-slate-700/70 shadow-2xs w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                ระบบพร้อมให้บริการ
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                ปีการศึกษา {studentYear}
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl xl:text-[2.25rem] font-black text-slate-800 dark:text-slate-50 leading-[1.2] tracking-tight">
                ระบบบริหารสถานศึกษา{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 dark:from-indigo-300 dark:via-sky-300 dark:to-teal-300 bg-clip-text text-transparent">
                  ที่ใช้งานง่ายและครบวงจร
                </span>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                ศูนย์รวมข้อมูลผลการเรียน ตารางสอน และการจัดการชั้นเรียนสำหรับนักเรียน คุณครู และฝ่ายบริหาร เข้าใช้งานได้สะดวกทุกที่ทุกเวลา
              </p>
            </div>

            {/* Tasteful Feature Cards */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/75 dark:bg-[#212b3d]/75 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-sm shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/12 dark:bg-indigo-400/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    แยกสิทธิ์การเข้าถึงชัดเจน
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    ปลอดภัยด้วยการแบ่งพอร์ทัลสำหรับนักเรียน คุณครู และผู้ดูแลระบบ
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/75 dark:bg-[#212b3d]/75 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-sm shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-teal-500/12 dark:bg-teal-400/15 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-300 shrink-0 mt-0.5">
                  <Zap className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    อัปเดตข้อมูลแบบเรียลไทม์
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    ตรวจสอบผลการเรียน คะแนนเก็บ และการเช็คชื่อเข้าเรียนได้ทันที
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/75 dark:bg-[#212b3d]/75 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-sm shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-amber-500/12 dark:bg-amber-400/15 border border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    รองรับทุกหน้าจออย่างลงตัว
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    ใช้งานลื่นไหลทั้งบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ทโฟน
                  </p>
                </div>
              </div>
            </div>

            {/* Public School Portal Link */}
            <div className="pt-1">
              <Link
                href={`/home?school=${encodeURIComponent(currentSchoolKey)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 transition-colors group"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>ไปยังหน้าเว็บไซต์หลักของโรงเรียน</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </section>

          {/* =================================================================
              Right Column (Desktop) / Centered Column (Tablet & Mobile)
              ================================================================= */}
          <section className="lg:col-span-7 w-full max-w-[500px] mx-auto lg:ml-auto lg:mr-0 space-y-4">
            {/* Tablet Compact Welcome Strip (md to < lg) */}
            <div className="hidden md:flex lg:hidden items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-white/75 dark:bg-[#212b3d]/80 border border-slate-200/80 dark:border-slate-700/70 backdrop-blur-sm shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                    ระบบบริหารสถานศึกษา • ปีการศึกษา {studentYear}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    เลือกบทบาทและเข้าสู่ระบบเพื่อใช้งานพอร์ทัลของคุณ
                  </div>
                </div>
              </div>
              <Link
                href={`/home?school=${encodeURIComponent(currentSchoolKey)}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:underline shrink-0"
              >
                <span>หน้าหลัก</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Main Login Card */}
            <div className="rounded-3xl bg-white/95 dark:bg-[#222c3e]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/75 shadow-[0_20px_50px_-15px_rgba(30,41,59,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)] p-5 sm:p-7 lg:p-8 space-y-5 sm:space-y-6 transition-colors duration-300">
              {/* Card Header / Account Linking Banner */}
              {linkEmail ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-700/50 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>โหมดเชื่อมโยงบัญชีโซเชียล</span>
                  </div>
                  <p className="text-xs text-amber-900/80 dark:text-amber-200/90 leading-relaxed">
                    ไม่พบบัญชี <strong>{linkEmail}</strong> ({linkProvider}) ในระบบ
                    กรุณาเลือกบัญชีและกรอกรหัสผ่านเพื่อผูกบัญชี
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkEmail("");
                      setLinkProvider("");
                      setLinkSig("");
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    ยกเลิกการผูกบัญชี
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      Portal Login
                    </div>
                    <h2 className="text-2xl sm:text-[1.7rem] font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                      เข้าสู่ระบบ
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                      {schoolInfo?.name || "ระบบจัดการโรงเรียน"} • ปีการศึกษา {studentYear}
                    </p>
                  </div>

                  <div className="h-12 w-12 rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#192231] border border-slate-200/90 dark:border-slate-700/80 p-1.5 shadow-2xs hidden sm:flex items-center justify-center shrink-0">
                    <SchoolLogo
                      school={schoolInfo}
                      schoolKey={resolvedSchoolKey}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Role Segmented Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  เลือกบทบาทผู้ใช้งาน
                </label>
                <div
                  role="tablist"
                  aria-label="เลือกบทบาทผู้ใช้งาน"
                  className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/90 dark:bg-[#18202f] border border-slate-200/80 dark:border-slate-700/70 rounded-2xl"
                >
                  {(["student", "teacher", "staff"] as LoginTab[]).map((tab) => {
                    const config = TAB_CONFIG[tab];
                    const Icon = config.icon;
                    const isActive = activeTab === tab;

                    return (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => handleTabChange(tab)}
                        className={`relative min-h-[54px] sm:min-h-[58px] py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center justify-center gap-1 border-0 cursor-pointer ${
                          isActive
                            ? config.activePill
                            : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-[#232d40]/60"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform ${
                            isActive ? `${config.accentText} scale-105` : ""
                          }`}
                        />
                        <span className="truncate w-full text-center text-[11px] sm:text-xs">
                          <span className="sm:hidden">{config.shortLabel}</span>
                          <span className="hidden sm:inline">{config.label}</span>
                        </span>
                        {isActive && (
                          <span
                            className={`absolute bottom-1 inset-x-4 h-0.5 rounded-full ${config.indicatorClass}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div
                  className={`p-4 sm:p-5 rounded-2xl ${currentTab.softBg} border ${currentTab.softBorder} space-y-3.5 transition-colors duration-200`}
                >
                  {/* Active Role Header */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <TabIconComponent
                        className={`w-4 h-4 shrink-0 ${currentTab.accentText}`}
                      />
                      <span className={`text-xs font-bold truncate ${currentTab.accentText}`}>
                        เข้าใช้งานในฐานะ{currentTab.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 shrink-0">
                      {currentTab.badge}
                    </span>
                  </div>

                  {/* 1. STUDENT FORM */}
                  {activeTab === "student" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Academic Year */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              ปีการศึกษา
                            </span>
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded-md">
                              ปัจจุบัน
                            </span>
                          </label>
                          <input
                            value={`ปีการศึกษา ${studentYear}`}
                            disabled
                            className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100/90 dark:bg-[#192231]/65 border border-slate-200/80 dark:border-slate-700/70 rounded-xl text-slate-500 dark:text-slate-400 font-semibold cursor-not-allowed"
                          />
                        </div>

                        {/* Classroom Selector */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            ชั้นเรียน / ห้องเรียน
                          </label>
                          <div className="relative">
                            <select
                              value={studentClassroom}
                              onChange={(e) => setStudentClassroom(e.target.value)}
                              className={`w-full min-h-[44px] appearance-none pl-3.5 pr-9 py-2.5 text-sm bg-white dark:bg-[#192231] border border-slate-200/90 dark:border-slate-700/80 rounded-xl ${currentTab.focusRing} focus:ring-4 text-slate-800 dark:text-slate-100 font-medium outline-none transition-all cursor-pointer`}
                              required
                            >
                              {classrooms.length === 0 ? (
                                <option value="" disabled>
                                  ไม่มีข้อมูลห้องเรียน
                                </option>
                              ) : (
                                classrooms.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} {c.student_count ? `(${c.student_count} คน)` : ""}
                                  </option>
                                ))
                              )}
                            </select>
                            <ChevronDown className="pointer-events-none w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                      </div>

                      {/* Student Selector */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            เลือกรายชื่อนักเรียน
                          </label>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {students.length} คน
                          </span>
                        </div>

                        <div className="relative">
                          <select
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className={`w-full min-h-[44px] appearance-none pl-3.5 pr-9 py-2.5 text-sm bg-white dark:bg-[#192231] border border-slate-200/90 dark:border-slate-700/80 rounded-xl ${currentTab.focusRing} focus:ring-4 text-slate-800 dark:text-slate-100 font-medium outline-none transition-all cursor-pointer`}
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
                          <ChevronDown className="pointer-events-none w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      {/* Student Password */}
                      <PasswordInput
                        value={studentPassword}
                        onChange={setStudentPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword((prev) => !prev)}
                        focusRingClass={currentTab.focusRing}
                      />
                    </div>
                  )}

                  {/* 2. TEACHER FORM */}
                  {activeTab === "teacher" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            เลือกชื่อคุณครู
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {teachers.length} บัญชี
                          </span>
                        </label>
                        <div className="relative">
                          <select
                            value={teacherUsername}
                            onChange={(e) => setTeacherUsername(e.target.value)}
                            className={`w-full min-h-[44px] appearance-none pl-3.5 pr-9 py-2.5 text-sm bg-white dark:bg-[#192231] border border-slate-200/90 dark:border-slate-700/80 rounded-xl ${currentTab.focusRing} focus:ring-4 text-slate-800 dark:text-slate-100 font-medium outline-none transition-all cursor-pointer`}
                            required
                          >
                            {teachers.length === 0 ? (
                              <option value="" disabled>
                                ไม่มีข้อมูลคุณครู
                              </option>
                            ) : (
                              teachers.map((t) => (
                                <option key={t.id} value={t.username}>
                                  {t.username}
                                </option>
                              ))
                            )}
                          </select>
                          <ChevronDown className="pointer-events-none w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <PasswordInput
                        value={teacherPassword}
                        onChange={setTeacherPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword((prev) => !prev)}
                        focusRingClass={currentTab.focusRing}
                      />
                    </div>
                  )}

                  {/* 3. STAFF FORM */}
                  {activeTab === "staff" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          ชื่อผู้ใช้งาน (Username)
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={staffUsername}
                            onChange={(e) => setStaffUsername(e.target.value)}
                            placeholder="กรอกชื่อผู้ใช้ เช่น admin"
                            required
                            className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-[#192231] border border-slate-200/90 dark:border-slate-700/80 rounded-xl ${currentTab.focusRing} focus:ring-4 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-none transition-all`}
                          />
                        </div>
                      </div>

                      <PasswordInput
                        value={staffPassword}
                        onChange={setStaffPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword((prev) => !prev)}
                        focusRingClass={currentTab.focusRing}
                      />
                    </div>
                  )}
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isRedirecting}
                  className={`w-full min-h-[48px] py-3 px-6 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer ${currentTab.btnClass}`}
                >
                  {isRedirecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>
                        {linkEmail
                          ? "ผูกบัญชีและเข้าสู่ระบบ"
                          : `เข้าสู่ระบบ${currentTab.label}`}
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-85" />
                    </>
                  )}
                </button>
              </form>

              {/* Social Authentication (Refined, Uniform, Balanced in Light & Dark) */}
              {!linkEmail && (
                <div className="space-y-3 pt-0.5">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200/90 dark:border-slate-700/75" />
                    </div>
                    <div className="relative flex justify-center text-[11px] font-semibold">
                      <span className="bg-white dark:bg-[#222c3e] px-3 text-slate-400 dark:text-slate-400">
                        หรือเข้าสู่ระบบด้วยบัญชีที่ผูกไว้
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Google */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="flex items-center justify-center gap-2 min-h-[42px] py-2 px-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#192231] hover:bg-slate-50 dark:hover:bg-[#273349] hover:border-slate-300 dark:hover:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer group"
                    >
                      <svg
                        className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105"
                        viewBox="0 0 24 24"
                      >
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
                      className="flex items-center justify-center gap-2 min-h-[42px] py-2 px-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#192231] hover:bg-emerald-50/70 dark:hover:bg-emerald-950/35 hover:border-emerald-300/80 dark:hover:border-emerald-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer group"
                    >
                      <svg
                        className="w-4 h-4 shrink-0 fill-[#06C755] transition-transform group-hover:scale-105"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                      <span>LINE</span>
                    </button>

                    {/* Facebook */}
                    <button
                      type="button"
                      onClick={handleFacebookLogin}
                      className="flex items-center justify-center gap-2 min-h-[42px] py-2 px-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#192231] hover:bg-blue-50/70 dark:hover:bg-blue-950/35 hover:border-blue-300/80 dark:hover:border-blue-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer group"
                    >
                      <svg
                        className="w-4 h-4 shrink-0 fill-[#1877F2] transition-transform group-hover:scale-105"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Support & Security Footer inside Card */}
              <div className="pt-3 text-center border-t border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>การเชื่อมต่อปลอดภัยด้วยการเข้ารหัส SSL 256-bit</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  หากพบปัญหาในการเข้าสู่ระบบ กรุณาติดต่อคุณครูประจำชั้นหรือผู้ดูแลระบบโรงเรียน
                </p>
                {/* Mobile quick link to school website */}
                <div className="pt-1 md:hidden">
                  <Link
                    href={`/home?school=${encodeURIComponent(currentSchoolKey)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>ไปยังหน้าเว็บไซต์หลักของโรงเรียน</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="relative z-10 py-3.5 px-4 text-center border-t border-slate-200/60 dark:border-slate-700/40 bg-white/40 dark:bg-[#18202f]/40">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} TDK IT School Network • ระบบบริหารจัดการสถานศึกษา
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
        <div className="min-h-screen flex items-center justify-center bg-[#eef2f7] dark:bg-[#161c28]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-3 border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              กำลังโหลดหน้าเข้าสู่ระบบ...
            </p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
