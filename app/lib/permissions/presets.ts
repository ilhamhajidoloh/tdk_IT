import { PermissionPreset } from "./types";

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: "academic_manager",
    name: "ผู้จัดการวิชาการ",
    nameEn: "Academic Manager",
    description: "จัดการวิชาเรียน โครงสร้างชั้นเรียน ตารางเรียน และคะแนนผลการเรียน",
    icon: "GraduationCap",
    permissions: {
      subjects: { view: true, create: true, edit: true, assign_teachers: true, reorder: true, translations: true },
      classrooms: { view: true, create: true, edit: true, manage_students: true },
      schedules: { view: true, create: true, edit: true, export: true },
      scores: { view: true, edit: true, import: true, reports: true, rankings: true, evaluations: true },
      analytics: { view: true },
    },
  },
  {
    id: "student_manager",
    name: "ผู้ดูแลนักเรียน",
    nameEn: "Student Affairs",
    description: "จัดการข้อมูลนักเรียน ทะเบียนประวัติ นำเข้า ส่งออก และการเลื่อนชั้น",
    icon: "Users",
    permissions: {
      students: { view: true, create: true, edit: true, import: true, export: true, promote: true },
      classrooms: { view: true, manage_students: true },
      users: { view: true },
    },
  },
  {
    id: "schedule_manager",
    name: "ผู้ดูแลตารางเรียน",
    nameEn: "Schedule Coordinator",
    description: "จัดตารางสอนประจำคาบ กำหนดเวลาเรียน และดูข้อมูลห้องเรียน/วิชา",
    icon: "CalendarDays",
    permissions: {
      schedules: { view: true, create: true, edit: true, delete: true, export: true },
      classrooms: { view: true },
      subjects: { view: true },
    },
  },
  {
    id: "scores_evaluations",
    name: "ผู้ดูแลคะแนน & ผลการเรียน",
    nameEn: "Grades & Evaluations",
    description: "ตรวจสอบคะแนน สถานะส่งคะแนน การประเมินคุณลักษณะ และพิมพ์รายงาน",
    icon: "TrendingUp",
    permissions: {
      scores: { view: true, edit: true, import: true, reports: true, rankings: true, evaluations: true },
      analytics: { view: true, export: true },
      subjects: { view: true },
      classrooms: { view: true },
      students: { view: true },
    },
  },
  {
    id: "attendance_manager",
    name: "ผู้ดูแลการเช็คชื่อ",
    nameEn: "Attendance Supervisor",
    description: "ตรวจสอบการเช็คชื่อเข้าเรียน แก้ไขประวัติ และดูรายงานสถิติ",
    icon: "ClipboardCheck",
    permissions: {
      attendance: { view: true, edit: true, reports: true },
      classrooms: { view: true },
      students: { view: true },
    },
  },
  {
    id: "news_duty_manager",
    name: "ผู้ดูแลข่าวสาร & เวรยาม",
    nameEn: "News & Duties",
    description: "ประกาศข่าวสารประชาสัมพันธ์ และจัดการตารางเวรครู-แม่ครัว",
    icon: "Newspaper",
    permissions: {
      news: { view: true, create: true, edit: true, delete: true },
      duties: { view: true, create: true, edit: true, manage: true },
    },
  },
  {
    id: "correspondence_manager",
    name: "ผู้ดูแลงานสารบรรณ",
    nameEn: "Correspondence & Records",
    description: "ออกเลขทะเบียนหนังสือรับ-ส่ง และจัดเก็บเอกสารราชการ",
    icon: "BookMarked",
    permissions: {
      correspondence: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    id: "custom",
    name: "กำหนดสิทธิ์เอง (Blank)",
    nameEn: "Custom (Blank Slate)",
    description: "เริ่มต้นจากไม่มีสิทธิ์ใด ๆ เพื่อเลือกเปิดเฉพาะสิทธิ์ที่ต้องการ",
    icon: "Sliders",
    permissions: {},
  },
];

