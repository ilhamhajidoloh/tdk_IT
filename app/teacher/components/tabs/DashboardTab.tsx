"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  Home,
  ClipboardCheck,
  Clock,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  XCircle,
  GraduationCap,
} from "lucide-react";
import {
  type DBStudent,
  type DBSubject,
  type DBGrade,
  type DBClassroom,
  type ScheduleEntry,
  type Tab,
} from "../types";
import { formatThaiDate, formatThaiDateRange } from "../../../lib/format";

interface DashboardTabProps {
  teacherName: string;
  homeroomClass: DBClassroom | null;
  homeroomStudents: DBStudent[];
  mySubjects: DBSubject[];
  students: DBStudent[];
  classrooms: DBClassroom[];
  grades: DBGrade[];
  term: string;
  isGradingActive: boolean;
  settingsStartDate: string;
  settingsEndDate: string;
  myScheduleEntries: ScheduleEntry[];
  setActiveTab: (tab: Tab) => void;
  setEnterSubject: (subjName: string) => void;
  setEnterClassroom: (classId: string) => void;
  setEvaluateSubjectId: (subjId: string) => void;
  setEvaluateClassroomId: (classId: string) => void;
  setAttendanceSubjectId: (subjId: string) => void;
  setAttendanceClassroomId: (classId: string) => void;
}

export default function DashboardTab({
  teacherName,
  homeroomClass,
  homeroomStudents,
  mySubjects,
  students,
  classrooms,
  grades,
  term,
  isGradingActive,
  settingsStartDate,
  settingsEndDate,
  myScheduleEntries,
  setActiveTab,
  setEnterSubject,
  setEnterClassroom,
  setEvaluateSubjectId,
  setEvaluateClassroomId,
  setAttendanceSubjectId,
  setAttendanceClassroomId,
}: DashboardTabProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  } | null>(null);

  useEffect(() => {
    if (!settingsEndDate) return;

    const calculateTimeLeft = () => {
      const datePart = settingsEndDate.split("T")[0];
      const parts = datePart.split("-");
      let targetDate: Date;
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        targetDate = new Date(year, month, day, 23, 59, 59);
      } else {
        targetDate = new Date(settingsEndDate);
      }

      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false,
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [settingsEndDate]);

  const taughtClassrooms = classrooms.filter((c) =>
    mySubjects.some((s) => s.classroom_ids?.includes(c.id))
  );

  const taughtStudentCount = students.filter((st) =>
    mySubjects.some((s) => s.classroom_ids?.includes(st.classroom_id ?? ""))
  ).length;

  let totalExpectedGrades = 0;
  let enteredGradesCount = 0;

  mySubjects.forEach((s) => {
    const classIds = s.classroom_ids || [];
    classIds.forEach((cid) => {
      const classStudents = students.filter((st) => st.classroom_id === cid);
      totalExpectedGrades += classStudents.length;
      classStudents.forEach((st) => {
        const hasGrade = grades.some(
          (g) =>
            g.student_id === st.student_id &&
            g.subject.trim().toLowerCase() === s.name.trim().toLowerCase() &&
            g.term === term
        );
        if (hasGrade) enteredGradesCount++;
      });
    });
  });

  const gradingProgressPct =
    totalExpectedGrades > 0 ? (enteredGradesCount / totalExpectedGrades) * 100 : 0;

  const todayDayNum = new Date().getDay();
  const todaySchedule = myScheduleEntries
    .filter((entry) => Number(entry.day_of_week) === todayDayNum)
    .sort((a, b) => Number(a.period_no) - Number(b.period_no));

  const thaiDayNames = [
    "อาทิตย์",
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
  ];
  const todayThaiName = thaiDayNames[todayDayNum];

  const formattedTodayDate = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleQuickGradesAction = (subjectName: string, classroomId: string) => {
    setEnterSubject(subjectName);
    setEnterClassroom(classroomId);
    setActiveTab("enter");
  };

  const handleQuickAttendanceAction = (subjectId: string, classroomId: string) => {
    setAttendanceSubjectId(subjectId);
    setAttendanceClassroomId(classroomId);
    setActiveTab("attendance");
  };

  const handleQuickEvaluateAction = (subjectId: string, classroomId: string) => {
    setEvaluateSubjectId(subjectId);
    setEvaluateClassroomId(classroomId);
    setActiveTab("evaluate");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/8 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-sky-500/8 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                <GraduationCap className="w-3.5 h-3.5" />
                พอร์ทัลคุณครู
              </span>
              <span className="text-xs font-medium text-muted-foreground">เทอม {term}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              สวัสดีคุณครู <span className="text-primary">{teacherName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ยินดีต้อนรับสู่ระบบจัดการวิชาการและคะแนนนักเรียน · วัน{todayThaiName}ที่ {formattedTodayDate}
            </p>
          </div>

          <div
            className={`shrink-0 rounded-xl border p-3.5 sm:p-4 max-w-sm flex items-start gap-3 ${
              isGradingActive
                ? "bg-emerald-500/8 border-emerald-500/25"
                : "bg-rose-500/8 border-rose-500/25"
            }`}
          >
            {isGradingActive ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">
                {isGradingActive ? "ระบบกำลังเปิดรับคะแนน" : "ปิดรับการบันทึกคะแนน"}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">
                ช่วงเวลากรอก: {formatThaiDateRange(settingsStartDate, settingsEndDate)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      {settingsEndDate && (
        <section className="ui-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">
                เวลานับถอยหลังก่อนจบภาคเรียน
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                สิ้นสุดภาคเรียน ณ วันที่ {formatThaiDate(settingsEndDate)}
              </p>
            </div>
          </div>

          {timeLeft ? (
            !timeLeft.isOver ? (
              <div className="flex items-center gap-2 sm:gap-3 font-mono select-none">
                {[
                  { val: String(timeLeft.days), label: "วัน" },
                  { val: String(timeLeft.hours).padStart(2, "0"), label: "ชั่วโมง" },
                  { val: String(timeLeft.minutes).padStart(2, "0"), label: "นาที" },
                  { val: String(timeLeft.seconds).padStart(2, "0"), label: "วินาที", accent: true },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-2 sm:gap-3">
                    {i > 0 && <span className="text-lg font-bold text-muted-foreground/40 -mt-4">:</span>}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-13 sm:w-15 h-13 sm:h-15 rounded-xl bg-muted/60 border flex items-center justify-center ${
                          item.accent ? "border-primary/35" : "border-border"
                        }`}
                      >
                        <span
                          className={`text-lg sm:text-xl font-extrabold ${
                            item.accent ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {item.val}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground mt-1">
                        {item.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm border border-rose-500/20">
                สิ้นสุดภาคเรียนนี้แล้ว
              </div>
            )
          ) : (
            <div className="h-14 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </section>
      )}

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ui-card-interactive p-5 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">วิชาที่รับผิดชอบ</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {mySubjects.length} วิชา
            </div>
            <p className="text-xs text-muted-foreground">ใน {taughtClassrooms.length} ห้องเรียน</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="ui-card-interactive p-5 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">จำนวนนักเรียนที่สอน</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {taughtStudentCount} คน
            </div>
            <p className="text-xs text-muted-foreground">จากห้องเรียนที่ได้รับมอบหมาย</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => homeroomClass && setActiveTab("homeroom")}
          disabled={!homeroomClass}
          className={`ui-card-interactive p-5 flex items-center justify-between gap-3 text-left ${
            homeroomClass ? "cursor-pointer" : "opacity-75 cursor-default"
          }`}
        >
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-muted-foreground">ห้องประจำชั้น</span>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground truncate">
              {homeroomClass ? homeroomClass.name : "ไม่มี"}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {homeroomClass ? `${homeroomStudents.length} นักเรียนในชั้น` : "ไม่ได้เป็นครูประจำชั้น"}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("enter")}
          className="ui-card-interactive p-5 flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="space-y-1.5 flex-1 min-w-0">
            <span className="text-xs font-semibold text-muted-foreground">ความคืบหน้าการกรอกคะแนน</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {gradingProgressPct.toFixed(1)}%
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${gradingProgressPct}%` }}
              />
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Main Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (1/3) */}
        <div className="lg:col-span-1 space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-primary" />
              คาบสอนวันนี้
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className="text-xs font-semibold text-primary hover:opacity-80 cursor-pointer border-0 bg-transparent"
            >
              ดูตารางทั้งหมด →
            </button>
          </div>

          <div className="ui-card flex-1 p-5 space-y-4 overflow-y-auto max-h-[460px]">
            {todaySchedule.length === 0 ? (
              <div className="text-center py-10 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-foreground">ไม่มีชั่วโมงสอนวันนี้</div>
                <p className="text-xs text-muted-foreground">
                  พักผ่อนหรือจัดการเอกสารคะแนนอย่างสบายใจ
                </p>
              </div>
            ) : (
              <div className="relative border-l border-border pl-4 space-y-4 py-1">
                {todaySchedule.map((entry, idx) => {
                  const subjectObj = mySubjects.find((s) => s.id === entry.subject_id);
                  return (
                    <div key={entry.id || idx} className="relative group">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card group-hover:scale-125 transition-transform" />

                      <div className="bg-muted/40 hover:bg-muted/70 p-3.5 rounded-xl border border-border transition-colors space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                            คาบที่ {entry.period_no}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {entry.start_time} – {entry.end_time} น.
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">{entry.subject_name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            ห้องเรียน: {entry.classroom_name}
                          </div>
                        </div>

                        {subjectObj && (
                          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickGradesAction(entry.subject_name, entry.classroom_id)
                              }
                              className="text-xs font-semibold text-primary hover:opacity-80 border-0 bg-transparent cursor-pointer"
                            >
                              กรอกคะแนน
                            </button>
                            <span className="text-xs text-muted-foreground/40">·</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickAttendanceAction(entry.subject_id, entry.classroom_id)
                              }
                              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:opacity-80 border-0 bg-transparent cursor-pointer"
                            >
                              เช็คชื่อ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Subjects & Action Shortcuts (2/3) */}
        <div className="lg:col-span-2 space-y-3 flex flex-col">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-4.5 h-4.5 text-primary" />
            รายวิชาและห้องเรียนที่ดูแล
          </h2>

          <div className="flex-1 space-y-4">
            {mySubjects.length === 0 ? (
              <div className="ui-card py-12 text-center text-sm text-muted-foreground font-medium">
                ยังไม่มีวิชาที่คุณสอนถูกกำหนดให้มีการเก็บคะแนนในภาคเรียนนี้
              </div>
            ) : (
              mySubjects.map((subj) => {
                const subjectClassroomIds = subj.classroom_ids || [];
                const subjectClassrooms = classrooms.filter((c) =>
                  subjectClassroomIds.includes(c.id)
                );

                return (
                  <div key={subj.id} className="ui-card overflow-hidden">
                    <div className="px-5 py-3.5 bg-muted/40 border-b border-border flex justify-between items-center gap-3">
                      <div className="font-bold text-foreground text-sm flex items-center gap-2 flex-wrap">
                        <span>{subj.name}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {subj.subject_type === "activity"
                            ? "วิชากิจกรรม"
                            : `${Number(subj.credit_hours) || 1} หน่วยกิต`}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium shrink-0">
                        สอนใน {subjectClassrooms.length} ห้อง
                      </span>
                    </div>

                    <div className="divide-y divide-border">
                      {subjectClassrooms.map((c) => {
                        const classStudents = students.filter((st) => st.classroom_id === c.id);
                        const totalCount = classStudents.length;
                        const subjectGrades = classStudents.map((st) =>
                          grades.find(
                            (g) =>
                              g.student_id === st.student_id &&
                              g.subject.trim().toLowerCase() === subj.name.trim().toLowerCase() &&
                              g.term === term
                          )
                        );
                        const midtermCount = subjectGrades.filter((g) => g?.midterm_score != null).length;
                        const finalCount = subjectGrades.filter((g) => g?.final_score != null).length;
                        const requiresFinal = !(
                          subj.subject_type === "activity" && subj.score_display_mode === "combined"
                        );
                        const gradedCount = subjectGrades.filter(
                          (g) => g?.midterm_score != null && (!requiresFinal || g.final_score != null)
                        ).length;

                        const pct = totalCount > 0 ? (gradedCount / totalCount) * 100 : 0;
                        const isDone = gradedCount > 0 && gradedCount === totalCount;

                        return (
                          <div
                            key={c.id}
                            className="px-5 py-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground">
                                  ชั้น {c.name}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                    isDone
                                      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  กรอกแล้ว {gradedCount}/{totalCount} คน ·{" "}
                                  {requiresFinal
                                    ? `เก็บ ${midtermCount}/${totalCount} | สอบ ${finalCount}/${totalCount}`
                                    : `รวม ${midtermCount}/${totalCount}`}{" "}
                                  ({pct.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isDone ? "bg-emerald-500" : "bg-primary"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end shrink-0">
                              <button
                                type="button"
                                onClick={() => handleQuickGradesAction(subj.name, c.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/15 text-primary border-0 transition-colors"
                              >
                                บันทึกคะแนน
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAttendanceAction(subj.id, c.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 transition-colors"
                              >
                                เช็คชื่อ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickEvaluateAction(subj.id, c.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-0 transition-colors"
                              >
                                ประเมินคุณลักษณะ
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
