"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  Newspaper,
  CalendarDays,
  Users,
  Sparkles,
  Shield,
  Building2,
  RefreshCw,
  LogIn,
  MapPin,
  Phone,
  Mail,
  Info,
  Zap,
  TrendingUp,
  Bell,
  Search,
  Share2,
  Check,
  Clock,
  Calendar,
  ExternalLink,
  ChefHat,
  ChevronRight,
  X,
  AlertCircle,
  Copy,
  BookOpen,
  ArrowUpRight
} from "lucide-react";
import GuestChatWidget from "../components/GuestChatWidget";
import ThemeToggle from "../components/ThemeToggle";
import { SchoolLogo, updateSchoolDocumentMeta } from "../components/SchoolBrand";
import { formatThaiDate, formatThaiDateRange } from "../lib/format";
import CalendarTimeline from "../components/CalendarTimeline";

// ==========================================
// TYPE DEFINITIONS (API Logic Preserved)
// ==========================================

interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  target_audience?: 'all' | 'admin' | 'teacher' | 'student';
}

interface HolidayItem {
  id: string;
  date: string;
  reason: string;
  applies_to?: "all" | "teachers" | "cooks";
}

interface TeacherMember {
  id: string;
  username: string;
}

interface CookMember {
  id: string;
  name: string;
}

interface TeacherDutyGroup {
  id: string;
  name: string;
  weekStart: string;
  weekEnd: string;
  members: TeacherMember[];
  allDaysClosed?: boolean;
}

interface CookDayEntry {
  date: string;
  id: string;
  name: string;
  members: CookMember[];
}

interface HomeData {
  news: NewsItem[];
  holidays: HolidayItem[];
  teacherDuty: {
    current: TeacherDutyGroup | null;
    currentWeekClosed: boolean;
    forecast: TeacherDutyGroup[];
  };
  cookDuty: {
    weekStart: string;
    weekEnd: string;
    currentWeekClosed: boolean;
    thisWeek: CookDayEntry[];
    today: CookDayEntry | null;
    forecast: CookDayEntry[];
  };
}

interface EnabledModules {
  news?: boolean;
  duty?: boolean;
  attendance?: boolean;
  evaluations?: boolean;
  correspondence?: boolean;
  grades?: boolean;
  schedule?: boolean;
}

interface SchoolInfo {
  id: string;
  name: string;
  name_en?: string;
  subdomain: string;
  logo_url?: string;
  logo_drive_file_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  enabled_modules?: EnabledModules;
}

type HomeSubTab = "news" | "duty" | "info";

// ==========================================
// THAI DATE & DAY THEMING (Sophisticated Palette)
// ==========================================

const THAI_WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const THAI_DAY_CONFIGS: Record<number, {
  name: string;
  badgeBg: string;
  badgeText: string;
  dotBg: string;
  cardBorder: string;
  pillBg: string;
}> = {
  0: { // Sunday - Red
    name: "อาทิตย์",
    badgeBg: "bg-rose-500/10 dark:bg-rose-500/20",
    badgeText: "text-rose-700 dark:text-rose-300",
    dotBg: "bg-rose-500",
    cardBorder: "hover:border-rose-300 dark:hover:border-rose-800",
    pillBg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
  },
  1: { // Monday - Yellow / Amber
    name: "จันทร์",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-300",
    dotBg: "bg-amber-500",
    cardBorder: "hover:border-amber-300 dark:hover:border-amber-800",
    pillBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
  },
  2: { // Tuesday - Pink
    name: "อังคาร",
    badgeBg: "bg-pink-500/10 dark:bg-pink-500/20",
    badgeText: "text-pink-700 dark:text-pink-300",
    dotBg: "bg-pink-500",
    cardBorder: "hover:border-pink-300 dark:hover:border-pink-800",
    pillBg: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-900/50",
  },
  3: { // Wednesday - Emerald Green
    name: "พุธ",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    dotBg: "bg-emerald-500",
    cardBorder: "hover:border-emerald-300 dark:hover:border-emerald-800",
    pillBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
  },
  4: { // Thursday - Orange
    name: "พฤหัสบดี",
    badgeBg: "bg-orange-500/10 dark:bg-orange-500/20",
    badgeText: "text-orange-700 dark:text-orange-300",
    dotBg: "bg-orange-500",
    cardBorder: "hover:border-orange-300 dark:hover:border-orange-800",
    pillBg: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/50",
  },
  5: { // Friday - Sky Blue
    name: "ศุกร์",
    badgeBg: "bg-sky-500/10 dark:bg-sky-500/20",
    badgeText: "text-sky-700 dark:text-sky-300",
    dotBg: "bg-sky-500",
    cardBorder: "hover:border-sky-300 dark:hover:border-sky-800",
    pillBg: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/50",
  },
  6: { // Saturday - Purple
    name: "เสาร์",
    badgeBg: "bg-purple-500/10 dark:bg-purple-500/20",
    badgeText: "text-purple-700 dark:text-purple-300",
    dotBg: "bg-purple-500",
    cardBorder: "hover:border-purple-300 dark:hover:border-purple-800",
    pillBg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50",
  },
};

function dayIndex(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3) return 0;
  const [y, m, d] = parts;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function getDayConfig(dateStr: string) {
  return THAI_DAY_CONFIGS[dayIndex(dateStr)] || THAI_DAY_CONFIGS[0];
}

function thaiWeekdayShort(dateStr: string): string {
  return THAI_WEEKDAYS[dayIndex(dateStr)] || "";
}

function getDayNumber(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  return parts[2] ? parts[2].replace(/^0+/, "") : "";
}

function getRelativeDayLabel(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3) return null;
  const [y, m, d] = parts;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "วันนี้";
  if (diffDays === 1) return "พรุ่งนี้";
  if (diffDays === -1) return "เมื่อวาน";
  if (diffDays > 1 && diffDays <= 7) return `อีก ${diffDays} วัน`;
  if (diffDays > 7 && diffDays <= 30) return `อีก ${Math.round(diffDays / 7)} สัปดาห์`;
  return null;
}

function initialOf(name: string): string {
  return name.trim().charAt(0) || "?";
}

// ==========================================
// MODALS
// ==========================================

type ForecastModalState =
  | { type: "teacher"; entry: TeacherDutyGroup }
  | { type: "cook"; entry: CookDayEntry }
  | null;

function ForecastDetailModal({ state, onClose }: { state: ForecastModalState; onClose: () => void }) {
  if (!state) return null;

  const isTeacher = state.type === "teacher";
  const title = isTeacher
    ? `กลุ่มเวรครู: ${state.entry.name}`
    : `แม่ครัวประจำวัน${thaiWeekdayShort(state.entry.date)}`;
  const subtitle = isTeacher
    ? formatThaiDateRange(state.entry.weekStart, state.entry.weekEnd)
    : formatThaiDate(state.entry.date);
  const names = isTeacher
    ? state.entry.members.map((m) => m.username)
    : state.entry.members.map((m) => m.name);

  const dayConfig = !isTeacher ? getDayConfig(state.entry.date) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
              isTeacher
                ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-400"
                : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400"
            }`}>
              {isTeacher ? <Shield className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isTeacher ? "ตารางเวรปฏิบัติหน้าที่ครู" : "ตารางเวรแม่ครัว"}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              รายชื่อผู้ปฏิบัติหน้าที่
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {names.length} ท่าน
            </span>
          </div>

          {names.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {names.map((n, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                      isTeacher
                        ? "bg-indigo-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {initialOf(n)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {n}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isTeacher ? "ครูเวร" : "แม่ครัว"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">ยังไม่มีรายชื่อผู้ปฏิบัติหน้าที่</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function NewsDetailModal({ item, onClose }: { item: NewsItem | null; onClose: () => void }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
              <Newspaper className="w-3 h-3" />
              ข่าวประชาสัมพันธ์
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatThaiDate(item.created_at)}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug pr-8">
            {item.title}
          </h3>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
          <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-line font-normal">
            {item.content}
          </p>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

function SchoolHomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const schoolParam = searchParams.get("school") || "main";

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolReady, setSchoolReady] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeSubTab>("news");
  const [forecastModal, setForecastModal] = useState<ForecastModalState>(null);
  const [newsDetailModal, setNewsDetailModal] = useState<NewsItem | null>(null);
  const [newsSearch, setNewsSearch] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Fetch school info (Exact API Logic preserved)
  useEffect(() => {
    setLoading(true);
    setSchoolReady(false);
    setData(null);
    fetch(`/api/public/schools/${schoolParam}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((school) => {
        setSchoolInfo(school);
        updateSchoolDocumentMeta(school);
      })
      .catch((err) => console.error("Error fetching school information:", err))
      .finally(() => {
        setSchoolReady(true);
        setLoading(false);
      });
  }, [schoolParam]);

  // 2. Fetch Tab data (News, Duty, etc.) (Exact API Logic preserved)
  useEffect(() => {
    if (!schoolReady || activeTab === "info") return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/public/home?school=${schoolParam}&tab=${activeTab}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((homeData) => { if (!cancelled) setData(homeData); })
      .catch((err) => console.error("Error fetching school home data:", err))
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [activeTab, schoolParam, schoolReady]);

  const changeSchool = () => {
    localStorage.removeItem("selectedSchool");
    router.push("/");
  };

  const copySchoolUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredNews = useMemo(() => {
    if (!data?.news) return [];
    const publicNews = data.news.filter(
      (item) => !item.target_audience || item.target_audience === "all"
    );
    if (!newsSearch.trim()) return publicNews;
    const q = newsSearch.toLowerCase();
    return publicNews.filter(
      (item) => item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)
    );
  }, [data?.news, newsSearch]);

  const newsCount = data?.news?.filter((item) => !item.target_audience || item.target_audience === "all").length || 0;
  const holidaysCount = data?.holidays?.length || 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-600 selection:text-white dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      
      {/* =========================================================================
          Top Bar: Frosted Header with branding, switch school, theme, login
          ========================================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* School Brand / Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <SchoolLogo
              school={schoolInfo}
              schoolKey={schoolParam}
              alt={schoolInfo?.name || "โลโก้โรงเรียน"}
              className="h-10 w-10 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 object-cover"
            />
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {schoolInfo?.name || "ระบบบริหารจัดการโรงเรียน"}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ออนไลน์
                </span>
              </div>
              {schoolInfo?.name_en && (
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {schoolInfo.name_en}
                </p>
              )}
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={copySchoolUrl}
              title="คัดลอกลิงก์โรงเรียน"
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">แชร์</span>
                </>
              )}
            </button>

            <button
              onClick={changeSchool}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 transition"
              title="เปลี่ยนโรงเรียน"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เปลี่ยนโรงเรียน</span>
            </button>

            <ThemeToggle />

            <Link
              href={`/login?school=${schoolParam}`}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow-indigo-500/20 transition duration-150"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>เข้าสู่ระบบ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          Hero Section: School identity presentation & quick metric chips
          ========================================================================= */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40">
        {/* Subtle background ambient gradients (Sophisticated & soft) */}
        <div className="pointer-events-none absolute inset-0 -z-0 opacity-40 dark:opacity-20">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-300/30 dark:bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-sky-200/30 dark:bg-sky-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            {/* School Profile Card */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <SchoolLogo
                  school={schoolInfo}
                  schoolKey={schoolParam}
                  alt={schoolInfo?.name || "โลโก้"}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md p-1 object-cover"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                    พื้นที่สถานศึกษา
                  </span>
                  {schoolInfo?.subdomain && (
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                      {schoolInfo.subdomain}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {schoolInfo?.name || "ยินดีต้อนรับสู่ระบบจัดการโรงเรียน"}
                </h2>
                
                {schoolInfo?.name_en && (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {schoolInfo.name_en}
                  </p>
                )}

                {/* Contact pills */}
                {(schoolInfo?.address || schoolInfo?.phone) && (
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {schoolInfo.address && (
                      <span className="flex items-center gap-1 truncate max-w-xs sm:max-w-md">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{schoolInfo.address}</span>
                      </span>
                    )}
                    {schoolInfo.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{schoolInfo.phone}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metric Overview Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 lg:max-w-md">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">ข่าวสาร</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {loading ? "—" : newsCount}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">วันหยุด</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {loading ? "—" : holidaysCount}
                  </p>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">สถานะ</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                    พร้อมใช้งาน
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          Segmented Tab Control (Sticky for smooth navigation)
          ========================================================================= */}
      <div className="sticky top-16 z-30 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 py-3 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
            
            {/* Tab: News */}
            {schoolInfo?.enabled_modules?.news !== false && (
              <button
                onClick={() => setActiveTab("news")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "news"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span>ข่าวสาร & วันหยุด</span>
                {newsCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    activeTab === "news"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "bg-slate-300/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                    {newsCount}
                  </span>
                )}
              </button>
            )}

            {/* Tab: Duty */}
            {schoolInfo?.enabled_modules?.duty !== false && (
              <button
                onClick={() => setActiveTab("duty")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "duty"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>ตารางเวรปฏิบัติหน้าที่</span>
              </button>
            )}

            {/* Tab: Info */}
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "info"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>ข้อมูลสถานศึกษา</span>
            </button>

          </div>
        </div>
      </div>

      {/* =========================================================================
          Main Content Container
          ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Loading State: Clean Skeleton */}
        {loading ? (
          <div className="space-y-6">
            <div className="h-44 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse p-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-32 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
                <div className="h-32 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
              </div>
              <div className="h-72 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {/* =========================================================================
                TAB 1: NEWS & HOLIDAYS
                ========================================================================= */}
            {activeTab === "news" && (
              <div className="space-y-8">
                
                {/* School Calendar Timeline Integration */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">ปฏิทินกิจกรรมการศึกษา</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">กำหนดการและกิจกรรมสำคัญประจำภาคเรียน</p>
                      </div>
                    </div>
                  </div>
                  <CalendarTimeline schoolId={schoolInfo?.id} academicYear={undefined} userRole="guest" />
                </div>

                {/* News & Holidays Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                  
                  {/* Left Column: Announcements (8 cols) */}
                  <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                    
                    {/* News Header & Search Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-400 flex items-center justify-center">
                          <Newspaper className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">ข่าวประชาสัมพันธ์</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">ข่าวสาร ประกาศ และความเคลื่อนไหวล่าสุด</p>
                        </div>
                      </div>

                      {/* Instant Search Filter */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={newsSearch}
                          onChange={(e) => setNewsSearch(e.target.value)}
                          placeholder="ค้นหาข่าวสาร..."
                          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                        {newsSearch && (
                          <button
                            onClick={() => setNewsSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* News List */}
                    {filteredNews.length > 0 ? (
                      <div className="space-y-4">
                        {filteredNews.map((item) => (
                          <article
                            key={item.id}
                            onClick={() => setNewsDetailModal(item)}
                            className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all"
                          >
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                ข่าวสารทั่วไป
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                {formatThaiDate(item.created_at)}
                              </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                              {item.title}
                            </h3>

                            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-normal">
                              {item.content}
                            </p>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              <span>อ่านประกาศฉบับเต็ม</span>
                              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                          <Newspaper className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {newsSearch ? "ไม่พบข่าวสารที่ตรงกับคำค้นหา" : "ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                          {newsSearch ? "ลองปรับเปลี่ยนคำค้นหา หรือล้างตัวกรอง" : "เมื่อโรงเรียนมีการประชาสัมพันธ์ ข่าวสารจะปรากฏขึ้นที่นี่"}
                        </p>
                        {newsSearch && (
                          <button
                            onClick={() => setNewsSearch("")}
                            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                          >
                            ล้างคำค้นหา
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Holidays Widget (4-5 cols) */}
                  <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                    <div className="flex items-center gap-2.5 pb-2">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400 flex items-center justify-center">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">วันหยุด & วันสำคัญ</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">วันหยุดประจำภาคเรียนและวันหยุดราชการ</p>
                      </div>
                    </div>

                    {data?.holidays && data.holidays.length > 0 ? (
                      <div className="space-y-3">
                        {data.holidays.map((h) => {
                          const relativeLabel = getRelativeDayLabel(h.date);
                          const dayCfg = getDayConfig(h.date);

                          return (
                            <div
                              key={h.id}
                              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition flex items-start gap-3.5"
                            >
                              {/* Date Block */}
                              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border shadow-xs ${dayCfg.badgeBg} ${dayCfg.badgeText} border-slate-200/50 dark:border-slate-700/50`}>
                                <span className="text-base font-black leading-none">{getDayNumber(h.date)}</span>
                                <span className="text-[10px] font-bold mt-0.5">{thaiWeekdayShort(h.date)}</span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {h.reason}
                                  </h4>
                                  {relativeLabel && (
                                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                                      {relativeLabel}
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {formatThaiDate(h.date)}
                                </p>

                                {h.applies_to && h.applies_to !== "all" && (
                                  <div className="mt-2">
                                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                      เฉพาะ: {h.applies_to === "teachers" ? "ครูผู้สอน" : "แม่ครัว"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800">
                        <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">ไม่มีวันหยุดในเร็วๆ นี้</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          ตารางการเรียนการสอนดำเนินตามปกติ
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: DUTY SCHEDULE (Teachers & Cooks)
                ========================================================================= */}
            {activeTab === "duty" && (
              <div className="space-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                  
                  {/* Column 1: Teacher Duty */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Teacher Duty
                          </span>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">เวรครูประจำสัปดาห์</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {data?.teacherDuty?.current
                              ? formatThaiDateRange(data.teacherDuty.current.weekStart, data.teacherDuty.current.weekEnd)
                              : "ประจำสัปดาห์นี้"}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                        ครูเวร
                      </span>
                    </div>

                    {/* Current Week Status */}
                    {data?.teacherDuty?.currentWeekClosed ? (
                      <div className="p-8 text-center bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                        <h4 className="text-base font-bold text-rose-800 dark:text-rose-300">สัปดาห์นี้งดเวรปฏิบัติหน้าที่</h4>
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">เนื่องจากเป็นช่วงวันหยุดหรือกิจกรรมพิเศษ</p>
                      </div>
                    ) : data?.teacherDuty?.current ? (
                      <div className="space-y-4">
                        
                        {/* Group Highlight Card */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 border border-indigo-100 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">กลุ่มเวรที่ปฏิบัติงาน</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                              {data.teacherDuty.current.name}
                            </h3>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                            {data.teacherDuty.current.members.length} ท่าน
                          </span>
                        </div>

                        {/* Member Roster */}
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            รายชื่อครูเวร
                          </p>
                          {data.teacherDuty.current.members.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {data.teacherDuty.current.members.map((m) => (
                                <div
                                  key={m.id}
                                  className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800"
                                >
                                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                    {initialOf(m.username)}
                                  </div>
                                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {m.username}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 py-3 text-center">ยังไม่ได้ระบุรายชื่อ</p>
                          )}
                        </div>

                        {/* Forecast List */}
                        {data.teacherDuty.forecast.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                              ตารางเวรสัปดาห์ถัดไป
                            </h4>
                            <div className="grid grid-cols-2 gap-2.5">
                              {data.teacherDuty.forecast.slice(0, 4).map((f) => (
                                <button
                                  key={f.id + f.weekStart}
                                  onClick={() => setForecastModal({ type: "teacher", entry: f })}
                                  className="text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition group"
                                >
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {f.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                                    {formatThaiDateRange(f.weekStart, f.weekEnd)}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Shield className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">ไม่มีข้อมูลตารางเวรครู</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ระบบจะแสดงข้อมูลเมื่อมีการจัดตารางเวร</p>
                      </div>
                    )}

                  </div>

                  {/* Column 2: Cook Duty */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <ChefHat className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Cook Duty
                          </span>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">เวรแม่ครัวประจำวัน</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {data?.cookDuty?.weekStart && data?.cookDuty?.weekEnd
                              ? formatThaiDateRange(data.cookDuty.weekStart, data.cookDuty.weekEnd)
                              : "ประจำสัปดาห์นี้"}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                        แม่ครัว
                      </span>
                    </div>

                    {/* Cook Duty Content */}
                    {data?.cookDuty?.currentWeekClosed ? (
                      <div className="p-8 text-center bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                        <h4 className="text-base font-bold text-rose-800 dark:text-rose-300">สัปดาห์นี้งดเวรแม่ครัว</h4>
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">เนื่องจากเป็นช่วงวันหยุดหรือกิจกรรมพิเศษ</p>
                      </div>
                    ) : data?.cookDuty?.thisWeek && data.cookDuty.thisWeek.length > 0 ? (
                      <div className="space-y-3">
                        
                        {data.cookDuty.thisWeek.map((entry) => {
                          const isToday = entry.date === data.cookDuty.today?.date;
                          const dayCfg = getDayConfig(entry.date);

                          return (
                            <button
                              key={entry.date}
                              onClick={() => entry.name && setForecastModal({ type: "cook", entry })}
                              disabled={!entry.name}
                              className={`w-full text-left p-4 rounded-2xl transition-all border ${
                                isToday
                                  ? "bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 shadow-sm ring-1 ring-indigo-500/20"
                                  : "bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-slate-200/80 dark:border-slate-800"
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                {/* Date Avatar Badge */}
                                <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border shadow-xs ${dayCfg.badgeBg} ${dayCfg.badgeText} border-slate-200/50 dark:border-slate-700/50`}>
                                  <span className="text-base font-black leading-none">{getDayNumber(entry.date)}</span>
                                  <span className="text-[10px] font-bold mt-0.5">{thaiWeekdayShort(entry.date)}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                      {entry.name || "วันหยุด / ไม่มีเวร"}
                                    </h4>
                                    {isToday && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                                        วันนี้
                                      </span>
                                    )}
                                  </div>

                                  {entry.members.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {entry.members.map((m) => (
                                        <span
                                          key={m.id || m.name}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs"
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                          <span className="truncate">{m.name}</span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                                      ไม่มีรายชื่อผู้ปฏิบัติหน้าที่
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}

                        {/* Cook Duty Forecast */}
                        {data.cookDuty.forecast && data.cookDuty.forecast.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                              ตารางเวรสัปดาห์ถัดไป
                            </h4>
                            <div className="grid grid-cols-2 gap-2.5">
                              {data.cookDuty.forecast.slice(0, 4).map((entry) => {
                                const dayCfg = getDayConfig(entry.date);

                                return (
                                  <button
                                    key={entry.date}
                                    onClick={() => entry.name && setForecastModal({ type: "cook", entry })}
                                    disabled={!entry.name}
                                    className="text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition group"
                                  >
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className={`w-2 h-2 rounded-full ${dayCfg.dotBg}`} />
                                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                        {thaiWeekdayShort(entry.date)} {getDayNumber(entry.date)}
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                      {entry.name || "วันหยุด"}
                                    </p>
                                    {entry.members.length > 0 && (
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        {entry.members.length} ท่าน
                                      </p>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <ChefHat className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">ไม่มีข้อมูลตารางเวรแม่ครัว</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ระบบจะแสดงข้อมูลเมื่อมีการจัดเวร</p>
                      </div>
                    )}

                  </div>

                </div>

              </div>
            )}

            {/* =========================================================================
                TAB 3: SCHOOL INFO & DIRECTORY
                ========================================================================= */}
            {activeTab === "info" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                
                {/* Main Profile & Contact Cards (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* School Profile Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
                      <SchoolLogo
                        school={schoolInfo}
                        schoolKey={schoolParam}
                        alt={schoolInfo?.name || "ตราโรงเรียน"}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md p-1 object-cover shrink-0"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            ข้อมูลองค์กรสถานศึกษา
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                            {schoolInfo?.subdomain}.tdk-it
                          </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {schoolInfo?.name || "ไม่ระบุชื่อโรงเรียน"}
                        </h2>
                        {schoolInfo?.name_en && (
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {schoolInfo.name_en}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Address Card */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            ที่อยู่สถานศึกษา
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 leading-relaxed">
                            {schoolInfo?.address || "— ไม่ได้ระบุ —"}
                          </p>
                          {schoolInfo?.address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schoolInfo.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
                            >
                              เปิดบน Google Maps
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Phone Card */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            เบอร์โทรศัพท์ติดต่อ
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {schoolInfo?.phone || "— ไม่ได้ระบุ —"}
                          </p>
                          {schoolInfo?.phone && (
                            <a
                              href={`tel:${schoolInfo.phone}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-2"
                            >
                              โทรติดต่อ
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Email Card */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-400/20 dark:text-sky-400 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            อีเมลทางการ
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                            {schoolInfo?.email || "— ไม่ได้ระบุ —"}
                          </p>
                          {schoolInfo?.email && (
                            <a
                              href={`mailto:${schoolInfo.email}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline mt-2"
                            >
                              ส่งอีเมล
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* System Status Card */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            สถานะการให้บริการ
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            ระบบปฏิบัติการออนไลน์ปกติ
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            เชื่อมต่อฐานข้อมูลเครือข่าย TDK IT
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Enabled Modules Status Badges */}
                    {schoolInfo?.enabled_modules && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                          โมดูลระบบที่เปิดใช้งานในโรงเรียนนี้
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(schoolInfo.enabled_modules).map(([moduleKey, isEnabled]) => {
                            if (!isEnabled) return null;
                            const moduleLabels: Record<string, string> = {
                              news: "ประชาสัมพันธ์ข่าวสาร",
                              duty: "ตารางเวรครูและแม่ครัว",
                              attendance: "เช็กชื่อเข้าเรียน",
                              evaluations: "การประเมินผล",
                              correspondence: "หนังสือราชการ",
                              grades: "ระบบเกรดและคะแนน",
                              schedule: "ตารางสอน & คาบเรียน",
                            };
                            return (
                              <span
                                key={moduleKey}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                {moduleLabels[moduleKey] || moduleKey}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* Right Portal Card: Direct Login & Actions (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Login Card */}
                  <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-800/40 space-y-6 relative overflow-hidden">
                    <div className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl" />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-4">
                        <GraduationCap className="w-6 h-6 text-indigo-300" />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">เข้าสู่ระบบการศึกษา</h3>
                      <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
                        สำหรับผู้บริหาร ครูผู้สอน นักเรียน และบุคลากรทางการศึกษา
                      </p>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <Link
                        href={`/login?school=${schoolParam}`}
                        className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white text-indigo-950 font-bold text-sm shadow-md hover:bg-indigo-50 active:scale-98 transition duration-150"
                      >
                        <span>เข้าสู่ระบบทันที</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={changeSchool}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition duration-150"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>เลือกโรงเรียนอื่นในเครือข่าย</span>
                      </button>
                    </div>

                    <div className="pt-4 border-t border-white/10 text-center relative z-10">
                      <p className="text-[11px] text-indigo-300/80">
                        พัฒนาและขับเคลื่อนโดย <span className="font-bold text-white">TDK IT School Platform</span>
                      </p>
                    </div>
                  </div>

                  {/* Quick Guide Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      คำแนะนำการใช้งาน
                    </div>
                    <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside">
                      <li>ข่าวสารและวันหยุดอัปเดตแบบเรียลไทม์จากงานธุรการ</li>
                      <li>ตารางเวรครูและแม่ครัวแสดงเฉพาะผู้ปฏิบัติหน้าที่ที่ได้รับการอนุมัติแล้ว</li>
                      <li>สามารถคลิกดูรายละเอียดของตารางเวรสัปดาห์ถัดไปได้ทันที</li>
                    </ul>
                  </div>

                </div>

              </div>
            )}

          </>
        )}

      </main>

      {/* =========================================================================
          Footer
          ========================================================================= */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 dark:text-white">TDK IT</span>
            <span>•</span>
            <span>{schoolInfo?.name || "School Platform"}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              นโยบายความเป็นส่วนตัว
            </Link>
            <span>•</span>
            <button onClick={changeSchool} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              เปลี่ยนโรงเรียน
            </button>
          </div>
        </div>
      </footer>

      {/* Persistent Widgets & Dialogs */}
      <GuestChatWidget />
      <ForecastDetailModal state={forecastModal} onClose={() => setForecastModal(null)} />
      <NewsDetailModal item={newsDetailModal} onClose={() => setNewsDetailModal(null)} />

    </div>
  );
}

export default function SchoolHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-400 flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">กำลังเตรียมพื้นที่โรงเรียน...</p>
        </div>
      }
    >
      <SchoolHomeContent />
    </Suspense>
  );
}
