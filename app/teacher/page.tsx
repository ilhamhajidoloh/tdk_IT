"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../lib/useAuth";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

type Tab = "enter" | "status" | "homeroom";

interface DBStudent { id: string; name: string; student_id: string; classroom_id: string; }
interface DBGrade { id: string; student_id: string; subject: string; midterm_score: number | null; final_score: number | null; term: string; }
interface DBClassroom { id: string; name: string; setting_id?: number; }

interface RowScore {
  midterm: string;
  final: string;
}

export default function TeacherPortal() {
  const [students, setStudents] = useState<DBStudent[]>([]);
  const [grades, setGrades] = useState<DBGrade[]>([]);
  const [classrooms, setClassrooms] = useState<DBClassroom[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("enter");
  const router = useRouter();

  const { user: teacherUser, loading, logout, token } = useAuth();
  const [homeroomClass, setHomeroomClass] = useState<DBClassroom | null>(null);

  const [isGradingActive, setIsGradingActive] = useState(true);
  const [settingsStartDate, setSettingsStartDate] = useState("");
  const [settingsEndDate, setSettingsEndDate] = useState("");

  const [enterClassroom, setEnterClassroom] = useState("");
  const [enterSubject, setEnterSubject] = useState("");
  const [enterTerm, setEnterTerm] = useState("1/2568");
  const [rowScores, setRowScores] = useState<Record<string, RowScore>>({});

  const [statusClassroom, setStatusClassroom] = useState("");
  const [statusSubject, setStatusSubject] = useState("");
  const [statusTerm, setStatusTerm] = useState("1/2568");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadGrades = async (authToken: string) => {
    const res = await fetch("/api/grades", { headers: { Authorization: `Bearer ${authToken}` } });
    if (res.ok) setGrades(await res.json());
  };

  useEffect(() => {
    if (loading) return;
    if (!teacherUser || (teacherUser.role !== "teacher" && teacherUser.role !== "admin")) {
      router.push("/");
      return;
    }
    if (!token) return;

    fetch("/api/students", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStudents);

    loadGrades(token);

    fetch("/api/public/classrooms")
      .then(r => r.json())
      .then((data: DBClassroom[]) => {
        setClassrooms(data);
        if (teacherUser.homeroom_classroom_id) {
          setHomeroomClass(data.find(c => c.id === teacherUser.homeroom_classroom_id) || null);
        }
      });

    fetch("/api/public/settings")
      .then(r => r.json())
      .then(s => {
        const termStr = `${s.term}/${s.academic_year}`;
        setEnterTerm(termStr);
        setStatusTerm(termStr);
        setSettingsStartDate(s.start_date ?? "");
        setSettingsEndDate(s.end_date ?? "");
        const todayStr = new Date().toISOString().split("T")[0];
        setIsGradingActive(todayStr >= (s.start_date ?? "") && todayStr <= (s.end_date ?? ""));
      });

    setEnterClassroom("");
    setStatusClassroom("");
  }, [loading, teacherUser, token, router]);

  useEffect(() => {
    if (!enterClassroom) return;
    const classStudents = students.filter(s => s.classroom_id === enterClassroom);
    const newRowScores: Record<string, RowScore> = {};
    classStudents.forEach(s => {
      const existing = grades.find(
        g => g.student_id === s.student_id &&
          g.subject.trim().toLowerCase() === enterSubject.trim().toLowerCase() &&
          g.term === enterTerm
      );
      newRowScores[s.student_id] = {
        midterm: existing && existing.midterm_score != null ? String(existing.midterm_score) : "",
        final: existing && existing.final_score != null ? String(existing.final_score) : "",
      };
    });
    setRowScores(newRowScores);
  }, [enterClassroom, enterSubject, enterTerm, students, grades]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSaveRow = async (student: DBStudent) => {
    const row = rowScores[student.student_id];
    if (!enterSubject.trim()) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อวิชา", confirmButtonColor: "#4f46e5" });
      return;
    }
    if (!row?.midterm || !row?.final) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกคะแนนให้ครบ", confirmButtonColor: "#4f46e5" });
      return;
    }

    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        student_id: student.student_id,
        subject: enterSubject.trim(),
        midterm_score: Number(row.midterm),
        final_score: Number(row.final),
        term: enterTerm,
      }),
    });

    if (!res.ok) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
      return;
    }

    if (token) await loadGrades(token);

    Swal.fire({
      title: "บันทึกสำเร็จ!",
      text: `บันทึกคะแนน ${student.name} เรียบร้อยแล้ว`,
      icon: "success",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleSaveAll = async () => {
    if (!enterSubject.trim()) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อวิชาก่อน", confirmButtonColor: "#4f46e5" });
      return;
    }
    const classStudents = students.filter(s => s.classroom_id === enterClassroom);
    const toSave = classStudents.filter(s => {
      const r = rowScores[s.student_id];
      return r?.midterm !== "" && r?.final !== "";
    });

    if (toSave.length === 0) {
      Swal.fire({ icon: "info", title: "ไม่มีข้อมูลให้บันทึก", text: "กรุณากรอกคะแนนนักเรียนก่อน", confirmButtonColor: "#4f46e5" });
      return;
    }

    const result = await Swal.fire({
      title: `บันทึกคะแนน ${toSave.length} คน?`,
      text: `วิชา: ${enterSubject} | เทอม: ${enterTerm}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b",
      confirmButtonText: "บันทึกทั้งหมด",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    const responses = await Promise.all(toSave.map(s => {
      const row = rowScores[s.student_id];
      return fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          student_id: s.student_id,
          subject: enterSubject.trim(),
          midterm_score: Number(row.midterm),
          final_score: Number(row.final),
          term: enterTerm,
        }),
      });
    }));

    const failed = responses.some(res => !res.ok);

    if (token) await loadGrades(token);

    if (failed) {
      Swal.fire({
        title: "บันทึกบางรายการไม่สำเร็จ",
        text: "กรุณาตรวจสอบและบันทึกคะแนนใหม่อีกครั้ง",
        icon: "warning",
        confirmButtonColor: "#4f46e5",
      });
    } else {
      Swal.fire({
        title: "บันทึกสำเร็จ!",
        text: `บันทึกคะแนนทั้งหมด ${toSave.length} คน เรียบร้อยแล้ว`,
        icon: "success",
        confirmButtonColor: "#4f46e5",
      });
    }
  };

  const handleDeleteGrade = async (id: string) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "ข้อมูลคะแนนนี้จะถูกลบอย่างถาวร!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      await fetch(`/api/grades/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (token) await loadGrades(token);
      Swal.fire("ลบสำเร็จ!", "", "success");
    }
  };

  const getGradeLabel = (total: number) => {
    if (total >= 80) return { label: "A", color: "bg-green-100 text-green-700 border-green-200" };
    if (total >= 70) return { label: "B", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (total >= 60) return { label: "C", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    if (total >= 50) return { label: "D", color: "bg-orange-100 text-orange-700 border-orange-200" };
    return { label: "F", color: "bg-red-100 text-red-700 border-red-200" };
  };

  const calculateGPAForStudent = (studentId: string) => {
    const sg = grades.filter(g => g.student_id === studentId);
    if (sg.length === 0) return "0.00";
    let totalPoints = 0;
    sg.forEach(g => {
      const t = (g.midterm_score ?? 0) + (g.final_score ?? 0);
      if (t >= 80) totalPoints += 4;
      else if (t >= 70) totalPoints += 3;
      else if (t >= 60) totalPoints += 2;
      else if (t >= 50) totalPoints += 1;
    });
    return (totalPoints / sg.length).toFixed(2);
  };

  if (!isClient || loading) return null;

  const currentClassroomStudents = students.filter(s => s.classroom_id === enterClassroom);
  const statusStudents = students.filter(s => s.classroom_id === statusClassroom);
  const homeroomStudents = students.filter(s => s.classroom_id === homeroomClass?.id);

  const filledCount = currentClassroomStudents.filter(s => {
    const r = rowScores[s.student_id];
    return r?.midterm !== "" && r?.final !== "";
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-none">ระบบจัดการข้อมูลครู</h1>
              <p className="text-xs text-gray-500">
                {homeroomClass ? `ครูประจำชั้นห้อง ${homeroomClass.name}` : "จัดการคะแนนนักเรียน"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="space-y-2">
            {[
              { key: "enter", label: "1. ใส่ข้อมูลคะแนน" },
              { key: "status", label: "2. สถานะการใส่คะแนน" },
              { key: "homeroom", label: "3. ดูคะแนนประจำชั้น" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as Tab)}
                className={`w-full text-left px-5 py-3.5 rounded-2xl font-semibold transition-all text-sm ${
                  activeTab === t.key
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 bg-white rounded-3xl shadow-md border border-indigo-100 overflow-hidden min-h-[500px]">

            {/* ===== TAB 1: ENTER GRADES ===== */}
            {activeTab === "enter" && (
              <div>
                <div className="p-6 border-b border-gray-100 bg-indigo-50/40">
                  <div className={`mb-4 p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 shadow-sm ${
                    isGradingActive
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}>
                    {isGradingActive ? (
                      <>
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span>🟢 ระบบเปิดให้บันทึกคะแนนปกติ (ช่วงเวลากรอกคะแนน: {settingsStartDate} ถึง {settingsEndDate})</span>
                      </>
                    ) : (
                      <>
                        <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                        <span>🔴 ปิดระบบบันทึกคะแนนชั่วคราว (อยู่นอกช่วงเวลาที่กำหนด: {settingsStartDate} ถึง {settingsEndDate})</span>
                      </>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-gray-800 mb-4">บันทึกคะแนนนักเรียน</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        รายวิชา <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={enterSubject}
                        onChange={e => {
                          setEnterSubject(e.target.value);
                          setEnterClassroom("");
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all font-semibold"
                      >
                        <option value="">-- เลือกรายวิชา --</option>
                        {teacherUser?.role === 'admin' ? (
                          Array.from(new Set(grades.map(g => g.subject))).map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))
                        ) : (
                          teacherUser?.subjects?.map((sub: string) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">เทอม / ปีการศึกษา (ล็อกโดยแอดมิน)</label>
                      <input
                        type="text"
                        value={enterTerm}
                        disabled
                        placeholder="1/2568"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 font-semibold cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Classroom Tabs */}
                <div className="px-6 pt-5">
                  <p className="text-sm font-semibold text-gray-500 mb-3">เลือกชั้นเรียน</p>
                  {!enterSubject ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-medium">
                      ⚠️ กรุณาเลือกรายวิชาด้านบนก่อน เพื่อเปิดสิทธิ์การเลือกชั้นเรียน
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {classrooms.map(c => {
                        const total = students.filter(s => s.classroom_id === c.id).length;
                        const saved = students.filter(s => s.classroom_id === c.id).filter(s =>
                          grades.some(g =>
                            g.student_id === s.student_id &&
                            g.subject.trim().toLowerCase() === enterSubject.trim().toLowerCase() &&
                            g.term === enterTerm
                          )
                        ).length;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setEnterClassroom(c.id)}
                            className={`relative flex flex-col items-center px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                              enterClassroom === c.id
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                          >
                            <span>{c.name}</span>
                            {enterSubject && (
                              <span className={`text-xs mt-0.5 font-medium ${enterClassroom === c.id ? "text-indigo-200" : "text-gray-400"}`}>
                                {saved}/{total} คน
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {enterSubject && !enterClassroom && (
                    <div className="bg-indigo-50/50 border border-dashed border-indigo-200 text-indigo-700 py-10 px-4 text-center rounded-2xl font-semibold mb-6">
                      👈 กรุณาเลือกชั้นเรียนด้านบนที่คุณต้องการกรอกคะแนน
                    </div>
                  )}

                  {/* Students Table */}
                  {enterSubject && enterClassroom && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <span className="font-bold text-gray-800 text-base">
                            ห้อง {classrooms.find(c => c.id === enterClassroom)?.name}
                          </span>
                          <span className="text-gray-400 text-sm ml-2">
                            ({currentClassroomStudents.length} คน)
                          </span>
                          {enterSubject && (
                            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                              กรอกแล้ว {filledCount}/{currentClassroomStudents.length} คน
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleSaveAll}
                          disabled={!enterSubject || !isGradingActive}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          บันทึกทั้งชั้น
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-gray-200 mb-6">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                              <th className="px-4 py-3 font-semibold w-10 text-center">ที่</th>
                              <th className="px-4 py-3 font-semibold">รหัสนักเรียน</th>
                              <th className="px-4 py-3 font-semibold">ชื่อ-สกุล</th>
                              <th className="px-4 py-3 font-semibold text-center w-28">
                                คะแนนเก็บ
                                <span className="block text-xs text-gray-400 font-normal">(เต็ม 50)</span>
                              </th>
                              <th className="px-4 py-3 font-semibold text-center w-28">
                                คะแนนสอบ
                                <span className="block text-xs text-gray-400 font-normal">(เต็ม 50)</span>
                              </th>
                              <th className="px-4 py-3 font-semibold text-center w-20">รวม</th>
                              <th className="px-4 py-3 font-semibold text-center w-16">เกรด</th>
                              <th className="px-4 py-3 font-semibold text-center w-24">บันทึก</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {currentClassroomStudents.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-10 text-center text-gray-400">
                                  ไม่มีนักเรียนในชั้นเรียนนี้
                                </td>
                              </tr>
                            ) : (
                              currentClassroomStudents.map((s, idx) => {
                                const row = rowScores[s.student_id] || { midterm: "", final: "" };
                                const midNum = Number(row.midterm) || 0;
                                const finalNum = Number(row.final) || 0;
                                const total = row.midterm !== "" || row.final !== "" ? midNum + finalNum : null;
                                const gradeInfo = total !== null ? getGradeLabel(total) : null;
                                const isSaved = grades.some(
                                  g => g.student_id === s.student_id &&
                                    g.subject.trim().toLowerCase() === enterSubject.trim().toLowerCase() &&
                                    g.term === enterTerm
                                );

                                return (
                                  <tr
                                    key={s.id}
                                    className={`hover:bg-indigo-50/40 transition-colors ${isSaved && enterSubject ? "bg-green-50/30" : ""}`}
                                  >
                                    <td className="px-4 py-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-indigo-600">{s.student_id}</td>
                                    <td className="px-4 py-3 text-gray-800 font-medium">{s.name}</td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        disabled={!isGradingActive}
                                        value={row.midterm}
                                        onChange={e =>
                                          setRowScores(prev => ({
                                            ...prev,
                                            [s.student_id]: { ...prev[s.student_id], midterm: e.target.value },
                                          }))
                                        }
                                        placeholder="0-50"
                                        className={`w-full text-center px-2 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-300 outline-none transition-all ${
                                          !isGradingActive ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                                        }`}
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        disabled={!isGradingActive}
                                        value={row.final}
                                        onChange={e =>
                                          setRowScores(prev => ({
                                            ...prev,
                                            [s.student_id]: { ...prev[s.student_id], final: e.target.value },
                                          }))
                                        }
                                        placeholder="0-50"
                                        className={`w-full text-center px-2 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-300 outline-none transition-all ${
                                          !isGradingActive ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                                        }`}
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-800">
                                      {total !== null ? total : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {gradeInfo ? (
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-sm font-extrabold border ${gradeInfo.color}`}>
                                          {gradeInfo.label}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <button
                                          onClick={() => handleSaveRow(s)}
                                          disabled={!enterSubject || !isGradingActive}
                                          className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                          บันทึก
                                        </button>
                                        {isSaved && enterSubject && (
                                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                            บันทึกแล้ว
                                          </span>
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
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ===== TAB 2: STATUS ===== */}
            {activeTab === "status" && (
              <div className="p-8">
                <div className={`mb-6 p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 shadow-sm ${
                  isGradingActive
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {isGradingActive ? (
                    <>
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>🟢 ระบบเปิดให้บันทึกคะแนนปกติ (ช่วงเวลากรอกคะแนน: {settingsStartDate} ถึง {settingsEndDate})</span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span>🔴 ปิดระบบบันทึกคะแนนชั่วคราว (อยู่นอกช่วงเวลาที่กำหนด: {settingsStartDate} ถึง {settingsEndDate})</span>
                    </>
                  )}
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">ตรวจสอบสถานะการใส่คะแนน</h2>
                  <p className="text-gray-500 text-sm">เช็คว่าเด็กคนไหนยังไม่ถูกกรอกคะแนนในวิชาที่เลือก</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 font-semibold">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">รายวิชา</label>
                    <select
                      value={statusSubject}
                      onChange={e => {
                        setStatusSubject(e.target.value);
                        setStatusClassroom("");
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold focus:ring-2 focus:ring-indigo-400 outline-none"
                    >
                      <option value="">-- เลือกรายวิชา --</option>
                      {teacherUser?.role === 'admin' ? (
                        Array.from(new Set(grades.map(g => g.subject))).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))
                      ) : (
                        teacherUser?.subjects?.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชั้นเรียน</label>
                    <select
                      value={statusClassroom}
                      onChange={e => setStatusClassroom(e.target.value)}
                      disabled={!statusSubject}
                      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white ${
                        !statusSubject ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "font-semibold"
                      }`}
                    >
                      <option value="">-- เลือกชั้นเรียน --</option>
                      {classrooms.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">เทอม (ล็อกโดยแอดมิน)</label>
                    <input
                      type="text"
                      value={statusTerm}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed font-semibold outline-none"
                    />
                  </div>
                </div>

                {statusSubject && statusClassroom ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 font-semibold w-10 text-center">ที่</th>
                          <th className="px-6 py-4 font-semibold">รหัสนักเรียน</th>
                          <th className="px-6 py-4 font-semibold">ชื่อนักเรียน</th>
                          <th className="px-6 py-4 font-semibold text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {statusStudents.map((s, idx) => {
                          const hasGrade = grades.some(
                            g =>
                              g.student_id === s.student_id &&
                              g.subject.trim().toLowerCase() === statusSubject.trim().toLowerCase() &&
                              g.term === statusTerm
                          );
                          return (
                            <tr key={s.id} className={`hover:bg-gray-50/50 ${hasGrade ? "bg-green-50/30" : ""}`}>
                              <td className="px-6 py-4 text-center text-gray-400">{idx + 1}</td>
                              <td className="px-6 py-4 font-semibold text-indigo-600">{s.student_id}</td>
                              <td className="px-6 py-4 text-gray-800">{s.name}</td>
                              <td className="px-6 py-4 text-center">
                                {hasGrade ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    บันทึกแล้ว
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-xs">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    ยังไม่บันทึก
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {statusStudents.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-10 text-center text-gray-400">ไม่มีข้อมูลนักเรียนในชั้นเรียนนี้</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : !statusSubject ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 font-semibold">
                    กรุณาเลือกรายวิชาในช่องด้านบน เพื่อดูสถานะการกรอกคะแนน
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 font-semibold">
                    👈 กรุณาเลือกชั้นเรียนในช่องด้านบน เพื่อดูสถานะรายบุคคล
                  </div>
                )}
              </div>
            )}

            {/* ===== TAB 3: HOMEROOM ===== */}
            {activeTab === "homeroom" && (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">ข้อมูลเด็กในประจำชั้น</h2>
                  <p className="text-gray-500 text-sm">
                    {homeroomClass
                      ? `สรุปเกรดเฉลี่ยของเด็กห้อง ${homeroomClass.name}`
                      : "คุณยังไม่ได้ถูกกำหนดให้เป็นครูประจำชั้น"}
                  </p>
                </div>

                {!homeroomClass ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    โปรดติดต่อแอดมิน เพื่อผูกข้อมูลครูประจำชั้นของคุณ
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                          <th className="px-5 py-3.5 font-semibold text-center w-10">ที่</th>
                          <th className="px-5 py-3.5 font-semibold">รหัสนักเรียน</th>
                          <th className="px-5 py-3.5 font-semibold">ชื่อ-สกุล</th>
                          <th className="px-5 py-3.5 font-semibold text-center">จำนวนวิชา</th>
                          <th className="px-5 py-3.5 font-semibold text-center">เกรดเฉลี่ย</th>
                          <th className="px-5 py-3.5 font-semibold text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {homeroomStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-gray-400">
                              ไม่มีข้อมูลนักเรียนในห้องประจำชั้นนี้
                            </td>
                          </tr>
                        ) : (
                          homeroomStudents.map((s, idx) => {
                            const gpa = calculateGPAForStudent(s.student_id);
                            const gpaNum = parseFloat(gpa);
                            const subjectCount = grades.filter(g => g.student_id === s.student_id).length;
                            let gpaColor = "bg-green-100 text-green-700 border-green-200";
                            let statusLabel = "ดีเยี่ยม";
                            if (gpaNum < 1.0) { gpaColor = "bg-red-100 text-red-700 border-red-200"; statusLabel = "ต้องปรับปรุง"; }
                            else if (gpaNum < 2.0) { gpaColor = "bg-orange-100 text-orange-700 border-orange-200"; statusLabel = "พอใช้"; }
                            else if (gpaNum < 3.0) { gpaColor = "bg-yellow-100 text-yellow-700 border-yellow-200"; statusLabel = "ดี"; }

                            return (
                              <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-5 py-4 text-center text-gray-400">{idx + 1}</td>
                                <td className="px-5 py-4 font-semibold text-indigo-600">{s.student_id}</td>
                                <td className="px-5 py-4 font-medium text-gray-800">{s.name}</td>
                                <td className="px-5 py-4 text-center text-gray-600">{subjectCount} วิชา</td>
                                <td className="px-5 py-4 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-lg border font-bold text-base ${gpaColor}`}>
                                    {gpa}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${gpaColor}`}>
                                    {statusLabel}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
