import { type SchedulePeriod, type ScheduleEntry, type DaySetting } from "../types";

interface ScheduleTabProps {
  schedulePeriods: SchedulePeriod[];
  scheduleEntries: ScheduleEntry[];
  classroomId: string | null;
  activeDays: DaySetting[];
  onExport: () => void;
}

export default function ScheduleTab({
  schedulePeriods,
  scheduleEntries,
  classroomId,
  activeDays,
  onExport,
}: ScheduleTabProps) {
  return (
    <div className="space-y-5 animate-fade-in-up">
      {schedulePeriods.length === 0 ? (
        <div className="ui-card p-14 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "var(--primary-soft)" }}>
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-bold text-foreground mb-1 text-base">ยังไม่มีตารางเรียน</h3>
          <p className="text-sm text-muted-foreground">แอดมินยังไม่ได้กำหนดตารางเรียนในเทอมนี้</p>
        </div>
      ) : (
        <>
          {/* Export button */}
          <div className="flex justify-end">
            <button onClick={onExport} className="ui-btn ui-btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              พิมพ์ตารางเรียน
            </button>
          </div>
          {/* Day-by-day Card View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 stagger-children">
            {activeDays.map(day => {
              const dayEntries = scheduleEntries.filter(e => e.classroom_id === classroomId && Number(e.day_of_week) === day.value);
              if (dayEntries.length === 0) return null;
              const isToday = new Date().getDay() === day.value;
              return (
                <div key={day.value} className={`ui-card overflow-hidden ${isToday ? "ring-2 ring-primary/40" : ""}`}>
                  {/* Gradient day header */}
                  <div className={`px-5 py-3.5 flex items-center gap-2 bg-gradient-to-r ${day.gradient} text-white border-b border-white/20`}>
                    <span className="font-extrabold text-sm drop-shadow-sm">วัน{day.label}</span>
                    {isToday && (
                      <span className="ml-1 text-[10px] font-bold bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">วันนี้</span>
                    )}
                    <span className="ml-auto text-xs font-semibold opacity-90">{dayEntries.length} คาบ</span>
                  </div>
                  <div className="divide-y divide-border">
                    {dayEntries.sort((a, b) => Number(a.period_no) - Number(b.period_no)).map(e => {
                      const period = schedulePeriods.find(p => p.id === e.period_id);
                      return (
                        <div key={e.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted transition-colors">
                          <div className="shrink-0 text-center w-10">
                            <div className="text-xs font-extrabold text-muted-foreground">คาบ {e.period_no}</div>
                            <div className="text-[10px] text-subtle-foreground">{e.start_time}</div>
                          </div>
                          <div className="w-px h-8 bg-border" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-foreground text-sm truncate">{e.subject_name}</div>
                            {(() => { const t = e.teacher_name || (e.teacher_names?.length ? e.teacher_names.join(", ") : null); return t ? <div className="text-[11px] text-muted-foreground mt-0.5">อ.{t}</div> : null; })()}
                          </div>
                          {period?.label && (
                            <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">{period.label}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full grid table */}
          <div className="ui-card overflow-hidden hidden md:block">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground text-sm">ตารางเรียนแบบตาราง</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted border-b border-border text-muted-foreground">
                    <th className="px-3 py-3.5 text-left font-semibold sticky left-0 bg-muted z-10 min-w-[72px]">คาบ</th>
                    {activeDays.map(d => (
                      <th key={d.value} className="px-2 py-3.5 text-center font-semibold min-w-[90px]">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${d.color}`}>{d.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schedulePeriods.map(p => (
                    <tr key={p.id} className="hover:bg-muted/60 transition-colors">
                      <td className="px-3 py-2.5 sticky left-0 bg-card font-semibold text-foreground whitespace-nowrap z-10">
                        <div>คาบ {p.period_no}</div>
                        <div className="text-[10px] text-subtle-foreground font-normal">{p.start_time}–{p.end_time}</div>
                        {p.label && <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{p.label}</div>}
                      </td>
                      {p.is_break ? (
                        <td colSpan={activeDays.length} className="px-2 py-2.5 align-middle text-center bg-muted border border-border">
                          <div className="font-bold text-subtle-foreground tracking-widest">{p.label || "พักเบรก"}</div>
                        </td>
                      ) : (
                        activeDays.map(d => {
                          const entry = scheduleEntries.find(e => e.classroom_id === classroomId && Number(e.day_of_week) === d.value && e.period_id === p.id);
                          return (
                            <td key={d.value} className="px-2 py-2 text-center align-top">
                              {entry ? (
                                <div className="bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30 rounded-xl px-2 py-2 text-[11px] font-semibold">
                                  <div className="truncate">{entry.subject_name}</div>
                                  {(() => { const t = entry.teacher_name || (entry.teacher_names?.length ? entry.teacher_names.join(", ") : null); return t ? <div className="text-violet-400 font-normal text-[10px] truncate">อ.{t}</div> : null; })()}
                                </div>
                              ) : (
                                <span className="text-border">–</span>
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
        </>
      )}
    </div>
  );
}
