"use client";

import { useState, useEffect } from "react";
import { Clock, Printer, CalendarDays, BookOpen, User, Bell, ChevronRight, Sparkles } from "lucide-react";
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
  const [currentSubject, setCurrentSubject] = useState<ScheduleEntry | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<SchedulePeriod | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTimeStr = now.toTimeString().slice(0, 5);

    const todayEntries = scheduleEntries.filter(
      e => e.classroom_id === classroomId && Number(e.day_of_week) === currentDay
    );

    let foundSubject: ScheduleEntry | null = null;
    let foundPeriod: SchedulePeriod | null = null;

    for (const entry of todayEntries) {
      const period = schedulePeriods.find(p => p.id === entry.period_id);
      if (period && !period.is_break) {
        if (currentTimeStr >= entry.start_time && currentTimeStr <= entry.end_time) {
          foundSubject = entry;
          foundPeriod = period;
          break;
        }
      }
    }

    setCurrentSubject(foundSubject);
    setCurrentPeriod(foundPeriod);
  }, [currentTime, scheduleEntries, schedulePeriods, classroomId]);

  const currentDayValue = currentTime.getDay();
  const currentTimeStr = currentTime.toTimeString().slice(0, 5);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {schedulePeriods.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
              <CalendarDays className="w-10 h-10 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">ยังไม่มีตารางเรียน</h3>
            <p className="text-muted-foreground">แอดมินยังไม่ได้กำหนดตารางเรียนในเทอมนี้</p>
          </div>
        </div>
      ) : (
        <>
          {/* Current Subject Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 p-6 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">เวลาปัจจุบัน</p>
                    <p className="text-2xl font-bold">{formatTime(currentTime)}</p>
                  </div>
                </div>
                <button
                  onClick={onExport}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-medium transition-all flex items-center gap-2 border border-white/30"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">พิมพ์ตาราง</span>
                </button>
              </div>

              {currentSubject && currentPeriod ? (
                <div className="mt-6 p-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-bold">คาบ {currentPeriod.period_no}</span>
                        <span className="px-2.5 py-1 bg-green-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          กำลังเรียน
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{currentSubject.subject_name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                        {(() => {
                          const teacherName = currentSubject.teacher_name ||
                            (currentSubject.teacher_names?.length ? currentSubject.teacher_names.join(", ") : null);
                          return teacherName ? (
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4" />
                              <span>อ.{teacherName}</span>
                            </div>
                          ) : null;
                        })()}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{currentSubject.start_time} - {currentSubject.end_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-white/70" />
                  <p className="font-semibold text-lg">ไม่มีคาบเรียนในขณะนี้</p>
                  <p className="text-sm text-white/70 mt-1">พักผ่อนหรือเตรียมตัวสำหรับคาบถัดไป</p>
                </div>
              )}
            </div>
          </div>

          {/* Day Cards - Mobile Vertical, Desktop/Tablet Horizontal Scroll */}
          <div className="xl:hidden">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              ตารางเรียนรายวัน
            </h2>

            {/* Mobile - Vertical Stack */}
            <div className="md:hidden space-y-4">
              {activeDays.map(day => {
                const dayEntries = scheduleEntries.filter(
                  e => e.classroom_id === classroomId && Number(e.day_of_week) === day.value
                );
                if (dayEntries.length === 0) return null;

                const isToday = currentDayValue === day.value;
                const sortedEntries = dayEntries.sort((a, b) => Number(a.period_no) - Number(b.period_no));

                return (
                  <div
                    key={day.value}
                    className={`
                      rounded-2xl border-2 overflow-hidden transition-all
                      ${isToday
                        ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className={`px-4 py-3 bg-gradient-to-r ${day.gradient} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">วัน{day.label}</span>
                        {isToday && (
                          <span className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/30">
                            วันนี้
                          </span>
                        )}
                      </div>
                      <span className="text-white/90 text-sm font-medium">{sortedEntries.length} คาบ</span>
                    </div>

                    <div className="divide-y divide-border bg-card">
                      {sortedEntries.map(entry => {
                        const period = schedulePeriods.find(p => p.id === entry.period_id);
                        const isCurrentClass = isToday &&
                          currentTimeStr >= entry.start_time &&
                          currentTimeStr <= entry.end_time;

                        return (
                          <div
                            key={entry.id}
                            className={`
                              p-4 transition-all
                              ${isCurrentClass
                                ? 'bg-primary/5 border-l-4 border-primary'
                                : 'hover:bg-muted/50'
                              }
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 w-12 text-center">
                                <div className={`
                                  text-sm font-bold mb-1
                                  ${isCurrentClass ? 'text-primary' : 'text-muted-foreground'}
                                `}>
                                  คาบ {entry.period_no}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {entry.start_time}
                                </div>
                              </div>

                              <div className="w-px h-12 bg-border" />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className={`
                                    font-bold text-sm leading-tight
                                    ${isCurrentClass ? 'text-primary' : 'text-foreground'}
                                  `}>
                                    {entry.subject_name}
                                  </h4>
                                  {isCurrentClass && (
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded shrink-0">
                                      กำลังเรียน
                                    </span>
                                  )}
                                </div>

                                {(() => {
                                  const teacherName = entry.teacher_name ||
                                    (entry.teacher_names?.length ? entry.teacher_names.join(", ") : null);
                                  return teacherName ? (
                                    <p className="text-xs text-muted-foreground">อ.{teacherName}</p>
                                  ) : null;
                                })()}

                                {period?.label && (
                                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium rounded">
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

            {/* Tablet & Desktop - Horizontal Scroll */}
            <div className="hidden md:block xl:hidden">
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                  {activeDays.map(day => {
                    const dayEntries = scheduleEntries.filter(
                      e => e.classroom_id === classroomId && Number(e.day_of_week) === day.value
                    );
                    if (dayEntries.length === 0) return null;

                    const isToday = currentDayValue === day.value;
                    const sortedEntries = dayEntries.sort((a, b) => Number(a.period_no) - Number(b.period_no));

                    return (
                      <div
                        key={day.value}
                        className={`
                          w-80 rounded-2xl border-2 overflow-hidden transition-all flex-shrink-0
                          ${isToday
                            ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <div className={`px-4 py-3 bg-gradient-to-r ${day.gradient} flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">วัน{day.label}</span>
                            {isToday && (
                              <span className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/30">
                                วันนี้
                              </span>
                            )}
                          </div>
                          <span className="text-white/90 text-sm font-medium">{sortedEntries.length} คาบ</span>
                        </div>

                        <div className="divide-y divide-border bg-card max-h-[600px] overflow-y-auto">
                          {sortedEntries.map(entry => {
                            const period = schedulePeriods.find(p => p.id === entry.period_id);
                            const isCurrentClass = isToday &&
                              currentTimeStr >= entry.start_time &&
                              currentTimeStr <= entry.end_time;

                            return (
                              <div
                                key={entry.id}
                                className={`
                                  p-4 transition-all
                                  ${isCurrentClass
                                    ? 'bg-primary/5 border-l-4 border-primary'
                                    : 'hover:bg-muted/50'
                                  }
                                `}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="shrink-0 w-12 text-center">
                                    <div className={`
                                      text-sm font-bold mb-1
                                      ${isCurrentClass ? 'text-primary' : 'text-muted-foreground'}
                                    `}>
                                      คาบ {entry.period_no}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {entry.start_time}
                                    </div>
                                  </div>

                                  <div className="w-px h-12 bg-border" />

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <h4 className={`
                                        font-bold text-sm leading-tight
                                        ${isCurrentClass ? 'text-primary' : 'text-foreground'}
                                      `}>
                                        {entry.subject_name}
                                      </h4>
                                      {isCurrentClass && (
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded shrink-0">
                                          กำลังเรียน
                                        </span>
                                      )}
                                    </div>

                                    {(() => {
                                      const teacherName = entry.teacher_name ||
                                        (entry.teacher_names?.length ? entry.teacher_names.join(", ") : null);
                                      return teacherName ? (
                                        <p className="text-xs text-muted-foreground">อ.{teacherName}</p>
                                      ) : null;
                                    })()}

                                    {period?.label && (
                                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium rounded">
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
              </div>
            </div>
          </div>

          {/* Full Week Table - Desktop Only */}
          <div className="hidden xl:block">
            <h2 className="text-xl font-bold text-foreground mb-4">ตารางเรียนรายสัปดาห์</h2>
            <div className="rounded-2xl border-2 border-border overflow-hidden bg-card shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="sticky left-0 z-20 bg-muted/50 backdrop-blur-sm px-4 py-3 text-left">
                        <span className="font-bold text-sm text-muted-foreground">คาบ / เวลา</span>
                      </th>
                      {activeDays.map(day => {
                        const isToday = currentDayValue === day.value;
                        return (
                          <th key={day.value} className="px-3 py-3 text-center min-w-[140px]">
                            <div className={`
                              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm
                              ${isToday
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted text-muted-foreground'
                              }
                            `}>
                              {isToday && <Bell className="w-3.5 h-3.5" />}
                              <span>{day.label}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {schedulePeriods.map((period, index) => {
                      const isBreak = period.is_break;

                      return (
                        <tr key={period.id} className={`
                          border-t-2 border-border
                          ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
                          ${isBreak ? 'bg-muted/40' : ''}
                        `}>
                          <td className="sticky left-0 z-10 bg-inherit backdrop-blur-sm px-4 py-3 border-r-2 border-border">
                            <div className="font-bold text-foreground">คาบ {period.period_no}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {period.start_time} - {period.end_time}
                            </div>
                            {period.label && (
                              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                                {period.label}
                              </div>
                            )}
                          </td>

                          {isBreak ? (
                            <td colSpan={activeDays.length} className="px-4 py-6 text-center">
                              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Bell className="w-5 h-5" />
                                <span className="font-bold text-lg tracking-wide">
                                  {period.label || "พักเบรก"}
                                </span>
                              </div>
                            </td>
                          ) : (
                            activeDays.map(day => {
                              const entry = scheduleEntries.find(
                                e => e.classroom_id === classroomId &&
                                     Number(e.day_of_week) === day.value &&
                                     e.period_id === period.id
                              );

                              const isToday = currentDayValue === day.value;
                              const isCurrentClass = isToday &&
                                currentTimeStr >= period.start_time &&
                                currentTimeStr <= period.end_time;

                              return (
                                <td key={day.value} className="px-3 py-3 text-center">
                                  {entry ? (
                                    <div className={`
                                      rounded-xl px-3 py-3 text-sm transition-all
                                      ${isCurrentClass
                                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/50'
                                        : 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-2 border-violet-200 dark:border-violet-500/30 hover:bg-violet-500/20'
                                      }
                                    `}>
                                      <div className="font-bold leading-tight mb-1">
                                        {entry.subject_name}
                                      </div>
                                      {(() => {
                                        const teacherName = entry.teacher_name ||
                                          (entry.teacher_names?.length ? entry.teacher_names.join(", ") : null);
                                        return teacherName ? (
                                          <div className={`
                                            text-xs
                                            ${isCurrentClass
                                              ? 'text-primary-foreground/80'
                                              : 'text-violet-600/70 dark:text-violet-400/70'
                                            }
                                          `}>
                                            อ.{teacherName}
                                          </div>
                                        ) : null;
                                      })()}
                                      {isCurrentClass && (
                                        <div className="mt-1.5 pt-1.5 border-t border-white/30">
                                          <span className="text-xs font-bold flex items-center justify-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            กำลังเรียน
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/30 text-lg">–</span>
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
          </div>
        </>
      )}
    </div>
  );
}
