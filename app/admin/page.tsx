"use client";

import { useEffect, useState, useRef, type ReactNode, useMemo } from "react";
import { useAuth } from "../lib/useAuth";
import * as XLSX from "xlsx";

interface DBUser {
  id: string; firebase_uid: string; username: string;
  role: "admin" | "teacher" | "student";
  student_id?: string; homeroom_classroom_id?: string; subjects?: string[];
}
interface DBStudent { id: string; name: string; student_id: string; classroom_id: string; student_number?: number | null; }
interface DBSubject { id: string; name: string; teacher_id?: string; teacher_name?: string; classroom_ids?: string[]; classroom_names?: string[]; setting_id?: number | null; midterm_max_score?: number | null; final_max_score?: number | null; subject_type?: "main" | "activity"; credit_hours?: number | null; score_display_mode?: "separate" | "combined"; }
interface SchedulePeriod { id: string; setting_id: number | string; period_no: number | string; start_time: string; end_time: string; label?: string | null; is_break?: boolean; }
interface ScheduleEntry {
  id: string; classroom_id: string; classroom_name: string;
  subject_id: string; subject_name: string; teacher_id: string | null; teacher_name: string | null;
  day_of_week: number | string; period_id: string; period_no: number | string; start_time: string; end_time: string; label?: string | null;
}
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { formatThaiDate, formatThaiDateRange } from "../lib/format";

type Tab = "dashboard" | "users" | "classrooms" | "students" | "settings" | "subjects" | "schedule";

const ALL_DAYS = [
  { value: 1, label: "จันทร์" },
  { value: 2, label: "อังคาร" },
  { value: 3, label: "พุธ" },
  { value: 4, label: "พฤหัสบดี" },
  { value: 5, label: "ศุกร์" },
  { value: 6, label: "เสาร์" },
  { value: 0, label: "อาทิตย์" },
];

const NAV_ITEMS: { key: Tab; label: string; sub: string; icon: string }[] = [
  { key: "dashboard", label: "แดชบอร์ด", sub: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" },
  { key: "users", label: "จัดการผู้ใช้งาน", sub: "Users", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { key: "classrooms", label: "จัดการชั้นเรียน", sub: "Classrooms", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16M9 7h1m4 0h1m-6 4h1m4 0h1m-5 9v-4a1 1 0 011-1h1a1 1 0 011 1v4" },
  { key: "students", label: "จัดการนักเรียน", sub: "Students", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
  { key: "subjects", label: "จัดการวิชาเรียน", sub: "Subjects", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { key: "schedule", label: "ตารางเรียน", sub: "Schedule", icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${STAT_COLOR_MAP[color]}`}>
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
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${STAT_COLOR_MAP[color]}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            {count !== undefined && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                {count}{countLabel ? ` ${countLabel}` : ""}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
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
      <div className="mb-6 px-4 py-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        ยังไม่มีปีการศึกษาในระบบ กรุณาเพิ่มที่แท็บ ตั้งค่าระบบ
      </div>
    );
  }
  return (
    <div className="mb-6 p-3 rounded-2xl border border-gray-100 bg-gray-50/70">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">เลือกปีการศึกษา / เทอม</div>
      <div className="flex flex-wrap gap-2">
        {settingsList.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${selectedId === s.id
              ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
              : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
              }`}
          >
            ปี {s.academic_year} เทอม {s.term}
            {s.is_active && (
              <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">Active</span>
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
      className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/40 transition-all text-left cursor-pointer group"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
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
  const usersPerPage = 10;

  useEffect(() => {
    setUserCurrentPage(1);
  }, [userSubTab]);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const classroomFileInputRef = useRef<HTMLInputElement>(null);
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
  const [validationError, setValidationError] = useState("");

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectModalMode, setSubjectModalMode] = useState<"add" | "edit">("add");
  const [editingSubject, setEditingSubject] = useState<DBSubject | null>(null);

  // Subject Form State
  const [subjectName, setSubjectName] = useState("");
  const [subjectTeacherId, setSubjectTeacherId] = useState("");
  const [subjectClassroomIds, setSubjectClassroomIds] = useState<string[]>([]);
  const [subjectSettingId, setSubjectSettingId] = useState<number | null>(null);
  const [subjectMidtermMax, setSubjectMidtermMax] = useState<number>(50);
  const [subjectFinalMax, setSubjectFinalMax] = useState<number>(50);
  const [subjectType, setSubjectType] = useState<"main" | "activity">("main");
  const [subjectCreditHours, setSubjectCreditHours] = useState<number>(1);

  // Schedule State
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [scheduleClassroomId, setScheduleClassroomId] = useState("");

  // Assign Students State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetClassroom, setTargetClassroom] = useState<{ id: string; name: string } | null>(null);
  const [selectedStudentsForAssign, setSelectedStudentsForAssign] = useState<string[]>([]);
  const [searchAssignStudent, setSearchAssignStudent] = useState("");
  const [studentFilterClassroomId, setStudentFilterClassroomId] = useState<string>("all");
  const filteredStudents = useMemo(() => {
    if (studentFilterClassroomId === "all") return students;
    if (studentFilterClassroomId === "unassigned") return students.filter(s => !s.classroom_id);
    return students.filter(s => s.classroom_id === studentFilterClassroomId);
  }, [students, studentFilterClassroomId]);

  // Copy Classrooms State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceSettingId, setCopySourceSettingId] = useState<string | number | null>(null);
  const [copyTargetSettingId, setCopyTargetSettingId] = useState<string | number | null>(null);
  const [sourceClassrooms, setSourceClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [copyClassroomsMap, setCopyClassroomsMap] = useState<Record<string, { selected: boolean; newName: string; moveStudents: boolean }>>({});

  useEffect(() => {
    setIsClient(true);
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
        popup: "rounded-3xl border border-indigo-100 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
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
        popup: "rounded-3xl border border-indigo-100 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
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
        popup: "rounded-3xl border border-indigo-100 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
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
        popup: "rounded-3xl border border-indigo-100 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
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
    setSubjectTeacherId("");
    setSubjectClassroomIds([]);
    setSubjectSettingId(selectedSubjectSettingId);
    setSubjectMidtermMax(50);
    setSubjectFinalMax(50);
    setSubjectType("main");
    setSubjectCreditHours(1);
    setValidationError("");
    setIsSubjectModalOpen(true);
  };

  const handleEditSubject = (subject: DBSubject) => {
    setSubjectModalMode("edit");
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setSubjectTeacherId(subject.teacher_id || "");
    setSubjectClassroomIds(subject.classroom_ids || []);
    setSubjectSettingId(subject.setting_id ?? selectedSubjectSettingId);
    setSubjectMidtermMax(subject.midterm_max_score ?? 50);
    setSubjectFinalMax(subject.final_max_score ?? 50);
    setSubjectType(subject.subject_type ?? "main");
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
      teacher_id: subjectTeacherId === "none" ? null : (subjectTeacherId || null),
      classroom_ids: subjectClassroomIds,
      setting_id: subjectSettingId || null,
      midterm_max_score: subjectMidtermMax,
      final_max_score: subjectFinalMax,
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
      body: JSON.stringify({ period_no: Number(period.period_no), start_time: period.start_time, end_time: period.end_time, label: period.label || null }),
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

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ setting_id: selectedSubjectSettingId, classroom_id: scheduleClassroomId, subject_id: subjectId, day_of_week: day, period_id: periodId }),
    });
    if (!res.ok) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", confirmButtonColor: "#4f46e5" });
      return;
    }
    const saved = await res.json();
    const subj = subjectsList.find(s => s.id === subjectId);
    const period = schedulePeriods.find(p => p.id === periodId);
    const classroom = subjectClassrooms.find(c => c.id === scheduleClassroomId);
    const newEntry: ScheduleEntry = {
      id: saved.id,
      classroom_id: scheduleClassroomId,
      classroom_name: classroom?.name || "",
      subject_id: subjectId,
      subject_name: subj?.name || "",
      teacher_id: subj?.teacher_id || null,
      teacher_name: subj?.teacher_name || null,
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

  const handleEditUser = (user: DBUser) => {
    setModalMode("edit");
    setEditingUser(user);
    setUsername(user.username);
    setPassword("");
    setRole(user.role);
    setStudentId(user.student_id || "");
    setHomeroomClassroomId(user.homeroom_classroom_id || "");
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-indigo-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 bg-white">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-none">ระบบแอดมิน</h1>
              <p className="text-xs text-gray-500">จัดการโครงสร้างระบบและผู้ใช้งาน</p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-gray-700">สวัสดี, {adminUser?.username || "ผู้ดูแลระบบ"} 👋</span>
            <span className="text-xs text-gray-400">{formatThaiDate(new Date().toISOString())}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="space-y-1.5">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all ${activeTab === item.key ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-100"
                  }`}
              >
                <svg className={`w-5 h-5 shrink-0 ${activeTab === item.key ? "text-white" : "text-indigo-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </button>
            ))}

            {/* Active term summary */}
            <div className="hidden md:block mt-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ปีการศึกษาปัจจุบัน</div>
              <div className="text-sm font-extrabold text-gray-800">ปีการศึกษา {adminYear}</div>
              <div className="text-xs text-indigo-600 font-semibold mb-3">ภาคเรียนที่ {adminTerm}</div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isGradingActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                {isGradingActive ? "เปิดกรอกคะแนน" : "ปิดกรอกคะแนน"}
              </span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 bg-white rounded-3xl shadow-md border border-indigo-100 overflow-hidden min-h-[500px]">
            {activeTab === "dashboard" && (
              <div className="p-8 animate-fade-in-up">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800">แดชบอร์ดภาพรวม</h2>
                  <p className="text-gray-500 text-sm">สรุปข้อมูลสำคัญของระบบ ประจำปีการศึกษา {adminYear} ภาคเรียนที่ {adminTerm}</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
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
                  <div className="lg:col-span-1 rounded-3xl p-6 bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-200 flex flex-col justify-between">
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
                  <button onClick={handleAddUser} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer">
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
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
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
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
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
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
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
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
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
                    <thead className="bg-gray-50 text-gray-600">
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
                    <div key={u.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
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
                {totalUserPages > 1 && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-sm font-medium text-gray-500">
                      แสดง {(userCurrentPage - 1) * usersPerPage + 1} ถึง {Math.min(userCurrentPage * usersPerPage, filteredUsers.length)} จากทั้งหมด {filteredUsers.length} รายการ
                    </div>
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
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
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
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
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
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
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
                          className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-md cursor-pointer flex items-center gap-2"
                        >
                          บันทึก ({selectedStudentsForAssign.length})
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Copy Classrooms Modal */}
                {isCopyModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
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
                          className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-md cursor-pointer flex items-center gap-2"
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
                {/* Desktop: Table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 animate-fade-in-up">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600">
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
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
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
                    <div key={s.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
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
                          <span className="inline-block mt-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
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
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
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
                        <thead className="bg-gray-50 text-gray-600">
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
                              <td className="px-6 py-4 text-sm text-gray-600">{sub.teacher_name || "-"}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{sub.classroom_names && sub.classroom_names.length > 0 ? sub.classroom_names.join(", ") : "-"}</td>
                              <td className="px-6 py-4 text-center">
                                {sub.subject_type === "activity" ? (
                                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    วิชากิจกรรม
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
                                {sub.midterm_max_score ?? 50} / {sub.final_max_score ?? 50}
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
                        <div key={sub.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
                          <div className="font-semibold text-gray-800">{sub.name}</div>
                          <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                            <div><span className="font-medium">ครูผู้สอน:</span> {sub.teacher_name || "-"}</div>
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
                          <thead className="bg-gray-50 text-gray-600">
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
                        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        เพิ่มคาบเรียน
                      </button>
                    </div>

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
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600">
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
                                        return (
                                          <td key={d.value} className="px-3 py-2 align-top">
                                            <select
                                              value={entry?.subject_id ?? ""}
                                              onChange={ev => handleScheduleCellChange(d.value, p.id, ev.target.value, entry?.id)}
                                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-400 outline-none"
                                            >
                                              <option value="">- ว่าง -</option>
                                              {subjectsForClassroom.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}{s.teacher_name ? ` (${s.teacher_name})` : ""}</option>
                                              ))}
                                            </select>
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

            {activeTab === "settings" && (
              <div className="p-8 animate-fade-in-up">
                <SectionHeader
                  icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  color="slate"
                  title="ตั้งค่าระบบ"
                  subtitle="กำหนดปีการศึกษา เทอม และช่วงเวลาการบันทึกคะแนนในระบบทั้งหมด"
                  count={settingsList.length}
                  countLabel="ปีการศึกษา"
                >
                  <button
                    onClick={handleAddSetting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
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
                      <thead className="bg-gray-50 text-gray-600">
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
                          <div key={s.id} className={`rounded-2xl border border-gray-100 bg-white shadow-sm p-4 ${s.is_active ? 'bg-indigo-50/20' : ''}`}>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in-up"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-indigo-50 shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 flex flex-col"
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
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
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
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
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

              {/* Teacher Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ครูผู้สอน
                </label>
                <select
                  value={subjectTeacherId}
                  onChange={(e) => setSubjectTeacherId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-700 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  <option value="">-- เลือกครูผู้สอน --</option>
                  <option value="none">ไม่มีผู้สอน (ไม่มีผู้ใช้)</option>
                  {users.filter(u => u.role === "teacher").map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
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
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-slate-50/50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    วิชาหลัก
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectType("activity")}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${subjectType === "activity"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-slate-50/50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    วิชากิจกรรม
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {subjectType === "main"
                    ? "นับหน่วยกิตและคำนวณเกรด A-F เข้า GPA"
                    : "ตัดสินผ่าน/ไม่ผ่าน ไม่นับ GPA — ครูเลือกรูปแบบกรอกคะแนนเองได้"}
                </p>
              </div>

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
    </div>
  );
}
