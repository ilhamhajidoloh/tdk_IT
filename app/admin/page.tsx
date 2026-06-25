"use client";

import { useEffect, useState, useRef, type ReactNode, useMemo } from "react";
import { useAuth } from "../lib/useAuth";
import * as XLSX from "xlsx";
import ChatWidget from "../components/ChatWidget";

interface DBUser {
  id: string; firebase_uid: string; username: string;
  role: "admin" | "teacher" | "student";
  student_id?: string; homeroom_classroom_id?: string; subjects?: string[]; email?: string | null;
}
interface DBStudent { id: string; name: string; student_id: string; classroom_id: string; student_number?: number | null; }
interface DBSubject { id: string; name: string; teacher_id?: string; teacher_name?: string; teacher_ids?: string[]; teacher_names?: string[]; classroom_ids?: string[]; classroom_names?: string[]; setting_id?: number | null; midterm_max_score?: number | null; final_max_score?: number | null; subject_type?: "main" | "activity"; credit_hours?: number | null; score_display_mode?: "separate" | "combined"; }
interface SchedulePeriod { id: string; setting_id: number | string; period_no: number | string; start_time: string; end_time: string; label?: string | null; is_break?: boolean; }
interface ScheduleEntry {
  id: string; classroom_id: string; classroom_name: string;
  subject_id: string; subject_name: string;
  teacher_id: string | null; teacher_name: string | null;
  teacher_names?: string[];
  day_of_week: number | string; period_id: string; period_no: number | string; start_time: string; end_time: string; label?: string | null;
}
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { formatThaiDate, formatThaiDateRange } from "../lib/format";

type Tab = "dashboard" | "users" | "classrooms" | "students" | "settings" | "subjects" | "schedule" | "grade-status" | "rankings";

interface RankingRow {
  student_id: string;
  student_name: string;
  student_number: number | null;
  classroom_id: string;
  classroom_name: string;
  total_score: number;
  max_possible: number;
  percentage: number;
  gpa: number;
  subject_count: number;
  school_rank: number;
  classroom_rank: number;
  school_total: number;
  classroom_total: number;
}

interface GradeStatusRow {
  subject_id: string;
  subject_name: string;
  subject_type: string;
  midterm_max_score: number | null;
  final_max_score: number | null;
  credit_hours: number | null;
  teacher_id: string | null;
  teacher_name: string | null;
  classroom_id: string | null;
  classroom_name: string | null;
  total_students: string;
  graded_students: string;
  midterm_entered: string;
  final_entered: string;
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

const TEACHER_PALETTE = [
  { bg: "#dbeafe", text: "#1e3a8a", border: "#93c5fd" },
  { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  { bg: "#fef9c3", text: "#713f12", border: "#fde047" },
  { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  { bg: "#ffedd5", text: "#7c2d12", border: "#fdba74" },
  { bg: "#ccfbf1", text: "#134e4a", border: "#5eead4" },
  { bg: "#fdf4ff", text: "#701a75", border: "#e879f9" },
  { bg: "#f0fdf4", text: "#14532d", border: "#86efac" },
  { bg: "#fff1f2", text: "#881337", border: "#fda4af" },
  { bg: "#fefce8", text: "#854d0e", border: "#fef08a" },
  { bg: "#f0f9ff", text: "#0c4a6e", border: "#7dd3fc" },
];

const NAV_ITEMS: { key: Tab; label: string; sub: string; icon: string }[] = [
  { key: "dashboard", label: "แดชบอร์ด", sub: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" },
  { key: "users", label: "จัดการผู้ใช้งาน", sub: "Users", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { key: "classrooms", label: "จัดการชั้นเรียน", sub: "Classrooms", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16M9 7h1m4 0h1m-6 4h1m4 0h1m-5 9v-4a1 1 0 011-1h1a1 1 0 011 1v4" },
  { key: "students", label: "จัดการนักเรียน", sub: "Students", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
  { key: "subjects", label: "จัดการวิชาเรียน", sub: "Subjects", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { key: "schedule", label: "ตารางเรียน", sub: "Schedule", icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "grade-status", label: "สถานะคะแนน", sub: "Grade Status", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { key: "rankings", label: "อันดับผลการเรียน", sub: "Rankings", icon: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" },
  { key: "settings", label: "ตั้งค่าระบบ", sub: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

const STAT_COLOR_MAP: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-600",
};

function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: string; color: keyof typeof STAT_COLOR_MAP }) {
  return (
    <div className="card-interactive rounded-2xl p-5 group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${STAT_COLOR_MAP[color]} transition-transform group-hover:scale-105`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
      </div>
      <div className="text-2xl font-extrabold text-gray-800 leading-tight">{value}</div>
      <div className="text-sm text-gray-500 font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function SectionHeader({ icon, color, title, subtitle, count, countLabel, children }: {
  icon: string;
  color: keyof typeof STAT_COLOR_MAP;
  title: string;
  subtitle: string;
  count?: number;
  countLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${STAT_COLOR_MAP[color]} shadow-sm`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl font-extrabold text-gray-800">{title}</h2>
            {count !== undefined && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 border border-white/50/50">
                {count}{countLabel ? ` ${countLabel}` : ""}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

function TermSelector({ settingsList, selectedId, onSelect }: {
  settingsList: { id: number; academic_year: string; term: string; is_active?: boolean }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  if (settingsList.length === 0) {
    return (
      <div className="mb-6 px-5 py-4 rounded-2xl border border-dashed border-gray-200 bg-gradient-to-r from-slate-50 to-indigo-50/30 text-sm text-gray-400">
        ยังไม่มีปีการศึกษาในระบบ กรุณาเพิ่มที่แท็บ ตั้งค่าระบบ
      </div>
    );
  }
  return (
    <div className="mb-6 p-3.5 rounded-2xl border border-gray-100/80 bg-gradient-to-r from-slate-50/80 to-indigo-50/30 glass">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">เลือกปีการศึกษา / เทอม</div>
      <div className="flex flex-wrap gap-2">
        {settingsList.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${selectedId === s.id
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-lg shadow-indigo-200/50/50"
              : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm"
              }`}
          >
            ปี {s.academic_year} เทอม {s.term}
            {s.is_active && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${selectedId === s.id ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>Active</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickLinkCard({ label, sub, icon, onClick }: { label: string; sub: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card-interactive flex items-center gap-4 p-4 text-left cursor-pointer group"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 shrink-0 group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-indigo-200/50">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
      </div>
      <div className="min-w-0">
        <div className="font-bold text-gray-800 text-sm">{label}</div>
        <div className="text-xs text-gray-400 truncate">{sub}</div>
      </div>
      <svg className="w-4 h-4 text-gray-300 ml-auto shrink-0 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </button>
  );
}

function LoadingScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center mesh-gradient gap-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-gradient-to-br from-indigo-200/25 to-cyan-200/15 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-gradient-to-br from-violet-200/20 to-pink-200/15 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: "-10s" }} />
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-violet-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-400 border-l-cyan-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
      </div>
      <div className="text-center relative z-10">
        <p className="text-gray-700 font-extrabold text-lg">{title}</p>
        {subtitle && <p className="text-gray-400 text-sm mt-1.5 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; setting_id?: number }[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [selectedSettingId, setSelectedSettingId] = useState<number | null>(null);
  const [students, setStudents] = useState<DBStudent[]>([]);
  const [subjectsList, setSubjectsList] = useState<DBSubject[]>([]);
  const [selectedSubjectSettingId, setSelectedSubjectSettingId] = useState<number | null>(null);
  const [subjectClassrooms, setSubjectClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [userSubTab, setUserSubTab] = useState<"all" | "admin" | "teacher" | "student">("all");
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(5);

  useEffect(() => {
    setUserCurrentPage(1);
  }, [userSubTab]);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const classroomFileInputRef = useRef<HTMLInputElement>(null);
  const autoFixedScheduleEntries = useRef<Set<string>>(new Set());
  const [adminYear, setAdminYear] = useState("2568");
  const [adminTerm, setAdminTerm] = useState("1");
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-10-10");
  const [isGradingActive, setIsGradingActive] = useState(true);
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const router = useRouter();
  const { user: adminUser, loading, logout, token } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);

  // Computed Properties for Schedule
  const activeSettingObj = settingsList.find(s => s.id === selectedSubjectSettingId);
  const activeDaysConfig = Array.isArray(activeSettingObj?.schedule_days) ? activeSettingObj.schedule_days : [1, 2, 3, 4, 5];
  const ACTIVE_DAYS = ALL_DAYS.filter(d => activeDaysConfig.includes(d.value));

  // Form State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [studentId, setStudentId] = useState("");
  const [homeroomClassroomId, setHomeroomClassroomId] = useState("");
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectModalMode, setSubjectModalMode] = useState<"add" | "edit">("add");
  const [editingSubject, setEditingSubject] = useState<DBSubject | null>(null);

  // Subject Form State
  const [subjectName, setSubjectName] = useState("");
  const [subjectTeacherIds, setSubjectTeacherIds] = useState<string[]>([]);
  const [subjectClassroomIds, setSubjectClassroomIds] = useState<string[]>([]);
  const [subjectSettingId, setSubjectSettingId] = useState<number | null>(null);
  const [subjectMidtermMax, setSubjectMidtermMax] = useState<number>(50);
  const [subjectFinalMax, setSubjectFinalMax] = useState<number>(50);
  const [subjectType, setSubjectType] = useState<"main" | "activity">("main");
  const [subjectHasScore, setSubjectHasScore] = useState<boolean>(true);
  const [subjectCreditHours, setSubjectCreditHours] = useState<number>(1);

  // Schedule State
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [scheduleClassroomId, setScheduleClassroomId] = useState("");
  const [exportLanguage, setExportLanguage] = useState<"th" | "ms-rumi" | "ms-jawi">("th");

  // Assign Students State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetClassroom, setTargetClassroom] = useState<{ id: string; name: string } | null>(null);
  const [selectedStudentsForAssign, setSelectedStudentsForAssign] = useState<string[]>([]);
  const [searchAssignStudent, setSearchAssignStudent] = useState("");
  const [studentFilterClassroomId, setStudentFilterClassroomId] = useState<string>("unassigned");
  const filteredStudents = useMemo(() => {
    if (studentFilterClassroomId === "all") return students;
    if (studentFilterClassroomId === "unassigned") return students.filter(s => !s.classroom_id);
    return students.filter(s => s.classroom_id === studentFilterClassroomId);
  }, [students, studentFilterClassroomId]);

  // Rankings State
  const [rankingsData, setRankingsData] = useState<RankingRow[]>([]);
  const [rankingsSettingId, setRankingsSettingId] = useState<number | null>(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankingsClassroomFilter, setRankingsClassroomFilter] = useState<string>("all");

  // Grade Status State
  const [gradeStatusData, setGradeStatusData] = useState<GradeStatusRow[]>([]);
  const [gradeStatusSettingId, setGradeStatusSettingId] = useState<number | null>(null);
  const [gradeStatusSubTab, setGradeStatusSubTab] = useState<"summary" | "detail">("summary");
  const [gradeStatusLoading, setGradeStatusLoading] = useState(false);
  const [selectedGradeStatusSubject, setSelectedGradeStatusSubject] = useState<string>("");
  const [studentDetailModal, setStudentDetailModal] = useState<{
    open: boolean;
    subjectName: string;
    classroomName: string;
    teacherName: string;
    midtermMax: number;
    finalMax: number;
    students: { id: string; student_name: string; student_id: string; student_number: number | null; midterm_score: number | null; final_score: number | null }[];
    loading: boolean;
  }>({ open: false, subjectName: "", classroomName: "", teacherName: "", midtermMax: 50, finalMax: 50, students: [], loading: false });

  // Copy Classrooms State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceSettingId, setCopySourceSettingId] = useState<string | number | null>(null);
  const [copyTargetSettingId, setCopyTargetSettingId] = useState<string | number | null>(null);
  const [sourceClassrooms, setSourceClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [copyClassroomsMap, setCopyClassroomsMap] = useState<Record<string, { selected: boolean; newName: string; moveStudents: boolean }>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  // จัดการผลลัพธ์จากการเชื่อมต่อบัญชี Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("linked");
    const linkError = params.get("linkError");

    if (linked) {
      window.history.replaceState({}, "", "/admin");
      Swal.fire("สำเร็จ!", `เชื่อมต่ออีเมล Google สำเร็จ: ${linked}`, "success");
    } else if (linkError) {
      window.history.replaceState({}, "", "/admin");
      Swal.fire("ข้อผิดพลาด", linkError, "error");
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!adminUser || adminUser.role !== "admin") {
      router.push("/");
      return;
    }
    if (token) loadData(token);
    if (token) loadSettings(token);
  }, [loading, adminUser, token, router]);

  const loadData = (authToken: string) => {
    fetch("/api/users", { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(setUsers);
    fetch("/api/students", { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(setStudents);
    if (selectedSubjectSettingId) {
      loadSubjects(selectedSubjectSettingId, authToken);
    }
  };

  const loadSubjects = async (settingId: number, authToken: string) => {
    const res = await fetch(`/api/subjects?settingId=${settingId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) setSubjectsList(await res.json());
  };

  const loadSubjectClassrooms = async (settingId: number, authToken: string) => {
    const res = await fetch(`/api/classrooms?settingId=${settingId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) setSubjectClassrooms(await res.json());
  };

  const loadSchedulePeriods = async (settingId: number, authToken: string) => {
    const res = await fetch(`/api/schedule-periods?settingId=${settingId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) setSchedulePeriods(await res.json());
  };

  const loadScheduleEntries = async (settingId: number, authToken: string) => {
    const res = await fetch(`/api/schedules?settingId=${settingId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) setScheduleEntries(await res.json());
  };

  const loadRankings = async (settingId: number, authToken: string) => {
    setRankingsLoading(true);
    try {
      const res = await fetch(`/api/grades/rankings?settingId=${settingId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) setRankingsData(await res.json());
    } finally {
      setRankingsLoading(false);
    }
  };

  const handleSelectRankingsSetting = (settingId: number) => {
    setRankingsSettingId(settingId);
    setRankingsClassroomFilter("all");
    if (token) loadRankings(settingId, token);
  };

  const loadGradeStatus = async (settingId: number, authToken: string) => {
    setGradeStatusLoading(true);
    setSelectedGradeStatusSubject("");
    try {
      const res = await fetch(`/api/grades/status?settingId=${settingId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) setGradeStatusData(await res.json());
    } finally {
      setGradeStatusLoading(false);
    }
  };

  const openStudentDetail = async (row: GradeStatusRow) => {
    if (!row.classroom_id || !gradeStatusSettingId || !token) return;
    const setting = settingsList.find((s: any) => s.id === gradeStatusSettingId);
    if (!setting) return;
    const termKey = `${setting.term}/${setting.academic_year}`;
    setStudentDetailModal({
      open: true, subjectName: row.subject_name, classroomName: row.classroom_name || "",
      teacherName: row.teacher_name || "ไม่ระบุ",
      midtermMax: Number(row.midterm_max_score) || 50, finalMax: Number(row.final_max_score) || 50,
      students: [], loading: true,
    });
    const res = await fetch(`/api/grades/status/students?subjectName=${encodeURIComponent(row.subject_name)}&classroomId=${row.classroom_id}&term=${encodeURIComponent(termKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setStudentDetailModal(prev => ({ ...prev, students: data, loading: false }));
    } else {
      setStudentDetailModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSelectGradeStatusSetting = (settingId: number) => {
    setGradeStatusSettingId(settingId);
    if (token) loadGradeStatus(settingId, token);
  };

  const handleSelectSubjectSetting = (settingId: number) => {
    setSelectedSubjectSettingId(settingId);
    if (token) {
      loadSubjects(settingId, token);
      loadSubjectClassrooms(settingId, token);
      loadSchedulePeriods(settingId, token);
      loadScheduleEntries(settingId, token);
    }
  };

  const loadClassrooms = async (settingId: number, authToken: string) => {
    const res = await fetch(`/api/classrooms?settingId=${settingId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) setClassrooms(await res.json());
  };

  const loadSettings = async (authToken: string) => {
    const res = await fetch("/api/settings", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return;
    const list = await res.json();
    setSettingsList(list);

    const activeSetting = list.find((s: any) => s.is_active);
    if (activeSetting) {
      setAdminYear(activeSetting.academic_year ?? "2568");
      setAdminTerm(activeSetting.term ?? "1");
      setStartDate(activeSetting.start_date ?? "");
      setEndDate(activeSetting.end_date ?? "");
      const todayStr = new Date().toISOString().split("T")[0];
      setIsGradingActive(todayStr >= (activeSetting.start_date ?? "") && todayStr <= (activeSetting.end_date ?? ""));
      // โหลด classrooms ของ active setting เป็นค่าเริ่มต้น
      setSelectedSettingId(activeSetting.id);
      loadClassrooms(activeSetting.id, authToken);
      // โหลด subjects ของ active setting เป็นค่าเริ่มต้น
      setSelectedSubjectSettingId(activeSetting.id);
      loadSubjects(activeSetting.id, authToken);
      loadSubjectClassrooms(activeSetting.id, authToken);
      loadSchedulePeriods(activeSetting.id, authToken);
      loadScheduleEntries(activeSetting.id, authToken);
      // โหลด grade status
      setGradeStatusSettingId(activeSetting.id);
      loadGradeStatus(activeSetting.id, authToken);
      // โหลด rankings
      setRankingsSettingId(activeSetting.id);
      loadRankings(activeSetting.id, authToken);
    } else {
      setIsGradingActive(false);
    }
  };

  const handleAddSetting = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มปีการศึกษา/เทอม ใหม่",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ปีการศึกษา <span class="text-red-500">*</span></label>
            <input id="swal-year" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" placeholder="เช่น 2569">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">เทอม <span class="text-red-500">*</span></label>
            <input id="swal-term" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" placeholder="เช่น 1 หรือ 2">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">วันเริ่มต้นภาคเรียน <span class="text-red-500">*</span></label>
            <input id="swal-start-date" type="date" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">วันสิ้นสุดภาคเรียน <span class="text-red-500">*</span></label>
            <input id="swal-end-date" type="date" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">คะแนนเก็บเต็ม <span class="text-red-500">*</span></label>
              <input id="swal-midterm-max" type="number" min="1" value="50" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">คะแนนสอบเต็ม <span class="text-red-500">*</span></label>
              <input id="swal-final-max" type="number" min="1" value="50" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm">
            </div>
          </div>
          <div class="mt-2">
            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">วันที่มีการเรียนการสอน</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="1" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" checked> จันทร์</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="2" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" checked> อังคาร</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="3" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" checked> พุธ</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="4" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" checked> พฤหัสบดี</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="5" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" checked> ศุกร์</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="6" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300"> เสาร์</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="0" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300"> อาทิตย์</label>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-white/50 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const year = (document.getElementById("swal-year") as HTMLInputElement).value;
        const term = (document.getElementById("swal-term") as HTMLInputElement).value;
        const startDate = (document.getElementById("swal-start-date") as HTMLInputElement).value;
        const endDate = (document.getElementById("swal-end-date") as HTMLInputElement).value;
        const midtermMax = (document.getElementById("swal-midterm-max") as HTMLInputElement).value;
        const finalMax = (document.getElementById("swal-final-max") as HTMLInputElement).value;
        const scheduleDays = Array.from(document.querySelectorAll('.swal-day-checkbox:checked')).map(cb => Number((cb as HTMLInputElement).value));

        if (!year || !term || !startDate || !endDate || !midtermMax || !finalMax) {
          Swal.showValidationMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
          return null;
        }

        if (scheduleDays.length === 0) {
          Swal.showValidationMessage("กรุณาเลือกวันที่มีการเรียนการสอนอย่างน้อย 1 วัน");
          return null;
        }

        if (startDate > endDate) {
          Swal.showValidationMessage("วันเริ่มต้นต้องไม่เกินวันสิ้นสุดภาคเรียน");
          return null;
        }

        return { year, term, startDate, endDate, midtermMax, finalMax, scheduleDays };
      }
    });

    if (formValues) {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          academic_year: formValues.year.trim(),
          term: formValues.term.trim(),
          start_date: formValues.startDate,
          end_date: formValues.endDate,
          midterm_max_score: Number(formValues.midtermMax),
          final_max_score: Number(formValues.finalMax),
          schedule_days: formValues.scheduleDays,
        }),
      });

      if (!res.ok) {
        Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
        return;
      }

      if (token) loadSettings(token);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "เพิ่มปีการศึกษาใหม่เรียบร้อยแล้ว",
        confirmButtonColor: "#4f46e5"
      });
    }
  };

  const handleEditSetting = async (setting: any) => {
    const activeDays = Array.isArray(setting.schedule_days) ? setting.schedule_days : [1, 2, 3, 4, 5];
    const isChecked = (day: number) => activeDays.includes(day) ? "checked" : "";

    const { value: formValues } = await Swal.fire({
      title: "แก้ไขปีการศึกษา/เทอม",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ปีการศึกษา <span class="text-red-500">*</span></label>
            <input id="swal-year" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${setting.academic_year}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">เทอม <span class="text-red-500">*</span></label>
            <input id="swal-term" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${setting.term}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">วันเริ่มต้นภาคเรียน <span class="text-red-500">*</span></label>
            <input id="swal-start-date" type="date" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${setting.start_date || ''}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">วันสิ้นสุดภาคเรียน <span class="text-red-500">*</span></label>
            <input id="swal-end-date" type="date" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${setting.end_date || ''}">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">คะแนนเก็บเต็ม <span class="text-red-500">*</span></label>
              <input id="swal-midterm-max" type="number" min="1" value="${setting.midterm_max_score ?? 50}" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">คะแนนสอบเต็ม <span class="text-red-500">*</span></label>
              <input id="swal-final-max" type="number" min="1" value="${setting.final_max_score ?? 50}" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm">
            </div>
          </div>
          <div class="mt-2">
            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">วันที่มีการเรียนการสอน</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="1" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" ${isChecked(1)}> จันทร์</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="2" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" ${isChecked(2)}> อังคาร</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="3" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" ${isChecked(3)}> พุธ</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="4" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" ${isChecked(4)}> พฤหัสบดี</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="5" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" ${isChecked(5)}> ศุกร์</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="6" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" ${isChecked(6)}> เสาร์</label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" value="0" class="swal-day-checkbox w-4 h-4 text-indigo-600 rounded border-gray-300" ${isChecked(0)}> อาทิตย์</label>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-white/50 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const year = (document.getElementById("swal-year") as HTMLInputElement).value;
        const term = (document.getElementById("swal-term") as HTMLInputElement).value;
        const startDate = (document.getElementById("swal-start-date") as HTMLInputElement).value;
        const endDate = (document.getElementById("swal-end-date") as HTMLInputElement).value;
        const midtermMax = (document.getElementById("swal-midterm-max") as HTMLInputElement).value;
        const finalMax = (document.getElementById("swal-final-max") as HTMLInputElement).value;
        const scheduleDays = Array.from(document.querySelectorAll('.swal-day-checkbox:checked')).map(cb => Number((cb as HTMLInputElement).value));

        if (!year || !term || !startDate || !endDate || !midtermMax || !finalMax) {
          Swal.showValidationMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
          return null;
        }

        if (scheduleDays.length === 0) {
          Swal.showValidationMessage("กรุณาเลือกวันที่มีการเรียนการสอนอย่างน้อย 1 วัน");
          return null;
        }

        if (startDate > endDate) {
          Swal.showValidationMessage("วันเริ่มต้นต้องไม่เกินวันสิ้นสุดภาคเรียน");
          return null;
        }

        return { year, term, startDate, endDate, midtermMax, finalMax, scheduleDays };
      }
    });

    if (formValues) {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: setting.id,
          academic_year: formValues.year.trim(),
          term: formValues.term.trim(),
          start_date: formValues.startDate,
          end_date: formValues.endDate,
          midterm_max_score: Number(formValues.midtermMax),
          final_max_score: Number(formValues.finalMax),
          schedule_days: formValues.scheduleDays,
        }),
      });

      if (!res.ok) {
        Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
        return;
      }

      if (token) loadSettings(token);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "แก้ไขปีการศึกษาเรียบร้อยแล้ว",
        confirmButtonColor: "#4f46e5"
      });
    }
  };

  const handleDeleteSetting = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: `ยืนยันการลบ ${name}?`,
      text: "การลบปีการศึกษานี้จะไม่สามารถกู้คืนได้ และไม่สามารถลบปีการศึกษาปัจจุบันที่เปิดใช้งานอยู่ได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      const deleteRes = await fetch(`/api/settings?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!deleteRes.ok) {
        const errorData = await deleteRes.json();
        Swal.fire("ข้อผิดพลาด", errorData.error || "ลบไม่สำเร็จ กรุณาลองใหม่", "error");
        return;
      }

      if (token) loadSettings(token);
      Swal.fire("ลบสำเร็จ", `ลบปีการศึกษา ${name} เรียบร้อยแล้ว`, "success");
    }
  };
  const handleOpenAssignModal = (classroom: { id: string; name: string }) => {
    setTargetClassroom(classroom);
    setSelectedStudentsForAssign([]);
    setSearchAssignStudent("");
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignedStudents = async () => {
    if (!targetClassroom || selectedStudentsForAssign.length === 0) return;
    const res = await fetch(`/api/classrooms/${targetClassroom.id}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ student_ids: selectedStudentsForAssign })
    });
    if (res.ok) {
      Swal.fire("สำเร็จ", "เพิ่มนักเรียนเข้าชั้นเรียนแล้ว", "success");
      if (token) loadData(token);
      setIsAssignModalOpen(false);
    } else {
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถเพิ่มนักเรียนได้", "error");
    }
  };

  const handleRemoveStudentFromClass = async (student: DBStudent) => {
    const res = await Swal.fire({
      title: `นำ ${student.name} ออกจากชั้นเรียน?`,
      text: "นักเรียนคนนี้จะกลายเป็น 'ยังไม่มีห้องเรียน'",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "นำออก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f59e0b"
    });
    if (res.isConfirmed) {
      const updateRes = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_id: student.student_id, name: student.name, classroom_id: null }),
      });
      if (updateRes.ok) {
        Swal.fire("สำเร็จ", "นำนักเรียนออกจากชั้นเรียนเรียบร้อยแล้ว", "success");
        if (token) loadData(token);
      } else {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถนำนักเรียนออกได้", "error");
      }
    }
  };

  const handleOpenCopyModal = () => {
    setCopySourceSettingId(null);
    setCopyTargetSettingId(null);
    setSourceClassrooms([]);
    setCopyClassroomsMap({});
    setIsCopyModalOpen(true);
  };

  useEffect(() => {
    if (isCopyModalOpen && copySourceSettingId) {
      fetch(`/api/classrooms?settingId=${copySourceSettingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setSourceClassrooms(data);
          const initialMap: Record<string, { selected: boolean; newName: string; moveStudents: boolean }> = {};
          data.forEach((c: any) => {
            initialMap[c.id] = { selected: true, newName: c.name, moveStudents: true };
          });
          setCopyClassroomsMap(initialMap);
        })
        .catch(err => console.error("Failed to load source classrooms", err));
    } else {
      setSourceClassrooms([]);
      setCopyClassroomsMap({});
    }
  }, [isCopyModalOpen, copySourceSettingId, token]);

  const handleSaveCopyClassrooms = async () => {
    if (!copyTargetSettingId) {
      Swal.fire("ข้อผิดพลาด", "กรุณาเลือกเทอมปลายทาง", "warning");
      return;
    }
    const payloadClassrooms = sourceClassrooms
      .filter(c => copyClassroomsMap[c.id]?.selected)
      .map(c => ({
        old_classroom_id: c.id,
        new_name: copyClassroomsMap[c.id].newName,
        move_students: copyClassroomsMap[c.id].moveStudents
      }));

    if (payloadClassrooms.length === 0) {
      Swal.fire("ข้อผิดพลาด", "กรุณาเลือกอย่างน้อย 1 ชั้นเรียนที่ต้องการคัดลอก", "warning");
      return;
    }

    const res = await fetch("/api/classrooms/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        target_setting_id: copyTargetSettingId,
        classrooms: payloadClassrooms
      })
    });

    if (res.ok) {
      Swal.fire("สำเร็จ", "คัดลอกชั้นเรียนและย้ายนักเรียนเรียบร้อยแล้ว", "success");
      setIsCopyModalOpen(false);
      if (token) {
        if (copyTargetSettingId === selectedSettingId) {
          loadClassrooms(selectedSettingId, token);
        }
        loadData(token);
      }
    } else {
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถคัดลอกชั้นเรียนได้", "error");
    }
  };



  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/");
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/link-google/start";
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

  const handleDeleteUser = async (id: string) => {
    if (adminUser?.id === id) {
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถลบบัญชีของตัวเองได้", "error");
      return;
    }
    const res = await Swal.fire({
      title: "ยืนยันการลบ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      await fetch(`/api/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (token) loadData(token);
      Swal.fire("ลบสำเร็จ", "", "success");
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (adminUser && selectedUserIds.includes(adminUser.id)) {
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถลบบัญชีของตัวเองผ่านการลบหลายรายการได้ โปรดเอาตัวเลือกบัญชีของคุณออก", "error");
      return;
    }
    const res = await Swal.fire({
      title: `ยืนยันการลบผู้ใช้งาน ${selectedUserIds.length} รายการ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบทั้งหมด",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      Swal.fire({
        title: 'กำลังลบข้อมูล...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      let successCount = 0;
      for (const id of selectedUserIds) {
        const dRes = await fetch(`/api/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (dRes.ok) successCount++;
      }
      if (token) loadData(token);
      setSelectedUserIds([]);
      Swal.fire("ลบสำเร็จ", `ลบข้อมูลผู้ใช้งาน ${successCount} รายการเรียบร้อยแล้ว`, "success");
    }
  };

  // =========================================
  // User Import Handler
  // =========================================
  const handleImportUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
          Swal.fire("ข้อผิดพลาด", "ไม่พบข้อมูลในไฟล์", "error");
          return;
        }

        const normalizedRows = rows.map(row => {
          const newRow: any = {};
          for (const key in row) {
            newRow[key.toLowerCase().trim()] = row[key];
          }
          return newRow;
        });

        const validRows = normalizedRows.filter(row => {
          if (!row.role) return false;
          const roleStr = String(row.role).trim().toLowerCase();
          if (roleStr === 'student' || roleStr === 'teacher') return true;
          return row.username && row.password;
        });
        if (validRows.length === 0) {
          Swal.fire("ข้อผิดพลาด", "รูปแบบข้อมูลไม่ถูกต้อง", "error");
          return;
        }

        Swal.fire({
          title: 'กำลังนำเข้าข้อมูล...',
          html: 'นำเข้า <b>0</b> / ' + validRows.length,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          const body: any = {
            name: row.name ? String(row.name).trim() : undefined,
            username: row.username ? String(row.username).trim() : undefined,
            password: row.password ? String(row.password).trim() : undefined,
            role: String(row.role).trim().toLowerCase(),
          };

          if (body.role === 'admin') {
            failCount++;
            Swal.update({ html: `นำเข้า <b>${i + 1}</b> / ${validRows.length}` });
            continue;
          }

          if (body.role === 'student') {
            body.student_id = row.student_id ? String(row.student_id).trim() : undefined;
          }

          const res = await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }

          Swal.update({
            html: `นำเข้า <b>${i + 1}</b> / ${validRows.length}`
          });
        }

        if (token) loadData(token);

        Swal.fire({
          icon: failCount === 0 ? "success" : "warning",
          title: "นำเข้าเสร็จสิ้น",
          text: `สำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`,
          confirmButtonColor: "#4f46e5"
        });

      } catch (err) {
        console.error(err);
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถอ่านไฟล์ได้", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { name: "สมชาย รักเรียน", username: "", password: "", role: "student", student_id: "" },
      { name: "คุณครู ใจดี", username: "teacher1", password: "password123", role: "teacher", student_id: "" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "users_template.xlsx");
  };

  const handleDownloadClassroomTemplate = () => {
    const data = students.length > 0 ? students.map(s => ({
      student_id: s.student_id,
      name: s.name,
      classroom_name: ""
    })) : [{ student_id: "", name: "", classroom_name: "" }];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Classrooms");
    XLSX.writeFile(wb, "classrooms_template.xlsx");
  };

  const handleImportClassrooms = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSettingId || !token) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (rows.length === 0) {
        Swal.fire("ข้อผิดพลาด", "ไม่พบข้อมูลในไฟล์", "error");
        return;
      }

      const normalizedRows = rows.map(row => {
        const newRow: any = {};
        for (const key in row) {
          newRow[key.toLowerCase().trim()] = row[key];
        }
        return newRow;
      });

      const validRows = normalizedRows.filter(row => row.classroom_name);
      if (validRows.length === 0) {
        Swal.fire("ข้อผิดพลาด", "ไม่พบคอลัมน์ classroom_name หรือข้อมูลว่างทั้งหมด", "error");
        return;
      }

      Swal.fire({
        title: 'กำลังนำเข้าข้อมูล...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch("/api/classrooms/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ setting_id: selectedSettingId, items: validRows }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        await loadClassrooms(selectedSettingId, token);
        if (selectedSettingId === selectedSubjectSettingId) {
          await loadSubjectClassrooms(selectedSettingId, token);
        }
        await loadData(token);
        Swal.fire({
          icon: "success",
          title: "นำเข้าเสร็จสิ้น",
          text: `สร้างห้องเรียนใหม่: ${result.classroomsCreated} ห้อง, จับคู่นักเรียน: ${result.studentsAssigned} คน`,
          confirmButtonColor: "#4f46e5"
        });
      } else {
        Swal.fire("ข้อผิดพลาด", result.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถอ่านไฟล์ได้", "error");
    } finally {
      if (classroomFileInputRef.current) classroomFileInputRef.current.value = "";
    }
  };

  // =========================================
  // Classroom Management Handlers
  // =========================================
  const handleAddClassroom = async () => {
    if (!selectedSettingId || !token) return;

    const { value: name } = await Swal.fire({
      title: "เพิ่มชั้นเรียนใหม่",
      input: "text",
      inputLabel: "ชื่อชั้นเรียน (Classroom Name)",
      inputPlaceholder: "เช่น M.1/3, M.4/2",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      inputValidator: (value) => (!value ? "กรุณากรอกชื่อชั้นเรียน!" : null),
    });

    if (name) {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), setting_id: selectedSettingId }),
      });
      if (res.ok) {
        await loadClassrooms(selectedSettingId, token);
        if (selectedSettingId === selectedSubjectSettingId) {
          await loadSubjectClassrooms(selectedSettingId, token);
        }
        Swal.fire({ icon: "success", title: "สำเร็จ", text: `เพิ่มชั้นเรียน ${name.trim()} เรียบร้อยแล้ว`, confirmButtonColor: "#4f46e5" });
      } else {
        Swal.fire("ข้อผิดพลาด", "เพิ่มไม่สำเร็จ กรุณาลองใหม่", "error");
      }
    }
  };

  const handleEditClassroom = async (classroom: { id: string; name: string }) => {
    if (!selectedSettingId || !token) return;

    const { value: name } = await Swal.fire({
      title: "แก้ไขชื่อชั้นเรียน",
      input: "text",
      inputLabel: "ชื่อชั้นเรียน",
      inputValue: classroom.name,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      inputValidator: (value) => (!value ? "กรุณากรอกชื่อชั้นเรียน!" : null),
    });

    if (name) {
      const res = await fetch(`/api/classrooms/${classroom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        await loadClassrooms(selectedSettingId, token);
        if (selectedSettingId === selectedSubjectSettingId) {
          await loadSubjectClassrooms(selectedSettingId, token);
        }
        Swal.fire({ icon: "success", title: "สำเร็จ", text: "แก้ไขชื่อชั้นเรียนเรียบร้อยแล้ว", confirmButtonColor: "#4f46e5" });
      } else {
        Swal.fire("ข้อผิดพลาด", "แก้ไขไม่สำเร็จ กรุณาลองใหม่", "error");
      }
    }
  };

  const handleDeleteClassroom = async (id: string, name: string) => {
    if (!selectedSettingId || !token) return;

    const res = await Swal.fire({
      title: `ยืนยันการลบชั้นเรียน ${name}?`,
      text: "การลบจะส่งผลต่อนักเรียนที่อยู่ในชั้นเรียนนี้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (res.isConfirmed) {
      await fetch(`/api/classrooms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadClassrooms(selectedSettingId, token);
      if (selectedSettingId === selectedSubjectSettingId) {
        await loadSubjectClassrooms(selectedSettingId, token);
      }
      Swal.fire("ลบสำเร็จ", `ลบชั้นเรียน ${name} เรียบร้อยแล้ว`, "success");
    }
  };

  const handleBulkDeleteClassrooms = async () => {
    if (selectedClassroomIds.length === 0 || !selectedSettingId || !token) return;

    const res = await Swal.fire({
      title: `ยืนยันการลบชั้นเรียน ${selectedClassroomIds.length} รายการ?`,
      text: "การลบจะส่งผลต่อนักเรียนที่อยู่ในชั้นเรียนนี้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบทั้งหมด",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });

    if (res.isConfirmed) {
      Swal.fire({
        title: 'กำลังลบข้อมูล...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      let successCount = 0;
      for (const id of selectedClassroomIds) {
        const dRes = await fetch(`/api/classrooms/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (dRes.ok) successCount++;
      }

      await loadClassrooms(selectedSettingId, token);
      if (selectedSettingId === selectedSubjectSettingId) {
        await loadSubjectClassrooms(selectedSettingId, token);
      }
      setSelectedClassroomIds([]);
      Swal.fire("ลบสำเร็จ", `ลบชั้นเรียน ${successCount} รายการเรียบร้อยแล้ว`, "success");
    }
  };

  // =========================================
  // Student Management Handlers
  // =========================================
  const handleAddStudent = async () => {
    const classroomOptions = `<option value="">-- ไม่มีชั้นเรียน --</option>` + classrooms.map(c =>
      `<option value="${c.id}">${c.name}</option>`
    ).join("");

    const { value: formValues } = await Swal.fire({
      title: "เพิ่มนักเรียนใหม่",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">รหัสนักเรียน (Student ID) <span class="text-red-500">*</span></label>
            <input id="swal-student-id" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" placeholder="เช่น S006">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
            <input id="swal-student-name" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" placeholder="เช่น นายสมศักดิ์ รักดี">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ชั้นเรียน <span class="text-red-500">*</span></label>
            <select id="swal-student-classroom" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-700 shadow-sm">
              ${classroomOptions}
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-white/50 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const studentId = (document.getElementById("swal-student-id") as HTMLInputElement).value;
        const name = (document.getElementById("swal-student-name") as HTMLInputElement).value;
        const classroomId = (document.getElementById("swal-student-classroom") as HTMLSelectElement).value;

        if (!name) {
          Swal.showValidationMessage("กรุณากรอกชื่อ-นามสกุล");
          return null;
        }

        return { studentId, name, classroomId: classroomId || null };
      }
    });

    if (formValues) {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_id: formValues.studentId.trim(), name: formValues.name.trim(), classroom_id: formValues.classroomId }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        Swal.fire("ข้อผิดพลาด", errorData.error || "เพิ่มนักเรียนไม่สำเร็จ", "error");
        return;
      }
      if (token) loadData(token);
      Swal.fire({ icon: "success", title: "สำเร็จ", text: "เพิ่มข้อมูลนักเรียนเรียบร้อยแล้ว", confirmButtonColor: "#4f46e5" });
    }
  };

  const handleUpdateStudentNumber = async (studentId: string, newNumber: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/students`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: studentId, student_number: newNumber }),
      });
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, student_number: newNumber === "" ? null : Number(newNumber) } : s));
      } else {
        const err = await res.json();
        Swal.fire("ข้อผิดพลาด", err.error || "ไม่สามารถอัปเดตเลขที่ได้", "error");
        await loadData(token);
      }
    } catch (e) {
      Swal.fire("ข้อผิดพลาด", "การเชื่อมต่อขัดข้อง", "error");
      await loadData(token);
    }
  };

  const handleEditStudent = async (student: DBStudent) => {
    const classroomOptions = `<option value="" ${!student.classroom_id ? 'selected' : ''}>-- ไม่มีชั้นเรียน --</option>` + classrooms.map(c =>
      `<option value="${c.id}" ${c.id === student.classroom_id ? 'selected' : ''}>${c.name}</option>`
    ).join("");

    const { value: formValues } = await Swal.fire({
      title: "แก้ไขข้อมูลนักเรียน",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">รหัสนักเรียน (Student ID)</label>
            <input id="swal-student-id" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-100 focus:outline-none transition-all text-sm font-semibold text-gray-500 shadow-sm cursor-not-allowed" value="${student.student_id}" disabled>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ชื่อ-นามสกุล</label>
            <input id="swal-student-name" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-100 focus:outline-none transition-all text-sm font-semibold text-gray-500 shadow-sm cursor-not-allowed" value="${student.name}" disabled>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ชั้นเรียน <span class="text-red-500">*</span></label>
            <select id="swal-student-classroom" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-700 shadow-sm">
              ${classroomOptions}
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-white/50 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const studentId = (document.getElementById("swal-student-id") as HTMLInputElement).value;
        const name = (document.getElementById("swal-student-name") as HTMLInputElement).value;
        const classroomId = (document.getElementById("swal-student-classroom") as HTMLSelectElement).value;

        if (!name) {
          Swal.showValidationMessage("กรุณากรอกชื่อ-นามสกุล");
          return null;
        }

        return { studentId, name, classroomId: classroomId || null };
      }
    });

    if (formValues) {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_id: formValues.studentId.trim(), name: formValues.name.trim(), classroom_id: formValues.classroomId }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        Swal.fire("ข้อผิดพลาด", errorData.error || "แก้ไขนักเรียนไม่สำเร็จ", "error");
        return;
      }
      if (token) loadData(token);
      Swal.fire({ icon: "success", title: "สำเร็จ", text: "แก้ไขข้อมูลนักเรียนเรียบร้อยแล้ว", confirmButtonColor: "#4f46e5" });
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: `ยืนยันการลบนักเรียน ${name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      await fetch(`/api/students/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (token) loadData(token);
      Swal.fire("ลบสำเร็จ", `ลบข้อมูลนักเรียน ${name} เรียบร้อยแล้ว`, "success");
    }
  };

  // =========================================
  // Subject Management Handlers
  // =========================================
  const handleAddSubject = () => {
    setSubjectModalMode("add");
    setEditingSubject(null);
    setSubjectName("");
    setSubjectTeacherIds([]);
    setSubjectClassroomIds([]);
    setSubjectSettingId(selectedSubjectSettingId);
    setSubjectMidtermMax(50);
    setSubjectFinalMax(50);
    setSubjectType("main");
    setSubjectHasScore(true);
    setSubjectCreditHours(1);
    setValidationError("");
    setIsSubjectModalOpen(true);
  };

  const handleEditSubject = (subject: DBSubject) => {
    setSubjectModalMode("edit");
    setEditingSubject(subject);
    setSubjectName(subject.name);
    const ids = subject.teacher_ids && subject.teacher_ids.length > 0
      ? subject.teacher_ids
      : subject.teacher_id ? [subject.teacher_id] : [];
    setSubjectTeacherIds(ids);
    setSubjectClassroomIds(subject.classroom_ids || []);
    setSubjectSettingId(subject.setting_id ?? selectedSubjectSettingId);
    setSubjectMidtermMax(subject.midterm_max_score ?? 50);
    setSubjectFinalMax(subject.final_max_score ?? 50);
    setSubjectType(subject.subject_type ?? "main");
    setSubjectHasScore(
      (subject.subject_type ?? "main") !== "activity" ||
      (Number(subject.midterm_max_score) + Number(subject.final_max_score)) > 0
    );
    setSubjectCreditHours(Number(subject.credit_hours) || 1);
    setValidationError("");
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubjectSubmit = async () => {
    if (!subjectName.trim()) {
      setValidationError("กรุณากรอกชื่อวิชาเรียน");
      return;
    }

    const body: Record<string, unknown> = {
      name: subjectName.trim(),
      teacher_ids: subjectTeacherIds,
      classroom_ids: subjectClassroomIds,
      setting_id: subjectSettingId || null,
      midterm_max_score: subjectType === "activity" && !subjectHasScore ? 0 : subjectMidtermMax,
      final_max_score: subjectType === "activity" && !subjectHasScore ? 0 : subjectFinalMax,
      subject_type: subjectType,
      credit_hours: subjectType === "main" ? subjectCreditHours : 1,
    };

    const url = subjectModalMode === "edit" && editingSubject ? `/api/subjects/${editingSubject.id}` : "/api/subjects";
    const method = subjectModalMode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setValidationError(err.error || "บันทึกไม่สำเร็จ กรุณาลองใหม่");
      return;
    }

    setIsSubjectModalOpen(false);
    if (token && selectedSubjectSettingId) loadSubjects(selectedSubjectSettingId, token);
    Swal.fire({
      icon: "success",
      title: subjectModalMode === "add" ? "เพิ่มวิชาสำเร็จ" : "แก้ไขวิชาสำเร็จ",
      text: subjectModalMode === "add" ? "เพิ่มวิชาเรียนในระบบเรียบร้อยแล้ว" : "อัปเดตวิชาเรียนเรียบร้อยแล้ว",
      confirmButtonColor: "#4f46e5"
    });
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: `ยืนยันการลบวิชาเรียน ${name}?`,
      text: "การลบวิชานี้จะไม่ลบผลการเรียนที่มีอยู่แล้ว แต่อาจส่งผลต่อการจัดการในอนาคต",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      await fetch(`/api/subjects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (token && selectedSubjectSettingId) loadSubjects(selectedSubjectSettingId, token);
      Swal.fire("ลบสำเร็จ", `ลบวิชาเรียน ${name} เรียบร้อยแล้ว`, "success");
    }
  };

  const updatePeriodField = (index: number, field: "start_time" | "end_time" | "label" | "is_break", value: string | boolean) => {
    setSchedulePeriods(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleAddPeriod = async () => {
    if (!selectedSubjectSettingId || !token) return;
    const res = await fetch("/api/schedule-periods", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ setting_id: selectedSubjectSettingId, start_time: "08:00", end_time: "08:50" }),
    });
    if (!res.ok) {
      Swal.fire({ icon: "error", title: "เพิ่มคาบเรียนไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
      return;
    }
    const newPeriod = await res.json();
    setSchedulePeriods(prev => [...prev, newPeriod]);
  };

  const handleSavePeriod = async (period: SchedulePeriod) => {
    if (!token) return;
    const res = await fetch(`/api/schedule-periods/${period.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ period_no: Number(period.period_no), start_time: period.start_time, end_time: period.end_time, label: period.label || null, is_break: period.is_break || false }),
    });
    if (!res.ok) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
      return;
    }
    Swal.fire({ icon: "success", title: "บันทึกแล้ว", timer: 1200, showConfirmButton: false });
    if (selectedSubjectSettingId) loadScheduleEntries(selectedSubjectSettingId, token);
  };

  const handleDeletePeriod = async (periodId: string) => {
    const result = await Swal.fire({
      title: "ลบคาบเรียนนี้?",
      text: "ตารางสอนที่ผูกกับคาบนี้จะถูกลบไปด้วย",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (!result.isConfirmed || !token) return;
    const res = await fetch(`/api/schedule-periods/${periodId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
      return;
    }
    setSchedulePeriods(prev => prev.filter(p => p.id !== periodId));
    setScheduleEntries(prev => prev.filter(e => e.period_id !== periodId));
  };

  const handleScheduleCellChange = async (day: number, periodId: string, subjectId: string, existingEntryId?: string) => {
    if (!token || !selectedSubjectSettingId || !scheduleClassroomId) return;

    if (!subjectId) {
      if (existingEntryId) {
        const res = await fetch(`/api/schedules/${existingEntryId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
          return;
        }
        setScheduleEntries(prev => prev.filter(e => e.id !== existingEntryId));
      }
      return;
    }

    const subj = subjectsList.find(s => s.id === subjectId);
    const autoTeacherId = subj?.teacher_ids?.length === 1 ? subj.teacher_ids[0] : null;

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        setting_id: selectedSubjectSettingId,
        classroom_id: scheduleClassroomId,
        subject_id: subjectId,
        day_of_week: day,
        period_id: periodId,
        teacher_id: autoTeacherId,
      }),
    });
    if (!res.ok) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
      return;
    }
    const saved = await res.json();
    const period = schedulePeriods.find(p => p.id === periodId);
    const classroom = subjectClassrooms.find(c => c.id === scheduleClassroomId);
    const autoTeacher = autoTeacherId ? users.find(u => u.id === autoTeacherId) : null;
    const newEntry: ScheduleEntry = {
      id: saved.id,
      classroom_id: scheduleClassroomId,
      classroom_name: classroom?.name || "",
      subject_id: subjectId,
      subject_name: subj?.name || "",
      teacher_id: autoTeacherId,
      teacher_name: autoTeacher?.username || null,
      teacher_names: subj?.teacher_names || (subj?.teacher_name ? [subj.teacher_name] : []),
      day_of_week: day,
      period_id: periodId,
      period_no: period?.period_no ?? 0,
      start_time: period?.start_time || "",
      end_time: period?.end_time || "",
      label: period?.label || null,
    };
    setScheduleEntries(prev => [
      ...prev.filter(e => !(e.classroom_id === scheduleClassroomId && Number(e.day_of_week) === day && e.period_id === periodId)),
      newEntry,
    ]);
  };

  const handleScheduleTeacherChange = async (day: number, periodId: string, subjectId: string, teacherId: string | null, existingEntryId?: string) => {
    if (!token || !selectedSubjectSettingId || !scheduleClassroomId) return;

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        setting_id: selectedSubjectSettingId,
        classroom_id: scheduleClassroomId,
        subject_id: subjectId,
        day_of_week: day,
        period_id: periodId,
        teacher_id: teacherId || null,
      }),
    });
    if (!res.ok) {
      Swal.fire({ icon: "error", title: "บันทึกครูไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
      return;
    }
    const saved = await res.json();
    const overrideTeacher = teacherId ? users.find(u => u.id === teacherId) : null;
    setScheduleEntries(prev => prev.map(e =>
      e.id === (existingEntryId || saved.id)
        ? { ...e, id: saved.id, teacher_id: teacherId, teacher_name: overrideTeacher?.username || null }
        : e
    ));
  };

  const handleExportSchedule = (type: "overview" | "classroom" | "teacher") => {
    if (!selectedSubjectSettingId || schedulePeriods.length === 0) return;
    const setting = settingsList.find((s: any) => s.id === selectedSubjectSettingId);

    const getLocalizedText = (key: string) => {
      const dict: Record<string, { th: string; rumi: string; jawi: string }> = {
        "คาบ": { th: "คาบ", rumi: "Waktu", jawi: "وقتو" },
        "พักเบรก": { th: "พักเบรก", rumi: "Rehat", jawi: "ريحت" },
        "พัก": { th: "พัก", rumi: "Rehat", jawi: "ريحت" },
        "ห้อง": { th: "ห้อง", rumi: "Kelas", jawi: "کلس" },
        "วัน": { th: "วัน", rumi: "Hari ", jawi: "هاري " },
        "อ.": { th: "อ.", rumi: "Cikgu ", jawi: "چيقگو " },
        "สีครูผู้สอน": { th: "สีครูผู้สอน", rumi: "Warna Guru", jawi: "ورنا گورو" },
        "ภาพรวมตารางเรียน": { th: "ภาพรวมตารางเรียน", rumi: "Jadual Keseluruhan", jawi: "جادوال کستلوروهن" },
        "ตารางเรียนรายชั้น": { th: "ตารางเรียนรายชั้น", rumi: "Jadual Kelas", jawi: "جادوال کلس" },
        "ตารางสอนรายครู": { th: "ตารางสอนรายครู", rumi: "Jadual Guru", jawi: "جادوال گورو" },
        "ครู": { th: "ครู", rumi: "Guru", jawi: "گورو" },
        "ออกรายงาน ณ": { th: "ออกรายงาน ณ", rumi: "Laporan pada", jawi: "لاڤورن ڤد" },
        "พิมพ์ / บันทึก PDF": { th: "พิมพ์ / บันทึก PDF", rumi: "Cetak / Simpan PDF", jawi: "چيتق / سيمڤن PDF" },
        "ขนาดตัวอักษร:": { th: "ขนาดตัวอักษร:", rumi: "Saiz Fon:", jawi: "ساءيز فون:" },
        "เทอม": { th: "เทอม", rumi: "Penggal", jawi: "ڤڠگل" }
      };
      if (exportLanguage === "ms-rumi") return dict[key]?.rumi || key;
      if (exportLanguage === "ms-jawi") return dict[key]?.jawi || key;
      return dict[key]?.th || key;
    };

    const getLocalizedDay = (val: number) => {
      const th = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
      const rumi = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
      const jawi = ["أحد", "إثنين", "ثلاثاء", "رابو", "خميس", "جمعة", "سبت"];
      if (exportLanguage === "ms-rumi") return rumi[val];
      if (exportLanguage === "ms-jawi") return jawi[val];
      return th[val];
    };

    const settingTitle = setting ? `${getLocalizedText("เทอม")} ${setting.term}/${setting.academic_year}` : "";

    // Assign colors to each unique effective teacher name
    const colorMap = new Map<string, typeof TEACHER_PALETTE[0]>();
    let ci = 0;
    scheduleEntries.forEach(e => {
      const name = e.teacher_id
        ? (e.teacher_name || null)
        : (e.teacher_names?.length === 1 ? e.teacher_names[0] : null);
      if (name && !colorMap.has(name)) {
        colorMap.set(name, TEACHER_PALETTE[ci++ % TEACHER_PALETTE.length]);
      }
    });

    const cellStyle = (entry: ScheduleEntry | undefined) => {
      if (!entry) return "";
      const name = entry.teacher_id
        ? (entry.teacher_name || null)
        : (entry.teacher_names?.length === 1 ? entry.teacher_names[0] : null);
      const c = name ? colorMap.get(name) : null;
      return c ? `background:${c.bg};border-color:${c.border};` : "background:#f9fafb;border-color:#e5e7eb;";
    };
    const cellTextColor = (entry: ScheduleEntry | undefined) => {
      const name = entry?.teacher_id
        ? (entry.teacher_name || null)
        : (entry?.teacher_names?.length === 1 ? entry.teacher_names[0] : null);
      return (name ? colorMap.get(name)?.text : null) || "#374151";
    };

    const thStyle = "padding:8px 12px;background:#0f172a;color:#f8fafc;font-size:14px;font-weight:700;text-align:center;";
    const periodHeader = `<th style="${thStyle}text-align:left;min-width:80px;">${getLocalizedText("คาบ")}</th>`;
    const dayHeaders = ACTIVE_DAYS.map(d => `<th style="${thStyle}min-width:110px;">${getLocalizedDay(d.value)}</th>`).join("");

    const buildClassroomTable = (cid: string, cname: string) => {
      const rows = schedulePeriods.map(p => {
        const pCell = `<td style="padding:6px 10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:14px;font-weight:700;white-space:nowrap;vertical-align:middle;">
          <div style="color:#374151;">${getLocalizedText("คาบ")} ${p.period_no}</div>
          <div style="font-size:12px;color:#94a3b8;font-weight:400;">${p.start_time}–${p.end_time}</div>
          ${p.label ? `<div style="font-size:12px;color:#d97706;">${p.label}</div>` : ""}
        </td>`;
        if (p.is_break) {
          return `<tr>${pCell}<td colspan="${ACTIVE_DAYS.length}" style="padding:6px;text-align:center;background:#f1f5f9;border:1px solid #e2e8f0;color:#94a3b8;font-size:13px;font-weight:600;">${p.label || getLocalizedText("พักเบรก")}</td></tr>`;
        }
        const cells = ACTIVE_DAYS.map(d => {
          const e = scheduleEntries.find(x => x.classroom_id === cid && Number(x.day_of_week) === d.value && x.period_id === p.id);
          if (!e) return `<td style="border:1px solid #f1f5f9;min-width:110px;"></td>`;
          const tc = cellTextColor(e);
          const tDisplay = e.teacher_name || (e.teacher_names?.join(", ") || "");
          return `<td style="padding:6px 8px;border:1px solid;${cellStyle(e)}text-align:center;vertical-align:middle;">
            <div dir="auto" style="font-size:14px;font-weight:700;color:${tc};">${e.subject_name}</div>
            ${tDisplay ? `<div dir="auto" style="font-size:12px;color:${tc};opacity:0.8;">${getLocalizedText("อ.")}${tDisplay}</div>` : ""}
          </td>`;
        }).join("");
        return `<tr>${pCell}${cells}</tr>`;
      }).join("");
      return `<div style="margin-bottom:24px;break-inside:avoid;">
        <div dir="auto" style="padding:8px 14px;background:#0f172a;color:#f8fafc;font-size:16px;font-weight:800;border-radius:6px 6px 0 0;">${getLocalizedText("ห้อง")} ${cname}</div>
        <table style="width:100%;border-collapse:collapse;font-family:inherit;">
          <thead><tr>${periodHeader}${dayHeaders}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    };

    const legend = colorMap.size > 0 ? `<div style="margin-bottom:16px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">${getLocalizedText("สีครูผู้สอน")}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${Array.from(colorMap.entries()).map(([name, c]) =>
      `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;background:${c.bg};border:1px solid ${c.border};color:${c.text};font-size:13px;font-weight:600;">
          <span style="width:10px;height:10px;border-radius:50%;background:${c.text};flex-shrink:0;"></span>${name}
        </span>`).join("")}
      </div>
    </div>` : "";

    let body = "";
    let docTitle = "";
    // Sort classrooms: alphabetical names first, then numeric names
    const sortedClassrooms = [...subjectClassrooms].sort((a, b) => {
      const aStartsWithLetter = /^[a-zA-Zก-๙]/.test(a.name);
      const bStartsWithLetter = /^[a-zA-Zก-๙]/.test(b.name);
      const aStartsWithDigit = /^[0-9]/.test(a.name);
      const bStartsWithDigit = /^[0-9]/.test(b.name);
      if (aStartsWithLetter && bStartsWithDigit) return -1;
      if (aStartsWithDigit && bStartsWithLetter) return 1;
      return a.name.localeCompare(b.name, 'th');
    });

    if (type === "overview") {
      docTitle = `${getLocalizedText("ภาพรวมตารางเรียน")} · ${settingTitle}`;
      const thBase = "padding:6px 8px;background:#1e293b;color:#f8fafc;font-size:13px;font-weight:700;text-align:center;border:1px solid #334155;";
      const dayTables = ACTIVE_DAYS.map(day => {
        const dayEnts = scheduleEntries.filter(e => Number(e.day_of_week) === day.value);
        if (dayEnts.length === 0) return "";
        const periodCols = schedulePeriods.map(p => {
          if (p.is_break) {
            return `<th style="${thBase}background:#334155;width:80px;font-size:12px;">${p.label || getLocalizedText("พัก")}</th>`;
          }
          return `<th style="${thBase}min-width:100px;">
            ${p.label ? `<div style="font-size:11px;color:#fbbf24;font-weight:700;">${p.label}</div>` : ""}
            <div>${getLocalizedText("คาบ")} ${p.period_no}</div>
            <div style="font-size:11px;opacity:0.65;font-weight:400;">${p.start_time}–${p.end_time}</div>
          </th>`;
        }).join("");
        const classroomRows = sortedClassrooms.map(c => {
          const cells = schedulePeriods.map(p => {
            if (p.is_break) {
              return `<td style="background:#e2e8f0;border:1px solid #cbd5e1;width:80px;text-align:center;font-size:12px;color:#64748b;">${p.label || getLocalizedText("พัก")}</td>`;
            }
            const e = dayEnts.find(x => x.classroom_id === c.id && x.period_id === p.id);
            if (!e) return `<td style="border:1px solid #f1f5f9;min-width:100px;"></td>`;
            const cs = cellStyle(e); const tc = cellTextColor(e);
            const tDisplay = e.teacher_name || (e.teacher_names?.join(", ") || "");
            return `<td style="padding:5px 6px;border:1px solid;${cs}text-align:center;vertical-align:middle;">
              <div dir="auto" style="font-size:14px;font-weight:700;color:${tc};">${e.subject_name}</div>
              ${tDisplay ? `<div dir="auto" style="font-size:12px;color:${tc};opacity:0.75;">${tDisplay}</div>` : ""}
            </td>`;
          }).join("");
          return `<tr>
            <td dir="auto" style="padding:6px 10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;">${c.name}</td>
            ${cells}
          </tr>`;
        }).join("");
        return `<div style="margin-bottom:28px;break-inside:avoid;">
          <div dir="auto" style="padding:8px 14px;background:#0f172a;color:#f8fafc;font-size:16px;font-weight:800;border-radius:6px 6px 0 0;">${getLocalizedText("วัน")}${getLocalizedDay(day.value)}</div>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr>
              <th style="${thBase}text-align:left;min-width:90px;">${getLocalizedText("ห้อง")}</th>
              ${periodCols}
            </tr></thead>
            <tbody>${classroomRows}</tbody>
          </table>
        </div>`;
      }).join("");
      body = legend + dayTables;
    } else if (type === "classroom") {
      docTitle = `${getLocalizedText("ตารางเรียนรายชั้น")} · ${settingTitle}`;
      body = sortedClassrooms.map((c, i) =>
        i > 0 ? `<div style="page-break-before:always;">${buildClassroomTable(c.id, c.name)}</div>` : buildClassroomTable(c.id, c.name)
      ).join("");
    } else {
      docTitle = `${getLocalizedText("ตารางสอนรายครู")} · ${settingTitle}`;
      let first = true;
      body = users.filter((u: DBUser) => u.role === "teacher").map((teacher: DBUser) => {
        const te = scheduleEntries.filter(e =>
          e.teacher_id === teacher.id ||
          (!e.teacher_id && e.teacher_names?.includes(teacher.username))
        );
        if (te.length === 0) return "";
        const rows = schedulePeriods.map(p => {
          const pCell = `<td style="padding:6px 10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:14px;font-weight:700;white-space:nowrap;vertical-align:middle;">
            <div style="color:#374151;">${getLocalizedText("คาบ")} ${p.period_no}</div>
            <div style="font-size:12px;color:#94a3b8;font-weight:400;">${p.start_time}–${p.end_time}</div>
          </td>`;
          if (p.is_break) {
            return `<tr>${pCell}<td colspan="${ACTIVE_DAYS.length}" style="padding:6px;text-align:center;background:#f1f5f9;border:1px solid #e2e8f0;color:#94a3b8;font-size:13px;font-weight:600;">${p.label || getLocalizedText("พักเบรก")}</td></tr>`;
          }
          const cells = ACTIVE_DAYS.map(d => {
            const e = te.find(x => Number(x.day_of_week) === d.value && x.period_id === p.id);
            if (!e) return `<td style="border:1px solid #f1f5f9;min-width:110px;"></td>`;
            return `<td style="padding:6px 8px;border:1px solid #bfdbfe;background:#eff6ff;text-align:center;vertical-align:middle;">
              <div dir="auto" style="font-size:14px;font-weight:700;color:#1e40af;">${e.subject_name}</div>
              <div dir="auto" style="font-size:12px;color:#3b82f6;">${e.classroom_name}</div>
            </td>`;
          }).join("");
          return `<tr>${pCell}${cells}</tr>`;
        }).join("");
        const pb = !first ? "page-break-before:always;" : "";
        first = false;
        return `<div style="margin-bottom:24px;${pb}">
          <div dir="auto" style="padding:8px 14px;background:#0f172a;color:#f8fafc;font-size:16px;font-weight:800;border-radius:6px 6px 0 0;">${getLocalizedText("ครู")} ${teacher.username}</div>
          <table style="width:100%;border-collapse:collapse;font-family:inherit;">
            <thead><tr>${periodHeader}${dayHeaders}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      }).join("");
    }

    const dateStr = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>${docTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Sarabun:wght@300;400;600;700;800&family=Noto+Sans+Arabic:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{font-family:'Inter','Sarabun','Noto Sans Arabic','Noto Naskh Arabic',ui-sans-serif,system-ui,sans-serif;background:#fff;color:#1e293b;padding:20px;font-size:14px;}
  h1{font-size:22px;font-weight:800;margin-bottom:4px;}
  .meta{font-size:14px;color:#64748b;margin-bottom:16px;}
  .print-btn{position:fixed;top:12px;right:12px;padding:8px 18px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:100;}
  .font-controls{position:fixed;top:12px;right:200px;display:flex;align-items:center;gap:8px;background:#fff;padding:6px 14px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.12);border:1px solid #e2e8f0;z-index:100;font-size:13px;font-weight:600;color:#475569;}
  .font-controls label{white-space:nowrap;}
  .font-controls input[type=range]{width:100px;accent-color:#4f46e5;cursor:pointer;}
  .font-controls .font-size-val{min-width:28px;text-align:center;font-weight:700;color:#4f46e5;}
  .font-controls button{padding:4px 10px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:6px;font-size:15px;font-weight:700;cursor:pointer;color:#475569;line-height:1;}
  .font-controls button:hover{background:#eef2ff;border-color:#a5b4fc;color:#4f46e5;}
  @media print{.print-btn,.font-controls{display:none;} @page{margin:1cm;size:A4 landscape;}}
</style>
</head><body>
<div class="font-controls">
  <label>🔤 ${getLocalizedText("ขนาดตัวอักษร:")}</label>
  <button onclick="changeFontSize(-1)">A-</button>
  <input type="range" id="fontSlider" min="60" max="160" value="100" oninput="applyFontSize(this.value)">
  <button onclick="changeFontSize(1)">A+</button>
  <span class="font-size-val" id="fontVal">100%</span>
</div>
<button class="print-btn" onclick="window.print()">🖨️ ${getLocalizedText("พิมพ์ / บันทึก PDF")}</button>
<h1 dir="auto">${docTitle}</h1>
<div class="meta" dir="auto">${getLocalizedText("ออกรายงาน ณ")} ${dateStr}</div>
<div id="schedule-content">
${body}
</div>
<script>
function applyFontSize(val) {
  var content = document.getElementById('schedule-content');
  content.style.transform = 'scale(' + (val / 100) + ')';
  content.style.transformOrigin = 'top left';
  content.style.width = (10000 / val) + '%';
  document.getElementById('fontVal').textContent = val + '%';
  document.getElementById('fontSlider').value = val;
}
function changeFontSize(dir) {
  var slider = document.getElementById('fontSlider');
  var newVal = Math.min(160, Math.max(60, parseInt(slider.value) + dir * 10));
  applyFontSize(newVal);
}
</script>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleExportStudents = () => {
    let body = "";
    let docTitle = "";

    const getLocalizedText = (key: string) => {
      const dict: Record<string, { th: string; rumi: string; jawi: string }> = {
        "รายชื่อนักเรียน": { th: "รายชื่อนักเรียน", rumi: "Senarai Pelajar", jawi: "سنراي ڤلاجر" },
        "ชั้นเรียน": { th: "ชั้นเรียน", rumi: "Kelas", jawi: "کلس" },
        "เลขที่": { th: "เลขที่", rumi: "No.", jawi: "نو." },
        "รหัสนักเรียน": { th: "รหัสนักเรียน", rumi: "ID Pelajar", jawi: "آیدي ڤلاجر" },
        "ชื่อ-สกุล": { th: "ชื่อ-สกุล", rumi: "Nama Lengkap", jawi: "نام لڠکاڤ" },
        "ทั้งหมด": { th: "ทั้งหมด", rumi: "Jumlah", jawi: "جمله" },
        "คน": { th: "คน", rumi: "orang", jawi: "اورڠ" },
        "ยังไม่ระบุชั้นเรียน": { th: "ยังไม่ระบุชั้นเรียน", rumi: "Belum Ditentukan", jawi: "بيلوم ديتنتوکن" },
        "ออกรายงาน ณ": { th: "ออกรายงาน ณ", rumi: "Laporan pada", jawi: "لاڤورن ڤد" },
        "พิมพ์ / บันทึก PDF": { th: "พิมพ์ / บันทึก PDF", rumi: "Cetak / Simpan PDF", jawi: "چيتق / سيمڤن PDF" },
        "ขนาดตัวอักษร:": { th: "ขนาดตัวอักษร:", rumi: "Saiz Fon:", jawi: "ساءيز فون:" }
      };
      if (exportLanguage === "ms-rumi") return dict[key]?.rumi || key;
      if (exportLanguage === "ms-jawi") return dict[key]?.jawi || key;
      return dict[key]?.th || key;
    };

    // Group students by classroom
    const studentsByClassroom = new Map<string, typeof filteredStudents>();
    filteredStudents.forEach(s => {
      const classroomId = s.classroom_id || "unassigned";
      if (!studentsByClassroom.has(classroomId)) {
        studentsByClassroom.set(classroomId, []);
      }
      studentsByClassroom.get(classroomId)!.push(s);
    });

    // Build tables for each classroom
    const sortedClassrooms = Array.from(studentsByClassroom.entries())
      .sort((a, b) => {
        if (a[0] === "unassigned") return 1;
        if (b[0] === "unassigned") return -1;
        const aName = classrooms.find(c => c.id === a[0])?.name || a[0];
        const bName = classrooms.find(c => c.id === b[0])?.name || b[0];
        const aStartsWithLetter = /^[a-zA-Zก-๙]/.test(aName);
        const bStartsWithLetter = /^[a-zA-Zก-๙]/.test(bName);
        const aStartsWithDigit = /^[0-9]/.test(aName);
        const bStartsWithDigit = /^[0-9]/.test(bName);
        if (aStartsWithLetter && bStartsWithDigit) return -1;
        if (aStartsWithDigit && bStartsWithLetter) return 1;
        return aName.localeCompare(bName, 'th');
      });

    const thStyle = "padding:8px 12px;background:#0f172a;color:#f8fafc;font-size:14px;font-weight:700;text-align:center;border:1px solid #334155;";
    const tdStyle = "padding:8px 12px;border:1px solid #e2e8f0;text-align:center;";
    const tdLabelStyle = "padding:8px 12px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc;font-weight:600;";

    body = sortedClassrooms.map((entry, idx) => {
      const [classroomId, students] = entry;
      const classroomName = classroomId === "unassigned" 
        ? `-- ${getLocalizedText("ยังไม่ระบุชั้นเรียน")} --`
        : classrooms.find(c => c.id === classroomId)?.name || classroomId;
      
      const rows = students
        .sort((a, b) => (a.student_number || 0) - (b.student_number || 0))
        .map((s, i) => `
          <tr>
            <td style="${tdStyle}">${(s.student_number || i + 1)}</td>
            <td style="${tdStyle}">${s.student_id}</td>
            <td style="${tdLabelStyle}">${s.name}</td>
          </tr>
        `).join("");

      const pb = idx > 0 ? "page-break-before:always;" : "";
      return `<div style="margin-bottom:24px;break-inside:avoid;${pb}">
        <div dir="auto" style="padding:8px 14px;background:#0f172a;color:#f8fafc;font-size:16px;font-weight:800;border-radius:6px 6px 0 0;">${getLocalizedText("ชั้นเรียน")} ${classroomName}</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="${thStyle}min-width:60px;">${getLocalizedText("เลขที่")}</th>
              <th style="${thStyle}min-width:100px;">${getLocalizedText("รหัสนักเรียน")}</th>
              <th style="${thStyle}">${getLocalizedText("ชื่อ-สกุล")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;text-align:right;font-size:14px;font-weight:600;color:#0f172a;">
          ${getLocalizedText("ทั้งหมด")}: <span style="color:#4f46e5;">${students.length}</span> ${getLocalizedText("คน")}
        </div>
      </div>`;
    }).join("");

    docTitle = `${getLocalizedText("รายชื่อนักเรียน")}`;
    const dateStr = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>${docTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Sarabun:wght@300;400;600;700;800&family=Noto+Sans+Arabic:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{font-family:'Inter','Sarabun','Noto Sans Arabic','Noto Naskh Arabic',ui-sans-serif,system-ui,sans-serif;background:#fff;color:#1e293b;padding:20px;font-size:14px;}
  h1{font-size:22px;font-weight:800;margin-bottom:4px;}
  .meta{font-size:14px;color:#64748b;margin-bottom:16px;}
  .print-btn{position:fixed;top:12px;right:12px;padding:8px 18px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:100;}
  .font-controls{position:fixed;top:12px;right:200px;display:flex;align-items:center;gap:8px;background:#fff;padding:6px 14px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.12);border:1px solid #e2e8f0;z-index:100;font-size:13px;font-weight:600;color:#475569;}
  .font-controls label{white-space:nowrap;}
  .font-controls input[type=range]{width:100px;accent-color:#4f46e5;cursor:pointer;}
  .font-controls .font-size-val{min-width:28px;text-align:center;font-weight:700;color:#4f46e5;}
  .font-controls button{padding:4px 10px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:6px;font-size:15px;font-weight:700;cursor:pointer;color:#475569;line-height:1;}
  .font-controls button:hover{background:#eef2ff;border-color:#a5b4fc;color:#4f46e5;}
  @media print{.print-btn,.font-controls{display:none;} @page{margin:1cm;size:A4 portrait;}}
</style>
</head><body>
<div class="font-controls">
  <label>🔤 ${getLocalizedText("ขนาดตัวอักษร:")}</label>
  <button onclick="changeFontSize(-1)">A-</button>
  <input type="range" id="fontSlider" min="60" max="160" value="100" oninput="applyFontSize(this.value)">
  <button onclick="changeFontSize(1)">A+</button>
  <span class="font-size-val" id="fontVal">100%</span>
</div>
<button class="print-btn" onclick="window.print()">🖨️ ${getLocalizedText("พิมพ์ / บันทึก PDF")}</button>
<h1 dir="auto">${docTitle}</h1>
<div class="meta" dir="auto">${getLocalizedText("ออกรายงาน ณ")} ${dateStr}</div>
<div id="students-content">
${body}
</div>
<script>
function applyFontSize(val) {
  var content = document.getElementById('students-content');
  content.style.transform = 'scale(' + (val / 100) + ')';
  content.style.transformOrigin = 'top left';
  content.style.width = (10000 / val) + '%';
  document.getElementById('fontVal').textContent = val + '%';
  document.getElementById('fontSlider').value = val;
}
function changeFontSize(dir) {
  var slider = document.getElementById('fontSlider');
  var newVal = Math.min(160, Math.max(60, parseInt(slider.value) + dir * 10));
  applyFontSize(newVal);
}
</script>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };
  useEffect(() => {
    if (!token || !selectedSubjectSettingId || scheduleEntries.length === 0 || subjectsList.length === 0) return;
    scheduleEntries.forEach(e => {
      if (e.teacher_id !== null) return;
      if (autoFixedScheduleEntries.current.has(e.id)) return;
      const subj = subjectsList.find(s => s.id === e.subject_id);
      if (!subj?.teacher_ids || subj.teacher_ids.length !== 1) return;
      autoFixedScheduleEntries.current.add(e.id);
      handleScheduleTeacherChange(Number(e.day_of_week), e.period_id, e.subject_id, subj.teacher_ids[0], e.id);
    });
  }, [scheduleEntries, subjectsList, token, selectedSubjectSettingId]);

  const handleEditUser = (user: DBUser) => {
    setModalMode("edit");
    setEditingUser(user);
    setUsername(user.username);
    setPassword("");
    setRole(user.role);
    setStudentId(user.student_id || "");
    setHomeroomClassroomId(user.homeroom_classroom_id || "");
    setEmail(user.email || "");
    setValidationError("");
    setIsUserModalOpen(true);
  };

  const handleAddUser = () => {
    setModalMode("add");
    setEditingUser(null);
    setName("");
    setUsername("");
    setPassword("");
    setRole("student");
    setStudentId("");
    setHomeroomClassroomId("");
    setEmail("");
    setValidationError("");
    setIsUserModalOpen(true);
  };

  const handleSaveUserSubmit = async () => {
    if ((role === "student" || role === "teacher") && modalMode === "add") {
      if (!name.trim() && !username.trim()) { setValidationError("กรุณากรอก ชื่อ-นามสกุล หรือ Username อย่างน้อยหนึ่งอย่าง"); return; }
      if (role === "student" && !studentId.trim() && !name.trim() && !username.trim()) { setValidationError("กรุณากรอกข้อมูล"); return; }
    } else {
      if (!username.trim()) { setValidationError("กรุณากรอกชื่อผู้ใช้ (Username)"); return; }
      if (modalMode === "add" && !password.trim()) { setValidationError("กรุณากรอกรหัสผ่าน (Password)"); return; }
      if (role === "student" && !studentId.trim()) { setValidationError("กรุณากรอกรหัสนักเรียน (Student ID)"); return; }
    }

    const body: Record<string, unknown> = {
      name: name.trim() || undefined,
      username: username.trim() || undefined,
      role,
      email: email.trim() || null,
      ...(password.trim() ? { password: password.trim() } : {}),
      ...(role === "student" ? { student_id: studentId === "none" ? null : (studentId.trim() || undefined) } : {}),
      ...(role === "teacher" ? {
        homeroom_classroom_id: homeroomClassroomId || null,
      } : {}),
    };

    const url = modalMode === "edit" && editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = modalMode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setValidationError(err.error || "บันทึกไม่สำเร็จ กรุณาลองใหม่");
      return;
    }

    setIsUserModalOpen(false);
    if (token) loadData(token);
    Swal.fire({
      icon: "success",
      title: modalMode === "add" ? "เพิ่มผู้ใช้สำเร็จ" : "แก้ไขข้อมูลสำเร็จ",
      text: modalMode === "add" ? "เพิ่มบัญชีผู้ใช้งานในระบบเรียบร้อยแล้ว" : "อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว",
      confirmButtonColor: "#4f46e5"
    });
  };

  const filteredUsers = users.filter(u => {
    if (userSubTab === "all") return true;
    return u.role === userSubTab;
  });

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((userCurrentPage - 1) * usersPerPage, userCurrentPage * usersPerPage);

  if (isLoggingOut) return <LoadingScreen title="กำลังออกจากระบบ..." subtitle="ขอบคุณที่ใช้งานระบบจัดการโรงเรียน" />;
  if (!isClient || loading) return <LoadingScreen title="กำลังโหลดข้อมูล..." subtitle="โปรดรอสักครู่ ระบบกำลังตรวจสอบสิทธิ์การเข้าใช้งาน" />;

  return (
    <div className="min-h-screen mesh-gradient flex flex-col relative">
      {/* Background decorations */}
      <div className="fixed top-[-20%] right-[-15%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/15 to-cyan-200/10 rounded-full blur-3xl animate-float-slow -z-10 pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-15%] w-[500px] h-[500px] bg-gradient-to-br from-violet-200/15 to-pink-200/10 rounded-full blur-3xl animate-float-slow -z-10 pointer-events-none" style={{ animationDelay: "-10s" }} />

      {/* Header */}
      <header className="header-gradient shadow-sm sticky top-0 z-20 border-b border-white/50">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl opacity-15 blur-sm" />
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 bg-white relative border border-white/80">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-800 leading-none gradient-text">ระบบแอดมิน</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">จัดการโครงสร้างระบบและผู้ใช้งาน</p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-gray-700">สวัสดี, {adminUser?.username || "ผู้ดูแลระบบ"}</span>
            <span className="text-xs text-gray-400">{formatThaiDate(new Date().toISOString())}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleConnectGoogle}
              title={adminUser?.email ? `เชื่อมต่ออีเมล: ${adminUser.email}` : "เชื่อมต่ออีเมล Google"}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all shrink-0 border ${adminUser?.email ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-gray-500 border-gray-200 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleChangePassword}
              title="เปลี่ยนรหัสผ่าน"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shrink-0 border border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-all shrink-0 border border-rose-100 hover:border-rose-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="space-y-1.5">
            <div className="glass-strong rounded-2xl p-2 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === item.key
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200/50/50"
                    : "text-gray-600 hover:bg-indigo-50/80"
                    }`}
                >
                  <svg className={`w-5 h-5 shrink-0 ${activeTab === item.key ? "text-white" : "text-indigo-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Active term summary */}
            <div className="hidden md:block mt-3 p-4 rounded-2xl glass-strong">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ปีการศึกษาปัจจุบัน</div>
              <div className="text-sm font-extrabold text-gray-800">ปีการศึกษา {adminYear}</div>
              <div className="text-xs font-semibold mb-3 gradient-text">ภาคเรียนที่ {adminTerm}</div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isGradingActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                {isGradingActive ? "เปิดกรอกคะแนน" : "ปิดกรอกคะแนน"}
              </span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 glass-strong rounded-3xl overflow-hidden min-h-[500px]">
            {activeTab === "dashboard" && (
              <div className="p-8 animate-fade-in-up">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-gray-800">แดชบอร์ดภาพรวม</h2>
                  <p className="text-gray-500 text-sm mt-1">สรุปข้อมูลสำคัญของระบบ ประจำปีการศึกษา {adminYear} ภาคเรียนที่ {adminTerm}</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                  <StatCard
                    label="ผู้ใช้งานทั้งหมด"
                    value={users.length}
                    sub="บัญชีผู้ใช้งานในระบบ"
                    color="indigo"
                    icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                  <StatCard
                    label="นักเรียน"
                    value={users.filter(u => u.role === "student").length}
                    sub={`ทะเบียนนักเรียนทั้งหมด ${students.length} คน`}
                    color="green"
                    icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                  <StatCard
                    label="ครูผู้สอน"
                    value={users.filter(u => u.role === "teacher").length}
                    sub="บัญชีครูผู้สอน"
                    color="blue"
                    icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-3 0h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
                  />
                  <StatCard
                    label="ผู้ดูแลระบบ"
                    value={users.filter(u => u.role === "admin").length}
                    sub="บัญชีแอดมิน"
                    color="red"
                    icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                  <StatCard
                    label="ชั้นเรียน (เทอมนี้)"
                    value={classrooms.length}
                    sub="ห้องเรียนในปีการศึกษาปัจจุบัน"
                    color="purple"
                    icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16M9 7h1m4 0h1m-6 4h1m4 0h1m-5 9v-4a1 1 0 011-1h1a1 1 0 011 1v4"
                  />
                  <StatCard
                    label="วิชาเรียน (เทอมนี้)"
                    value={subjectsList.length}
                    sub="รายวิชาที่เปิดสอน"
                    color="amber"
                    icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                  <StatCard
                    label="คาบเรียนต่อวัน"
                    value={schedulePeriods.length}
                    sub="คาบที่กำหนดไว้ในตารางสอน"
                    color="indigo"
                    icon="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                  <StatCard
                    label="ปีการศึกษาทั้งหมด"
                    value={settingsList.length}
                    sub="จำนวนปีการศึกษา/เทอมในระบบ"
                    color="blue"
                    icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Current Term Status */}
                  <div className="lg:col-span-1 rounded-3xl p-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg shadow-indigo-200/50 flex flex-col justify-between animate-gradient-shift relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full" />
                    <div className="absolute bottom-[-30px] left-[-10px] w-32 h-32 bg-white/5 rounded-full" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-1.5">ภาคเรียนปัจจุบัน</div>
                      <div className="text-2xl font-extrabold leading-tight">ปีการศึกษา {adminYear}</div>
                      <div className="text-lg font-bold text-indigo-100 mb-3">ภาคเรียนที่ {adminTerm}</div>
                      <div className="text-sm text-indigo-100">{formatThaiDateRange(startDate, endDate)}</div>
                    </div>
                    <div className="mt-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isGradingActive ? "bg-emerald-400/20 text-emerald-50 border border-emerald-300/40" : "bg-rose-400/20 text-rose-50 border border-rose-300/40"
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${isGradingActive ? "bg-emerald-300 animate-pulse" : "bg-rose-300"}`} />
                        {isGradingActive ? "เปิดใช้งานระบบกรอกคะแนน" : "ปิดใช้งานระบบกรอกคะแนน"}
                      </span>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="lg:col-span-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ทางลัดจัดการระบบ</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {NAV_ITEMS.filter(item => item.key !== "dashboard").map(item => (
                        <QuickLinkCard
                          key={item.key}
                          label={item.label}
                          sub={item.sub}
                          icon={item.icon}
                          onClick={() => setActiveTab(item.key)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="p-8">
                <SectionHeader
                  icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  color="indigo"
                  title="ผู้ใช้งานระบบ"
                  subtitle="จัดการบัญชีผู้ดูแล ครู และนักเรียน"
                  count={users.length}
                  countLabel="บัญชี"
                >
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImportUsers}
                  />
                  <button onClick={handleDownloadTemplate} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    โหลดเทมเพลต
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    นำเข้า (CSV/Excel)
                  </button>
                  <button onClick={handleAddUser} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    เพิ่มผู้ใช้ใหม่
                  </button>
                  {selectedUserIds.length > 0 && (
                    <button onClick={handleBulkDeleteUsers} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      ลบที่เลือก ({selectedUserIds.length})
                    </button>
                  )}
                </SectionHeader>

                {/* Sub-tabs for User Roles */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
                  <button
                    onClick={() => setUserSubTab("all")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${userSubTab === "all"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                      }`}
                  >
                    <span>ทั้งหมด</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${userSubTab === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                      {users.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setUserSubTab("admin")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${userSubTab === "admin"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                      }`}
                  >
                    <span>ผู้ดูแลระบบ (Admin)</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${userSubTab === "admin" ? "bg-white/20 text-white" : "bg-red-50 text-red-600"
                      }`}>
                      {users.filter(u => u.role === "admin").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setUserSubTab("teacher")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${userSubTab === "teacher"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                      }`}
                  >
                    <span>ครูผู้สอน (Teacher)</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${userSubTab === "teacher" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                      }`}>
                      {users.filter(u => u.role === "teacher").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setUserSubTab("student")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${userSubTab === "student"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                      }`}
                  >
                    <span>นักเรียน (Student)</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${userSubTab === "student" ? "bg-white/20 text-white" : "bg-green-50 text-green-600"
                      }`}>
                      {users.filter(u => u.role === "student").length}
                    </span>
                  </button>
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/30 text-gray-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold w-12 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={paginatedUsers.filter(u => u.id !== adminUser?.id).length > 0 && paginatedUsers.filter(u => u.id !== adminUser?.id).every(u => selectedUserIds.includes(u.id))}
                            onChange={(e) => {
                              const currentPageIds = paginatedUsers.filter(u => u.id !== adminUser?.id).map(u => u.id);
                              if (e.target.checked) {
                                setSelectedUserIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
                              } else {
                                setSelectedUserIds(prev => prev.filter(id => !currentPageIds.includes(id)));
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-4 font-semibold">Username</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Student ID</th>
                        <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              checked={selectedUserIds.includes(u.id)}
                              disabled={u.id === adminUser?.id}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds(prev => [...prev, u.id]);
                                } else {
                                  setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-800">{u.username}</div>
                            {u.email && (
                              <div className="text-[11px] text-gray-400 mt-0.5">{u.email}</div>
                            )}
                            {u.role === "teacher" && (
                              <div className="text-[11px] text-gray-500 mt-1 space-y-0.5">
                                <div><span className="font-medium">ห้องประจำชั้น:</span> {classrooms.find(c => c.id === u.homeroom_classroom_id)?.name || "ไม่มี"}</div>
                                <div><span className="font-medium">วิชาที่สอน:</span> {u.subjects && u.subjects.length > 0 ? u.subjects.join(", ") : "ไม่มี"}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                              u.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{u.student_id || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => handleEditUser(u)} className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer">
                                แก้ไข
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer">
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {paginatedUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400 bg-gray-50/50">
                            ไม่มีข้อมูลผู้ใช้งานในหมวดหมู่นี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: Cards */}
                <div className="md:hidden space-y-3">
                  {paginatedUsers.map(u => (
                    <div key={u.id} className="card-modern p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="pt-1 shrink-0">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            checked={selectedUserIds.includes(u.id)}
                            disabled={u.id === adminUser?.id}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds(prev => [...prev, u.id]);
                              } else {
                                setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                              }
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-800 break-all">{u.username}</div>
                          {u.email && (
                            <div className="text-[11px] text-gray-400 break-all">{u.email}</div>
                          )}
                          <span className={`inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => handleEditUser(u)} className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer">
                            แก้ไข
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer">
                            ลบ
                          </button>
                        </div>
                      </div>
                      {u.student_id && (
                        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                          <span className="font-medium">Student ID:</span> {u.student_id}
                        </div>
                      )}
                      {u.role === "teacher" && (
                        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                          <div><span className="font-medium">ห้องประจำชั้น:</span> {classrooms.find(c => c.id === u.homeroom_classroom_id)?.name || "ไม่มี"}</div>
                          <div><span className="font-medium">วิชาที่สอน:</span> {u.subjects && u.subjects.length > 0 ? u.subjects.join(", ") : "ไม่มี"}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      ไม่มีข้อมูลผู้ใช้งานในหมวดหมู่นี้
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {filteredUsers.length > 0 && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                      <span>
                        แสดง {Math.min((userCurrentPage - 1) * usersPerPage + 1, filteredUsers.length)} ถึง {Math.min(userCurrentPage * usersPerPage, filteredUsers.length)} จากทั้งหมด {filteredUsers.length} รายการ
                      </span>
                      <span className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                        <span>แสดงหน้าละ</span>
                        <select
                          value={usersPerPage}
                          onChange={(e) => {
                            setUsersPerPage(Number(e.target.value));
                            setUserCurrentPage(1);
                          }}
                          className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all hover:bg-gray-100"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={filteredUsers.length}>ทั้งหมด</option>
                        </select>
                        <span>รายการ</span>
                      </span>
                    </div>

                    {totalUserPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setUserCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={userCurrentPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors cursor-pointer"
                        >
                          ก่อนหน้า
                        </button>
                        <div className="flex items-center gap-1 px-2">
                          {Array.from({ length: totalUserPages }).map((_, i) => {
                            const pageNum = i + 1;
                            if (pageNum === 1 || pageNum === totalUserPages || (pageNum >= userCurrentPage - 1 && pageNum <= userCurrentPage + 1)) {
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setUserCurrentPage(pageNum)}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors cursor-pointer border ${userCurrentPage === pageNum
                                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white text-gray-600 border-transparent hover:border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                            if (pageNum === userCurrentPage - 2 || pageNum === userCurrentPage + 2) {
                              return <span key={pageNum} className="text-gray-400">...</span>;
                            }
                            return null;
                          })}
                        </div>
                        <button
                          onClick={() => setUserCurrentPage(prev => Math.min(prev + 1, totalUserPages))}
                          disabled={userCurrentPage === totalUserPages}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors cursor-pointer"
                        >
                          ถัดไป
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "classrooms" && (
              <div className="p-8">
                <SectionHeader
                  icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16M9 7h1m4 0h1m-6 4h1m4 0h1m-5 9v-4a1 1 0 011-1h1a1 1 0 011 1v4"
                  color="purple"
                  title="จัดการชั้นเรียน"
                  subtitle="ชั้นเรียนแต่ละห้องผูกกับปีการศึกษา / เทอม"
                  count={classrooms.length}
                  countLabel="ห้อง"
                >
                  <input
                    type="file"
                    ref={classroomFileInputRef}
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleImportClassrooms}
                  />
                  <button onClick={handleDownloadClassroomTemplate} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    โหลดเทมเพลต
                  </button>
                  <button onClick={() => classroomFileInputRef.current?.click()} className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    นำเข้า (Excel)
                  </button>
                  <button
                    onClick={handleOpenCopyModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                    คัดลอกชั้นเรียน
                  </button>
                  {selectedClassroomIds.length > 0 && (
                    <button
                      onClick={handleBulkDeleteClassrooms}
                      className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      ลบที่เลือก ({selectedClassroomIds.length})
                    </button>
                  )}
                  <button
                    onClick={handleAddClassroom}
                    disabled={!selectedSettingId}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    เพิ่มชั้นเรียนใหม่
                  </button>
                </SectionHeader>

                {/* Term Selector */}
                <TermSelector
                  settingsList={settingsList}
                  selectedId={selectedSettingId}
                  onSelect={(id) => {
                    setSelectedSettingId(id);
                    setSelectedClassroomIds([]);
                    if (token) loadClassrooms(id, token);
                  }}
                />

                {/* Classroom Grid */}
                {!selectedSettingId ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
                  </div>
                ) : classrooms.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    ยังไม่มีชั้นเรียนในเทอมนี้ กด &quot;เพิ่มชั้นเรียนใหม่&quot; เพื่อเริ่ม
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                    {classrooms.map(c => (
                      <div key={c.id} className={`bg-gradient-to-br p-5 rounded-2xl border flex flex-col justify-between hover:shadow-md transition-all relative ${selectedClassroomIds.includes(c.id) ? "from-red-50/40 to-orange-50/40 border-red-200" : "from-indigo-50/40 to-blue-50/40 border-indigo-100"}`}>
                        <div className="absolute top-4 right-4">
                          <input
                            type="checkbox"
                            checked={selectedClassroomIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClassroomIds(prev => [...prev, c.id]);
                              } else {
                                setSelectedClassroomIds(prev => prev.filter(id => id !== c.id));
                              }
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                        <div className="pr-8">
                          <div className="font-extrabold text-lg text-indigo-700">{c.name}</div>
                          <div className="text-slate-400 text-xs mt-1 font-semibold truncate">ID: {c.id}</div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-indigo-100/30 flex-wrap">
                          <button
                            onClick={() => handleOpenAssignModal(c)}
                            className="text-emerald-600 hover:text-emerald-800 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            เพิ่มนักเรียน
                          </button>
                          <button
                            onClick={() => handleEditClassroom(c)}
                            className="text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteClassroom(c.id, c.name)}
                            className="text-red-500 hover:text-red-700 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assign Students Modal */}
                {isAssignModalOpen && targetClassroom && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 animate-slide-up overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-800">เพิ่มนักเรียนเข้าชั้นเรียน</h3>
                          <p className="text-sm font-semibold text-indigo-600 mt-0.5">ชั้น {targetClassroom.name}</p>
                        </div>
                        <button
                          onClick={() => setIsAssignModalOpen(false)}
                          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Body */}
                      <div className="p-6 overflow-y-auto flex-1 space-y-4">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="ค้นหานักเรียนด้วยชื่อ หรือรหัส..."
                            value={searchAssignStudent}
                            onChange={(e) => setSearchAssignStudent(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-semibold focus:ring-2 focus:ring-indigo-400 outline-none"
                          />
                          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>

                        <div className="flex flex-col gap-6">
                          {/* นักเรียนในชั้นเรียนนี้ */}
                          <div>
                            {(() => {
                              const assigned = students.filter(s => s.classroom_id === targetClassroom.id &&
                                (s.name.includes(searchAssignStudent) || s.student_id.includes(searchAssignStudent))
                              );
                              return (
                                <>
                                  <h4 className="text-sm font-bold text-gray-700 mb-3">นักเรียนในชั้นเรียนนี้ ({assigned.length} คน)</h4>
                                  <div className="border border-slate-100 rounded-xl max-h-60 overflow-y-auto bg-white shadow-sm">
                                    {assigned.length === 0 ? (
                                      <div className="p-6 text-center text-slate-400 text-sm font-semibold">ยังไม่มีนักเรียนในชั้นเรียนนี้</div>
                                    ) : (
                                      <div className="divide-y divide-slate-100">
                                        {assigned.map(s => (
                                          <div key={s.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                            <div>
                                              <div className="font-bold text-slate-700">{s.name}</div>
                                              <div className="text-xs font-semibold text-slate-400">รหัส: {s.student_id}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button onClick={() => handleEditStudent(s)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">แก้ไข</button>
                                              <button onClick={() => handleRemoveStudentFromClass(s)} className="text-amber-600 hover:text-amber-800 text-xs font-bold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">นำออก</button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* นักเรียนที่ยังไม่มีชั้นเรียน */}
                          <div>
                            {(() => {
                              const unassigned = students.filter(s => !s.classroom_id &&
                                (s.name.includes(searchAssignStudent) || s.student_id.includes(searchAssignStudent))
                              );
                              return (
                                <>
                                  <h4 className="text-sm font-bold text-gray-700 mb-3">เพิ่มนักเรียนที่ยังไม่มีชั้นเรียน ({unassigned.length} คน)</h4>
                                  <div className="border border-slate-100 rounded-xl max-h-60 overflow-y-auto bg-slate-50/30">
                                    {unassigned.length === 0 ? (
                                      <div className="p-6 text-center text-slate-400 text-sm font-semibold">ไม่พบนักเรียนที่ยังไม่มีห้อง</div>
                                    ) : (
                                      <div className="divide-y divide-slate-100">
                                        {unassigned.map(s => (
                                          <label key={s.id} className="flex items-center gap-3 p-3 hover:bg-indigo-50/50 cursor-pointer transition-colors">
                                            <input
                                              type="checkbox"
                                              checked={selectedStudentsForAssign.includes(s.id)}
                                              onChange={(e) => {
                                                if (e.target.checked) setSelectedStudentsForAssign(prev => [...prev, s.id]);
                                                else setSelectedStudentsForAssign(prev => prev.filter(id => id !== s.id));
                                              }}
                                              className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                            />
                                            <div>
                                              <div className="font-bold text-slate-700">{s.name}</div>
                                              <div className="text-xs font-semibold text-slate-400">รหัส: {s.student_id}</div>
                                            </div>
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                        <button
                          onClick={() => setIsAssignModalOpen(false)}
                          className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={handleSaveAssignedStudents}
                          disabled={selectedStudentsForAssign.length === 0}
                          className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-md cursor-pointer flex items-center gap-2"
                        >
                          บันทึก ({selectedStudentsForAssign.length})
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Copy Classrooms Modal */}
                {isCopyModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-100 animate-slide-up overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-800">คัดลอกชั้นเรียนและเลื่อนชั้น</h3>
                          <p className="text-sm font-semibold text-indigo-600 mt-0.5">ดึงข้อมูลชั้นเรียนและนักเรียนจากเทอมอื่นมายังเทอมเป้าหมาย</p>
                        </div>
                        <button onClick={() => setIsCopyModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      <div className="p-6 overflow-y-auto flex-1 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Source Term */}
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">1. เทอมต้นทาง (ที่ต้องการคัดลอก)</label>
                            <select
                              value={copySourceSettingId?.toString() || ""}
                              onChange={e => setCopySourceSettingId(e.target.value || null)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-semibold text-slate-700"
                            >
                              <option value="">-- เลือกเทอมต้นทาง --</option>
                              {settingsList.map(s => {
                                const todayStr = new Date().toISOString().split("T")[0];
                                const isWaiting = (s.start_date ?? "") > todayStr;
                                const status = s.is_active ? "(ปัจจุบัน)" : isWaiting ? "(รอเปิดใช้งาน)" : "(สิ้นสุดแล้ว)";
                                return (
                                  <option key={s.id} value={s.id?.toString()} disabled={s.id?.toString() === copyTargetSettingId?.toString()}>
                                    ปี {s.academic_year} เทอม {s.term} {status}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          {/* Target Term */}
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">2. เทอมปลายทาง (เป้าหมาย)</label>
                            <select
                              value={copyTargetSettingId?.toString() || ""}
                              onChange={e => setCopyTargetSettingId(e.target.value || null)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-semibold text-slate-700"
                            >
                              <option value="">-- เลือกเทอมปลายทาง --</option>
                              {settingsList.map(s => {
                                const todayStr = new Date().toISOString().split("T")[0];
                                const isWaiting = (s.start_date ?? "") > todayStr;
                                const status = s.is_active ? "(ปัจจุบัน)" : isWaiting ? "(รอเปิดใช้งาน)" : "(สิ้นสุดแล้ว)";
                                return (
                                  <option key={s.id} value={s.id?.toString()} disabled={s.id?.toString() === copySourceSettingId?.toString()}>
                                    ปี {s.academic_year} เทอม {s.term} {status}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        {copySourceSettingId && sourceClassrooms.length > 0 && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">3. เลือกชั้นเรียนที่ต้องการคัดลอก</label>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-left bg-white">
                                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold text-center w-16">คัดลอก</th>
                                    <th className="px-4 py-3 font-semibold">ชื่อชั้นเรียนเดิม</th>
                                    <th className="px-4 py-3 font-semibold">ชื่อชั้นเรียนใหม่ (แก้ไขได้)</th>
                                    <th className="px-4 py-3 font-semibold text-center">ย้ายนักเรียนมาด้วย</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {sourceClassrooms.map(c => {
                                    const m = copyClassroomsMap[c.id];
                                    if (!m) return null;
                                    return (
                                      <tr key={c.id} className={m.selected ? 'bg-indigo-50/20' : 'bg-slate-50/50'}>
                                        <td className="px-4 py-3 text-center">
                                          <input
                                            type="checkbox"
                                            checked={m.selected}
                                            onChange={e => setCopyClassroomsMap(prev => ({ ...prev, [c.id]: { ...prev[c.id], selected: e.target.checked } }))}
                                            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                          />
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">{c.name}</td>
                                        <td className="px-4 py-3">
                                          <input
                                            type="text"
                                            value={m.newName}
                                            onChange={e => setCopyClassroomsMap(prev => ({ ...prev, [c.id]: { ...prev[c.id], newName: e.target.value } }))}
                                            disabled={!m.selected}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-700 transition-all"
                                          />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <input
                                            type="checkbox"
                                            checked={m.moveStudents}
                                            disabled={!m.selected}
                                            onChange={e => setCopyClassroomsMap(prev => ({ ...prev, [c.id]: { ...prev[c.id], moveStudents: e.target.checked } }))}
                                            className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {copySourceSettingId && sourceClassrooms.length === 0 && (
                          <div className="text-center py-8 text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">ไม่มีชั้นเรียนในเทอมต้นทางนี้</div>
                        )}
                      </div>

                      <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                        <button onClick={() => setIsCopyModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                          ยกเลิก
                        </button>
                        <button
                          onClick={handleSaveCopyClassrooms}
                          disabled={!copySourceSettingId || !copyTargetSettingId || sourceClassrooms.filter(c => copyClassroomsMap[c.id]?.selected).length === 0}
                          className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-md cursor-pointer flex items-center gap-2"
                        >
                          บันทึกการคัดลอก
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "students" && (
              <div className="p-8">
                <SectionHeader
                  icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  color="green"
                  title="จัดการข้อมูลนักเรียน (Students)"
                  subtitle="จัดการข้อมูลและการนำนักเรียนเข้าชั้นเรียน (Enrollment)"
                  count={filteredStudents.length}
                  countLabel="คน"
                >
                  <select
                    className="border border-gray-200 rounded-xl px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    value={studentFilterClassroomId}
                    onChange={(e) => setStudentFilterClassroomId(e.target.value)}
                  >
                    <option value="unassigned">-- ยังไม่ระบุชั้นเรียน --</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </SectionHeader>

                {/* Export Students Section */}
                <div className="mb-6 p-5 rounded-2xl border border-amber-100 bg-amber-50 flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-xs">
                    <label className="block text-xs font-semibold text-amber-700 mb-2">📄 ภาษาการส่งออก</label>
                    <select
                      value={exportLanguage}
                      onChange={(e) => setExportLanguage(e.target.value as any)}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-amber-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent hover:border-amber-300 transition-colors"
                    >
                      <option value="th">🇹🇭 ภาษาไทย</option>
                      <option value="ms-rumi">🇲🇾 Bahasa Melayu (Rumi)</option>
                      <option value="ms-jawi">🇲🇾 Bahasa Melayu (Jawi)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleExportStudents}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8H3m16-8h3m-6-4l-4-4m0 0l-4 4m4-4v12" /></svg>
                    ส่งออกรายชื่อนักเรียน
                  </button>
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 animate-fade-in-up">
                  <table className="w-full text-left">
                    <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/30 text-gray-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold w-24">เลขที่</th>
                        <th className="px-6 py-4 font-semibold">รหัสนักเรียน</th>
                        <th className="px-6 py-4 font-semibold">ชื่อ-สกุล</th>
                        <th className="px-6 py-4 font-semibold">ห้องเรียน</th>
                        <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm font-medium text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white hover:bg-gray-50"
                              defaultValue={s.student_number || ""}
                              placeholder="-"
                              onBlur={(e) => {
                                if (e.target.value !== (s.student_number?.toString() || "")) {
                                  handleUpdateStudentNumber(s.id, e.target.value);
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 font-bold text-indigo-600">{s.student_id}</td>
                          <td className="px-6 py-4 text-gray-800 font-semibold">{s.name}</td>
                          <td className="px-6 py-4 text-gray-500">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-white/50">
                              ชั้น {classrooms.find(c => c.id === s.classroom_id)?.name || 'ยังไม่ระบุ'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditStudent(s)}
                                className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                              >
                                แก้ไขข้อมูล / จัดห้องเรียน
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: Cards */}
                <div className="md:hidden space-y-3 animate-fade-in-up">
                  {filteredStudents.map(s => (
                    <div key={s.id} className="card-modern p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="number"
                              placeholder="เลขที่"
                              className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-xs font-medium text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white hover:bg-gray-50"
                              defaultValue={s.student_number || ""}
                              onBlur={(e) => {
                                if (e.target.value !== (s.student_number?.toString() || "")) {
                                  handleUpdateStudentNumber(s.id, e.target.value);
                                }
                              }}
                            />
                            <div className="font-bold text-indigo-600">{s.student_id}</div>
                          </div>
                          <div className="text-gray-800 font-semibold mt-0.5">{s.name}</div>
                          <span className="inline-block mt-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-white/50">
                            ชั้น {classrooms.find(c => c.id === s.classroom_id)?.name || 'ยังไม่ระบุ'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEditStudent(s)}
                          className="flex-1 text-center text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                        >
                          แก้ไขข้อมูล / จัดห้องเรียน
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      ไม่มีข้อมูลนักเรียน
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "subjects" && (
              <div className="p-8">
                <SectionHeader
                  icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  color="amber"
                  title="จัดการวิชาเรียน (Subjects)"
                  subtitle="วิชาเรียนแต่ละรายวิชาผูกกับปีการศึกษา / เทอม"
                  count={selectedSubjectSettingId ? subjectsList.length : undefined}
                  countLabel="วิชา"
                >
                  <button
                    onClick={handleAddSubject}
                    disabled={!selectedSubjectSettingId}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    เพิ่มวิชาเรียนใหม่
                  </button>
                </SectionHeader>

                {/* Term Selector */}
                <TermSelector
                  settingsList={settingsList}
                  selectedId={selectedSubjectSettingId}
                  onSelect={handleSelectSubjectSetting}
                />

                {/* Subjects Table */}
                {!selectedSubjectSettingId ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
                  </div>
                ) : subjectsList.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    ยังไม่มีวิชาเรียนในเทอมนี้ กด &quot;เพิ่มวิชาเรียนใหม่&quot; เพื่อเริ่ม
                  </div>
                ) : (
                  <>
                    {/* Desktop: Table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 animate-fade-in-up">
                      <table className="w-full text-left">
                        <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/30 text-gray-600">
                          <tr>
                            <th className="px-6 py-4 font-semibold font-bold">ชื่อวิชาเรียน</th>
                            <th className="px-6 py-4 font-semibold font-bold">ครูผู้สอน</th>
                            <th className="px-6 py-4 font-semibold font-bold">ชั้นเรียน</th>
                            <th className="px-6 py-4 font-semibold text-center">ประเภทวิชา</th>
                            <th className="px-6 py-4 font-semibold text-center">คะแนนเต็ม (เก็บ/สอบ)</th>
                            <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {subjectsList.map(sub => (
                            <tr key={sub.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-semibold text-gray-800">{sub.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {sub.teacher_names && sub.teacher_names.length > 0
                                  ? sub.teacher_names.join(", ")
                                  : (sub.teacher_name || "-")}
                                {sub.teacher_names && sub.teacher_names.length > 1 && (
                                  <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">สอนรวม</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{sub.classroom_names && sub.classroom_names.length > 0 ? sub.classroom_names.join(", ") : "-"}</td>
                              <td className="px-6 py-4 text-center">
                                {sub.subject_type === "activity" ? (
                                  <span className="inline-flex flex-col items-center gap-0.5">
                                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      วิชากิจกรรม
                                    </span>
                                    {(Number(sub.midterm_max_score) + Number(sub.final_max_score)) > 0 ? (
                                      <span className="text-[11px] text-amber-600 font-semibold">มีคะแนน</span>
                                    ) : (
                                      <span className="text-[11px] text-slate-400">ไม่มีคะแนน</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="inline-flex flex-col items-center gap-0.5">
                                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      วิชาหลัก
                                    </span>
                                    <span className="text-[11px] text-gray-500">{Number(sub.credit_hours) || 1} หน่วยกิต</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                                {sub.subject_type === "activity" && (Number(sub.midterm_max_score) + Number(sub.final_max_score)) === 0
                                  ? <span className="text-slate-400">—</span>
                                  : `${sub.midterm_max_score ?? 50} / ${sub.final_max_score ?? 50}`}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleEditSubject(sub)}
                                    className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                                  >
                                    แก้ไขชื่อวิชา
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                    className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                                  >
                                    ลบ
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile: Cards */}
                    <div className="md:hidden space-y-3 animate-fade-in-up">
                      {subjectsList.map(sub => (
                        <div key={sub.id} className="card-modern p-4">
                          <div className="font-semibold text-gray-800">{sub.name}</div>
                          <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                            <div>
                              <span className="font-medium">ครูผู้สอน:</span>{" "}
                              {sub.teacher_names && sub.teacher_names.length > 0
                                ? sub.teacher_names.join(", ")
                                : (sub.teacher_name || "-")}
                              {sub.teacher_names && sub.teacher_names.length > 1 && (
                                <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">สอนรวม</span>
                              )}
                            </div>
                            <div><span className="font-medium">ชั้นเรียน:</span> {sub.classroom_names && sub.classroom_names.length > 0 ? sub.classroom_names.join(", ") : "-"}</div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">ประเภทวิชา:</span>
                              {sub.subject_type === "activity" ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  วิชากิจกรรม
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  วิชาหลัก ({Number(sub.credit_hours) || 1} หน่วยกิต)
                                </span>
                              )}
                            </div>
                            <div><span className="font-medium">คะแนนเต็ม:</span> เก็บ {sub.midterm_max_score ?? 50} / สอบ {sub.final_max_score ?? 50}</div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleEditSubject(sub)}
                              className="flex-1 text-center text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                            >
                              แก้ไขชื่อวิชา
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(sub.id, sub.name)}
                              className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="p-8 animate-fade-in-up">
                <SectionHeader
                  icon="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  color="blue"
                  title="ตารางเรียน (Schedule)"
                  subtitle="กำหนดคาบเรียนและตารางสอนแต่ละห้องเรียน ผูกกับปีการศึกษา / เทอม"
                  count={selectedSubjectSettingId ? schedulePeriods.length : undefined}
                  countLabel="คาบ/วัน"
                />

                {/* Term Selector */}
                <TermSelector
                  settingsList={settingsList}
                  selectedId={selectedSubjectSettingId}
                  onSelect={handleSelectSubjectSetting}
                />

                {!selectedSubjectSettingId ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Period Management */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3">คาบเรียน</h3>
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-left">
                          <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/30 text-gray-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold text-center">คาบที่</th>
                              <th className="px-4 py-3 font-semibold">เวลาเริ่ม</th>
                              <th className="px-4 py-3 font-semibold">เวลาจบ</th>
                              <th className="px-4 py-3 font-semibold">หมายเหตุ</th>
                              <th className="px-4 py-3 font-semibold text-center">คาบพัก</th>
                              <th className="px-4 py-3 font-semibold text-center">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {schedulePeriods.map((p, idx) => (
                              <tr key={p.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2 text-center font-semibold text-gray-700">{p.period_no}</td>
                                <td className="px-4 py-2">
                                  <input
                                    type="time"
                                    value={p.start_time}
                                    onChange={e => updatePeriodField(idx, "start_time", e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="time"
                                    value={p.end_time}
                                    onChange={e => updatePeriodField(idx, "end_time", e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={p.label ?? ""}
                                    onChange={e => updatePeriodField(idx, "label", e.target.value)}
                                    placeholder="เช่น พักเที่ยง"
                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={!!p.is_break}
                                    onChange={e => updatePeriodField(idx, "is_break", e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleSavePeriod(p)}
                                      className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                                    >
                                      บันทึก
                                    </button>
                                    <button
                                      onClick={() => handleDeletePeriod(p.id)}
                                      className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                                    >
                                      ลบ
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {schedulePeriods.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                                  ยังไม่มีคาบเรียน กด &quot;เพิ่มคาบเรียน&quot; เพื่อเริ่ม
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <button
                        onClick={handleAddPeriod}
                        className="mt-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        เพิ่มคาบเรียน
                      </button>
                    </div>

                    {/* Export Schedule */}
                    {schedulePeriods.length > 0 && scheduleEntries.length > 0 && (
                      <div className="mt-2 pt-5 border-t border-gray-100">
                        <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          ส่งออกตารางเรียน
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <select
                            value={exportLanguage}
                            onChange={(e) => setExportLanguage(e.target.value as any)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer"
                          >
                            <option value="th">🇹🇭 ภาษาไทย</option>
                            <option value="ms-rumi">🇲🇾 Rumi</option>
                            <option value="ms-jawi">🇲🇾 Jawi (جاوي)</option>
                          </select>
                          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>
                          <button
                            onClick={() => handleExportSchedule("overview")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold transition-all shadow-sm border-0 cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            ภาพรวมทุกชั้น
                          </button>
                          <button
                            onClick={() => handleExportSchedule("classroom")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-sm border-0 cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            รายชั้นเรียน
                          </button>
                          <button
                            onClick={() => handleExportSchedule("teacher")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-sm border-0 cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            รายครูผู้สอน
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">คลิกปุ่ม "พิมพ์ / บันทึก PDF" ในหน้าที่เปิดขึ้นมา เพื่อพิมพ์หรือบันทึกเป็น PDF</p>
                      </div>
                    )}

                    {/* Classroom Schedule Grid */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3">ตารางสอนรายห้อง</h3>
                      <div className="mb-4">
                        <select
                          value={scheduleClassroomId}
                          onChange={e => setScheduleClassroomId(e.target.value)}
                          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-400 outline-none"
                        >
                          <option value="">-- เลือกห้องเรียน --</option>
                          {subjectClassrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {!scheduleClassroomId ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          กรุณาเลือกห้องเรียนด้านบน
                        </div>
                      ) : schedulePeriods.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          กรุณาเพิ่มคาบเรียนก่อน
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                          <table className="w-full text-left text-base">
                            <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/30 text-gray-600">
                              <tr>
                                <th className="px-3 py-3 font-semibold">คาบ</th>
                                {ACTIVE_DAYS.map(d => (
                                  <th key={d.value} className="px-3 py-3 font-semibold text-center">{d.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {schedulePeriods.map(p => {
                                const subjectsForClassroom = subjectsList.filter(s => s.classroom_ids?.includes(scheduleClassroomId));
                                return (
                                  <tr key={p.id} className="hover:bg-gray-50/50">
                                    <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap align-top">
                                      คาบ {p.period_no}
                                      <div className="text-xs text-gray-400 font-normal">{p.start_time}-{p.end_time}</div>
                                      {p.label && <div className="text-xs text-amber-600 font-normal">{p.label}</div>}
                                    </td>
                                    {p.is_break ? (
                                      <td colSpan={ACTIVE_DAYS.length} className="px-3 py-2 align-middle text-center bg-slate-100 border border-slate-200 rounded-md">
                                        <div className="font-bold text-slate-400 tracking-widest">{p.label || "พักเบรก"}</div>
                                      </td>
                                    ) : (
                                      ACTIVE_DAYS.map(d => {
                                        const entry = scheduleEntries.find(e => e.classroom_id === scheduleClassroomId && Number(e.day_of_week) === d.value && e.period_id === p.id);
                                        const selectedSubj = entry?.subject_id ? subjectsList.find(s => s.id === entry.subject_id) : null;
                                        const subjectTeacherDisplay = selectedSubj?.teacher_names && selectedSubj.teacher_names.length > 0
                                          ? selectedSubj.teacher_names.join(", ")
                                          : (selectedSubj?.teacher_name || "");
                                        return (
                                          <td key={d.value} className="px-3 py-2 align-top min-w-[140px]">
                                            {/* Subject Selector */}
                                            <select
                                              value={entry?.subject_id ?? ""}
                                              onChange={ev => handleScheduleCellChange(d.value, p.id, ev.target.value, entry?.id)}
                                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                            >
                                              <option value="">- ว่าง -</option>
                                              {subjectsForClassroom.map(s => {
                                                const tDisplay = s.teacher_names && s.teacher_names.length > 0
                                                  ? s.teacher_names.join(", ")
                                                  : (s.teacher_name || "");
                                                return (
                                                  <option key={s.id} value={s.id}>
                                                    {s.name}{tDisplay ? ` (${tDisplay})` : ""}
                                                  </option>
                                                );
                                              })}
                                            </select>

                                            {/* Teacher Override Selector (Scenario B) */}
                                            {entry?.subject_id && selectedSubj?.teacher_ids && selectedSubj.teacher_ids.length > 0 && (
                                              <select
                                                value={entry.teacher_id ?? ""}
                                                onChange={ev => handleScheduleTeacherChange(d.value, p.id, entry.subject_id, ev.target.value || null, entry.id)}
                                                className="w-full mt-1 px-2 py-1 rounded-lg border border-blue-200 bg-blue-50/60 text-xs text-blue-700 focus:ring-2 focus:ring-blue-300 outline-none"
                                                title="ระบุครูผู้สอนเฉพาะห้องนี้ (กรณีครูต่างกันแต่ละชั้น)"
                                              >
                                                <option value="">
                                                  {subjectTeacherDisplay ? `ครู: ${subjectTeacherDisplay}` : "-- เลือกครูผู้สอน --"}
                                                </option>
                                                {users
                                                  .filter(u => selectedSubj.teacher_ids!.includes(u.id))
                                                  .map(u => (
                                                    <option key={u.id} value={u.id}>{u.username}</option>
                                                  ))}
                                              </select>
                                            )}

                                            {/* Scenario A indicator: co-teaching */}
                                            {entry?.subject_id && !entry.teacher_id && selectedSubj?.teacher_names && selectedSubj.teacher_names.length > 1 && (
                                              <div className="mt-0.5 text-xs text-blue-600 font-bold">สอนรวม</div>
                                            )}
                                          </td>
                                        );
                                      })
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "rankings" && (
              <div className="p-8 animate-fade-in-up">
                <SectionHeader
                  icon="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  color="purple"
                  title="อันดับผลการเรียน"
                  subtitle="จัดอันดับนักเรียนจากคะแนนรวม ทั้งภายในห้องเรียนและทั้งโรงเรียน"
                >
                  <button
                    onClick={() => { if (rankingsSettingId && token) loadRankings(rankingsSettingId, token); }}
                    disabled={!rankingsSettingId}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    รีเฟรชข้อมูล
                  </button>
                </SectionHeader>

                <TermSelector settingsList={settingsList} selectedId={rankingsSettingId} onSelect={handleSelectRankingsSetting} />

                {!rankingsSettingId ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 font-semibold">
                    กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
                  </div>
                ) : rankingsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                    <p className="text-gray-500 font-semibold text-sm">กำลังคำนวณอันดับ...</p>
                  </div>
                ) : rankingsData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 font-semibold">
                    ไม่มีข้อมูลนักเรียนในเทอมนี้
                  </div>
                ) : (() => {
                  const classroomList = Array.from(new Set(rankingsData.map(r => r.classroom_name))).sort();
                  const filtered = rankingsClassroomFilter === "all" ? rankingsData : rankingsData.filter(r => r.classroom_name === rankingsClassroomFilter);
                  const classroomSorted = [...filtered].sort((a, b) => a.classroom_rank - b.classroom_rank || b.percentage - a.percentage);
                  const schoolSorted = [...filtered].sort((a, b) => a.school_rank - b.school_rank || b.percentage - a.percentage);

                  return (
                    <div>
                      {/* Classroom Filter */}
                      <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">กรองห้องเรียน:</span>
                        <button
                          onClick={() => setRankingsClassroomFilter("all")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${rankingsClassroomFilter === "all" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"}`}
                        >
                          ทั้งหมด
                        </button>
                        {classroomList.map(cn => (
                          <button
                            key={cn}
                            onClick={() => setRankingsClassroomFilter(cn)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${rankingsClassroomFilter === cn ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"}`}
                          >
                            {cn}
                          </button>
                        ))}
                      </div>

                      {/* Two-column layout */}
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* Classroom Ranking */}
                        <div className="card-modern overflow-hidden border-purple-100/60">
                          <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                            <h3 className="font-bold text-purple-800 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16" /></svg>
                              อันดับในห้องเรียน
                            </h3>
                            <p className="text-xs text-purple-500 mt-0.5">{filtered.length} คน</p>
                          </div>
                          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 text-gray-500 text-xs sticky top-0 z-10">
                                <tr>
                                  <th className="px-3 py-2.5 text-center font-bold w-14">อันดับ</th>
                                  <th className="px-3 py-2.5 font-bold">ชื่อ-นามสกุล</th>
                                  <th className="px-3 py-2.5 text-center font-bold w-16">ห้อง</th>
                                  <th className="px-3 py-2.5 text-center font-bold w-20">เปอร์เซ็นต์</th>
                                  <th className="px-3 py-2.5 text-center font-bold w-16">GPA</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {classroomSorted.map((s, i) => (
                                  <tr key={`cr-${s.student_id}`} className={`transition-colors ${s.classroom_rank <= 3 ? "bg-amber-50/40" : "hover:bg-gray-50"}`}>
                                    <td className="px-3 py-2.5 text-center">
                                      {s.classroom_rank <= 3 ? (
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${s.classroom_rank === 1 ? "bg-amber-400 text-white" : s.classroom_rank === 2 ? "bg-gray-300 text-white" : "bg-orange-300 text-white"}`}>
                                          {s.classroom_rank}
                                        </span>
                                      ) : (
                                        <span className="text-gray-500 font-bold text-xs">{s.classroom_rank}</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="font-semibold text-gray-800 text-xs">{s.student_name}</div>
                                      <div className="text-[10px] text-gray-400">{s.student_id}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-xs text-gray-600 font-semibold">{s.classroom_name}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`text-xs font-extrabold ${s.percentage >= 80 ? "text-emerald-600" : s.percentage >= 60 ? "text-amber-600" : s.percentage >= 50 ? "text-orange-600" : "text-rose-600"}`}>
                                        {s.percentage.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${s.gpa >= 3.0 ? "bg-emerald-100 text-emerald-700" : s.gpa >= 2.0 ? "bg-amber-100 text-amber-700" : s.gpa >= 1.0 ? "bg-orange-100 text-orange-700" : "bg-rose-100 text-rose-700"}`}>
                                        {s.gpa.toFixed(2)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* School Ranking */}
                        <div className="card-modern overflow-hidden border-blue-100/60">
                          <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                              อันดับทั้งโรงเรียน
                            </h3>
                            <p className="text-xs text-blue-500 mt-0.5">{rankingsData.length} คน</p>
                          </div>
                          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 text-gray-500 text-xs sticky top-0 z-10">
                                <tr>
                                  <th className="px-3 py-2.5 text-center font-bold w-14">อันดับ</th>
                                  <th className="px-3 py-2.5 font-bold">ชื่อ-นามสกุล</th>
                                  <th className="px-3 py-2.5 text-center font-bold w-16">ห้อง</th>
                                  <th className="px-3 py-2.5 text-center font-bold w-20">เปอร์เซ็นต์</th>
                                  <th className="px-3 py-2.5 text-center font-bold w-16">GPA</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {schoolSorted.map((s, i) => (
                                  <tr key={`sr-${s.student_id}`} className={`transition-colors ${s.school_rank <= 3 ? "bg-amber-50/40" : "hover:bg-gray-50"}`}>
                                    <td className="px-3 py-2.5 text-center">
                                      {s.school_rank <= 3 ? (
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${s.school_rank === 1 ? "bg-amber-400 text-white" : s.school_rank === 2 ? "bg-gray-300 text-white" : "bg-orange-300 text-white"}`}>
                                          {s.school_rank}
                                        </span>
                                      ) : (
                                        <span className="text-gray-500 font-bold text-xs">{s.school_rank}</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="font-semibold text-gray-800 text-xs">{s.student_name}</div>
                                      <div className="text-[10px] text-gray-400">{s.student_id}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-xs text-gray-600 font-semibold">{s.classroom_name}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`text-xs font-extrabold ${s.percentage >= 80 ? "text-emerald-600" : s.percentage >= 60 ? "text-amber-600" : s.percentage >= 50 ? "text-orange-600" : "text-rose-600"}`}>
                                        {s.percentage.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${s.gpa >= 3.0 ? "bg-emerald-100 text-emerald-700" : s.gpa >= 2.0 ? "bg-amber-100 text-amber-700" : s.gpa >= 1.0 ? "bg-orange-100 text-orange-700" : "bg-rose-100 text-rose-700"}`}>
                                        {s.gpa.toFixed(2)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "grade-status" && (
              <div className="p-8 animate-fade-in-up">
                <SectionHeader
                  icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  color="amber"
                  title="สถานะการกรอกคะแนน"
                  subtitle="ตรวจสอบความคืบหน้าการกรอกคะแนนของครูแต่ละคน แต่ละวิชา"
                >
                  <button
                    onClick={() => {
                      if (gradeStatusSettingId && token) loadGradeStatus(gradeStatusSettingId, token);
                    }}
                    disabled={!gradeStatusSettingId}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    รีเฟรชข้อมูล
                  </button>
                </SectionHeader>

                <TermSelector
                  settingsList={settingsList}
                  selectedId={gradeStatusSettingId}
                  onSelect={handleSelectGradeStatusSetting}
                />

                {!gradeStatusSettingId ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 font-semibold">
                    กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
                  </div>
                ) : gradeStatusLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                    <p className="text-gray-500 font-semibold text-sm">กำลังโหลดข้อมูล...</p>
                  </div>
                ) : (
                  <>
                    {/* Sub-tabs: Summary / Detail */}
                    <div className="flex gap-2 mb-6">
                      <button
                        onClick={() => {
                          setGradeStatusSubTab("summary");
                          setSelectedGradeStatusSubject("");
                        }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${gradeStatusSubTab === "summary" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"}`}
                      >
                        <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        สรุปภาพรวม
                      </button>
                      <button
                        onClick={() => setGradeStatusSubTab("detail")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${gradeStatusSubTab === "detail" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"}`}
                      >
                        <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        รายละเอียด
                      </button>
                    </div>

                    {gradeStatusSubTab === "summary" && (() => {
                      const teacherMap = new Map<string, { name: string; subjects: Map<string, { total: number; midterm: number; final: number; classrooms: string[] }> }>();
                      gradeStatusData.forEach(row => {
                        const tid = row.teacher_id || "__none__";
                        const tname = row.teacher_name || "ไม่มีครูผู้สอน";
                        if (!teacherMap.has(tid)) teacherMap.set(tid, { name: tname, subjects: new Map() });
                        const teacher = teacherMap.get(tid)!;
                        if (!teacher.subjects.has(row.subject_id)) {
                          teacher.subjects.set(row.subject_id, { total: 0, midterm: 0, final: 0, classrooms: [] });
                        }
                        const subj = teacher.subjects.get(row.subject_id)!;
                        subj.total += Number(row.total_students);
                        subj.midterm += Number(row.midterm_entered);
                        subj.final += Number(row.final_entered);
                        if (row.classroom_name) subj.classrooms.push(row.classroom_name);
                      });

                      const teachers = Array.from(teacherMap.entries()).filter(([id]) => id !== "__none__");
                      const totalTeachers = teachers.length;
                      const completedTeachers = teachers.filter(([, t]) =>
                        Array.from(t.subjects.values()).every(s => s.total > 0 && s.midterm >= s.total && s.final >= s.total)
                      ).length;
                      const inProgressTeachers = teachers.filter(([, t]) => {
                        const subs = Array.from(t.subjects.values());
                        const hasAny = subs.some(s => s.midterm > 0 || s.final > 0);
                        const allDone = subs.every(s => s.total > 0 && s.midterm >= s.total && s.final >= s.total);
                        return hasAny && !allDone;
                      }).length;
                      const notStartedTeachers = totalTeachers - completedTeachers - inProgressTeachers;

                      return (
                        <div>
                          {/* Overview Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <StatCard label="ครูผู้สอนทั้งหมด" value={totalTeachers} color="blue" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            <StatCard label="กรอกครบแล้ว" value={completedTeachers} sub={`${totalTeachers > 0 ? Math.round(completedTeachers / totalTeachers * 100) : 0}%`} color="green" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <StatCard label="กำลังดำเนินการ" value={inProgressTeachers} color="amber" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <StatCard label="ยังไม่เริ่ม" value={notStartedTeachers} color="red" icon="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </div>

                          {/* Teacher Cards */}
                          {teachers.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 font-semibold">
                              ไม่มีข้อมูลครูผู้สอนในเทอมนี้
                            </div>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                              {teachers.map(([tid, teacher]) => {
                                const subs = Array.from(teacher.subjects.entries());
                                const allTotal = subs.reduce((a, [, s]) => a + s.total, 0);
                                const allMidterm = subs.reduce((a, [, s]) => a + s.midterm, 0);
                                const allFinal = subs.reduce((a, [, s]) => a + s.final, 0);
                                const allDone = subs.every(([, s]) => s.total > 0 && s.midterm >= s.total && s.final >= s.total);
                                const hasAny = subs.some(([, s]) => s.midterm > 0 || s.final > 0);
                                const overallPct = allTotal > 0 ? Math.round(((allMidterm + allFinal) / (allTotal * 2)) * 100) : 0;

                                let statusColor = "bg-gray-100 text-gray-500 border-gray-200";
                                let statusText = "ยังไม่เริ่ม";
                                if (allDone) { statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200"; statusText = "ครบแล้ว"; }
                                else if (hasAny) { statusColor = "bg-amber-100 text-amber-800 border-amber-200"; statusText = "กำลังดำเนินการ"; }

                                return (
                                  <div key={tid} className="card-interactive p-5">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                          {teacher.name.charAt(0)}
                                        </div>
                                        <div>
                                          <div className="font-bold text-gray-800 text-sm">{teacher.name}</div>
                                          <div className="text-xs text-gray-400">{subs.length} วิชา</div>
                                        </div>
                                      </div>
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                                        {statusText}
                                      </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-3">
                                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>ความคืบหน้ารวม</span>
                                        <span className="font-bold">{overallPct}%</span>
                                      </div>
                                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                          className={`h-2.5 rounded-full transition-all ${allDone ? "bg-emerald-500" : overallPct > 0 ? "bg-amber-500" : "bg-gray-300"}`}
                                          style={{ width: `${overallPct}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Subject breakdown */}
                                    <div className="space-y-2">
                                      {subs.map(([sid, s]) => {
                                        const midPct = s.total > 0 ? Math.round((s.midterm / s.total) * 100) : 0;
                                        const finPct = s.total > 0 ? Math.round((s.final / s.total) * 100) : 0;
                                        const subjectRow = gradeStatusData.find(r => r.subject_id === sid);
                                        const subjectName = subjectRow?.subject_name || sid;
                                        return (
                                          <div key={sid} className="bg-gray-50 rounded-xl p-3">
                                            <div className="font-semibold text-xs text-gray-700 mb-1.5">{subjectName}</div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                              <div>
                                                <span className="text-gray-400">คะแนนเก็บ: </span>
                                                <span className={`font-bold ${midPct >= 100 ? "text-emerald-600" : midPct > 0 ? "text-amber-600" : "text-gray-400"}`}>
                                                  {s.midterm}/{s.total}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-gray-400">คะแนนสอบ: </span>
                                                <span className={`font-bold ${finPct >= 100 ? "text-emerald-600" : finPct > 0 ? "text-amber-600" : "text-gray-400"}`}>
                                                  {s.final}/{s.total}
                                                </span>
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
                        </div>
                      );
                    })()}

                    {gradeStatusSubTab === "detail" && (
                      <div>
                        {gradeStatusData.length === 0 ? (
                          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 font-semibold">
                            ไม่มีข้อมูลในเทอมนี้
                          </div>
                        ) : (
                          <>
                            <div className="mb-4 flex gap-3 items-end">
                              <div className="flex-1 max-w-xs">
                                <label className="block text-xs font-semibold text-gray-600 mb-2">เลือกวิชา</label>
                                <select
                                  value={selectedGradeStatusSubject}
                                  onChange={(e) => setSelectedGradeStatusSubject(e.target.value)}
                                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-colors"
                                >
                                  <option value="">ทั้งหมด</option>
                                  {Array.from(new Set(gradeStatusData.map(row => row.subject_id)))
                                    .map(subjectId => {
                                      const subjectName = gradeStatusData.find(row => row.subject_id === subjectId)?.subject_name || subjectId;
                                      return (
                                        <option key={subjectId} value={subjectId}>{subjectName}</option>
                                      );
                                    })}
                                </select>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">คลิกแถวเพื่อดูรายชื่อนักเรียน</p>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
                              <table className="w-full text-left">
                                <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/30 text-gray-600">
                                  <tr>
                                    <th className="px-4 py-3 font-bold text-xs">ครูผู้สอน</th>
                                    <th className="px-4 py-3 font-bold text-xs">วิชา</th>
                                    <th className="px-4 py-3 font-bold text-xs">ชั้นเรียน</th>
                                    <th className="px-4 py-3 font-bold text-xs text-center">นักเรียน</th>
                                    <th className="px-4 py-3 font-bold text-xs text-center">คะแนนเก็บ</th>
                                    <th className="px-4 py-3 font-bold text-xs text-center">คะแนนสอบ</th>
                                    <th className="px-4 py-3 font-bold text-xs text-center">สถานะ</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {gradeStatusData
                                    .filter(row => !selectedGradeStatusSubject || row.subject_id === selectedGradeStatusSubject)
                                    .map((row, i) => {
                                    const total = Number(row.total_students);
                                    const mid = Number(row.midterm_entered);
                                    const fin = Number(row.final_entered);
                                    const midPct = total > 0 ? Math.round((mid / total) * 100) : 0;
                                    const finPct = total > 0 ? Math.round((fin / total) * 100) : 0;
                                    const isDone = total > 0 && mid >= total && fin >= total;
                                    const hasAny = mid > 0 || fin > 0;

                                    return (
                                      <tr key={i} onClick={() => openStudentDetail(row)} className="hover:bg-indigo-50/50 cursor-pointer transition-colors">
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                                          {row.teacher_name || <span className="text-gray-400">ไม่ระบุ</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm font-semibold text-gray-800">{row.subject_name}</div>
                                          <div className="text-[10px] text-gray-400">
                                            {row.subject_type === "activity" ? "วิชากิจกรรม" : `วิชาหลัก (${row.credit_hours || 1} หน่วยกิต)`}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.classroom_name || "-"}</td>
                                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{total}</td>
                                        <td className="px-4 py-3 text-center">
                                          <div className="flex items-center justify-center gap-1.5">
                                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                              <div className={`h-1.5 rounded-full ${midPct >= 100 ? "bg-emerald-500" : midPct > 0 ? "bg-amber-500" : "bg-gray-300"}`} style={{ width: `${Math.min(midPct, 100)}%` }} />
                                            </div>
                                            <span className={`text-xs font-bold ${midPct >= 100 ? "text-emerald-600" : midPct > 0 ? "text-amber-600" : "text-gray-400"}`}>
                                              {mid}/{total}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <div className="flex items-center justify-center gap-1.5">
                                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                              <div className={`h-1.5 rounded-full ${finPct >= 100 ? "bg-emerald-500" : finPct > 0 ? "bg-amber-500" : "bg-gray-300"}`} style={{ width: `${Math.min(finPct, 100)}%` }} />
                                            </div>
                                            <span className={`text-xs font-bold ${finPct >= 100 ? "text-emerald-600" : finPct > 0 ? "text-amber-600" : "text-gray-400"}`}>
                                              {fin}/{total}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {isDone ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                              ครบ
                                            </span>
                                          ) : hasAny ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3" /></svg>
                                              กำลังกรอก
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                              ยังไม่เริ่ม
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                              {gradeStatusData
                                .filter(row => !selectedGradeStatusSubject || row.subject_id === selectedGradeStatusSubject)
                                .map((row, i) => {
                                const total = Number(row.total_students);
                                const mid = Number(row.midterm_entered);
                                const fin = Number(row.final_entered);
                                const midPct = total > 0 ? Math.round((mid / total) * 100) : 0;
                                const finPct = total > 0 ? Math.round((fin / total) * 100) : 0;
                                const isDone = total > 0 && mid >= total && fin >= total;
                                const hasAny = mid > 0 || fin > 0;

                                return (
                                  <div key={i} onClick={() => openStudentDetail(row)} className="card-modern p-4 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.99]">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div>
                                        <div className="font-bold text-gray-800 text-sm">{row.subject_name}</div>
                                        <div className="text-xs text-gray-400">{row.classroom_name || "-"}</div>
                                      </div>
                                      {isDone ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">ครบ</span>
                                      ) : hasAny ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">กำลังกรอก</span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200 shrink-0">ยังไม่เริ่ม</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-indigo-600 font-semibold mb-2">{row.teacher_name || "ไม่ระบุครูผู้สอน"}</div>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <div className="text-gray-400 mb-1">คะแนนเก็บ</div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-0.5">
                                          <div className={`h-1.5 rounded-full ${midPct >= 100 ? "bg-emerald-500" : midPct > 0 ? "bg-amber-500" : "bg-gray-300"}`} style={{ width: `${Math.min(midPct, 100)}%` }} />
                                        </div>
                                        <span className="font-bold text-gray-600">{mid}/{total}</span>
                                      </div>
                                      <div>
                                        <div className="text-gray-400 mb-1">คะแนนสอบ</div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-0.5">
                                          <div className={`h-1.5 rounded-full ${finPct >= 100 ? "bg-emerald-500" : finPct > 0 ? "bg-amber-500" : "bg-gray-300"}`} style={{ width: `${Math.min(finPct, 100)}%` }} />
                                        </div>
                                        <span className="font-bold text-gray-600">{fin}/{total}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="p-8 animate-fade-in-up">
                <SectionHeader
                  icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  color="slate"
                  title="ตั้งค่าระบบ"
                  subtitle="กำหนดปีการศึกษา เทอม และช่วงเวลาการบันทึกคะแนนในระบบทั้งหมด"
                  count={new Set(settingsList.map((s: any) => s.academic_year)).size}
                  countLabel="ปีการศึกษา"
                >
                  <button
                    onClick={handleAddSetting}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    เพิ่มปีการศึกษาใหม่
                  </button>
                </SectionHeader>

                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-5 rounded-2xl border flex flex-col gap-2 shadow-sm ${isGradingActive
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                    <div className="flex items-center gap-2 font-bold text-base">
                      {isGradingActive ? (
                        <>
                          <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span>🟢 สถานะระบบปัจจุบัน: เปิดการกรอกคะแนน (Active)</span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-3 w-3 rounded-full bg-rose-500 shrink-0" />
                          <span>🔴 สถานะระบบปัจจุบัน: ปิดการกรอกคะแนน (Expired/Inactive)</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-600/90 space-y-1 mt-1.5 font-medium">
                      <div><span className="font-bold text-gray-700">ปีการศึกษาปัจจุบัน:</span> {adminYear}</div>
                      <div><span className="font-bold text-gray-700">เทอมปัจจุบัน:</span> {adminTerm}</div>
                      <div><span className="font-bold text-gray-700">ช่วงเวลาทำงานปัจจุบัน:</span> {formatThaiDateRange(startDate, endDate)}</div>
                    </div>
                  </div>

                  {/* Settings List */}
                  {/* Desktop: Table */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 animate-fade-in-up">
                    <table className="w-full text-left">
                      <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/30 text-gray-600">
                        <tr>
                          <th className="px-6 py-4 font-semibold font-bold">ปีการศึกษา / เทอม</th>
                          <th className="px-6 py-4 font-semibold">ช่วงเวลากรอกคะแนน</th>
                          <th className="px-6 py-4 font-semibold text-center">คะแนนเต็ม (เก็บ/สอบ)</th>
                          <th className="px-6 py-4 font-semibold text-center">สถานะ</th>
                          <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {settingsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-semibold">
                              ไม่มีข้อมูลปีการศึกษาในระบบ
                            </td>
                          </tr>
                        ) : (
                          settingsList.map((s: any) => {
                            const todayStr = new Date().toISOString().split("T")[0];
                            const isPeriodActive = todayStr >= (s.start_date ?? "") && todayStr <= (s.end_date ?? "");
                            const isWaiting = (s.start_date ?? "") > todayStr;

                            return (
                              <tr key={s.id} className={`hover:bg-gray-50/50 ${s.is_active ? 'bg-indigo-50/20' : ''}`}>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-gray-800">ปีการศึกษา {s.academic_year}</div>
                                  <div className="text-xs text-indigo-600 font-semibold mt-0.5">ภาคเรียนที่ (เทอม) {s.term}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-700 font-semibold">{formatThaiDateRange(s.start_date, s.end_date)}</div>
                                  <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                    {isPeriodActive ? (
                                      <span className="text-emerald-600 font-bold">● กำลังอยู่ในช่วงเวลากรอกคะแนน</span>
                                    ) : (
                                      <span className="text-rose-500 font-bold">● อยู่นอกช่วงเวลากรอกคะแนน</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                                  {s.midterm_max_score ?? 50} / {s.final_max_score ?? 50}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {s.is_active ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      กำลังใช้งาน (ปัจจุบัน)
                                    </span>
                                  ) : isWaiting ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      รอเปิดใช้งาน
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                      สิ้นสุดแล้ว
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleEditSetting(s)}
                                      className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                                    >
                                      แก้ไข
                                    </button>
                                    {!s.is_active && (
                                      <button
                                        onClick={() => handleDeleteSetting(s.id, `ปี ${s.academic_year} เทอม ${s.term}`)}
                                        className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
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

                  {/* Mobile: Cards */}
                  <div className="md:hidden space-y-3 animate-fade-in-up">
                    {settingsList.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 font-semibold">
                        ไม่มีข้อมูลปีการศึกษาในระบบ
                      </div>
                    ) : (
                      settingsList.map((s: any) => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        const isPeriodActive = todayStr >= (s.start_date ?? "") && todayStr <= (s.end_date ?? "");
                        const isWaiting = (s.start_date ?? "") > todayStr;

                        return (
                          <div key={s.id} className={`card-modern p-4 ${s.is_active ? 'bg-indigo-50/20' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-gray-800">ปีการศึกษา {s.academic_year}</div>
                                <div className="text-xs text-indigo-600 font-semibold mt-0.5">ภาคเรียนที่ (เทอม) {s.term}</div>
                              </div>
                              {s.is_active ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  กำลังใช้งาน
                                </span>
                              ) : isWaiting ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                  รอเปิดใช้งาน
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                                  สิ้นสุดแล้ว
                                </span>
                              )}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="text-sm text-gray-700 font-semibold">{formatThaiDateRange(s.start_date, s.end_date)}</div>
                              <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                {isPeriodActive ? (
                                  <span className="text-emerald-600 font-bold">● กำลังอยู่ในช่วงเวลากรอกคะแนน</span>
                                ) : (
                                  <span className="text-rose-500 font-bold">● อยู่นอกช่วงเวลากรอกคะแนน</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 font-semibold mt-1.5">
                                คะแนนเต็ม: เก็บ {s.midterm_max_score ?? 50} / สอบ {s.final_max_score ?? 50}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => handleEditSetting(s)}
                                className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                              >
                                แก้ไข
                              </button>
                              {!s.is_active && (
                                <button
                                  onClick={() => handleDeleteSetting(s.id, `ปี ${s.academic_year} เทอม ${s.term}`)}
                                  className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                                >
                                  ลบ
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modern React Modal for Adding/Editing Users */}
      {isUserModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-opacity duration-300 animate-fade-in-up"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-white/60 shadow-2xl glass-strong w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-6 pt-6 pb-4 flex items-center gap-4 border-b border-slate-100">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md text-white bg-gradient-to-br ${modalMode === "add" ? "from-indigo-500 to-violet-600" : "from-amber-500 to-orange-600"
                }`}>
                {modalMode === "add" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  {modalMode === "add" ? "เพิ่มผู้ใช้งานใหม่" : "แก้ไขข้อมูลผู้ใช้งาน"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {modalMode === "add" ? "กรอกรายละเอียดเพื่อสร้างผู้ใช้ใหม่" : `กำลังแก้ไขผู้ใช้: ${editingUser?.username}`}
                </p>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-full transition-all duration-200 cursor-pointer border-0 bg-transparent"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[60vh]">
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Name Input (Optional) */}
              {(role === "student" || role === "teacher") && modalMode === "add" && (
                <div className="space-y-1.5 animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล (Name)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ชื่อ นามสกุล"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ชื่อผู้ใช้ (Username) {role === "admin" && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={(role === "student" || role === "teacher") && modalMode === "add" ? "เว้นว่างเพื่อสุ่มอัตโนมัติ" : "เช่น teacher2, s002"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  รหัสผ่าน (Password) {role === "admin" && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={modalMode === "edit" ? "ปล่อยว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน" : ((role === "student" || role === "teacher") ? "เว้นว่างเพื่อใช้ค่าเริ่มต้น password123" : "รหัสผ่านสำหรับเข้าใช้งาน")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Email Input (for Google login) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  อีเมล (สำหรับเข้าสู่ระบบด้วย Google)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="เช่น user@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Role Select (Only for Add) */}
              {modalMode === "add" ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    บทบาทหน้าที่ (Role) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Student */}
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${role === "student"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-400/20"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${role === "student" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                        }`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold leading-none">นักเรียน</span>
                      <span className="text-[9px] opacity-75 mt-0.5">Student</span>
                    </button>

                    {/* Teacher */}
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${role === "teacher"
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-400/20"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${role === "teacher" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"
                        }`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 00-2-2m2 2a2 2 0 01-2 2m2 5a2 2 0 01-2 2m0-3a3 3 0 10-6 0 3 3 0 006 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold leading-none">คุณครู</span>
                      <span className="text-[9px] opacity-75 mt-0.5">Teacher</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    บทบาทหน้าที่ (Role)
                  </label>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      role === 'teacher' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${role === 'admin' ? 'bg-rose-500' :
                        role === 'teacher' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`} />
                      {role.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Student Fields */}
              {role === "student" && (
                <div className="space-y-1.5 animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    รหัสนักเรียน (Student ID)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 014 0" />
                      </svg>
                    </div>
                    <input
                      list="student-id-options"
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder={modalMode === "add" ? "เว้นว่างเพื่อสุ่มอัตโนมัติ" : "รหัสนักเรียน"}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                    />
                    <datalist id="student-id-options">
                      {students.map(s => (
                        <option key={s.id} value={s.student_id}>{s.name}</option>
                      ))}
                    </datalist>
                  </div>
                </div>
              )}

              {role === "teacher" && (
                <div className="space-y-4 animate-fade-in-up">
                  {/* Homeroom Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      ห้องประจำชั้น (Homeroom)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <select
                        value={homeroomClassroomId}
                        onChange={(e) => setHomeroomClassroomId(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-700 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none appearance-none cursor-pointer"
                      >
                        <option value="">-- ไม่มีห้องประจำชั้น --</option>
                        {classrooms.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer border-0"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveUserSubmit}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 text-sm cursor-pointer border-0"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {/* Student Detail Modal */}
      {studentDetailModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in-up"
          onClick={() => setStudentDetailModal(prev => ({ ...prev, open: false }))}
        >
          <div
            className="bg-white rounded-3xl border border-white/60 shadow-2xl glass-strong w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 flex items-center gap-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md text-white bg-gradient-to-br from-amber-500 to-orange-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-800 leading-tight truncate">{studentDetailModal.subjectName}</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {studentDetailModal.classroomName} — ครูผู้สอน: {studentDetailModal.teacherName}
                </p>
              </div>
              <button
                onClick={() => setStudentDetailModal(prev => ({ ...prev, open: false }))}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all cursor-pointer border-0 bg-transparent"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {studentDetailModal.loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                  <p className="text-gray-500 font-semibold text-sm">กำลังโหลดรายชื่อ...</p>
                </div>
              ) : studentDetailModal.students.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-semibold">ไม่มีนักเรียนในห้องนี้</div>
              ) : (() => {
                const ss = studentDetailModal.students;
                const done = ss.filter(s => s.midterm_score !== null && s.final_score !== null).length;
                const partial = ss.filter(s => (s.midterm_score !== null || s.final_score !== null) && !(s.midterm_score !== null && s.final_score !== null)).length;
                const notStarted = ss.length - done - partial;
                return (
                  <>
                    {/* Summary badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        ทั้งหมด {ss.length} คน
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ครบแล้ว {done}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        กรอกบางส่วน {partial}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        ยังไม่เริ่ม {notStarted}
                      </span>
                    </div>

                    {/* Student list */}
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-4 py-2.5 font-bold text-xs w-12">ลำดับ</th>
                            <th className="px-4 py-2.5 font-bold text-xs">ชื่อ-นามสกุล</th>
                            <th className="px-4 py-2.5 font-bold text-xs text-center">เก็บ (/{studentDetailModal.midtermMax})</th>
                            <th className="px-4 py-2.5 font-bold text-xs text-center">สอบ (/{studentDetailModal.finalMax})</th>
                            <th className="px-4 py-2.5 font-bold text-xs text-center">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {ss.map((s, idx) => {
                            const hasMid = s.midterm_score !== null;
                            const hasFin = s.final_score !== null;
                            const isDone = hasMid && hasFin;
                            const isPartial = (hasMid || hasFin) && !isDone;

                            return (
                              <tr key={s.id} className={`transition-colors ${isDone ? "bg-emerald-50/30" : isPartial ? "bg-amber-50/30" : ""}`}>
                                <td className="px-4 py-2.5 text-xs text-gray-400 font-semibold">{s.student_number || idx + 1}</td>
                                <td className="px-4 py-2.5">
                                  <div className="text-sm font-semibold text-gray-800">{s.student_name}</div>
                                  <div className="text-[10px] text-gray-400">{s.student_id}</div>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {hasMid ? (
                                    <span className="text-sm font-bold text-gray-800">{s.midterm_score}</span>
                                  ) : (
                                    <span className="text-xs text-gray-300">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {hasFin ? (
                                    <span className="text-sm font-bold text-gray-800">{s.final_score}</span>
                                  ) : (
                                    <span className="text-xs text-gray-300">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {isDone ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                      ครบ
                                    </span>
                                  ) : isPartial ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3" /></svg>
                                      บางส่วน
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-400">
                                      ยังไม่มี
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-3xl">
              <button
                onClick={() => setStudentDetailModal(prev => ({ ...prev, open: false }))}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer border-0"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-slide-up-fade">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between relative">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">
                  {subjectModalMode === "add" ? "เพิ่มวิชาเรียนใหม่" : "แก้ไขวิชาเรียน"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {(() => {
                    const s = settingsList.find(s => s.id === subjectSettingId);
                    return s ? `ปีการศึกษา ${s.academic_year} เทอม ${s.term}` : "ระบุชื่อวิชา เลือกครูผู้สอน และชั้นเรียน";
                  })()}
                </p>
              </div>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all duration-200 cursor-pointer border-0 bg-transparent"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {validationError}
                </div>
              )}

              {/* Setting Badge */}
              {subjectSettingId && (() => {
                const s = settingsList.find(s => s.id === subjectSettingId);
                return s ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-white/50">
                    <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-xs font-bold text-indigo-700">ปีการศึกษา {s.academic_year} ภาคเรียนที่ {s.term}</span>
                    {s.is_active && <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-bold">Active</span>}
                  </div>
                ) : null;
              })()}

              {/* Subject Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ชื่อวิชาเรียน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="เช่น ภาษาไทย พื้นฐาน"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                />
              </div>

              {/* Teacher Multi-Select (Scenario A: co-teaching) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ครูผู้สอน
                  <span className="ml-1.5 font-normal normal-case text-slate-400">(เลือกได้หลายคน กรณีสอนรวม)</span>
                </label>
                {users.filter(u => u.role === "teacher").length === 0 ? (
                  <div className="text-slate-400 text-xs py-2 px-3 rounded-xl border border-dashed border-slate-200">
                    ไม่มีครูในระบบ กรุณาเพิ่มผู้ใช้ที่มีบทบาทครูก่อน
                  </div>
                ) : (
                  <div className="max-h-[120px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
                    {users.filter(u => u.role === "teacher").map(u => {
                      const isChecked = subjectTeacherIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${isChecked ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setSubjectTeacherIds([...subjectTeacherIds, u.id]);
                              } else {
                                setSubjectTeacherIds(subjectTeacherIds.filter(id => id !== u.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span className={`text-sm font-semibold ${isChecked ? "text-indigo-700" : "text-slate-700"}`}>
                            {u.username}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {subjectTeacherIds.length > 1 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-xs font-bold text-blue-700">สอนรวม:</span>
                    <span className="text-xs text-blue-600">
                      {subjectTeacherIds.map(id => users.find(u => u.id === id)?.username).filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Subject Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ประเภทวิชา
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubjectType("main")}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${subjectType === "main"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-slate-50/50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    วิชาหลัก
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectType("activity")}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${subjectType === "activity"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-slate-50/50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    วิชากิจกรรม
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {subjectType === "main"
                    ? "นับหน่วยกิตและคำนวณเกรด A-F เข้า GPA"
                    : "ตัดสินผ่าน/ไม่ผ่าน ไม่นับ GPA"}
                </p>
              </div>

              {/* Has Score Toggle (activity only) */}
              {subjectType === "activity" && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setSubjectHasScore(v => !v)}
                    className={`relative shrink-0 w-10 h-5 rounded-full border-2 transition-all ${subjectHasScore ? "bg-amber-500 border-amber-500" : "bg-slate-200 border-slate-300"}`}
                  >
                    <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${subjectHasScore ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                  <div>
                    <div className="text-xs font-bold text-amber-800">มีการเก็บคะแนน</div>
                    <div className="text-[11px] text-amber-600 mt-0.5">
                      {subjectHasScore
                        ? "กำหนดคะแนนเต็มด้านล่าง · ใช้คะแนนรวมตัดสิน ผ่าน/ไม่ผ่าน"
                        : "ไม่มีช่องกรอกคะแนน · ผ่าน/ไม่ผ่านโดยไม่ใช้คะแนน"}
                    </div>
                  </div>
                </div>
              )}

              {/* Credit Hours (main subjects only) */}
              {subjectType === "main" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    หน่วยกิต <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={subjectCreditHours}
                    onChange={(e) => setSubjectCreditHours(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                  />
                </div>
              )}

              {/* Max Scores Input */}
              {(subjectType !== "activity" || subjectHasScore) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      คะแนนเก็บเต็ม <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={subjectMidtermMax}
                      onChange={(e) => setSubjectMidtermMax(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      คะแนนสอบเต็ม <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={subjectFinalMax}
                      onChange={(e) => setSubjectFinalMax(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Classroom Multi-Select (filtered by subject setting) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ชั้นเรียน (เลือกได้หลายห้อง)
                </label>
                {subjectClassrooms.length === 0 ? (
                  <div className="text-slate-400 text-xs py-2">ไม่มีชั้นเรียนในเทอมนี้ กรุณาเพิ่มที่เมนู จัดการชั้นเรียน</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-1 max-h-[150px] overflow-y-auto pr-1">
                    {subjectClassrooms.map((c) => {
                      const isChecked = subjectClassroomIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 px-3 py-2 border border-slate-100 rounded-xl bg-slate-50/30 hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSubjectClassroomIds([...subjectClassroomIds, c.id]);
                              } else {
                                setSubjectClassroomIds(subjectClassroomIds.filter(id => id !== c.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer border-0"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveSubjectSubmit}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 text-sm cursor-pointer border-0"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
      {adminUser && <ChatWidget userId={adminUser.id} userRole="admin" />}
    </div>
  );
}
