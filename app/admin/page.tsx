"use client";

import { useEffect, useState, useRef, type ReactNode, useMemo } from "react";
import { useAuth } from "../lib/useAuth";
import * as XLSX from "xlsx";
import ChatWidget from "../components/ChatWidget";
import ThemeToggle from "../components/ThemeToggle";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { formatThaiDate } from "../lib/format";

import {
  DBUser,
  DBStudent,
  DBSubject,
  DBGrade,
  SchedulePeriod,
  ScheduleEntry,
  Tab,
  RankingRow,
  GradeStatusRow,
  SystemSetting,
  ALL_DAYS,
  TEACHER_PALETTE,
} from "./components/types";
import CopySubjectsModal from "./components/modals/CopySubjectsModal";
import ExportScoreModal from "./components/modals/ExportScoreModal";
import UserModal from "./components/modals/UserModal";
import SubjectModal from "./components/modals/SubjectModal";
import StudentDetailModal from "./components/modals/StudentDetailModal";
import SubjectsTab from "./components/tabs/SubjectsTab";
import StudentsTab from "./components/tabs/StudentsTab";
import ClassroomsTab from "./components/tabs/ClassroomsTab";
import UsersTab from "./components/tabs/UsersTab";
import ScheduleTab from "./components/tabs/ScheduleTab";
import GradeStatusTab from "./components/tabs/GradeStatusTab";
import StudentScoresTab from "./components/tabs/StudentScoresTab";
import RankingsTab from "./components/tabs/RankingsTab";
import YearlyAverageTab from "./components/tabs/YearlyAverageTab";
import SettingsTab from "./components/tabs/SettingsTab";
import DashboardTab from "./components/tabs/DashboardTab";

const NAV_ITEMS: { key: Tab; label: string; sub: string; icon: string }[] = [
  { key: "dashboard", label: "แดชบอร์ด", sub: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" },
  { key: "users", label: "จัดการผู้ใช้งาน", sub: "Users", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { key: "classrooms", label: "จัดการชั้นเรียน", sub: "Classrooms", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16M9 7h1m4 0h1m-6 4h1m4 0h1m-5 9v-4a1 1 0 011-1h1a1 1 0 011 1v4" },
  { key: "students", label: "จัดการนักเรียน", sub: "Students", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
  { key: "subjects", label: "จัดการวิชาเรียน", sub: "Subjects", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { key: "schedule", label: "ตารางเรียน", sub: "Schedule", icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "grade-status", label: "สถานะคะแนน", sub: "Grade Status", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { key: "student-scores", label: "ดูคะแนนนักเรียน", sub: "Student Scores", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
  { key: "rankings", label: "อันดับผลการเรียน", sub: "Rankings", icon: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" },
  { key: "yearly-average", label: "เฉลี่ยรวมทั้งปี", sub: "Yearly Average", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "settings", label: "ตั้งค่าระบบ", sub: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];



function getScoreExportText(key: string, lang: "th" | "ms-rumi" | "ms-jawi") {
  const dict: Record<string, { th: string; rumi: string; jawi: string }> = {
    "รายงานสรุปผลการเรียนประจำชั้นเรียน": {
      th: "รายงานสรุปผลการเรียนประจำชั้นเรียน",
      rumi: "Laporan Keputusan Peperiksaan Mengikut Kelas",
      jawi: "لاڤورن كڤوتوسن ڤڤريقسان مڠيكوت كلس"
    },
    "ใบรายงานผลการเรียนรายบุคคล": {
      th: "ใบรายงานผลการเรียนรายบุคคล",
      rumi: "Slip Keputusan Peperiksaan Individu",
      jawi: "سليڤ كڤوتوسن ڤڤريقسان اينديويدو"
    },
    "ชั้นเรียน": { th: "ชั้นเรียน", rumi: "Kelas", jawi: "كلس" },
    "ชั้น": { th: "ชั้น", rumi: "Kelas", jawi: "كلس" },
    "ปีการศึกษา": { th: "ปีการศึกษา", rumi: "Tahun Pengajian", jawi: "تاهون ڤڠاجين" },
    "ภาคเรียนที่": { th: "ภาคเรียนที่", rumi: "Penggal", jawi: "ڤڠگل" },
    "จำนวนนักเรียนทั้งหมด:": { th: "จำนวนนักเรียนทั้งหมด:", rumi: "Jumlah Murid:", jawi: "جومله موريد:" },
    "คน": { th: "คน", rumi: "orang", jawi: "اورڠ" },
    "จำนวนวิชาที่ส่งออก:": { th: "จำนวนวิชาที่ส่งออก:", rumi: "Jumlah Subjek:", jawi: "جومله سوبجيك:" },
    "วิชา": { th: "วิชา", rumi: "subjek", jawi: "سوبجيك" },
    "วันที่ออกรายงาน:": { th: "วันที่ออกรายงาน:", rumi: "Tarikh Dikeluarkan:", jawi: "تاريخ دكلواركن:" },
    "ลำดับ": { th: "ลำดับ", rumi: "Bil.", jawi: "بيل." },
    "รหัสประจำตัว": { th: "รหัสประจำตัว", rumi: "No. ID", jawi: "نومبور اءي-دي" },
    "ชื่อ - นามสกุล": { th: "ชื่อ - นามสกุล", rumi: "Nama Murid", jawi: "نام موريد" },
    "เลขที่": { th: "เลขที่", rumi: "No.", jawi: "نومبور" },
    "ประเภท": { th: "ประเภท", rumi: "Kategori", jawi: "كاتڬوري" },
    "หน่วยกิต": { th: "หน่วยกิต", rumi: "Jam Kredit", jawi: "جام ك ريديت" },
    "นก.": { th: "นก.", rumi: "kredit", jawi: "ك ريديت" },
    "คะแนนเก็บ": { th: "คะแนนเก็บ", rumi: "Kerja Kursus", jawi: "كرج كورسوس" },
    "คะแนนสอบ": { th: "คะแนนสอบ", rumi: "Peperiksaan", jawi: "ڤڤريقسان" },
    "คะแนนรวม": { th: "คะแนนรวม", rumi: "Jumlah Markah", jawi: "جومله مركه" },
    "รวมคะแนน": { th: "รวมคะแนน", rumi: "Jumlah Markah", jawi: "جومله مركه" },
    "เกรด": { th: "เกรด", rumi: "Gred", jawi: "ڬريد" },
    "เฉลี่ย %": { th: "เฉลี่ย %", rumi: "Peratus %", jawi: "ڤراتوس %" },
    "เกรดเฉลี่ย (GPA)": { th: "เกรดเฉลี่ย (GPA)", rumi: "Purata Gred (GPA)", jawi: "ڤوراتا ڬريد (GPA)" },
    "GPA": { th: "GPA", rumi: "GPA", jawi: "GPA" },
    "อันดับ": { th: "อันดับ", rumi: "Kedudukan", jawi: "كدودوقن" },
    "อันดับในห้องเรียน": { th: "อันดับในห้องเรียน", rumi: "Kedudukan Dalam Kelas", jawi: "كدودوقن دالم كلس" },
    "อันดับที่": { th: "อันดับที่", rumi: "Ke-", jawi: "ك-" },
    "วิชาหลัก": { th: "วิชาหลัก", rumi: "Subjek Teras", jawi: "سوبجيك ت رس" },
    "กิจกรรม": { th: "กิจกรรม", rumi: "Aktiviti", jawi: "اكتيۏيتي" },
    "ผ.": { th: "ผ.", rumi: "L", jawi: "ل" },
    "มผ.": { th: "มผ.", rumi: "G", jawi: "ڬ" },
    "ผ่าน": { th: "ผ่าน", rumi: "Lulus", jawi: "لولوس" },
    "ไม่ผ่าน": { th: "ไม่ผ่าน", rumi: "Gagal", jawi: "ڬاڬل" },
    "คะแนนรวมวิชาหลัก": { th: "คะแนนรวมวิชาหลัก", rumi: "Jumlah Markah Teras", jawi: "جومله مركه ت رس" },
    "คะแนนรวมทั้งหมด": {
      th: "คะแนนรวมทั้งหมด",
      rumi: "Jumlah Keseluruhan",
      jawi: "جومله كسولوروهن"
    },
    "คิดเป็นร้อยละ": { th: "คิดเป็นร้อยละ", rumi: "Peratusan", jawi: "ڤراتوسن" },
    "ครูประจำชั้น": { th: "ครูประจำชั้น", rumi: "Guru Kelas", jawi: "ڬورو كلس" },
    "หัวหน้าฝ่ายวิชาการ / ผู้อำนวยการ": {
      th: "หัวหน้าฝ่ายวิชาการ / ผู้อำนวยการ",
      rumi: "Guru Penolong Kanan / Pengetua",
      jawi: "ڬورو ڤنولوڠ كنان / ڤڠتوا"
    },
    "พิมพ์ / บันทึก PDF": { th: "พิมพ์ / บันทึก PDF", rumi: "Cetak / Simpan PDF", jawi: "چيتق / سيمڤن PDF" }
  };

  if (lang === "ms-rumi") return dict[key]?.rumi || key;
  if (lang === "ms-jawi") return dict[key]?.jawi || key;
  return dict[key]?.th || key;
}



function LoadingScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-5 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-60" />
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-border" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      </div>
      <div className="text-center relative z-10">
        <p className="text-foreground font-extrabold text-lg">{title}</p>
        {subtitle && <p className="text-muted-foreground text-sm mt-1.5 font-medium">{subtitle}</p>}
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
  const { user: adminUser, loading, logout, token, update } = useAuth();
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

  // Student Scores State
  const [scoresSettingId, setScoresSettingId] = useState<number | null>(null);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresStudents, setScoresStudents] = useState<DBStudent[]>([]);
  const [scoresSubjects, setScoresSubjects] = useState<DBSubject[]>([]);
  const [scoresGrades, setScoresGrades] = useState<DBGrade[]>([]);
  const [scoresClassrooms, setScoresClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [scoresViewMode, setScoresViewMode] = useState<"classroom" | "individual">("classroom");
  const [scoresClassroomId, setScoresClassroomId] = useState<string>("");
  const [scoresSelectedStudentId, setScoresSelectedStudentId] = useState<string>("");

  // Yearly Average State
  const [yearlyAvgData, setYearlyAvgData] = useState<RankingRow[]>([]);
  const [yearlyAvgSettingId, setYearlyAvgSettingId] = useState<number | null>(null);
  const [yearlyAvgLoading, setYearlyAvgLoading] = useState(false);
  const [yearlyAvgAvailable, setYearlyAvgAvailable] = useState(false);
  const [yearlyAvgReason, setYearlyAvgReason] = useState("");
  const [yearlyAvgClassroomFilter, setYearlyAvgClassroomFilter] = useState<string>("all");

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

  // Copy Subjects State
  const [isCopySubjectsModalOpen, setIsCopySubjectsModalOpen] = useState(false);
  const [copySubjectsSourceId, setCopySubjectsSourceId] = useState<string | number | null>(null);
  const [copySubjectsTargetId, setCopySubjectsTargetId] = useState<string | number | null>(null);
  const [sourceSubjects, setSourceSubjects] = useState<DBSubject[]>([]);
  const [copySubjectsSelected, setCopySubjectsSelected] = useState<Record<string, boolean>>({});

  // Export Classroom & Individual Scores State
  const [isExportScoreModalOpen, setIsExportScoreModalOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"classroom" | "individual">("classroom");
  const [exportSettingId, setExportSettingId] = useState<number | null>(null);
  const [exportClassroomId, setExportClassroomId] = useState<string>("");
  const [exportStudentId, setExportStudentId] = useState<string>("all");
  const [includeActivitySubjects, setIncludeActivitySubjects] = useState<boolean>(false);
  const [exportSumActivityScores, setExportSumActivityScores] = useState<boolean>(false);
  const [exportSubjectList, setExportSubjectList] = useState<DBSubject[]>([]);
  const [exportSelectedSubjectIds, setExportSelectedSubjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (!includeActivitySubjects) {
      setExportSumActivityScores(false);
    }
  }, [includeActivitySubjects]);

  useEffect(() => {
    if (!exportSettingId || !exportClassroomId) {
      setExportSubjectList([]);
      setExportSelectedSubjectIds([]);
      return;
    }
    const subjs = subjectsList.filter(s => {
      const isForClass = s.classroom_ids?.includes(exportClassroomId);
      if (!isForClass) return false;
      const hasScores = (Number(s.midterm_max_score) || 0) + (Number(s.final_max_score) || 0) > 0;
      if (!hasScores) return false;
      if (!includeActivitySubjects && s.subject_type === "activity") return false;
      return true;
    });
    setExportSubjectList(subjs);
    setExportSelectedSubjectIds(subjs.map(s => s.id));
  }, [exportSettingId, exportClassroomId, includeActivitySubjects, subjectsList]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // จัดการผลลัพธ์จากการเชื่อมต่อบัญชี
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("linked");
    const linkError = params.get("linkError");

    if (linked) {
      window.history.replaceState({}, "", "/admin");
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
      window.history.replaceState({}, "", "/admin");
      Swal.fire("ข้อผิดพลาด", linkError, "error");
    }
  }, [update]);

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
    if (selectedSettingId) {
      loadStudents(selectedSettingId, authToken);
    }
    if (selectedSubjectSettingId) {
      loadSubjects(selectedSubjectSettingId, authToken);
    }
  };

  // นักเรียนต้องโหลดตามเทอม (selectedSettingId) เพราะห้องเรียน/การลงทะเบียนของนักเรียนแยกกันตามเทอม
  const loadStudents = (settingId: number, authToken: string) => {
    fetch(`/api/students?settingId=${settingId}`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(setStudents);
  };

  useEffect(() => {
    if (selectedSettingId && token) {
      loadStudents(selectedSettingId, token);
    }
  }, [selectedSettingId, token]);

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

  const loadStudentScores = async (settingId: number, authToken: string) => {
    setScoresLoading(true);
    try {
      const setting = settingsList.find(s => s.id === settingId);
      const termKey = setting ? `${setting.term}/${setting.academic_year}` : "";
      const [studentsRes, subjectsRes, classroomsRes, gradesRes] = await Promise.all([
        fetch(`/api/students?settingId=${settingId}`, { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(`/api/subjects?settingId=${settingId}`, { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(`/api/classrooms?settingId=${settingId}`, { headers: { Authorization: `Bearer ${authToken}` } }),
        termKey
          ? fetch(`/api/grades?term=${encodeURIComponent(termKey)}`, { headers: { Authorization: `Bearer ${authToken}` } })
          : Promise.resolve(null),
      ]);
      setScoresStudents(studentsRes.ok ? await studentsRes.json() : []);
      setScoresSubjects(subjectsRes.ok ? await subjectsRes.json() : []);
      setScoresClassrooms(classroomsRes.ok ? await classroomsRes.json() : []);
      setScoresGrades(gradesRes && gradesRes.ok ? await gradesRes.json() : []);
    } finally {
      setScoresLoading(false);
    }
  };

  const handleSelectScoresSetting = (settingId: number) => {
    setScoresSettingId(settingId);
    setScoresClassroomId("");
    setScoresSelectedStudentId("");
    if (token) loadStudentScores(settingId, token);
  };

  const loadYearlyAverage = async (settingId: number, authToken: string) => {
    setYearlyAvgLoading(true);
    try {
      const checkRes = await fetch(`/api/grades/rankings/check-combined?settingId=${settingId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const checkData = await checkRes.json();
      const available = checkData.combined_available === true;
      setYearlyAvgAvailable(available);
      setYearlyAvgReason(checkData.reason || "");
      if (available) {
        const res = await fetch(`/api/grades/rankings?settingId=${settingId}&mode=combined`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setYearlyAvgData(res.ok ? await res.json() : []);
      } else {
        setYearlyAvgData([]);
      }
    } finally {
      setYearlyAvgLoading(false);
    }
  };

  const handleSelectYearlyAvgSetting = (settingId: number) => {
    setYearlyAvgSettingId(settingId);
    setYearlyAvgClassroomFilter("all");
    if (token) loadYearlyAverage(settingId, token);
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
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ปีการศึกษา <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-year" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm" placeholder="เช่น 2569">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">เทอม <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-term" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm" placeholder="เช่น 1 หรือ 2">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">วันเริ่มต้นภาคเรียน <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-start-date" type="date" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">วันสิ้นสุดภาคเรียน <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-end-date" type="date" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">คะแนนเก็บเต็ม <span class="text-red-500 dark:text-red-400">*</span></label>
              <input id="swal-midterm-max" type="number" min="1" value="50" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">คะแนนสอบเต็ม <span class="text-red-500 dark:text-red-400">*</span></label>
              <input id="swal-final-max" type="number" min="1" value="50" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm">
            </div>
          </div>
          <div class="mt-2">
            <label class="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">วันที่มีการเรียนการสอน</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="1" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" checked> จันทร์</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="2" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" checked> อังคาร</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="3" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" checked> พุธ</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="4" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" checked> พฤหัสบดี</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="5" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" checked> ศุกร์</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="6" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border"> เสาร์</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="0" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border"> อาทิตย์</label>
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
        popup: "rounded-3xl border border-border/50 p-8 shadow-xl bg-card max-w-md w-full",
        title: "text-2xl font-extrabold text-foreground mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-muted hover:bg-muted text-muted-foreground font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
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
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ปีการศึกษา <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-year" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm" value="${setting.academic_year}">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">เทอม <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-term" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm" value="${setting.term}">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">วันเริ่มต้นภาคเรียน <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-start-date" type="date" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm" value="${setting.start_date || ''}">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">วันสิ้นสุดภาคเรียน <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-end-date" type="date" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm" value="${setting.end_date || ''}">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">คะแนนเก็บเต็ม <span class="text-red-500 dark:text-red-400">*</span></label>
              <input id="swal-midterm-max" type="number" min="1" value="${setting.midterm_max_score ?? 50}" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">คะแนนสอบเต็ม <span class="text-red-500 dark:text-red-400">*</span></label>
              <input id="swal-final-max" type="number" min="1" value="${setting.final_max_score ?? 50}" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm">
            </div>
          </div>
          <div class="mt-2">
            <label class="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">วันที่มีการเรียนการสอน</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="1" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" ${isChecked(1)}> จันทร์</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="2" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" ${isChecked(2)}> อังคาร</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="3" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" ${isChecked(3)}> พุธ</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="4" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" ${isChecked(4)}> พฤหัสบดี</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="5" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" ${isChecked(5)}> ศุกร์</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="6" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" ${isChecked(6)}> เสาร์</label>
              <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" value="0" class="swal-day-checkbox w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border" ${isChecked(0)}> อาทิตย์</label>
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
        popup: "rounded-3xl border border-border/50 p-8 shadow-xl bg-card max-w-md w-full",
        title: "text-2xl font-extrabold text-foreground mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-muted hover:bg-muted text-muted-foreground font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
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
        body: JSON.stringify({ student_id: student.student_id, name: student.name, classroom_id: null, setting_id: selectedSettingId }),
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



  const handleOpenCopySubjectsModal = () => {
    setCopySubjectsSourceId(null);
    setCopySubjectsTargetId(null);
    setSourceSubjects([]);
    setCopySubjectsSelected({});
    setIsCopySubjectsModalOpen(true);
  };

  useEffect(() => {
    if (isCopySubjectsModalOpen && copySubjectsSourceId) {
      fetch(`/api/subjects?settingId=${copySubjectsSourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then((data: DBSubject[]) => {
          setSourceSubjects(data);
          const sel: Record<string, boolean> = {};
          data.forEach(s => { sel[s.id] = true; });
          setCopySubjectsSelected(sel);
        })
        .catch(err => console.error("Failed to load source subjects", err));
    } else {
      setSourceSubjects([]);
      setCopySubjectsSelected({});
    }
  }, [isCopySubjectsModalOpen, copySubjectsSourceId, token]);

  const handleSaveCopySubjects = async () => {
    if (!copySubjectsTargetId) {
      Swal.fire("ข้อผิดพลาด", "กรุณาเลือกเทอร์ปลายทาง", "warning");
      return;
    }
    const selected = sourceSubjects.filter(s => copySubjectsSelected[s.id]);
    if (selected.length === 0) {
      Swal.fire("ข้อผิดพลาด", "กรุณาเลือกวิชาอย่างน้อย 1 วิชา", "warning");
      return;
    }
    const res = await fetch("/api/subjects/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        source_setting_id: copySubjectsSourceId,
        target_setting_id: copySubjectsTargetId,
        subjects: selected.map(s => ({
          name: s.name,
          teacher_ids: s.teacher_ids || (s.teacher_id ? [s.teacher_id] : []),
          classroom_ids: s.classroom_ids || [],
          midterm_max_score: s.midterm_max_score,
          final_max_score: s.final_max_score,
          subject_type: s.subject_type,
          credit_hours: s.credit_hours,
          score_display_mode: s.score_display_mode,
        }))
      })
    });
    if (res.ok) {
      const data = await res.json();
      Swal.fire("สำเร็จ", `คัดลอกวิชาเรียน ${data.created} วิชาเรียบร้อยแล้ว`, "success");
      setIsCopySubjectsModalOpen(false);
      if (token && copySubjectsTargetId?.toString() === selectedSubjectSettingId?.toString()) {
        const refreshed = await fetch(`/api/subjects?settingId=${selectedSubjectSettingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshed.ok) setSubjectsList(await refreshed.json());
      }
    } else {
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถคัดลอกวิชาเรียนได้", "error");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/");
  };

  const handleConnectGoogle = async () => {
    if (adminUser?.email) {
      const result = await Swal.fire({
        title: "การเชื่อมต่อบัญชีโซเชียล",
        text: `คุณเชื่อมต่อบัญชีด้วยอีเมล ${adminUser.email} อยู่ในขณะนี้`,
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
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">รหัสนักเรียน (Student ID) <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-student-id" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm" placeholder="เช่น S006">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ชื่อ-นามสกุล <span class="text-red-500 dark:text-red-400">*</span></label>
            <input id="swal-student-name" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm" placeholder="เช่น นายสมศักดิ์ รักดี">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ชั้นเรียน <span class="text-red-500 dark:text-red-400">*</span></label>
            <select id="swal-student-classroom" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground shadow-sm">
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
        popup: "rounded-3xl border border-border/50 p-8 shadow-xl bg-card max-w-md w-full",
        title: "text-2xl font-extrabold text-foreground mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-muted hover:bg-muted text-muted-foreground font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
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
        body: JSON.stringify({ student_id: formValues.studentId.trim(), name: formValues.name.trim(), classroom_id: formValues.classroomId, setting_id: selectedSettingId }),
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
        body: JSON.stringify({ id: studentId, student_number: newNumber, setting_id: selectedSettingId }),
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

  const handleRandomStudentNumbers = async () => {
    const studentsInView = filteredStudents;
    if (studentsInView.length === 0) return;

    const { isConfirmed } = await Swal.fire({
      title: "🎲 Random เลขที่",
      html: `<div style="text-align:center;line-height:1.8">จะกำหนดเลขที่ <b>1–${studentsInView.length}</b> แบบสุ่ม<br>ให้นักเรียน <b>${studentsInView.length}</b> คนที่แสดงอยู่<br><span style="color:#64748b;font-size:13px">(จะเขียนทับเลขที่เดิม)</span></div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "🎲 Random เลย!",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#7c3aed",
    });
    if (!isConfirmed) return;

    // Fisher–Yates shuffle
    const nums = Array.from({ length: studentsInView.length }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    // Build map of new numbers and update state immediately
    const numberMap: Record<string, number> = {};
    for (let i = 0; i < studentsInView.length; i++) {
      numberMap[studentsInView[i].id] = nums[i];
    }
    setStudents(prev => prev.map(s => numberMap[s.id] !== undefined ? { ...s, student_number: numberMap[s.id] } : s));

    let failed = 0;
    for (let i = 0; i < studentsInView.length; i++) {
      try {
        const res = await fetch(`/api/students`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: studentsInView[i].id, student_number: nums[i], setting_id: selectedSettingId }),
        });
        if (!res.ok) { failed++; }
      } catch { failed++; }
    }

    if (failed === 0) {
      Swal.fire({ icon: "success", title: "Random เลขที่สำเร็จ!", timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire("คำเตือน", `Random เสร็จแล้ว แต่มี ${failed} รายการที่อัปเดตไม่สำเร็จ`, "warning");
      if (token && selectedSettingId) loadStudents(selectedSettingId, token);
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
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">รหัสนักเรียน (Student ID)</label>
            <input id="swal-student-id" class="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:outline-none transition-all text-sm font-semibold text-muted-foreground shadow-sm cursor-not-allowed" value="${student.student_id}" disabled>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ชื่อ-นามสกุล</label>
            <input id="swal-student-name" class="w-full px-4 py-3 rounded-xl border border-border bg-muted focus:outline-none transition-all text-sm font-semibold text-muted-foreground shadow-sm cursor-not-allowed" value="${student.name}" disabled>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ชั้นเรียน <span class="text-red-500 dark:text-red-400">*</span></label>
            <select id="swal-student-classroom" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground shadow-sm">
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
        popup: "rounded-3xl border border-border/50 p-8 shadow-xl bg-card max-w-md w-full",
        title: "text-2xl font-extrabold text-foreground mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-muted hover:bg-muted text-muted-foreground font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
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
        body: JSON.stringify({ student_id: formValues.studentId.trim(), name: formValues.name.trim(), classroom_id: formValues.classroomId, setting_id: selectedSettingId }),
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
    setSubjectCreditHours(Number(subject.credit_hours ?? 1));
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

    const langDir = exportLanguage === "ms-jawi" ? "rtl" : "ltr";
    const alignLeftOrRight = exportLanguage === "ms-jawi" ? "right" : "left";

    const getLocalizedText = (key: string) => {
      const dict: Record<string, { th: string; rumi: string; jawi: string }> = {
        "คาบ": { th: "คาบ", rumi: "Masa", jawi: "وقتو" },
        "พักเบรก": { th: "พักเบรก", rumi: "Rehat", jawi: "ريحة" },
        "พัก": { th: "พัก", rumi: "Rehat", jawi: "ريحة" },
        "ห้อง": { th: "ห้อง", rumi: "Kelas", jawi: "كلس" },
        "วัน": { th: "วัน", rumi: "Hari ", jawi: "هاري " },
        "อ.": { th: "อ.", rumi: "Cikgu ", jawi: "چيقڬو " },
        "สีครูผู้สอน": { th: "สีครูผู้สอน", rumi: "Warna Guru", jawi: "ورنا ڬورو" },
        "ภาพรวมตารางเรียน": { th: "ภาพรวมตารางเรียน", rumi: "Jadual Keseluruhan", jawi: "جادوال كستلوروهن" },
        "ตารางเรียนรายชั้น": { th: "ตารางเรียนรายชั้น", rumi: "Jadual Mengikut Kelas", jawi: "جادوال مڠيكوت كلس" },
        "ตารางสอนรายครู": { th: "ตารางสอนรายครู", rumi: "Jadual Mengikut Guru", jawi: "جادوال مڠيكوت ڬورو" },
        "ครู": { th: "ครู", rumi: "Guru", jawi: "ڬورو" },
        "ออกรายงาน ณ": { th: "ออกรายงาน ณ", rumi: "Dikeluarkan pada", jawi: "دكلواركن ڤد" },
        "พิมพ์ / บันทึก PDF": { th: "พิมพ์ / บันทึก PDF", rumi: "Cetak / Simpan PDF", jawi: "چيتق / سيمڤن PDF" },
        "ขนาดตัวอักษร:": { th: "ขนาดตัวอักษร:", rumi: "Saiz Font:", jawi: "ساءيز فونت:" },
        "เทอม": { th: "เทอม", rumi: "Penggal", jawi: "ڤڠگل" }
      };
      if (exportLanguage === "ms-rumi") return dict[key]?.rumi || key;
      if (exportLanguage === "ms-jawi") return dict[key]?.jawi || key;
      return dict[key]?.th || key;
    };

    const getLocalizedDay = (val: number) => {
      const th = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
      const rumi = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
      const jawi = ["أحد", "إثنين", "ثلاث", "رابو", "خميس", "جمعة", "سبتو"];
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
          <div dir="auto" style="padding:8px 14px;background:#0f172a;color:#f8fafc;font-size:16px;font-weight:800;border-radius:6px 6px 0 0;text-align:${alignLeftOrRight};">${getLocalizedText("วัน")}${getLocalizedDay(day.value)}</div>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr>
              <th style="${thBase}text-align:${alignLeftOrRight};min-width:90px;">${getLocalizedText("ห้อง")}</th>
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
    const html = `<!DOCTYPE html><html dir="${langDir}" lang="${exportLanguage}"><head><meta charset="UTF-8"><title>${docTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700;800&family=Sarabun:wght@300;400;600;700;800&family=Noto+Sans+Arabic:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{font-family:'Amiri','Cairo','Noto Naskh Arabic','Noto Sans Arabic','Inter','Sarabun',ui-sans-serif,system-ui,sans-serif;background:#fff;color:#1e293b;padding:20px;font-size:14px;direction:${langDir};text-align:${alignLeftOrRight};}
  h1{font-size:22px;font-weight:800;margin-bottom:4px;}
  .meta{font-size:14px;color:#64748b;margin-bottom:16px;}
  .print-btn{position:fixed;top:12px;${exportLanguage === "ms-jawi" ? "left:12px;" : "right:12px;"}padding:8px 18px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:100;}
  .font-controls{position:fixed;top:12px;${exportLanguage === "ms-jawi" ? "left:200px;" : "right:200px;"}display:flex;align-items:center;gap:8px;background:#fff;padding:6px 14px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.12);border:1px solid #e2e8f0;z-index:100;font-size:13px;font-weight:600;color:#475569;}
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
  content.style.transformOrigin = '${exportLanguage === "ms-jawi" ? "top right" : "top left"}';
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
<link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700;800&family=Sarabun:wght@300;400;600;700;800&family=Noto+Sans+Arabic:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{font-family:'Amiri','Cairo','Noto Naskh Arabic','Noto Sans Arabic','Inter','Sarabun',ui-sans-serif,system-ui,sans-serif;background:#fff;color:#1e293b;padding:20px;font-size:14px;}
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

  const handleOpenExportScoreModal = (classroomId?: string, studentId?: string, mode: "classroom" | "individual" = "classroom") => {
    const settingId = selectedSettingId || selectedSubjectSettingId || gradeStatusSettingId || (settingsList[0]?.id ?? null);
    setExportSettingId(settingId);
    setExportClassroomId(classroomId || classrooms[0]?.id || "");
    setExportStudentId(studentId || "all");
    setExportMode(mode);
    setIncludeActivitySubjects(false);
    setIsExportScoreModalOpen(true);
  };

  const moveExportSubjectUp = (index: number) => {
    if (index <= 0) return;
    setExportSubjectList(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveExportSubjectDown = (index: number) => {
    setExportSubjectList(prev => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const handleExecuteClassroomScoreExport = async () => {
    if (!exportSettingId || !exportClassroomId || !token) {
      Swal.fire("ข้อผิดพลาด", "กรุณาเลือกปีการศึกษาและชั้นเรียน", "warning");
      return;
    }

    const setting = settingsList.find(s => s.id === exportSettingId);
    const classroom = classrooms.find(c => c.id === exportClassroomId);
    if (!setting || !classroom) {
      Swal.fire("ข้อผิดพลาด", "ไม่พบข้อมูลชั้นเรียนหรือปีการศึกษา", "error");
      return;
    }

    const selectedSubjects = exportSubjectList.filter(s => exportSelectedSubjectIds.includes(s.id));
    if (selectedSubjects.length === 0) {
      Swal.fire("ข้อผิดพลาด", "กรุณาเลือกวิชาเรียนอย่างน้อย 1 วิชาที่ต้องการส่งออก", "warning");
      return;
    }

    const classStudents = students.filter(s => s.classroom_id === exportClassroomId)
      .sort((a, b) => (a.student_number || 999) - (b.student_number || 999));

    if (classStudents.length === 0) {
      Swal.fire("ข้อผิดพลาด", "ไม่มีนักเรียนในชั้นเรียนนี้", "warning");
      return;
    }

    const termKey = `${setting.term}/${setting.academic_year}`;
    const gradesRes = await fetch(`/api/grades?term=${encodeURIComponent(termKey)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const allGrades: { student_id: string; subject: string; midterm_score: number | null; final_score: number | null }[] = gradesRes.ok ? await gradesRes.json() : [];

    const gradeMap = new Map<string, Map<string, { midterm: number | null; final: number | null }>>();
    allGrades.forEach(g => {
      if (!gradeMap.has(g.student_id)) gradeMap.set(g.student_id, new Map());
      const sMap = gradeMap.get(g.student_id)!;
      sMap.set(g.subject?.trim().toLowerCase(), { midterm: g.midterm_score, final: g.final_score });
    });

    const t = (k: string) => getScoreExportText(k, exportLanguage);
    const langDir = exportLanguage === "ms-jawi" ? "rtl" : "ltr";

    const studentRows = classStudents.map(st => {
      const sMap = gradeMap.get(st.student_id) || new Map();
      let totalMainScore = 0;
      let maxPossibleMain = 0;
      let totalGpaPoints = 0;
      let totalCredits = 0;

      const subjectScores: Record<string, { total: number | null; midterm: number | null; final: number | null; gradeStr: string; isActivity: boolean; passed?: boolean }> = {};

      selectedSubjects.forEach(sub => {
        const subKey = sub.name?.trim().toLowerCase();
        const scoreData = sMap.get(subKey);
        const mMax = Number(sub.midterm_max_score) || 50;
        const fMax = Number(sub.final_max_score) || 50;
        const subMax = mMax + fMax;
        const credits = Number(sub.credit_hours) || 1;

        if (scoreData && (scoreData.midterm !== null || scoreData.final !== null)) {
          const mid = scoreData.midterm ?? 0;
          const fin = scoreData.final ?? 0;
          const total = mid + fin;

          if (sub.subject_type === "activity") {
            const passed = subMax > 0 ? (total / subMax) >= 0.5 : true;
            subjectScores[sub.id] = {
              total,
              midterm: scoreData.midterm,
              final: scoreData.final,
              gradeStr: passed ? t("ผ.") : t("มผ."),
              isActivity: true,
              passed
            };
            if (exportSumActivityScores) {
              totalMainScore += total;
              maxPossibleMain += subMax;
            }
          } else {
            const pct = subMax > 0 ? (total / subMax) * 100 : 0;
            let point = 0;
            let gStr = "0";
            if (pct >= 80) { point = 4.0; gStr = "4.0"; }
            else if (pct >= 75) { point = 3.5; gStr = "3.5"; }
            else if (pct >= 70) { point = 3.0; gStr = "3.0"; }
            else if (pct >= 65) { point = 2.5; gStr = "2.5"; }
            else if (pct >= 60) { point = 2.0; gStr = "2.0"; }
            else if (pct >= 55) { point = 1.5; gStr = "1.5"; }
            else if (pct >= 50) { point = 1.0; gStr = "1.0"; }

            totalMainScore += total;
            maxPossibleMain += subMax;
            totalGpaPoints += point * credits;
            totalCredits += credits;

            subjectScores[sub.id] = {
              total,
              midterm: scoreData.midterm,
              final: scoreData.final,
              gradeStr: gStr,
              isActivity: false
            };
          }
        } else {
          subjectScores[sub.id] = {
            total: null,
            midterm: null,
            final: null,
            gradeStr: "—",
            isActivity: sub.subject_type === "activity"
          };
        }
      });

      const pct = maxPossibleMain > 0 ? (totalMainScore / maxPossibleMain) * 100 : 0;
      const gpa = totalCredits > 0 ? totalGpaPoints / totalCredits : 0;

      return {
        student_id: st.student_id,
        name: st.name,
        student_number: st.student_number,
        subjectScores,
        totalMainScore,
        maxPossibleMain,
        percentage: Math.round(pct * 100) / 100,
        gpa: Math.round(gpa * 100) / 100,
        rank: 0,
      };
    });

    const sortedForRank = [...studentRows].sort((a, b) => b.percentage - a.percentage || b.totalMainScore - a.totalMainScore);
    sortedForRank.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    const win = window.open("", "_blank");
    if (!win) return;

    const dateStr = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    const alignLeftOrRight = exportLanguage === "ms-jawi" ? "right" : "left";

    if (exportMode === "classroom") {
      const subjectsHeaderHTML = selectedSubjects.map(s => `
        <th style="padding:8px 6px;text-align:center;border:1px solid #cbd5e1;background:#f8fafc;font-size:11px;">
          <div>${s.name}</div>
          <div style="font-weight:normal;color:#64748b;font-size:10px;">${s.subject_type === "activity" ? t("กิจกรรม") : `${s.credit_hours} ${t("นก.")}`}</div>
        </th>
      `).join("");

      const rowsHTML = studentRows.map((st, idx) => {
        const scoresCellsHTML = selectedSubjects.map(s => {
          const sc = st.subjectScores[s.id];
          if (!sc || sc.total === null) {
            return `<td style="padding:6px;text-align:center;border:1px solid #e2e8f0;color:#94a3b8;font-size:11px;">—</td>`;
          }
          if (sc.isActivity) {
            const badgeBg = sc.passed ? "#dcfce7" : "#ffe4e6";
            const badgeFg = sc.passed ? "#166534" : "#991b1b";
            return `<td style="padding:6px;text-align:center;border:1px solid #e2e8f0;font-size:11px;"><span style="background:${badgeBg};color:${badgeFg};padding:2px 6px;border-radius:4px;font-weight:bold;">${sc.gradeStr}</span></td>`;
          }
          return `<td style="padding:6px;text-align:center;border:1px solid #e2e8f0;font-size:11px;">
            <div style="font-weight:bold;">${sc.total}</div>
            <div style="font-size:10px;color:#475569;">${t("เกรด")} ${sc.gradeStr}</div>
          </td>`;
        }).join("");

        return `
          <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
            <td style="padding:6px;text-align:center;border:1px solid #e2e8f0;font-size:11px;font-weight:bold;">${st.student_number || idx + 1}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;font-family:monospace;color:#4f46e5;font-weight:bold;text-align:${alignLeftOrRight};">${st.student_id}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;font-weight:600;text-align:${alignLeftOrRight};">${st.name}</td>
            ${scoresCellsHTML}
            <td style="padding:6px;text-align:center;border:1px solid #e2e8f0;font-size:12px;font-weight:bold;">${st.totalMainScore}</td>
            <td style="padding:6px;text-align:center;border:1px solid #e2e8f0;font-size:12px;font-weight:bold;color:#2563eb;">${st.percentage.toFixed(1)}%</td>
            <td style="padding:6px;text-align:center;border:1px solid #e2e8f0;font-size:12px;font-weight:extrabold;color:#059669;">${st.gpa.toFixed(2)}</td>
            <td style="padding:6px;text-align:center;border:1px solid #e2e8f0;font-size:12px;font-weight:bold;">${st.rank}</td>
          </tr>
        `;
      }).join("");

      win.document.write(`
        <!DOCTYPE html>
        <html dir="${langDir}">
        <head>
          <title>${t("รายงานสรุปผลการเรียนประจำชั้นเรียน")} - ${t("ชั้น")} ${classroom.name}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&family=Sarabun:wght@400;500;600;700;800&family=Inter:wght@400;600;700;800&display=swap');
            body { font-family: 'Amiri', 'Cairo', 'Noto Naskh Arabic', 'Sarabun', 'Inter', sans-serif; margin: 20px; color: #1e293b; background: #fff; direction: ${langDir}; text-align: ${alignLeftOrRight}; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; }
            .header h2 { margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #475569; }
            .meta { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 12px; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f1f5f9; color: #1e293b; font-weight: 700; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 40px; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 220px; }
            .sig-line { border-bottom: 1px dotted #94a3b8; margin-top: 40px; margin-bottom: 6px; }
            .print-btn { position: fixed; top: 16px; ${exportLanguage === "ms-jawi" ? "left: 16px;" : "right: 16px;"} padding: 10px 20px; background: #4f46e5; color: #fff; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.3); font-size: 13px; z-index: 100; }
            @media print {
              .print-btn { display: none; }
              body { margin: 0; }
              @page { size: A4 landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">🖨️ ${t("พิมพ์ / บันทึก PDF")}</button>
          <div class="header">
            <h1>${t("รายงานสรุปผลการเรียนประจำชั้นเรียน")}</h1>
            <h2>${t("ชั้นเรียน")} ${classroom.name} — ${t("ปีการศึกษา")} ${setting.academic_year} ${t("ภาคเรียนที่")} ${setting.term}</h2>
          </div>
          <div class="meta">
            <span>${t("จำนวนนักเรียนทั้งหมด:")} <b>${classStudents.length} ${t("คน")}</b> | ${t("จำนวนวิชาที่ส่งออก:")} <b>${selectedSubjects.length} ${t("วิชา")}</b></span>
            <span>${t("วันที่ออกรายงาน:")} ${dateStr}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="padding:8px;text-align:center;border:1px solid #cbd5e1;width:40px;font-size:11px;">${t("ลำดับ")}</th>
                <th style="padding:8px;text-align:${alignLeftOrRight};border:1px solid #cbd5e1;width:90px;font-size:11px;">${t("รหัสประจำตัว")}</th>
                <th style="padding:8px;text-align:${alignLeftOrRight};border:1px solid #cbd5e1;font-size:11px;">${t("ชื่อ - นามสกุล")}</th>
                ${subjectsHeaderHTML}
                <th style="padding:8px;text-align:center;border:1px solid #cbd5e1;width:70px;font-size:11px;">${t("รวมคะแนน")}</th>
                <th style="padding:8px;text-align:center;border:1px solid #cbd5e1;width:65px;font-size:11px;">${t("เฉลี่ย %")}</th>
                <th style="padding:8px;text-align:center;border:1px solid #cbd5e1;width:55px;font-size:11px;">${t("GPA")}</th>
                <th style="padding:8px;text-align:center;border:1px solid #cbd5e1;width:55px;font-size:11px;">${t("อันดับ")}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div style="font-size:12px;font-weight:bold;">( ........................................................... )</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">${t("ครูประจำชั้น")}</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div style="font-size:12px;font-weight:bold;">( ........................................................... )</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">${t("หัวหน้าฝ่ายวิชาการ / ผู้อำนวยการ")}</div>
            </div>
          </div>
        </body>
        </html>
      `);
    } else {
      const targetStudents = exportStudentId === "all"
        ? studentRows
        : studentRows.filter(s => s.student_id === exportStudentId);

      if (targetStudents.length === 0) {
        Swal.fire("ข้อผิดพลาด", "ไม่พบนายชื่อนักเรียนที่เลือก", "warning");
        return;
      }

      const reportCardsHTML = targetStudents.map((st, sIdx) => {
        const subjectRowsHTML = selectedSubjects.map((sub, idx) => {
          const sc = st.subjectScores[sub.id];
          const midText = sc && sc.midterm !== null ? sc.midterm : "—";
          const finText = sc && sc.final !== null ? sc.final : "—";
          const totalText = sc && sc.total !== null ? sc.total : "—";
          const gradeText = sc ? sc.gradeStr : "—";

          return `
            <tr>
              <td style="padding:8px;text-align:center;border:1px solid #cbd5e1;font-size:12px;">${idx + 1}</td>
              <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:12px;font-weight:600;">${sub.name}</td>
              <td style="padding:8px;text-align:center;border:1px solid #cbd5e1;font-size:12px;">${sub.subject_type === "activity" ? `<span style='color:#7c3aed;font-weight:bold;'>${t("กิจกรรม")}</span>` : t("วิชาหลัก")}</td>
              <td style="padding:8px;text-align:center;border:1px solid #cbd5e1;font-size:12px;">${sub.subject_type === "activity" ? "-" : sub.credit_hours}</td>
              <td style="padding:8px;text-align:center;border:1px solid #cbd5e1;font-size:12px;">${midText}</td>
              <td style="padding:8px;text-align:center;border:1px solid #cbd5e1;font-size:12px;">${finText}</td>
              <td style="padding:8px;text-align:center;border:1px solid #cbd5e1;font-size:12px;font-weight:bold;">${totalText}</td>
              <td style="padding:8px;text-align:center;border:1px solid #cbd5e1;font-size:12px;font-weight:extrabold;color:${sc?.isActivity ? (sc.passed ? '#15803d' : '#b91c1c') : '#4f46e5'};">${gradeText}</td>
            </tr>
          `;
        }).join("");

        return `
          <div class="report-card ${sIdx < targetStudents.length - 1 ? 'page-break' : ''}">
            <div class="header">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;">${t("ใบรายงานผลการเรียนรายบุคคล")}</h1>
              <h2 style="margin:4px 0 0;font-size:15px;font-weight:600;color:#475569;">${t("ปีการศึกษา")} ${setting.academic_year} ${t("ภาคเรียนที่")} ${setting.term}</h2>
            </div>

            <div class="student-info-grid" style="text-align:${alignLeftOrRight};">
              <div class="info-item"><span>${t("ชื่อ - นามสกุล")}:</span> <b>${st.name}</b></div>
              <div class="info-item"><span>${t("รหัสประจำตัว")}:</span> <b style="font-family:monospace;color:#4f46e5;">${st.student_id}</b></div>
              <div class="info-item"><span>${t("ชั้นเรียน")}:</span> <b>${t("ชั้น")} ${classroom.name}</b></div>
              <div class="info-item"><span>${t("เลขที่")}:</span> <b>${st.student_number || "-"}</b></div>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:10px 8px;border:1px solid #cbd5e1;width:40px;font-size:12px;">${t("ลำดับ")}</th>
                  <th style="padding:10px 12px;text-align:${alignLeftOrRight};border:1px solid #cbd5e1;font-size:12px;">${exportLanguage === "th" ? "ชื่อวิชาเรียน" : exportLanguage === "ms-rumi" ? "Nama Subjek" : "نام سوبجيك"}</th>
                  <th style="padding:10px 8px;border:1px solid #cbd5e1;width:80px;font-size:12px;">${t("ประเภท")}</th>
                  <th style="padding:10px 8px;border:1px solid #cbd5e1;width:70px;font-size:12px;">${t("หน่วยกิต")}</th>
                  <th style="padding:10px 8px;border:1px solid #cbd5e1;width:80px;font-size:12px;">${t("คะแนนเก็บ")}</th>
                  <th style="padding:10px 8px;border:1px solid #cbd5e1;width:80px;font-size:12px;">${t("คะแนนสอบ")}</th>
                  <th style="padding:10px 8px;border:1px solid #cbd5e1;width:80px;font-size:12px;">${t("คะแนนรวม")}</th>
                  <th style="padding:10px 8px;border:1px solid #cbd5e1;width:70px;font-size:12px;">${t("เกรด")}</th>
                </tr>
              </thead>
              <tbody>
                ${subjectRowsHTML}
              </tbody>
            </table>

            <div class="summary-box">
              <div class="sum-card">
                <div class="sum-label">${exportSumActivityScores ? t("คะแนนรวมทั้งหมด") : t("คะแนนรวมวิชาหลัก")}</div>
                <div class="sum-val">${st.totalMainScore} / ${st.maxPossibleMain}</div>
              </div>
              <div class="sum-card">
                <div class="sum-label">${t("คิดเป็นร้อยละ")}</div>
                <div class="sum-val" style="color:#2563eb;">${st.percentage.toFixed(1)}%</div>
              </div>
              <div class="sum-card">
                <div class="sum-label">${t("เกรดเฉลี่ย (GPA)")}</div>
                <div class="sum-val" style="color:#059669;">${st.gpa.toFixed(2)}</div>
              </div>
              <div class="sum-card">
                <div class="sum-label">${t("อันดับในห้องเรียน")}</div>
                <div class="sum-val" style="color:#7c3aed;">${t("อันดับที่")} ${st.rank} / ${classStudents.length}</div>
              </div>
            </div>

            <div class="signatures">
              <div class="sig-box">
                <div class="sig-line"></div>
                <div style="font-size:12px;font-weight:bold;">( ........................................................... )</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">${t("ครูประจำชั้น")}</div>
              </div>
              <div class="sig-box">
                <div class="sig-line"></div>
                <div style="font-size:12px;font-weight:bold;">( ........................................................... )</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">${t("หัวหน้าฝ่ายวิชาการ / ผู้อำนวยการ")}</div>
              </div>
            </div>
          </div>
        `;
      }).join("");

      win.document.write(`
        <!DOCTYPE html>
        <html dir="${langDir}">
        <head>
          <title>${t("ใบรายงานผลการเรียนรายบุคคล")} - ${t("ชั้น")} ${classroom.name}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&family=Sarabun:wght@400;500;600;700;800&family=Inter:wght@400;600;700;800&display=swap');
            body { font-family: 'Amiri', 'Cairo', 'Noto Naskh Arabic', 'Sarabun', 'Inter', sans-serif; margin: 20px; color: #1e293b; background: #fff; direction: ${langDir}; text-align: ${alignLeftOrRight}; }
            .report-card { padding: 10px 0; margin-bottom: 20px; page-break-inside: avoid; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            .student-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px; font-size: 13px; }
            .summary-box { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
            .sum-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center; }
            .sum-label { font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
            .sum-val { font-size: 16px; font-weight: 800; color: #0f172a; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 40px; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 220px; }
            .sig-line { border-bottom: 1px dotted #94a3b8; margin-top: 40px; margin-bottom: 6px; }
            .print-btn { position: fixed; top: 16px; ${exportLanguage === "ms-jawi" ? "left: 16px;" : "right: 16px;"} padding: 10px 20px; background: #4f46e5; color: #fff; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.3); font-size: 13px; z-index: 100; }
            @media print {
              .print-btn { display: none; }
              body { margin: 0; }
              .page-break { page-break-after: always; break-after: page; }
              @page { size: A4 portrait; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">🖨️ ${t("พิมพ์ / บันทึก PDF")}</button>
          ${reportCardsHTML}
        </body>
        </html>
      `);
    }

    win.document.close();
    setIsExportScoreModalOpen(false);
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
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 grid-backdrop opacity-50 -z-10" />

      {/* Header */}
      <header className="header-gradient shadow-sm sticky top-0 z-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl opacity-15 blur-sm" />
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 bg-card relative border border-border/80">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground leading-none gradient-text">ระบบแอดมิน</h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">จัดการโครงสร้างระบบและผู้ใช้งาน</p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-foreground">สวัสดี, {adminUser?.username || "ผู้ดูแลระบบ"}</span>
            <span className="text-xs text-subtle-foreground">{formatThaiDate(new Date().toISOString())}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle className="!h-9 !w-9" />
            <button
              onClick={handleConnectGoogle}
              title={adminUser?.email ? `เชื่อมต่ออีเมล: ${adminUser.email}` : "เชื่อมต่ออีเมล Google"}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all shrink-0 border ${adminUser?.email ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10" : "text-muted-foreground border-border hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:border-indigo-200 dark:border-indigo-500/30"}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleChangePassword}
              title="เปลี่ยนรหัสผ่าน"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:border-indigo-200 dark:border-indigo-500/30 transition-all shrink-0 border border-border"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:bg-rose-500/15 px-3.5 py-2 rounded-xl transition-all shrink-0 border border-rose-100 dark:border-rose-500/25 hover:border-rose-200 dark:border-rose-500/30"
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
                    : "text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300"
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
              <div className="text-xs font-bold text-subtle-foreground uppercase tracking-wider mb-2">ปีการศึกษาปัจจุบัน</div>
              <div className="text-sm font-extrabold text-foreground">ปีการศึกษา {adminYear}</div>
              <div className="text-xs font-semibold mb-3 gradient-text">ภาคเรียนที่ {adminTerm}</div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isGradingActive ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                {isGradingActive ? "เปิดกรอกคะแนน" : "ปิดกรอกคะแนน"}
              </span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 glass-strong rounded-3xl overflow-hidden min-h-[500px]">
            {activeTab === "dashboard" && (
              <DashboardTab
                adminYear={adminYear}
                adminTerm={adminTerm}
                users={users}
                students={students}
                classrooms={classrooms}
                subjectsList={subjectsList}
                schedulePeriods={schedulePeriods}
                settingsList={settingsList}
                startDate={startDate}
                endDate={endDate}
                isGradingActive={isGradingActive}
                navItems={NAV_ITEMS}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "users" && (
              <UsersTab
                users={users}
                fileInputRef={fileInputRef}
                handleImportUsers={handleImportUsers}
                handleDownloadTemplate={handleDownloadTemplate}
                handleAddUser={handleAddUser}
                selectedUserIds={selectedUserIds}
                setSelectedUserIds={setSelectedUserIds}
                handleBulkDeleteUsers={handleBulkDeleteUsers}
                userSubTab={userSubTab}
                setUserSubTab={setUserSubTab}
                paginatedUsers={paginatedUsers}
                adminUser={adminUser}
                classrooms={classrooms}
                students={students}
                handleEditUser={handleEditUser}
                handleDeleteUser={handleDeleteUser}
                handleOpenExportScoreModal={handleOpenExportScoreModal}
                filteredUsers={filteredUsers}
                userCurrentPage={userCurrentPage}
                setUserCurrentPage={setUserCurrentPage}
                usersPerPage={usersPerPage}
                setUsersPerPage={setUsersPerPage}
                totalUserPages={totalUserPages}
              />
            )}

            {activeTab === "classrooms" && (
              <ClassroomsTab
                settingsList={settingsList}
                selectedSettingId={selectedSettingId}
                setSelectedSettingId={setSelectedSettingId}
                setSelectedClassroomIds={setSelectedClassroomIds}
                loadClassrooms={loadClassrooms}
                token={token}
                classrooms={classrooms}
                selectedClassroomIds={selectedClassroomIds}
                classroomFileInputRef={classroomFileInputRef}
                handleImportClassrooms={handleImportClassrooms}
                handleDownloadClassroomTemplate={handleDownloadClassroomTemplate}
                handleOpenExportScoreModal={handleOpenExportScoreModal}
                handleOpenCopyModal={handleOpenCopyModal}
                handleBulkDeleteClassrooms={handleBulkDeleteClassrooms}
                handleAddClassroom={handleAddClassroom}
                handleOpenAssignModal={handleOpenAssignModal}
                handleEditClassroom={handleEditClassroom}
                handleDeleteClassroom={handleDeleteClassroom}
              />
            )}

            {activeTab === "students" && (
              <StudentsTab
                settingsList={settingsList}
                selectedSettingId={selectedSettingId}
                setSelectedSettingId={setSelectedSettingId}
                loadClassrooms={loadClassrooms}
                loadStudents={loadStudents}
                token={token}
                filteredStudents={filteredStudents}
                studentFilterClassroomId={studentFilterClassroomId}
                setStudentFilterClassroomId={setStudentFilterClassroomId}
                classrooms={classrooms}
                exportLanguage={exportLanguage}
                setExportLanguage={setExportLanguage}
                handleExportStudents={handleExportStudents}
                handleRandomStudentNumbers={handleRandomStudentNumbers}
                setStudents={setStudents}
                handleUpdateStudentNumber={handleUpdateStudentNumber}
                handleEditStudent={handleEditStudent}
              />
            )}

            {activeTab === "subjects" && (
              <SubjectsTab
                settingsList={settingsList}
                selectedSubjectSettingId={selectedSubjectSettingId}
                handleSelectSubjectSetting={handleSelectSubjectSetting}
                subjectsList={subjectsList}
                handleAddSubject={handleAddSubject}
                handleOpenCopySubjectsModal={handleOpenCopySubjectsModal}
                handleEditSubject={handleEditSubject}
                handleDeleteSubject={handleDeleteSubject}
              />
            )}

            {activeTab === "schedule" && (
              <ScheduleTab
                settingsList={settingsList}
                selectedSubjectSettingId={selectedSubjectSettingId}
                handleSelectSubjectSetting={handleSelectSubjectSetting}
                schedulePeriods={schedulePeriods}
                updatePeriodField={updatePeriodField}
                handleSavePeriod={handleSavePeriod}
                handleDeletePeriod={handleDeletePeriod}
                handleAddPeriod={handleAddPeriod}
                scheduleEntries={scheduleEntries}
                exportLanguage={exportLanguage}
                setExportLanguage={setExportLanguage}
                handleExportSchedule={handleExportSchedule}
                scheduleClassroomId={scheduleClassroomId}
                setScheduleClassroomId={setScheduleClassroomId}
                subjectClassrooms={subjectClassrooms}
                subjectsList={subjectsList}
                handleScheduleCellChange={handleScheduleCellChange}
                handleScheduleTeacherChange={handleScheduleTeacherChange}
                users={users}
              />
            )}

            {activeTab === "rankings" && (
              <RankingsTab
                settingsList={settingsList}
                rankingsSettingId={rankingsSettingId}
                handleSelectRankingsSetting={handleSelectRankingsSetting}
                rankingsLoading={rankingsLoading}
                rankingsData={rankingsData}
                rankingsClassroomFilter={rankingsClassroomFilter}
                setRankingsClassroomFilter={setRankingsClassroomFilter}
                token={token}
                loadRankings={loadRankings}
              />
            )}

            {activeTab === "yearly-average" && (
              <YearlyAverageTab
                settingsList={settingsList}
                yearlyAvgSettingId={yearlyAvgSettingId}
                handleSelectYearlyAvgSetting={handleSelectYearlyAvgSetting}
                yearlyAvgLoading={yearlyAvgLoading}
                yearlyAvgAvailable={yearlyAvgAvailable}
                yearlyAvgReason={yearlyAvgReason}
                yearlyAvgData={yearlyAvgData}
                yearlyAvgClassroomFilter={yearlyAvgClassroomFilter}
                setYearlyAvgClassroomFilter={setYearlyAvgClassroomFilter}
                token={token}
                loadYearlyAverage={loadYearlyAverage}
              />
            )}

            {activeTab === "grade-status" && (
              <GradeStatusTab
                settingsList={settingsList}
                gradeStatusSettingId={gradeStatusSettingId}
                handleSelectGradeStatusSetting={handleSelectGradeStatusSetting}
                gradeStatusLoading={gradeStatusLoading}
                gradeStatusData={gradeStatusData}
                gradeStatusSubTab={gradeStatusSubTab}
                setGradeStatusSubTab={setGradeStatusSubTab}
                selectedGradeStatusSubject={selectedGradeStatusSubject}
                setSelectedGradeStatusSubject={setSelectedGradeStatusSubject}
                openStudentDetail={openStudentDetail}
                token={token}
                loadGradeStatus={loadGradeStatus}
              />
            )}

            {activeTab === "student-scores" && (
              <StudentScoresTab
                settingsList={settingsList}
                scoresSettingId={scoresSettingId}
                handleSelectScoresSetting={handleSelectScoresSetting}
                scoresLoading={scoresLoading}
                scoresStudents={scoresStudents}
                scoresSubjects={scoresSubjects}
                scoresGrades={scoresGrades}
                scoresClassrooms={scoresClassrooms}
                scoresViewMode={scoresViewMode}
                setScoresViewMode={setScoresViewMode}
                scoresClassroomId={scoresClassroomId}
                setScoresClassroomId={setScoresClassroomId}
                scoresSelectedStudentId={scoresSelectedStudentId}
                setScoresSelectedStudentId={setScoresSelectedStudentId}
              />
            )}

            {activeTab === "settings" && (
              <SettingsTab
                settingsList={settingsList}
                isGradingActive={isGradingActive}
                adminYear={adminYear}
                adminTerm={adminTerm}
                startDate={startDate}
                endDate={endDate}
                handleAddSetting={handleAddSetting}
                handleEditSetting={handleEditSetting}
                handleDeleteSetting={handleDeleteSetting}
              />
            )}
          </div>
        </div>
      </main>

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        modalMode={modalMode}
        editingUser={editingUser}
        validationError={validationError}
        name={name}
        setName={setName}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        email={email}
        setEmail={setEmail}
        role={role}
        setRole={setRole}
        studentId={studentId}
        setStudentId={setStudentId}
        homeroomClassroomId={homeroomClassroomId}
        setHomeroomClassroomId={setHomeroomClassroomId}
        classrooms={classrooms}
        students={students}
        onSave={handleSaveUserSubmit}
      />

      {/* Subject Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        subjectModalMode={subjectModalMode}
        subjectSettingId={subjectSettingId}
        settingsList={settingsList}
        validationError={validationError}
        subjectName={subjectName}
        setSubjectName={setSubjectName}
        subjectTeacherIds={subjectTeacherIds}
        setSubjectTeacherIds={setSubjectTeacherIds}
        users={users}
        subjectType={subjectType}
        setSubjectType={setSubjectType}
        subjectHasScore={subjectHasScore}
        setSubjectHasScore={setSubjectHasScore}
        subjectCreditHours={subjectCreditHours}
        setSubjectCreditHours={setSubjectCreditHours}
        subjectMidtermMax={subjectMidtermMax}
        setSubjectMidtermMax={setSubjectMidtermMax}
        subjectFinalMax={subjectFinalMax}
        setSubjectFinalMax={setSubjectFinalMax}
        subjectClassrooms={subjectClassrooms}
        subjectClassroomIds={subjectClassroomIds}
        setSubjectClassroomIds={setSubjectClassroomIds}
        onSave={handleSaveSubjectSubmit}
      />

      {/* Copy Subjects Modal */}
      <CopySubjectsModal
        isOpen={isCopySubjectsModalOpen}
        onClose={() => setIsCopySubjectsModalOpen(false)}
        settingsList={settingsList}
        copySubjectsSourceId={copySubjectsSourceId}
        setCopySubjectsSourceId={setCopySubjectsSourceId}
        copySubjectsTargetId={copySubjectsTargetId}
        setCopySubjectsTargetId={setCopySubjectsTargetId}
        sourceSubjects={sourceSubjects}
        copySubjectsSelected={copySubjectsSelected}
        setCopySubjectsSelected={setCopySubjectsSelected}
        onSave={handleSaveCopySubjects}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        modalState={studentDetailModal}
        onClose={() => setStudentDetailModal((prev) => ({ ...prev, open: false }))}
      />
      {/* Export Classroom Scores Modal */}
      <ExportScoreModal
        isOpen={isExportScoreModalOpen}
        onClose={() => setIsExportScoreModalOpen(false)}
        exportMode={exportMode}
        setExportMode={setExportMode}
        exportLanguage={exportLanguage}
        setExportLanguage={setExportLanguage}
        exportSettingId={exportSettingId}
        setExportSettingId={setExportSettingId}
        exportClassroomId={exportClassroomId}
        setExportClassroomId={setExportClassroomId}
        exportStudentId={exportStudentId}
        setExportStudentId={setExportStudentId}
        includeActivitySubjects={includeActivitySubjects}
        setIncludeActivitySubjects={setIncludeActivitySubjects}
        exportSumActivityScores={exportSumActivityScores}
        setExportSumActivityScores={setExportSumActivityScores}
        exportSubjectList={exportSubjectList}
        exportSelectedSubjectIds={exportSelectedSubjectIds}
        setExportSelectedSubjectIds={setExportSelectedSubjectIds}
        settingsList={settingsList}
        classrooms={classrooms}
        students={students}
        moveExportSubjectUp={moveExportSubjectUp}
        moveExportSubjectDown={moveExportSubjectDown}
        onExport={handleExecuteClassroomScoreExport}
      />
      {adminUser && <ChatWidget userId={adminUser.id} userRole="admin" />}
    </div>
  );
}

