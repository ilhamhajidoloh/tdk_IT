"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Newspaper,
  CalendarDays,
  Printer,
  Users,
  Clock,
  Sparkles,
  Shield,
  Building2,
  RefreshCw,
  LogIn,
  MapPin,
  Phone,
  Mail,
  Info,
  ExternalLink
} from "lucide-react";
import GuestChatWidget from "../components/GuestChatWidget";
import ThemeToggle from "../components/ThemeToggle";
import { SchoolLogo, updateSchoolDocumentMeta } from "../components/SchoolBrand";
import { formatThaiDate, formatThaiDateRange } from "../lib/format";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
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
    forecast: TeacherDutyGroup[];
  };
  cookDuty: {
    weekStart: string;
    weekEnd: string;
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

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="text-center py-8 text-sm text-muted-foreground bg-muted/40 rounded-3xl border border-dashed border-border font-semibold">
      {text}
    </div>
  );
}

function MemberList({ names, tone }: { names: string[]; tone: "indigo" | "emerald" }) {
  if (names.length === 0) return <EmptyNote text="ยังไม่มีรายชื่อ" />;
  const avatarClass =
    tone === "indigo"
      ? "bg-gradient-to-br from-indigo-500 to-violet-600"
      : "bg-gradient-to-br from-emerald-500 to-teal-600";
  return (
    <div className="flex flex-wrap gap-2">
      {names.map((n) => (
        <div
          key={n}
          className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-2xs"
        >
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-xs ${avatarClass}`}
          >
            {initialOf(n)}
          </span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{n}</span>
        </div>
      ))}
    </div>
  );
}

function SpotlightCard({
  icon,
  title,
  subtitle,
  badgeLabel,
  gradient,
  ringClass,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badgeLabel: string;
  gradient: string;
  ringClass: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`relative rounded-3xl overflow-hidden shadow-xl ring-1 ${ringClass} animate-fade-in-up flex flex-col h-full`}
    >
      <div className={`relative px-6 pt-6 pb-8 text-white ${gradient} shrink-0`}>
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: "radial-gradient(circle at 88% 0%, white 0%, transparent 45%)" }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 shrink-0 shadow-lg">
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{title}</h2>
              <p className="text-xs text-white/95 mt-0.5 font-semibold">{subtitle}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider shrink-0 shadow-sm border border-white/30 text-white">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {badgeLabel}
          </span>
        </div>
      </div>
      <div className="bg-card p-5 sm:p-6 -mt-3 rounded-t-3xl relative flex-1 flex flex-col justify-between space-y-6">
        {children}
      </div>
    </section>
  );
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
  const tone = isTeacher ? "indigo" : "emerald";
  const gradient = isTeacher
    ? "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600"
    : "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in-up overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl border border-border shadow-2xl glass-strong w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 text-white ${gradient} relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">{title}</h3>
              <p className="text-xs text-white/80 font-medium">{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            รายชื่อผู้ปฏิบัติหน้าที่
          </h4>
          <MemberList names={names} tone={tone} />
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full ui-btn ui-btn-secondary py-2.5 rounded-xl font-bold cursor-pointer"
            >
              ปิด
            </button>
          </div>
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
  const [activeTab, setActiveTab] = useState<HomeSubTab>("news");
  const [forecastModal, setForecastModal] = useState<ForecastModalState>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/public/schools/${schoolParam}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/public/home?school=${schoolParam}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([school, homeData]) => {
        setSchoolInfo(school);
        updateSchoolDocumentMeta(school);
        setData(homeData);
      })
      .catch((err) => console.error("Error fetching school home data:", err))
      .finally(() => setLoading(false));
  }, [schoolParam]);

  const changeSchool = () => {
    localStorage.removeItem("selectedSchool");
    router.push("/");
  };

  const newsCount = data?.news?.length || 0;
  const holidaysCount = data?.holidays?.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <SchoolLogo
              school={schoolInfo}
              schoolKey={schoolParam}
              alt={schoolInfo?.name || "โลโก้โรงเรียน"}
              className="h-10 w-10 rounded-xl shrink-0 ring-2 ring-primary/20"
            />
            <div className="min-w-0">
              <span className="font-extrabold text-base sm:text-lg tracking-tight truncate block text-foreground">
                {schoolInfo?.name || "ระบบจัดการโรงเรียน TDK IT"}
              </span>
              {schoolInfo?.name_en && (
                <span className="text-xs text-muted-foreground truncate block font-medium">
                  {schoolInfo.name_en}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={changeSchool}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shadow-sm cursor-pointer"
              title="สลับโรงเรียน"
            >
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">เปลี่ยนโรงเรียน</span>
            </button>
            <ThemeToggle />
            <Link
              href={`/login?school=${schoolParam}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-spin">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">กำลังโหลดข้อมูลโรงเรียน...</p>
          </div>
        ) : (
          <>
            {/* Sub-Tab Navigation Bar */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/60 dark:bg-muted/40 rounded-2xl border border-border">
              {/* Tab 1: News & Events */}
              {schoolInfo?.enabled_modules?.news !== false && (
                <button
                  type="button"
                  onClick={() => setActiveTab("news")}
                  className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0 ${
                    activeTab === "news"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                  }`}
                >
                  <Newspaper className="w-4 h-4" />
                  <span>ข่าวสาร & วันหยุด</span>
                  {newsCount > 0 && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                        activeTab === "news"
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {newsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Tab 2: Duty Schedules */}
              {schoolInfo?.enabled_modules?.duty !== false && (
                <button
                  type="button"
                  onClick={() => setActiveTab("duty")}
                  className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0 ${
                    activeTab === "duty"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>ตารางเวรประจำสัปดาห์</span>
                </button>
              )}

              {/* Tab 3: School Info / Contacts */}
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0 ${
                  activeTab === "info"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                }`}
              >
                <Info className="w-4 h-4" />
                <span>ข้อมูลสถานศึกษา</span>
              </button>
            </div>

            {/* TAB 1: News & Holidays */}
            {activeTab === "news" && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* News column */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Newspaper className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-foreground">ข่าวประชาสัมพันธ์</h2>
                          <p className="text-xs text-muted-foreground">ข่าวสารและประกาศล่าสุดจากทางโรงเรียน</p>
                        </div>
                      </div>
                    </div>

                    {data?.news && data.news.length > 0 ? (
                      <div className="space-y-4">
                        {data.news.map((item) => (
                          <article
                            key={item.id}
                            className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-3 hover:shadow-md hover:border-primary/40 transition-all group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                                {item.title}
                              </h3>
                              <span className="text-xs text-muted-foreground whitespace-nowrap font-bold bg-muted px-2.5 py-1 rounded-full border border-border shrink-0">
                                {formatThaiDate(item.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed font-medium">
                              {item.content}
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <EmptyNote text="ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้" />
                    )}
                  </div>

                  {/* Holidays column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-foreground">วันหยุด / กิจกรรม</h2>
                        <p className="text-xs text-muted-foreground">ปฏิทินวันหยุดและกิจกรรมสำคัญ</p>
                      </div>
                    </div>

                    {data?.holidays && data.holidays.length > 0 ? (
                      <div className="space-y-3">
                        {data.holidays.map((h) => (
                          <div
                            key={h.id}
                            className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-3.5 hover:shadow-md transition-all"
                          >
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center shrink-0 font-black text-xs leading-none ring-1 ring-rose-500/20">
                              <span className="text-base font-extrabold">{h.date.split("-")[2]}</span>
                              <span className="text-[9px] uppercase mt-0.5 font-bold">{thaiWeekdayShort(h.date)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-extrabold text-foreground">{h.reason}</p>
                              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                {formatThaiDate(h.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyNote text="ไม่มีวันหยุดในเร็วๆ นี้" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Duty Schedules */}
            {activeTab === "duty" && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Teacher Duty Spotlight */}
                  <SpotlightCard
                    icon={<Shield className="w-6 h-6 text-white" />}
                    title="เวรประจำสัปดาห์ (ครู)"
                    subtitle={
                      data?.teacherDuty?.current
                        ? formatThaiDateRange(data.teacherDuty.current.weekStart, data.teacherDuty.current.weekEnd)
                        : "ประจำสัปดาห์นี้"
                    }
                    badgeLabel="ครูเวรประจำวัน"
                    gradient="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600"
                    ringClass="ring-indigo-500/20 dark:ring-indigo-400/20"
                  >
                    {data?.teacherDuty?.current ? (
                      <div className="space-y-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                              กลุ่มเวร:{" "}
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">
                                {data.teacherDuty.current.name}
                              </span>
                            </h3>
                          </div>
                          <MemberList names={data.teacherDuty.current.members.map((m) => m.username)} tone="indigo" />
                        </div>

                        {data.teacherDuty.forecast.length > 0 && (
                          <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                              <span>สัปดาห์ถัดไป</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {data.teacherDuty.forecast.slice(0, 4).map((f) => (
                                <button
                                  key={f.id + f.weekStart}
                                  onClick={() => setForecastModal({ type: "teacher", entry: f })}
                                  className="text-left p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-2xs group cursor-pointer"
                                >
                                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block truncate group-hover:underline">
                                    {f.name}
                                  </span>
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block truncate mt-1">
                                    {formatThaiDateRange(f.weekStart, f.weekEnd)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyNote text="ไม่มีตารางเวรครูประจำสัปดาห์นี้" />
                    )}
                  </SpotlightCard>

                  {/* Cook Duty Spotlight */}
                  <SpotlightCard
                    icon={<Sparkles className="w-6 h-6 text-white" />}
                    title="เวรประจำสัปดาห์ (แม่ครัว)"
                    subtitle={
                      data?.cookDuty?.weekStart && data?.cookDuty?.weekEnd
                        ? formatThaiDateRange(data.cookDuty.weekStart, data.cookDuty.weekEnd)
                        : "ประจำสัปดาห์นี้"
                    }
                    badgeLabel="แม่ครัวเวร"
                    gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
                    ringClass="ring-emerald-500/20 dark:ring-emerald-400/20"
                  >
                    {data?.cookDuty?.thisWeek && data.cookDuty.thisWeek.length > 0 ? (
                      <div className="space-y-5 flex-1 flex flex-col justify-between">
                        {/* ตารางรายสัปดาห์ */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                            <span>ตารางประจำสัปดาห์</span>
                          </h4>
                          <div className="grid gap-3">
                            {data.cookDuty.thisWeek.map((entry) => {
                              const isToday = entry.date === data.cookDuty.today?.date;
                              const dayColor = thaiDayColor(entry.date);

                              return (
                                <button
                                  key={entry.date}
                                  onClick={() => entry.name && setForecastModal({ type: "cook", entry })}
                                  disabled={!entry.name}
                                  className={`text-left p-4 rounded-2xl border transition-all ${
                                    isToday
                                      ? "border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/30"
                                      : "border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                                  }`}
                                >
                                  <div className="flex items-start gap-3.5">
                                    <div
                                      className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black text-white text-xs leading-none shadow-md mt-0.5"
                                      style={{ backgroundColor: dayColor }}
                                    >
                                      <span className="text-base font-black leading-none">
                                        {entry.date.split("-")[2]}
                                      </span>
                                      <span className="text-[10px] font-extrabold uppercase mt-1 opacity-95">
                                        {thaiWeekdayShort(entry.date)}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`text-base font-black ${
                                            isToday
                                              ? "text-emerald-600 dark:text-emerald-400"
                                              : "text-slate-900 dark:text-slate-100"
                                          }`}
                                        >
                                          {entry.name || "วันหยุด"}
                                        </span>
                                        {isToday && (
                                          <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            วันนี้
                                          </span>
                                        )}
                                      </div>

                                      {entry.members.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                                          {entry.members.map((m) => (
                                            <span
                                              key={m.id || m.name}
                                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-2xs"
                                            >
                                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                              <span>{m.name}</span>
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 block">
                                          ไม่มีรายชื่อสมาชิกประจำวัน
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {data.cookDuty.forecast && data.cookDuty.forecast.length > 0 && (
                          <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                              <span>สัปดาห์ถัดไป</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {data.cookDuty.forecast.slice(0, 4).map((entry) => {
                                const dayColor = thaiDayColor(entry.date);
                                const repName = getRepresentativeMember(entry.members, entry.date);

                                return (
                                  <button
                                    key={entry.date}
                                    onClick={() => entry.name && setForecastModal({ type: "cook", entry })}
                                    disabled={!entry.name}
                                    className="text-left p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-2xs group cursor-pointer"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span
                                        className="px-2.5 py-1.5 rounded-xl text-xs font-black text-white shrink-0 shadow-xs"
                                        style={{ backgroundColor: dayColor }}
                                      >
                                        {thaiWeekdayShort(entry.date)} {entry.date.split("-")[2]}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                          {entry.name || "วันหยุด"}
                                        </span>
                                        {entry.members.length > 0 ? (
                                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block truncate mt-0.5">
                                            {entry.members.length} คน (ตัวแทน: {repName})
                                          </span>
                                        ) : (
                                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                                            0 คน
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyNote text="ไม่มีตารางเวรแม่ครัวประจำสัปดาห์นี้" />
                    )}
                  </SpotlightCard>
                </div>
              </div>
            )}

            {/* TAB 3: School Info / Contacts */}
            {activeTab === "info" && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Main Info Card */}
                  <div className="md:col-span-2 bg-card border border-border p-8 rounded-3xl space-y-6 shadow-sm">
                    <div className="flex items-start gap-5">
                      <SchoolLogo
                        school={schoolInfo}
                        schoolKey={schoolParam}
                        alt={schoolInfo?.name || "โลโก้"}
                        className="w-20 h-20 rounded-2xl ring-4 ring-primary/20 shrink-0 shadow-md"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          ข้อมูลสถานศึกษา (School Profile)
                        </span>
                        <h2 className="text-2xl font-black text-foreground">{schoolInfo?.name}</h2>
                        {schoolInfo?.name_en && (
                          <p className="text-sm font-semibold text-muted-foreground">{schoolInfo.name_en}</p>
                        )}
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
                            Subdomain: {schoolInfo?.subdomain}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6 grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>ที่อยู่สถานศึกษา</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground pt-1">
                          {schoolInfo?.address || "— ไม่ได้ระบุที่อยู่ —"}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <Phone className="w-4 h-4 text-emerald-500" />
                          <span>เบอร์โทรศัพท์ติดต่อ</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground pt-1">
                          {schoolInfo?.phone || "— ไม่ได้ระบุเบอร์โทรศัพท์ —"}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <Mail className="w-4 h-4 text-indigo-500" />
                          <span>อีเมลติดต่อ</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground pt-1">
                          {schoolInfo?.email || "— ไม่ได้ระบุอีเมล —"}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <Building2 className="w-4 h-4 text-amber-500" />
                          <span>สถานะระบบ</span>
                        </div>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                          🟢 พร้อมใช้งาน (Active)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Portal Quick Access */}
                  <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                        <LogIn className="w-4 h-4 text-primary" />
                        <span>เข้าสู่ระบบบริหารจัดการ</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        เข้าสู่ระบบสำหรับ ผู้ดูแลระบบ ครูผู้สอน และนักเรียนของ {schoolInfo?.name}
                      </p>

                      <div className="space-y-2 pt-2">
                        <Link
                          href={`/login?school=${schoolParam}`}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-md"
                        >
                          <div className="flex items-center gap-2.5">
                            <GraduationCap className="w-4 h-4" />
                            <span>เข้าสู่ระบบ (Login)</span>
                          </div>
                          <ArrowRight className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={changeSchool}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-all border border-border cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span>สลับไปยังโรงเรียนอื่น</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        TDK IT · แพลตฟอร์มบริหารจัดการโรงเรียน
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Guest Chat Widget */}
      <GuestChatWidget />

      {/* Forecast Detail Modal */}
      <ForecastDetailModal state={forecastModal} onClose={() => setForecastModal(null)} />
    </div>
  );
}

export default function SchoolHomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold">กำลังโหลด...</div>}>
      <SchoolHomeContent />
    </Suspense>
  );
}
