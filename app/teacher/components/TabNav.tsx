import { NAV_TABS, type Tab } from "./types";

interface TabNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  enterBadge?: string;
  homeroomBadge?: number;
  isClerical?: boolean;
}

export default function TabNav({ activeTab, setActiveTab, enterBadge, homeroomBadge, isClerical }: TabNavProps) {
  const visibleTabs = isClerical
    ? [
        ...NAV_TABS,
        {
          key: "books" as Tab,
          label: "หนังสือรับ-ส่ง",
          icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
        },
      ]
    : NAV_TABS;

  return (
    <div className="sticky top-16 z-10 py-3 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <nav className="ui-segment flex gap-1 overflow-x-auto scrollbar-none">
          {visibleTabs.map(tab => (
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
