import { useEffect } from "react";
import ModalPortal from "@/app/components/ModalPortal";
import { type DBStudent, type DBGrade, type DBSubject, getResultLabel } from "../types";

interface StudentGradesModalProps {
  student: DBStudent | null;
  grades: DBGrade[];
  subjectsList: DBSubject[];
  activeSettingId: number | null;
  currentTerm: string;
  midtermMax: number;
  finalMax: number;
  gpa: string;
  onClose: () => void;
}

// เรียงเทอมจากใหม่ไปเก่า (รูปแบบ "เทอม/ปีการศึกษา")
function compareTermDesc(a: string, b: string) {
  const [ta, ya] = a.split("/").map(Number);
  const [tb, yb] = b.split("/").map(Number);
  if ((yb || 0) !== (ya || 0)) return (yb || 0) - (ya || 0);
  return (tb || 0) - (ta || 0);
}

export default function StudentGradesModal({
  student,
  grades,
  subjectsList,
  activeSettingId,
  currentTerm,
  midtermMax,
  finalMax,
  gpa,
  onClose,
}: StudentGradesModalProps) {
  useEffect(() => {
    if (!student) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [student, onClose]);

  if (!student) return null;

  const findSubject = (name: string) => {
    const key = name?.trim().toLowerCase();
    const matches = subjectsList.filter(s => s.name?.trim().toLowerCase() === key);
    return matches.find(s => s.setting_id === activeSettingId) ?? matches[0];
  };

  const studentGrades = grades.filter(g => g.student_id === student.student_id);
  // เปอร์เซ็นต์คะแนนรวม คิดเฉพาะวิชาหลัก (ขอบเขตเดียวกับ GPA)
  let scoreSum = 0;
  let maxSum = 0;
  studentGrades.forEach(g => {
    const subject = findSubject(g.subject);
    if (subject?.subject_type === "activity") return;
    scoreSum += (g.midterm_score ?? 0) + (g.final_score ?? 0);
    maxSum += (Number(subject?.midterm_max_score) || midtermMax) + (Number(subject?.final_max_score) || finalMax);
  });
  const percent = maxSum > 0 ? ((scoreSum / maxSum) * 100).toFixed(2) : "0.00";

  const terms = Array.from(new Set(studentGrades.map(g => g.term))).sort((a, b) => {
    if (a === currentTerm) return -1;
    if (b === currentTerm) return 1;
    return compareTermDesc(a, b);
  });

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-grades-title"
        className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] my-auto flex flex-col border border-border animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-border bg-card">
          <div className="min-w-0">
            <h3 id="student-grades-title" className="text-lg font-extrabold text-foreground">คะแนนและเกรด</h3>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5 truncate">{student.name} · {student.student_id}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">เปอร์เซ็นต์</div>
              <div className="text-xl font-extrabold text-violet-600 dark:text-violet-400 leading-none">{percent}%</div>
            </div>
            <div className="w-px h-8 bg-border" aria-hidden="true" />
            <div className="text-right">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GPA</div>
              <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">{gpa}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="ปิด"
              className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-full transition-all cursor-pointer border-0 bg-transparent"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {terms.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีคะแนนของนักเรียนคนนี้</div>
          ) : (
            terms.map(term => {
              const termGrades = studentGrades.filter(g => g.term === term);
              return (
                <div key={term}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ภาคเรียน {term}</div>
                    {term === currentTerm && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">ปัจจุบัน</span>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/60 overflow-x-auto">
                    <table className="w-full text-sm min-w-[420px]">
                      <thead>
                        <tr className="bg-muted text-foreground text-xs">
                          <th className="px-3 sm:px-4 py-2.5 text-left font-bold">วิชา</th>
                          <th className="px-2 py-2.5 text-center font-bold w-16">กลางภาค</th>
                          <th className="px-2 py-2.5 text-center font-bold w-16">ปลายภาค</th>
                          <th className="px-2 py-2.5 text-center font-bold w-16">รวม</th>
                          <th className="px-3 py-2.5 text-center font-bold w-20">เกรด</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {termGrades.map(g => {
                          const subject = findSubject(g.subject);
                          const mMax = Number(subject?.midterm_max_score) || midtermMax;
                          const fMax = Number(subject?.final_max_score) || finalMax;
                          const subjectType = subject?.subject_type ?? "main";
                          const hasScore = g.midterm_score !== null || g.final_score !== null;
                          const total = (g.midterm_score ?? 0) + (g.final_score ?? 0);
                          const result = getResultLabel(total, mMax + fMax, subjectType);
                          return (
                            <tr key={g.id}>
                              <td className="px-3 sm:px-4 py-2.5 font-medium text-foreground">
                                {g.subject}
                                {subjectType === "activity" && (
                                  <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(กิจกรรม)</span>
                                )}
                              </td>
                              <td className="px-2 py-2.5 text-center text-muted-foreground">
                                {g.midterm_score ?? "-"}<span className="text-[10px] text-subtle-foreground">/{mMax}</span>
                              </td>
                              <td className="px-2 py-2.5 text-center text-muted-foreground">
                                {g.final_score ?? "-"}<span className="text-[10px] text-subtle-foreground">/{fMax}</span>
                              </td>
                              <td className="px-2 py-2.5 text-center font-bold text-foreground">{hasScore ? total : "-"}</td>
                              <td className="px-3 py-2.5 text-center">
                                {hasScore ? (
                                  <span className={`inline-block px-2.5 py-0.5 rounded-lg border text-xs font-extrabold ${result.color}`}>
                                    {subjectType === "activity" ? result.label : `${result.label} (${result.point})`}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
