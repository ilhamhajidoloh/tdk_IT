"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

function thaiWeekdayShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return THAI_WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ui-card p-6 animate-fade-in-up">
      <div className="flex items-start gap-3.5 mb-5">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-primary-soft text-primary shadow-sm">
          <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="text-center py-6 text-sm text-subtle-foreground bg-muted rounded-xl border border-dashed border-border font-medium">
      {text}
    </div>
  );
}

function MemberChips({ names }: { names: string[] }) {
  if (names.length === 0) return <EmptyNote text="ยังไม่มีรายชื่อ" />;
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((n) => (
        <span
          key={n}
          className="px-3 py-1 rounded-full text-xs font-bold bg-accent text-accent-foreground border border-border/50"
        >
          {n}
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/home")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        {/* Hero */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            หน้า<span className="brand-text">แรก</span>
          </h1>
          <p className="mt-1.5 text-muted-foreground text-sm">
            ข่าวประชาสัมพันธ์ เวรครู และเวรแม่ครัวประจำสัปดาห์
          </p>
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
          <div className="grid lg:grid-cols-3 gap-6">
            {/* News */}
            <div className="lg:col-span-2">
              <SectionCard
                icon="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6v-4H7v4z"
                title="ข่าวสาร"
                subtitle="ประกาศ ข่าวสาร และวันหยุดพิเศษจากโรงเรียน"
              >
                {/* Upcoming holidays notice */}
                {data && data.holidays.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">🗓 วันหยุดพิเศษที่กำลังจะมาถึง</p>
                    {data.holidays.map((h) => (
                      <div key={h.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                        <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 shrink-0">{h.date}</span>
                        <span className="text-xs text-red-700 dark:text-red-300 font-semibold">{h.reason}</span>
                        <span className="ml-auto text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 rounded-full">หยุดเรียน</span>
                      </div>
                    ))}
                    {data.news.length > 0 && <div className="border-t border-border mt-3 mb-1" />}
                  </div>
                )}

                {!data || data.news.length === 0 ? (
                  data?.holidays.length === 0 ? <EmptyNote text="ยังไม่มีข่าวสาร" /> : null
                ) : (
                  <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                    {data.news.map((n) => (
                      <article key={n.id} className="p-4 rounded-xl border border-border bg-muted/40">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-foreground">{n.title}</h3>
                          <span className="text-[11px] text-subtle-foreground shrink-0 whitespace-nowrap">
                            {formatThaiDate(n.created_at)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-line">{n.content}</p>
                      </article>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Duty cards */}
            <div className="space-y-6">
              <SectionCard
                icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                title="ครูเวรประจำสัปดาห์นี้"
                subtitle={
                  data?.teacherDuty.current
                    ? formatThaiDateRange(data.teacherDuty.current.weekStart, data.teacherDuty.current.weekEnd)
                    : "ยังไม่ได้ตั้งค่ากลุ่มเวรครู"
                }
              >
                {data?.teacherDuty.current ? (
                  <>
                    {data.teacherDuty.current.allDaysClosed && (
                      <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 font-semibold">
                        🏖 สัปดาห์นี้ปิดเรียนทั้งสัปดาห์ — กลุ่มนี้จะขึ้นเวรสัปดาห์ถัดไปแทน
                      </div>
                    )}
                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-soft text-primary">
                      กลุ่ม: {data.teacherDuty.current.name}
                    </div>
                    <MemberChips names={data.teacherDuty.current.members.map((m) => m.username)} />
                  </>
                ) : (
                  <EmptyNote text="ยังไม่มีกลุ่มเวรครู" />
                )}
              </SectionCard>

              <SectionCard
                icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                title="แม่ครัวประจำสัปดาห์"
                subtitle={
                  data?.cookDuty
                    ? `${formatThaiDateRange(data.cookDuty.weekStart, data.cookDuty.weekEnd)} · หมุนกลุ่มทุกวันเปิดเรียน`
                    : "ยังไม่ได้ตั้งค่ากลุ่มแม่ครัว"
                }
              >
                {!data || data.cookDuty.thisWeek.length === 0 ? (
                  <EmptyNote text="ยังไม่มีกลุ่มแม่ครัว" />
                ) : (
                  <div className="space-y-2">
                    {data.cookDuty.thisWeek.map((e) => {
                      const isToday = data.cookDuty.today?.date === e.date;
                      const holidayOnDay = data.holidays.find((h) => h.date === e.date);
                      return (
                        <div
                          key={e.date}
                          className={`p-3 rounded-xl border ${
                            isToday ? "border-success bg-success-soft" : "border-border bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`text-xs font-bold ${isToday ? "text-success" : "text-muted-foreground"}`}>
                              {isToday && <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />}
                              วัน{thaiWeekdayShort(e.date)} {formatThaiDate(e.date)}
                            </span>
                            {holidayOnDay ? (
                              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/30">
                                🏖 {holidayOnDay.reason}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-foreground">{e.name}</span>
                            )}
                          </div>
                          {!holidayOnDay && <MemberChips names={e.members.map((m) => m.name)} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Forecast */}
            <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
              <SectionCard
                icon="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                title="คาดการณ์เวรครู"
                subtitle="ลำดับกลุ่มเวรครูในสัปดาห์ถัดไป"
              >
                {!data || data.teacherDuty.forecast.length === 0 ? (
                  <EmptyNote text="ไม่มีข้อมูลคาดการณ์" />
                ) : (
                  <ul className="space-y-2">
                    {data.teacherDuty.forecast.map((f) => (
                      <li
                        key={`${f.id}-${f.weekStart}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border bg-muted/40"
                      >
                        <span className="text-xs font-semibold text-muted-foreground">
                          {formatThaiDateRange(f.weekStart, f.weekEnd)}
                        </span>
                        <span className="text-sm font-bold text-foreground">{f.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                icon="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                title="คาดการณ์เวรแม่ครัว"
                subtitle="กลุ่มแม่ครัวในวันเปิดเรียนถัดไป"
              >
                {!data || data.cookDuty.forecast.length === 0 ? (
                  <EmptyNote text="ไม่มีข้อมูลคาดการณ์" />
                ) : (
                  <ul className="space-y-2">
                    {data.cookDuty.forecast.map((f) => (
                      <li
                        key={`${f.id}-${f.date}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border bg-muted/40"
                      >
                        <span className="text-xs font-semibold text-muted-foreground">
                          วัน{thaiWeekdayShort(f.date)} {formatThaiDate(f.date)}
                        </span>
                        <span className="text-sm font-bold text-foreground">{f.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-subtle-foreground mt-10">
          ระบบจัดการโรงเรียน &copy; {new Date().getFullYear()}
        </p>
      </main>

      <GuestChatWidget />
    </div>
  );
}
