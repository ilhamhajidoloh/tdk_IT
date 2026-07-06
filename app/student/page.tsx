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
  type Tab,
  type CombinedActivityResult,
  ALL_DAYS,
} from "./components/types";
import LoadingScreen from "./components/LoadingScreen";
import Header from "./components/Header";
import TabNav from "./components/TabNav";
import OverviewTab from "./components/tabs/OverviewTab";
import GradesTab from "./components/tabs/GradesTab";
import ScheduleTab from "./components/tabs/ScheduleTab";

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
  const { user, loading, logout, token, update } = useAuth();

  useEffect(() => { setIsClient(true); }, []);

  // จัดการผลลัพธ์จากการเชื่อมต่อบัญชี Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("linked");
    const linkError = params.get("linkError");

    if (linked) {
      window.history.replaceState({}, "", "/student");
      update().then(() => {
        Swal.fire("สำเร็จ!", `เชื่อมต่ออีเมล Google สำเร็จ: ${linked}`, "success");
      });
    } else if (linkError) {
      window.history.replaceState({}, "", "/student");
      Swal.fire("ข้อผิดพลาด", linkError, "error");
    }
  }, [update]);

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

  const handleChangeSetting = (s: any) => {
    setActiveSettingId(s.id);
    setMidtermMax(s.midterm_max_score ?? 50);
    setFinalMax(s.final_max_score ?? 50);
    setScheduleDaysConfig(Array.isArray(s.schedule_days) ? s.schedule_days : [1, 2, 3, 4, 5]);
  };

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

  const scoredActivitySubjects = subjectsList.filter(s =>
    s.subject_type === "activity" &&
    s.setting_id === activeSettingId &&
    (Number(s.midterm_max_score) + Number(s.final_max_score)) > 0
  );
  const useCombinedActivity = scoredActivitySubjects.length >= 2;

  const getCombinedActivityResult = (): CombinedActivityResult | null => {
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
        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
        : "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
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

  const gpaColor = gpaNum >= 3.5 ? "text-emerald-600 dark:text-emerald-400" : gpaNum >= 2.5 ? "text-blue-600 dark:text-blue-400" : gpaNum >= 1.5 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const gpaRingColor = gpaNum >= 3.5 ? "border-emerald-400 dark:border-emerald-500/60" : gpaNum >= 2.5 ? "border-blue-400 dark:border-blue-500/60" : gpaNum >= 1.5 ? "border-amber-400 dark:border-amber-500/60" : "border-rose-400 dark:border-rose-500/60";

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
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 grid-backdrop opacity-50 -z-10" />

      <Header
        studentName={currentStudent.name}
        studentCode={currentStudent.student_id}
        classroomName={classroom?.name || ""}
        userEmail={user?.email}
        onConnectGoogle={handleConnectGoogle}
        onChangePassword={handleChangePassword}
        onLogout={handleLogout}
      />

      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} gradesCount={filteredGrades.length} />

      {/* ── MAIN ── */}
      <main className="flex-1 max-w-screen-lg mx-auto w-full px-4 sm:px-6 py-8">
        {activeTab === "overview" && (
          <OverviewTab
            studentName={currentStudent.name}
            studentCode={currentStudent.student_id}
            classroomName={classroom?.name || ""}
            settingsList={settingsList}
            activeSettingId={activeSettingId}
            onChangeSetting={handleChangeSetting}
            gpaValue={gpaData.value}
            gpaCredits={gpaData.credits}
            gpaColor={gpaColor}
            gpaRingColor={gpaRingColor}
            filteredGrades={filteredGrades}
            subjectsList={subjectsList}
            midtermMax={midtermMax}
            finalMax={finalMax}
            myScheduleToday={myScheduleToday}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "grades" && (
          <GradesTab
            activeTermStr={activeTermStr}
            settingsList={settingsList}
            activeSettingId={activeSettingId}
            onChangeSetting={handleChangeSetting}
            filteredGrades={filteredGrades}
            gpaValue={gpaData.value}
            gpaCredits={gpaData.credits}
            gpaNum={gpaNum}
            gpaColor={gpaColor}
            useCombinedActivity={useCombinedActivity}
            getCombinedActivityResult={getCombinedActivityResult}
            scoredActivitySubjects={scoredActivitySubjects}
            subjectsList={subjectsList}
            midtermMax={midtermMax}
            finalMax={finalMax}
          />
        )}

        {activeTab === "schedule" && (
          <ScheduleTab
            schedulePeriods={schedulePeriods}
            scheduleEntries={scheduleEntries}
            classroomId={currentStudent.classroom_id}
            activeDays={ACTIVE_DAYS}
            onExport={handleExportStudentSchedule}
          />
        )}
      </main>
      {user && <ChatWidget userId={user.id} userRole="student" />}
    </div>
  );
}
