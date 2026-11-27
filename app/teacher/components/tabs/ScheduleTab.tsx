"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Printer,
  CalendarDays,
  BookOpen,
  Building2,
  Bell,
  Sparkles,
  Coffee,
  ArrowRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { type SchedulePeriod, type ScheduleEntry, type DaySetting, DAY_COLORS } from "../types";

interface ScheduleTabProps {
  schedulePeriods: SchedulePeriod[];
  myScheduleEntries: ScheduleEntry[];
  activeDays: DaySetting[];
  onExport: () => void;
}

const SUBJECT_PALETTES = [
  "bg-indigo-500/10 border-indigo-500/25 text-indigo-700 dark:text-indigo-300",
  "bg-sky-500/10 border-sky-500/25 text-sky-700 dark:text-sky-300",
  "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300",
  "bg-violet-500/10 border-violet-500/25 text-violet-700 dark:text-violet-300",
  "bg-teal-500/10 border-teal-500/25 text-teal-700 dark:text-teal-300",
  "bg-cyan-500/10 border-cyan-500/25 text-cyan-700 dark:text-cyan-300",
  "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300",
];

function getSubjectPalette(subjectName: string) {
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = (hash * 31 + subjectName.charCodeAt(i)) >>> 0;
  }
  return SUBJECT_PALETTES[hash % SUBJECT_PALETTES.length];
}

function toMinutes(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function ScheduleTab({
  schedulePeriods,
  myScheduleEntries,
  activeDays,
  onExport,
}: ScheduleTabProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const todayDayValue = currentTime.getDay();
  const defaultDay = activeDays.some((d) => d.value === todayDayValue)
    ? todayDayValue
    : activeDays[0]?.value ?? 1;

  const [selectedDay, setSelectedDay] = useState<number>(defaultDay);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTimeStr = currentTime.toTimeString().slice(0, 5);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const todayEntries = [...myScheduleEntries]
    .filter((e) => Number(e.day_of_week) === todayDayValue)
    .sort((a, b) => Number(a.period_no) - Number(b.period_no));

  let currentTeaching: ScheduleEntry | null = null;
  let currentPeriod: SchedulePeriod | null = null;
  let nextTeaching: ScheduleEntry | null = null;

  for (const entry of todayEntries) {
    const period = schedulePeriods.find((p) => p.id === entry.period_id);
    if (period && !period.is_break) {
      if (currentTimeStr >= entry.start_time && currentTimeStr <= entry.end_time) {
        currentTeaching = entry;
        currentPeriod = period;
      } else if (!nextTeaching && entry.start_time > currentTimeStr) {
        nextTeaching = entry;
      }
    }
  }

  let periodProgressPct = 0;
  if (currentTeaching) {
    const startMin = toMinutes(currentTeaching.start_time);
    const endMin = toMinutes(currentTeaching.end_time);
    const duration = Math.max(1, endMin - startMin);
    periodProgressPct = Math.min(100, Math.max(0, ((currentMinutes - startMin) / duration) * 100));
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (schedulePeriods.length === 0) {
    return (
      <div className="ui-card flex items-center justify-center min-h-[360px] p-8 animate-fade-in-up">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <CalendarDays className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">ยังไม่มีตารางสอน</h3>
          <p className="text-sm text-muted-foreground">แอดมินยังไม่ได้กำหนดคาบเรียนในเทอมนี้</p>
        </div>
      </div>
    );
  }

  const selectedDayInfo = activeDays.find((d) => d.value === selectedDay);
  const selectedDayEntries = [...myScheduleEntries]
    .filter((e) => Number(e.day_of_week) === selectedDay)
    .sort((a, b) => Number(a.period_no) - Number(b.period_no));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Top Live Status Card ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 w-52 h-52 bg-primary/8 rounded-full blur-2xl" />

        <div className="relative z-10 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {currentTime.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono tracking-tight">
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>

            {myScheduleEntries.length > 0 && (
              <button
                type="button"
                onClick={onExport}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              >
                <Printer className="w-4 h-4 text-primary" />
                <span>พิมพ์ตารางสอน</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {/* Current Teaching */}
            <div className="lg:col-span-2">
              {currentTeaching && currentPeriod ? (
                <div className="h-full p-4 sm:p-5 rounded-xl bg-primary/8 border border-primary/25 flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-card border border-border rounded-md text-[11px] font-bold text-foreground">
                          คาบ {currentPeriod.period_no}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 rounded-md text-[11px] font-bold inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          กำลังสอน
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                        {currentTeaching.subject_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <Building2 className="w-3.5 h-3.5" />
                          ห้อง {currentTeaching.classroom_name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {currentTeaching.start_time} – {currentTeaching.end_time} น.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-1.5 rounded-full bg-card border border-border overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${periodProgressPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full p-4 sm:p-5 rounded-xl bg-muted/50 border border-border flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border text-muted-foreground flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">ไม่มีคาบสอนในขณะนี้</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {todayEntries.length === 0
                        ? "วันนี้ไม่มีตารางสอน"
                        : nextTeaching
                        ? "พักผ่อนหรือเตรียมตัวสำหรับคาบสอนถัดไป"
                        : "เสร็จสิ้นการสอนของวันนี้แล้ว"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Next Teaching Preview */}
            <div className="p-4 sm:p-5 rounded-xl bg-muted/40 border border-border flex flex-col justify-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                คาบสอนถัดไปวันนี้
              </div>
              {nextTeaching ? (
                <div>
                  <div className="font-bold text-sm text-foreground truncate">{nextTeaching.subject_name}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-primary">
                      คาบ {nextTeaching.period_no} ({nextTeaching.start_time})
                    </span>
                    <span>· ห้อง {nextTeaching.classroom_name}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-medium text-subtle-foreground">ไม่มีคาบสอนถัดไปวันนี้</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {myScheduleEntries.length === 0 ? (
        <div className="ui-card p-10 text-center text-muted-foreground">
          <p className="font-semibold text-sm">ยังไม่มีตารางสอนสำหรับคุณในเทอมนี้</p>
        </div>
      ) : (
        <>
          {/* ── View Mode & Day Selector ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
              {activeDays.map((day) => {
                const count = myScheduleEntries.filter((e) => Number(e.day_of_week) === day.value).length;
                const isToday = day.value === todayDayValue;
                const isSelected = selectedDay === day.value && viewMode === "daily";
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day.value);
                      setViewMode("daily");
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>วัน{day.label}</span>
                    {isToday && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        วันนี้
                      </span>
                    )}
                    {count > 0 && (
                      <span className={`text-[10px] opacity-75 ${isSelected ? "" : "text-subtle-foreground"}`}>
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted border border-border self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("daily")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === "daily"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                รายวัน
              </button>
              <button
                type="button"
                onClick={() => setViewMode("weekly")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === "weekly"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                ทั้งสัปดาห์
              </button>
            </div>
          </div>

          {/* ── Daily Timeline View ── */}
          {viewMode === "daily" ? (
            <section className="ui-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/35 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                      DAY_COLORS[selectedDay] || ""
                    }`}
                  >
                    วัน{selectedDayInfo?.label}
                  </span>
                  {selectedDay === todayDayValue && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary">
                      ตารางวันนี้
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {selectedDayEntries.length} คาบสอน
                </span>
              </div>

              <div className="divide-y divide-border">
                {schedulePeriods.map((period) => {
                  const entries = selectedDayEntries.filter((e) => e.period_id === period.id);
                  const isToday = selectedDay === todayDayValue;
                  const isCurrentClass =
                    !period.is_break &&
                    isToday &&
                    currentTimeStr >= period.start_time &&
                    currentTimeStr <= period.end_time;

                  if (period.is_break) {
                    return (
                      <div
                        key={period.id}
                        className="px-4 sm:px-6 py-3 bg-muted/35 flex items-center gap-4 text-muted-foreground"
                      >
                        <div className="w-24 sm:w-28 shrink-0 text-xs font-medium font-mono">
                          {period.start_time} – {period.end_time}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{period.label || "พักเบรก"}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={period.id}
                      className={`px-4 sm:px-6 py-4 flex items-center gap-3.5 sm:gap-5 transition-colors ${
                        isCurrentClass ? "bg-primary/8 border-l-4 border-l-primary" : "hover:bg-muted/25"
                      }`}
                    >
                      <div className="w-24 sm:w-28 shrink-0">
                        <div className={`text-xs font-bold ${isCurrentClass ? "text-primary" : "text-foreground"}`}>
                          คาบ {period.period_no}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          {period.start_time} – {period.end_time}
                        </div>
                      </div>

                      {entries.length > 0 ? (
                        <div className="flex-1 min-w-0 space-y-2">
                          {entries.map((entry) => (
                            <div
                              key={entry.id}
                              className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                                isCurrentClass
                                  ? "bg-card border-primary/40 shadow-xs"
                                  : getSubjectPalette(entry.subject_name)
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-foreground truncate">
                                  {entry.subject_name}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-primary" />
                                  <span className="font-semibold text-foreground/80">
                                    ห้อง {entry.classroom_name}
                                  </span>
                                </div>
                              </div>
                              {isCurrentClass && (
                                <span className="shrink-0 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold inline-flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  กำลังสอน
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-subtle-foreground">
                          ว่าง (ไม่มีคาบสอน)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            /* ── Full Weekly Timetable View ── */
            <section className="ui-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm">ตารางสอนรายสัปดาห์</h3>
                <span className="text-xs text-muted-foreground">เลื่อนแนวนอนเพื่อดูครบทุกวัน</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border">
                      <th className="sticky left-0 z-20 bg-muted/95 backdrop-blur-sm px-4 py-3 text-left border-r border-border min-w-[125px]">
                        <span className="font-bold text-xs text-muted-foreground">คาบ / เวลา</span>
                      </th>
                      {activeDays.map((day) => {
                        const isToday = todayDayValue === day.value;
                        return (
                          <th key={day.value} className="px-3 py-3 text-center min-w-[140px]">
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs border ${
                                isToday
                                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                  : DAY_COLORS[day.value]
                              }`}
                            >
                              {isToday && <Bell className="w-3 h-3" />}
                              <span>วัน{day.label}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {schedulePeriods.map((period, index) => {
                      const isBreak = period.is_break;
                      return (
                        <tr
                          key={period.id}
                          className={isBreak ? "bg-muted/40" : index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                        >
                          <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-3 border-r border-border">
                            <div className="font-bold text-sm text-foreground">คาบ {period.period_no}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                              {period.start_time}–{period.end_time}
                            </div>
                            {period.label && (
                              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                                {period.label}
                              </div>
                            )}
                          </td>

                          {isBreak ? (
                            <td colSpan={activeDays.length} className="px-4 py-3.5 text-center">
                              <div className="inline-flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                                <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span>{period.label || "พักเบรก"}</span>
                              </div>
                            </td>
                          ) : (
                            activeDays.map((day) => {
                              const entries = myScheduleEntries.filter(
                                (e) => Number(e.day_of_week) === day.value && e.period_id === period.id
                              );
                              const isToday = todayDayValue === day.value;
                              const isCurrentClass =
                                isToday &&
                                currentTimeStr >= period.start_time &&
                                currentTimeStr <= period.end_time;

                              return (
                                <td key={day.value} className="px-2.5 py-2.5 text-center align-middle">
                                  {entries.length === 0 ? (
                                    <span className="text-muted-foreground/35 text-sm">—</span>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {entries.map((entry) => (
                                        <div
                                          key={entry.id}
                                          className={`rounded-xl px-3 py-2.5 text-xs border transition-all ${
                                            isCurrentClass
                                              ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/25"
                                              : getSubjectPalette(entry.subject_name)
                                          }`}
                                        >
                                          <div className="font-bold leading-snug">{entry.subject_name}</div>
                                          <div
                                            className={`text-[11px] mt-1 font-medium ${
                                              isCurrentClass ? "text-primary-foreground/85" : "opacity-80"
                                            }`}
                                          >
                                            ห้อง {entry.classroom_name}
                                          </div>
                                          {isCurrentClass && (
                                            <div className="mt-1.5 pt-1 border-t border-primary-foreground/20">
                                              <span className="text-[10px] font-bold inline-flex items-center justify-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                กำลังสอน
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              );
                            })
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
