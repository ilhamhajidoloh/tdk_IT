"use client";

import {
  LayoutDashboard,
  PenLine,
  ClipboardCheck,
  Users,
  TrendingUp,
  CalendarDays,
  Award,
  CircleCheck,
  BookOpen,
  Bell,
} from "lucide-react";
import { NAV_TABS, type Tab } from "./types";

const TAB_ICON_MAP: Record<Tab, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  enter: PenLine,
  status: ClipboardCheck,
  homeroom: Users,
  "yearly-average": TrendingUp,
  schedule: CalendarDays,
  evaluate: Award,
  attendance: CircleCheck,
  books: BookOpen,
  news: Bell,
};

interface TabNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onTabChange?: (tab: Tab) => void;
  enterBadge?: string;
  homeroomBadge?: number;
  isClerical?: boolean;
}

export default function TabNav({
  activeTab,
  setActiveTab,
  onTabChange,
  enterBadge,
  homeroomBadge,
  isClerical,
}: TabNavProps) {
  const visibleTabs = isClerical
    ? [
        ...NAV_TABS,
        {
          key: "books" as Tab,
          label: "หนังสือรับ-ส่ง",
          icon: "",
        },
      ]
    : NAV_TABS;

  return (
    <nav
      aria-label="เมนูหลักครูผู้สอน"
      className="sticky top-16 z-20 border-b border-border bg-card/75 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {visibleTabs.map((tab) => {
            const Icon = TAB_ICON_MAP[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => (onTabChange ?? setActiveTab)(tab.key)}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                )}
                <span>{tab.label}</span>
                {tab.key === "enter" && enterBadge && (
                  <span
                    className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {enterBadge}
                  </span>
                )}
                {tab.key === "homeroom" && homeroomBadge !== undefined && (
                  <span
                    className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {homeroomBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
