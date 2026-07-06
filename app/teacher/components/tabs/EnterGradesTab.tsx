import { formatThaiDateRange } from "../../../lib/format";
import {
  type DBStudent,
  type DBGrade,
  type DBClassroom,
  type DBSubject,
  type RowScore,
  type CombinedActivityResult,
  getResultLabel,
} from "../types";

interface EnterGradesTabProps {
  isGradingActive: boolean;
  settingsStartDate: string;
  settingsEndDate: string;

  mySubjects: DBSubject[];
  enterSubject: string;
  setEnterSubject: (name: string) => void;
  enterClassroom: string;
  setEnterClassroom: (id: string) => void;
  enterTerm: string;

  students: DBStudent[];
  grades: DBGrade[];
  classrooms: DBClassroom[];

  currentSubjectObj: DBSubject | undefined;
  currentSubjectType: "main" | "activity";
  currentDisplayMode: "separate" | "combined";
  currentMidtermMax: number;
  currentFinalMax: number;
  isCombined: boolean;
  onChangeDisplayMode: (mode: "separate" | "combined") => void;

  currentClassroomStudents: DBStudent[];
  savedCount: number;
  onSaveAll: () => void;

  useCombinedActivity: boolean;
  scoredActivitySubjects: DBSubject[];
  getCombinedActivityResult: (studentId: string, term: string) => CombinedActivityResult | null;

  rowScores: Record<string, RowScore>;
  setRowScores: (updater: (prev: Record<string, RowScore>) => Record<string, RowScore>) => void;
  handleScoreChange: (val: string, max: number) => string;
  onSaveRow: (student: DBStudent) => void;
  onDeleteGrade: (id: string) => void;
}

export default function EnterGradesTab({
  isGradingActive,
  settingsStartDate,
  settingsEndDate,
  mySubjects,
  enterSubject,
  setEnterSubject,
  enterClassroom,
  setEnterClassroom,
  enterTerm,
  students,
  grades,
  classrooms,
  currentSubjectObj,
  currentSubjectType,
  currentDisplayMode,
  currentMidtermMax,
  currentFinalMax,
  isCombined,
  onChangeDisplayMode,
  currentClassroomStudents,
  savedCount,
  onSaveAll,
  useCombinedActivity,
  scoredActivitySubjects,
  getCombinedActivityResult,
  rowScores,
  setRowScores,
  handleScoreChange,
  onSaveRow,
  onDeleteGrade,
}: EnterGradesTabProps) {
  return (
    <div className="space-y-5">

      {/* Grading Status Banner */}
      {!isGradingActive && (
        <div className="flex items-start gap-3 bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur-sm border border-rose-200/60 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 px-5 py-4 rounded-2xl text-sm font-semibold shadow-lg shadow-rose-100/20">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>🔴 ระบบปิดรับคะแนนชั่วคราว — นอกช่วงเวลา {formatThaiDateRange(settingsStartDate, settingsEndDate)}</span>
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
                const isSelected = enterSubject === s.name;
                const savedForSubject = students.filter(st => grades.some(g => g.student_id === st.student_id && g.subject.trim().toLowerCase() === s.name.trim().toLowerCase() && g.term === enterTerm)).length;
                const totalInSubjectClassrooms = students.filter(st => (s as any).classroom_ids?.includes(st.classroom_id)).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setEnterSubject(s.name); setEnterClassroom(""); }}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all duration-200 cursor-pointer animate-fade-in-up ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-lg shadow-indigo-200/40 scale-[1.02]"
                        : "bg-card/80 text-foreground border-border/60 hover:border-indigo-300 hover:bg-indigo-50/60 dark:bg-indigo-500/10 hover:shadow-md hover:shadow-indigo-100/20 hover:scale-[1.01]"
                    }`}
                  >
                    <span className="font-bold text-sm">{s.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${isSelected ? "bg-card/20 text-white" : "bg-muted text-muted-foreground"}`}>
                        {s.subject_type === "activity" ? "กิจกรรม" : `${Number(s.credit_hours) || 1} หน่วยกิต`}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] text-indigo-200">
                          {savedForSubject} / {totalInSubjectClassrooms} คน
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Activity display mode */}
          {currentSubjectType === "activity" && enterSubject && (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground">รูปแบบกรอกคะแนน:</span>
              {(["separate", "combined"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => onChangeDisplayMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer ${
                    currentDisplayMode === mode
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-md shadow-indigo-200/30"
                      : "bg-card/80 text-foreground border-border/60 hover:border-indigo-300 hover:bg-indigo-50/60 dark:bg-indigo-500/10"
                  }`}
                >
                  {mode === "separate" ? "แยกคะแนนเก็บ/สอบ" : "คะแนนรวมช่องเดียว"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Select Classroom */}
      {enterSubject && (
        <div className="card-modern overflow-hidden animate-fade-in-up">
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200/40">2</span>
            <div>
              <div className="font-bold text-foreground text-sm">เลือกห้องเรียน</div>
              <div className="text-xs text-muted-foreground">วิชา: <span className="gradient-text font-semibold">{enterSubject}</span></div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger-children">
              {classrooms.filter(c => mySubjects.find(s => s.name === enterSubject)?.classroom_ids?.includes(c.id)).map(c => {
                const total = students.filter(s => s.classroom_id === c.id).length;
                const saved = students.filter(s => s.classroom_id === c.id).filter(s =>
                  grades.some(g =>
                    g.student_id === s.student_id &&
                    g.subject.trim().toLowerCase() === enterSubject.trim().toLowerCase() &&
                    g.term === enterTerm
                  )
                ).length;
                const isComplete = saved > 0 && saved === total;
                const isActive = enterClassroom === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setEnterClassroom(c.id)}
                    className={`card-interactive relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-200 cursor-pointer animate-fade-in-up ${
                      isActive
                        ? "border-indigo-400 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-200/40 scale-[1.03]"
                        : isComplete
                        ? "border-emerald-300/60 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100/30"
                        : "border-border/60 bg-card/80 text-foreground hover:border-indigo-300 hover:bg-indigo-50/60 dark:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-100/20"
                    }`}
                  >
                    {isComplete && !isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <span className="font-extrabold text-base leading-tight">{c.name}</span>
                    <span className={`text-xs mt-1.5 font-semibold ${isActive ? "text-indigo-200" : isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      {saved}/{total} คน
                    </span>
                    {total > 0 && !isActive && (
                      <div className="w-full mt-2.5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-indigo-400 to-violet-500"}`}
                          style={{ width: `${Math.round((saved / total) * 100)}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Score Table */}
      {enterSubject && enterClassroom && (
        <div className="card-modern overflow-hidden animate-fade-in-up">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200/40">3</span>
              <div>
                <div className="font-bold text-foreground text-sm">
                  กรอกคะแนน · ห้อง {classrooms.find(c => c.id === enterClassroom)?.name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                  <span>{currentClassroomStudents.length} คน</span>
                  <span className="text-subtle-foreground">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{savedCount} บันทึกแล้ว</span>
                  {currentSubjectType !== "activity" && (
                    <>
                      <span className="text-subtle-foreground">·</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{Number(currentSubjectObj?.credit_hours) || 1} หน่วยกิต</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onSaveAll}
              disabled={!isGradingActive}
              className="btn-primary flex items-center gap-2 disabled:bg-border disabled:cursor-not-allowed disabled:shadow-none disabled:from-slate-200 disabled:to-slate-200 font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              บันทึกทั้งชั้น
            </button>
          </div>

          {useCombinedActivity && currentSubjectType === "activity" && (
            <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 font-medium">
              คอลัมน์ <span className="font-bold">ผล</span> คำนวณจากคะแนนรวมทุกวิชากิจกรรมที่มีคะแนน:{" "}
              <span className="font-bold">{scoredActivitySubjects.map(s => s.name).join(", ")}</span>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-indigo-100/40 dark:border-indigo-500/25 text-foreground text-xs">
                  <th className="px-4 py-3.5 text-center font-bold w-10">#</th>
                  <th className="px-4 py-3.5 font-bold w-28">รหัส</th>
                  <th className="px-4 py-3.5 font-bold">ชื่อ-สกุล</th>
                  {isCombined ? (
                    <th className="px-4 py-3.5 text-center font-bold w-32">
                      คะแนนรวม
                      <div className="text-[10px] text-muted-foreground font-normal">(/{currentMidtermMax + currentFinalMax})</div>
                    </th>
                  ) : (
                    <>
                      <th className="px-4 py-3.5 text-center font-bold w-28">
                        เก็บ
                        <div className="text-[10px] text-muted-foreground font-normal">(/{currentMidtermMax})</div>
                      </th>
                      <th className="px-4 py-3.5 text-center font-bold w-28">
                        สอบ
                        <div className="text-[10px] text-muted-foreground font-normal">(/{currentFinalMax})</div>
                      </th>
                    </>
                  )}
                  <th className="px-4 py-3.5 text-center font-bold w-16">รวม</th>
                  <th className="px-4 py-3.5 text-center font-bold w-20">
                    {currentSubjectType === "activity"
                      ? (useCombinedActivity ? "ผล (รวม)" : "ผล")
                      : "เกรด"}
                  </th>
                  <th className="px-4 py-3.5 text-center font-bold w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentClassroomStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">
                      ไม่มีนักเรียนในชั้นเรียนนี้
                    </td>
                  </tr>
                ) : (
                  currentClassroomStudents.map((s, idx) => {
                    const row = rowScores[s.student_id] || { midterm: "", final: "" };
                    const midNum = Number(row.midterm) || 0;
                    const finalNum = Number(row.final) || 0;
                    const total = isCombined
                      ? (row.midterm !== "" ? midNum : null)
                      : (row.midterm !== "" || row.final !== "" ? midNum + finalNum : null);
                    const resultInfo = total !== null ? getResultLabel(total, currentMidtermMax + currentFinalMax, currentSubjectType) : null;
                    const existingGrade = grades.find(
                      g => g.student_id === s.student_id &&
                        g.subject.trim().toLowerCase() === enterSubject.trim().toLowerCase() &&
                        g.term === enterTerm
                    );
                    const isSaved = !!existingGrade;

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-muted/80 transition-colors ${isSaved ? "bg-emerald-50/40 dark:bg-emerald-500/10" : ""}`}
                      >
                        <td className="px-4 py-3 text-center text-muted-foreground font-medium text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400 text-xs">{s.student_id}</td>
                        <td className="px-4 py-3 text-foreground font-medium">
                          <div className="flex items-center gap-2">
                            {s.name}
                            {isSaved && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                        {isCombined ? (
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="number" min="0" max={currentMidtermMax + currentFinalMax}
                              disabled={!isGradingActive}
                              value={row.midterm}
                              onChange={e => setRowScores(prev => ({
                                ...prev,
                                [s.student_id]: { ...prev[s.student_id], midterm: handleScoreChange(e.target.value, currentMidtermMax + currentFinalMax), final: "0" },
                              }))}
                              placeholder={`0-${currentMidtermMax + currentFinalMax}`}
                              className="input-modern w-full text-center px-2 py-2 text-sm font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                            />
                          </td>
                        ) : (
                          <>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="number" min="0" max={currentMidtermMax}
                                disabled={!isGradingActive}
                                value={row.midterm}
                                onChange={e => setRowScores(prev => ({
                                  ...prev,
                                  [s.student_id]: { ...prev[s.student_id], midterm: handleScoreChange(e.target.value, currentMidtermMax) },
                                }))}
                                placeholder={`/${currentMidtermMax}`}
                                className="input-modern w-full text-center px-2 py-2 text-sm font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="number" min="0" max={currentFinalMax}
                                disabled={!isGradingActive}
                                value={row.final}
                                onChange={e => setRowScores(prev => ({
                                  ...prev,
                                  [s.student_id]: { ...prev[s.student_id], final: handleScoreChange(e.target.value, currentFinalMax) },
                                }))}
                                placeholder={`/${currentFinalMax}`}
                                className="input-modern w-full text-center px-2 py-2 text-sm font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                              />
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-center font-bold text-foreground">
                          {total !== null ? total : <span className="text-subtle-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {currentSubjectType === "activity" && useCombinedActivity ? (
                            (() => {
                              const combined = getCombinedActivityResult(s.student_id, enterTerm);
                              return combined ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border ${combined.color}`}>
                                    {combined.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">{Math.round(combined.percent)}%</span>
                                </div>
                              ) : <span className="text-subtle-foreground">—</span>;
                            })()
                          ) : resultInfo ? (
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border ${resultInfo.color}`}>
                              {resultInfo.label}
                            </span>
                          ) : (
                            <span className="text-subtle-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onSaveRow(s)}
                              disabled={!isGradingActive}
                              className="text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-border disabled:from-slate-200 disabled:to-slate-200 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-indigo-200/30"
                            >
                              บันทึก
                            </button>
                            {existingGrade && (
                              <button
                                onClick={() => onDeleteGrade(existingGrade.id)}
                                disabled={!isGradingActive}
                                className="text-xs text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:text-rose-300 disabled:text-subtle-foreground disabled:cursor-not-allowed font-semibold px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:bg-rose-500/10 transition-colors"
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {currentClassroomStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">ไม่มีนักเรียนในชั้นเรียนนี้</div>
            ) : (
              currentClassroomStudents.map((s, idx) => {
                const row = rowScores[s.student_id] || { midterm: "", final: "" };
                const midNum = Number(row.midterm) || 0;
                const finalNum = Number(row.final) || 0;
                const total = isCombined
                  ? (row.midterm !== "" ? midNum : null)
                  : (row.midterm !== "" || row.final !== "" ? midNum + finalNum : null);
                const resultInfo = total !== null ? getResultLabel(total, currentMidtermMax + currentFinalMax, currentSubjectType) : null;
                const existingGrade = grades.find(
                  g => g.student_id === s.student_id &&
                    g.subject.trim().toLowerCase() === enterSubject.trim().toLowerCase() &&
                    g.term === enterTerm
                );
                const isSaved = !!existingGrade;
                return (
                  <div key={s.id} className={`p-4 ${isSaved ? "bg-emerald-50/40 dark:bg-emerald-500/10" : "bg-card"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-foreground">{s.name}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{s.student_id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentSubjectType === "activity" && useCombinedActivity ? (
                          (() => {
                            const combined = getCombinedActivityResult(s.student_id, enterTerm);
                            return combined ? (
                              <span className={`px-2.5 py-1 rounded-lg text-sm font-extrabold border ${combined.color}`}>
                                {combined.label}
                              </span>
                            ) : null;
                          })()
                        ) : resultInfo ? (
                          <span className={`px-2.5 py-1 rounded-lg text-sm font-extrabold border ${resultInfo.color}`}>
                            {resultInfo.label}
                          </span>
                        ) : null}
                        {isSaved && (
                          <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-500/15 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                    {isCombined ? (
                      <div className="mb-3">
                        <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">คะแนนรวม <span className="text-muted-foreground font-normal">(เต็ม {currentMidtermMax + currentFinalMax})</span></label>
                        <input
                          type="number" min="0" max={currentMidtermMax + currentFinalMax}
                          disabled={!isGradingActive}
                          value={row.midterm}
                          onChange={e => setRowScores(prev => ({
                            ...prev,
                            [s.student_id]: { ...prev[s.student_id], midterm: handleScoreChange(e.target.value, currentMidtermMax + currentFinalMax), final: "0" },
                          }))}
                          className="input-modern w-full text-center px-3 py-2.5 text-base font-bold disabled:bg-muted disabled:cursor-not-allowed"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">เก็บ <span className="text-muted-foreground font-normal">/{currentMidtermMax}</span></label>
                          <input
                            type="number" min="0" max={currentMidtermMax}
                            disabled={!isGradingActive}
                            value={row.midterm}
                            onChange={e => setRowScores(prev => ({
                              ...prev,
                              [s.student_id]: { ...prev[s.student_id], midterm: handleScoreChange(e.target.value, currentMidtermMax) },
                            }))}
                            className="input-modern w-full text-center px-3 py-2.5 text-base font-bold disabled:bg-muted disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">สอบ <span className="text-muted-foreground font-normal">/{currentFinalMax}</span></label>
                          <input
                            type="number" min="0" max={currentFinalMax}
                            disabled={!isGradingActive}
                            value={row.final}
                            onChange={e => setRowScores(prev => ({
                              ...prev,
                              [s.student_id]: { ...prev[s.student_id], final: handleScoreChange(e.target.value, currentFinalMax) },
                            }))}
                            className="input-modern w-full text-center px-3 py-2.5 text-base font-bold disabled:bg-muted disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="text-sm font-bold text-foreground">
                        รวม: {total !== null ? <span className="text-indigo-600 dark:text-indigo-400">{total}</span> : <span className="text-subtle-foreground">—</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {existingGrade && (
                          <button
                            onClick={() => onDeleteGrade(existingGrade.id)}
                            disabled={!isGradingActive}
                            className="text-xs text-rose-500 dark:text-rose-400 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:bg-rose-500/10 transition-colors disabled:opacity-40"
                          >ลบ</button>
                        )}
                        <button
                          onClick={() => onSaveRow(s)}
                          disabled={!isGradingActive}
                          className="text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-4 py-1.5 rounded-lg transition-all duration-200 disabled:bg-border disabled:from-slate-200 disabled:to-slate-200 disabled:cursor-not-allowed shadow-sm"
                        >บันทึก</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Prompt when no subject selected */}
      {!enterSubject && (
        <div className="text-center py-20 text-muted-foreground animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 dark:from-indigo-500/10 to-violet-100 dark:to-violet-500/10 flex items-center justify-center shadow-lg shadow-indigo-100/30">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="font-bold text-foreground text-base">เริ่มต้นด้วยการเลือกรายวิชาด้านบน</p>
          <p className="text-sm text-muted-foreground mt-1">เลือกวิชาที่ต้องการบันทึกคะแนน</p>
        </div>
      )}
    </div>
  );
}
