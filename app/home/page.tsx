"use client";

import { useEffect, useState, Suspense } from "react";
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
  Bell
} from "lucide-react";
import GuestChatWidget from "../components/GuestChatWidget";
import ThemeToggle from "../components/ThemeToggle";
import { SchoolLogo, updateSchoolDocumentMeta } from "../components/SchoolBrand";
import { formatThaiDate, formatThaiDateRange } from "../lib/format";
import CalendarTimeline from "../components/CalendarTimeline";

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

const THAI_WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const THAI_DAY_COLORS = ["#ef4444", "#facc15", "#ec4899", "#22c55e", "#f97316", "#38bdf8", "#a855f7"];

function dayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function thaiWeekdayShort(dateStr: string): string {
  return THAI_WEEKDAYS[dayIndex(dateStr)];
}

function thaiDayColor(dateStr: string): string {
  return THAI_DAY_COLORS[dayIndex(dateStr)];
}

function getRepresentativeMember(members: CookMember[], seedStr: string): string {
  if (!members || members.length === 0) return "";
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % members.length;
  return members[index].name;
}

function initialOf(name: string): string {
  return name.trim().charAt(0) || "?";
}

type ForecastModalState =
  | { type: "teacher"; entry: TeacherDutyGroup }
  | { type: "cook"; entry: CookDayEntry }
  | null;

function ForecastDetailModal({ state, onClose }: { state: ForecastModalState; onClose: () => void }) {
  if (!state) return null;

  const isTeacher = state.type === "teacher";
  const title = isTeacher
    ? `กลุ่มเวรครู ${state.entry.name}`
    : `แม่ครัวประจำวัน${thaiWeekdayShort(state.entry.date)}`;
  const subtitle = isTeacher
    ? formatThaiDateRange(state.entry.weekStart, state.entry.weekEnd)
    : formatThaiDate(state.entry.date);
  const names = isTeacher
    ? state.entry.members.map((m) => m.username)
    : state.entry.members.map((m) => m.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 ${isTeacher ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-emerald-600 to-teal-700'}`}>
          <button
            onClick={onClose}
            className="float-right w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
          >
            ✕
          </button>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-sm text-white/90 mt-1">{subtitle}</p>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">รายชื่อผู้ปฏิบัติหน้าที่</h4>
          {names.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {names.map((n, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isTeacher ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                    {initialOf(n)}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{n}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-sm text-slate-500">ยังไม่มีรายชื่อ</p>
          )}
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    // School information is enough to render the header and the information
    // tab. News and duty data are deferred until the visitor opens them.
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

  const newsCount = data?.news?.filter((item) => !item.target_audience || item.target_audience === 'all').length || 0;
  const holidaysCount = data?.holidays?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Modern Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <SchoolLogo
              school={schoolInfo}
              schoolKey={schoolParam}
              alt={schoolInfo?.name || "โลโก้โรงเรียน"}
              className="h-10 w-10 shrink-0 rounded-2xl shadow-md ring-2 ring-indigo-500/30"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                {schoolInfo?.name || "ระบบจัดการโรงเรียน"}
              </h1>
              {schoolInfo?.name_en && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{schoolInfo.name_en}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={changeSchool}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <Building2 className="w-4 h-4" />
              เปลี่ยนโรงเรียน
            </button>
            <ThemeToggle />
            <Link
              href={`/login?school=${schoolParam}`}
              className="flex items-center gap-1.5 whitespace-nowrap px-3 sm:gap-2 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition"
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <>
            {/* Calendar Timeline */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
              <CalendarTimeline schoolId={schoolInfo?.id} academicYear={undefined} userRole="guest" />
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100">ข่าวสาร</p>
                    <p className="text-3xl font-bold mt-1">{newsCount}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Newspaper className="w-7 h-7" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-rose-100">วันหยุด</p>
                    <p className="text-3xl font-bold mt-1">{holidaysCount}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <CalendarDays className="w-7 h-7" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-100">สถานะระบบ</p>
                    <p className="text-lg font-bold mt-1">พร้อมใช้งาน</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-7 h-7" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              {schoolInfo?.enabled_modules?.news !== false && (
                <button
                  onClick={() => setActiveTab("news")}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === "news"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  ข่าวสาร & วันหยุด
                  {newsCount > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      activeTab === "news" ? "bg-white/30 text-white" : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {newsCount}
                    </span>
                  )}
                </button>
              )}

              {schoolInfo?.enabled_modules?.duty !== false && (
                <button
                  onClick={() => setActiveTab("duty")}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === "duty"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  ตารางเวร
                </button>
              )}

              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === "info"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Info className="w-4 h-4" />
                ข้อมูลสถานศึกษา
              </button>
            </div>

            {/* Tab Content: News */}
            {activeTab === "news" && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">ข่าวประชาสัมพันธ์</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">ข่าวสารและประกาศล่าสุด</p>
                    </div>
                  </div>

                  {data?.news && data.news.filter((item) => !item.target_audience || item.target_audience === 'all').length > 0 ? (
                    <div className="space-y-4">
                      {data.news
                        .filter((item) => !item.target_audience || item.target_audience === 'all')
                        .map((item) => (
                        <div
                          key={item.id}
                          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-lg hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                              {item.title}
                            </h3>
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full whitespace-nowrap">
                              {formatThaiDate(item.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {item.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/60 dark:bg-slate-900/60 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">ยังไม่มีข่าวประชาสัมพันธ์</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-xl flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">วันหยุด</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">กิจกรรมและวันสำคัญ</p>
                    </div>
                  </div>

                  {data?.holidays && data.holidays.length > 0 ? (
                    <div className="space-y-3">
                      {data.holidays.map((h) => (
                        <div
                          key={h.id}
                          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 shadow-lg hover:shadow-xl transition-all flex items-start gap-4"
                        >
                          <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg">
                            <span className="text-xl font-bold">{h.date.split("-")[2]}</span>
                            <span className="text-[10px] font-medium uppercase">{thaiWeekdayShort(h.date)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{h.reason}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatThaiDate(h.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/60 dark:bg-slate-900/60 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">ไม่มีวันหยุดในเร็วๆ นี้</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Content: Duty */}
            {activeTab === "duty" && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Teacher Duty */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">เวรครู</h2>
                        <p className="text-sm text-blue-100">
                          {data?.teacherDuty?.current
                            ? formatThaiDateRange(data.teacherDuty.current.weekStart, data.teacherDuty.current.weekEnd)
                            : "ประจำสัปดาห์นี้"}
                        </p>
                      </div>
                    </div>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase">
                      ครูเวร
                    </span>
                  </div>

                  {data?.teacherDuty?.currentWeekClosed ? (
                    <div className="bg-rose-500/30 backdrop-blur-sm rounded-2xl p-8 text-center border border-rose-400/30">
                      <p className="text-2xl font-bold">ปิด</p>
                    </div>
                  ) : data?.teacherDuty?.current ? (
                    <div className="space-y-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                        <p className="text-sm text-blue-100 mb-2">กลุ่มเวร</p>
                        <p className="text-2xl font-bold">{data.teacherDuty.current.name}</p>
                      </div>

                      {data.teacherDuty.current.members.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {data.teacherDuty.current.members.map((m) => (
                            <div key={m.id} className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-white/10">
                              <div className="w-10 h-10 shrink-0 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                                {initialOf(m.username)}
                              </div>
                              <span className="text-lg font-bold leading-snug">{m.username}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-blue-100 py-4">ยังไม่มีรายชื่อ</p>
                      )}

                      {data.teacherDuty.forecast.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/20">
                          <h4 className="text-sm font-bold text-blue-100 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            สัปดาห์ถัดไป
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {data.teacherDuty.forecast.slice(0, 4).map((f) => (
                              <button
                                key={f.id + f.weekStart}
                                onClick={() => setForecastModal({ type: "teacher", entry: f })}
                                className="text-left bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3 transition"
                              >
                                <p className="text-xs font-bold truncate">{f.name}</p>
                                <p className="text-xs text-blue-100 truncate mt-1">
                                  {formatThaiDateRange(f.weekStart, f.weekEnd)}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                      <p className="text-sm text-blue-100">ไม่มีตารางเวรครู</p>
                    </div>
                  )}
                </div>

                {/* Cook Duty */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">เวรแม่ครัว</h2>
                        <p className="text-sm text-emerald-100">
                          {data?.cookDuty?.weekStart && data?.cookDuty?.weekEnd
                            ? formatThaiDateRange(data.cookDuty.weekStart, data.cookDuty.weekEnd)
                            : "ประจำสัปดาห์นี้"}
                        </p>
                      </div>
                    </div>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase">
                      แม่ครัว
                    </span>
                  </div>

                  {data?.cookDuty?.currentWeekClosed ? (
                    <div className="bg-rose-500/30 backdrop-blur-sm rounded-2xl p-8 text-center border border-rose-400/30">
                      <p className="text-2xl font-bold">ปิด</p>
                    </div>
                  ) : data?.cookDuty?.thisWeek && data.cookDuty.thisWeek.length > 0 ? (
                    <div className="space-y-3">
                      {data.cookDuty.thisWeek.map((entry) => {
                        const isToday = entry.date === data.cookDuty.today?.date;
                        const dayColor = thaiDayColor(entry.date);

                        return (
                          <button
                            key={entry.date}
                            onClick={() => entry.name && setForecastModal({ type: "cook", entry })}
                            disabled={!entry.name}
                            className={`w-full text-left p-4 rounded-2xl transition-all ${
                              isToday
                                ? "bg-white/30 backdrop-blur-sm border-2 border-white/50 shadow-xl"
                                : "bg-white/10 backdrop-blur-sm hover:bg-white/20"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-bold shrink-0 shadow-lg"
                                style={{ backgroundColor: dayColor }}
                              >
                                <span className="text-lg">{entry.date.split("-")[2]}</span>
                                <span className="text-[10px] uppercase">{thaiWeekdayShort(entry.date)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <p className="min-w-0 break-words text-base font-bold">{entry.name || "วันหยุด"}</p>
                                  {isToday && (
                                    <span className="shrink-0 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      วันนี้
                                    </span>
                                  )}
                                </div>
                                {entry.members.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {entry.members.map((m) => (
                                      <span
                                        key={m.id || m.name}
                                        className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-base font-bold leading-snug border border-white/30"
                                      >
                                        <span className="w-2 h-2 shrink-0 rounded-full bg-white" />
                                        {m.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-emerald-100">ไม่มีรายชื่อสมาชิก</p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {data.cookDuty.forecast && data.cookDuty.forecast.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/20">
                          <h4 className="text-sm font-bold text-emerald-100 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            สัปดาห์ถัดไป
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {data.cookDuty.forecast.slice(0, 4).map((entry) => {
                              const dayColor = thaiDayColor(entry.date);
                              const repName = getRepresentativeMember(entry.members, entry.date);

                              return (
                                <button
                                  key={entry.date}
                                  onClick={() => entry.name && setForecastModal({ type: "cook", entry })}
                                  disabled={!entry.name}
                                  className="text-left bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3 transition"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className="px-2 py-1 rounded text-xs font-bold text-white"
                                      style={{ backgroundColor: dayColor }}
                                    >
                                      {thaiWeekdayShort(entry.date)} {entry.date.split("-")[2]}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold truncate">{entry.name || "วันหยุด"}</p>
                                  {entry.members.length > 0 && (
                                    <p className="text-xs text-emerald-100 truncate mt-1">
                                      {entry.members.length} คน
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
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                      <p className="text-sm text-emerald-100">ไม่มีตารางเวรแม่ครัว</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Content: Info */}
            {activeTab === "info" && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
                  <div className="flex items-start gap-6 mb-8">
                    <SchoolLogo
                      school={schoolInfo}
                      schoolKey={schoolParam}
                      alt={schoolInfo?.name || "โลโก้"}
                      className="w-24 h-24 rounded-3xl shadow-xl ring-4 ring-indigo-500/30"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">School Profile</span>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{schoolInfo?.name}</h2>
                      {schoolInfo?.name_en && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{schoolInfo.name_en}</p>
                      )}
                      <div className="mt-3">
                        <span className="inline-block bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
                          {schoolInfo?.subdomain}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">ที่อยู่</span>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-white font-medium">
                        {schoolInfo?.address || "— ไม่ได้ระบุ —"}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">โทรศัพท์</span>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-white font-medium">
                        {schoolInfo?.phone || "— ไม่ได้ระบุ —"}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">อีเมล</span>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-white font-medium">
                        {schoolInfo?.email || "— ไม่ได้ระบุ —"}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">สถานะ</span>
                      </div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                        🟢 พร้อมใช้งาน
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">เข้าสู่ระบบ</h3>
                    <p className="text-sm text-indigo-100 mb-6">
                      สำหรับผู้ดูแลระบบ ครูผู้สอน และนักเรียน
                    </p>

                    <Link
                      href={`/login?school=${schoolParam}`}
                      className="flex items-center justify-between w-full bg-white text-indigo-700 font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all mb-3"
                    >
                      <span>เข้าสู่ระบบ</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>

                    <button
                      onClick={changeSchool}
                      className="flex items-center justify-center w-full bg-white/10 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-2xl hover:bg-white/20 transition-all border border-white/20"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      เปลี่ยนโรงเรียน
                    </button>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/20 text-center">
                    <p className="text-xs text-indigo-100 font-medium">
                      Powered by <span className="font-bold">TDK IT</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <GuestChatWidget />
      <ForecastDetailModal state={forecastModal} onClose={() => setForecastModal(null)} />
    </div>
  );
}

export default function SchoolHomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <SchoolHomeContent />
    </Suspense>
  );
}
