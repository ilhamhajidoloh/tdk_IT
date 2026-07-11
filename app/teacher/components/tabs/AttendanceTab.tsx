import { ATTENDANCE_STATUSES, type AttendanceStatus, type DBStudent, type DBClassroom, type DBSubject, type AttendanceSummaryRow } from "../types";

interface AttendanceTabProps {
  mySubjects: DBSubject[];
  attendanceSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  attendanceClassroomId: string;
  setAttendanceClassroomId: (id: string) => void;
  attendanceClassroomOptions: DBClassroom[];
  attendanceClassroomStudents: DBStudent[];

  attendanceView: "record" | "summary";
  setAttendanceView: (view: "record" | "summary") => void;

  attendanceDate: string;
  setAttendanceDate: (date: string) => void;
  attendanceStatusMap: Record<string, AttendanceStatus>;
  onSetStatus: (studentId: string, status: AttendanceStatus) => void;
  attendanceLoading: boolean;
  attendanceSaving: boolean;
  onSaveAll: () => void;
  onCancelAttendance: () => void;

  attendanceSummary: AttendanceSummaryRow[];
  attendanceSummaryLoading: boolean;
}

export default function AttendanceTab({
  mySubjects,
  attendanceSubjectId,
  onSelectSubject,
  attendanceClassroomId,
  setAttendanceClassroomId,
  attendanceClassroomOptions,
  attendanceClassroomStudents,
  attendanceView,
  setAttendanceView,
  attendanceDate,
  setAttendanceDate,
  attendanceStatusMap,
  onSetStatus,
  attendanceLoading,
  attendanceSaving,
  onSaveAll,
  onCancelAttendance,
  attendanceSummary,
  attendanceSummaryLoading,
}: AttendanceTabProps) {
  const summaryByStudent = new Map(attendanceSummary.map((r) => [r.student_id, r]));

  return (
    <div className="space-y-5">
      {/* Step 1: Select Subject */}
      <div className="card-modern overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200/40">1</span>
          <div>
            <div className="font-bold text-foreground text-sm">เลือกรายวิชา</div>
            <div className="text-xs text-muted-foreground">วิชาที่คุณสอนในเทอมนี้</div>
          </div>
        </div>
        <div className="p-5">
          {mySubjects.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">ยังไม่มีวิชาที่กำหนดให้คุณสอนในเทอมนี้</div>
          ) : (
            <div className="flex flex-wrap gap-2 stagger-children">
              {mySubjects.map((s) => {
                const isSelected = attendanceSubjectId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectSubject(s.id)}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all duration-200 cursor-pointer animate-fade-in-up ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-lg shadow-indigo-200/40 scale-[1.02]"
                        : "bg-card/80 text-foreground border-border/60 hover:border-indigo-300 hover:bg-indigo-50/60 dark:bg-indigo-500/10 hover:shadow-md hover:shadow-indigo-100/20 hover:scale-[1.01]"
                    }`}
                  >
                    <span className="font-bold text-sm">{s.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Select Classroom */}
      {attendanceSubjectId && (
        <div className="card-modern overflow-hidden animate-fade-in-up">
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200/40">2</span>
            <div className="font-bold text-foreground text-sm">เลือกห้องเรียน</div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger-children">
              {attendanceClassroomOptions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAttendanceClassroomId(c.id)}
                  className={`card-interactive relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-200 cursor-pointer animate-fade-in-up ${
                    attendanceClassroomId === c.id
                      ? "border-indigo-400 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-200/40 scale-[1.03]"
                      : "border-border/60 bg-card/80 text-foreground hover:border-indigo-300 hover:bg-indigo-50/60 dark:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-100/20"
                  }`}
                >
                  <span className="font-extrabold text-base leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Record or Summary */}
      {attendanceSubjectId && attendanceClassroomId && (
        <div className="card-modern overflow-hidden animate-fade-in-up">
          <div className="px-5 py-4 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200/40">3</span>
              <div className="font-bold text-foreground text-sm">เช็คชื่อ</div>
            </div>
            <div className="ui-segment flex gap-1">
              <button
                onClick={() => setAttendanceView("record")}
                data-active={attendanceView === "record"}
                className="ui-segment-item !flex-none px-4 text-xs"
              >
                บันทึกรายวัน
              </button>
              <button
                onClick={() => setAttendanceView("summary")}
                data-active={attendanceView === "summary"}
                className="ui-segment-item !flex-none px-4 text-xs"
              >
                สรุปสถิติ
              </button>
            </div>
          </div>

          {attendanceView === "record" ? (
            <>
              <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground">วันที่</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="text-sm font-semibold bg-card border border-border/60 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {attendanceLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">กำลังโหลดข้อมูล...</div>
              ) : attendanceClassroomStudents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">ไม่มีนักเรียนในชั้นเรียนนี้</div>
              ) : (
                <>
                  <div className="divide-y divide-border">
                    {attendanceClassroomStudents.map((s, idx) => {
                      const status = attendanceStatusMap[s.student_id];
                      return (
                        <div key={s.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs text-muted-foreground w-6 text-center shrink-0">{idx + 1}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground text-sm truncate">{s.name}</div>
                              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{s.student_id}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 shrink-0">
                            {ATTENDANCE_STATUSES.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => onSetStatus(s.student_id, opt.value)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                                  status === opt.value ? opt.color + " scale-105" : "bg-card text-muted-foreground border-border hover:border-indigo-300"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 flex justify-between items-center border-t border-border/60">
                    <div>
                      {Object.keys(attendanceStatusMap).length > 0 && (
                        <button
                          type="button"
                          onClick={onCancelAttendance}
                          disabled={attendanceSaving}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 font-bold px-4 py-2.5 rounded-xl transition-all text-xs cursor-pointer border border-rose-200 dark:border-rose-500/30 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          ยกเลิกการเช็คชื่อวันนี้
                        </button>
                      )}
                    </div>
                    <button
                      onClick={onSaveAll}
                      disabled={attendanceSaving}
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-sm cursor-pointer border-0"
                    >
                      {attendanceSaving ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : attendanceSummaryLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">กำลังโหลดข้อมูล...</div>
          ) : attendanceClassroomStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">ไม่มีนักเรียนในชั้นเรียนนี้</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-muted-foreground border-b border-border/60">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">ชื่อ-สกุล</th>
                    <th className="px-4 py-3 text-center">มา</th>
                    <th className="px-4 py-3 text-center">สาย</th>
                    <th className="px-4 py-3 text-center">ลา</th>
                    <th className="px-4 py-3 text-center">ขาด</th>
                    <th className="px-4 py-3 text-center">รวม</th>
                    <th className="px-4 py-3 text-center">% มาเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceClassroomStudents.map((s, idx) => {
                    const row = summaryByStudent.get(s.student_id);
                    const total = row?.total ?? 0;
                    const percent = total > 0 ? Math.round(((row!.present + row!.late) / total) * 100) : null;
                    return (
                      <tr key={s.id}>
                        <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                        <td className="px-4 py-3 text-center">{row?.present ?? 0}</td>
                        <td className="px-4 py-3 text-center">{row?.late ?? 0}</td>
                        <td className="px-4 py-3 text-center">{row?.leave ?? 0}</td>
                        <td className="px-4 py-3 text-center">{row?.absent ?? 0}</td>
                        <td className="px-4 py-3 text-center font-semibold">{total}</td>
                        <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                          {percent === null ? "-" : `${percent}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!attendanceSubjectId && (
        <div className="text-center py-20 text-muted-foreground animate-fade-in-up">
          <p className="font-bold text-foreground text-base">เริ่มต้นด้วยการเลือกรายวิชาด้านบน</p>
        </div>
      )}
    </div>
  );
}
