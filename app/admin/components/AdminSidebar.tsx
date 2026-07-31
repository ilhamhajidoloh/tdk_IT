"use client";

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
  BarChart3,
  ChevronDown,
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
  achievement: BarChart3,
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
  const activeItem = navItems.find((i) => i.key === activeTab) || navItems[0];
  const ActiveIcon = ICON_MAP[activeItem.key] || Home;

  return (
    <div className="w-full space-y-4">
      {/* 📱 MOBILE & TABLET LAYOUT (< lg screen: < 1024px) */}
      <div className="lg:hidden space-y-3">
        {/* Quick Dropdown Select */}
        <div className="glass-strong p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
              <ActiveIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                เมนูที่เลือกอยู่ ({activeItem.sub})
              </div>
              <div className="text-sm font-extrabold text-foreground">
                {activeItem.label}
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-auto min-w-[210px]">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as Tab)}
              className="w-full appearance-none bg-background text-foreground font-bold text-xs px-3.5 py-2.5 pr-9 rounded-xl border border-border outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {navItems.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label} ({item.sub})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Scrollable Horizontal Chip Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.key] || Home;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-indigo-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 💻 DESKTOP / NOTEBOOK LAYOUT (>= lg screen: >= 1024px) */}
      <div className="hidden lg:block space-y-3">
        <div className="glass-strong rounded-2xl p-2.5 space-y-1">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            เมนูการใช้งานหลัก
          </div>

          {navItems.map((item) => {
            const Icon = ICON_MAP[item.key] || Home;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 text-left rounded-xl font-bold text-sm px-4 py-3 transition-all cursor-pointer border-0 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/50/50"
                    : "text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-white" : "text-indigo-500 dark:text-indigo-400"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* System Info Card */}
        <div className="p-4 rounded-2xl glass-strong border border-border shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            ปีการศึกษาปัจจุบัน
          </div>
          <div className="text-sm font-extrabold text-foreground">
            ปีการศึกษา {adminYear}
          </div>
          <div className="text-xs font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
            ภาคเรียนที่ {adminTerm}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isGradingActive
                ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            {isGradingActive ? "เปิดกรอกคะแนน" : "ปิดกรอกคะแนน"}
          </span>
        </div>
      </div>
    </div>
  );
}
