"use client";

import { useState } from "react";
import {
  Home,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Eye,
  TrendingUp,
  Clock,
  Printer,
  Award,
  Settings,
  BookMarked,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Tab } from "./types";

const ICON_MAP: Record<Tab, React.ComponentType<{ className?: string }>> = {
  dashboard: Home,
  users: Users,
  classrooms: Building2,
  students: GraduationCap,
  subjects: BookOpen,
  schedule: CalendarDays,
  "grade-status": ClipboardCheck,
  "student-scores": Eye,
  rankings: TrendingUp,
  "yearly-average": Clock,
  "export-grades": Printer,
  evaluations: Award,
  settings: Settings,
  duty: Home,
  books: BookMarked,
};

export interface NavItem {
  key: Tab;
  label: string;
  sub: string;
  icon: string;
}

interface AdminSidebarProps {
  navItems: NavItem[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  adminYear: string | number;
  adminTerm: string | number;
  isGradingActive: boolean;
}

export default function AdminSidebar({
  navItems,
  activeTab,
  setActiveTab,
  adminYear,
  adminTerm,
  isGradingActive,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="space-y-1.5">
      <div
        className={`glass-strong rounded-2xl p-2 space-y-1 transition-all duration-300 ${
          collapsed ? "w-16" : "w-full"
        }`}
      >
        <div className="flex items-center justify-end mb-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all cursor-pointer border-0 bg-transparent"
            title={collapsed ? "ขยายแถบนำทาง" : "ย่อแถบนำทาง"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {navItems.map((item) => {
          const Icon = ICON_MAP[item.key] || Home;
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 text-left rounded-xl font-semibold text-sm transition-all cursor-pointer border-0 ${
                collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
              } ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200/50/50"
                  : "text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-white" : "text-indigo-400"
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {!collapsed && (
        <div className="hidden md:block mt-3 p-4 rounded-2xl glass-strong animate-fade-in-up">
          <div className="text-xs font-bold text-subtle-foreground uppercase tracking-wider mb-2">
            ปีการศึกษาปัจจุบัน
          </div>
          <div className="text-sm font-extrabold text-foreground">
            ปีการศึกษา {adminYear}
          </div>
          <div className="text-xs font-semibold mb-3 gradient-text">
            ภาคเรียนที่ {adminTerm}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isGradingActive
                ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            {isGradingActive ? "เปิดกรอกคะแนน" : "ปิดกรอกคะแนน"}
          </span>
        </div>
      )}

      {collapsed && (
        <div className="hidden md:block mt-3 p-2 rounded-2xl glass-strong flex flex-col items-center">
          <span
            className={`w-2 h-2 rounded-full ${
              isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
            title={
              isGradingActive
                ? `เปิดกรอกคะแนน - ปีการศึกษา ${adminYear} ภาคเรียนที่ ${adminTerm}`
                : `ปิดกรอกคะแนน - ปีการศึกษา ${adminYear} ภาคเรียนที่ ${adminTerm}`
            }
          />
        </div>
      )}
    </div>
  );
}
