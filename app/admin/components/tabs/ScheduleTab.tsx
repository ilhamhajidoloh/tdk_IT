"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  CalendarDays,
  Clock,
  Palette,
  Download,
  ChevronDown,
  Plus,
  Check,
  Trash2,
  Building2,
  LayoutGrid,
  User,
  Search,
  X,
} from "lucide-react";
import {
  type SchedulePeriod,
  type ScheduleEntry,
  type SystemSetting,
  type DBSubject,
  type DBUser,
  ALL_DAYS,
} from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import PaginationBar, { usePagination } from "../PaginationBar";
import PermissionGate from "@/app/components/PermissionGate";
import { resolveTeacherColor } from "@/app/lib/teacherColor";

interface ScheduleTabProps {
  settingsList: SystemSetting[];
  selectedSubjectSettingId: number | null;
  handleSelectSubjectSetting: (id: number) => void;
  schedulePeriods: SchedulePeriod[];
  updatePeriodField: (
    index: number,
    field: "start_time" | "end_time" | "label" | "is_break",
    value: string | boolean
  ) => void;
  handleSavePeriod: (period: SchedulePeriod) => void;
  handleDeletePeriod: (periodId: string) => void;
  handleAddPeriod: () => void;
  scheduleEntries: ScheduleEntry[];
  exportLanguage: "th" | "ms-rumi" | "ms-jawi";
  setExportLanguage: (lang: "th" | "ms-rumi" | "ms-jawi") => void;
  handleExportSchedule: (type: "overview" | "classroom" | "teacher") => void;
  scheduleClassroomId: string;
  setScheduleClassroomId: (id: string) => void;
  subjectClassrooms: {
    id: string;
    name: string;
    name_thai?: string | null;
    name_rumi?: string | null;
    name_jawi?: string | null;
  }[];
  subjectsList: DBSubject[];
  handleScheduleCellChange: (
    day: number,
    periodId: string,
    subjectId: string,
    existingEntryId?: string
  ) => void;
  handleScheduleTeacherChange: (
    day: number,
    periodId: string,
    subjectId: string,
    teacherId: string | null,
    existingEntryId?: string
  ) => void;
  users: DBUser[];
  onUpdateTeacherColor?: (teacherId: string, color: string) => void;
}

type ScheduleSubTab = "grid" | "periods" | "colors";

const EXPORT_LANG_OPTIONS: { value: "th" | "ms-rumi" | "ms-jawi"; label: string }[] = [
  { value: "th", label: "ไทย" },
  { value: "ms-rumi", label: "Rumi" },
  { value: "ms-jawi", label: "Jawi" },
];

export default function ScheduleTab({
  settingsList,
  selectedSubjectSettingId,
  handleSelectSubjectSetting,
  schedulePeriods,
  updatePeriodField,
  handleSavePeriod,
  handleDeletePeriod,
  handleAddPeriod,
  scheduleEntries,
  exportLanguage,
  setExportLanguage,
  handleExportSchedule,
  scheduleClassroomId,
  setScheduleClassroomId,
  subjectClassrooms,
  subjectsList,
  handleScheduleCellChange,
  handleScheduleTeacherChange,
  users,
  onUpdateTeacherColor,
}: ScheduleTabProps) {
  const [subTab, setSubTab] = useState<ScheduleSubTab>("grid");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [mobileDay, setMobileDay] = useState<number | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const activeSettingObj = settingsList.find((s) => s.id === selectedSubjectSettingId);
  const activeDaysConfig = Array.isArray(activeSettingObj?.schedule_days)
    ? activeSettingObj.schedule_days
    : [1, 2, 3, 4, 5];
  const activeDays = ALL_DAYS.filter((d) => activeDaysConfig.includes(d.value));
  const selectedMobileDay =
    mobileDay !== null && activeDays.some((d) => d.value === mobileDay)
      ? mobileDay
      : activeDays[0]?.value ?? 1;

  const activeTeachers = useMemo(
    () => users.filter((u) => u.role === "teacher" && u.status !== "resigned"),
    [users]
  );

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return activeTeachers;
    return activeTeachers.filter((t) => t.username.toLowerCase().includes(q));
  }, [activeTeachers, teacherSearch]);

  const subjectsForClassroom = useMemo(
    () => subjectsList.filter((s) => s.classroom_ids?.includes(scheduleClassroomId)),
    [subjectsList, scheduleClassroomId]
  );

  const periodPagination = usePagination(schedulePeriods, 5);
  const teacherPagination = usePagination(filteredTeachers, 10);

  const canExport = schedulePeriods.length > 0 && scheduleEntries.length > 0;

  return (
    <div className="p-6 md:p-8 space-y-5 animate-fade-in-up">
      <SectionHeader
        icon="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        color="blue"
        title="ตารางเรียน"
        subtitle="จัดตารางสอนรายห้อง กำหนดคาบเรียน และสีประจำตัวครูแยกเป็นสัดส่วน"
        count={selectedSubjectSettingId ? schedulePeriods.length : undefined}
        countLabel="คาบ/วัน"
      >
        {/* Export Dropdown */}
        {selectedSubjectSettingId && canExport && (
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportMenuOpen((v) => !v)}
              aria-expanded={exportMenuOpen}
              className="bg-card border border-border text-foreground hover:bg-muted px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
              <span>ส่งออกตาราง</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                  exportMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {exportMenuOpen && (
              <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-30 w-64 max-w-[calc(100vw-2rem)] rounded-xl bg-card border border-border shadow-lg p-3 space-y-2.5 animate-fade-in">
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">
                    ภาษาเอกสาร
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted border border-border">
                    {EXPORT_LANG_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setExportLanguage(opt.value)}
                        className={`py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-0 ${
                          exportLanguage === opt.value
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground bg-transparent"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportSchedule("overview");
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ภาพรวมทุกชั้นเรียน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportSchedule("classroom");
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    แยกรายชั้นเรียน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportSchedule("teacher");
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    แยกรายครูผู้สอน
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contextual Add Period Button */}
        {selectedSubjectSettingId && subTab === "periods" && (
          <PermissionGate permission="schedules.create">
            <button
              type="button"
              onClick={handleAddPeriod}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 border-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มคาบเรียน</span>
            </button>
          </PermissionGate>
        )}
      </SectionHeader>

      {/* Term Selector */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSubjectSettingId}
        onSelect={handleSelectSubjectSetting}
      />

      {!selectedSubjectSettingId ? (
        <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : (
        <div className="space-y-5">
          {/* Separated Sub-Tab Navigation */}
          <div className="inline-flex w-full sm:w-auto gap-1 p-1 bg-muted rounded-xl border border-border overflow-x-auto">
            {(
              [
                { key: "grid" as const, label: "ตารางสอนรายห้อง", icon: CalendarDays, count: undefined },
                {
                  key: "periods" as const,
                  label: "จัดการคาบเรียน",
                  icon: Clock,
                  count: schedulePeriods.length,
                },
                ...(activeTeachers.length > 0
                  ? [
                      {
                        key: "colors" as const,
                        label: "สีประจำตัวครู",
                        icon: Palette,
                        count: activeTeachers.length,
                      },
                    ]
                  : []),
              ]
            ).map((tab) => {
              const Icon = tab.icon;
              const active = subTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSubTab(tab.key)}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer border-0 ${
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${active ? "text-indigo-600 dark:text-indigo-400" : ""}`}
                  />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[11px] opacity-65 tabular-nums">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ===== SUB-TAB 1: CLASSROOM SCHEDULE GRID ===== */}
          {subTab === "grid" && (
            <div className="space-y-4">
              {/* Classroom Picker Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    aria-label="เลือกห้องเรียน"
                    value={scheduleClassroomId}
                    onChange={(e) => setScheduleClassroomId(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer"
                  >
                    <option value="">-- เลือกห้องเรียน --</option>
                    {subjectClassrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.name_thai && c.name_thai !== c.name ? ` (${c.name_thai})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {schedulePeriods.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setSubTab("periods")}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer border-0 bg-transparent"
                  >
                    ไปตั้งค่าคาบเรียนก่อน →
                  </button>
                )}
              </div>

              {!scheduleClassroomId ? (
                <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
                  กรุณาเลือกห้องเรียนด้านบนเพื่อจัดตารางสอน
                </div>
              ) : schedulePeriods.length === 0 ? (
                <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border space-y-2">
                  <div className="text-sm font-semibold">ยังไม่มีคาบเรียนในเทอมนี้</div>
                  <button
                    type="button"
                    onClick={() => setSubTab("periods")}
                    className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                  >
                    ไปเพิ่มคาบเรียน
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Grid Table */}
                  <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                          <th className="py-3 px-3.5 w-32">คาบ / เวลา</th>
                          {activeDays.map((d) => (
                            <th key={d.value} className="py-3 px-3 text-center">
                              วัน{d.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {schedulePeriods.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-3.5 align-top whitespace-nowrap">
                              <div className="font-bold text-sm text-foreground">
                                คาบ {p.period_no}
                              </div>
                              <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                                {p.start_time} – {p.end_time}
                              </div>
                              {p.label && (
                                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                                  {p.label}
                                </div>
                              )}
                            </td>

                            {p.is_break ? (
                              <td
                                colSpan={activeDays.length}
                                className="py-3 px-4 text-center bg-muted/40"
                              >
                                <span className="text-xs font-bold text-muted-foreground tracking-wider">
                                  {p.label || "พักเบรก"}
                                </span>
                              </td>
                            ) : (
                              activeDays.map((d) => {
                                const entry = scheduleEntries.find(
                                  (e) =>
                                    e.classroom_id === scheduleClassroomId &&
                                    Number(e.day_of_week) === d.value &&
                                    e.period_id === p.id
                                );
                                const selectedSubj = entry?.subject_id
                                  ? subjectsList.find((s) => s.id === entry.subject_id)
                                  : null;

                                return (
                                  <td key={d.value} className="p-2.5 align-top min-w-[148px]">
                                    <select
                                      aria-label={`วิชาวัน${d.label} คาบ ${p.period_no}`}
                                      value={entry?.subject_id ?? ""}
                                      onChange={(ev) =>
                                        handleScheduleCellChange(
                                          d.value,
                                          p.id,
                                          ev.target.value,
                                          entry?.id
                                        )
                                      }
                                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors cursor-pointer ${
                                        entry?.subject_id
                                          ? "bg-card border-indigo-200 dark:border-indigo-500/30 text-foreground"
                                          : "bg-muted/30 border-border text-muted-foreground"
                                      }`}
                                    >
                                      <option value="">— ว่าง —</option>
                                      {subjectsForClassroom.map((s) => {
                                        const tDisplay =
                                          s.teacher_names && s.teacher_names.length > 0
                                            ? s.teacher_names.join(", ")
                                            : s.teacher_name || "";
                                        return (
                                          <option key={s.id} value={s.id}>
                                            {s.name}
                                            {tDisplay ? ` (${tDisplay})` : ""}
                                          </option>
                                        );
                                      })}
                                    </select>

                                    {entry?.subject_id && selectedSubj && (
                                      <select
                                        aria-label={`ครูผู้สอนวัน${d.label} คาบ ${p.period_no}`}
                                        value={entry.teacher_id ?? ""}
                                        onChange={(ev) =>
                                          handleScheduleTeacherChange(
                                            d.value,
                                            p.id,
                                            entry.subject_id,
                                            ev.target.value || null,
                                            entry.id
                                          )
                                        }
                                        className="w-full mt-1.5 px-2 py-1 rounded-lg border border-blue-200/80 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 text-[11px] font-medium text-blue-700 dark:text-blue-300 outline-none focus:ring-2 focus:ring-blue-400/30 cursor-pointer"
                                        title="ระบุครูผู้สอนเฉพาะห้องนี้"
                                      >
                                        {selectedSubj.teacher_ids?.length !== 1 && (
                                          <option value="">-- กำหนดครู --</option>
                                        )}
                                        {users
                                          .filter((u) =>
                                            (selectedSubj.teacher_ids || []).includes(u.id)
                                          )
                                          .map((u) => (
                                            <option key={u.id} value={u.id}>
                                              {u.username}
                                            </option>
                                          ))}
                                      </select>
                                    )}

                                    {entry?.subject_id &&
                                      !entry.teacher_id &&
                                      selectedSubj?.teacher_names &&
                                      selectedSubj.teacher_names.length > 1 && (
                                        <div className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold px-1">
                                          สอนรวม
                                        </div>
                                      )}
                                  </td>
                                );
                              })
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View: Day Pills + Clean Period List for Selected Day */}
                  <div className="md:hidden space-y-3">
                    <div className="flex gap-1.5 p-1 bg-muted rounded-xl border border-border overflow-x-auto">
                      {activeDays.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setMobileDay(d.value)}
                          className={`flex-1 min-w-[4rem] py-2 px-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border-0 ${
                            selectedMobileDay === d.value
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground bg-transparent"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>

                    <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                      {schedulePeriods.map((p) => {
                        const entry = scheduleEntries.find(
                          (e) =>
                            e.classroom_id === scheduleClassroomId &&
                            Number(e.day_of_week) === selectedMobileDay &&
                            e.period_id === p.id
                        );
                        const selectedSubj = entry?.subject_id
                          ? subjectsList.find((s) => s.id === entry.subject_id)
                          : null;

                        return (
                          <div key={`mob-p-${p.id}`} className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">
                                  คาบ {p.period_no}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {p.start_time} – {p.end_time}
                                </span>
                              </div>
                              {p.label && (
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                  {p.label}
                                </span>
                              )}
                            </div>

                            {p.is_break ? (
                              <div className="py-2 text-center bg-muted/60 rounded-xl text-xs font-semibold text-muted-foreground">
                                {p.label || "พักเบรก"}
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <select
                                  value={entry?.subject_id ?? ""}
                                  onChange={(ev) =>
                                    handleScheduleCellChange(
                                      selectedMobileDay,
                                      p.id,
                                      ev.target.value,
                                      entry?.id
                                    )
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-indigo-500/30"
                                >
                                  <option value="">— ว่าง —</option>
                                  {subjectsForClassroom.map((s) => {
                                    const tDisplay =
                                      s.teacher_names && s.teacher_names.length > 0
                                        ? s.teacher_names.join(", ")
                                        : s.teacher_name || "";
                                    return (
                                      <option key={s.id} value={s.id}>
                                        {s.name}
                                        {tDisplay ? ` (${tDisplay})` : ""}
                                      </option>
                                    );
                                  })}
                                </select>

                                {entry?.subject_id && selectedSubj && (
                                  <select
                                    value={entry.teacher_id ?? ""}
                                    onChange={(ev) =>
                                      handleScheduleTeacherChange(
                                        selectedMobileDay,
                                        p.id,
                                        entry.subject_id,
                                        ev.target.value || null,
                                        entry.id
                                      )
                                    }
                                    className="w-full px-3 py-1.5 rounded-xl border border-blue-200/80 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 text-xs text-blue-700 dark:text-blue-300 outline-none"
                                  >
                                    {selectedSubj.teacher_ids?.length !== 1 && (
                                      <option value="">-- กำหนดครู --</option>
                                    )}
                                    {users
                                      .filter((u) =>
                                        (selectedSubj.teacher_ids || []).includes(u.id)
                                      )
                                      .map((u) => (
                                        <option key={u.id} value={u.id}>
                                          {u.username}
                                        </option>
                                      ))}
                                  </select>
                                )}

                                {entry?.subject_id &&
                                  !entry.teacher_id &&
                                  selectedSubj?.teacher_names &&
                                  selectedSubj.teacher_names.length > 1 && (
                                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold px-1">
                                      สอนรวม
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== SUB-TAB 2: PERIOD MANAGEMENT ===== */}
          {subTab === "periods" && (
            <div className="space-y-4">
              {schedulePeriods.length === 0 ? (
                <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border space-y-2">
                  <Clock className="w-8 h-8 mx-auto opacity-40" />
                  <div className="text-sm font-semibold">
                    ยังไม่มีคาบเรียน กด &quot;เพิ่มคาบเรียน&quot; เพื่อเริ่มต้น
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                          <th className="py-3 px-4 text-center w-20">คาบที่</th>
                          <th className="py-3 px-4 w-36">เวลาเริ่ม</th>
                          <th className="py-3 px-4 w-36">เวลาจบ</th>
                          <th className="py-3 px-4">หมายเหตุ</th>
                          <th className="py-3 px-4 text-center w-24">คาบพัก</th>
                          <th className="py-3 px-4 text-right w-32">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {periodPagination.paginatedItems.map((p, idx) => {
                          const originalIdx =
                            periodPagination.perPage === 0
                              ? idx
                              : (periodPagination.currentPage - 1) * periodPagination.perPage + idx;
                          return (
                            <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                              <td className="py-2.5 px-4 text-center font-bold text-sm text-foreground tabular-nums">
                                {p.period_no}
                              </td>
                              <td className="py-2.5 px-4">
                                <input
                                  type="time"
                                  value={p.start_time}
                                  onChange={(e) =>
                                    updatePeriodField(originalIdx, "start_time", e.target.value)
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4">
                                <input
                                  type="time"
                                  value={p.end_time}
                                  onChange={(e) =>
                                    updatePeriodField(originalIdx, "end_time", e.target.value)
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4">
                                <input
                                  type="text"
                                  value={p.label ?? ""}
                                  onChange={(e) =>
                                    updatePeriodField(originalIdx, "label", e.target.value)
                                  }
                                  placeholder="เช่น พักเที่ยง"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(p.is_break)}
                                  onChange={(e) =>
                                    updatePeriodField(originalIdx, "is_break", e.target.checked)
                                  }
                                  className="w-4 h-4 text-indigo-600 rounded border-border focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center justify-end gap-1.5">
                                  <PermissionGate permission="schedules.edit">
                                    <button
                                      type="button"
                                      onClick={() => handleSavePeriod(p)}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      บันทึก
                                    </button>
                                  </PermissionGate>
                                  <PermissionGate permission="schedules.delete">
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePeriod(p.id)}
                                      aria-label={`ลบคาบที่ ${p.period_no}`}
                                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-0 bg-transparent cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </PermissionGate>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Period Cards */}
                  <div className="md:hidden space-y-2.5">
                    {periodPagination.paginatedItems.map((p, idx) => {
                      const originalIdx =
                        periodPagination.perPage === 0
                          ? idx
                          : (periodPagination.currentPage - 1) * periodPagination.perPage + idx;
                      return (
                        <div
                          key={p.id}
                          className="bg-card rounded-2xl border border-border p-3.5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">
                              คาบที่ {p.period_no}
                            </span>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(p.is_break)}
                                onChange={(e) =>
                                  updatePeriodField(originalIdx, "is_break", e.target.checked)
                                }
                                className="w-4 h-4 text-indigo-600 rounded border-border"
                              />
                              คาบพัก
                            </label>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                เวลาเริ่ม
                              </label>
                              <input
                                type="time"
                                value={p.start_time}
                                onChange={(e) =>
                                  updatePeriodField(originalIdx, "start_time", e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                เวลาจบ
                              </label>
                              <input
                                type="time"
                                value={p.end_time}
                                onChange={(e) =>
                                  updatePeriodField(originalIdx, "end_time", e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <input
                            type="text"
                            value={p.label ?? ""}
                            onChange={(e) =>
                              updatePeriodField(originalIdx, "label", e.target.value)
                            }
                            placeholder="หมายเหตุ เช่น พักเที่ยง"
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs"
                          />

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                            <PermissionGate permission="schedules.edit">
                              <button
                                type="button"
                                onClick={() => handleSavePeriod(p)}
                                className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                บันทึก
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="schedules.delete">
                              <button
                                type="button"
                                onClick={() => handleDeletePeriod(p.id)}
                                aria-label={`ลบคาบที่ ${p.period_no}`}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border-0 bg-transparent cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <PaginationBar
                    totalItems={periodPagination.totalItems}
                    currentPage={periodPagination.currentPage}
                    totalPages={periodPagination.totalPages}
                    perPage={periodPagination.perPage}
                    onPageChange={periodPagination.setCurrentPage}
                    onPerPageChange={periodPagination.setPerPage}
                    unitLabel="คาบ"
                  />
                </>
              )}
            </div>
          )}

          {/* ===== SUB-TAB 3: TEACHER COLORS ===== */}
          {subTab === "colors" && activeTeachers.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="ค้นหาชื่อครู..."
                    className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  {teacherSearch && (
                    <button
                      type="button"
                      onClick={() => setTeacherSearch("")}
                      aria-label="ล้างคำค้นหา"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground border-0 bg-transparent cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  คลิกช่องสีเพื่อเปลี่ยนสีประจำตัวครู (บันทึกอัตโนมัติ)
                </span>
              </div>

              {filteredTeachers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-card rounded-2xl border border-border text-sm font-semibold">
                  ไม่พบครูผู้สอนที่ตรงกับคำค้นหา
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {teacherPagination.paginatedItems.map((t, idx) => {
                      const originalIdx =
                        teacherPagination.perPage === 0
                          ? idx
                          : (teacherPagination.currentPage - 1) * teacherPagination.perPage + idx;
                      const resolved = resolveTeacherColor(t.color, originalIdx);
                      return (
                        <div
                          key={t.id}
                          className="bg-card rounded-2xl border border-border p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0"
                              style={{
                                backgroundColor: resolved.bg,
                                borderColor: resolved.border,
                                color: resolved.text,
                              }}
                            >
                              {t.username.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-semibold text-sm text-foreground truncate">
                              {t.username}
                            </span>
                          </div>

                          <label
                            className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground cursor-pointer shrink-0 transition-colors"
                            title="เปลี่ยนสีประจำตัวครู"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/15"
                              style={{ backgroundColor: t.color || resolved.bg }}
                            />
                            <span>เปลี่ยนสี</span>
                            <input
                              type="color"
                              value={t.color || resolved.bg}
                              onChange={(e) => onUpdateTeacherColor?.(t.id, e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                          </label>
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
        </div>
      )}
    </div>
  );
}
