import { resolveIcon } from "./iconMap";

interface QuickLinkCardProps {
  label: string;
  sub: string;
  icon: string;
  onClick: () => void;
}

export default function QuickLinkCard({ label, sub, icon, onClick }: QuickLinkCardProps) {
  const Icon = resolveIcon(icon);

  return (
    <button
      onClick={onClick}
      className="card-interactive flex items-center gap-4 p-4 text-left cursor-pointer group"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-50 dark:from-indigo-500/10 to-violet-50 dark:to-violet-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-indigo-200/50">
        {Icon ? (
          <Icon className="w-5 h-5" />
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-foreground text-sm">{label}</div>
        <div className="text-xs text-subtle-foreground truncate">{sub}</div>
      </div>
    </button>
  );
}
