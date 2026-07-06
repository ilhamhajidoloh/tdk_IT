import { type ReactNode } from "react";

export const STAT_COLOR_MAP: Record<string, string> = {
  indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  green: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
  purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  slate: "bg-muted text-foreground",
};

export default function SectionHeader({
  icon,
  color,
  title,
  subtitle,
  count,
  countLabel,
  children,
}: {
  icon: string;
  color: keyof typeof STAT_COLOR_MAP;
  title: string;
  subtitle: string;
  count?: number;
  countLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${STAT_COLOR_MAP[color]} shadow-sm`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl font-extrabold text-foreground">{title}</h2>
            {count !== undefined && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-50 dark:from-indigo-500/10 to-violet-50 dark:to-violet-500/10 text-indigo-600 dark:text-indigo-400 border border-border/50/50">
                {count}
                {countLabel ? ` ${countLabel}` : ""}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        </div>
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
