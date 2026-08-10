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
  LogIn
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
  address?: string;
  phone?: string;
  enabled_modules?: EnabledModules;
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
        <div className={`p-6 text-white ${gradient} relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm transition-colors"
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">รายชื่อผู้ปฏิบัติหน้าที่</h4>
          <MemberList names={names} tone={tone} />
          <div className="pt-2">
            <button onClick={onClose} className="w-full ui-btn ui-btn-secondary py-2.5 rounded-xl font-bold">
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
  const [forecastModal, setForecastModal] = useState<ForecastModalState>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/public/schools/${schoolParam}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/public/home?school=${schoolParam}`).then((r) => r.ok ? r.json() : null),
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shadow-sm"
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-spin">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">กำลังโหลดข้อมูลโรงเรียน...</p>
          </div>
        ) : (
          <>
            {/* Duty Section (Spotlights) */}
            {schoolInfo?.enabled_modules?.duty !== false && (
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-foreground">
                        กลุ่มเวร: <span className="text-indigo-600 dark:text-indigo-400">{data.teacherDuty.current.name}</span>
                      </h3>
                    </div>
                    <MemberList names={data.teacherDuty.current.members.map((m) => m.username)} tone="indigo" />

                    {data.teacherDuty.forecast.length > 0 && (
                      <div className="pt-4 border-t border-border space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">สัปดาห์ถัดไป</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {data.teacherDuty.forecast.slice(0, 4).map((f) => (
                            <button
                              key={f.id + f.weekStart}
                              onClick={() => setForecastModal({ type: "teacher", entry: f })}
                              className="text-left p-2.5 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <span className="text-xs font-bold text-foreground block truncate">{f.name}</span>
                              <span className="text-[10px] text-muted-foreground block truncate">
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
                title="เวรประจำวัน (แม่ครัว)"
                subtitle={data?.cookDuty?.today ? formatThaiDate(data.cookDuty.today.date) : "ประจำวันนี้"}
                badgeLabel="แม่ครัวเวร"
                gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
                ringClass="ring-emerald-500/20 dark:ring-emerald-400/20"
              >
                {data?.cookDuty?.today ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-foreground">
                        กลุ่มแม่ครัว: <span className="text-emerald-600 dark:text-emerald-400">{data.cookDuty.today.name}</span>
                      </h3>
                    </div>
                    <MemberList names={data.cookDuty.today.members.map((m) => m.name)} tone="emerald" />

                    {data.cookDuty.thisWeek.length > 0 && (
                      <div className="pt-4 border-t border-border space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ตารางสัปดาห์นี้</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {data.cookDuty.thisWeek.map((entry) => (
                            <button
                              key={entry.date}
                              onClick={() => entry.name && setForecastModal({ type: "cook", entry })}
                              disabled={!entry.name}
                              className={`text-left p-2 rounded-xl border transition-colors ${
                                entry.date === data.cookDuty.today?.date
                                  ? "border-emerald-500 bg-emerald-500/10 font-bold"
                                  : "border-border bg-muted/40 hover:bg-muted"
                              }`}
                            >
                              <span className="text-[11px] text-muted-foreground block">
                                {thaiWeekdayShort(entry.date)} ({entry.date.split("-")[2]})
                              </span>
                              <span className="text-xs font-semibold text-foreground block truncate">
                                {entry.name || "วันหยุด"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyNote text="ไม่มีตารางเวรแม่ครัวประจำวันนี้" />
                )}
              </SpotlightCard>
            </div>
            )}

            {/* News & Holidays Section */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* News */}
              {schoolInfo?.enabled_modules?.news !== false && (
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-extrabold text-foreground">ข่าวประชาสัมพันธ์</h2>
                  </div>
                </div>

                {data?.news && data.news.length > 0 ? (
                  <div className="space-y-4">
                    {data.news.map((item) => (
                      <article key={item.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-extrabold text-base text-foreground">{item.title}</h3>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">
                            {formatThaiDate(item.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-subtle-foreground whitespace-pre-line leading-relaxed">
                          {item.content}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyNote text="ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้" />
                )}
              </div>
              )}

              {/* Holidays */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-rose-500" />
                  <h2 className="text-xl font-extrabold text-foreground">วันหยุด / กิจกรรม</h2>
                </div>

                {data?.holidays && data.holidays.length > 0 ? (
                  <div className="space-y-3">
                    {data.holidays.map((h) => (
                      <div key={h.id} className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center shrink-0 font-black text-xs leading-none">
                          <span>{h.date.split("-")[2]}</span>
                          <span className="text-[9px] uppercase mt-0.5">{thaiWeekdayShort(h.date)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{h.reason}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatThaiDate(h.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyNote text="ไม่มีวันหยุดในเร็วๆ นี้" />
                )}
              </div>
            </div>
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
