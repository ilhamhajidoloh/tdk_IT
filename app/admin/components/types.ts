export interface DBUser {
  id: string;
  firebase_uid?: string;
  username: string;
  role: "super_admin" | "admin" | "teacher" | "student";
  school_id?: string;
  student_id?: string;
  homeroom_classroom_id?: string;
  subjects?: string[];
  email?: string | null;
  is_clerical?: boolean;
  status?: "active" | "graduated" | "resigned" | "disabled" | "expired";
  resigned_at?: string | null;
  resignation_reason?: string | null;
}

export interface DBStudent {
  id: string;
  name: string;
  student_id: string;
  classroom_id: string | null;
  student_number?: number | null;
  status?: "active" | "graduated" | "resigned" | "expired";
  graduation_year?: string | null;
  status_updated_at?: string | null;
  status_note?: string | null;
  enrollment_date?: string | null;
  graduation_date?: string | null;
}

export interface DBClassroom {
  id: string;
  name: string;
  name_thai?: string;
  name_rumi?: string;
  name_jawi?: string;
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
  sort_order?: number | null;
  name_thai?: string;
  name_rumi?: string;
  name_jawi?: string;
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
  classroom_name_thai?: string | null;
  classroom_name_rumi?: string | null;
  classroom_name_jawi?: string | null;
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
  | "analytics"
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
  | "export-grades"
  | "duty"
  | "evaluations"
  | "books"
  | "achievement";

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
  classroom_name_thai?: string | null;
  classroom_name_rumi?: string | null;
  classroom_name_jawi?: string | null;
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
  classroom_name_thai?: string | null;
  classroom_name_rumi?: string | null;
  classroom_name_jawi?: string | null;
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
  highest_grade_level?: string | null;
  data_retention_years?: number | null;
  auto_cleanup_enabled?: boolean;
  is_grade_released?: boolean;
  grade_release_date?: string | null;
  academic_head?: string | null;
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
  { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" },      // น้ำเงินสด
  { bg: "#fce7f3", text: "#be185d", border: "#ec4899" },      // ชมพูเข้ม
  { bg: "#d1fae5", text: "#047857", border: "#10b981" },      // เขียวมรกต
  { bg: "#fed7aa", text: "#c2410c", border: "#f97316" },      // ส้มสด
  { bg: "#e9d5ff", text: "#7c3aed", border: "#a855f7" },      // ม่วงสด
  { bg: "#fef08a", text: "#a16207", border: "#eab308" },      // เหลืองมะนาว
  { bg: "#ccfbf1", text: "#0f766e", border: "#14b8a6" },      // ฟ้าเขียว (teal)
  { bg: "#fecaca", text: "#dc2626", border: "#ef4444" },      // แดงสด
  { bg: "#bfdbfe", text: "#1d4ed8", border: "#2563eb" },      // น้ำเงินเข้ม
  { bg: "#fbcfe8", text: "#db2777", border: "#f472b6" },      // ชมพูอ่อน
  { bg: "#a7f3d0", text: "#059669", border: "#34d399" },      // เขียวมิ้นต์
  { bg: "#fcd34d", text: "#b45309", border: "#f59e0b" },      // ทอง
  { bg: "#c7d2fe", text: "#4f46e5", border: "#6366f1" },      // อินดิโก
  { bg: "#fda4af", text: "#e11d48", border: "#f43f5e" },      // แดงกุหลาบ
  { bg: "#99f6e4", text: "#0d9488", border: "#2dd4bf" },      // เขียวทะเล
  { bg: "#fde68a", text: "#92400e", border: "#fbbf24" },      // เหลืองอำพัน
  { bg: "#ddd6fe", text: "#5b21b6", border: "#8b5cf6" },      // ม่วงอ่อน
  { bg: "#fed7e2", text: "#9f1239", border: "#fb7185" },      // ชมพูแดง
  { bg: "#a5f3fc", text: "#155e75", border: "#22d3ee" },      // ฟ้าสดใส
  { bg: "#d9f99d", text: "#3f6212", border: "#84cc16" },      // เขียวมะนาว
  { bg: "#fecdd3", text: "#b91c1c", border: "#f87171" },      // แดงอ่อน
  { bg: "#bae6fd", text: "#075985", border: "#0ea5e9" },      // ฟ้าน้ำทะเล
  { bg: "#fef3c7", text: "#78350f", border: "#fbbf24" },      // เหลืองครีม
  { bg: "#e0e7ff", text: "#3730a3", border: "#818cf8" },      // อินดิโกอ่อน
  { bg: "#dcfce7", text: "#166534", border: "#4ade80" },      // เขียวใบไม้
  { bg: "#ffe4e6", text: "#9f1239", border: "#fb7185" },      // ชมพูพีช
  { bg: "#cffafe", text: "#164e63", border: "#06b6d4" },      // ฟ้าไซยาน
  { bg: "#fef9c3", text: "#854d0e", border: "#facc15" },      // เหลืองสด
  { bg: "#f5d0fe", text: "#a21caf", border: "#e879f9" },      // ฟูเชีย
  { bg: "#bbf7d0", text: "#15803d", border: "#22c55e" },      // เขียวสดใส
  { bg: "#fecaca", text: "#991b1b", border: "#f87171" },      // แดงส้ม
  { bg: "#bfdbfe", text: "#1e3a8a", border: "#60a5fa" },      // น้ำเงินท้องฟ้า
  { bg: "#f9a8d4", text: "#831843", border: "#f472b6" },      // ชมพูสดใส
  { bg: "#86efac", text: "#14532d", border: "#4ade80" },      // เขียวนีออน
  { bg: "#fdba74", text: "#7c2d12", border: "#fb923c" },      // ส้มทอง
  { bg: "#c4b5fd", text: "#4c1d95", border: "#a78bfa" },      // ม่วงพาสเทล
  { bg: "#5eead4", text: "#134e4a", border: "#2dd4bf" },      // เขียวเทอร์ควอยซ์
  { bg: "#fde047", text: "#713f12", border: "#facc15" },      // เหลืองมัสตาร์ด
  { bg: "#7dd3fc", text: "#0c4a6e", border: "#38bdf8" },      // ฟ้าใส
  { bg: "#f0abfc", text: "#701a75", border: "#e879f9" },      // ชมพูม่วง
];
