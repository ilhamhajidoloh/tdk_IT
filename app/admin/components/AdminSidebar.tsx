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
  BarChart3,
  ChevronDown,
  LayoutGrid,
  Sparkles,
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

interface NavCategoryDef {
  id: string;
  title: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  keys: Tab[];
}

export const ADMIN_NAV_CATEGORIES: NavCategoryDef[] = [
  {
    id: "overview",
    title: "ภาพรวม & ข้อมูลองค์กร",
    sub: "Overview & Portal",
    icon: LayoutGrid,
    color: "from-blue-500 to-indigo-600",
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
    keys: ["dashboard", "duty", "books"],
  },
  {
    id: "academic",
    title: "จัดการข้อมูลการศึกษา",
    sub: "Academic Management",
    icon: GraduationCap,
    color: "from-indigo-500 to-violet-600",
    badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
    keys: ["users", "students", "classrooms", "subjects", "schedule"],
  },
  {
    id: "grades",
    title: "ผลการเรียน & สถิติ",
    sub: "Grades & Analytics",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-600",
    badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
    keys: [
      "grade-status",
      "student-scores",
      "rankings",
      "yearly-average",
      "achievement",
      "evaluations",
      "export-grades",
    ],
  },
  {
    id: "system",
    title: "ตั้งค่าระบบ",
    sub: "System Settings",
    icon: Settings,
    color: "from-slate-600 to-slate-800",
    badgeBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30",
    keys: ["settings"],
  },
];

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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const activeItem = navItems.find((i) => i.key === activeTab) || navItems[0];
  const ActiveIcon = ICON_MAP[activeItem.key] || Home;

  // Group nav items by category
  const categoriesWithItems = ADMIN_NAV_CATEGORIES.map((cat) => ({
    ...cat,
    items: navItems.filter((item) => cat.keys.includes(item.key)),
  })).filter((cat) => cat.items.length > 0);

  // Filtered items for mobile view based on category filter
  const mobileFilteredItems =
    selectedCategoryFilter === "all"
      ? navItems
      : navItems.filter((item) => {
          const cat = ADMIN_NAV_CATEGORIES.find((c) => c.id === selectedCategoryFilter);
          return cat ? cat.keys.includes(item.key) : true;
        });

  return (
    <div className="w-full space-y-4">
      {/* 📱 MOBILE & TABLET LAYOUT (< lg screen: < 1024px) */}
      <div className="lg:hidden space-y-3">
        {/* Quick Dropdown Select with Categorized Optgroups */}
        <div className="glass-strong p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
              <ActiveIcon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase truncate">
                เมนูที่เลือกอยู่ ({activeItem.sub})
              </div>
              <div className="text-sm font-extrabold text-foreground truncate">
                {activeItem.label}
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-auto min-w-[230px]">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as Tab)}
              className="w-full appearance-none bg-background text-foreground font-bold text-xs px-3.5 py-2.5 pr-9 rounded-xl border border-border outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
            >
              {categoriesWithItems.map((cat) => (
                <optgroup key={cat.id} label={`📁 ${cat.title}`}>
                  {cat.items.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label} ({item.sub})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Category Filter Pills (Mobile/Tablet) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategoryFilter === "all"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            ทั้งหมด ({navItems.length})
          </button>
          {categoriesWithItems.map((cat) => {
            const isCatActive = selectedCategoryFilter === cat.id;
            const hasActiveTab = cat.items.some((it) => it.key === activeTab);
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isCatActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-sm"
                    : hasActiveTab
                    ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                <span>{cat.title}</span>
                <span className="opacity-70 text-[10px]">({cat.items.length})</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Horizontal Chip Bar for Selected Category */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {mobileFilteredItems.map((item) => {
            const Icon = ICON_MAP[item.key] || Home;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md scale-[1.02]"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-indigo-300"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-indigo-500 dark:text-indigo-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 💻 DESKTOP / NOTEBOOK LAYOUT (>= lg screen: >= 1024px) */}
      <div className="hidden lg:block space-y-4">
        {/* Categorized Navigation Groups */}
        {categoriesWithItems.map((cat) => {
          const CatIcon = cat.icon;
          const hasActiveInCat = cat.items.some((it) => it.key === activeTab);

          return (
            <div
              key={cat.id}
              className={`glass-strong rounded-2xl p-2.5 space-y-1 border transition-all ${
                hasActiveInCat
                  ? "border-indigo-200/80 dark:border-indigo-500/30 shadow-sm"
                  : "border-border/60"
              }`}
            >
              {/* Category Header */}
              <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-border/40 pb-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${cat.color} text-white shadow-xs`}>
                    <CatIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-foreground tracking-tight">
                      {cat.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium">
                      {cat.sub}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}>
                  {cat.items.length}
                </span>
              </div>

              {/* Items in Category */}
              <div className="space-y-0.5">
                {cat.items.map((item) => {
                  const Icon = ICON_MAP[item.key] || Home;
                  const isActive = activeTab === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full flex items-center gap-3 text-left rounded-xl font-bold text-sm px-3.5 py-2.5 transition-all cursor-pointer border-0 ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/40 translate-x-0.5"
                          : "text-muted-foreground hover:bg-indigo-50/70 dark:hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-300 hover:translate-x-1"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-white" : "text-indigo-500 dark:text-indigo-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="leading-snug truncate">{item.label}</div>
                        <div
                          className={`text-[10px] font-normal truncate ${
                            isActive ? "text-indigo-100" : "text-subtle-foreground"
                          }`}
                        >
                          {item.sub}
                        </div>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* System Info Card */}
        <div className="p-4 rounded-2xl glass-strong border border-border shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
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
                ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
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
