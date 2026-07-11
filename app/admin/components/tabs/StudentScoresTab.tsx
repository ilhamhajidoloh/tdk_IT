import { useState, useEffect } from "react";
import { type SystemSetting, type DBStudent, type DBSubject, type DBGrade } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import Swal from "sweetalert2";

interface StudentScoresTabProps {
  settingsList: SystemSetting[];
  scoresSettingId: number | null;
  handleSelectScoresSetting: (id: number) => void;
  scoresLoading: boolean;
  scoresStudents: DBStudent[];
  scoresSubjects: DBSubject[];
  scoresGrades: DBGrade[];
  scoresClassrooms: { id: string; name: string }[];
  scoresViewMode: "classroom" | "individual";
  setScoresViewMode: (mode: "classroom" | "individual") => void;
  scoresClassroomId: string;
  setScoresClassroomId: (id: string) => void;
  scoresSelectedStudentId: string;
  setScoresSelectedStudentId: (id: string) => void;
  token: string | null;
  onRefreshGrades: () => void;
}

function gradeInfo(percent: number) {
  if (percent >= 80) return { letter: "A", color: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" };
  if (percent >= 75) return { letter: "B+", color: "text-green-600 dark:text-green-400", badge: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30" };
  if (percent >= 70) return { letter: "B", color: "text-teal-600 dark:text-teal-400", badge: "bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30" };
  if (percent >= 65) return { letter: "C+", color: "text-sky-600 dark:text-sky-400", badge: "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30" };
  if (percent >= 60) return { letter: "C", color: "text-blue-600 dark:text-blue-400", badge: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30" };
  if (percent >= 55) return { letter: "D+", color: "text-yellow-600 dark:text-yellow-400", badge: "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30" };
  if (percent >= 50) return { letter: "D", color: "text-orange-600 dark:text-orange-400", badge: "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30" };
  return { letter: "F", color: "text-rose-600 dark:text-rose-400", badge: "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30" };
}

export default function StudentScoresTab({
  settingsList,
  scoresSettingId,
  handleSelectScoresSetting,
  scoresLoading,
  scoresStudents,
  scoresSubjects,
  scoresGrades,
  scoresClassrooms,
  scoresViewMode,
  setScoresViewMode,
  scoresClassroomId,
  setScoresClassroomId,
  scoresSelectedStudentId,
  setScoresSelectedStudentId,
  token,
  onRefreshGrades,
}: StudentScoresTabProps) {
  const [showActivitySubjects, setShowActivitySubjects] = useState<boolean>(false);
  const [includeActivityInSum, setIncludeActivityInSum] = useState<boolean>(false);

  // States for Admin inline grading
  const [isEditing, setIsEditing] = useState(false);
  const [editScores, setEditScores] = useState<Record<string, { midterm: string; final: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleScoreChange = (val: string, max: number) => {
    if (val === "") return "";
    const num = Number(val);
    if (isNaN(num) || num < 0) return "0";
    if (num > max) return max.toString();
    return num.toString();
  };

  useEffect(() => {
    setIsEditing(false);
    setEditScores({});
  }, [scoresSelectedStudentId, scoresViewMode, scoresSettingId]);

  const handleStartEdit = () => {
    const initialScores: Record<string, { midterm: string; final: string }> = {};
    studentSubjects.forEach(su => {
      const g = findGrade(selectedStudent!.student_id, su.name);
      initialScores[su.id] = {
        midterm: g?.midterm_score !== null && g?.midterm_score !== undefined ? g.midterm_score.toString() : "",
        final: g?.final_score !== null && g?.final_score !== undefined ? g.final_score.toString() : "",
      };
    });
    setEditScores(initialScores);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!token || !selectedStudent || !scoresSettingId) return;
    const setting = settingsList.find(s => s.id === scoresSettingId);
    if (!setting) return;
    const termKey = `${setting.term}/${setting.academic_year}`;

    setIsSaving(true);
    try {
      const toSave: { subjectName: string; midterm: string; final: string }[] = [];

      studentSubjects.forEach(su => {
        const g = findGrade(selectedStudent.student_id, su.name);
        const isMidReadOnly = g !== undefined && g.midterm_score !== null;
        const isFinReadOnly = g !== undefined && g.final_score !== null;

        const draft = editScores[su.id] || { midterm: "", final: "" };

        const prevMid = g?.midterm_score !== null && g?.midterm_score !== undefined ? g.midterm_score.toString() : "";
        const prevFin = g?.final_score !== null && g?.final_score !== undefined ? g.final_score.toString() : "";

        const midVal = isMidReadOnly ? prevMid : draft.midterm;
        const finVal = isFinReadOnly ? prevFin : draft.final;

        const hasNewInput = (!isMidReadOnly && draft.midterm !== prevMid) || (!isFinReadOnly && draft.final !== prevFin);

        if (hasNewInput) {
          toSave.push({
            subjectName: su.name,
            midterm: midVal,
            final: finVal
          });
        }
      });

      if (toSave.length === 0) {
        setIsEditing(false);
        return;
      }

      const responses = await Promise.all(
        toSave.map(item =>
          fetch("/api/grades", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              student_id: selectedStudent.student_id,
              subject: item.subjectName,
              midterm_score: item.midterm === "" ? null : Number(item.midterm),
              final_score: item.final === "" ? null : Number(item.final),
              term: termKey
            })
          })
        )
      );

      const failed = responses.some(res => !res.ok);
      if (failed) {
        Swal.fire("ข้อผิดพลาด", "บันทึกคะแนนไม่สำเร็จบางรายการ", "error");
      } else {
        Swal.fire({
          title: "บันทึกสำเร็จ!",
          text: "บันทึกคะแนนส่วนที่ขาดเรียบร้อยแล้ว",
          icon: "success",
          timer: 1200,
          showConfirmButton: false
        });
        onRefreshGrades();
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!showActivitySubjects) {
      setIncludeActivityInSum(false);
    }
  }, [showActivitySubjects]);

  const findGrade = (studentCode: string, subjectName: string) =>
    scoresGrades.find(
      g => g.student_id === studentCode && g.subject?.trim().toLowerCase() === subjectName.trim().toLowerCase()
    );

  const classroomStudents = scoresStudents
    .filter(s => s.classroom_id === scoresClassroomId)
    .sort((a, b) => (a.student_number ?? 9999) - (b.student_number ?? 9999) || a.name.localeCompare(b.name, "th"));

  const gradedScoresSubjects = scoresSubjects.filter(
    su => (Number(su.midterm_max_score) || 0) + (Number(su.final_max_score) || 0) > 0
  );

  const displaySubjects = gradedScoresSubjects.filter(
    su => showActivitySubjects || su.subject_type !== "activity"
  );

  const classroomSubjectsAll = displaySubjects
    .filter(su => su.classroom_ids?.includes(scoresClassroomId))
    .sort((a, b) => a.name.localeCompare(b.name, "th"));
  const classroomSubjectsGraded = classroomSubjectsAll.filter(su =>
    classroomStudents.some(s => findGrade(s.student_id, su.name))
  );
  // ถ้ายังไม่มีวิชาไหนถูกเก็บคะแนนเลย ให้แสดงวิชาทั้งหมดไปก่อน (จะได้เห็นว่ามีวิชาอะไรบ้าง)
  const classroomSubjects = classroomSubjectsGraded.length > 0 ? classroomSubjectsGraded : classroomSubjectsAll;

  const selectedStudent = scoresStudents.find(s => s.student_id === scoresSelectedStudentId);
  const studentSubjectsAll = selectedStudent
    ? displaySubjects
        .filter(su => !selectedStudent.classroom_id || su.classroom_ids?.includes(selectedStudent.classroom_id))
        .sort((a, b) => a.name.localeCompare(b.name, "th"))
    : [];
  const studentSubjectsGraded = selectedStudent
    ? studentSubjectsAll.filter(su => findGrade(selectedStudent.student_id, su.name))
    : [];
  const studentSubjects = studentSubjectsGraded.length > 0 ? studentSubjectsGraded : studentSubjectsAll;

  return (
    <div className="p-8 animate-fade-in-up">
      <SectionHeader
        icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        color="blue"
        title="ดูคะแนนนักเรียน"
        subtitle="ดูคะแนนดิบรายวิชา ทั้งรายบุคคลและรายห้องเรียน"
      />

      <TermSelector
        settingsList={settingsList}
        selectedId={scoresSettingId}
        onSelect={handleSelectScoresSetting}
      />

      {!scoresSettingId ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : scoresLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground font-semibold text-sm">กำลังโหลดข้อมูลคะแนน...</p>
        </div>
      ) : (
        <div>
          {/* Mode Toggle & Activity Sum Toggle */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-subtle-foreground uppercase tracking-wider">มุมมอง:</span>
              <button
                onClick={() => setScoresViewMode("classroom")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  scoresViewMode === "classroom"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                }`}
              >
                รายห้องเรียน
              </button>
              <button
                onClick={() => setScoresViewMode("individual")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  scoresViewMode === "individual"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                }`}
              >
                รายบุคคล
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 p-2 bg-card rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">แสดงวิชากิจกรรม:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showActivitySubjects}
                    onChange={(e) => setShowActivitySubjects(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="h-4 w-[1px] bg-border hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold transition-all ${showActivitySubjects ? 'text-foreground' : 'text-muted-foreground'}`}>รวมคะแนนวิชากิจกรรมในผลรวม:</span>
                <label className={`relative inline-flex items-center ${!showActivitySubjects ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={includeActivityInSum}
                    disabled={!showActivitySubjects}
                    onChange={(e) => setIncludeActivityInSum(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Classroom Picker (both modes need one) */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-subtle-foreground uppercase tracking-wider">ห้องเรียน:</span>
            {scoresClassrooms.length === 0 ? (
              <span className="text-xs text-subtle-foreground">ไม่มีห้องเรียนในเทอมนี้</span>
            ) : (
              scoresClassrooms.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setScoresClassroomId(c.id);
                    setScoresSelectedStudentId("");
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    scoresClassroomId === c.id
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                  }`}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>

          {!scoresClassroomId ? (
            <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
              กรุณาเลือกห้องเรียนก่อน
            </div>
          ) : scoresViewMode === "classroom" ? (
            classroomStudents.length === 0 || classroomSubjects.length === 0 ? (
              <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
                {classroomStudents.length === 0 ? "ไม่มีนักเรียนในห้องนี้" : "ยังไม่มีวิชาที่กำหนดให้ห้องนี้"}
              </div>
            ) : (
              <div className="card-modern overflow-hidden">
                <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground text-xs sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 text-center font-bold w-10">#</th>
                        <th className="px-3 py-2.5 font-bold min-w-[160px]">ชื่อ-สกุล</th>
                        {classroomSubjects.map(su => (
                          <th key={su.id} className="px-3 py-2.5 text-center font-bold min-w-[90px] whitespace-nowrap">
                            {su.name}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-center font-bold min-w-[90px]">รวม</th>
                        <th className="px-3 py-2.5 text-center font-bold w-20">เฉลี่ย %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classroomStudents.map((s, idx) => {
                        let totalScore = 0, totalMax = 0;
                        classroomSubjects.forEach(su => {
                          if (su.subject_type === "activity" && !includeActivityInSum) return;
                          const g = findGrade(s.student_id, su.name);
                          totalScore += (g?.midterm_score ?? 0) + (g?.final_score ?? 0);
                          totalMax += (Number(su.midterm_max_score) || 50) + (Number(su.final_max_score) || 50);
                        });
                        const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
                        const info = gradeInfo(pct);
                        return (
                          <tr key={s.id} className="hover:bg-muted transition-colors">
                            <td className="px-3 py-2.5 text-center text-muted-foreground text-xs">{idx + 1}</td>
                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-foreground text-xs">{s.name}</div>
                              <div className="text-[10px] text-subtle-foreground">{s.student_id}</div>
                            </td>
                            {classroomSubjects.map(su => {
                              const g = findGrade(s.student_id, su.name);
                              const mMax = Number(su.midterm_max_score) || 50;
                              const fMax = Number(su.final_max_score) || 50;
                              if (!g) {
                                return (
                                  <td key={su.id} className="px-3 py-2.5 text-center text-xs text-subtle-foreground">—</td>
                                );
                              }
                              const sum = (g.midterm_score ?? 0) + (g.final_score ?? 0);
                              const cellPct = mMax + fMax > 0 ? (sum / (mMax + fMax)) * 100 : 0;
                              return (
                                <td
                                  key={su.id}
                                  className={`px-3 py-2.5 text-center text-xs font-semibold ${cellPct >= 50 ? "text-foreground" : "text-rose-600 dark:text-rose-400"}`}
                                >
                                  {sum}/{mMax + fMax}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2.5 text-center text-xs font-bold text-foreground">
                              {totalScore}/{totalMax}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border ${info.badge}`}>
                                {pct.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div>
              {/* Individual: student picker */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-subtle-foreground uppercase tracking-wider">นักเรียน:</span>
                <select
                  value={scoresSelectedStudentId}
                  onChange={e => setScoresSelectedStudentId(e.target.value)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-card text-foreground cursor-pointer"
                >
                  <option value="">-- เลือกนักเรียน --</option>
                  {classroomStudents.map(s => (
                    <option key={s.id} value={s.student_id}>
                      {s.student_number ? `${s.student_number}. ` : ""}{s.name} ({s.student_id})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedStudent ? (
                <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
                  กรุณาเลือกนักเรียนก่อน
                </div>
              ) : studentSubjects.length === 0 ? (
                <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
                  ไม่มีรายวิชาสำหรับนักเรียนคนนี้
                </div>
              ) : (
                (() => {
                  let totalScore = 0, totalMax = 0;
                  const rows = studentSubjects.map(su => {
                    const g = findGrade(selectedStudent.student_id, su.name);
                    const mMax = Number(su.midterm_max_score) || 50;
                    const fMax = Number(su.final_max_score) || 50;
                    const mid = g?.midterm_score ?? 0;
                    const fin = g?.final_score ?? 0;
                    const sum = mid + fin;
                    const max = mMax + fMax;
                    const pct = max > 0 ? (sum / max) * 100 : 0;
                    if (su.subject_type !== "activity" || includeActivityInSum) {
                      totalScore += sum;
                      totalMax += max;
                    }
                    return { su, g, mid, fin, sum, max, pct };
                  });
                  const overallPct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

                  return (
                    <div className="space-y-5">
                      <div className="card-modern px-6 py-5 flex items-center justify-between gap-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                        <div className="flex items-center gap-5">
                          <div className={`text-3xl font-extrabold ${gradeInfo(overallPct).color}`}>{overallPct.toFixed(1)}%</div>
                          <div>
                            <div className="font-bold text-foreground">{selectedStudent.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {selectedStudent.student_id} · {totalScore}/{totalMax} คะแนนรวม
                            </div>
                          </div>
                        </div>
                        {/* Edit Buttons for Admin */}
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer border-0 shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                บันทึกคะแนน
                              </button>
                              <button
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground cursor-pointer border-0 transition-all"
                              >
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleStartEdit}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white cursor-pointer border-0 shadow-md transition-all flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              แก้ไขคะแนน (ส่วนที่ขาด)
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="card-modern overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted text-muted-foreground text-xs">
                            <tr>
                              <th className="px-4 py-2.5 text-left font-bold">รายวิชา</th>
                              <th className="px-4 py-2.5 text-center font-bold w-28">เก็บคะแนน</th>
                              <th className="px-4 py-2.5 text-center font-bold w-28">สอบปลายภาค</th>
                              <th className="px-4 py-2.5 text-center font-bold w-24">รวม</th>
                              <th className="px-4 py-2.5 text-center font-bold w-20">เกรด</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {rows.map(({ su, mid, fin, sum, max, pct }) => {
                              const g = findGrade(selectedStudent.student_id, su.name);
                              const isMidReadOnly = g !== undefined && g.midterm_score !== null;
                              const isFinReadOnly = g !== undefined && g.final_score !== null;

                              const mMax = Number(su.midterm_max_score) || 50;
                              const fMax = Number(su.final_max_score) || 50;

                              const draft = editScores[su.id] || { midterm: "", final: "" };
                              const draftMid = isMidReadOnly ? (g?.midterm_score ?? 0) : (Number(draft.midterm) || 0);
                              const draftFin = isFinReadOnly ? (g?.final_score ?? 0) : (Number(draft.final) || 0);
                              const draftSum = draftMid + draftFin;
                              const draftPct = max > 0 ? (draftSum / max) * 100 : 0;
                              const displayPct = isEditing ? draftPct : pct;
                              const info = gradeInfo(displayPct);

                              return (
                                <tr key={su.id} className="hover:bg-muted transition-colors">
                                  <td className="px-4 py-2.5">
                                    <div className="font-semibold text-foreground text-xs">{su.name}</div>
                                    {su.subject_type === "activity" && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                                        กิจกรรม
                                      </span>
                                    )}
                                  </td>
                                  
                                  {/* Midterm Cell */}
                                  <td className="px-4 py-2 text-center text-xs">
                                    {isEditing ? (
                                      isMidReadOnly ? (
                                        <span className="font-semibold text-muted-foreground/60 bg-muted/40 px-2.5 py-1 rounded-lg border border-border">{g.midterm_score}/{mMax}</span>
                                      ) : (
                                        <input
                                          type="number"
                                          min="0"
                                          max={mMax}
                                          value={draft.midterm}
                                          onChange={e => setEditScores(prev => ({
                                            ...prev,
                                            [su.id]: {
                                              ...prev[su.id],
                                              midterm: handleScoreChange(e.target.value, mMax)
                                            }
                                          }))}
                                          placeholder={`0-${mMax}`}
                                          className="input-modern w-20 text-center px-1.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-indigo-400"
                                        />
                                      )
                                    ) : (
                                      `${mid}/${mMax}`
                                    )}
                                  </td>

                                  {/* Final Cell */}
                                  <td className="px-4 py-2 text-center text-xs">
                                    {isEditing ? (
                                      isFinReadOnly ? (
                                        <span className="font-semibold text-muted-foreground/60 bg-muted/40 px-2.5 py-1 rounded-lg border border-border">{g.final_score}/{fMax}</span>
                                      ) : (
                                        <input
                                          type="number"
                                          min="0"
                                          max={fMax}
                                          value={draft.final}
                                          onChange={e => setEditScores(prev => ({
                                            ...prev,
                                            [su.id]: {
                                              ...prev[su.id],
                                              final: handleScoreChange(e.target.value, fMax)
                                            }
                                          }))}
                                          placeholder={`0-${fMax}`}
                                          className="input-modern w-20 text-center px-1.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-indigo-400"
                                        />
                                      )
                                    ) : (
                                      `${fin}/${fMax}`
                                    )}
                                  </td>

                                  <td className="px-4 py-2.5 text-center text-xs font-bold">
                                    {isEditing ? `${draftSum}/${max}` : `${sum}/${max}`}
                                  </td>

                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border ${info.badge}`}>
                                      {info.letter}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
