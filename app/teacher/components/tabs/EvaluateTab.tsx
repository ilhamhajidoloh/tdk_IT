import { useState, useMemo } from "react";
import { AlertTriangle, ArrowLeft, X } from "lucide-react";
import { formatThaiDateRange } from "../../../lib/format";
import { RWT_TOPICS } from "../../../lib/evaluation";
import { type DBStudent, type DBClassroom, type DBSubject, type EvaluationTopic, type EvaluationRecord } from "../types";

interface EvaluateTabProps {
  isEvalActive: boolean;
  isGradingActive: boolean;
  isEvalTermActive: boolean;
  settingsStartDate: string;
  settingsEndDate: string;

  mySubjects: DBSubject[];
  evalSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  evalClassroomId: string;
  setEvalClassroomId: (id: string) => void;
  evalClassroomOptions: DBClassroom[];
  evalClassroomStudents: DBStudent[];

  evalActiveTopics: EvaluationTopic[];
  evalRecords: EvaluationRecord[];
  evalRecordsLoading: boolean;

  onNavigateBack: () => void;
  onOpenStudent: (student: DBStudent) => void;
  onCancelEvaluation: (student: DBStudent) => void;
}

export default function EvaluateTab({
  isEvalActive,
  isGradingActive,
  isEvalTermActive,
  settingsStartDate,
  settingsEndDate,
  mySubjects,
  evalSubjectId,
  onSelectSubject,
  evalClassroomId,
  setEvalClassroomId,
  evalClassroomOptions,
  evalClassroomStudents,
  evalActiveTopics,
  evalRecords,
  evalRecordsLoading,
  onNavigateBack,
  onOpenStudent,
  onCancelEvaluation,
}: EvaluateTabProps) {
  const [searchStudent, setSearchStudent] = useState("");
  const totalTopics = evalActiveTopics.length + RWT_TOPICS.length;

  const completedCount = (studentId: string) =>
    evalRecords.filter(r => r.student_id === studentId).length;

  const currentSubject = mySubjects.find(s => s.id === evalSubjectId);
  const currentClassroom = evalClassroomOptions.find(c => c.id === evalClassroomId);

  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return evalClassroomStudents;
    const q = searchStudent.toLowerCase().trim();
    return evalClassroomStudents.filter(
      s => s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q)
    );
  }, [evalClassroomStudents, searchStudent]);

  const classroomProgress = useMemo(() => {
    if (evalClassroomStudents.length === 0) return { complete: 0, total: 0, percent: 0 };
    let complete = 0;
    for (const s of evalClassroomStudents) {
      if (completedCount(s.student_id) === totalTopics && totalTopics > 0) {
        complete++;
      }
    }
    const total = evalClassroomStudents.length;
    const percent = Math.round((complete / total) * 100);
    return { complete, total, percent };
  }, [evalClassroomStudents, evalRecords, totalTopics]);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Alert Notices */}
      {!isEvalTermActive && (
        <div className="flex items-start gap-3 bg-rose-500/8 border border-rose-500/25 text-rose-700 dark:text-rose-300 px-5 py-4 rounded-2xl text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>ระบบเปิดให้ประเมินคุณลักษณะเฉพาะภาคเรียนที่ 2 ของปีการศึกษานั้นๆ</span>
        </div>
      )}
      {isEvalTermActive && !isGradingActive && (
        <div className="flex items-start gap-3 bg-rose-500/8 border border-rose-500/25 text-rose-700 dark:text-rose-300 px-5 py-4 rounded-2xl text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>ระบบปิดรับการประเมินชั่วคราว — นอกช่วงเวลา {formatThaiDateRange(settingsStartDate, settingsEndDate)}</span>
        </div>
      )}

      {/* Navigation Breadcrumb & Back Button */}
      {evalSubjectId && (
        <div className="flex items-center justify-between gap-3 flex-wrap animate-fade-in-up">
          <button
            type="button"
            onClick={onNavigateBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {evalClassroomId ? "เปลี่ยนห้องเรียน" : "เปลี่ยนรายวิชา"}
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground flex-wrap">
            <span className="text-foreground font-bold">{currentSubject?.name}</span>
            {currentClassroom && (
              <>
                <span>/</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentClassroom.name}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Select Subject */}
      {!evalSubjectId && (
        <div className="card-modern overflow-hidden animate-fade-in-up border border-border/80 shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              1
            </span>
            <div>
              <div className="font-bold text-foreground text-sm">เลือกรายวิชา</div>
              <div className="text-xs text-muted-foreground">วิชาที่คุณรับผิดชอบสอนในเทอมนี้</div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {mySubjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                ยังไม่มีวิชาที่กำหนดให้คุณสอนในเทอมนี้
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {mySubjects.map(s => {
                  const isSelected = evalSubjectId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelectSubject(s.id)}
                      className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20 scale-[1.02]"
                          : "bg-card text-foreground border-border/70 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10 hover:shadow-xs"
                      }`}
                    >
                      <span className="font-bold text-sm leading-snug">{s.name}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full mt-2 ${
                        isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {s.subject_type === "activity" ? "กิจกรรม" : `${Number(s.credit_hours) || 1} หน่วยกิต`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Classroom */}
      {evalSubjectId && !evalClassroomId && (
        <div className="card-modern overflow-hidden animate-fade-in-up border border-border/80 shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              2
            </span>
            <div>
              <div className="font-bold text-foreground text-sm">เลือกห้องเรียน</div>
              <div className="text-xs text-muted-foreground">เลือกห้องเรียนที่ต้องการบันทึกการประเมิน</div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {evalClassroomOptions.map(c => {
                const isSelected = evalClassroomId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setEvalClassroomId(c.id)}
                    className={`card-interactive relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-indigo-400 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.03]"
                        : "border-border/70 bg-card text-foreground hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10"
                    }`}
                  >
                    <span className="font-extrabold text-base leading-tight">{c.name}</span>
                    {c.name_thai && c.name_thai !== c.name && (
                      <span className={`text-[11px] font-medium leading-tight truncate max-w-full px-1 mt-0.5 ${
                        isSelected ? "text-indigo-100" : "text-muted-foreground"
                      }`}>
                        {c.name_thai}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Student list & evaluation */}
      {evalSubjectId && evalClassroomId && (
        <div className="card-modern overflow-hidden animate-fade-in-up border border-border/80 shadow-sm">
          {/* Card Header with Progress Indicator */}
          <div className="px-5 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                3
              </span>
              <div>
                <div className="font-bold text-foreground text-sm">ประเมินนักเรียน</div>
                <div className="text-xs text-muted-foreground">
                  {evalClassroomStudents.length} คน · ประเมินครบ {classroomProgress.complete} คน ({classroomProgress.percent}%)
                </div>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="ค้นหาชื่อ หรือรหัสนักเรียน..."
                className="input-modern !py-1.5 !px-3 text-xs w-full"
              />
              {searchStudent && (
                <button
                  type="button"
                  onClick={() => setSearchStudent("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {evalRecordsLoading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">กำลังโหลดข้อมูลการประเมิน...</div>
          ) : evalClassroomStudents.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">ไม่มีนักเรียนในชั้นเรียนนี้</div>
          ) : (
            <div className="divide-y divide-border/70">
              {filteredStudents.map((s, idx) => {
                const done = completedCount(s.student_id);
                const isComplete = done > 0 && done === totalTopics;
                return (
                  <div
                    key={s.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground w-6 text-center shrink-0 font-mono font-bold">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-sm truncate">{s.name}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                          {s.student_id}
                          {s.student_number !== null && (
                            <span className="text-muted-foreground font-normal ml-1.5">
                              · เลขที่ {s.student_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          isComplete
                            ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {done}/{totalTopics} ประเมินแล้ว
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenStudent(s)}
                          disabled={!isEvalActive}
                          className="text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          ประเมิน
                        </button>
                        {done > 0 && (
                          <button
                            type="button"
                            onClick={() => onCancelEvaluation(s)}
                            disabled={!isEvalActive}
                            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed font-semibold p-1.5 rounded-lg transition-all border border-rose-200 dark:border-rose-500/30 flex items-center justify-center cursor-pointer"
                            title="ยกเลิกการประเมินนักเรียนคนนี้"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
