"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Settings,
  ArrowRight,
  ChevronRight,
  Newspaper,
  CalendarDays,
  Printer,
  Users,
  Clock,
  Sparkles,
  Shield,
  Star,
} from "lucide-react";
import GuestChatWidget from "./components/GuestChatWidget";
import ThemeToggle from "./components/ThemeToggle";
import { formatThaiDate, formatThaiDateRange } from "./lib/format";

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
  applies_to?: 'all' | 'teachers' | 'cooks';
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

function initialOf(name: string): string {
  return name.trim().charAt(0) || "?";
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="text-center py-6 text-sm text-subtle-foreground bg-muted rounded-xl border border-dashed border-border font-medium">
      {text}
    </div>
  );
}

function MemberList({ names, tone }: { names: string[]; tone: "indigo" | "emerald" }) {
  if (names.length === 0) return <EmptyNote text="ยังไม่มีรายชื่อ" />;
  const avatarClass = tone === "indigo" ? "bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-gradient-to-br from-emerald-500 to-teal-600";
  return (
    <div className="flex flex-wrap gap-2">
      {names.map((n) => (
        <div key={n} className="flex items-center gap-2 pl-1 pr-3.5 py-1 rounded-full bg-card border border-border shadow-sm">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 ${avatarClass}`}>
            {initialOf(n)}
          </span>
          <span className="text-sm font-bold text-foreground">{n}</span>
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
    <section className={`relative rounded-3xl overflow-hidden shadow-xl ring-1 ${ringClass} animate-fade-in-up`}>
      <div className={`relative px-6 pt-5 pb-7 text-white ${gradient}`}>
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: "radial-gradient(circle at 88% 0%, white 0%, transparent 45%)" }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center ring-1 ring-white/25 shrink-0 shadow-lg">
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
              <p className="text-xs text-white/80 mt-0.5 font-semibold">{subtitle}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {badgeLabel}
          </span>
        </div>
      </div>
      <div className="bg-card p-6 -mt-2 rounded-t-3xl relative">{children}</div>
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
        <div className={`shrink-0 relative px-6 py-5 text-white ${gradient}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 hover:bg-white/15 rounded-full transition-all cursor-pointer border-0 bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 className="text-lg font-extrabold tracking-tight pr-8">{title}</h3>
          <p className="text-xs text-white/80 mt-0.5 font-semibold">{subtitle}</p>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {isTeacher && (state.entry as TeacherDutyGroup).allDaysClosed && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 font-semibold">
              สัปดาห์นี้ปิดเรียนทั้งสัปดาห์
            </div>
          )}
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">รายชื่อ</p>
          <MemberList names={names} tone={tone} />
        </div>

        <div className="shrink-0 px-6 py-3.5 bg-card border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground bg-muted hover:bg-border transition-all cursor-pointer border-0"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function ForecastCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-muted/30 p-5 animate-fade-in-up">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-muted text-subtle-foreground">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-muted-foreground">{title}</h3>
          <p className="text-[11px] text-subtle-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecastModal, setForecastModal] = useState<ForecastModalState>(null);
  const [activeTab, setActiveTab] = useState<"duty" | "news" | "forecast">("duty");

  useEffect(() => {
    fetch("/api/public/home")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const mainHolidays = data ? data.holidays.filter((h) => h.applies_to === "all" || !h.applies_to) : [];

  const printCookSchedule = (mode: "weekly" | "monthly") => {
    if (!data?.cookDuty) return;
    const { thisWeek, weekStart, weekEnd } = data.cookDuty;

    const title = mode === "weekly"
      ? `ตารางเวรแม่ครัวประจำสัปดาห์`
      : `ตารางเวรแม่ครัวประจำเดือน ${new Date().getMonth() + 1}/${new Date().getFullYear() + 543}`;

    const rows = thisWeek.map((e) => {
      const dayIdx = dayIndex(e.date);
      const isToday = data.cookDuty?.today?.date === e.date;
      return `
        <tr${isToday ? ' style="background:#ecfdf5;"' : ""}>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">วัน${THAI_WEEKDAYS[dayIdx]} ${formatThaiDate(e.date)}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">
            <span style="background:#d1fae5;color:#065f46;padding:4px 12px;border-radius:9999px;font-size:13px;font-weight:700;">กลุ่ม ${e.name}</span>
            <div style="margin-top:4px;font-size:12px;color:#6b7280;">${e.members.map((m) => m.name).join(", ")}</div>
          </td>
        </tr>`;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Sarabun', 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; }
          h1 { font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 4px; }
          h2 { font-size: 14px; font-weight: 600; text-align: center; color: #6b7280; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #e5e7eb; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <h2>${formatThaiDateRange(weekStart, weekEnd)}</h2>
        <table>
          <thead>
            <tr>
              <th style="width:200px;">วัน</th>
              <th>กลุ่มเวรแม่ครัว / รายชื่อ</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 grid-backdrop opacity-60" />

      {/* Header */}
      <header className="relative z-10 sticky top-0 border-b border-border header-gradient">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl overflow-hidden ring-1 ring-border shadow-sm shrink-0">
              <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-base font-extrabold tracking-tight hidden sm:inline">ระบบจัดการโรงเรียน</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link href="/login" className="ui-btn ui-btn-primary py-2.5 px-5 text-sm">
              เข้าสู่ระบบ
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        {/* ===================== HERO SECTION ===================== */}
        <div className="mb-10 animate-fade-in-down">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 sm:p-10 text-white shadow-2xl">
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 90% 10%, white 0%, transparent 40%)" }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/20">
                  <Sparkles className="w-3 h-3" />
                  ระบบจัดการโรงเรียนยุคใหม่
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-3">
                บริหารจัดการโรงเรียน<br />
                <span className="text-white/80">ในระบบเดียว</span>
              </h1>
              <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-xl mb-6">
                แพลตฟอร์มจัดการคะแนน ตารางเรียน และข้อมูลนักเรียน ออกแบบใหม่ให้ทันสมัย ใช้งานง่าย และรวดเร็ว
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="ui-btn bg-white text-indigo-700 hover:bg-white/90 font-bold px-6 py-3 text-sm shadow-lg border-0">
                  เข้าสู่ระบบ
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#duty" className="ui-btn bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm font-bold px-6 py-3 text-sm border border-white/20">
                  ดูเวรประจำวัน
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              {/* Trust indicators */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-white/60 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  ปลอดภัย ได้มาตรฐาน
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  ใช้งานง่าย ลื่นไหล
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  รองรับทุกบทบาท
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground font-semibold">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            {/* Tabs Selector */}
            <div className="flex justify-center mb-6">
              <div className="ui-segment inline-flex overflow-x-auto scrollbar-none max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab("duty")}
                  data-active={activeTab === "duty"}
                  className="ui-segment-item px-5"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>เวรประจำวัน</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("news")}
                  data-active={activeTab === "news"}
                  className="ui-segment-item px-5"
                >
                  <Newspaper className="w-4 h-4 shrink-0" />
                  <span>ข่าวสาร & ประกาศ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("forecast")}
                  data-active={activeTab === "forecast"}
                  className="ui-segment-item px-5"
                >
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>คาดการณ์ล่วงหน้า</span>
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="transition-all duration-300">
              {activeTab === "duty" && (
                <div id="duty" className="grid md:grid-cols-2 gap-6 animate-fade-in-up">
                  <SpotlightCard
                    icon={<BookOpen className="w-6 h-6" />}
                    title="ครูเวรประจำสัปดาห์นี้"
                    subtitle={
                      data?.teacherDuty.current
                        ? formatThaiDateRange(data.teacherDuty.current.weekStart, data.teacherDuty.current.weekEnd)
                        : "ยังไม่ได้ตั้งค่ากลุ่มเวรครู"
                    }
                    badgeLabel="สัปดาห์นี้"
                    gradient="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600"
                    ringClass="ring-indigo-500/40"
                  >
                    {data?.teacherDuty.current ? (
                      <>
                        {data.teacherDuty.current.allDaysClosed && (
                          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 font-semibold">
                            สัปดาห์นี้ปิดเรียนทั้งสัปดาห์ — กลุ่มนี้จะขึ้นเวรสัปดาห์ถัดไปแทน
                          </div>
                        )}
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">กลุ่มที่ขึ้นเวร</p>
                        <div className="text-3xl font-black text-foreground mb-4 flex items-baseline gap-2">
                          กลุ่ม
                          <span className="brand-text">{data.teacherDuty.current.name}</span>
                        </div>
                        <MemberList names={data.teacherDuty.current.members.map((m) => m.username)} tone="indigo" />
                      </>
                    ) : (
                      <EmptyNote text="ยังไม่มีกลุ่มเวรครู" />
                    )}
                  </SpotlightCard>

                  <SpotlightCard
                    icon={<Users className="w-6 h-6" />}
                    title="แม่ครัวประจำสัปดาห์"
                    subtitle={
                      data?.cookDuty
                        ? `${formatThaiDateRange(
                            data.cookDuty.thisWeek[0]?.date ?? data.cookDuty.weekStart,
                            data.cookDuty.thisWeek[data.cookDuty.thisWeek.length - 1]?.date ?? data.cookDuty.weekEnd
                          )} · หมุนกลุ่มทุกวันเปิดเรียน`
                        : "ยังไม่ได้ตั้งค่ากลุ่มแม่ครัว"
                    }
                    badgeLabel="สัปดาห์นี้"
                    gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
                    ringClass="ring-emerald-500/40"
                  >
                    {!data || data.cookDuty.thisWeek.length === 0 ? (
                      <EmptyNote text="ยังไม่มีกลุ่มแม่ครัว" />
                    ) : (
                      <div className="space-y-2.5">
                        {data.cookDuty.thisWeek.map((e) => {
                          const isToday = data.cookDuty.today?.date === e.date;
                          const holidayOnDay = data.holidays.find((h) => h.date === e.date && (h.applies_to === "all" || h.applies_to === "cooks"));
                          return (
                            <div
                              key={e.date}
                              className={`relative overflow-hidden rounded-xl border transition-all ${
                                isToday
                                  ? "border-transparent bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-2 ring-emerald-500/60 shadow-md p-3.5"
                                  : "border-border bg-muted/40 p-3"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: thaiDayColor(e.date) }}
                                  />
                                  <span className={`text-xs font-bold ${isToday ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
                                    วัน{thaiWeekdayShort(e.date)} {formatThaiDate(e.date)}
                                  </span>
                                  {isToday && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                                      วันนี้
                                    </span>
                                  )}
                                </span>
                                {holidayOnDay ? (
                                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/30">
                                    {holidayOnDay.reason}
                                  </span>
                                ) : (
                                  <span className={`text-xs font-black ${isToday ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
                                    กลุ่ม {e.name}
                                  </span>
                                )}
                              </div>
                              {!holidayOnDay && <MemberList names={e.members.map((m) => m.name)} tone="emerald" />}
                            </div>
                          );
                        })}
                        {/* Print buttons for cook schedule */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => printCookSchedule("weekly")}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            พิมพ์รายสัปดาห์
                          </button>
                          <button
                            onClick={() => printCookSchedule("monthly")}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            พิมพ์รายเดือน
                          </button>
                        </div>
                      </div>
                    )}
                  </SpotlightCard>
                </div>
              )}

              {activeTab === "news" && (
                <section className="ui-card p-6 animate-fade-in-up">
                  <div className="flex items-start gap-3.5 mb-5">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-primary-soft text-primary shadow-sm">
                      <Newspaper className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground">ข่าวสาร</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">ประกาศ ข่าวสาร และวันหยุดพิเศษจากโรงเรียน</p>
                    </div>
                  </div>

                  {data && mainHolidays.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">วันหยุดพิเศษที่กำลังจะมาถึง</p>
                      {mainHolidays.map((h) => (
                        <div key={h.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                          <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 shrink-0">{h.date}</span>
                          <span className="text-xs text-red-700 dark:text-red-300 font-semibold">{h.reason}</span>
                          <span className="ml-auto text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 rounded-full">
                            หยุดเรียน
                          </span>
                        </div>
                      ))}
                      {data.news.length > 0 && <div className="border-t border-border mt-3 mb-1" />}
                    </div>
                  )}

                  {!data || data.news.length === 0 ? (
                    mainHolidays.length === 0 ? <EmptyNote text="ยังไม่มีข่าวสาร" /> : null
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3 max-h-[24rem] overflow-y-auto pr-1">
                      {data.news.map((n) => (
                        <article key={n.id} className="p-4 rounded-xl border border-border bg-muted/40">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-bold text-foreground">{n.title}</h3>
                            <span className="text-[11px] text-subtle-foreground shrink-0 whitespace-nowrap">{formatThaiDate(n.created_at)}</span>
                          </div>
                          <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-line">{n.content}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "forecast" && (
                <div className="animate-fade-in-up">
                  <div className="mb-4">
                    <h2 className="text-lg font-extrabold text-foreground">คาดการณ์ล่วงหน้า</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">การหมุนเวียนเวรครูและเวรแม่ครัวในรอบถัดๆ ไป</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ForecastCard
                      icon={<CalendarDays className="w-4 h-4" />}
                      title="คาดการณ์เวรครู"
                      subtitle="ลำดับกลุ่มเวรครูในสัปดาห์ถัดไป"
                    >
                      {!data || data.teacherDuty.forecast.length === 0 ? (
                        <EmptyNote text="ไม่มีข้อมูลคาดการณ์" />
                      ) : (
                        <ul className="space-y-1.5">
                          {data.teacherDuty.forecast.map((f) => (
                            <li
                              key={`${f.id}-${f.weekStart}`}
                              onClick={() => setForecastModal({ type: "teacher", entry: f })}
                              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs cursor-pointer hover:border-indigo-400/60 hover:bg-indigo-500/5 transition-colors"
                            >
                              <span className="font-medium text-subtle-foreground">{formatThaiDateRange(f.weekStart, f.weekEnd)}</span>
                              {f.allDaysClosed ? (
                                <span className="text-[10px] text-red-500 font-semibold">ปิดเรียน</span>
                              ) : (
                                <span className="font-bold text-muted-foreground">กลุ่ม {f.name}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </ForecastCard>

                    <ForecastCard
                      icon={<Clock className="w-4 h-4" />}
                      title="คาดการณ์เวรแม่ครัว"
                      subtitle="กลุ่มแม่ครัวในวันเปิดเรียนถัดไป"
                    >
                      {!data || data.cookDuty.forecast.length === 0 ? (
                        <EmptyNote text="ไม่มีข้อมูลคาดการณ์" />
                      ) : (
                        <ul className="space-y-1.5">
                          {data.cookDuty.forecast.map((f) => (
                            <li
                              key={`${f.id}-${f.date}`}
                              onClick={() => setForecastModal({ type: "cook", entry: f })}
                              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs cursor-pointer hover:border-emerald-400/60 hover:bg-emerald-500/5 transition-colors"
                            >
                              <span className="font-medium text-subtle-foreground">
                                วัน{thaiWeekdayShort(f.date)} {formatThaiDate(f.date)}
                              </span>
                              <span className="font-bold text-muted-foreground">กลุ่ม {f.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </ForecastCard>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer role cards */}
        <div className="mt-12 mb-6">
          <p className="text-xs font-bold text-subtle-foreground uppercase tracking-wider mb-3 text-center">เข้าสู่ระบบตามบทบาท</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { role: "student", label: "นักเรียน", desc: "ดูคะแนน ตารางเรียน และผลการประเมิน", icon: <GraduationCap className="w-5 h-5" />, gradient: "from-violet-500 to-purple-600" },
              { role: "teacher", label: "คุณครู", desc: "บันทึกคะแนน จัดการชั้นเรียน และประเมินผล", icon: <BookOpen className="w-5 h-5" />, gradient: "from-indigo-500 to-blue-600" },
              { role: "staff", label: "บุคลากร", desc: "จัดการข้อมูล ตั้งค่าระบบ และดูแลผู้ใช้งาน", icon: <Settings className="w-5 h-5" />, gradient: "from-amber-500 to-orange-600" },
            ].map((r) => (
              <Link
                key={r.role}
                href={`/login?tab=${r.role}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-all"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${r.gradient}`} />
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                  {r.icon}
                </div>
                <h3 className="font-bold text-foreground text-sm">{r.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                  เข้าสู่ระบบ <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-subtle-foreground mt-10">
          ระบบจัดการโรงเรียน &copy; {new Date().getFullYear()}
        </p>
      </main>

      <GuestChatWidget />
      <ForecastDetailModal state={forecastModal} onClose={() => setForecastModal(null)} />
    </div>
  );
}
