export interface DBUser {
  id: string;
  firebase_uid?: string;
  username: string;
  role: "admin" | "teacher" | "student";
  student_id?: string;
  homeroom_classroom_id?: string;
  subjects?: string[];
  email?: string | null;
}

export interface DBStudent {
  id: string;
  name: string;
  student_id: string;
  classroom_id: string | null;
  student_number?: number | null;
}

export interface DBClassroom {
  id: string;
  name: string;
  setting_id?: number | null;
  created_at?: string;
}

export interface DBSubject {
  id: string;
  name: string;
  teacher_id?: string;
  teacher_name?: string;
  teacher_ids?: string[];
  teacher_names?: string[];
  classroom_ids?: string[];
  classroom_names?: string[];
  setting_id?: number | null;
  midterm_max_score?: number | null;
  final_max_score?: number | null;
  subject_type?: "main" | "activity";
  credit_hours?: number | null;
  score_display_mode?: "separate" | "combined";
}

export interface DBGrade {
  id: string;
  student_id: string;
  subject: string;
  midterm_score: number | null;
  final_score: number | null;
  term: string;
}

export interface SchedulePeriod {
  id: string;
  setting_id: number | string;
  period_no: number | string;
  start_time: string;
  end_time: string;
  label?: string | null;
  is_break?: boolean;
}

export interface ScheduleEntry {
  id: string;
  classroom_id: string;
  classroom_name: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string | null;
  teacher_name: string | null;
  teacher_names?: string[];
  day_of_week: number | string;
  period_id: string;
  period_no: number | string;
  start_time: string;
  end_time: string;
  label?: string | null;
}

export type Tab =
  | "dashboard"
  | "users"
  | "classrooms"
  | "students"
  | "settings"
  | "subjects"
  | "schedule"
  | "grade-status"
  | "student-scores"
  | "rankings"
  | "yearly-average"
  | "duty"
  | "evaluations";

export interface EvaluationTopic {
  id: string;
  name_th: string;
  name_rumi?: string | null;
  name_jawi?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface EvaluationSummaryRow {
  student_id: string;
  category: "character" | "rwt";
  topic_key: string;
  rating: number;
}

export interface RankingRow {
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

export interface GradeStatusRow {
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

export interface SystemSetting {
  id: number;
  academic_year: string;
  term: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  schedule_days?: number[];
}

export const ALL_DAYS = [
  { value: 1, label: "จันทร์" },
  { value: 2, label: "อังคาร" },
  { value: 3, label: "พุธ" },
  { value: 4, label: "พฤหัสบดี" },
  { value: 5, label: "ศุกร์" },
  { value: 6, label: "เสาร์" },
  { value: 0, label: "อาทิตย์" },
];

export const TEACHER_PALETTE = [
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
