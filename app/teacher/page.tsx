"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../lib/useAuth";
import ChatWidget from "../components/ChatWidget";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import {
  type DBStudent,
  type DBGrade,
  type DBClassroom,
  type DBSubject,
  type SchedulePeriod,
  type ScheduleEntry,
  type RowScore,
  type Tab,
  ALL_DAYS,
} from "./components/types";
import LoadingScreen from "./components/LoadingScreen";
import SkeletonTeacherPortal from "./components/SkeletonTeacherPortal";
import Header from "./components/Header";
import TabNav from "./components/TabNav";
import EnterGradesTab from "./components/tabs/EnterGradesTab";
import StatusTab from "./components/tabs/StatusTab";
import HomeroomTab from "./components/tabs/HomeroomTab";
import ScheduleTab from "./components/tabs/ScheduleTab";

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

  const { user: teacherUser, loading, logout, token, update } = useAuth();
  const [homeroomClass, setHomeroomClass] = useState<DBClassroom | null>(null);

  const [rankingsData, setRankingsData] = useState<{
    student_id: string; student_name: string; student_number: number | null;
    classroom_id: string; classroom_name: string; total_score: number; max_possible: number;
    percentage: number; gpa: number; subject_count: number;
    school_rank: number; classroom_rank: number; school_total: number; classroom_total: number;
  }[]>([]);
  const [rankingsLoaded, setRankingsLoaded] = useState(false);
  const [rankingMode, setRankingMode] = useState<"single" | "combined">("single");
  const [combinedAvailable, setCombinedAvailable] = useState(false);
  const [otherTermSettings, setOtherTermSettings] = useState<{ id: number; term: string; academic_year: string }[]>([]);
  const [rankingTermSettingId, setRankingTermSettingId] = useState<number | null>(null);

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
      update().then(() => {
        Swal.fire("สำเร็จ!", `เชื่อมต่ออีเมล Google สำเร็จ: ${linked}`, "success");
      });
    } else if (linkError) {
      window.history.replaceState({}, "", "/teacher");
      Swal.fire("ข้อผิดพลาด", linkError, "error");
    }
  }, [update]);

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
    fetch(`/api/grades/rankings/check-combined?settingId=${activeSettingId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setCombinedAvailable(data.combined_available === true);
        if (Array.isArray(data.settings)) setOtherTermSettings(data.settings);
      })
      .catch(console.error);
    setRankingMode("single");
    setRankingTermSettingId(null);
  }, [token, activeSettingId]);

  useEffect(() => {
    if (!token || !activeSettingId) return;
    const sid = rankingMode === "combined" ? activeSettingId : (rankingTermSettingId || activeSettingId);
    const modeParam = rankingMode === "combined" ? "&mode=combined" : "";
    setRankingsLoaded(false);
    fetch(`/api/grades/rankings?settingId=${sid}${modeParam}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) { setRankingsData(data); setRankingsLoaded(true); } })
      .catch(console.error);
  }, [token, activeSettingId, rankingMode, rankingTermSettingId]);

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
  if (!isClient || loading || !teacherUser) return <SkeletonTeacherPortal />;

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

  const mySubjects = (teacherUser?.role === "admin"
    ? subjectsList.filter(s => s.setting_id === activeSettingId)
    : subjectsList.filter(s => s.teacher_id === teacherUser?.id && s.setting_id === activeSettingId)
  ).filter(s => (Number(s.midterm_max_score) || 0) + (Number(s.final_max_score) || 0) > 0);

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
        ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
        : "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30",
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
<link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700;800&family=Sarabun:wght@300;400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{font-family:'Amiri','Cairo','Noto Naskh Arabic','Inter','Sarabun',ui-sans-serif,system-ui,sans-serif;background:#fff;color:#1e293b;padding:20px;}
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
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 grid-backdrop opacity-50 -z-10" />

      <Header
        teacherName={teacherUser?.username || "ครู"}
        homeroomClassName={homeroomClass?.name || null}
        isGradingActive={isGradingActive}
        term={enterTerm}
        userEmail={teacherUser?.email}
        onConnectGoogle={handleConnectGoogle}
        onChangePassword={handleChangePassword}
        onLogout={handleLogout}
      />

      <TabNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        enterBadge={enterSubject && enterClassroom ? `${savedCount}/${currentClassroomStudents.length}` : undefined}
        homeroomBadge={homeroomClass ? homeroomStudents.length : undefined}
      />

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6 animate-fade-in-up">

        {activeTab === "enter" && (
          <EnterGradesTab
            isGradingActive={isGradingActive}
            settingsStartDate={settingsStartDate}
            settingsEndDate={settingsEndDate}
            mySubjects={mySubjects}
            enterSubject={enterSubject}
            setEnterSubject={setEnterSubject}
            enterClassroom={enterClassroom}
            setEnterClassroom={setEnterClassroom}
            enterTerm={enterTerm}
            students={students}
            grades={grades}
            classrooms={classrooms}
            currentSubjectObj={currentSubjectObj}
            currentSubjectType={currentSubjectType}
            currentDisplayMode={currentDisplayMode}
            currentMidtermMax={currentMidtermMax}
            currentFinalMax={currentFinalMax}
            isCombined={isCombined}
            onChangeDisplayMode={handleChangeDisplayMode}
            currentClassroomStudents={currentClassroomStudents}
            savedCount={savedCount}
            onSaveAll={handleSaveAll}
            useCombinedActivity={useCombinedActivity}
            scoredActivitySubjects={scoredActivitySubjects}
            getCombinedActivityResult={getCombinedActivityResult}
            rowScores={rowScores}
            setRowScores={setRowScores}
            handleScoreChange={handleScoreChange}
            onSaveRow={handleSaveRow}
            onDeleteGrade={handleDeleteGrade}
          />
        )}

        {activeTab === "status" && (
          <StatusTab
            mySubjects={mySubjects}
            statusSubject={statusSubject}
            setStatusSubject={setStatusSubject}
            statusClassroom={statusClassroom}
            setStatusClassroom={setStatusClassroom}
            classrooms={classrooms}
            statusStudents={statusStudents}
            statusTerm={statusTerm}
            grades={grades}
          />
        )}

        {activeTab === "homeroom" && (
          <HomeroomTab
            homeroomClass={homeroomClass}
            homeroomStudents={homeroomStudents}
            grades={grades}
            calculateGPAForStudent={calculateGPAForStudent}
            otherTermSettings={otherTermSettings}
            rankingMode={rankingMode}
            setRankingMode={setRankingMode}
            rankingTermSettingId={rankingTermSettingId}
            setRankingTermSettingId={setRankingTermSettingId}
            activeSettingId={activeSettingId}
            combinedAvailable={combinedAvailable}
            rankingsLoaded={rankingsLoaded}
            rankingsData={rankingsData}
          />
        )}

        {activeTab === "schedule" && (
          <ScheduleTab
            schedulePeriods={schedulePeriods}
            myScheduleEntries={myScheduleEntries}
            activeDays={ACTIVE_DAYS}
            onExport={handleExportTeacherSchedule}
          />
        )}

      </main>
      {teacherUser && <ChatWidget userId={teacherUser.id} userRole="teacher" />}
    </div>
  );
}
