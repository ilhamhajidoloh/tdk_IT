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

interface ScoreStatusBadgeProps {
  isCombined: boolean;
  hasMidterm: boolean;
  hasFinal: boolean;
}

function ScoreStatusBadge({ isCombined, hasMidterm, hasFinal }: ScoreStatusBadgeProps) {
  const complete = hasMidterm && (isCombined || hasFinal);
  const hasAny = hasMidterm || hasFinal;
  const containerClass = complete
    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
    : hasAny
      ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
      : "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10";
  const statusClass = (done: boolean) => done
    ? "text-emerald-700 dark:text-emerald-300"
    : "text-rose-600 dark:text-rose-300";

  return (
    <div className={`inline-flex w-[158px] max-w-full flex-col gap-1 rounded-xl border px-3 py-2 text-left ${containerClass}`}>
      {isCombined ? (
        <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
          <span className="text-muted-foreground">คะแนนรวม</span>
          <span className={statusClass(hasMidterm)}>{hasMidterm ? "กรอกแล้ว" : "ยังไม่กรอก"}</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className="text-muted-foreground">คะแนนเก็บ</span>
            <span className={statusClass(hasMidterm)}>{hasMidterm ? "กรอกแล้ว" : "ยังไม่กรอก"}</span>
          </div>
          <div className="h-px bg-black/5 dark:bg-white/10" />
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className="text-muted-foreground">คะแนนสอบ</span>
            <span className={statusClass(hasFinal)}>{hasFinal ? "กรอกแล้ว" : "ยังไม่กรอก"}</span>
          </div>
        </>
      )}
    </div>
  );
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
                <option key={c.id} value={c.id}>
                  {c.name}{c.name_thai && c.name_thai !== c.name ? ` (${c.name_thai})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Table */}
      {statusSubject && statusClassroom ? (
        (() => {
          const subject = mySubjects.find(s => s.name.trim().toLowerCase() === statusSubject.trim().toLowerCase());
          const isCombined = subject?.subject_type === "activity" && subject.score_display_mode === "combined";
          const getGrade = (studentId: string) => grades.find(g =>
            g.student_id === studentId &&
            g.subject.trim().toLowerCase() === statusSubject.trim().toLowerCase() &&
            g.term === statusTerm
          );
          const getParts = (studentId: string) => {
            const grade = getGrade(studentId);
            return {
              hasMidterm: grade?.midterm_score != null,
              hasFinal: grade?.final_score != null,
            };
          };
          const midtermCount = statusStudents.filter(s => getParts(s.student_id).hasMidterm).length;
          const finalCount = statusStudents.filter(s => getParts(s.student_id).hasFinal).length;
          const completeCount = statusStudents.filter(s => {
            const parts = getParts(s.student_id);
            return parts.hasMidterm && (isCombined || parts.hasFinal);
          }).length;
          return (
            <div className="card-modern overflow-hidden animate-fade-in-up">
              <div className="px-5 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-foreground">วิชา: <span className="gradient-text">{statusSubject}</span></div>
                  <div className="text-xs text-muted-foreground mt-0.5">ห้อง {classrooms.find(c => c.id === statusClassroom)?.name} · เทอม {statusTerm}</div>
                </div>
                <div className="grid grid-cols-2 sm:flex items-stretch gap-2 sm:gap-3">
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{isCombined ? `${completeCount}/${statusStudents.length}` : `${midtermCount}/${statusStudents.length}`}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">{isCombined ? "คะแนนรวม" : "คะแนนเก็บ"}</div>
                  </div>
                  <div className="hidden sm:block w-px h-8 self-center bg-border" />
                  <div className="text-center">
                    <div className={`text-xl font-extrabold ${isCombined ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{isCombined ? `${statusStudents.length - completeCount}/${statusStudents.length}` : `${finalCount}/${statusStudents.length}`}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">{isCombined ? "ยังไม่กรอก" : "คะแนนสอบ"}</div>
                  </div>
                  {!isCombined && <>
                    <div className="hidden sm:block w-px h-8 self-center bg-border" />
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{completeCount}/{statusStudents.length}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">ครบทั้งสองส่วน</div>
                    </div>
                  </>}
                </div>
              </div>

              {/* Progress bar */}
              {statusStudents.length > 0 && (
                <div className="px-5 py-3 border-b border-border/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1.5">
                    <span>{isCombined ? "ความคืบหน้าคะแนนรวม" : "ความคืบหน้าคะแนนเก็บและสอบ"}</span>
                    <span className="gradient-text font-bold">{statusStudents.length > 0 ? Math.round((completeCount / statusStudents.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 shadow-sm"
                      style={{ width: `${statusStudents.length > 0 ? Math.round((completeCount / statusStudents.length) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-indigo-100/40 dark:border-indigo-500/25 text-foreground text-xs">
                      <th className="px-5 py-3.5 text-center font-bold w-14">#</th>
                      <th className="px-5 py-3.5 font-bold w-32">รหัส</th>
                      <th className="px-5 py-3.5 font-bold">ชื่อนักเรียน</th>
                      <th className="px-5 py-3.5 text-center font-bold w-56">สถานะคะแนน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {statusStudents.map((s, idx) => {
                      const { hasMidterm, hasFinal } = getParts(s.student_id);
                      const has = hasMidterm && (isCombined || hasFinal);
                      return (
                        <tr key={s.id} className={`hover:bg-muted/70 transition-colors ${has ? "bg-emerald-50/40 dark:bg-emerald-500/10" : ""}`}>
                          <td className="px-5 py-4 text-center text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400 text-xs">{s.student_id}</td>
                          <td className="px-5 py-4 font-medium text-foreground">{s.name}</td>
                          <td className="px-5 py-3 text-center align-middle">
                            <ScoreStatusBadge isCombined={isCombined} hasMidterm={hasMidterm} hasFinal={hasFinal} />
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
                {statusStudents.map(s => {
                  const { hasMidterm, hasFinal } = getParts(s.student_id);
                  const has = hasMidterm && (isCombined || hasFinal);
                  return (
                    <div key={s.id} className={`flex items-start justify-between gap-3 p-4 ${has ? "bg-emerald-50/40 dark:bg-emerald-500/10" : ""}`}>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="font-semibold text-foreground">{s.name}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">{s.student_id}</div>
                      </div>
                      <ScoreStatusBadge isCombined={isCombined} hasMidterm={hasMidterm} hasFinal={hasFinal} />
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
