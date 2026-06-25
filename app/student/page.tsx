"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../lib/useAuth";
import ChatWidget from "../components/ChatWidget";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

interface DBStudent { id: string; name: string; student_id: string; classroom_id: string; }
interface DBGrade { id: string; student_id: string; subject: string; midterm_score: number | null; final_score: number | null; term: string; }
interface DBClassroom { id: string; name: string; }
interface DBSubject { id: string; name: string; setting_id?: number | null; midterm_max_score?: number | null; final_max_score?: number | null; subject_type?: "main" | "activity"; credit_hours?: number | null; score_display_mode?: "separate" | "combined"; }
interface SchedulePeriod { id: string; setting_id: number | string; period_no: number | string; start_time: string; end_time: string; label?: string | null; is_break?: boolean; }
interface ScheduleEntry {
  id: string; classroom_id: string; classroom_name: string;
  subject_id: string; subject_name: string; teacher_id: string | null; teacher_name: string | null;
  teacher_names?: string[];
  day_of_week: number | string; period_id: string; period_no: number | string; start_time: string; end_time: string; label?: string | null;
}

const ALL_DAYS = [
  { value: 1, label: "จันทร์", color: "bg-yellow-100 text-yellow-800 border-yellow-200", gradient: "from-amber-400 to-yellow-300" },
  { value: 2, label: "อังคาร", color: "bg-pink-100 text-pink-800 border-pink-200", gradient: "from-pink-400 to-rose-300" },
  { value: 3, label: "พุธ", color: "bg-green-100 text-green-800 border-green-200", gradient: "from-emerald-400 to-green-300" },
  { value: 4, label: "พฤหัสบดี", color: "bg-orange-100 text-orange-800 border-orange-200", gradient: "from-orange-400 to-amber-300" },
  { value: 5, label: "ศุกร์", color: "bg-blue-100 text-blue-800 border-blue-200", gradient: "from-blue-400 to-sky-300" },
  { value: 6, label: "เสาร์", color: "bg-purple-100 text-purple-800 border-purple-200", gradient: "from-purple-400 to-violet-300" },
  { value: 0, label: "อาทิตย์", color: "bg-red-100 text-red-800 border-red-200", gradient: "from-red-400 to-rose-300" },
];

type Tab = "overview" | "grades" | "schedule";

const NAV_TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "overview", label: "ข้อมูลของฉัน", icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "grades", label: "ผลการเรียน", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { key: "schedule", label: "ตารางเรียน", icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

function LoadingScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center mesh-gradient gap-4">
      {/* Floating orbs */}
      <div className="fixed top-[-10%] right-[-5%] w-80 h-80 bg-gradient-to-br from-violet-300/20 to-cyan-300/20 rounded-full blur-3xl animate-float-slow" />
      <div className="fixed bottom-[-10%] left-[-5%] w-72 h-72 bg-gradient-to-br from-fuchsia-300/20 to-indigo-300/20 rounded-full blur-3xl animate-float-slow" />

      <div className="relative w-20 h-20">
        {/* Outer animated ring */}
        <div className="absolute -inset-2 rounded-full border-2 border-violet-200/50 animate-[spin_3s_linear_infinite]" />
        {/* Middle ring */}
        <div className="absolute -inset-1 rounded-full border-2 border-indigo-200/30 animate-[spin_5s_linear_infinite_reverse]" />
        {/* Main spinner */}
        <div className="absolute inset-0 rounded-full border-4 border-violet-100/50" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 border-r-fuchsia-500 animate-spin" />
        {/* Center glow */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 animate-glow-pulse" />
      </div>
      <div className="text-center mt-2">
        <p className="text-slate-700 font-bold text-lg">{title}</p>
        {subtitle && <p className="text-slate-400 text-sm mt-1.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function StudentPortal() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<DBStudent | null>(null);
  const [studentGrades, setStudentGrades] = useState<DBGrade[]>([]);
  const [classrooms, setClassrooms] = useState<DBClassroom[]>([]);
  const [subjectsList, setSubjectsList] = useState<DBSubject[]>([]);
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [activeSettingId, setActiveSettingId] = useState<number | null>(null);
  const [scheduleDaysConfig, setScheduleDaysConfig] = useState<number[]>([1, 2, 3, 4, 5]);
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [midtermMax, setMidtermMax] = useState(50);
  const [finalMax, setFinalMax] = useState(50);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const router = useRouter();
  const { user, loading, logout, token } = useAuth();

  useEffect(() => { setIsClient(true); }, []);

  // จัดการผลลัพธ์จากการเชื่อมต่อบัญชี Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("linked");
    const linkError = params.get("linkError");

    if (linked) {
      window.history.replaceState({}, "", "/student");
      Swal.fire("สำเร็จ!", `เชื่อมต่ออีเมล Google สำเร็จ: ${linked}`, "success");
    } else if (linkError) {
      window.history.replaceState({}, "", "/student");
      Swal.fire("ข้อผิดพลาด", linkError, "error");
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "student" || !user.student_id) { router.push("/"); return; }
    if (!token) return;

    fetch("/api/students", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: DBStudent[]) => {
        const student = data.find(s => s.student_id === user.student_id);
        if (student) setCurrentStudent(student);
      });

    fetch(`/api/grades?studentId=${user.student_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStudentGrades);

    fetch("/api/subjects", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setSubjectsList(data); }).catch(console.error);

    fetch("/api/public/classrooms").then(r => r.json()).then(setClassrooms);

    fetch("/api/public/settings?all=true")
      .then(r => r.json())
      .then(list => {
        if (!Array.isArray(list)) return;
        setSettingsList(list);
        const activeOrLatest = list.find((s: any) => s.is_active) || list[0];
        if (activeOrLatest) {
          setActiveSettingId(activeOrLatest.id);
          setMidtermMax(activeOrLatest.midterm_max_score ?? 50);
          setFinalMax(activeOrLatest.final_max_score ?? 50);
          if (Array.isArray(activeOrLatest.schedule_days)) setScheduleDaysConfig(activeOrLatest.schedule_days);
        }
      });
  }, [loading, user, token, router]);

  useEffect(() => {
    if (!token || !activeSettingId) return;
    fetch(`/api/schedule-periods?settingId=${activeSettingId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setSchedulePeriods(data); }).catch(console.error);
    fetch(`/api/schedules?settingId=${activeSettingId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setScheduleEntries(data); }).catch(console.error);
  }, [token, activeSettingId]);

  const ACTIVE_DAYS = ALL_DAYS.filter(d => scheduleDaysConfig.includes(d.value));

  const activeSetting = settingsList.find(s => s.id === activeSettingId);
  const activeTermStr = activeSetting ? `${activeSetting.term}/${activeSetting.academic_year}` : "";
  const filteredGrades = studentGrades.filter(g =>
    g.term === activeTermStr &&
    subjectsList.some(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId)
  );

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
      confirmButtonColor: "#7c3aed",
      inputValidator: (value) => { if (!value || value.length < 6) return "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร!"; }
    });
    if (newPassword) {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) Swal.fire("สำเร็จ!", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "success");
      else { const data = await res.json(); Swal.fire("ข้อผิดพลาด", data.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้", "error"); }
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/link-google/start";
  };

  const calculateGPA = () => {
    let totalPoints = 0, totalCredits = 0;
    filteredGrades.forEach(g => {
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
      totalPoints += point * creditHours; totalCredits += creditHours;
    });
    if (totalCredits === 0) return { value: "0.00", credits: 0 };
    return { value: (totalPoints / totalCredits).toFixed(2), credits: totalCredits };
  };

  const getGradeInfo = (percent: number) => {
    if (percent >= 80) return { letter: "A", point: "4.0", color: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" };
    if (percent >= 75) return { letter: "B+", point: "3.5", color: "bg-green-100 text-green-700 border-green-200", bar: "bg-green-500" };
    if (percent >= 70) return { letter: "B", point: "3.0", color: "bg-teal-100 text-teal-700 border-teal-200", bar: "bg-teal-500" };
    if (percent >= 65) return { letter: "C+", point: "2.5", color: "bg-sky-100 text-sky-700 border-sky-200", bar: "bg-sky-500" };
    if (percent >= 60) return { letter: "C", point: "2.0", color: "bg-blue-100 text-blue-700 border-blue-200", bar: "bg-blue-500" };
    if (percent >= 55) return { letter: "D+", point: "1.5", color: "bg-yellow-100 text-yellow-700 border-yellow-200", bar: "bg-yellow-500" };
    if (percent >= 50) return { letter: "D", point: "1.0", color: "bg-orange-100 text-orange-700 border-orange-200", bar: "bg-orange-500" };
    return { letter: "F", point: "0.0", color: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-500" };
  };

  const scoredActivitySubjects = subjectsList.filter(s =>
    s.subject_type === "activity" &&
    s.setting_id === activeSettingId &&
    (Number(s.midterm_max_score) + Number(s.final_max_score)) > 0
  );
  const useCombinedActivity = scoredActivitySubjects.length >= 2;

  const getCombinedActivityResult = () => {
    if (!useCombinedActivity) return null;
    let totalScore = 0;
    let totalMax = 0;
    scoredActivitySubjects.forEach(sub => {
      const mMax = Number(sub.midterm_max_score) || 0;
      const fMax = Number(sub.final_max_score) || 0;
      totalMax += mMax + fMax;
      const g = filteredGrades.find(gr =>
        gr.subject.trim().toLowerCase() === sub.name.trim().toLowerCase()
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
      bar: percent >= 50 ? "bg-emerald-500" : "bg-rose-500",
    };
  };

  if (isLoggingOut) return <LoadingScreen title="กำลังออกจากระบบ..." subtitle="ขอบคุณที่ใช้งานระบบ" />;
  if (!isClient || loading || !currentStudent) return <LoadingScreen title="กำลังโหลดข้อมูล..." subtitle="โปรดรอสักครู่ ระบบกำลังดึงข้อมูลส่วนตัวของคุณ" />;

  const gpaData = calculateGPA();
  const gpaNum = parseFloat(gpaData.value);
  const classroom = classrooms.find(c => c.id === currentStudent.classroom_id);
  const myScheduleToday = (() => {
    const today = new Date().getDay();
    return scheduleEntries.filter(e => e.classroom_id === currentStudent.classroom_id && Number(e.day_of_week) === today);
  })();

  const gpaColor = gpaNum >= 3.5 ? "text-emerald-600" : gpaNum >= 2.5 ? "text-blue-600" : gpaNum >= 1.5 ? "text-amber-600" : "text-rose-600";
  const gpaRingColor = gpaNum >= 3.5 ? "border-emerald-400" : gpaNum >= 2.5 ? "border-blue-400" : gpaNum >= 1.5 ? "border-amber-400" : "border-rose-400";

  const handleExportStudentSchedule = () => {
    if (!schedulePeriods.length || !currentStudent) return;
    const myEntries = scheduleEntries.filter(e => e.classroom_id === currentStudent.classroom_id);
    if (!myEntries.length) return;
    const studentName = currentStudent.name;
    const classroomName = classroom?.name || "";
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
        const entry = myEntries.find(e => Number(e.day_of_week) === d.value && e.period_id === p.id);
        if (!entry) return `<td style="border:1px solid #f1f5f9;min-width:100px;"></td>`;
        const tDisplay = entry.teacher_name || (entry.teacher_names?.join(", ") || "");
        return `<td style="padding:5px 6px;border:1px solid #ddd6fe;background:#f5f3ff;text-align:center;vertical-align:middle;">
          <div style="font-size:11px;font-weight:700;color:#5b21b6;">${entry.subject_name}</div>
          ${tDisplay ? `<div style="font-size:9px;color:#7c3aed;">อ.${tDisplay}</div>` : ""}
        </td>`;
      }).join("");
      return `<tr>${pCell}${cells}</tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>ตารางเรียน · ${studentName}</title>
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
<h1>ตารางเรียน · ${studentName} · ห้อง ${classroomName}</h1>
<div class="meta">เทอม ${activeTermStr} · ออกรายงาน ณ ${dateStr}</div>
<table style="width:100%;border-collapse:collapse;font-family:inherit;">
  <thead><tr>${periodHeader}${dayHeaders}</tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Modern mesh gradient background */}
      <div className="fixed inset-0 mesh-gradient -z-10" />
      {/* Floating gradient orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-96 h-96 bg-gradient-to-br from-violet-200/20 to-cyan-200/20 rounded-full blur-3xl animate-float-slow -z-10" />
      <div className="fixed bottom-[-15%] left-[-10%] w-80 h-80 bg-gradient-to-br from-fuchsia-200/15 to-indigo-200/15 rounded-full blur-3xl animate-float-slow -z-10" />
      <div className="fixed top-[40%] left-[60%] w-64 h-64 bg-gradient-to-br from-pink-200/10 to-violet-200/10 rounded-full blur-3xl animate-float-slow -z-10" />

      {/* ── HEADER ── */}
      <header className="header-gradient border-b border-white/50 sticky top-0 z-20 shadow-sm">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md shadow-violet-100/50 border border-white/60 ring-2 ring-violet-100/30">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-sm leading-tight truncate">{currentStudent.name}</div>
              <div className="text-xs text-slate-400 font-medium">รหัส {currentStudent.student_id} · ห้อง {classroom?.name || "—"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleConnectGoogle}
              title={user?.email ? `เชื่อมต่ออีเมล: ${user.email}` : "เชื่อมต่ออีเมล Google"}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border backdrop-blur-sm ${user?.email ? "text-emerald-600 border-emerald-200/70 bg-emerald-50/80 shadow-sm shadow-emerald-100/50" : "text-slate-500 border-white/60 bg-white/40 hover:text-violet-600 hover:bg-violet-50/80 hover:border-violet-200/70 hover:shadow-sm"}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleChangePassword}
              title="เปลี่ยนรหัสผ่าน"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-violet-600 hover:bg-violet-50/80 transition-all duration-200 border border-white/60 bg-white/40 backdrop-blur-sm hover:border-violet-200/70 hover:shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50/80 hover:bg-rose-100/90 px-3 py-2 rounded-xl transition-all duration-200 border border-rose-100/70 backdrop-blur-sm hover:shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── TAB NAV ── */}
      <div className="header-gradient border-b border-white/40 sticky top-16 z-10">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-3">
          <div className="p-1.5 bg-slate-100/60 rounded-2xl backdrop-blur-sm inline-flex gap-1">
            {NAV_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-white shadow-md shadow-indigo-100/50 text-violet-700"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
                </svg>
                {tab.label}
                {tab.key === "grades" && filteredGrades.length > 0 && (
                  <span className="ml-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    {filteredGrades.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="flex-1 max-w-screen-lg mx-auto w-full px-4 sm:px-6 py-8">

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in-up">

            {/* Profile Hero Card */}
            <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 rounded-3xl p-7 text-white overflow-hidden shadow-xl shadow-violet-200/40 animate-gradient-shift">
              {/* decorative elements */}
              <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/5" />
              <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full border border-white/10" />
              <div className="absolute bottom-4 right-12 w-16 h-16 rounded-full border border-white/5" />
              {/* dot pattern decoration */}
              <div className="absolute top-4 right-4 dot-pattern w-20 h-20 opacity-20" />

              <div className="relative z-10 flex items-center gap-5">
                {/* Avatar with glow */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-white/20 rounded-2xl blur-sm animate-glow-pulse" />
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border-2 border-white/50 flex items-center justify-center shrink-0 backdrop-blur-sm ring-2 ring-white/20 ring-offset-2 ring-offset-purple-600/0">
                    <span className="text-3xl sm:text-4xl font-extrabold drop-shadow-sm">{currentStudent.name.charAt(0)}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-extrabold leading-tight truncate drop-shadow-sm">{currentStudent.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold border border-white/25 shadow-sm">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                      {currentStudent.student_id}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold border border-white/25 shadow-sm">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      ห้อง {classroom?.name || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Term Selector */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-bold text-slate-700 text-sm">สรุปผลการเรียน</h3>
              <select
                className="input-modern px-4 py-2 text-sm font-semibold text-violet-700 cursor-pointer"
                value={activeSettingId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const s = settingsList.find((x: any) => String(x.id) === val);
                  if (s) {
                    setActiveSettingId(s.id);
                    setMidtermMax(s.midterm_max_score ?? 50);
                    setFinalMax(s.final_max_score ?? 50);
                    setScheduleDaysConfig(Array.isArray(s.schedule_days) ? s.schedule_days : [1, 2, 3, 4, 5]);
                  }
                }}
              >
                {settingsList.map(s => (
                  <option key={s.id} value={s.id}>
                    ปี {s.academic_year} เทอม {s.term}{s.is_active ? " · ปัจจุบัน" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 stagger-children">
              {/* GPA */}
              <div className="col-span-3 sm:col-span-1 card-interactive rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
                <div className={`w-22 h-22 rounded-full border-4 ${gpaRingColor} flex items-center justify-center mb-3 shadow-sm relative`}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-slate-50" />
                  <span className={`relative text-2xl font-extrabold ${gpaColor}`}>{gpaData.value}</span>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">เกรดเฉลี่ย (GPA)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{gpaData.credits} หน่วยกิต</div>
              </div>

              {/* Right stats */}
              <div className="col-span-3 sm:col-span-2 grid grid-cols-2 gap-4">
                <div className="card-interactive rounded-3xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-indigo-500" />
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-2">
                    <svg className="w-4.5 h-4.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div className="text-3xl font-extrabold text-violet-600 mb-1">{filteredGrades.length}</div>
                  <div className="text-xs font-semibold text-slate-500">วิชาที่มีคะแนน</div>
                  <div className="text-[11px] text-slate-400">เทอมนี้</div>
                </div>
                <div className="card-interactive rounded-3xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-rose-500" />
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-2">
                    <svg className="w-4.5 h-4.5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  </div>
                  <div className="text-3xl font-extrabold text-pink-500 mb-1">
                    {filteredGrades.filter(g => {
                      const sub = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                      const mMax = Number(sub?.midterm_max_score) || midtermMax;
                      const fMax = Number(sub?.final_max_score) || finalMax;
                      const total = (g.midterm_score ?? 0) + (g.final_score ?? 0);
                      return mMax + fMax > 0 && (total / (mMax + fMax)) * 100 >= 80;
                    }).length}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">เกรด A</div>
                  <div className="text-[11px] text-slate-400">คะแนน ≥ 80%</div>
                </div>
                <div className="card-interactive rounded-3xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-2">
                    <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600 mb-1">
                    {filteredGrades.filter(g => {
                      const sub = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                      const mMax = Number(sub?.midterm_max_score) || midtermMax;
                      const fMax = Number(sub?.final_max_score) || finalMax;
                      const total = (g.midterm_score ?? 0) + (g.final_score ?? 0);
                      return mMax + fMax > 0 && (total / (mMax + fMax)) * 100 >= 50;
                    }).length}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">ผ่านทั้งหมด</div>
                  <div className="text-[11px] text-slate-400">คะแนน ≥ 50%</div>
                </div>
                <div className="card-interactive rounded-3xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-red-500" />
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-red-100 flex items-center justify-center mb-2">
                    <svg className="w-4.5 h-4.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div className="text-3xl font-extrabold text-rose-500 mb-1">
                    {filteredGrades.filter(g => {
                      const sub = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                      const mMax = Number(sub?.midterm_max_score) || midtermMax;
                      const fMax = Number(sub?.final_max_score) || finalMax;
                      const total = (g.midterm_score ?? 0) + (g.final_score ?? 0);
                      return mMax + fMax > 0 && (total / (mMax + fMax)) * 100 < 50;
                    }).length}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">ต้องปรับปรุง</div>
                  <div className="text-[11px] text-slate-400">คะแนน &lt; 50%</div>
                </div>
              </div>
            </div>

            {/* Today's schedule quick view */}
            {myScheduleToday.length > 0 && (
              <div className="card-modern rounded-3xl overflow-hidden animate-fade-in-up">
                <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse shadow-sm shadow-violet-300" />
                    <span className="font-bold text-slate-800 text-sm">คาบเรียนวันนี้</span>
                  </div>
                  <button onClick={() => setActiveTab("schedule")} className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">ดูทั้งหมด →</button>
                </div>
                <div className="divide-y divide-slate-100/80 stagger-children">
                  {myScheduleToday.sort((a, b) => Number(a.period_no) - Number(b.period_no)).map(e => {
                    const period = schedulePeriods.find(p => p.id === e.period_id);
                    return (
                      <div key={e.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-violet-50/30 transition-colors">
                        <div className="text-center shrink-0 w-10">
                          <div className="text-[11px] font-bold text-slate-600">คาบ {e.period_no}</div>
                          <div className="text-[10px] text-slate-400">{e.start_time}</div>
                        </div>
                        <div className="w-px h-8 bg-gradient-to-b from-violet-200 to-transparent" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-slate-800 truncate">{e.subject_name}</div>
                          {(() => { const t = e.teacher_name || (e.teacher_names?.length ? e.teacher_names.join(", ") : null); return t ? <div className="text-xs text-slate-400">อ.{t}</div> : null; })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Grades Preview */}
            {filteredGrades.length > 0 && (
              <div className="card-modern rounded-3xl overflow-hidden animate-fade-in-up">
                <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">คะแนนล่าสุด</span>
                  <button onClick={() => setActiveTab("grades")} className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">ดูทั้งหมด →</button>
                </div>
                <div className="divide-y divide-slate-100/80 stagger-children">
                  {filteredGrades.slice(0, 4).map(grade => {
                    const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === grade.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                    const mMax = Number(subject?.midterm_max_score) || midtermMax;
                    const fMax = Number(subject?.final_max_score) || finalMax;
                    const totalScore = (grade.midterm_score ?? 0) + (grade.final_score ?? 0);
                    const percent = mMax + fMax > 0 ? (totalScore / (mMax + fMax)) * 100 : 0;
                    const isActivity = subject?.subject_type === "activity";
                    const info = isActivity
                      ? (percent >= 50 ? { letter: "ผ่าน", color: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" } : { letter: "ไม่ผ่าน", color: "bg-rose-100 text-rose-700 border-rose-200", bar: "bg-rose-500" })
                      : getGradeInfo(percent);
                    return (
                      <div key={grade.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-violet-50/30 transition-colors">
                        <span className={`w-10 text-center py-1.5 rounded-xl border text-xs font-extrabold shrink-0 ${info.color}`}>{info.letter}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-slate-800 truncate">{grade.subject}</div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${info.bar}`} style={{ width: `${Math.min(100, percent)}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm text-slate-800">{totalScore}</div>
                          <div className="text-[11px] text-slate-400">/{mMax + fMax}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: GRADES ─── */}
        {activeTab === "grades" && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Term selector */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-bold text-slate-700">ผลการเรียน</h3>
                <p className="text-xs text-slate-400 mt-0.5">เทอม {activeTermStr}</p>
              </div>
              <select
                className="input-modern px-4 py-2 text-sm font-semibold text-violet-700 cursor-pointer"
                value={activeSettingId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const s = settingsList.find((x: any) => String(x.id) === val);
                  if (s) { setActiveSettingId(s.id); setMidtermMax(s.midterm_max_score ?? 50); setFinalMax(s.final_max_score ?? 50); setScheduleDaysConfig(Array.isArray(s.schedule_days) ? s.schedule_days : [1, 2, 3, 4, 5]); }
                }}
              >
                {settingsList.map(s => (
                  <option key={s.id} value={s.id}>ปี {s.academic_year} เทอม {s.term}{s.is_active ? " · ปัจจุบัน" : ""}</option>
                ))}
              </select>
            </div>

            {/* GPA Summary bar */}
            {filteredGrades.length > 0 && (
              <div className="card-modern rounded-3xl px-6 py-5 flex items-center gap-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
                <div className={`text-3xl font-extrabold ${gpaColor}`}>{gpaData.value}</div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-500 mb-1.5">เกรดเฉลี่ยสะสม (GPA) · {gpaData.credits} หน่วยกิต</div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${(gpaNum / 4) * 100}%` }} />
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-400">/ 4.00</div>
              </div>
            )}

            {filteredGrades.length === 0 ? (
              <div className="card-modern rounded-3xl p-14 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-600 mb-1 text-base">ยังไม่มีผลการเรียน</h3>
                <p className="text-sm text-slate-400">กรุณารอคุณครูบันทึกคะแนนในเทอมนี้</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {useCombinedActivity && (() => {
                  const combined = getCombinedActivityResult();
                  if (!combined) return null;
                  return (
                    <div className={`rounded-3xl border-2 p-5 flex items-center gap-4 backdrop-blur-sm ${combined.pass ? "bg-emerald-50/80 border-emerald-200" : "bg-rose-50/80 border-rose-200"}`}>
                      <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${combined.color}`}>
                        <span className="text-base font-extrabold leading-tight">{combined.label}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-sm">ผลกิจกรรมรวม</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          คะแนน {combined.totalScore}/{combined.totalMax} · {Math.round(combined.percent)}%
                        </div>
                        <div className="h-2 rounded-full bg-white mt-2 overflow-hidden border border-slate-200/60 shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-500 ${combined.bar}`} style={{ width: `${Math.min(100, combined.percent)}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          รวมจาก: {scoredActivitySubjects.map(s => s.name).join(", ")}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {filteredGrades.map(grade => {
                  const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === grade.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                  const mMax = Number(subject?.midterm_max_score) || midtermMax;
                  const fMax = Number(subject?.final_max_score) || finalMax;
                  const totalScore = (grade.midterm_score ?? 0) + (grade.final_score ?? 0);
                  const percent = mMax + fMax > 0 ? (totalScore / (mMax + fMax)) * 100 : 0;
                  const isActivity = subject?.subject_type === "activity";
                  const isCombined = isActivity && subject?.score_display_mode === "combined";
                  const combinedActResult = isActivity && useCombinedActivity ? getCombinedActivityResult() : null;
                  const info = isActivity
                    ? (combinedActResult
                        ? { letter: combinedActResult.label, point: combinedActResult.label, color: combinedActResult.color, bar: combinedActResult.bar }
                        : (percent >= 50 ? { letter: "ผ่าน", point: "ผ่าน", color: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" } : { letter: "ไม่ผ่าน", point: "ไม่ผ่าน", color: "bg-rose-100 text-rose-700 border-rose-200", bar: "bg-rose-500" }))
                    : getGradeInfo(percent);

                  return (
                    <div key={grade.id} className="card-modern rounded-3xl overflow-hidden relative">
                      {/* Gradient left accent border */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isActivity ? "bg-gradient-to-b from-amber-400 to-orange-400" : "bg-gradient-to-b from-violet-400 to-fuchsia-400"}`} />
                      <div className="p-5 pl-6 flex items-center gap-4">
                        {/* Grade Badge */}
                        <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${info.color} shadow-sm`}>
                          <span className="text-lg font-extrabold leading-tight">{info.letter}</span>
                          {!isActivity && <span className="text-[10px] font-semibold opacity-70">{info.point}</span>}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="font-bold text-slate-800 text-sm truncate">{grade.subject}</span>
                            {isActivity ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/70">กิจกรรม</span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 border border-violet-200/70">
                                {Number(subject?.credit_hours) || 1} หน่วยกิต
                              </span>
                            )}
                          </div>

                          {/* Score bar */}
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2 shadow-inner">
                            <div className={`h-full rounded-full transition-all duration-500 ${info.bar}`} style={{ width: `${Math.min(100, percent)}%` }} />
                          </div>

                          {/* Score breakdown */}
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                            {isCombined ? (
                              <span>รวม {totalScore}/{mMax + fMax}</span>
                            ) : (
                              <>
                                <span>เก็บ {grade.midterm_score ?? 0}/{mMax}</span>
                                <span className="text-slate-300">·</span>
                                <span>สอบ {grade.final_score ?? 0}/{fMax}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Total score */}
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-extrabold text-slate-800">{totalScore}</div>
                          <div className="text-xs text-slate-400 font-medium">/{mMax + fMax}</div>
                          <div className={`text-[11px] font-bold mt-0.5 ${info.color.split(" ")[1]}`}>{Math.round(percent)}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: SCHEDULE ─── */}
        {activeTab === "schedule" && (
          <div className="space-y-5 animate-fade-in-up">
            {schedulePeriods.length === 0 ? (
              <div className="card-modern rounded-3xl p-14 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-600 mb-1 text-base">ยังไม่มีตารางเรียน</h3>
                <p className="text-sm text-slate-400">แอดมินยังไม่ได้กำหนดตารางเรียนในเทอมนี้</p>
              </div>
            ) : (
              <>
                {/* Export button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleExportStudentSchedule}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    พิมพ์ตารางเรียน
                  </button>
                </div>
                {/* Day-by-day Card View */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 stagger-children">
                  {ACTIVE_DAYS.map(day => {
                    const dayEntries = scheduleEntries.filter(e => e.classroom_id === currentStudent.classroom_id && Number(e.day_of_week) === day.value);
                    if (dayEntries.length === 0) return null;
                    const isToday = new Date().getDay() === day.value;
                    return (
                      <div key={day.value} className={`card-modern rounded-3xl overflow-hidden ${isToday ? "ring-2 ring-violet-300/50 shadow-lg shadow-violet-100/30" : ""}`}>
                        {/* Gradient day header */}
                        <div className={`px-5 py-3.5 flex items-center gap-2 bg-gradient-to-r ${day.gradient} text-white border-b border-white/20`}>
                          <span className="font-extrabold text-sm drop-shadow-sm">วัน{day.label}</span>
                          {isToday && (
                            <span className="ml-1 text-[10px] font-bold bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">วันนี้</span>
                          )}
                          <span className="ml-auto text-xs font-semibold opacity-90">{dayEntries.length} คาบ</span>
                        </div>
                        <div className="divide-y divide-slate-100/80">
                          {dayEntries.sort((a, b) => Number(a.period_no) - Number(b.period_no)).map(e => {
                            const period = schedulePeriods.find(p => p.id === e.period_id);
                            return (
                              <div key={e.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-violet-50/30 transition-colors">
                                <div className="shrink-0 text-center w-10">
                                  <div className="text-xs font-extrabold text-slate-600">คาบ {e.period_no}</div>
                                  <div className="text-[10px] text-slate-400">{e.start_time}</div>
                                </div>
                                <div className="w-px h-8 bg-gradient-to-b from-slate-200 to-transparent" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-slate-800 text-sm truncate">{e.subject_name}</div>
                                  {(() => { const t = e.teacher_name || (e.teacher_names?.length ? e.teacher_names.join(", ") : null); return t ? <div className="text-[11px] text-slate-400 mt-0.5">อ.{t}</div> : null; })()}
                                </div>
                                {period?.label && (
                                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full shrink-0">{period.label}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Full grid table */}
                <div className="card-modern rounded-3xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100/80">
                    <h3 className="font-bold text-slate-800 text-sm">ตารางเรียนแบบตาราง</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-100/80 text-slate-500">
                          <th className="px-3 py-3.5 text-left font-semibold sticky left-0 bg-gradient-to-r from-slate-50 to-slate-100/50 z-10 min-w-[72px]">คาบ</th>
                          {ACTIVE_DAYS.map(d => (
                            <th key={d.value} className="px-2 py-3.5 text-center font-semibold min-w-[90px]">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${d.color}`}>{d.label}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/80">
                        {schedulePeriods.map(p => (
                          <tr key={p.id} className="hover:bg-violet-50/20 transition-colors">
                            <td className="px-3 py-2.5 sticky left-0 bg-white font-semibold text-slate-700 whitespace-nowrap z-10">
                              <div>คาบ {p.period_no}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{p.start_time}–{p.end_time}</div>
                              {p.label && <div className="text-[10px] text-amber-600 font-medium">{p.label}</div>}
                            </td>
                            {p.is_break ? (
                              <td colSpan={ACTIVE_DAYS.length} className="px-2 py-2.5 align-middle text-center bg-slate-50/80 border border-slate-200/50 rounded-md">
                                <div className="font-bold text-slate-400 tracking-widest">{p.label || "พักเบรก"}</div>
                              </td>
                            ) : (
                              ACTIVE_DAYS.map(d => {
                                const entry = scheduleEntries.find(e => e.classroom_id === currentStudent.classroom_id && Number(e.day_of_week) === d.value && e.period_id === p.id);
                                return (
                                  <td key={d.value} className="px-2 py-2 text-center align-top">
                                    {entry ? (
                                      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 text-violet-700 border border-violet-100/80 rounded-xl px-2 py-2 text-[11px] font-semibold shadow-sm">
                                        <div className="truncate">{entry.subject_name}</div>
                                        {(() => { const t = entry.teacher_name || (entry.teacher_names?.length ? entry.teacher_names.join(", ") : null); return t ? <div className="text-violet-400 font-normal text-[10px] truncate">อ.{t}</div> : null; })()}
                                      </div>
                                    ) : (
                                      <span className="text-slate-200">–</span>
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
      {user && <ChatWidget userId={user.id} userRole="student" />}
    </div>
  );
}
