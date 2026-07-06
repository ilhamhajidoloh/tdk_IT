import { type SchedulePeriod, type ScheduleEntry, type DaySetting, DAY_COLORS } from "../types";

interface ScheduleTabProps {
  schedulePeriods: SchedulePeriod[];
  myScheduleEntries: ScheduleEntry[];
  activeDays: DaySetting[];
  onExport: () => void;
}

export default function ScheduleTab({ schedulePeriods, myScheduleEntries, activeDays, onExport }: ScheduleTabProps) {
  if (schedulePeriods.length === 0) {
    return (
      <div className="space-y-5">
        <div className="card-modern p-12 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 dark:from-indigo-500/10 to-violet-100 dark:to-violet-500/10 flex items-center justify-center shadow-lg shadow-indigo-100/30">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">ยังไม่มีตารางสอน</h3>
          <p className="text-sm text-muted-foreground">แอดมินยังไม่ได้กำหนดคาบเรียนในเทอมนี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Export button */}
      {myScheduleEntries.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onExport}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            พิมพ์ตารางสอน
          </button>
        </div>
      )}
      {/* Quick view: my schedule as cards per day */}
      {myScheduleEntries.length === 0 ? (
        <div className="card-modern p-10 text-center text-muted-foreground">
          <p className="font-semibold">ยังไม่มีตารางสอนสำหรับคุณในเทอมนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {activeDays.map(day => {
            const dayEntries = myScheduleEntries.filter(e => Number(e.day_of_week) === day.value);
            if (dayEntries.length === 0) return null;
            return (
              <div key={day.value} className="card-modern overflow-hidden animate-fade-in-up hover:scale-[1.01] transition-transform duration-200">
                <div className={`px-4 py-3.5 flex items-center gap-2 border-b ${DAY_COLORS[day.value]} bg-gradient-to-r`}>
                  <span className="font-extrabold text-sm">วัน{day.label}</span>
                  <span className="ml-auto text-xs font-semibold opacity-70">{dayEntries.length} คาบ</span>
                </div>
                <div className="divide-y divide-border">
                  {dayEntries
                    .sort((a, b) => Number(a.period_no) - Number(b.period_no))
                    .map(e => {
                      const period = schedulePeriods.find(p => p.id === e.period_id);
                      return (
                        <div key={e.id} className="p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors">
                          <div className="shrink-0 text-center w-12 py-1 px-1 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:to-indigo-500/10">
                            <div className="text-xs font-extrabold text-foreground">คาบ {e.period_no}</div>
                            <div className="text-[10px] text-muted-foreground">{e.start_time}</div>
                            <div className="text-[10px] text-muted-foreground">{e.end_time}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-foreground text-sm truncate">{e.subject_name}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-100/60 dark:border-indigo-500/25">
                                ห้อง {e.classroom_name}
                              </span>
                              {period?.label && (
                                <span className="text-xs bg-amber-50/80 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-100/60 dark:border-amber-500/25">
                                  {period.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full schedule grid */}
      <div className="card-modern overflow-hidden hidden md:block">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="font-bold text-foreground text-sm">ตารางเรียนทั้งหมด (ทุกวิชา ทุกห้อง)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted border-b border-indigo-100/40 dark:border-indigo-500/25 text-foreground">
                <th className="px-3 py-3 text-left font-bold sticky left-0 bg-muted z-10 min-w-[80px]">คาบ</th>
                {activeDays.map(d => (
                  <th key={d.value} className="px-3 py-3 text-center font-semibold min-w-[100px]">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${DAY_COLORS[d.value]}`}>{d.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedulePeriods.map(p => (
                <tr key={p.id} className="hover:bg-muted/80 transition-colors">
                  <td className="px-3 py-2.5 sticky left-0 bg-card font-semibold text-foreground whitespace-nowrap z-10">
                    <div>คาบ {p.period_no}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">{p.start_time}–{p.end_time}</div>
                    {p.label && <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{p.label}</div>}
                  </td>
                  {p.is_break ? (
                    <td colSpan={activeDays.length} className="px-2 py-2 align-middle text-center bg-muted border border-border rounded-md">
                      <div className="font-bold text-muted-foreground tracking-widest">{p.label || "พักเบรก"}</div>
                    </td>
                  ) : (
                    activeDays.map(d => {
                      const entries = myScheduleEntries.filter(e => Number(e.day_of_week) === d.value && e.period_id === p.id);
                      return (
                        <td key={d.value} className="px-2 py-2 text-center align-top">
                          {entries.length === 0 ? (
                            <span className="text-subtle-foreground">–</span>
                          ) : (
                            <div className="space-y-1">
                              {entries.map(e => (
                                <div key={e.id} className="bg-gradient-to-br from-indigo-50 dark:from-indigo-500/10 to-violet-50/50 dark:to-violet-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100/60 dark:border-indigo-500/25 rounded-lg px-2 py-1.5 text-[11px] font-semibold shadow-sm">
                                  <div className="truncate">{e.subject_name}</div>
                                  <div className="text-indigo-400 font-normal text-[10px]">{e.classroom_name}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
