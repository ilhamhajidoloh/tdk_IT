export interface DBStudent { id: string; name: string; student_id: string; classroom_id: string | null; student_number?: number | null; }
export interface DBGrade { id: string; student_id: string; subject: string; midterm_score: number | null; final_score: number | null; term: string; }
export interface DBClassroom { id: string; name: string; setting_id?: number; }
export interface DBSubject { id: string; name: string; teacher_id?: string | null; setting_id?: number | null; midterm_max_score?: number | null; final_max_score?: number | null; subject_type?: "main" | "activity"; credit_hours?: number | null; score_display_mode?: "separate" | "combined"; classroom_ids?: string[]; }
export interface SchedulePeriod { id: string; setting_id: number | string; period_no: number | string; start_time: string; end_time: string; label?: string | null; is_break?: boolean; }
export interface ScheduleEntry {
  id: string; classroom_id: string; classroom_name: string;
  subject_id: string; subject_name: string; teacher_id: string | null; teacher_name: string | null;
  day_of_week: number | string; period_id: string; period_no: number | string; start_time: string; end_time: string; label?: string | null;
}

export interface RowScore {
  midterm: string;
  final: string;
}

export type Tab = "dashboard" | "enter" | "status" | "homeroom" | "yearly-average" | "schedule" | "evaluate" | "attendance";

export interface EvaluationTopic {
  id: string;
  name_th: string;
  name_rumi?: string | null;
  name_jawi?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface EvaluationRecord {
  id: string;
  student_id: string;
  subject_id: string;
  category: "character" | "rwt";
  topic_key: string;
  rating: number;
  term: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "leave";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  subject_id: string;
  classroom_id: string;
  date: string;
  status: AttendanceStatus;
  note?: string | null;
  term: string;
}

export interface AttendanceSummaryRow {
  student_id: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
}

export const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "มา", color: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" },
  { value: "late", label: "สาย", color: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30" },
  { value: "leave", label: "ลา", color: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30" },
  { value: "absent", label: "ขาด", color: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30" },
];

export interface DaySetting {
  value: number;
  label: string;
  short: string;
}

export const ALL_DAYS: DaySetting[] = [
  { value: 1, label: "จันทร์", short: "จ" },
  { value: 2, label: "อังคาร", short: "อ" },
  { value: 3, label: "พุธ", short: "พ" },
  { value: 4, label: "พฤหัสบดี", short: "พฤ" },
  { value: 5, label: "ศุกร์", short: "ศ" },
  { value: 6, label: "เสาร์", short: "ส" },
  { value: 0, label: "อาทิตย์", short: "อา" },
];

export const DAY_COLORS: Record<number, string> = {
  1: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  2: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30",
  3: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
  4: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  5: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  6: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30",
  0: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
};

export const NAV_TABS: { key: Tab; label: string; icon: string }[] = [
  {
    key: "dashboard",
    label: "แดชบอร์ด",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
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
    key: "yearly-average",
    label: "เฉลี่ยรวมทั้งปี",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "schedule",
    label: "ตารางสอน",
    icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    key: "evaluate",
    label: "ประเมินคุณลักษณะ",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  {
    key: "attendance",
    label: "เช็คชื่อ",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export interface GradeLabelInfo {
  label: string;
  point: string;
  color: string;
}

export function getGradeLabel(total: number, maxTotal: number): GradeLabelInfo {
  const percent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  if (percent >= 80) return { label: "A", point: "4.0", color: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" };
  if (percent >= 75) return { label: "B+", point: "3.5", color: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30" };
  if (percent >= 70) return { label: "B", point: "3.0", color: "bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30" };
  if (percent >= 65) return { label: "C+", point: "2.5", color: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30" };
  if (percent >= 60) return { label: "C", point: "2.0", color: "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30" };
  if (percent >= 55) return { label: "D+", point: "1.5", color: "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30" };
  if (percent >= 50) return { label: "D", point: "1.0", color: "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30" };
  return { label: "F", point: "0.0", color: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30" };
}

export function getResultLabel(total: number, maxTotal: number, subjectType: "main" | "activity"): GradeLabelInfo {
  if (subjectType === "activity") {
    const percent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    return percent >= 50
      ? { label: "ผ่าน", point: "ผ่าน", color: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" }
      : { label: "ไม่ผ่าน", point: "ไม่ผ่าน", color: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30" };
  }
  return getGradeLabel(total, maxTotal);
}

export interface CombinedActivityResult {
  totalScore: number;
  totalMax: number;
  percent: number;
  pass: boolean;
  label: string;
  color: string;
}
