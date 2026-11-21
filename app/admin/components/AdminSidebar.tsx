"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  CalendarDays,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
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
  Shield,
  Search,
  X,
  Check,
} from "lucide-react";
import ModalPortal from "../../components/ModalPortal";
import type { Tab } from "./types";

const ICON_MAP: Record<Tab, React.ComponentType<{ className?: string }>> = {
  dashboard: Home,
  analytics: BarChart3,
  users: Users,
  classrooms: Building2,
  students: GraduationCap,
  subjects: BookOpen,
  schedule: CalendarClock,
  calendar: CalendarDays,
  "grade-status": ClipboardCheck,
  "student-scores": Eye,
  rankings: TrendingUp,
  "yearly-average": Clock,
  "export-grades": Printer,
  "exam-signatures": FileCheck,
  evaluations: Award,
  settings: Settings,
  duty: ClipboardList,
  books: BookMarked,
  achievement: BarChart3,
  "co-admins": Shield,
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
  shortTitle: string;
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
    shortTitle: "ภาพรวม",
    sub: "Overview & Portal",
    icon: LayoutGrid,
    color: "from-blue-500 to-indigo-600",
    badgeBg:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
    keys: ["dashboard", "duty", "books"],
  },
  {
    id: "academic",
    title: "จัดการข้อมูลการศึกษา",
    shortTitle: "ข้อมูลการศึกษา",
    sub: "Academic Management",
    icon: GraduationCap,
    color: "from-indigo-500 to-violet-600",
    badgeBg:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
    keys: ["users", "students", "classrooms", "subjects", "schedule", "calendar"],
  },
  {
    id: "grades",
    title: "ผลการเรียน & สถิติ",
    shortTitle: "ผลการเรียน",
    sub: "Grades & Analytics",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-600",
    badgeBg:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
    keys: [
      "analytics",
      "grade-status",
      "student-scores",
      "rankings",
      "yearly-average",
      "achievement",
      "evaluations",
      "export-grades",
      "exam-signatures",
    ],
  },
  {
    id: "system",
    title: "ตั้งค่าระบบ",
    shortTitle: "ตั้งค่าระบบ",
    sub: "System Settings",
    icon: Settings,
    color: "from-slate-600 to-slate-800",
    badgeBg:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30",
    keys: ["settings", "co-admins"],
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
  const [desktopSearch, setDesktopSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [drawerCategoryFilter, setDrawerCategoryFilter] = useState<string>("all");

  const categoriesWithItems = useMemo(
    () =>
      ADMIN_NAV_CATEGORIES.map((cat) => ({
        ...cat,
        items: navItems.filter((item) => cat.keys.includes(item.key)),
      })).filter((cat) => cat.items.length > 0),
    [navItems]
  );

  const activeItem = navItems.find((i) => i.key === activeTab) || navItems[0];

  const activeCategory = useMemo(
    () =>
      categoriesWithItems.find((cat) =>
        cat.items.some((item) => item.key === activeTab)
      ) || categoriesWithItems[0],
    [categoriesWithItems, activeTab]
  );

  const [manualTabletCategory, setManualTabletCategory] = useState<{
    forTab: Tab;
    categoryId: string;
  } | null>(null);

  const tabletCategoryId =
    manualTabletCategory && manualTabletCategory.forTab === activeTab
      ? manualTabletCategory.categoryId
      : activeCategory?.id || "overview";

  // Lock body scroll and support Escape key while drawer is open
  useEffect(() => {
    if (!isDrawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  const normalizedDesktopSearch = desktopSearch.trim().toLowerCase();
  const desktopFilteredCategories = useMemo(() => {
    if (!normalizedDesktopSearch) return categoriesWithItems;
    return categoriesWithItems
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedDesktopSearch) ||
            item.sub.toLowerCase().includes(normalizedDesktopSearch) ||
            cat.title.toLowerCase().includes(normalizedDesktopSearch)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categoriesWithItems, normalizedDesktopSearch]);

  const normalizedDrawerSearch = drawerSearch.trim().toLowerCase();
  const drawerFilteredCategories = useMemo(() => {
    const base =
      drawerCategoryFilter === "all"
        ? categoriesWithItems
        : categoriesWithItems.filter((cat) => cat.id === drawerCategoryFilter);

    if (!normalizedDrawerSearch) return base;
    return base
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedDrawerSearch) ||
            item.sub.toLowerCase().includes(normalizedDrawerSearch) ||
            cat.title.toLowerCase().includes(normalizedDrawerSearch)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categoriesWithItems, drawerCategoryFilter, normalizedDrawerSearch]);

  const selectedTabletCategory =
    categoriesWithItems.find((cat) => cat.id === tabletCategoryId) || activeCategory;

  if (!activeItem) return null;
  const ActiveIcon = ICON_MAP[activeItem.key] || Home;

  const handleSelectTab = (tab: Tab) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
    setDrawerSearch("");
  };

  const openDrawer = () => {
    setDrawerSearch("");
    setDrawerCategoryFilter("all");
    setIsDrawerOpen(true);
  };

  const toggleDesktopCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <div className="w-full">
      {/* =====================================================================
          📱 MOBILE LAYOUT (< md: < 768px)
          Compact active bar + 1-tap sibling pills + Full-height Bottom Sheet
          ===================================================================== */}
      <div className="md:hidden space-y-2.5">
        <div className="glass-strong rounded-2xl p-3 border border-border shadow-sm space-y-2.5">
          {/* Active tab summary + Menu trigger */}
          <div className="flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={openDrawer}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer border-0 bg-transparent p-0"
              aria-label="เปิดเมนูเลือกหน้า"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ActiveIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                  <span className="truncate">{activeCategory?.shortTitle || activeItem.sub}</span>
                  <span>•</span>
                  <span className="shrink-0 text-indigo-600 dark:text-indigo-400">
                    {adminYear}/{adminTerm}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isGradingActive ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    title={isGradingActive ? "เปิดกรอกคะแนน" : "ปิดกรอกคะแนน"}
                  />
                </div>
                <div className="text-sm font-extrabold text-foreground truncate">
                  {activeItem.label}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={openDrawer}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shrink-0 cursor-pointer border-0"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>เมนู</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>

          {/* 1-tap quick switch for sibling tabs in the current category */}
          {activeCategory && activeCategory.items.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 border-t border-border/50 scrollbar-none">
              {activeCategory.items.map((item) => {
                const Icon = ICON_MAP[item.key] || Home;
                const isActive = item.key === activeTab;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectTab(item.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-card/80 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-white" : "text-indigo-500 dark:text-indigo-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          📟 TABLET LAYOUT (md to < lg: 768px - 1023px)
          Category tabs + 3-column wrapped sub-menu grid (zero awkward scrolling)
          ===================================================================== */}
      <div className="hidden md:block lg:hidden">
        <div className="glass-strong rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Top Bar: Active tab + System info + All Menus search button */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ActiveIcon className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-foreground truncate leading-tight">
                  {activeItem.label}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium truncate">
                  {activeCategory?.title}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-xs font-bold">
                <span className="text-foreground">
                  ปี {adminYear} / เทอม {adminTerm}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isGradingActive
                      ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
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

              <button
                type="button"
                onClick={openDrawer}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card hover:bg-muted text-foreground text-xs font-bold border border-border cursor-pointer transition-colors"
                title="ค้นหาและดูเมนูทั้งหมด"
              >
                <Search className="w-3.5 h-3.5 text-indigo-500" />
                <span>เมนูทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Category Selector Tabs */}
          <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-border/50 bg-card/40">
            {categoriesWithItems.map((cat) => {
              const CatIcon = cat.icon;
              const isSelectedCat = selectedTabletCategory?.id === cat.id;
              const hasActiveTab = cat.items.some((it) => it.key === activeTab);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setManualTabletCategory({ forTab: activeTab, categoryId: cat.id })
                  }
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                    isSelectedCat
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-xs"
                      : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{cat.shortTitle}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelectedCat
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {cat.items.length}
                  </span>
                  {hasActiveTab && !isSelectedCat && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-items Grid for Selected Category */}
          {selectedTabletCategory && (
            <div className="p-3 grid grid-cols-3 gap-2 bg-surface-2/40">
              {selectedTabletCategory.items.map((item) => {
                const Icon = ICON_MAP[item.key] || Home;
                const isActive = item.key === activeTab;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectTab(item.key)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-left text-xs font-bold transition-all border cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-sm"
                        : "bg-card text-foreground border-border/80 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-white" : "text-indigo-500 dark:text-indigo-400"
                      }`}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          💻 DESKTOP LAYOUT (>= lg: >= 1024px)
          Sticky sidebar with top status badge, quick search & collapsible groups
          ===================================================================== */}
      <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-[5.25rem] lg:max-h-[calc(100vh-6.25rem)] space-y-3">
        {/* Top Compact System Status + Quick Search */}
        <div className="glass-strong rounded-2xl p-3 border border-border shadow-sm space-y-2.5 shrink-0">
          {/* Compact Academic Year / Term & Grading Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-xs font-extrabold text-foreground truncate">
                  ปีการศึกษา {adminYear}
                </div>
                <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  ภาคเรียนที่ {adminTerm}
                </div>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                isGradingActive
                  ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                  : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              {isGradingActive ? "เปิดคะแนน" : "ปิดคะแนน"}
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={desktopSearch}
              onChange={(e) => setDesktopSearch(e.target.value)}
              placeholder="ค้นหาเมนู..."
              aria-label="ค้นหาเมนูแอดมิน"
              className="w-full bg-background/80 text-foreground placeholder:text-subtle-foreground text-xs font-medium pl-8 pr-8 py-2 rounded-xl border border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {desktopSearch && (
              <button
                type="button"
                onClick={() => setDesktopSearch("")}
                aria-label="ล้างคำค้นหา"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border-0 bg-transparent cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Categorized Menu List */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2.5 pb-2">
          {desktopFilteredCategories.length === 0 ? (
            <div className="glass-strong rounded-2xl p-6 text-center border border-border space-y-2">
              <div className="text-xs font-bold text-muted-foreground">
                ไม่พบเมนูที่ตรงกับ &ldquo;{desktopSearch}&rdquo;
              </div>
              <button
                type="button"
                onClick={() => setDesktopSearch("")}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline border-0 bg-transparent cursor-pointer"
              >
                ล้างคำค้นหา
              </button>
            </div>
          ) : (
            desktopFilteredCategories.map((cat) => {
              const CatIcon = cat.icon;
              const hasActiveInCat = cat.items.some((it) => it.key === activeTab);
              const isCollapsed =
                !normalizedDesktopSearch && Boolean(collapsedCategories[cat.id]);

              return (
                <div
                  key={cat.id}
                  className={`glass-strong rounded-2xl p-2 border transition-all ${
                    hasActiveInCat
                      ? "border-indigo-200/90 dark:border-indigo-500/35 shadow-sm"
                      : "border-border/70"
                  }`}
                >
                  {/* Collapsible Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleDesktopCategory(cat.id)}
                    aria-expanded={!isCollapsed}
                    className="w-full px-2 py-1.5 flex items-center justify-between gap-2 rounded-xl hover:bg-muted/60 transition-colors border-0 bg-transparent cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${cat.color} text-white shadow-2xs shrink-0`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-extrabold text-foreground tracking-tight truncate">
                        {cat.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasActiveInCat && isCollapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      )}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cat.badgeBg}`}
                      >
                        {cat.items.length}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                          isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  {/* Category Items */}
                  {!isCollapsed && (
                    <div className="mt-1 pt-1 border-t border-border/40 space-y-0.5">
                      {cat.items.map((item) => {
                        const Icon = ICON_MAP[item.key] || Home;
                        const isActive = activeTab === item.key;

                        return (
                          <button
                            key={item.key}
                            type="button"
                            title={`${item.label} (${item.sub})`}
                            onClick={() => handleSelectTab(item.key)}
                            className={`w-full flex items-center gap-2.5 text-left rounded-xl font-bold text-[13px] px-3 py-2 transition-all cursor-pointer border-0 ${
                              isActive
                                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20"
                                : "text-muted-foreground hover:bg-indigo-50/70 dark:hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-300"
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive
                                  ? "text-white"
                                  : "text-indigo-500 dark:text-indigo-400"
                              }`}
                            />
                            <span className="flex-1 truncate leading-snug">
                              {item.label}
                            </span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* =====================================================================
          🗂️ MOBILE BOTTOM SHEET / TABLET ALL-MENUS MODAL DRAWER
          ===================================================================== */}
      {isDrawerOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs md:p-6 animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="เลือกเมนูระบบแอดมิน"
          >
            <div
              className="w-full md:max-w-2xl max-h-[88vh] md:max-h-[82vh] bg-card text-card-foreground rounded-t-3xl md:rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag indicator for mobile */}
              <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
                <span className="w-10 h-1 rounded-full bg-border-strong" />
              </div>

              {/* Drawer Header */}
              <div className="px-4 sm:px-5 pt-2 md:pt-4 pb-3 border-b border-border space-y-3 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-extrabold text-foreground leading-tight">
                      เมนูระบบแอดมิน
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        ปีการศึกษา {adminYear} • ภาคเรียนที่ {adminTerm}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isGradingActive
                            ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isGradingActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {isGradingActive ? "เปิดกรอกคะแนน" : "ปิดกรอกคะแนน"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label="ปิดเมนู"
                    className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center shrink-0 border border-border cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawer Search Input */}
                <div className="relative">
                  <Search className="pointer-events-none w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="ค้นหาเมนู เช่น นักเรียน, ตารางเรียน, คะแนน..."
                    className="w-full bg-background text-foreground placeholder:text-subtle-foreground text-sm font-medium pl-10 pr-10 py-2.5 rounded-xl border border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  {drawerSearch && (
                    <button
                      type="button"
                      onClick={() => setDrawerSearch("")}
                      aria-label="ล้างคำค้นหา"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border-0 bg-transparent cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setDrawerCategoryFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-all shrink-0 ${
                      drawerCategoryFilter === "all"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    ทั้งหมด ({navItems.length})
                  </button>
                  {categoriesWithItems.map((cat) => {
                    const isSelected = drawerCategoryFilter === cat.id;
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setDrawerCategoryFilter(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-all shrink-0 ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{cat.shortTitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Scrollable Categorized Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5">
                {drawerFilteredCategories.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <p className="text-sm font-bold text-muted-foreground">
                      ไม่พบเมนูที่ตรงกับ &ldquo;{drawerSearch}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerSearch("");
                        setDrawerCategoryFilter("all");
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline border-0 bg-transparent cursor-pointer"
                    >
                      แสดงเมนูทั้งหมด
                    </button>
                  </div>
                ) : (
                  drawerFilteredCategories.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={cat.id} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${cat.color} text-white shrink-0`}
                          >
                            <CatIcon className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-xs font-extrabold text-foreground">
                            {cat.title}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}
                          >
                            {cat.items.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {cat.items.map((item) => {
                            const Icon = ICON_MAP[item.key] || Home;
                            const isActive = item.key === activeTab;

                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => handleSelectTab(item.key)}
                                className={`flex items-center gap-2.5 p-3 min-h-[52px] rounded-2xl text-left transition-all border cursor-pointer ${
                                  isActive
                                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                                    : "bg-surface-2/70 hover:bg-indigo-50/70 dark:hover:bg-indigo-500/15 text-foreground border-border/80 hover:border-indigo-300 dark:hover:border-indigo-500/40"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isActive
                                      ? "bg-white/20 text-white"
                                      : "bg-card text-indigo-600 dark:text-indigo-400 border border-border/60"
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold leading-snug line-clamp-2">
                                    {item.label}
                                  </div>
                                </div>
                                {isActive && (
                                  <Check className="w-4 h-4 shrink-0 text-white" />
                                )}
                              </button>
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
        </ModalPortal>
      )}
    </div>
  );
}
