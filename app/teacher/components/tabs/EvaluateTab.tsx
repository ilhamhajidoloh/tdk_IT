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

  onOpenStudent: (student: DBStudent) => void;
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
  onOpenStudent,
}: EvaluateTabProps) {
  const totalTopics = evalActiveTopics.length + RWT_TOPICS.length;

  const completedCount = (studentId: string) =>
    evalRecords.filter(r => r.student_id === studentId).length;

  return (
    <div className="space-y-5">
      {!isEvalTermActive && (
        <div className="flex items-start gap-3 bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur-sm border border-rose-200/60 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 px-5 py-4 rounded-2xl text-sm font-semibold shadow-lg shadow-rose-100/20">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>🔴 ระบบเปิดให้ประเมินคุณลักษณะเฉพาะภาคเรียนที่ 2 ของปีการศึกษานั้นๆ</span>
        </div>
      )}
      {isEvalTermActive && !isGradingActive && (
        <div className="flex items-start gap-3 bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur-sm border border-rose-200/60 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 px-5 py-4 rounded-2xl text-sm font-semibold shadow-lg shadow-rose-100/20">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>🔴 ระบบปิดรับการประเมินชั่วคราว — นอกช่วงเวลา {formatThaiDateRange(settingsStartDate, settingsEndDate)}</span>
        </div>
      )}

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
              {mySubjects.map(s => {
                const isSelected = evalSubjectId === s.id;
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
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${isSelected ? "bg-card/20 text-white" : "bg-muted text-muted-foreground"}`}>
                      {s.subject_type === "activity" ? "กิจกรรม" : `${Number(s.credit_hours) || 1} หน่วยกิต`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Select Classroom */}
      {evalSubjectId && (
        <div className="card-modern overflow-hidden animate-fade-in-up">
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200/40">2</span>
            <div>
              <div className="font-bold text-foreground text-sm">เลือกห้องเรียน</div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger-children">
              {evalClassroomOptions.map(c => {
                return (
                  <button
                    key={c.id}
                    onClick={() => setEvalClassroomId(c.id)}
                    className={`card-interactive relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-200 cursor-pointer animate-fade-in-up ${
                      evalClassroomId === c.id
                        ? "border-indigo-400 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-200/40 scale-[1.03]"
                        : "border-border/60 bg-card/80 text-foreground hover:border-indigo-300 hover:bg-indigo-50/60 dark:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-100/20"
                    }`}
                  >
                    <span className="font-extrabold text-base leading-tight">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Student table */}
      {evalSubjectId && evalClassroomId && (
        <div className="card-modern overflow-hidden animate-fade-in-up">
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200/40">3</span>
            <div>
              <div className="font-bold text-foreground text-sm">ประเมินนักเรียน</div>
              <div className="text-xs text-muted-foreground">{evalClassroomStudents.length} คน</div>
            </div>
          </div>

          {evalRecordsLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">กำลังโหลดข้อมูล...</div>
          ) : evalClassroomStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">ไม่มีนักเรียนในชั้นเรียนนี้</div>
          ) : (
            <div className="divide-y divide-border">
              {evalClassroomStudents.map((s, idx) => {
                const done = completedCount(s.student_id);
                const isComplete = done > 0 && done === totalTopics;
                return (
                  <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground w-6 text-center shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-sm truncate">{s.name}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{s.student_id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${isComplete ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" : "bg-muted text-muted-foreground border-border"}`}>
                        {done}/{totalTopics} ประเมินแล้ว
                      </span>
                      <button
                        onClick={() => onOpenStudent(s)}
                        disabled={!isEvalActive}
                        className="text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-border disabled:from-slate-200 disabled:to-slate-200 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm"
                      >
                        ประเมิน
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!evalSubjectId && (
        <div className="text-center py-20 text-muted-foreground animate-fade-in-up">
          <p className="font-bold text-foreground text-base">เริ่มต้นด้วยการเลือกรายวิชาด้านบน</p>
        </div>
      )}
    </div>
  );
}
