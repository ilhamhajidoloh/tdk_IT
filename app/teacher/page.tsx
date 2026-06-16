"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../lib/useAuth";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { formatThaiDateRange } from "../lib/format";

type Tab = "enter" | "status" | "homeroom" | "schedule";

interface DBStudent { id: string; name: string; student_id: string; classroom_id: string; student_number?: number | null; }
interface DBGrade { id: string; student_id: string; subject: string; midterm_score: number | null; final_score: number | null; term: string; }
interface DBClassroom { id: string; name: string; setting_id?: number; }
interface DBSubject { id: string; name: string; teacher_id?: string | null; setting_id?: number | null; midterm_max_score?: number | null; final_max_score?: number | null; subject_type?: "main" | "activity"; credit_hours?: number | null; score_display_mode?: "separate" | "combined"; classroom_ids?: string[]; }
interface SchedulePeriod { id: string; setting_id: number | string; period_no: number | string; start_time: string; end_time: string; label?: string | null; is_break?: boolean; }
interface ScheduleEntry {
  id: string; classroom_id: string; classroom_name: string;
  subject_id: string; subject_name: string; teacher_id: string | null; teacher_name: string | null;
  day_of_week: number | string; period_id: string; period_no: number | string; start_time: string; end_time: string; label?: string | null;
}

interface RowScore {
  midterm: string;
  final: string;
}

const ALL_DAYS = [
  { value: 1, label: "จันทร์", short: "จ" },
  { value: 2, label: "อังคาร", short: "อ" },
  { value: 3, label: "พุธ", short: "พ" },
  { value: 4, label: "พฤหัสบดี", short: "พฤ" },
  { value: 5, label: "ศุกร์", short: "ศ" },
  { value: 6, label: "เสาร์", short: "ส" },
  { value: 0, label: "อาทิตย์", short: "อา" },
];

const DAY_COLORS: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-800 border-yellow-200",
  2: "bg-pink-100 text-pink-800 border-pink-200",
  3: "bg-green-100 text-green-800 border-green-200",
  4: "bg-orange-100 text-orange-800 border-orange-200",
  5: "bg-blue-100 text-blue-800 border-blue-200",
  6: "bg-purple-100 text-purple-800 border-purple-200",
  0: "bg-red-100 text-red-800 border-red-200",
};

const NAV_TABS: { key: Tab; label: string; icon: string; }[] = [
  {
    key: "enter",
    label: "บันทึกคะแนน",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  },
  {
    key: "status",
    label: "สถานะคะแนน",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    key: "homeroom",
    label: "ห้องประจำชั้น",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    key: "schedule",
    label: "ตารางสอน",
    icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
];

function LoadingScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-bold">{title}</p>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function TeacherPortal() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [students, setStudents] = useState<DBStudent[]>([]);
  const [grades, setGrades] = useState<DBGrade[]>([]);
  const [classrooms, setClassrooms] = useState<DBClassroom[]>([]);
  const [subjectsList, setSubjectsList] = useState<DBSubject[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("enter");
  const [activeSettingId, setActiveSettingId] = useState<number | null>(null);
  const [scheduleDaysConfig, setScheduleDaysConfig] = useState<number[]>([1, 2, 3, 4, 5]);
  const router = useRouter();

  const { user: teacherUser, loading, logout, token } = useAuth();
  const [homeroomClass, setHomeroomClass] = useState<DBClassroom | null>(null);

  const [isGradingActive, setIsGradingActive] = useState(true);
  const [settingsStartDate, setSettingsStartDate] = useState("");
  const [settingsEndDate, setSettingsEndDate] = useState("");
  const [midtermMax, setMidtermMax] = useState(50);
  const [finalMax, setFinalMax] = useState(50);

  const [enterClassroom, setEnterClassroom] = useState("");
  const [enterSubject, setEnterSubject] = useState("");
  const [enterTerm, setEnterTerm] = useState("1/2568");
  const [rowScores, setRowScores] = useState<Record<string, RowScore>>({});

  const [statusClassroom, setStatusClassroom] = useState("");
  const [statusSubject, setStatusSubject] = useState("");
  const [statusTerm, setStatusTerm] = useState("1/2568");

  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // จัดการผลลัพธ์จากการเชื่อมต่อบัญชี Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("linked");
    const linkError = params.get("linkError");

    if (linked) {
      window.history.replaceState({}, "", "/teacher");
      Swal.fire("สำเร็จ!", `เชื่อมต่ออีเมล Google สำเร็จ: ${linked}`, "success");
    } else if (linkError) {
      window.history.replaceState({}, "", "/teacher");
      Swal.fire("ข้อผิดพลาด", linkError, "error");
    }
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

    fetch("/api/subjects", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSubjectsList(data);
      })
      .catch(console.error);

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
        setMidtermMax(s.midterm_max_score ?? 50);
        setFinalMax(s.final_max_score ?? 50);
        setActiveSettingId(s.id);
        if (Array.isArray(s.schedule_days)) setScheduleDaysConfig(s.schedule_days);
        const todayStr = new Date().toISOString().split("T")[0];
        setIsGradingActive(todayStr >= (s.start_date ?? "") && todayStr <= (s.end_date ?? ""));
      });

    setEnterClassroom("");
    setStatusClassroom("");
  }, [loading, teacherUser, token, router]);

  const ACTIVE_DAYS = ALL_DAYS.filter(d => scheduleDaysConfig.includes(d.value));

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

  useEffect(() => {
    if (!enterClassroom) return;
    const classStudents = students.filter(s => s.classroom_id === enterClassroom);
    const subjectObj = subjectsList.find(s => s.name?.trim().toLowerCase() === enterSubject?.trim().toLowerCase() && s.setting_id === activeSettingId);
    const combined = subjectObj?.subject_type === "activity" && subjectObj?.score_display_mode === "combined";
    const newRowScores: Record<string, RowScore> = {};
    classStudents.forEach(s => {
      const existing = grades.find(
        g => g.student_id === s.student_id &&
          g.subject.trim().toLowerCase() === enterSubject.trim().toLowerCase() &&
          g.term === enterTerm
      );
      if (combined) {
        newRowScores[s.student_id] = {
          midterm: existing ? String((existing.midterm_score ?? 0) + (existing.final_score ?? 0)) : "",
          final: "0",
        };
      } else {
        newRowScores[s.student_id] = {
          midterm: existing && existing.midterm_score != null ? String(existing.midterm_score) : "",
          final: existing && existing.final_score != null ? String(existing.final_score) : "",
        };
      }
    });
    setRowScores(newRowScores);
  }, [enterClassroom, enterSubject, enterTerm, students, grades, subjectsList, activeSettingId]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/");
  };

  const handleChangePassword = async () => {
    const { value: newPassword } = await Swal.fire({
      title: "เปลี่ยนรหัสผ่าน",
      input: "password",
      inputLabel: "รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)",
      inputPlaceholder: "กรอกรหัสผ่านใหม่",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร!";
        }
      }
    });

    if (newPassword) {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        Swal.fire("สำเร็จ!", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "success");
      } else {
        const data = await res.json();
        Swal.fire("ข้อผิดพลาด", data.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้", "error");
      }
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/link-google/start";
  };

  const handleSaveRow = async (student: DBStudent) => {
    const row = rowScores[student.student_id];
    if (!enterSubject.trim()) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อวิชา", confirmButtonColor: "#4f46e5" });
      return;
    }
    if (!row?.midterm || (!isCombined && !row?.final)) {
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
        final_score: isCombined ? 0 : Number(row.final),
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
      return r?.midterm !== "" && (isCombined || r?.final !== "");
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
          final_score: isCombined ? 0 : Number(row.final),
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

  const getGradeLabel = (total: number, maxTotal: number) => {
    const percent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    if (percent >= 80) return { label: "A", point: "4.0", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (percent >= 75) return { label: "B+", point: "3.5", color: "bg-green-100 text-green-700 border-green-200" };
    if (percent >= 70) return { label: "B", point: "3.0", color: "bg-teal-100 text-teal-700 border-teal-200" };
    if (percent >= 65) return { label: "C+", point: "2.5", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (percent >= 60) return { label: "C", point: "2.0", color: "bg-sky-100 text-sky-700 border-sky-200" };
    if (percent >= 55) return { label: "D+", point: "1.5", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    if (percent >= 50) return { label: "D", point: "1.0", color: "bg-orange-100 text-orange-700 border-orange-200" };
    return { label: "F", point: "0.0", color: "bg-red-100 text-red-700 border-red-200" };
  };

  const getResultLabel = (total: number, maxTotal: number, subjectType: "main" | "activity") => {
    if (subjectType === "activity") {
      const percent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
      return percent >= 50
        ? { label: "ผ่าน", point: "ผ่าน", color: "bg-emerald-100 text-emerald-700 border-emerald-200" }
        : { label: "ไม่ผ่าน", point: "ไม่ผ่าน", color: "bg-red-100 text-red-700 border-red-200" };
    }
    return getGradeLabel(total, maxTotal);
  };

  const handleChangeDisplayMode = async (mode: "separate" | "combined") => {
    if (!currentSubjectObj) return;
    const res = await fetch(`/api/subjects/${currentSubjectObj.id}/display-mode`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score_display_mode: mode }),
    });
    if (!res.ok) {
      Swal.fire({ icon: "error", title: "เปลี่ยนรูปแบบคะแนนไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
      return;
    }
    setSubjectsList(prev => prev.map(s => s.id === currentSubjectObj.id ? { ...s, score_display_mode: mode } : s));
  };

  const handleScoreChange = (val: string, max: number) => {
    if (val === "") return "";
    const num = Number(val);
    if (isNaN(num) || num < 0) return "0";
    if (num > max) return max.toString();
    return num.toString();
  };

  const calculateGPAForStudent = (studentId: string) => {
    const sg = grades.filter(g => g.student_id === studentId);
    let totalPoints = 0;
    let totalCredits = 0;
    sg.forEach(g => {
      const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
      if (subject?.subject_type === "activity") return;
      const mMax = Number(subject?.midterm_max_score) || midtermMax;
      const fMax = Number(subject?.final_max_score) || finalMax;
      const creditHours = Number(subject?.credit_hours) || 1;
      const t = (g.midterm_score ?? 0) + (g.final_score ?? 0);
      const percent = mMax + fMax > 0 ? (t / (mMax + fMax)) * 100 : 0;
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

  if (isLoggingOut) return <LoadingScreen title="กำลังออกจากระบบ..." subtitle="ขอบคุณที่ใช้งานระบบ" />;
  if (!isClient || loading || !teacherUser) return <LoadingScreen title="กำลังโหลดข้อมูล..." subtitle="โปรดรอสักครู่ ระบบกำลังตรวจสอบสิทธิ์การใช้งาน" />;

  const currentSubjectObj = subjectsList.find(s => s.name?.trim().toLowerCase() === enterSubject?.trim().toLowerCase() && s.setting_id === activeSettingId);
  const currentMidtermMax = Number(currentSubjectObj?.midterm_max_score) || midtermMax;
  const currentFinalMax = Number(currentSubjectObj?.final_max_score) || finalMax;
  const currentSubjectType = currentSubjectObj?.subject_type ?? "main";
  const currentDisplayMode = currentSubjectObj?.score_display_mode ?? "separate";
  const isCombined = currentSubjectType === "activity" && currentDisplayMode === "combined";

  const currentClassroomStudents = students.filter(s => s.classroom_id === enterClassroom);
  const statusStudents = students.filter(s => s.classroom_id === statusClassroom);
  const homeroomStudents = students.filter(s => s.classroom_id === homeroomClass?.id);

  const savedCount = currentClassroomStudents.filter(s => {
    return grades.some(g => g.student_id === s.student_id && g.subject.trim().toLowerCase() === enterSubject.trim().toLowerCase() && g.term === enterTerm);
  }).length;

  const mySubjects = teacherUser?.role === "admin"
    ? subjectsList.filter(s => s.setting_id === activeSettingId)
    : subjectsList.filter(s => s.teacher_id === teacherUser?.id && s.setting_id === activeSettingId);

  const myScheduleEntries = scheduleEntries.filter(e => {
    if (e.teacher_id) return e.teacher_id === teacherUser?.id;
    const subj = subjectsList.find(s => s.id === e.subject_id && s.setting_id === activeSettingId);
    return subj?.teacher_id === teacherUser?.id;
  });

  const scoredActivitySubjects = subjectsList.filter(s =>
    s.subject_type === "activity" &&
    s.setting_id === activeSettingId &&
    (Number(s.midterm_max_score) + Number(s.final_max_score)) > 0
  );
  const useCombinedActivity = scoredActivitySubjects.length >= 2;

  const getCombinedActivityResult = (studentId: string, termStr: string) => {
    if (!useCombinedActivity) return null;
    let totalScore = 0;
    let totalMax = 0;
    scoredActivitySubjects.forEach(sub => {
      const mMax = Number(sub.midterm_max_score) || 0;
      const fMax = Number(sub.final_max_score) || 0;
      totalMax += mMax + fMax;
      const g = grades.find(gr =>
        gr.student_id === studentId &&
        gr.subject.trim().toLowerCase() === sub.name.trim().toLowerCase() &&
        gr.term === termStr
      );
      if (g) totalScore += (g.midterm_score ?? 0) + (g.final_score ?? 0);
    });
    if (totalMax === 0) return null;
    const percent = (totalScore / totalMax) * 100;
    return {
      totalScore, totalMax, percent,
      pass: percent >= 50,
      label: percent >= 50 ? "ผ่าน" : "ไม่ผ่าน",
      color: percent >= 50
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : "bg-red-100 text-red-700 border-red-200",
    };
  };

  const handleExportTeacherSchedule = () => {
    if (!schedulePeriods.length || !myScheduleEntries.length) return;
    const teacherName = teacherUser?.username || "ครู";
    const dateStr = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    const thBase = "padding:5px 8px;background:#1e293b;color:#f8fafc;font-size:10px;font-weight:700;text-align:center;border:1px solid #334155;";
    const periodHeader = `<th style="${thBase}text-align:left;min-width:80px;">คาบ</th>`;
    const dayHeaders = ACTIVE_DAYS.map(d => `<th style="${thBase}min-width:100px;">วัน${d.label}</th>`).join("");
    const rows = schedulePeriods.map(p => {
      const pCell = `<td style="padding:5px 8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;font-weight:700;white-space:nowrap;vertical-align:middle;">
        ${p.label ? `<div style="font-size:9px;color:#d97706;font-weight:700;">${p.label}</div>` : ""}
        <div style="color:#374151;">คาบ ${p.period_no}</div>
        <div style="font-size:9px;color:#94a3b8;font-weight:400;">${p.start_time}–${p.end_time}</div>
      </td>`;
      if (p.is_break) {
        return `<tr>${pCell}<td colspan="${ACTIVE_DAYS.length}" style="padding:5px;text-align:center;background:#f1f5f9;border:1px solid #e2e8f0;color:#94a3b8;font-size:10px;">${p.label || "พักเบรก"}</td></tr>`;
      }
      const cells = ACTIVE_DAYS.map(d => {
        const entries = myScheduleEntries.filter(e => Number(e.day_of_week) === d.value && e.period_id === p.id);
        if (!entries.length) return `<td style="border:1px solid #f1f5f9;min-width:100px;"></td>`;
        return `<td style="padding:5px 6px;border:1px solid #bfdbfe;background:#eff6ff;text-align:center;vertical-align:middle;">
          ${entries.map(e => `<div style="margin-bottom:2px;">
            <div style="font-size:11px;font-weight:700;color:#1e40af;">${e.subject_name}</div>
            <div style="font-size:9px;color:#3b82f6;">ห้อง ${e.classroom_name}</div>
          </div>`).join("")}
        </td>`;
      }).join("");
      return `<tr>${pCell}${cells}</tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>ตารางสอน · ${teacherName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Sarabun:wght@300;400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{font-family:'Inter','Sarabun','Noto Naskh Arabic',ui-sans-serif,system-ui,sans-serif;background:#fff;color:#1e293b;padding:20px;}
  h1{font-size:18px;font-weight:800;margin-bottom:4px;}
  .meta{font-size:12px;color:#64748b;margin-bottom:16px;}
  .print-btn{position:fixed;top:12px;right:12px;padding:8px 18px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);}
  @media print{.print-btn{display:none;} @page{margin:1cm;size:A4 landscape;}}
</style>
</head><body>
<button class="print-btn" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
<h1>ตารางสอน · ${teacherName}</h1>
<div class="meta">เทอม ${enterTerm} · ออกรายงาน ณ ${dateStr}</div>
<table style="width:100%;border-collapse:collapse;font-family:inherit;">
  <thead><tr>${periodHeader}${dayHeaders}</tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Logo + Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow border border-slate-100">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-sm leading-tight truncate">
                {teacherUser?.username || "ครู"}
              </div>
              <div className="text-xs text-slate-400 font-medium truncate">
                {homeroomClass ? `ครูประจำชั้น · ${homeroomClass.name}` : "ระบบจัดการคะแนน"}
              </div>
            </div>
          </div>

          {/* Center: Status Badge */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isGradingActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            {isGradingActive ? `เปิดบันทึก · เทอม ${enterTerm}` : `ปิดบันทึก · นอกช่วงเวลา`}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleConnectGoogle}
              title={teacherUser?.email ? `เชื่อมต่ออีเมล: ${teacherUser.email}` : "เชื่อมต่ออีเมล Google"}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${teacherUser?.email ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-slate-500 border-slate-200 hover:text-indigo-600 hover:bg-indigo-50"}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleChangePassword}
              title="เปลี่ยนรหัสผ่าน"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-colors border border-rose-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== TAB NAV ===== */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
            {NAV_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
                </svg>
                {tab.label}
                {tab.key === "enter" && enterSubject && enterClassroom && (
                  <span className="ml-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {savedCount}/{currentClassroomStudents.length}
                  </span>
                )}
                {tab.key === "homeroom" && homeroomClass && (
                  <span className="ml-1 bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {homeroomStudents.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* ==================== TAB 1: ENTER GRADES ==================== */}
        {activeTab === "enter" && (
          <div className="space-y-5">

            {/* Grading Status Banner */}
            {!isGradingActive && (
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-sm font-semibold">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>🔴 ระบบปิดรับคะแนนชั่วคราว — นอกช่วงเวลา {formatThaiDateRange(settingsStartDate, settingsEndDate)}</span>
              </div>
            )}

            {/* Step 1: Select Subject */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">1</span>
                <div>
                  <div className="font-bold text-slate-800 text-sm">เลือกรายวิชา</div>
                  <div className="text-xs text-slate-400">วิชาที่คุณสอนในเทอมนี้</div>
                </div>
              </div>
              <div className="p-5">
                {mySubjects.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">ยังไม่มีวิชาที่กำหนดให้คุณสอนในเทอมนี้</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {mySubjects.map(s => {
                      const isSelected = enterSubject === s.name;
                      const savedForSubject = students.filter(st => grades.some(g => g.student_id === st.student_id && g.subject.trim().toLowerCase() === s.name.trim().toLowerCase() && g.term === enterTerm)).length;
                      const totalInSubjectClassrooms = students.filter(st => (s as any).classroom_ids?.includes(st.classroom_id)).length;
                      return (
                        <button
                          key={s.id}
                          onClick={() => { setEnterSubject(s.name); setEnterClassroom(""); }}
                          className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                              : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60"
                          }`}
                        >
                          <span className="font-bold text-sm">{s.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
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
                    <span className="text-xs font-semibold text-slate-500">รูปแบบกรอกคะแนน:</span>
                    {(["separate", "combined"] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => handleChangeDisplayMode(mode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          currentDisplayMode === mode
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
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
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">เลือกห้องเรียน</div>
                    <div className="text-xs text-slate-400">วิชา: <span className="text-indigo-600 font-semibold">{enterSubject}</span></div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
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
                          className={`relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all cursor-pointer ${
                            isActive
                              ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-100"
                              : isComplete
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/60"
                          }`}
                        >
                          {isComplete && !isActive && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <span className="font-extrabold text-base leading-tight">{c.name}</span>
                          <span className={`text-xs mt-1.5 font-semibold ${isActive ? "text-indigo-200" : isComplete ? "text-emerald-600" : "text-slate-400"}`}>
                            {saved}/{total} คน
                          </span>
                          {total > 0 && !isActive && (
                            <div className="w-full mt-2 h-1 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-indigo-400"}`}
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
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        กรอกคะแนน · ห้อง {classrooms.find(c => c.id === enterClassroom)?.name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                        <span>{currentClassroomStudents.length} คน</span>
                        <span className="text-slate-200">·</span>
                        <span className="text-emerald-600 font-semibold">{savedCount} บันทึกแล้ว</span>
                        {currentSubjectType !== "activity" && (
                          <>
                            <span className="text-slate-200">·</span>
                            <span className="text-indigo-600 font-semibold">{Number(currentSubjectObj?.credit_hours) || 1} หน่วยกิต</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveAll}
                    disabled={!isGradingActive}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    บันทึกทั้งชั้น
                  </button>
                </div>

                {useCombinedActivity && currentSubjectType === "activity" && (
                  <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 font-medium">
                    คอลัมน์ <span className="font-bold">ผล</span> คำนวณจากคะแนนรวมทุกวิชากิจกรรมที่มีคะแนน:{" "}
                    <span className="font-bold">{scoredActivitySubjects.map(s => s.name).join(", ")}</span>
                  </div>
                )}

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs">
                        <th className="px-4 py-3 text-center font-semibold w-10">#</th>
                        <th className="px-4 py-3 font-semibold w-28">รหัส</th>
                        <th className="px-4 py-3 font-semibold">ชื่อ-สกุล</th>
                        {isCombined ? (
                          <th className="px-4 py-3 text-center font-semibold w-32">
                            คะแนนรวม
                            <div className="text-[10px] text-slate-400 font-normal">(/{currentMidtermMax + currentFinalMax})</div>
                          </th>
                        ) : (
                          <>
                            <th className="px-4 py-3 text-center font-semibold w-28">
                              เก็บ
                              <div className="text-[10px] text-slate-400 font-normal">(/{currentMidtermMax})</div>
                            </th>
                            <th className="px-4 py-3 text-center font-semibold w-28">
                              สอบ
                              <div className="text-[10px] text-slate-400 font-normal">(/{currentFinalMax})</div>
                            </th>
                          </>
                        )}
                        <th className="px-4 py-3 text-center font-semibold w-16">รวม</th>
                        <th className="px-4 py-3 text-center font-semibold w-20">
                          {currentSubjectType === "activity"
                            ? (useCombinedActivity ? "ผล (รวม)" : "ผล")
                            : "เกรด"}
                        </th>
                        <th className="px-4 py-3 text-center font-semibold w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentClassroomStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
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
                              className={`hover:bg-slate-50/80 transition-colors ${isSaved ? "bg-emerald-50/40" : ""}`}
                            >
                              <td className="px-4 py-3 text-center text-slate-400 font-medium text-xs">{idx + 1}</td>
                              <td className="px-4 py-3 font-bold text-indigo-600 text-xs">{s.student_id}</td>
                              <td className="px-4 py-3 text-slate-800 font-medium">
                                <div className="flex items-center gap-2">
                                  {s.name}
                                  {isSaved && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
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
                                    className="w-full text-center px-2 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
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
                                      className="w-full text-center px-2 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
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
                                      className="w-full text-center px-2 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                                    />
                                  </td>
                                </>
                              )}
                              <td className="px-4 py-3 text-center font-bold text-slate-800">
                                {total !== null ? total : <span className="text-slate-300">—</span>}
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
                                        <span className="text-[10px] text-slate-400">{Math.round(combined.percent)}%</span>
                                      </div>
                                    ) : <span className="text-slate-300">—</span>;
                                  })()
                                ) : resultInfo ? (
                                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border ${resultInfo.color}`}>
                                    {resultInfo.label}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleSaveRow(s)}
                                    disabled={!isGradingActive}
                                    className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    บันทึก
                                  </button>
                                  {existingGrade && (
                                    <button
                                      onClick={() => handleDeleteGrade(existingGrade.id)}
                                      disabled={!isGradingActive}
                                      className="text-xs text-rose-500 hover:text-rose-700 disabled:text-slate-300 disabled:cursor-not-allowed font-semibold px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
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
                <div className="md:hidden divide-y divide-slate-100">
                  {currentClassroomStudents.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">ไม่มีนักเรียนในชั้นเรียนนี้</div>
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
                        <div key={s.id} className={`p-4 ${isSaved ? "bg-emerald-50/40" : "bg-white"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-bold text-slate-800">{s.name}</div>
                              <div className="text-xs text-indigo-600 font-semibold mt-0.5">{s.student_id}</div>
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
                                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          </div>
                          {isCombined ? (
                            <div className="mb-3">
                              <label className="block text-xs text-slate-500 mb-1.5 font-semibold">คะแนนรวม <span className="text-slate-400 font-normal">(เต็ม {currentMidtermMax + currentFinalMax})</span></label>
                              <input
                                type="number" min="0" max={currentMidtermMax + currentFinalMax}
                                disabled={!isGradingActive}
                                value={row.midterm}
                                onChange={e => setRowScores(prev => ({
                                  ...prev,
                                  [s.student_id]: { ...prev[s.student_id], midterm: handleScoreChange(e.target.value, currentMidtermMax + currentFinalMax), final: "0" },
                                }))}
                                className="w-full text-center px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none text-base font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1.5 font-semibold">เก็บ <span className="text-slate-400 font-normal">/{currentMidtermMax}</span></label>
                                <input
                                  type="number" min="0" max={currentMidtermMax}
                                  disabled={!isGradingActive}
                                  value={row.midterm}
                                  onChange={e => setRowScores(prev => ({
                                    ...prev,
                                    [s.student_id]: { ...prev[s.student_id], midterm: handleScoreChange(e.target.value, currentMidtermMax) },
                                  }))}
                                  className="w-full text-center px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none text-base font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1.5 font-semibold">สอบ <span className="text-slate-400 font-normal">/{currentFinalMax}</span></label>
                                <input
                                  type="number" min="0" max={currentFinalMax}
                                  disabled={!isGradingActive}
                                  value={row.final}
                                  onChange={e => setRowScores(prev => ({
                                    ...prev,
                                    [s.student_id]: { ...prev[s.student_id], final: handleScoreChange(e.target.value, currentFinalMax) },
                                  }))}
                                  className="w-full text-center px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none text-base font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div className="text-sm font-bold text-slate-700">
                              รวม: {total !== null ? <span className="text-indigo-600">{total}</span> : <span className="text-slate-300">—</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {existingGrade && (
                                <button
                                  onClick={() => handleDeleteGrade(existingGrade.id)}
                                  disabled={!isGradingActive}
                                  className="text-xs text-rose-500 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-40"
                                >ลบ</button>
                              )}
                              <button
                                onClick={() => handleSaveRow(s)}
                                disabled={!isGradingActive}
                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed"
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
              <div className="text-center py-16 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="font-semibold text-slate-500">เริ่มต้นด้วยการเลือกรายวิชาด้านบน</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: STATUS ==================== */}
        {activeTab === "status" && (
          <div className="space-y-5">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">รายวิชา</label>
                  <select
                    value={statusSubject}
                    onChange={e => { setStatusSubject(e.target.value); setStatusClassroom(""); }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-semibold"
                  >
                    <option value="">— เลือกรายวิชา —</option>
                    {(teacherUser?.role === "admin"
                      ? Array.from(new Set(grades.map(g => g.subject))).map(sub => ({ name: sub }))
                      : subjectsList.filter(s => s.teacher_id === teacherUser?.id && s.setting_id === activeSettingId)
                    ).map((s, i) => (
                      <option key={i} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">ชั้นเรียน</label>
                  <select
                    value={statusClassroom}
                    onChange={e => setStatusClassroom(e.target.value)}
                    disabled={!statusSubject}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="">— เลือกชั้นเรียน —</option>
                    {classrooms.filter(c => mySubjects.find(s => s.name === statusSubject)?.classroom_ids?.includes(c.id)).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Status Table */}
            {statusSubject && statusClassroom ? (
              (() => {
                const hasCnt = statusStudents.filter(s => grades.some(g => g.student_id === s.student_id && g.subject.trim().toLowerCase() === statusSubject.trim().toLowerCase() && g.term === statusTerm)).length;
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">วิชา: <span className="text-indigo-600">{statusSubject}</span></div>
                        <div className="text-xs text-slate-400 mt-0.5">ห้อง {classrooms.find(c => c.id === statusClassroom)?.name} · เทอม {statusTerm}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xl font-extrabold text-emerald-600">{hasCnt}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">บันทึกแล้ว</div>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="text-center">
                          <div className="text-xl font-extrabold text-rose-500">{statusStudents.length - hasCnt}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">ยังไม่บันทึก</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {statusStudents.length > 0 && (
                      <div className="px-5 py-3 border-b border-slate-100">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                          <span>ความคืบหน้า</span>
                          <span>{Math.round((hasCnt / statusStudents.length) * 100)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${statusStudents.length > 0 ? Math.round((hasCnt / statusStudents.length) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs">
                            <th className="px-5 py-3 text-center font-semibold w-10">#</th>
                            <th className="px-5 py-3 font-semibold w-28">รหัส</th>
                            <th className="px-5 py-3 font-semibold">ชื่อนักเรียน</th>
                            <th className="px-5 py-3 text-center font-semibold w-32">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {statusStudents.map((s, idx) => {
                            const has = grades.some(g => g.student_id === s.student_id && g.subject.trim().toLowerCase() === statusSubject.trim().toLowerCase() && g.term === statusTerm);
                            return (
                              <tr key={s.id} className={`hover:bg-slate-50 ${has ? "bg-emerald-50/40" : ""}`}>
                                <td className="px-5 py-3.5 text-center text-slate-400 text-xs">{idx + 1}</td>
                                <td className="px-5 py-3.5 font-bold text-indigo-600 text-xs">{s.student_id}</td>
                                <td className="px-5 py-3.5 font-medium text-slate-800">{s.name}</td>
                                <td className="px-5 py-3.5 text-center">
                                  {has ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                      บันทึกแล้ว
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold text-xs">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                      ยังไม่บันทึก
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {statusStudents.length === 0 && (
                            <tr><td colSpan={4} className="py-10 text-center text-slate-400">ไม่มีนักเรียนในห้องนี้</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {statusStudents.map((s, idx) => {
                        const has = grades.some(g => g.student_id === s.student_id && g.subject.trim().toLowerCase() === statusSubject.trim().toLowerCase() && g.term === statusTerm);
                        return (
                          <div key={s.id} className={`flex items-center justify-between p-4 ${has ? "bg-emerald-50/40" : ""}`}>
                            <div>
                              <div className="font-semibold text-slate-800">{s.name}</div>
                              <div className="text-xs text-indigo-600 font-bold mt-0.5">{s.student_id}</div>
                            </div>
                            {has ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                บันทึกแล้ว
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-bold text-xs">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                ยังไม่บันทึก
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-16 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="font-semibold text-slate-500">{!statusSubject ? "เลือกรายวิชาเพื่อดูสถานะ" : "เลือกชั้นเรียนเพื่อดูรายชื่อ"}</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: HOMEROOM ==================== */}
        {activeTab === "homeroom" && (
          <div className="space-y-5">
            {!homeroomClass ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">ยังไม่ได้รับมอบหมายห้องประจำชั้น</h3>
                <p className="text-sm text-slate-400">กรุณาติดต่อแอดมินเพื่อให้ผูกข้อมูลครูประจำชั้น</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "นักเรียนทั้งหมด", value: homeroomStudents.length, color: "bg-indigo-50 text-indigo-700", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                    { label: "GPA ≥ 3.0", value: homeroomStudents.filter(s => parseFloat(calculateGPAForStudent(s.student_id)) >= 3.0).length, color: "bg-emerald-50 text-emerald-700", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
                    { label: "GPA < 2.0", value: homeroomStudents.filter(s => parseFloat(calculateGPAForStudent(s.student_id)) < 2.0 && parseFloat(calculateGPAForStudent(s.student_id)) > 0).length, color: "bg-amber-50 text-amber-700", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
                    { label: "GPA < 1.0", value: homeroomStudents.filter(s => parseFloat(calculateGPAForStudent(s.student_id)) < 1.0 && grades.some(g => g.student_id === s.student_id)).length, color: "bg-rose-50 text-rose-700", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                  ].map((card, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${card.color.replace("text-", "border-").replace("700", "200").replace("50", "100").replace("bg-", "border-")} bg-white shadow-sm`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={card.icon} />
                        </svg>
                      </div>
                      <div className="text-2xl font-extrabold text-slate-800">{card.value}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</div>
                    </div>
                  ))}
                </div>

                {/* Student Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">รายชื่อนักเรียน · ห้อง {homeroomClass.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">เกรดเฉลี่ยสะสม (GPA) เฉพาะวิชาหลัก</p>
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs">
                          <th className="px-5 py-3 text-center font-semibold w-10">#</th>
                          <th className="px-5 py-3 font-semibold w-28">รหัส</th>
                          <th className="px-5 py-3 font-semibold">ชื่อ-สกุล</th>
                          <th className="px-5 py-3 text-center font-semibold w-24">จำนวนวิชา</th>
                          <th className="px-5 py-3 text-center font-semibold w-24">GPA</th>
                          <th className="px-5 py-3 text-center font-semibold w-28">ระดับ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {homeroomStudents.length === 0 ? (
                          <tr><td colSpan={6} className="py-12 text-center text-slate-400">ยังไม่มีนักเรียนในห้องนี้</td></tr>
                        ) : (
                          homeroomStudents.map((s, idx) => {
                            const gpa = calculateGPAForStudent(s.student_id);
                            const gpaNum = parseFloat(gpa);
                            const subjectCount = grades.filter(g => g.student_id === s.student_id).length;
                            let gpaColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
                            let statusLabel = "ดีเยี่ยม";
                            if (gpaNum < 1.0) { gpaColor = "bg-rose-100 text-rose-700 border-rose-200"; statusLabel = "ต้องปรับปรุง"; }
                            else if (gpaNum < 2.0) { gpaColor = "bg-orange-100 text-orange-700 border-orange-200"; statusLabel = "พอใช้"; }
                            else if (gpaNum < 3.0) { gpaColor = "bg-amber-100 text-amber-700 border-amber-200"; statusLabel = "ดี"; }
                            return (
                              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                                <td className="px-5 py-4 font-bold text-indigo-600 text-xs">{s.student_id}</td>
                                <td className="px-5 py-4 font-medium text-slate-800">{s.name}</td>
                                <td className="px-5 py-4 text-center text-slate-500 text-sm">{subjectCount}</td>
                                <td className="px-5 py-4 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-xl border font-extrabold text-base ${gpaColor}`}>{gpa}</span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${gpaColor}`}>{statusLabel}</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {homeroomStudents.map((s, idx) => {
                      const gpa = calculateGPAForStudent(s.student_id);
                      const gpaNum = parseFloat(gpa);
                      const subjectCount = grades.filter(g => g.student_id === s.student_id).length;
                      let gpaColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
                      let statusLabel = "ดีเยี่ยม";
                      if (gpaNum < 1.0) { gpaColor = "bg-rose-100 text-rose-700 border-rose-200"; statusLabel = "ต้องปรับปรุง"; }
                      else if (gpaNum < 2.0) { gpaColor = "bg-orange-100 text-orange-700 border-orange-200"; statusLabel = "พอใช้"; }
                      else if (gpaNum < 3.0) { gpaColor = "bg-amber-100 text-amber-700 border-amber-200"; statusLabel = "ดี"; }
                      return (
                        <div key={s.id} className="p-4 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{s.name}</div>
                            <div className="text-xs text-indigo-600 font-bold mt-0.5">{s.student_id} · {subjectCount} วิชา</div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`px-3 py-1 rounded-xl border font-extrabold text-lg ${gpaColor}`}>{gpa}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gpaColor}`}>{statusLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== TAB 4: SCHEDULE ==================== */}
        {activeTab === "schedule" && (
          <div className="space-y-5">
            {schedulePeriods.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">ยังไม่มีตารางสอน</h3>
                <p className="text-sm text-slate-400">แอดมินยังไม่ได้กำหนดคาบเรียนในเทอมนี้</p>
              </div>
            ) : (
              <>
                {/* Export button */}
                {myScheduleEntries.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleExportTeacherSchedule}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      พิมพ์ตารางสอน
                    </button>
                  </div>
                )}
                {/* Quick view: my schedule as cards per day */}
                {myScheduleEntries.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-400">
                    <p className="font-semibold">ยังไม่มีตารางสอนสำหรับคุณในเทอมนี้</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ACTIVE_DAYS.map(day => {
                      const dayEntries = myScheduleEntries.filter(e => Number(e.day_of_week) === day.value);
                      if (dayEntries.length === 0) return null;
                      return (
                        <div key={day.value} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className={`px-4 py-3 flex items-center gap-2 border-b ${DAY_COLORS[day.value]}`}>
                            <span className="font-extrabold text-sm">วัน{day.label}</span>
                            <span className="ml-auto text-xs font-semibold opacity-70">{dayEntries.length} คาบ</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {dayEntries
                              .sort((a, b) => Number(a.period_no) - Number(b.period_no))
                              .map(e => {
                                const period = schedulePeriods.find(p => p.id === e.period_id);
                                return (
                                  <div key={e.id} className="p-4 flex items-start gap-3">
                                    <div className="shrink-0 text-center w-10">
                                      <div className="text-xs font-extrabold text-slate-700">คาบ {e.period_no}</div>
                                      <div className="text-[10px] text-slate-400">{e.start_time}</div>
                                      <div className="text-[10px] text-slate-400">{e.end_time}</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-slate-800 text-sm truncate">{e.subject_name}</div>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                                          ห้อง {e.classroom_name}
                                        </span>
                                        {period?.label && (
                                          <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-100">
                                            {period.label}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Full schedule grid */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm">ตารางเรียนทั้งหมด (ทุกวิชา ทุกห้อง)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                          <th className="px-3 py-3 text-left font-semibold sticky left-0 bg-slate-50 z-10 min-w-[80px]">คาบ</th>
                          {ACTIVE_DAYS.map(d => (
                            <th key={d.value} className="px-3 py-3 text-center font-semibold min-w-[100px]">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${DAY_COLORS[d.value]}`}>{d.label}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schedulePeriods.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-3 py-2.5 sticky left-0 bg-white font-semibold text-slate-700 whitespace-nowrap z-10">
                              <div>คาบ {p.period_no}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{p.start_time}–{p.end_time}</div>
                              {p.label && <div className="text-[10px] text-amber-600 font-medium">{p.label}</div>}
                            </td>
                            {p.is_break ? (
                              <td colSpan={ACTIVE_DAYS.length} className="px-2 py-2 align-middle text-center bg-slate-100 border border-slate-200 rounded-md">
                                <div className="font-bold text-slate-400 tracking-widest">{p.label || "พักเบรก"}</div>
                              </td>
                            ) : (
                              ACTIVE_DAYS.map(d => {
                                const entries = myScheduleEntries.filter(e => Number(e.day_of_week) === d.value && e.period_id === p.id);
                                return (
                                  <td key={d.value} className="px-2 py-2 text-center align-top">
                                    {entries.length === 0 ? (
                                      <span className="text-slate-200">–</span>
                                    ) : (
                                      <div className="space-y-1">
                                        {entries.map(e => (
                                          <div key={e.id} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-2 py-1.5 text-[11px] font-semibold">
                                            <div className="truncate">{e.subject_name}</div>
                                            <div className="text-indigo-400 font-normal text-[10px]">{e.classroom_name}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                );
                              })
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
