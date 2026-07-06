export interface DBStudent { id: string; name: string; student_id: string; classroom_id: string | null; }
export interface DBGrade { id: string; student_id: string; subject: string; midterm_score: number | null; final_score: number | null; term: string; }
export interface DBClassroom { id: string; name: string; }
export interface DBSubject { id: string; name: string; setting_id?: number | null; midterm_max_score?: number | null; final_max_score?: number | null; subject_type?: "main" | "activity"; credit_hours?: number | null; score_display_mode?: "separate" | "combined"; }
export interface SchedulePeriod { id: string; setting_id: number | string; period_no: number | string; start_time: string; end_time: string; label?: string | null; is_break?: boolean; }
export interface ScheduleEntry {
  id: string; classroom_id: string; classroom_name: string;
  subject_id: string; subject_name: string; teacher_id: string | null; teacher_name: string | null;
  teacher_names?: string[];
  day_of_week: number | string; period_id: string; period_no: number | string; start_time: string; end_time: string; label?: string | null;
}

export interface DaySetting {
  value: number;
  label: string;
  color: string;
  gradient: string;
}

export const ALL_DAYS: DaySetting[] = [
  { value: 1, label: "จันทร์", color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30", gradient: "from-amber-400 to-yellow-300" },
  { value: 2, label: "อังคาร", color: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30", gradient: "from-pink-400 to-rose-300" },
  { value: 3, label: "พุธ", color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30", gradient: "from-emerald-400 to-green-300" },
  { value: 4, label: "พฤหัสบดี", color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30", gradient: "from-orange-400 to-amber-300" },
  { value: 5, label: "ศุกร์", color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30", gradient: "from-blue-400 to-sky-300" },
  { value: 6, label: "เสาร์", color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30", gradient: "from-purple-400 to-violet-300" },
  { value: 0, label: "อาทิตย์", color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30", gradient: "from-red-400 to-rose-300" },
];

export type Tab = "overview" | "grades" | "schedule";

export const NAV_TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "overview", label: "ข้อมูลของฉัน", icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "grades", label: "ผลการเรียน", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { key: "schedule", label: "ตารางเรียน", icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

export interface GradeInfo {
  letter: string;
  point: string;
  color: string;
  bar: string;
}

export function getGradeInfo(percent: number): GradeInfo {
  if (percent >= 80) return { letter: "A", point: "4.0", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30", bar: "bg-emerald-500" };
  if (percent >= 75) return { letter: "B+", point: "3.5", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30", bar: "bg-green-500" };
  if (percent >= 70) return { letter: "B", point: "3.0", color: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30", bar: "bg-teal-500" };
  if (percent >= 65) return { letter: "C+", point: "2.5", color: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30", bar: "bg-sky-500" };
  if (percent >= 60) return { letter: "C", point: "2.0", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30", bar: "bg-blue-500" };
  if (percent >= 55) return { letter: "D+", point: "1.5", color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30", bar: "bg-yellow-500" };
  if (percent >= 50) return { letter: "D", point: "1.0", color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30", bar: "bg-orange-500" };
  return { letter: "F", point: "0.0", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30", bar: "bg-red-500" };
}

export interface CombinedActivityResult {
  totalScore: number;
  totalMax: number;
  percent: number;
  pass: boolean;
  label: string;
  color: string;
  bar: string;
}
