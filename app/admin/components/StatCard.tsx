import { STAT_COLOR_MAP } from "./SectionHeader";
import { resolveIcon } from "./iconMap";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color: keyof typeof STAT_COLOR_MAP;
}

export default function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  const Icon = resolveIcon(icon);

  return (
    <div className="card-interactive rounded-2xl p-5 group">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${STAT_COLOR_MAP[color]} transition-transform group-hover:scale-105`}
      >
        {Icon ? (
          <Icon className="w-5 h-5" />
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        )}
      </div>
      <div className="text-2xl font-extrabold text-foreground leading-tight">{value}</div>
      <div className="text-sm text-muted-foreground font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs text-subtle-foreground mt-1">{sub}</div>}
    </div>
  );
}
