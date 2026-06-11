"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../lib/useAuth";
import { useRouter } from "next/navigation";
interface DBStudent { id: string; name: string; student_id: string; classroom_id: string; }
interface DBGrade { id: string; student_id: string; subject: string; midterm_score: number | null; final_score: number | null; term: string; }
interface DBClassroom { id: string; name: string; }
interface DBSubject { id: string; name: string; setting_id?: number | null; midterm_max_score?: number | null; final_max_score?: number | null; subject_type?: "main" | "activity"; credit_hours?: number | null; score_display_mode?: "separate" | "combined"; }
interface SchedulePeriod { id: string; setting_id: number | string; period_no: number | string; start_time: string; end_time: string; label?: string | null; }
interface ScheduleEntry {
  id: string; classroom_id: string; classroom_name: string;
  subject_id: string; subject_name: string; teacher_id: string | null; teacher_name: string | null;
  day_of_week: number | string; period_id: string; period_no: number | string; start_time: string; end_time: string; label?: string | null;
}

const ALL_DAYS = [
  { value: 1, label: "จันทร์" },
  { value: 2, label: "อังคาร" },
  { value: 3, label: "พุธ" },
  { value: 4, label: "พฤหัสบดี" },
  { value: 5, label: "ศุกร์" },
  { value: 6, label: "เสาร์" },
  { value: 0, label: "อาทิตย์" },
];

export default function StudentPortal() {
  const [currentStudent, setCurrentStudent] = useState<DBStudent | null>(null);
  const [studentGrades, setStudentGrades] = useState<DBGrade[]>([]);
  const [classrooms, setClassrooms] = useState<DBClassroom[]>([]);
  const [subjectsList, setSubjectsList] = useState<DBSubject[]>([]);
  const [activeSettingId, setActiveSettingId] = useState<number | null>(null);
  const [scheduleDaysConfig, setScheduleDaysConfig] = useState<number[]>([1, 2, 3, 4, 5]);
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [midtermMax, setMidtermMax] = useState(50);
  const [finalMax, setFinalMax] = useState(50);
  const router = useRouter();
  const { user, loading, logout, token } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "student" || !user.student_id) {
      router.push("/");
      return;
    }
    if (!token) return;

    fetch("/api/students", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: DBStudent[]) => {
        const student = data.find(s => s.student_id === user.student_id);
        if (student) setCurrentStudent(student);
      });

    fetch(`/api/grades?studentId=${user.student_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setStudentGrades);

    fetch("/api/subjects", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSubjectsList(data);
      })
      .catch(console.error);

    fetch("/api/public/classrooms")
      .then(r => r.json())
      .then(setClassrooms);

    fetch("/api/public/settings")
      .then(r => r.json())
      .then(s => {
        setMidtermMax(s.midterm_max_score ?? 50);
        setFinalMax(s.final_max_score ?? 50);
        setActiveSettingId(s.id);
        if (Array.isArray(s.schedule_days)) setScheduleDaysConfig(s.schedule_days);
      });
  }, [loading, user, token, router]);

  useEffect(() => {
    if (!token || !activeSettingId) return;
    fetch(`/api/schedule-periods?settingId=${activeSettingId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSchedulePeriods(data); })
      .catch(console.error);
    fetch(`/api/schedules?settingId=${activeSettingId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setScheduleEntries(data); })
      .catch(console.error);
  }, [token, activeSettingId]);

  const ACTIVE_DAYS = ALL_DAYS.filter(d => scheduleDaysConfig.includes(d.value));
  const maxTotal = midtermMax + finalMax;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    studentGrades.forEach((g) => {
      const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
      if (subject?.subject_type === "activity") return;
      const mMax = Number(subject?.midterm_max_score) || midtermMax;
      const fMax = Number(subject?.final_max_score) || finalMax;
      const creditHours = Number(subject?.credit_hours) || 1;
      const totalScore = (g.midterm_score ?? 0) + (g.final_score ?? 0);
      const percent = mMax + fMax > 0 ? (totalScore / (mMax + fMax)) * 100 : 0;
      let point = 0;
      if (percent >= 80) point = 4;
      else if (percent >= 75) point = 3.5;
      else if (percent >= 70) point = 3;
      else if (percent >= 65) point = 2.5;
      else if (percent >= 60) point = 2;
      else if (percent >= 55) point = 1.5;
      else if (percent >= 50) point = 1;
      totalPoints += point * creditHours;
      totalCredits += creditHours;
    });
    if (totalCredits === 0) return "0.00";
    return (totalPoints / totalCredits).toFixed(2);
  };

  const getGradeLabel = (percent: number) => {
    if (percent >= 80) return "4";
    if (percent >= 75) return "3.5";
    if (percent >= 70) return "3";
    if (percent >= 65) return "2.5";
    if (percent >= 60) return "2";
    if (percent >= 55) return "1.5";
    if (percent >= 50) return "1";
    return "0";
  };

  const getScoreColor = (percent: number) => {
    if (percent >= 80) return "bg-green-100 text-green-700 border border-green-200";
    if (percent >= 70) return "bg-blue-100 text-blue-700 border border-blue-200";
    if (percent >= 60) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    if (percent >= 50) return "bg-orange-100 text-orange-700 border border-orange-200";
    return "bg-red-100 text-red-700 border border-red-200";
  };

  if (!isClient || loading || !currentStudent) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-purple-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-none">ระบบนักเรียน</h1>
              <p className="text-xs text-gray-500">ตรวจสอบผลการเรียน</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Student Profile Card */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-6 -translate-y-4">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold border border-white/30 backdrop-blur-sm shrink-0">
                  {currentStudent.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{currentStudent.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border border-white/20">
                      รหัส: {currentStudent.student_id}
                    </span>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border border-white/20">
                      ห้อง: {classrooms.find(c => c.id === currentStudent.classroom_id)?.name || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <p className="text-purple-100 text-sm mb-1">วิชาทั้งหมด</p>
                  <p className="text-3xl font-bold">{studentGrades.length}</p>
                  <p className="text-purple-200 text-xs mt-1">วิชา</p>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <p className="text-purple-100 text-sm mb-1">เกรดเฉลี่ย</p>
                  <p className="text-3xl font-bold">{calculateGPA()}</p>
                  <p className="text-purple-200 text-xs mt-1">จาก 4.00</p>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 col-span-2 md:col-span-1">
                  <p className="text-purple-100 text-sm mb-1">คะแนนเฉลี่ย</p>
                  <p className="text-3xl font-bold">
                    {studentGrades.length > 0
                      ? Math.round(studentGrades.reduce((s, g) => s + (g.midterm_score ?? 0) + (g.final_score ?? 0), 0) / studentGrades.length)
                      : 0}
                  </p>
                  <p className="text-purple-200 text-xs mt-1">จาก {maxTotal} คะแนน</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grades List */}
          <div className="bg-white rounded-3xl shadow-md border border-purple-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">ผลการเรียน</h3>
            </div>

            {studentGrades.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium text-lg">ยังไม่มีผลการเรียน</p>
                <p className="text-gray-400 text-sm mt-1">กรุณารอคุณครูบันทึกคะแนน</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {studentGrades.map((grade) => {
                  const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === grade.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                  const mMax = Number(subject?.midterm_max_score) || midtermMax;
                  const fMax = Number(subject?.final_max_score) || finalMax;
                  const subjMaxTotal = mMax + fMax;
                  const totalScore = (grade.midterm_score ?? 0) + (grade.final_score ?? 0);
                  const percent = subjMaxTotal > 0 ? (totalScore / subjMaxTotal) * 100 : 0;
                  const isActivity = subject?.subject_type === "activity";
                  const isCombined = isActivity && subject?.score_display_mode === "combined";
                  const passed = percent >= 50;
                  return (
                    <div
                      key={grade.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {isActivity ? (
                          <div className={`px-4 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                            passed ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
                          }`}>
                            {passed ? "ผ่าน" : "ไม่ผ่าน"}
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-xl ${getScoreColor(percent)}`}>
                            {getGradeLabel(percent)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold text-gray-800">{grade.subject}</h4>
                            {!isActivity && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                {Number(subject?.credit_hours) || 1} หน่วยกิต
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">ภาคเรียนที่ {grade.term}</p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 sm:flex-col sm:items-end">
                        <span className="text-2xl font-bold text-gray-800">{totalScore}</span>
                        <span className="text-sm text-gray-400">/ {subjMaxTotal} คะแนน</span>
                        {!isCombined && (
                          <span className="text-xs text-gray-400 mt-1">เก็บ {grade.midterm_score ?? 0} | สอบ {grade.final_score ?? 0}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Class Schedule */}
          <div className="bg-white rounded-3xl shadow-md border border-purple-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">ตารางเรียน</h3>
            </div>

            {schedulePeriods.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 font-medium text-lg">ยังไม่มีการกำหนดตารางเรียน</p>
              </div>
            ) : (
              <div className="overflow-x-auto p-6">
                <table className="w-full text-sm text-left">
                  <thead className="bg-purple-50/60 text-gray-600">
                    <tr>
                      <th className="px-3 py-3 font-semibold rounded-l-xl">คาบ</th>
                      {ACTIVE_DAYS.map((d, i) => (
                        <th key={d.value} className={`px-3 py-3 font-semibold text-center ${i === ACTIVE_DAYS.length - 1 ? "rounded-r-xl" : ""}`}>{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedulePeriods.map(p => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap align-top">
                          คาบ {p.period_no}
                          <div className="text-xs text-gray-400 font-normal">{p.start_time}-{p.end_time}</div>
                          {p.label && <div className="text-xs text-amber-600 font-normal">{p.label}</div>}
                        </td>
                        {ACTIVE_DAYS.map(d => {
                          const entry = scheduleEntries.find(e => e.classroom_id === currentStudent.classroom_id && Number(e.day_of_week) === d.value && e.period_id === p.id);
                          return (
                            <td key={d.value} className="px-3 py-2 align-top text-center">
                              {entry ? (
                                <div className="bg-purple-50 text-purple-700 rounded-lg px-2 py-1 text-xs font-semibold">
                                  {entry.subject_name}
                                  {entry.teacher_name && <div className="text-[11px] text-purple-500 font-normal">{entry.teacher_name}</div>}
                                </div>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-gray-400 border-t border-purple-100 bg-white/50">
        ระบบจัดการโรงเรียน © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
