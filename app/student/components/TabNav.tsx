"use client";

import {
  CircleUser,
  ClipboardList,
  Clock,
  CalendarDays,
  Award,
} from "lucide-react";
import { NAV_TABS, type Tab } from "./types";

const TAB_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: CircleUser,
  grades: ClipboardList,
  "yearly-average": Clock,
  schedule: CalendarDays,
  evaluation: Award,
};

interface TabNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  gradesCount: number;
}

export default function TabNav({ activeTab, setActiveTab, gradesCount }: TabNavProps) {
  return (
    <div className="sticky top-16 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-3">
        <div className="ui-segment inline-flex">
          {NAV_TABS.map((tab) => {
            const Icon = TAB_ICON_MAP[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                data-active={activeTab === tab.key}
                className="ui-segment-item px-4 !flex-none"
              >
                {Icon ? (
                  <Icon className="w-4 h-4 shrink-0" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
                  </svg>
                )}
                {tab.label}
                {tab.key === "grades" && gradesCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {gradesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
