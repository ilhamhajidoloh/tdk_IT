interface StudentGradeDetail {
  id: string;
  student_id: string;
  student_name: string;
  student_number: number | null;
  midterm_score: number | null;
  final_score: number | null;
}

interface StudentDetailModalProps {
  modalState: {
    open: boolean;
    subjectName: string;
    classroomName: string;
    teacherName: string;
    midtermMax: number;
    finalMax: number;
    students: StudentGradeDetail[];
    loading: boolean;
  };
  onClose: () => void;
}

export default function StudentDetailModal({ modalState, onClose }: StudentDetailModalProps) {
  if (!modalState.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in-up overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl border border-border shadow-2xl glass-strong w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 relative px-5 sm:px-6 py-4 flex items-center gap-4 border-b border-border bg-card">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md text-white bg-gradient-to-br from-amber-500 to-orange-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-foreground leading-tight truncate">
              {modalState.subjectName}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {modalState.classroomName} — ครูผู้สอน: {modalState.teacherName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-full transition-all cursor-pointer border-0 bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {modalState.loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
              <p className="text-muted-foreground font-semibold text-sm">กำลังโหลดรายชื่อ...</p>
            </div>
          ) : modalState.students.length === 0 ? (
            <div className="text-center py-12 text-subtle-foreground font-semibold">ไม่มีนักเรียนในห้องนี้</div>
          ) : (
            (() => {
              const ss = modalState.students;
              const done = ss.filter((s) => s.midterm_score !== null && s.final_score !== null).length;
              const partial = ss.filter(
                (s) =>
                  (s.midterm_score !== null || s.final_score !== null) &&
                  !(s.midterm_score !== null && s.final_score !== null)
              ).length;
              const notStarted = ss.length - done - partial;
              return (
                <>
                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-muted text-foreground">
                      ทั้งหมด {ss.length} คน
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      ครบแล้ว {done}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      กรอกบางส่วน {partial}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      ยังไม่เริ่ม {notStarted}
                    </span>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5 font-bold text-xs w-12">ลำดับ</th>
                          <th className="px-4 py-2.5 font-bold text-xs">ชื่อ-นามสกุล</th>
                          <th className="px-4 py-2.5 font-bold text-xs text-center">
                            เก็บ (/{modalState.midtermMax})
                          </th>
                          <th className="px-4 py-2.5 font-bold text-xs text-center">
                            สอบ (/{modalState.finalMax})
                          </th>
                          <th className="px-4 py-2.5 font-bold text-xs text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {ss.map((s, idx) => {
                          const hasMid = s.midterm_score !== null;
                          const hasFin = s.final_score !== null;
                          const isDone = hasMid && hasFin;
                          const isPartial = (hasMid || hasFin) && !isDone;

                          return (
                            <tr
                              key={s.id}
                              className={`transition-colors ${
                                isDone
                                  ? "bg-emerald-50/30 dark:bg-emerald-500/10"
                                  : isPartial
                                  ? "bg-amber-50/30 dark:bg-amber-500/10"
                                  : ""
                              }`}
                            >
                              <td className="px-4 py-2.5 text-xs text-subtle-foreground font-semibold">
                                {s.student_number || idx + 1}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="text-sm font-semibold text-foreground">{s.student_name}</div>
                                <div className="text-[10px] text-subtle-foreground">{s.student_id}</div>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {hasMid ? (
                                  <span className="text-sm font-bold text-foreground">{s.midterm_score}</span>
                                ) : (
                                  <span className="text-xs text-subtle-foreground">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {hasFin ? (
                                  <span className="text-sm font-bold text-foreground">{s.final_score}</span>
                                ) : (
                                  <span className="text-xs text-subtle-foreground">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {isDone ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    ครบ
                                  </span>
                                ) : isPartial ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M12 8v4l3 3"
                                      />
                                    </svg>
                                    บางส่วน
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-subtle-foreground">
                                    ยังไม่มี
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {ss.map((s, idx) => {
                      const hasMid = s.midterm_score !== null;
                      const hasFin = s.final_score !== null;
                      const isDone = hasMid && hasFin;
                      const isPartial = (hasMid || hasFin) && !isDone;

                      return (
                        <div
                          key={`sd-${s.id}`}
                          className={`p-3 rounded-xl border border-border transition-colors ${
                            isDone
                              ? "bg-emerald-50/30 dark:bg-emerald-500/10 border-emerald-200/50"
                              : isPartial
                              ? "bg-amber-50/30 dark:bg-amber-500/10 border-amber-200/50"
                              : "bg-card"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                                เลขที่ {s.student_number || idx + 1}
                              </div>
                              <div className="text-sm font-semibold text-foreground">{s.student_name}</div>
                              <div className="text-[10px] text-subtle-foreground">รหัส {s.student_id}</div>
                            </div>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                ครบ
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M12 8v4l3 3"
                                  />
                                </svg>
                                บางส่วน
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-subtle-foreground shrink-0">
                                ยังไม่มี
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                            <div>
                              <span className="text-subtle-foreground font-medium">
                                คะแนนเก็บ (/{modalState.midtermMax}):
                              </span>{" "}
                              {hasMid ? (
                                <span className="font-bold text-foreground">{s.midterm_score}</span>
                              ) : (
                                <span className="text-subtle-foreground">—</span>
                              )}
                            </div>
                            <div>
                              <span className="text-subtle-foreground font-medium">
                                คะแนนสอบ (/{modalState.finalMax}):
                              </span>{" "}
                              {hasFin ? (
                                <span className="font-bold text-foreground">{s.final_score}</span>
                              ) : (
                                <span className="text-subtle-foreground">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-card border-t border-border flex justify-end rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground hover:text-foreground bg-muted hover:bg-border transition-all cursor-pointer border-0"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
