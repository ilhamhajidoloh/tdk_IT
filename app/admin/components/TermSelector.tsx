export default function TermSelector({
  settingsList,
  selectedId,
  onSelect,
}: {
  settingsList: { id: number; academic_year: string; term: string; is_active?: boolean }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  if (settingsList.length === 0) {
    return (
      <div className="mb-6 px-5 py-4 rounded-2xl border border-dashed border-border bg-muted text-sm text-subtle-foreground">
        ยังไม่มีปีการศึกษาในระบบ กรุณาเพิ่มที่แท็บ ตั้งค่าระบบ
      </div>
    );
  }
  return (
    <div className="mb-6 p-3.5 rounded-2xl border border-border/80 bg-muted">
      <div className="text-xs font-bold text-subtle-foreground uppercase tracking-wider mb-2.5 px-1">
        เลือกปีการศึกษา / เทอม
      </div>
      <div className="flex flex-wrap gap-2">
        {settingsList.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
              selectedId === s.id
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-lg shadow-indigo-200/50/50"
                : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:shadow-sm"
            }`}
          >
            ปี {s.academic_year} เทอม {s.term}
            {s.is_active && (
              <span
                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  selectedId === s.id
                    ? "bg-card/20 text-white"
                    : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                Active
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
