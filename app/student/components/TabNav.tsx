"use client";

import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  CalendarDays,
  Award,
  Bell,
} from "lucide-react";
import { NAV_TABS, type Tab } from "./types";

const TAB_ICON_MAP: Record<Tab, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  grades: ClipboardList,
  "yearly-average": TrendingUp,
  schedule: CalendarDays,
  evaluation: Award,
  news: Bell,
};

const SHORT_LABELS: Record<Tab, string> = {
  overview: "หน้าหลัก",
  grades: "ผลการเรียน",
  "yearly-average": "เฉลี่ยปี",
  schedule: "ตารางเรียน",
  evaluation: "ประเมิน",
  news: "ข่าวสาร",
};

interface TabNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  gradesCount: number;
}

export default function TabNav({ activeTab, setActiveTab, gradesCount }: TabNavProps) {
  return (
    <>
      {/* ── DESKTOP & TABLET STICKY TAB BAR ── */}
      <nav
        aria-label="เมนูหลักนักเรียน"
        className="hidden sm:block sticky top-16 z-20 border-b border-border bg-card/75 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {NAV_TABS.map((tab) => {
              const Icon = TAB_ICON_MAP[tab.key];
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all border shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.key === "grades" && gradesCount > 0 && (
                    <span
                      className={`ml-0.5 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {gradesCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav
        aria-label="เมนูหลักมือถือ"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-xl border-t border-border shadow-lg px-1.5 py-1.5"
      >
        <div className="flex items-stretch justify-around gap-0.5 overflow-x-auto scrollbar-hide">
          {NAV_TABS.map((tab) => {
            const Icon = TAB_ICON_MAP[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={`mob-${tab.key}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex min-w-13 flex-1 flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
                  isActive
                    ? "text-primary font-semibold bg-primary/8"
                    : "text-muted-foreground hover:text-foreground font-medium"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
                )}
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? "scale-105 text-primary" : "text-muted-foreground"
                    }`}
                  />
                  {tab.key === "grades" && gradesCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-card">
                      {gradesCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 truncate max-w-full leading-none">
                  {SHORT_LABELS[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
