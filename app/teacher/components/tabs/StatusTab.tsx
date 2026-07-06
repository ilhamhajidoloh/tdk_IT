import { type DBStudent, type DBGrade, type DBClassroom, type DBSubject } from "../types";

interface StatusTabProps {
  mySubjects: DBSubject[];
  statusSubject: string;
  setStatusSubject: (name: string) => void;
  statusClassroom: string;
  setStatusClassroom: (id: string) => void;
  classrooms: DBClassroom[];
  statusStudents: DBStudent[];
  statusTerm: string;
  grades: DBGrade[];
}

export default function StatusTab({
  mySubjects,
  statusSubject,
  setStatusSubject,
  statusClassroom,
  setStatusClassroom,
  classrooms,
  statusStudents,
  statusTerm,
  grades,
}: StatusTabProps) {
  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="card-modern p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">รายวิชา</label>
            <select
              value={statusSubject}
              onChange={e => { setStatusSubject(e.target.value); setStatusClassroom(""); }}
              className="input-modern w-full px-4 py-2.5 text-sm font-semibold"
            >
              <option value="">— เลือกรายวิชา —</option>
              {mySubjects.map((s, i) => (
                <option key={i} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">ชั้นเรียน</label>
            <select
              value={statusClassroom}
              onChange={e => setStatusClassroom(e.target.value)}
              disabled={!statusSubject}
              className="input-modern w-full px-4 py-2.5 text-sm font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              <option value="">— เลือกชั้นเรียน —</option>
              {classrooms.filter(c => mySubjects.find(s => s.name === statusSubject)?.classroom_ids?.includes(c.id)).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Table */}
      {statusSubject && statusClassroom ? (
        (() => {
          const hasCnt = statusStudents.filter(s => grades.some(g => g.student_id === s.student_id && g.subject.trim().toLowerCase() === statusSubject.trim().toLowerCase() && g.term === statusTerm)).length;
          return (
            <div className="card-modern overflow-hidden animate-fade-in-up">
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-foreground">วิชา: <span className="gradient-text">{statusSubject}</span></div>
                  <div className="text-xs text-muted-foreground mt-0.5">ห้อง {classrooms.find(c => c.id === statusClassroom)?.name} · เทอม {statusTerm}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{hasCnt}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">บันทึกแล้ว</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-rose-500 dark:text-rose-400">{statusStudents.length - hasCnt}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">ยังไม่บันทึก</div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {statusStudents.length > 0 && (
                <div className="px-5 py-3 border-b border-border/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1.5">
                    <span>ความคืบหน้า</span>
                    <span className="gradient-text font-bold">{Math.round((hasCnt / statusStudents.length) * 100)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 shadow-sm"
                      style={{ width: `${statusStudents.length > 0 ? Math.round((hasCnt / statusStudents.length) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-indigo-100/40 dark:border-indigo-500/25 text-foreground text-xs">
                      <th className="px-5 py-3.5 text-center font-bold w-10">#</th>
                      <th className="px-5 py-3.5 font-bold w-28">รหัส</th>
                      <th className="px-5 py-3.5 font-bold">ชื่อนักเรียน</th>
                      <th className="px-5 py-3.5 text-center font-bold w-32">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {statusStudents.map((s, idx) => {
                      const has = grades.some(g => g.student_id === s.student_id && g.subject.trim().toLowerCase() === statusSubject.trim().toLowerCase() && g.term === statusTerm);
                      return (
                        <tr key={s.id} className={`hover:bg-muted ${has ? "bg-emerald-50/40 dark:bg-emerald-500/10" : ""}`}>
                          <td className="px-5 py-3.5 text-center text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400 text-xs">{s.student_id}</td>
                          <td className="px-5 py-3.5 font-medium text-foreground">{s.name}</td>
                          <td className="px-5 py-3.5 text-center">
                            {has ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                บันทึกแล้ว
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold text-xs">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                ยังไม่บันทึก
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {statusStudents.length === 0 && (
                      <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">ไม่มีนักเรียนในห้องนี้</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-border">
                {statusStudents.map((s, idx) => {
                  const has = grades.some(g => g.student_id === s.student_id && g.subject.trim().toLowerCase() === statusSubject.trim().toLowerCase() && g.term === statusTerm);
                  return (
                    <div key={s.id} className={`flex items-center justify-between p-4 ${has ? "bg-emerald-50/40 dark:bg-emerald-500/10" : ""}`}>
                      <div>
                        <div className="font-semibold text-foreground">{s.name}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">{s.student_id}</div>
                      </div>
                      {has ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          บันทึกแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold text-xs">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          ยังไม่บันทึก
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      ) : (
        <div className="text-center py-20 text-muted-foreground animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 dark:from-indigo-500/10 to-violet-100 dark:to-violet-500/10 flex items-center justify-center shadow-lg shadow-indigo-100/30">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="font-bold text-foreground text-base">{!statusSubject ? "เลือกรายวิชาเพื่อดูสถานะ" : "เลือกชั้นเรียนเพื่อดูรายชื่อ"}</p>
          <p className="text-sm text-muted-foreground mt-1">ตรวจสอบความคืบหน้าการบันทึกคะแนน</p>
        </div>
      )}
    </div>
  );
}
