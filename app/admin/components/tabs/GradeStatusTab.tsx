"use client";

import { useState, useMemo } from "react";
import {
  RefreshCw,
  LayoutGrid,
  List,
  Search,
  X,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
} from "lucide-react";
import { type SystemSetting, type GradeStatusRow } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import PaginationBar, { usePagination } from "../PaginationBar";

interface GradeStatusTabProps {
  settingsList: SystemSetting[];
  gradeStatusSettingId: number | null;
  handleSelectGradeStatusSetting: (id: number) => void;
  gradeStatusLoading: boolean;
  gradeStatusData: GradeStatusRow[];
  gradeStatusSubTab: "summary" | "detail";
  setGradeStatusSubTab: (subTab: "summary" | "detail") => void;
  selectedGradeStatusSubject: string;
  setSelectedGradeStatusSubject: (subjectId: string) => void;
  openStudentDetail: (row: GradeStatusRow) => void;
  token: string | null;
  loadGradeStatus: (settingId: number, token: string) => void;
}

type StatusFilter = "all" | "completed" | "in_progress" | "not_started";
type DetailFilter = "all" | "incomplete" | "completed";

function StatusPill({ status }: { status: "completed" | "in_progress" | "not_started" }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/25 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        ครบแล้ว
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        กำลังกรอก
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      ยังไม่เริ่ม
    </span>
  );
}

function ProgressCell({ entered, total }: { entered: number; total: number }) {
  const pct = total > 0 ? Math.round((entered / total) * 100) : 0;
  const barColor =
    pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-border";
  const textColor =
    pct >= 100
      ? "text-emerald-600 dark:text-emerald-400"
      : pct > 0
      ? "text-amber-600 dark:text-amber-400"
      : "text-subtle-foreground";

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-14 bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums min-w-[3.25rem] text-left ${textColor}`}>
        {entered}/{total}
      </span>
    </div>
  );
}

export default function GradeStatusTab({
  settingsList,
  gradeStatusSettingId,
  handleSelectGradeStatusSetting,
  gradeStatusLoading,
  gradeStatusData,
  gradeStatusSubTab,
  setGradeStatusSubTab,
  selectedGradeStatusSubject,
  setSelectedGradeStatusSubject,
  openStudentDetail,
  token,
  loadGradeStatus,
}: GradeStatusTabProps) {
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<StatusFilter>("all");
  const [detailFilter, setDetailFilter] = useState<DetailFilter>("all");
  const [expandedTeachers, setExpandedTeachers] = useState<Record<string, boolean>>({});

  const subjectList = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; type: string; creditHours: number | null; isCombined: boolean }
    >();
    for (const row of gradeStatusData) {
      if (!map.has(row.subject_id)) {
        map.set(row.subject_id, {
          id: row.subject_id,
          name: row.subject_name || row.subject_id,
          type: row.subject_type,
          creditHours: row.credit_hours,
          isCombined: row.subject_type === "activity" && row.score_display_mode === "combined",
        });
      }
    }
    return Array.from(map.values());
  }, [gradeStatusData]);

  const subjectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjectList) map.set(s.id, s.name);
    return map;
  }, [subjectList]);

  const teacherSummaries = useMemo(() => {
    const teacherMap = new Map<
      string,
      {
        id: string;
        name: string;
        subjects: Map<
          string,
          { total: number; midterm: number; final: number; requiresFinal: boolean }
        >;
      }
    >();

    for (const row of gradeStatusData) {
      const tid = row.teacher_id || "__none__";
      if (tid === "__none__") continue;
      const tname = row.teacher_name || "ไม่มีครูผู้สอน";
      if (!teacherMap.has(tid)) {
        teacherMap.set(tid, { id: tid, name: tname, subjects: new Map() });
      }
      const teacher = teacherMap.get(tid)!;
      const rowRequiresFinal = !(
        row.subject_type === "activity" && row.score_display_mode === "combined"
      );
      if (!teacher.subjects.has(row.subject_id)) {
        teacher.subjects.set(row.subject_id, {
          total: 0,
          midterm: 0,
          final: 0,
          requiresFinal: rowRequiresFinal,
        });
      }
      const subj = teacher.subjects.get(row.subject_id)!;
      subj.total += Number(row.total_students);
      subj.midterm += Number(row.midterm_entered);
      subj.final += Number(row.final_entered);
      subj.requiresFinal = subj.requiresFinal || rowRequiresFinal;
    }

    return Array.from(teacherMap.values()).map((t) => {
      const subs = Array.from(t.subjects.entries()).map(([sid, s]) => ({
        id: sid,
        name: subjectNameMap.get(sid) || sid,
        ...s,
      }));
      const expected = subs.reduce(
        (acc, s) => acc + (s.requiresFinal ? s.total * 2 : s.total),
        0
      );
      const entered = subs.reduce(
        (acc, s) =>
          acc + (s.requiresFinal ? Math.min(s.midterm, s.total) + Math.min(s.final, s.total) : Math.min(s.midterm, s.total)),
        0
      );
      const overallPct = expected > 0 ? Math.round((entered / expected) * 100) : 0;
      const allDone =
        subs.length > 0 &&
        subs.every(
          (s) => s.total > 0 && s.midterm >= s.total && (!s.requiresFinal || s.final >= s.total)
        );
      const hasAny = subs.some((s) => s.midterm > 0 || (s.requiresFinal && s.final > 0));
      const status: "completed" | "in_progress" | "not_started" = allDone
        ? "completed"
        : hasAny
        ? "in_progress"
        : "not_started";

      return {
        id: t.id,
        name: t.name,
        subjects: subs,
        overallPct,
        status,
      };
    });
  }, [gradeStatusData, subjectNameMap]);

  const summaryCounts = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    for (const t of teacherSummaries) {
      if (t.status === "completed") completed++;
      else if (t.status === "in_progress") inProgress++;
      else notStarted++;
    }
    return {
      total: teacherSummaries.length,
      completed,
      inProgress,
      notStarted,
    };
  }, [teacherSummaries]);

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teacherSummaries.filter((t) => {
      if (teacherStatusFilter !== "all" && t.status !== teacherStatusFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.name.toLowerCase().includes(q))
      );
    });
  }, [teacherSummaries, teacherSearch, teacherStatusFilter]);

  const activeSubjectInfo = useMemo(
    () => subjectList.find((s) => s.id === selectedGradeStatusSubject),
    [subjectList, selectedGradeStatusSubject]
  );

  const detailRows = useMemo(() => {
    const rows = gradeStatusData.filter(
      (row) => row.subject_id === selectedGradeStatusSubject
    );
    return rows.map((row) => {
      const total = Number(row.total_students);
      const mid = Number(row.midterm_entered);
      const fin = Number(row.final_entered);
      const isCombined =
        row.subject_type === "activity" && row.score_display_mode === "combined";
      const isDone = total > 0 && mid >= total && (isCombined || fin >= total);
      const hasAny = mid > 0 || (!isCombined && fin > 0);
      const status: "completed" | "in_progress" | "not_started" = isDone
        ? "completed"
        : hasAny
        ? "in_progress"
        : "not_started";
      return { row, total, mid, fin, isCombined, isDone, status };
    });
  }, [gradeStatusData, selectedGradeStatusSubject]);

  const filteredDetailRows = useMemo(() => {
    if (detailFilter === "completed") return detailRows.filter((r) => r.isDone);
    if (detailFilter === "incomplete") return detailRows.filter((r) => !r.isDone);
    return detailRows;
  }, [detailRows, detailFilter]);

  const detailCompletedCount = useMemo(
    () => detailRows.filter((r) => r.isDone).length,
    [detailRows]
  );

  const teacherPagination = usePagination(filteredTeachers, 6);
  const detailPagination = usePagination(filteredDetailRows, 5);

  const handleJumpToSubjectDetail = (subjectId: string) => {
    setSelectedGradeStatusSubject(subjectId);
    setDetailFilter("all");
    setGradeStatusSubTab("detail");
  };

  return (
    <div className="p-6 md:p-8 animate-fade-in-up">
      <SectionHeader
        icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        color="amber"
        title="สถานะการกรอกคะแนน"
        subtitle="ติดตามความคืบหน้าการกรอกคะแนนของครูผู้สอนและแต่ละรายวิชา"
      >
        <button
          type="button"
          onClick={() => {
            if (gradeStatusSettingId && token) loadGradeStatus(gradeStatusSettingId, token);
          }}
          disabled={!gradeStatusSettingId || gradeStatusLoading}
          className="bg-card border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${gradeStatusLoading ? "animate-spin" : ""}`} />
          <span>รีเฟรช</span>
        </button>
      </SectionHeader>

      <TermSelector
        settingsList={settingsList}
        selectedId={gradeStatusSettingId}
        onSelect={(id) => {
          setTeacherSearch("");
          setTeacherStatusFilter("all");
          setDetailFilter("all");
          handleSelectGradeStatusSetting(id);
        }}
      />

      {!gradeStatusSettingId ? (
        <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : gradeStatusLoading ? (
        <div className="text-center py-14">
          <div className="inline-block w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground font-semibold text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {/* Sub-tabs: Summary / Detail */}
          <div className="inline-flex w-full sm:w-auto gap-1 mb-5 p-1 bg-muted rounded-xl border border-border">
            <button
              type="button"
              onClick={() => {
                setGradeStatusSubTab("summary");
                setSelectedGradeStatusSubject("");
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border-0 ${
                gradeStatusSubTab === "summary"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <LayoutGrid
                className={`w-4 h-4 ${
                  gradeStatusSubTab === "summary" ? "text-indigo-600 dark:text-indigo-400" : ""
                }`}
              />
              <span>สรุปตามครูผู้สอน</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGradeStatusSubTab("detail");
                if (!selectedGradeStatusSubject && subjectList[0]) {
                  setSelectedGradeStatusSubject(subjectList[0].id);
                }
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border-0 ${
                gradeStatusSubTab === "detail"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <List
                className={`w-4 h-4 ${
                  gradeStatusSubTab === "detail" ? "text-indigo-600 dark:text-indigo-400" : ""
                }`}
              />
              <span>รายละเอียดรายวิชา</span>
            </button>
          </div>

          {/* ===== SUMMARY SUB-TAB ===== */}
          {gradeStatusSubTab === "summary" && (
            <div className="space-y-4">
              {/* Clickable Compact Summary KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(
                  [
                    {
                      key: "all" as const,
                      label: "ครูผู้สอนทั้งหมด",
                      value: summaryCounts.total,
                      sub: undefined,
                      icon: Users,
                      iconClass: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
                    },
                    {
                      key: "completed" as const,
                      label: "กรอกครบแล้ว",
                      value: summaryCounts.completed,
                      sub:
                        summaryCounts.total > 0
                          ? `${Math.round((summaryCounts.completed / summaryCounts.total) * 100)}%`
                          : "0%",
                      icon: CheckCircle2,
                      iconClass:
                        "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                    },
                    {
                      key: "in_progress" as const,
                      label: "กำลังกรอก",
                      value: summaryCounts.inProgress,
                      sub: undefined,
                      icon: Clock,
                      iconClass:
                        "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
                    },
                    {
                      key: "not_started" as const,
                      label: "ยังไม่เริ่ม",
                      value: summaryCounts.notStarted,
                      sub: undefined,
                      icon: AlertCircle,
                      iconClass: "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400",
                    },
                  ]
                ).map((item) => {
                  const Icon = item.icon;
                  const active = teacherStatusFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setTeacherStatusFilter(
                          active && item.key !== "all" ? "all" : item.key
                        )
                      }
                      className={`text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                        active
                          ? "bg-card border-indigo-400 dark:border-indigo-500/60 ring-2 ring-indigo-500/15 shadow-sm"
                          : "bg-card border-border hover:border-indigo-300/60"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconClass}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-muted-foreground truncate">
                          {item.label}
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-xl font-extrabold text-foreground tabular-nums">
                            {item.value}
                          </span>
                          {item.sub && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {item.sub}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Search Toolbar */}
              {teacherSummaries.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="ค้นหาชื่อครู หรือชื่อวิชา..."
                      className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                    />
                    {teacherSearch && (
                      <button
                        type="button"
                        onClick={() => setTeacherSearch("")}
                        aria-label="ล้างคำค้นหา"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {(teacherSearch || teacherStatusFilter !== "all") && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold">
                        แสดง {filteredTeachers.length} / {teacherSummaries.length} คน
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherSearch("");
                          setTeacherStatusFilter("all");
                        }}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        ล้างตัวกรอง
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Teacher Cards */}
              {teacherSummaries.length === 0 ? (
                <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
                  ไม่มีข้อมูลครูผู้สอนในเทอมนี้
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-card rounded-2xl border border-border text-sm font-semibold">
                  ไม่พบครูผู้สอนที่ตรงกับเงื่อนไข
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacherPagination.paginatedItems.map((teacher) => {
                    const isExpanded = Boolean(expandedTeachers[teacher.id]);
                    const visibleSubjects = isExpanded
                      ? teacher.subjects
                      : teacher.subjects.slice(0, 3);
                    const hiddenCount = teacher.subjects.length - visibleSubjects.length;

                    return (
                      <div
                        key={teacher.id}
                        className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between transition-all hover:border-indigo-300/60 dark:hover:border-indigo-500/40"
                      >
                        <div>
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2.5 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                                {teacher.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-foreground truncate">
                                  {teacher.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {teacher.subjects.length} วิชา
                                </div>
                              </div>
                            </div>
                            <StatusPill status={teacher.status} />
                          </div>

                          {/* Overall Progress */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">ความคืบหน้ารวม</span>
                              <span className="font-bold text-foreground tabular-nums">
                                {teacher.overallPct}%
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  teacher.status === "completed"
                                    ? "bg-emerald-500"
                                    : teacher.overallPct > 0
                                    ? "bg-amber-500"
                                    : "bg-border"
                                }`}
                                style={{ width: `${Math.min(teacher.overallPct, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Compact Subject Rows */}
                          <div className="divide-y divide-border/60 border-t border-border/60">
                            {visibleSubjects.map((s) => {
                              const midDone = s.total > 0 && s.midterm >= s.total;
                              const finDone = s.total > 0 && s.final >= s.total;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => handleJumpToSubjectDetail(s.id)}
                                  className="w-full py-2 flex items-center justify-between gap-3 text-left hover:bg-muted/40 -mx-1 px-1 rounded-lg transition-colors cursor-pointer border-0 bg-transparent group"
                                >
                                  <span className="text-xs font-semibold text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {s.name}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0 text-[11px] tabular-nums">
                                    {s.requiresFinal ? (
                                      <>
                                        <span
                                          className={`font-semibold ${
                                            midDone
                                              ? "text-emerald-600 dark:text-emerald-400"
                                              : s.midterm > 0
                                              ? "text-amber-600 dark:text-amber-400"
                                              : "text-subtle-foreground"
                                          }`}
                                        >
                                          เก็บ {s.midterm}/{s.total}
                                        </span>
                                        <span className="text-border">·</span>
                                        <span
                                          className={`font-semibold ${
                                            finDone
                                              ? "text-emerald-600 dark:text-emerald-400"
                                              : s.final > 0
                                              ? "text-amber-600 dark:text-amber-400"
                                              : "text-subtle-foreground"
                                          }`}
                                        >
                                          สอบ {s.final}/{s.total}
                                        </span>
                                      </>
                                    ) : (
                                      <span
                                        className={`font-semibold ${
                                          midDone
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : s.midterm > 0
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-subtle-foreground"
                                        }`}
                                      >
                                        รวม {s.midterm}/{s.total}
                                      </span>
                                    )}
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-indigo-500" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {teacher.subjects.length > 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTeachers((prev) => ({
                                ...prev,
                                [teacher.id]: !prev[teacher.id],
                              }))
                            }
                            className="mt-2 pt-2 border-t border-border/60 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline text-center cursor-pointer border-x-0 border-b-0 bg-transparent"
                          >
                            {isExpanded ? "ย่อรายการวิชา" : `ดูเพิ่มอีก ${hiddenCount} วิชา`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <PaginationBar
                  totalItems={teacherPagination.totalItems}
                  currentPage={teacherPagination.currentPage}
                  totalPages={teacherPagination.totalPages}
                  perPage={teacherPagination.perPage}
                  onPageChange={teacherPagination.setCurrentPage}
                  onPerPageChange={teacherPagination.setPerPage}
                  unitLabel="คน"
                />
                </>
              )}
            </div>
          )}

          {/* ===== DETAIL SUB-TAB ===== */}
          {gradeStatusSubTab === "detail" && (
            <div className="space-y-4">
              {gradeStatusData.length === 0 ? (
                <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
                  ไม่มีข้อมูลในเทอมนี้
                </div>
              ) : (
                <>
                  {/* Detail Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                      <div className="relative w-full sm:w-64">
                        <BookOpen className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          aria-label="เลือกวิชา"
                          value={selectedGradeStatusSubject}
                          onChange={(e) => {
                            setSelectedGradeStatusSubject(e.target.value);
                            setDetailFilter("all");
                          }}
                          className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all cursor-pointer appearance-none"
                        >
                          {subjectList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {activeSubjectInfo && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                          {activeSubjectInfo.type === "activity"
                            ? activeSubjectInfo.isCombined
                              ? "กิจกรรม · คะแนนรวม"
                              : "วิชากิจกรรม"
                            : `วิชาหลัก · ${activeSubjectInfo.creditHours || 1} นก.`}
                        </span>
                      )}

                      <div className="inline-flex items-center p-1 rounded-xl bg-muted border border-border">
                        {(
                          [
                            { key: "all", label: "ทั้งหมด", count: detailRows.length },
                            {
                              key: "incomplete",
                              label: "ยังไม่ครบ",
                              count: detailRows.length - detailCompletedCount,
                            },
                            { key: "completed", label: "ครบแล้ว", count: detailCompletedCount },
                          ] as const
                        ).map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setDetailFilter(item.key)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border-0 ${
                              detailFilter === item.key
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground bg-transparent"
                            }`}
                          >
                            {item.label} <span className="opacity-70">{item.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <span className="text-xs text-subtle-foreground">
                      คลิกแถวเพื่อดูรายชื่อนักเรียน
                    </span>
                  </div>

                  {filteredDetailRows.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-card rounded-2xl border border-border text-sm font-semibold">
                      ไม่มีรายการในกลุ่มนี้
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                              <th className="py-3 px-4">ชั้นเรียน</th>
                              <th className="py-3 px-4">ครูผู้สอน</th>
                              <th className="py-3 px-4 text-center w-36">
                                {activeSubjectInfo?.isCombined ? "คะแนนรวม" : "คะแนนเก็บ"}
                              </th>
                              {!activeSubjectInfo?.isCombined && (
                                <th className="py-3 px-4 text-center w-36">คะแนนสอบ</th>
                              )}
                              <th className="py-3 px-4 text-center w-32">สถานะ</th>
                              <th className="py-3 pr-4 w-8" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {detailPagination.paginatedItems.map(
                              ({ row, total, mid, fin, isCombined, status }, i) => (
                                <tr
                                  key={`${row.subject_id}-${row.classroom_id ?? i}-${row.teacher_id ?? i}`}
                                  onClick={() => openStudentDetail(row)}
                                  className="hover:bg-muted/50 cursor-pointer transition-colors group"
                                >
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-sm text-foreground">
                                      {row.classroom_name || "—"}
                                    </div>
                                    {row.classroom_name_thai &&
                                      row.classroom_name_thai !== row.classroom_name && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                          {row.classroom_name_thai}
                                        </div>
                                      )}
                                  </td>
                                  <td className="py-3.5 px-4 text-sm">
                                    {row.teacher_name ? (
                                      <span className="font-medium text-foreground">
                                        {row.teacher_name}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-subtle-foreground">ไม่ระบุ</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <ProgressCell entered={mid} total={total} />
                                  </td>
                                  {!activeSubjectInfo?.isCombined && (
                                    <td className="py-3.5 px-4 text-center">
                                      {isCombined ? (
                                        <span className="text-xs text-subtle-foreground">—</span>
                                      ) : (
                                        <ProgressCell entered={fin} total={total} />
                                      )}
                                    </td>
                                  )}
                                  <td className="py-3.5 px-4 text-center">
                                    <StatusPill status={status} />
                                  </td>
                                  <td className="py-3.5 pr-4 text-right">
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-indigo-500 transition-colors inline-block" />
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-2.5">
                        {detailPagination.paginatedItems.map(
                          ({ row, total, mid, fin, isCombined, status }, i) => {
                            const midPct = total > 0 ? Math.round((mid / total) * 100) : 0;
                            const finPct = total > 0 ? Math.round((fin / total) * 100) : 0;
                            return (
                              <div
                                key={`${row.subject_id}-${row.classroom_id ?? i}-${row.teacher_id ?? i}`}
                                onClick={() => openStudentDetail(row)}
                                className="bg-card rounded-2xl border border-border p-3.5 space-y-3 cursor-pointer hover:border-indigo-300/70 transition-all active:scale-[0.99]"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="font-bold text-sm text-foreground truncate">
                                      {row.classroom_name || "—"}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                      <User className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                      <span className="truncate">
                                        {row.teacher_name || "ไม่ระบุครูผู้สอน"}
                                      </span>
                                    </div>
                                  </div>
                                  <StatusPill status={status} />
                                </div>

                                <div
                                  className={`grid gap-3 text-xs ${
                                    isCombined ? "grid-cols-1" : "grid-cols-2"
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between text-[11px] mb-1">
                                      <span className="text-muted-foreground">
                                        {isCombined ? "คะแนนรวม" : "คะแนนเก็บ"}
                                      </span>
                                      <span className="font-bold text-foreground tabular-nums">
                                        {mid}/{total}
                                      </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          midPct >= 100
                                            ? "bg-emerald-500"
                                            : midPct > 0
                                            ? "bg-amber-500"
                                            : "bg-border"
                                        }`}
                                        style={{ width: `${Math.min(midPct, 100)}%` }}
                                      />
                                    </div>
                                  </div>

                                  {!isCombined && (
                                    <div>
                                      <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-muted-foreground">คะแนนสอบ</span>
                                        <span className="font-bold text-foreground tabular-nums">
                                          {fin}/{total}
                                        </span>
                                      </div>
                                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className={`h-1.5 rounded-full ${
                                            finPct >= 100
                                              ? "bg-emerald-500"
                                              : finPct > 0
                                              ? "bg-amber-500"
                                              : "bg-border"
                                          }`}
                                          style={{ width: `${Math.min(finPct, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      <PaginationBar
                        totalItems={detailPagination.totalItems}
                        currentPage={detailPagination.currentPage}
                        totalPages={detailPagination.totalPages}
                        perPage={detailPagination.perPage}
                        onPageChange={detailPagination.setCurrentPage}
                        onPerPageChange={detailPagination.setPerPage}
                        unitLabel="รายการ"
                      />
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
