import { NAV_TABS, type Tab } from "./types";

interface TabNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  enterBadge?: string;
  homeroomBadge?: number;
}

export default function TabNav({ activeTab, setActiveTab, enterBadge, homeroomBadge }: TabNavProps) {
  return (
    <div className="sticky top-16 z-10 py-3 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <nav className="ui-segment flex gap-1 overflow-x-auto scrollbar-none">
          {NAV_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-active={activeTab === tab.key}
              className="ui-segment-item !flex-none px-4 whitespace-nowrap"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
              </svg>
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
          ))}
        </nav>
      </div>
    </div>
  );
}
