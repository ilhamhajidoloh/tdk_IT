"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Printer,
  CalendarDays,
  BookOpen,
  User,
  Bell,
  Sparkles,
  Coffee,
} from "lucide-react";
import { type SchedulePeriod, type ScheduleEntry, type DaySetting } from "../types";

interface ScheduleTabProps {
  schedulePeriods: SchedulePeriod[];
  scheduleEntries: ScheduleEntry[];
  classroomId: string | null;
  activeDays: DaySetting[];
  onExport: () => void;
}

export default function ScheduleTab({
  schedulePeriods,
  scheduleEntries,
  classroomId,
  activeDays,
  onExport,
}: ScheduleTabProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDayValue = currentTime.getDay();
  const currentTimeStr = currentTime.toTimeString().slice(0, 5);

  const todayEntries = scheduleEntries.filter(
    (e) => e.classroom_id === classroomId && Number(e.day_of_week) === currentDayValue
  );
  let currentSubject: ScheduleEntry | null = null;
  let currentPeriod: SchedulePeriod | null = null;
  for (const entry of todayEntries) {
    const period = schedulePeriods.find((p) => p.id === entry.period_id);
    if (period && !period.is_break && currentTimeStr >= entry.start_time && currentTimeStr <= entry.end_time) {
      currentSubject = entry;
      currentPeriod = period;
      break;
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {schedulePeriods.length === 0 ? (
        <div className="ui-card flex items-center justify-center min-h-[360px] p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">ยังไม่มีตารางเรียน</h3>
            <p className="text-sm text-muted-foreground">แอดมินยังไม่ได้กำหนดตารางเรียนในเทอมนี้</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Current Subject Banner ── */}
          <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="pointer-events-none absolute -right-10 -top-10 w-52 h-52 bg-primary/8 rounded-full blur-2xl" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">เวลาปัจจุบัน</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-foreground font-mono tracking-tight">
                      {formatTime(currentTime)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onExport}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
                >
                  <Printer className="w-4 h-4 text-primary" />
                  <span>พิมพ์ตาราง</span>
                </button>
              </div>

              {currentSubject && currentPeriod ? (
                <div className="p-4 sm:p-5 rounded-xl bg-primary/8 border border-primary/20">
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 bg-card border border-border rounded-md text-xs font-bold text-foreground">
                          คาบ {currentPeriod.period_no}
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 rounded-md text-xs font-bold inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          กำลังเรียน
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 truncate">
                        {currentSubject.subject_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                        {(() => {
                          const teacherName =
                            currentSubject.teacher_name ||
                            (currentSubject.teacher_names?.length
                              ? currentSubject.teacher_names.join(", ")
                              : null);
                          return teacherName ? (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-primary" />
                              <span>อ.{teacherName}</span>
                            </div>
                          ) : null;
                        })()}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {currentSubject.start_time} – {currentSubject.end_time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-xl bg-muted/50 border border-border flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border text-muted-foreground flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">ไม่มีคาบเรียนในขณะนี้</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      พักผ่อนหรือเตรียมตัวสำหรับคาบถัดไป
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Mobile & Tablet View (1 col on Mobile, 2 cols on Tablet) ── */}
          <section className="xl:hidden space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">ตารางเรียนรายวัน</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDays.map((day) => {
                const dayEntries = scheduleEntries.filter(
                  (e) => e.classroom_id === classroomId && Number(e.day_of_week) === day.value
                );
                if (dayEntries.length === 0) return null;

                const isToday = currentDayValue === day.value;
                const sortedEntries = [...dayEntries].sort(
                  (a, b) => Number(a.period_no) - Number(b.period_no)
                );

                return (
                  <div
                    key={day.value}
                    className={`rounded-2xl border overflow-hidden bg-card transition-all ${
                      isToday ? "border-primary/50 ring-2 ring-primary/15 shadow-sm" : "border-border"
                    }`}
                  >
                    <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${day.color}`}>
                          วัน{day.label}
                        </span>
                        {isToday && (
                          <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded-md text-[11px] font-bold">
                            วันนี้
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {sortedEntries.length} คาบ
                      </span>
                    </div>

                    <div className="divide-y divide-border">
                      {sortedEntries.map((entry) => {
                        const period = schedulePeriods.find((p) => p.id === entry.period_id);
                        const isCurrentClass =
                          isToday &&
                          currentTimeStr >= entry.start_time &&
                          currentTimeStr <= entry.end_time;

                        const teacherName =
                          entry.teacher_name ||
                          (entry.teacher_names?.length ? entry.teacher_names.join(", ") : null);

                        return (
                          <div
                            key={entry.id}
                            className={`p-3.5 sm:p-4 transition-colors ${
                              isCurrentClass
                                ? "bg-primary/8 border-l-4 border-l-primary"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 w-13 text-center">
                                <div
                                  className={`text-xs font-bold ${
                                    isCurrentClass ? "text-primary" : "text-foreground"
                                  }`}
                                >
                                  คาบ {entry.period_no}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {entry.start_time}
                                </div>
                              </div>

                              <div className="w-px self-stretch bg-border" />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4
                                    className={`font-bold text-sm leading-snug ${
                                      isCurrentClass ? "text-primary" : "text-foreground"
                                    }`}
                                  >
                                    {entry.subject_name}
                                  </h4>
                                  {isCurrentClass && (
                                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-md shrink-0">
                                      กำลังเรียน
                                    </span>
                                  )}
                                </div>

                                {teacherName && (
                                  <p className="text-xs text-muted-foreground mt-1">อ.{teacherName}</p>
                                )}

                                {period?.label && (
                                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-500/12 text-amber-700 dark:text-amber-300 text-[11px] font-medium rounded">
                                    {period.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Desktop Full Week Table (xl+) ── */}
          <section className="hidden xl:block space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">ตารางเรียนรายสัปดาห์</h2>
            </div>

            <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border">
                      <th className="sticky left-0 z-20 bg-muted/95 backdrop-blur-sm px-4 py-3 text-left border-r border-border min-w-[130px]">
                        <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                          คาบ / เวลา
                        </span>
                      </th>
                      {activeDays.map((day) => {
                        const isToday = currentDayValue === day.value;
                        return (
                          <th key={day.value} className="px-3 py-3 text-center min-w-[140px]">
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs border ${
                                isToday
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                  : day.color
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
                          className={
                            isBreak
                              ? "bg-muted/40"
                              : index % 2 === 0
                              ? "bg-card"
                              : "bg-muted/20"
                          }
                        >
                          <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-3 border-r border-border">
                            <div className="font-bold text-sm text-foreground">คาบ {period.period_no}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {period.start_time} – {period.end_time}
                            </div>
                            {period.label && (
                              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                                {period.label}
                              </div>
                            )}
                          </td>

                          {isBreak ? (
                            <td colSpan={activeDays.length} className="px-4 py-4 text-center">
                              <div className="inline-flex items-center gap-2 text-muted-foreground">
                                <Coffee className="w-4 h-4" />
                                <span className="font-semibold text-sm">
                                  {period.label || "พักเบรก"}
                                </span>
                              </div>
                            </td>
                          ) : (
                            activeDays.map((day) => {
                              const entry = scheduleEntries.find(
                                (e) =>
                                  e.classroom_id === classroomId &&
                                  Number(e.day_of_week) === day.value &&
                                  e.period_id === period.id
                              );

                              const isToday = currentDayValue === day.value;
                              const isCurrentClass =
                                isToday &&
                                currentTimeStr >= period.start_time &&
                                currentTimeStr <= period.end_time;

                              return (
                                <td key={day.value} className="px-2.5 py-2.5 text-center align-middle">
                                  {entry ? (
                                    <div
                                      className={`rounded-xl px-3 py-2.5 text-xs transition-all ${
                                        isCurrentClass
                                          ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                                          : "bg-primary/8 text-foreground border border-primary/15 hover:bg-primary/12"
                                      }`}
                                    >
                                      <div className="font-bold leading-snug mb-1">
                                        {entry.subject_name}
                                      </div>
                                      {(() => {
                                        const teacherName =
                                          entry.teacher_name ||
                                          (entry.teacher_names?.length
                                            ? entry.teacher_names.join(", ")
                                            : null);
                                        return teacherName ? (
                                          <div
                                            className={`text-[11px] ${
                                              isCurrentClass
                                                ? "text-primary-foreground/85"
                                                : "text-muted-foreground"
                                            }`}
                                          >
                                            อ.{teacherName}
                                          </div>
                                        ) : null;
                                      })()}
                                      {isCurrentClass && (
                                        <div className="mt-1.5 pt-1 border-t border-primary-foreground/20">
                                          <span className="text-[10px] font-bold inline-flex items-center justify-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            กำลังเรียน
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/40 text-sm">—</span>
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
            </div>
          </section>
        </>
      )}
    </div>
  );
}
