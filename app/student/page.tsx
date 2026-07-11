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
  type EvaluationTopic,
  type EvaluationSummaryRow,
  ALL_DAYS,
} from "./components/types";
import { isEvaluationTermOpen } from "../lib/evaluation";
import LoadingScreen from "./components/LoadingScreen";
import Header from "./components/Header";
import TabNav from "./components/TabNav";
import OverviewTab from "./components/tabs/OverviewTab";
import GradesTab from "./components/tabs/GradesTab";
import YearlyAverageTab from "./components/tabs/YearlyAverageTab";
import ScheduleTab from "./components/tabs/ScheduleTab";
import EvaluationTab from "./components/tabs/EvaluationTab";

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
  const [evalTopics, setEvalTopics] = useState<EvaluationTopic[]>([]);
  const [evalSummary, setEvalSummary] = useState<EvaluationSummaryRow[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const router = useRouter();
  const { user, loading, logout, token, update } = useAuth();

  useEffect(() => { setIsClient(true); }, []);

  // จัดการผลลัพธ์จากการเชื่อมต่อบัญชี
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("linked");
    const linkError = params.get("linkError");

    if (linked) {
      window.history.replaceState({}, "", "/student");
      update().then(() => {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ!",
          text: `เชื่อมต่ออีเมลสำเร็จ: ${linked}`,
          timer: 1500
        }).then(() => {
          window.location.reload();
        });
      });
    } else if (linkError) {
      window.history.replaceState({}, "", "/student");
      Swal.fire("ข้อผิดพลาด", linkError, "error");
    }
  }, [update]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "student" || !user.student_id) { router.push("/login"); return; }
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

    fetch("/api/evaluations/topics", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setEvalTopics)
      .catch(console.error);

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

  useEffect(() => {
    if (!token || !activeSettingId) return;
    const setting = settingsList.find(s => s.id === activeSettingId);
    if (!isEvaluationTermOpen(setting?.term)) {
      setEvalSummary([]);
      return;
    }
    setEvalLoading(true);
    fetch(`/api/evaluations/summary?settingId=${activeSettingId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setEvalSummary)
      .catch(console.error)
      .finally(() => setEvalLoading(false));
  }, [token, activeSettingId, settingsList]);

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
    router.push("/login");
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

  const handleConnectGoogle = async () => {
    if (user?.email) {
      const result = await Swal.fire({
        title: "การเชื่อมต่อบัญชีโซเชียล",
        text: `คุณเชื่อมต่อบัญชีด้วยอีเมล ${user.email} อยู่ในขณะนี้`,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "ยกเลิกการเชื่อมต่อ",
        cancelButtonText: "ปิด",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280"
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "กำลังดำเนินการ...",
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        try {
          const res = await fetch("/api/auth/unlink-account", { method: "POST" });
          if (res.ok) {
            await update();
            Swal.fire({
              icon: "success",
              title: "สำเร็จ",
              text: "ยกเลิกการเชื่อมต่อบัญชีโซเชียลเรียบร้อยแล้ว",
              timer: 1500
            }).then(() => {
              window.location.reload();
            });
          } else {
            throw new Error("ไม่สามารถยกเลิกการเชื่อมต่อได้");
          }
        } catch (err: any) {
          Swal.fire("ข้อผิดพลาด", err.message || "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ", "error");
        }
      }
    } else {
      Swal.fire({
        title: "เชื่อมต่อบัญชีโซเชียล",
        text: "เลือกบริการที่คุณต้องการใช้เชื่อมต่อกับบัญชีของคุณ",
        icon: "question",
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "ยกเลิก",
        cancelButtonColor: "#6b7280",
        html: `
          <div class="flex flex-col gap-3 mt-4 text-foreground text-left">
            <button id="link-google-btn" class="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-border hover:border-indigo-500 hover:bg-indigo-50/5 dark:hover:bg-indigo-500/10 transition-all font-semibold cursor-pointer group">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span class="text-sm dark:text-white">เชื่อมต่อกับ Google</span>
              </div>
              <svg class="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button id="link-line-btn" class="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-border hover:border-emerald-500 hover:bg-emerald-50/5 dark:hover:bg-emerald-500/10 transition-all font-semibold cursor-pointer group">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="#06C755">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                <span class="text-sm dark:text-white">เชื่อมต่อกับ LINE</span>
              </div>
              <svg class="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button id="link-facebook-btn" class="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-border hover:border-blue-600 hover:bg-blue-50/5 dark:hover:bg-blue-600/10 transition-all font-semibold cursor-pointer group">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span class="text-sm dark:text-white">เชื่อมต่อกับ Facebook</span>
              </div>
              <svg class="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        `,
        didOpen: () => {
          const googleBtn = document.getElementById("link-google-btn");
          const lineBtn = document.getElementById("link-line-btn");
          const facebookBtn = document.getElementById("link-facebook-btn");

          if (googleBtn) {
            googleBtn.addEventListener("click", () => {
              Swal.close();
              window.location.href = "/api/link-google/start";
            });
          }
          if (lineBtn) {
            lineBtn.addEventListener("click", () => {
              Swal.close();
              window.location.href = "/api/link-line/start";
            });
          }
          if (facebookBtn) {
            facebookBtn.addEventListener("click", () => {
              Swal.close();
              window.location.href = "/api/link-facebook/start";
            });
          }
        }
      });
    }
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

  const calculateCombinedYearGPA = () => {
    if (!activeSetting) return null;
    const yearSettings = settingsList.filter(s => s.academic_year === activeSetting.academic_year);
    if (yearSettings.length < 2) return null;

    const bySubject = new Map<string, { name: string; total: number; max: number; credits: number }>();
    const termsWithGrades = new Set<string>();

    yearSettings.forEach(setting => {
      const termKey = `${setting.term}/${setting.academic_year}`;
      studentGrades.forEach(g => {
        if (g.term !== termKey) return;
        const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === setting.id);
        if (!subject || subject.subject_type === "activity") return;
        termsWithGrades.add(termKey);
        const mMax = Number(subject.midterm_max_score) || Number(setting.midterm_max_score) || 50;
        const fMax = Number(subject.final_max_score) || Number(setting.final_max_score) || 50;
        const credits = Number(subject.credit_hours) || 1;
        const key = subject.name.trim().toLowerCase();
        const entry = bySubject.get(key) || { name: subject.name.trim(), total: 0, max: 0, credits };
        entry.total += (g.midterm_score ?? 0) + (g.final_score ?? 0);
        entry.max += mMax + fMax;
        entry.credits = credits;
        bySubject.set(key, entry);
      });
    });

    if (termsWithGrades.size < yearSettings.length) return null;

    let totalPoints = 0, totalCredits = 0, totalScore = 0, totalMax = 0;
    const subjects: { name: string; totalScore: number; totalMax: number; percent: number; credits: number; point: number }[] = [];
    bySubject.forEach(e => {
      totalScore += e.total; totalMax += e.max;
      const pct = e.max > 0 ? (e.total / e.max) * 100 : 0;
      let point = 0;
      if (pct >= 80) point = 4;
      else if (pct >= 75) point = 3.5;
      else if (pct >= 70) point = 3;
      else if (pct >= 65) point = 2.5;
      else if (pct >= 60) point = 2;
      else if (pct >= 55) point = 1.5;
      else if (pct >= 50) point = 1;
      totalPoints += point * e.credits;
      totalCredits += e.credits;
      subjects.push({ name: e.name, totalScore: e.total, totalMax: e.max, percent: pct, credits: e.credits, point });
    });

    if (totalCredits === 0) return null;
    subjects.sort((a, b) => a.name.localeCompare(b.name, "th"));
    return {
      value: (totalPoints / totalCredits).toFixed(2),
      credits: totalCredits,
      percentage: totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0,
      academicYear: activeSetting.academic_year,
      termCount: yearSettings.length,
      subjects,
    };
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
  const combinedGpaData = calculateCombinedYearGPA();
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

        {activeTab === "yearly-average" && (
          <YearlyAverageTab combinedGpaData={combinedGpaData} />
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

        {activeTab === "evaluation" && (
          <EvaluationTab
            activeTermStr={activeTermStr}
            settingsList={settingsList}
            activeSettingId={activeSettingId}
            onChangeSetting={handleChangeSetting}
            evalTopics={evalTopics}
            evalSummary={evalSummary}
            evalLoading={evalLoading}
          />
        )}
      </main>
      {user && <ChatWidget userId={user.id} userRole="student" />}
    </div>
  );
}
