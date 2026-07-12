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
  type EvaluationTopic,
  type EvaluationRecord,
  type AttendanceStatus,
  type AttendanceSummaryRow,
  ALL_DAYS,
} from "./components/types";
import { isEvaluationTermOpen } from "../lib/evaluation";
import LoadingScreen from "./components/LoadingScreen";
import SkeletonTeacherPortal from "./components/SkeletonTeacherPortal";
import Header from "./components/Header";
import TabNav from "./components/TabNav";
import EnterGradesTab from "./components/tabs/EnterGradesTab";
import StatusTab from "./components/tabs/StatusTab";
import HomeroomTab from "./components/tabs/HomeroomTab";
import YearlyAverageTab from "./components/tabs/YearlyAverageTab";
import ScheduleTab from "./components/tabs/ScheduleTab";
import EvaluateTab from "./components/tabs/EvaluateTab";
import EvaluateStudentModal from "./components/modals/EvaluateStudentModal";
import AttendanceTab from "./components/tabs/AttendanceTab";
import DashboardTab from "./components/tabs/DashboardTab";
import CorrespondenceTab from "../components/CorrespondenceTab";

export default function TeacherPortal() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [students, setStudents] = useState<DBStudent[]>([]);
  const [grades, setGrades] = useState<DBGrade[]>([]);
  const [classrooms, setClassrooms] = useState<DBClassroom[]>([]);
  const [subjectsList, setSubjectsList] = useState<DBSubject[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
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
  const [combinedAvailable, setCombinedAvailable] = useState(false);
  const [otherTermSettings, setOtherTermSettings] = useState<{ id: number; term: string; academic_year: string }[]>([]);
  const [rankingTermSettingId, setRankingTermSettingId] = useState<number | null>(null);
  const [rankingsCombinedData, setRankingsCombinedData] = useState<typeof rankingsData>([]);
  const [rankingsCombinedLoaded, setRankingsCombinedLoaded] = useState(false);

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

  // Evaluations State (คุณลักษณะอันพึงประสงค์ / อ่าน คิดวิเคราะห์ เขียน)
  const [evalTopics, setEvalTopics] = useState<EvaluationTopic[]>([]);
  const [evalSubjectId, setEvalSubjectId] = useState("");
  const [evalClassroomId, setEvalClassroomId] = useState("");
  const [evalRecords, setEvalRecords] = useState<EvaluationRecord[]>([]);
  const [evalRecordsLoading, setEvalRecordsLoading] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalModalStudent, setEvalModalStudent] = useState<DBStudent | null>(null);
  const [evalRatings, setEvalRatings] = useState<Record<string, number>>({});
  const [evalSaving, setEvalSaving] = useState(false);

  // Attendance State (เช็คชื่อการมาเรียนของแต่ละวิชา)
  const [attendanceSubjectId, setAttendanceSubjectId] = useState("");
  const [attendanceClassroomId, setAttendanceClassroomId] = useState("");
  const [attendanceView, setAttendanceView] = useState<"record" | "summary">("record");
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendanceStatusMap, setAttendanceStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryRow[]>([]);
  const [attendanceSummaryLoading, setAttendanceSummaryLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // จัดการผลลัพธ์จากการเชื่อมต่อบัญชี
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("linked");
    const linkError = params.get("linkError");

    if (linked) {
      window.history.replaceState({}, "", "/teacher");
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
      router.push("/login");
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

    fetch("/api/evaluations/topics", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setEvalTopics)
      .catch(console.error);

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
    setRankingTermSettingId(null);
  }, [token, activeSettingId]);

  useEffect(() => {
    if (!token || !activeSettingId) return;
    const sid = rankingTermSettingId || activeSettingId;
    setRankingsLoaded(false);
    fetch(`/api/grades/rankings?settingId=${sid}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) { setRankingsData(data); setRankingsLoaded(true); } })
      .catch(console.error);
  }, [token, activeSettingId, rankingTermSettingId]);

  useEffect(() => {
    if (!token || !activeSettingId || !combinedAvailable) {
      setRankingsCombinedData([]);
      setRankingsCombinedLoaded(false);
      return;
    }
    setRankingsCombinedLoaded(false);
    fetch(`/api/grades/rankings?settingId=${activeSettingId}&mode=combined`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) { setRankingsCombinedData(data); setRankingsCombinedLoaded(true); } })
      .catch(console.error);
  }, [token, activeSettingId, combinedAvailable]);

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

  const handleConnectGoogle = async () => {
    if (teacherUser?.email) {
      const result = await Swal.fire({
        title: "การเชื่อมต่อบัญชีโซเชียล",
        text: `คุณเชื่อมต่อบัญชีด้วยอีเมล ${teacherUser.email} อยู่ในขณะนี้`,
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
        title: "เชื่อมต่อบัญชีโซเชิก",
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

  const loadEvalRecords = async (subjectId: string, authToken: string) => {
    setEvalRecordsLoading(true);
    try {
      const res = await fetch(`/api/evaluations?subjectId=${subjectId}`, { headers: { Authorization: `Bearer ${authToken}` } });
      setEvalRecords(res.ok ? await res.json() : []);
    } finally {
      setEvalRecordsLoading(false);
    }
  };

  const handleSelectEvalSubject = (subjectId: string) => {
    setEvalSubjectId(subjectId);
    setEvalClassroomId("");
    setEvalRecords([]);
    if (token) loadEvalRecords(subjectId, token);
  };

  const handleOpenEvalModal = (student: DBStudent) => {
    const prefilled: Record<string, number> = {};
    evalRecords
      .filter(r => r.student_id === student.student_id)
      .forEach(r => { prefilled[`${r.category}:${r.topic_key}`] = r.rating; });
    setEvalRatings(prefilled);
    setEvalModalStudent(student);
    setEvalModalOpen(true);
  };

  const handleSetEvalRating = (key: string, value: number) => {
    setEvalRatings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveEvalStudent = async () => {
    if (!evalModalStudent || !evalSubjectId || !token) return;
    const records = Object.entries(evalRatings).map(([key, rating]) => {
      const [category, topicKey] = key.split(/:(.+)/) as ["character" | "rwt", string];
      return { category, topicKey, rating };
    });
    if (records.length === 0) {
      Swal.fire({ icon: "warning", title: "กรุณาเลือกผลการประเมินอย่างน้อย 1 หัวข้อ", confirmButtonColor: "#4f46e5" });
      return;
    }
    setEvalSaving(true);
    try {
      const res = await fetch("/api/evaluations/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentId: evalModalStudent.student_id,
          subjectId: evalSubjectId,
          term: enterTerm,
          records,
        }),
      });
      if (!res.ok) {
        Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
        return;
      }
      await loadEvalRecords(evalSubjectId, token);
      setEvalModalOpen(false);
      Swal.fire({ title: "บันทึกสำเร็จ!", icon: "success", timer: 1200, showConfirmButton: false });
    } finally {
      setEvalSaving(false);
    }
  };

  const handleCancelEvaluation = async (student: DBStudent) => {
    if (!evalSubjectId || !token) return;

    const result = await Swal.fire({
      title: "ยืนยันการยกเลิก?",
      text: `คุณต้องการยกเลิกการประเมินคุณลักษณะของ ${student.name} ในวิชานี้ประจำภาคเรียนนี้ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ยกเลิกการประเมิน",
      cancelButtonText: "ปิด",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(
          `/api/evaluations?studentId=${student.student_id}&subjectId=${evalSubjectId}&term=${encodeURIComponent(enterTerm)}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          Swal.fire("ข้อผิดพลาด", "ไม่สามารถยกเลิกการประเมินได้", "error");
          return;
        }
        await loadEvalRecords(evalSubjectId, token);
        Swal.fire({ title: "ยกเลิกการประเมินสำเร็จ!", icon: "success", timer: 1200, showConfirmButton: false });
      } catch (err) {
        console.error(err);
        Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการยกเลิกการประเมิน", "error");
      }
    }
  };

  const loadAttendanceRecords = async (subjectId: string, date: string, authToken: string) => {
    setAttendanceLoading(true);
    try {
      const res = await fetch(`/api/attendance?subjectId=${subjectId}&date=${date}`, { headers: { Authorization: `Bearer ${authToken}` } });
      const rows = res.ok ? await res.json() : [];
      const map: Record<string, AttendanceStatus> = {};
      for (const r of rows) map[r.student_id] = r.status;
      setAttendanceStatusMap(map);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadAttendanceSummary = async (subjectId: string, term: string, classroomId: string, authToken: string) => {
    setAttendanceSummaryLoading(true);
    try {
      const res = await fetch(
        `/api/attendance/summary?subjectId=${subjectId}&term=${encodeURIComponent(term)}&classroomId=${classroomId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setAttendanceSummary(res.ok ? await res.json() : []);
    } finally {
      setAttendanceSummaryLoading(false);
    }
  };

  const handleSelectAttendanceSubject = (subjectId: string) => {
    setAttendanceSubjectId(subjectId);
    setAttendanceClassroomId("");
    setAttendanceStatusMap({});
    setAttendanceSummary([]);
  };

  useEffect(() => {
    if (!token || !attendanceSubjectId || !attendanceClassroomId) return;
    if (attendanceView === "record") {
      loadAttendanceRecords(attendanceSubjectId, attendanceDate, token);
    } else {
      loadAttendanceSummary(attendanceSubjectId, enterTerm, attendanceClassroomId, token);
    }
  }, [attendanceSubjectId, attendanceClassroomId, attendanceDate, attendanceView, token, enterTerm]);

  const handleSetAttendanceStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAllAttendance = async () => {
    if (!attendanceSubjectId || !attendanceClassroomId || !token) return;
    const records = attendanceClassroomStudents
      .filter(s => attendanceStatusMap[s.student_id])
      .map(s => ({ studentId: s.student_id, status: attendanceStatusMap[s.student_id] }));
    if (records.length === 0) {
      Swal.fire({ icon: "warning", title: "กรุณาเลือกสถานะอย่างน้อย 1 คน", confirmButtonColor: "#4f46e5" });
      return;
    }
    setAttendanceSaving(true);
    try {
      const res = await fetch("/api/attendance/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subjectId: attendanceSubjectId,
          classroomId: attendanceClassroomId,
          date: attendanceDate,
          term: enterTerm,
          records,
        }),
      });
      if (!res.ok) {
        Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
        return;
      }
      Swal.fire({ title: "บันทึกสำเร็จ!", icon: "success", timer: 1200, showConfirmButton: false });
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleCancelAttendance = async () => {
    if (!attendanceSubjectId || !attendanceClassroomId || !attendanceDate || !token) return;

    const result = await Swal.fire({
      title: "ยืนยันการยกเลิก?",
      text: `คุณต้องการยกเลิกการเช็คชื่อของชั้นเรียนนี้ในวันที่ ${attendanceDate} ใช่หรือไม่? ประวัติการเช็คชื่อทั้งหมดของวันนี้จะถูกลบออก`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ยกเลิกการเช็คชื่อ",
      cancelButtonText: "ปิด",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      setAttendanceSaving(true);
      try {
        const res = await fetch(
          `/api/attendance?subjectId=${attendanceSubjectId}&classroomId=${attendanceClassroomId}&date=${attendanceDate}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          Swal.fire("ข้อผิดพลาด", "ไม่สามารถยกเลิกการเช็คชื่อได้", "error");
          return;
        }
        setAttendanceStatusMap({});
        Swal.fire({ title: "ยกเลิกการเช็คชื่อสำเร็จ!", icon: "success", timer: 1200, showConfirmButton: false });
      } catch (err) {
        console.error(err);
        Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการยกเลิกการเช็คชื่อ", "error");
      } finally {
        setAttendanceSaving(false);
      }
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

  const evalActiveTopics = evalTopics.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const evalClassroomOptions = classrooms.filter(c => mySubjects.find(s => s.id === evalSubjectId)?.classroom_ids?.includes(c.id));
  const evalClassroomStudents = students.filter(s => s.classroom_id === evalClassroomId);
  const isEvalTermActive = isEvaluationTermOpen(enterTerm.split("/")[0]);
  const isEvalActive = isGradingActive && isEvalTermActive;

  const attendanceClassroomOptions = classrooms.filter(c => mySubjects.find(s => s.id === attendanceSubjectId)?.classroom_ids?.includes(c.id));
  const attendanceClassroomStudents = students.filter(s => s.classroom_id === attendanceClassroomId);

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
        isClerical={teacherUser?.is_clerical}
      />

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6 animate-fade-in-up">

        {activeTab === "dashboard" && (
          <DashboardTab
            teacherName={teacherUser?.username || "ครู"}
            homeroomClass={homeroomClass}
            homeroomStudents={homeroomStudents}
            mySubjects={mySubjects}
            students={students}
            classrooms={classrooms}
            grades={grades}
            term={enterTerm}
            isGradingActive={isGradingActive}
            settingsStartDate={settingsStartDate}
            settingsEndDate={settingsEndDate}
            myScheduleEntries={myScheduleEntries}
            setActiveTab={setActiveTab}
            setEnterSubject={setEnterSubject}
            setEnterClassroom={setEnterClassroom}
            setEvaluateSubjectId={setEvalSubjectId}
            setEvaluateClassroomId={setEvalClassroomId}
            setAttendanceSubjectId={setAttendanceSubjectId}
            setAttendanceClassroomId={setAttendanceClassroomId}
          />
        )}

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
            rankingTermSettingId={rankingTermSettingId}
            setRankingTermSettingId={setRankingTermSettingId}
            activeSettingId={activeSettingId}
            rankingsLoaded={rankingsLoaded}
            rankingsData={rankingsData}
          />
        )}

        {activeTab === "yearly-average" && (
          <YearlyAverageTab
            homeroomClass={homeroomClass}
            combinedAvailable={combinedAvailable}
            rankingsCombinedLoaded={rankingsCombinedLoaded}
            rankingsCombinedData={rankingsCombinedData}
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

        {activeTab === "evaluate" && (
          <EvaluateTab
            isEvalActive={isEvalActive}
            isGradingActive={isGradingActive}
            isEvalTermActive={isEvalTermActive}
            settingsStartDate={settingsStartDate}
            settingsEndDate={settingsEndDate}
            mySubjects={mySubjects}
            evalSubjectId={evalSubjectId}
            onSelectSubject={handleSelectEvalSubject}
            evalClassroomId={evalClassroomId}
            setEvalClassroomId={setEvalClassroomId}
            evalClassroomOptions={evalClassroomOptions}
            evalClassroomStudents={evalClassroomStudents}
            evalActiveTopics={evalActiveTopics}
            evalRecords={evalRecords}
            evalRecordsLoading={evalRecordsLoading}
            onOpenStudent={handleOpenEvalModal}
            onCancelEvaluation={handleCancelEvaluation}
          />
        )}

        {activeTab === "attendance" && (
          <AttendanceTab
            mySubjects={mySubjects}
            attendanceSubjectId={attendanceSubjectId}
            onSelectSubject={handleSelectAttendanceSubject}
            attendanceClassroomId={attendanceClassroomId}
            setAttendanceClassroomId={setAttendanceClassroomId}
            attendanceClassroomOptions={attendanceClassroomOptions}
            attendanceClassroomStudents={attendanceClassroomStudents}
            attendanceView={attendanceView}
            setAttendanceView={setAttendanceView}
            attendanceDate={attendanceDate}
            setAttendanceDate={setAttendanceDate}
            attendanceStatusMap={attendanceStatusMap}
            onSetStatus={handleSetAttendanceStatus}
            attendanceLoading={attendanceLoading}
            attendanceSaving={attendanceSaving}
            onSaveAll={handleSaveAllAttendance}
            onCancelAttendance={handleCancelAttendance}
            attendanceSummary={attendanceSummary}
            attendanceSummaryLoading={attendanceSummaryLoading}
          />
        )}

        {activeTab === "books" && <CorrespondenceTab />}

      </main>

      <EvaluateStudentModal
        isOpen={evalModalOpen}
        student={evalModalStudent}
        characterTopics={evalActiveTopics}
        ratings={evalRatings}
        onSetRating={handleSetEvalRating}
        saving={evalSaving}
        onClose={() => setEvalModalOpen(false)}
        onSave={handleSaveEvalStudent}
      />

      {teacherUser && <ChatWidget userId={teacherUser.id} userRole="teacher" />}
    </div>
  );
}
