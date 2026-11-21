"use client";

import { useMemo, useState } from "react";
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Settings,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  type DBUser,
  type DBStudent,
  type DBClassroom,
  type DBSubject,
  type SchedulePeriod,
  type SystemSetting,
  type Tab,
} from "../types";
import { formatThaiDateRange } from "../../../lib/format";
import { resolveIcon } from "../iconMap";

interface DashboardTabProps {
  adminYear: string | number;
  adminTerm: string | number;
  users: DBUser[];
  students: DBStudent[];
  classrooms: DBClassroom[];
  subjectsList: DBSubject[];
  schedulePeriods: SchedulePeriod[];
  settingsList: SystemSetting[];
  startDate: string;
  endDate: string;
  isGradingActive: boolean;
  navItems: { key: Tab; label: string; sub: string; icon: string }[];
  setActiveTab: (tab: Tab) => void;
}

const PRIORITY_SHORTCUT_KEYS: Tab[] = [
  "students",
  "classrooms",
  "subjects",
  "grade-status",
  "schedule",
  "users",
];

export default function DashboardTab({
  adminYear,
  adminTerm,
  users,
  students,
  classrooms,
  subjectsList,
  schedulePeriods,
  settingsList,
  startDate,
  endDate,
  isGradingActive,
  navItems,
  setActiveTab,
}: DashboardTabProps) {
  const [showAllShortcuts, setShowAllShortcuts] = useState(false);

  const allowedTabKeys = useMemo(
    () => new Set(navItems.map((item) => item.key)),
    [navItems]
  );

  const { studentUserCount, teacherCount, adminCount, activeStudentCount, avgPerClass } =
    useMemo(() => {
      const studentUsers = users.filter((u) => u.role === "student").length;
      const teachers = users.filter((u) => u.role === "teacher").length;
      const admins = users.filter((u) => u.role === "admin").length;
      const activeStudents = students.filter(
        (s) => !s.status || s.status === "active"
      ).length;
      const avg =
        classrooms.length > 0 ? Math.round(activeStudents / classrooms.length) : 0;

      return {
        studentUserCount: studentUsers,
        teacherCount: teachers,
        adminCount: admins,
        activeStudentCount: activeStudents,
        avgPerClass: avg,
      };
    }, [users, students, classrooms]);

  const allShortcuts = useMemo(
    () => navItems.filter((item) => item.key !== "dashboard"),
    [navItems]
  );

  const featuredShortcuts = useMemo(() => {
    const prioritized = PRIORITY_SHORTCUT_KEYS.map((key) =>
      allShortcuts.find((item) => item.key === key)
    ).filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (prioritized.length >= 6) return prioritized.slice(0, 6);

    const pickedKeys = new Set(prioritized.map((item) => item.key));
    const extras = allShortcuts.filter((item) => !pickedKeys.has(item.key));
    return [...prioritized, ...extras].slice(0, 6);
  }, [allShortcuts]);

  const visibleShortcuts = showAllShortcuts ? allShortcuts : featuredShortcuts;

  const totalUsers = users.length;
  const studentPct = totalUsers > 0 ? Math.round((studentUserCount / totalUsers) * 100) : 0;
  const teacherPct = totalUsers > 0 ? Math.round((teacherCount / totalUsers) * 100) : 0;
  const adminPct = Math.max(0, 100 - studentPct - teacherPct);

  const kpiCards: {
    label: string;
    value: number;
    unit: string;
    detail: string;
    targetTab: Tab;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
  }[] = [
    {
      label: "นักเรียน",
      value: activeStudentCount,
      unit: "คน",
      detail: `ทะเบียนทั้งหมด ${students.length} คน`,
      targetTab: "students",
      icon: GraduationCap,
      iconBg:
        "bg-teal-500/12 text-teal-700 dark:text-teal-300 border-teal-500/20",
    },
    {
      label: "ครูผู้สอน",
      value: teacherCount,
      unit: "คน",
      detail: `ผู้ดูแลระบบ ${adminCount} บัญชี`,
      targetTab: "users",
      icon: Users,
      iconBg:
        "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    },
    {
      label: "ชั้นเรียนเทอมนี้",
      value: classrooms.length,
      unit: "ห้อง",
      detail: avgPerClass > 0 ? `เฉลี่ย ~${avgPerClass} คน/ห้อง` : "ห้องเรียนปัจจุบัน",
      targetTab: "classrooms",
      icon: Building2,
      iconBg:
        "bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/20",
    },
    {
      label: "วิชาเรียนเทอมนี้",
      value: subjectsList.length,
      unit: "วิชา",
      detail: `ตารางเรียน ${schedulePeriods.length} คาบ/วัน`,
      targetTab: "subjects",
      icon: BookOpen,
      iconBg:
        "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/20",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
      {/* 1. Compact Header + Active Term Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-50/70 via-card to-teal-50/40 dark:from-indigo-950/30 dark:via-card dark:to-teal-950/20 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              <Sparkles className="w-3 h-3" />
              <span>แดชบอร์ดภาพรวม</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              ปีการศึกษา {adminYear} • ภาคเรียนที่ {adminTerm}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                {formatThaiDateRange(startDate, endDate)}
              </span>
              <span className="hidden sm:inline text-border-strong">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                บันทึกแล้ว {settingsList.length} ภาคเรียน
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                isGradingActive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              {isGradingActive ? "เปิดกรอกคะแนน" : "ปิดกรอกคะแนน"}
            </span>

            {allowedTabKeys.has("settings") && (
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-card hover:bg-muted text-foreground border border-border transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                <span>ตั้งค่าเทอม</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Essential 4 KPI Cards (Clean, Scannable, Clickable) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const canNavigate = allowedTabKeys.has(card.targetTab);

          return (
            <button
              key={card.label}
              type="button"
              disabled={!canNavigate}
              onClick={() => canNavigate && setActiveTab(card.targetTab)}
              className={`text-left rounded-2xl p-4 sm:p-5 bg-card border border-border transition-all group ${
                canNavigate
                  ? "hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-md cursor-pointer"
                  : "cursor-default"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${card.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {canNavigate && (
                  <ArrowUpRight className="w-4 h-4 text-subtle-foreground opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all" />
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {card.value.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {card.unit}
                </span>
              </div>

              <div className="text-xs sm:text-sm font-bold text-foreground/90 mt-1">
                {card.label}
              </div>
              <div className="text-[11px] text-subtle-foreground mt-0.5 truncate">
                {card.detail}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Balanced 2-Column Overview: Account Breakdown + Essential Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Compact System & Account Summary (5 cols) */}
        <section className="lg:col-span-5 rounded-2xl border border-border bg-card p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  สัดส่วนบัญชีผู้ใช้งาน
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  รวมทั้งหมด {totalUsers.toLocaleString()} บัญชีในระบบ
                </p>
              </div>
              {allowedTabKeys.has("users") && (
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline border-0 bg-transparent cursor-pointer shrink-0"
                >
                  จัดการผู้ใช้
                </button>
              )}
            </div>

            {/* Proportional Bar */}
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
              {studentPct > 0 && (
                <div
                  className="h-full bg-teal-500 transition-all"
                  style={{ width: `${studentPct}%` }}
                  title={`นักเรียน ${studentUserCount} บัญชี`}
                />
              )}
              {teacherPct > 0 && (
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${teacherPct}%` }}
                  title={`ครูผู้สอน ${teacherCount} บัญชี`}
                />
              )}
              {adminPct > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${adminPct}%` }}
                  title={`ผู้ดูแลระบบ ${adminCount} บัญชี`}
                />
              )}
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/60">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                  บัญชีนักเรียน
                </span>
                <span className="font-bold text-foreground">
                  {studentUserCount.toLocaleString()}{" "}
                  <span className="text-subtle-foreground font-medium">({studentPct}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/60">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                  บัญชีครูผู้สอน
                </span>
                <span className="font-bold text-foreground">
                  {teacherCount.toLocaleString()}{" "}
                  <span className="text-subtle-foreground font-medium">({teacherPct}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  ผู้ดูแลระบบ
                </span>
                <span className="font-bold text-foreground">
                  {adminCount.toLocaleString()}{" "}
                  <span className="text-subtle-foreground font-medium">({adminPct}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Academic Structure Mini Row */}
          <div className="pt-3 border-t border-border/70 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-surface-2 px-3 py-2.5 border border-border/60">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                คาบเรียนต่อวัน
              </div>
              <div className="text-sm font-extrabold text-foreground mt-0.5">
                {schedulePeriods.length} คาบ
              </div>
            </div>

            <div className="rounded-xl bg-surface-2 px-3 py-2.5 border border-border/60">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-teal-500" />
                สถานะคะแนน
              </div>
              <div className="text-sm font-extrabold text-foreground mt-0.5">
                {isGradingActive ? "เปิดใช้งาน" : "ปิดชั่วคราว"}
              </div>
            </div>
          </div>
        </section>

        {/* Right: Curated Essential Shortcuts (7 cols) */}
        <section className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  ทางลัดงานหลัก
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  เข้าถึงเมนูที่ใช้งานบ่อยได้อย่างรวดเร็ว
                </p>
              </div>
              {allowedTabKeys.has("grade-status") && (
                <button
                  type="button"
                  onClick={() => setActiveTab("grade-status")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline border-0 bg-transparent cursor-pointer shrink-0"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>เช็กสถานะคะแนน</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {visibleShortcuts.map((item) => {
                const Icon = resolveIcon(item.icon);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/70 hover:bg-indigo-50/70 dark:hover:bg-indigo-500/12 border border-border/70 hover:border-indigo-300 dark:hover:border-indigo-500/35 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-card border border-border/80 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors shrink-0">
                      {Icon ? (
                        <Icon className="w-4 h-4" />
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={item.icon}
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-[13px] font-bold text-foreground truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-subtle-foreground truncate">
                        {item.sub}
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-subtle-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {allShortcuts.length > featuredShortcuts.length && (
            <div className="pt-2 border-t border-border/60 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllShortcuts((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-0 bg-transparent cursor-pointer"
              >
                {showAllShortcuts ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>แสดงเฉพาะเมนูหลัก</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>ดูทางลัดทั้งหมด ({allShortcuts.length} เมนู)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
