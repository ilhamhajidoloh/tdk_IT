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

const SHORT_LABELS: Record<string, string> = {
  overview: "โปรไฟล์",
  grades: "เกรด",
  "yearly-average": "เฉลี่ยปี",
  schedule: "ตาราง",
  evaluation: "ประเมิน",
};

interface TabNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  gradesCount: number;
}

export default function TabNav({ activeTab, setActiveTab, gradesCount }: TabNavProps) {
  return (
    <>
      {/* ── TOP STICKY BAR (Responsive Scroll on Mobile / Segment on Desktop) ── */}
      <div className="sticky top-16 z-10 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-screen-lg mx-auto px-3 sm:px-6 py-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {NAV_TABS.map((tab) => {
              const Icon = TAB_ICON_MAP[tab.key];
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-indigo-200/40 scale-[1.02]"
                      : "bg-card/70 text-muted-foreground border-border/80 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {Icon ? (
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
                    </svg>
                  )}
                  <span>{tab.label}</span>
                  {tab.key === "grades" && gradesCount > 0 && (
                    <span
                      className={`ml-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-primary text-primary-foreground"
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
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION (Fixed Bottom Bar on < sm screens) ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl px-2 py-1.5 pb-safe">
        <div className="grid grid-cols-5 gap-1">
          {NAV_TABS.map((tab) => {
            const Icon = TAB_ICON_MAP[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={`mob-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all border-0 cursor-pointer ${
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                }`}
              >
                {/* Active pill indicator */}
                {isActive && (
                  <span className="absolute -top-1 w-6 h-1 bg-primary rounded-full animate-fade-in" />
                )}
                <div className="relative">
                  {Icon && (
                    <Icon
                      className={`w-5 h-5 transition-transform ${
                        isActive ? "scale-110 text-primary" : "text-muted-foreground"
                      }`}
                    />
                  )}
                  {tab.key === "grades" && gradesCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-card">
                      {gradesCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 truncate max-w-full leading-none">
                  {SHORT_LABELS[tab.key] || tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
