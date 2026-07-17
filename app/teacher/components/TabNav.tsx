"use client";

import {
  LayoutDashboard,
  PenLine,
  ClipboardCheck,
  Users,
  Clock,
  CalendarDays,
  Award,
  CircleCheck,
  BookOpen,
} from "lucide-react";
import { NAV_TABS, type Tab } from "./types";

const TAB_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  enter: PenLine,
  status: ClipboardCheck,
  homeroom: Users,
  "yearly-average": Clock,
  schedule: CalendarDays,
  evaluate: Award,
  attendance: CircleCheck,
  books: BookOpen,
};

interface TabNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  enterBadge?: string;
  homeroomBadge?: number;
  isClerical?: boolean;
}

export default function TabNav({
  activeTab,
  setActiveTab,
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
    <div className="sticky top-16 z-10 py-3 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <nav className="ui-segment flex gap-1 overflow-x-auto scrollbar-none">
          {visibleTabs.map((tab) => {
            const Icon = TAB_ICON_MAP[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                data-active={activeTab === tab.key}
                className="ui-segment-item !flex-none px-4 whitespace-nowrap"
              >
                {Icon ? (
                  <Icon className="w-4 h-4 shrink-0" />
                ) : (
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d={tab.icon}
                    />
                  </svg>
                )}
                {tab.label}
                {tab.key === "enter" && enterBadge && (
                  <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {enterBadge}
                  </span>
                )}
                {tab.key === "homeroom" && homeroomBadge !== undefined && (
                  <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {homeroomBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
