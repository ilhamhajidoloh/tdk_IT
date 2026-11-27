"use client";

import {
  Hash,
  Building2,
  BookOpen,
  Star,
  CircleCheck,
  AlertTriangle,
  CalendarDays,
  Clock3,
  Lock,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { type DBGrade, type DBSubject, type ScheduleEntry, type Tab } from "../types";

interface OverviewTabProps {
  studentName: string;
  studentCode: string;
  classroomName: string;
  settingsList: any[];
  activeSettingId: number | null;
  onChangeSetting: (setting: any) => void;
  gpaValue: string;
  gpaCredits: number;
  gpaColor: string;
  gpaRingColor: string;
  filteredGrades: DBGrade[];
  subjectsList: DBSubject[];
  midtermMax: number;
  finalMax: number;
  myScheduleToday: ScheduleEntry[];
  setActiveTab: (tab: Tab) => void;
}

export default function OverviewTab({
  studentName,
  studentCode,
  classroomName,
  settingsList,
  activeSettingId,
  onChangeSetting,
  gpaValue,
  gpaCredits,
  gpaColor,
  gpaRingColor,
  filteredGrades,
  subjectsList,
  midtermMax,
  finalMax,
  myScheduleToday,
  setActiveTab,
}: OverviewTabProps) {
  const activeSetting = settingsList.find((s: any) => s.id === activeSettingId);
  const isManualReleased = activeSetting?.is_grade_released !== false;
  const releaseDateStr = activeSetting?.grade_release_date || null;

  let isGradeReleased = true;
  if (releaseDateStr && releaseDateStr.trim() !== "") {
    const targetTime = new Date(releaseDateStr).getTime();
    const now = new Date().getTime();
    isGradeReleased = now >= targetTime;
  } else {
    isGradeReleased = isManualReleased;
  }

  const getSubjectPercent = (g: DBGrade) => {
    const sub = subjectsList.find(
      (s) => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId
    );
    const mMax = Number(sub?.midterm_max_score) || midtermMax;
    const fMax = Number(sub?.final_max_score) || finalMax;
    const total = (g.midterm_score ?? 0) + (g.final_score ?? 0);
    return mMax + fMax > 0 ? (total / (mMax + fMax)) * 100 : 0;
  };

  const gradeACount = filteredGrades.filter((g) => getSubjectPercent(g) >= 80).length;
  const passedCount = filteredGrades.filter((g) => getSubjectPercent(g) >= 50).length;
  const needsImprovementCount = filteredGrades.filter((g) => getSubjectPercent(g) < 50).length;
  const sortedTodaySchedule = [...myScheduleToday].sort((a, b) => Number(a.period_no) - Number(b.period_no));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Student Hero Card ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/8 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-emerald-500/8 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-primary/12 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <span className="text-2xl sm:text-3xl font-extrabold">
                {studentName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                พอร์ทัลนักเรียน
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-tight truncate">
                {studentName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground border border-border">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  {studentCode}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground border border-border">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  ห้อง {classroomName || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("grades")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95 transition-opacity shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              ดูผลการเรียน
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              ตารางเรียน
            </button>
          </div>
        </div>
      </section>

      {/* ── Grade Summary Section ── */}
      {isGradeReleased ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold text-foreground text-base">สรุปผลการเรียน</h3>
              <p className="text-xs text-muted-foreground mt-0.5">ภาพรวมคะแนนและเกรดเฉลี่ยประจำภาคเรียน</p>
            </div>
            <select
              aria-label="เลือกภาคเรียน"
              className="ui-input !w-auto !py-2 !text-sm font-semibold text-foreground"
              value={activeSettingId || ""}
              onChange={(e) => {
                const s = settingsList.find((x: any) => String(x.id) === e.target.value);
                if (s) onChangeSetting(s);
              }}
            >
              {settingsList.map((s) => (
                <option key={s.id} value={s.id}>
                  ปี {s.academic_year} เทอม {s.term}{s.is_active ? " · ปัจจุบัน" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            {/* GPA Card */}
            <div className="ui-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary/70" />
              <div className={`w-22 h-22 rounded-full border-4 ${gpaRingColor} flex items-center justify-center mb-3 bg-muted/50`}>
                <span className={`text-2xl font-extrabold ${gpaColor}`}>
                  {gpaValue}
                </span>
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                เกรดเฉลี่ย (GPA)
              </div>
              <div className="text-xs text-subtle-foreground mt-1">
                {gpaCredits} หน่วยกิต
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="ui-card-interactive p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-medium text-subtle-foreground">เทอมนี้</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {filteredGrades.length}
                </div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">วิชาที่มีคะแนน</div>
              </div>

              <div className="ui-card-interactive p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Star className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-medium text-subtle-foreground">≥ 80%</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {gradeACount}
                </div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">วิชาที่ได้เกรด A</div>
              </div>

              <div className="ui-card-interactive p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CircleCheck className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-medium text-subtle-foreground">≥ 50%</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {passedCount}
                </div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">ผ่านเกณฑ์ทั้งหมด</div>
              </div>

              <div className="ui-card-interactive p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-medium text-subtle-foreground">&lt; 50%</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                  {needsImprovementCount}
                </div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">ต้องปรับปรุง</div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="ui-card p-6 sm:p-8 text-center border-amber-500/25 bg-amber-500/5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">ผลการเรียนเทอมนี้ยังไม่เปิดเผย</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            สามารถตรวจสอบกำหนดการเปิดประกาศผลได้ที่แท็บผลการเรียน
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("grades")}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-card border border-border text-foreground hover:bg-muted transition-colors"
          >
            ไปที่ผลการเรียน
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* ── Today's Schedule Timeline ── */}
      <section className="ui-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarDays className="w-4.5 h-4.5" />
            </span>
            <div>
              <h3 className="font-bold text-foreground text-sm">ตารางเรียนวันนี้</h3>
              <p className="text-[11px] text-muted-foreground">เรียงตามเวลาเรียน</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity shrink-0"
          >
            <span>ดูตารางทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {sortedTodaySchedule.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">วันนี้ไม่มีคาบเรียน</p>
            <p className="text-xs text-muted-foreground mt-1">
              ตรวจสอบตารางเรียนประจำสัปดาห์ได้ที่เมนูตารางเรียน
            </p>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-5">
            <div className="relative space-y-1">
              <div className="absolute left-[3.55rem] top-5 bottom-5 w-px bg-border" />
              {sortedTodaySchedule.map((entry) => {
                const teacher = entry.teacher_name || (entry.teacher_names?.length ? entry.teacher_names.join(", ") : null);
                return (
                  <div key={entry.id} className="relative grid grid-cols-[3.25rem_1fr] gap-3 sm:gap-4 py-2 group">
                    <div className="pt-2 text-right">
                      <div className="text-xs font-bold text-foreground">{entry.start_time}</div>
                      <div className="text-[10px] text-subtle-foreground">{entry.end_time}</div>
                    </div>
                    <div className="relative pl-4">
                      <span className="absolute -left-[0.3rem] top-4 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card group-hover:scale-125 transition-transform" />
                      <div className="rounded-xl border border-border bg-muted/35 px-4 py-3 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{entry.subject_name}</p>
                            {teacher && <p className="text-xs text-muted-foreground mt-1">อ.{teacher}</p>}
                          </div>
                          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                            <Clock3 className="w-3 h-3" />
                            คาบ {entry.period_no}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
