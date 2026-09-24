"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Award,
  BookOpen,
  GraduationCap,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  School,
  ArrowUpDown,
  SlidersHorizontal,
  Layers,
  Eye,
  X,
  Trophy,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
} from "lucide-react";
import { type SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import { getClassroomName } from "@/app/lib/classroom";

interface AnalyticsData {
  academic_year: string;
  term: string;
  term_key: string;
  kpi: {
    school_avg_percentage: number;
    total_students: number;
    total_classrooms: number;
    total_subjects: number;
    top_classroom: {
      classroom_id: string;
      classroom_name: string;
      overall_avg_percentage: number;
    } | null;
    lowest_classroom: {
      classroom_id: string;
      classroom_name: string;
      overall_avg_percentage: number;
    } | null;
    top_subject: {
      subject_id: string;
      subject_name: string;
      avg_percentage: number;
    } | null;
    lowest_subject: {
      subject_id: string;
      subject_name: string;
      avg_percentage: number;
    } | null;
    character_pass_rate: number;
    character_excellent_rate: number;
    rwt_pass_rate: number;
  };
  classrooms: Array<{
    classroom_id: string;
    classroom_name: string;
    classroom_name_thai?: string | null;
    classroom_name_rumi?: string | null;
    classroom_name_jawi?: string | null;
    student_count: number;
    overall_avg_percentage: number;
    gpa_avg: number;
    subjects: Array<{
      subject_id: string;
      subject_name: string;
      subject_type?: string;
      avg_percentage: number;
      graded_count: number;
    }>;
  }>;
  subjects: Array<{
    subject_id: string;
    subject_name: string;
    subject_type?: string;
    credit_hours?: number | null;
    avg_percentage: number;
    raw_avg_score?: number;
    max_possible_score?: number;
    highest_score: number;
    lowest_score: number;
    graded_students: number;
    pass_rate?: number;
    grade_distribution?: Array<{
      grade: string;
      count: number;
      percentage: number;
    }>;
    classroom_breakdown: Array<{
      classroom_id: string;
      classroom_name: string;
      student_count?: number;
      graded_count?: number;
      avg_percentage: number;
      raw_avg_score?: number;
    }>;
  }>;
  grade_distribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
  character_topics: Array<{
    topic_key: string;
    name: string;
    name_rumi?: string | null;
    name_jawi?: string | null;
    excellent: number;
    good: number;
    pass: number;
    fail: number;
    total: number;
    excellent_percent: number;
    pass_rate: number;
  }>;
  rwt_topics: Array<{
    topic_key: string;
    name: string;
    name_rumi?: string | null;
    name_jawi?: string | null;
    excellent: number;
    good: number;
    pass: number;
    fail: number;
    total: number;
    excellent_percent: number;
    pass_rate: number;
  }>;
}

interface AnalyticsDashboardTabProps {
  settingsList: SystemSetting[];
  selectedSettingId: number | null;
  setSelectedSettingId: (id: number) => void;
  token: string | null;
}

const GRADE_COLORS: Record<string, string> = {
  "4.0": "#10b981", // emerald-500
  "3.5": "#06b6d4", // cyan-500
  "3.0": "#3b82f6", // blue-500
  "2.5": "#6366f1", // indigo-500
  "2.0": "#f59e0b", // amber-500
  "1.5": "#f97316", // orange-500
  "1.0": "#ea580c", // orange-600
  "0.0": "#ef4444", // red-500
};

export default function AnalyticsDashboardTab({
  settingsList,
  selectedSettingId,
  setSelectedSettingId,
  token,
}: AnalyticsDashboardTabProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Navigation View: "all" (ภาพรวม) | "classrooms" (รายห้อง) | "subjects" (รายวิชา) | "evaluation" (คุณลักษณะ & RWT)
  const [activeView, setActiveView] = useState<"all" | "classrooms" | "subjects" | "evaluation">("all");
  
  // Classroom filters & selection
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("all");
  const [inspectClassroom, setInspectClassroom] = useState<AnalyticsData["classrooms"][number] | null>(null);
  const [classroomSortOrder, setClassroomSortOrder] = useState<"desc" | "asc">("desc");

  // Subject filters & selection
  const [subjectSearch, setSubjectSearch] = useState<string>("");
  const [subjectTypeFilter, setSubjectTypeFilter] = useState<"all" | "general" | "activity">("all");
  const [subjectSortOrder, setSubjectSortOrder] = useState<"desc" | "asc" | "pass_rate">("desc");
  const [selectedSubject, setSelectedSubject] = useState<AnalyticsData["subjects"][number] | null>(null);

  useEffect(() => {
    if (!selectedSettingId && settingsList.length > 0) {
      const active = settingsList.find((s) => s.is_active);
      setSelectedSettingId(active ? active.id : settingsList[0].id);
    }
  }, [settingsList, selectedSettingId, setSelectedSettingId]);

  const loadAnalyticsData = async () => {
    if (!selectedSettingId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?settingId=${selectedSettingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedSettingId, token]);

  // Ranked & Filtered Classrooms
  const rankedClassrooms = useMemo(() => {
    if (!data?.classrooms) return [];
    return [...data.classrooms].sort((a, b) =>
      classroomSortOrder === "desc"
        ? b.overall_avg_percentage - a.overall_avg_percentage
        : a.overall_avg_percentage - b.overall_avg_percentage
    );
  }, [data?.classrooms, classroomSortOrder]);

  const displayedClassrooms = useMemo(() => {
    if (selectedClassroomId === "all") return rankedClassrooms;
    return rankedClassrooms.filter((c) => c.classroom_id === selectedClassroomId);
  }, [rankedClassrooms, selectedClassroomId]);

  // Selected single classroom object for deep dive
  const currentFocusedClassroom = useMemo(() => {
    if (selectedClassroomId === "all" || !data?.classrooms) return null;
    return data.classrooms.find((c) => c.classroom_id === selectedClassroomId) || null;
  }, [data?.classrooms, selectedClassroomId]);

  // Filtered & Sorted Subjects
  const processedSubjects = useMemo(() => {
    if (!data?.subjects) return [];
    return data.subjects
      .filter((s) => {
        const matchesSearch = s.subject_name.toLowerCase().includes(subjectSearch.toLowerCase());
        const matchesType =
          subjectTypeFilter === "all"
            ? true
            : subjectTypeFilter === "activity"
            ? s.subject_type === "activity"
            : s.subject_type !== "activity";
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (subjectSortOrder === "pass_rate") {
          return (b.pass_rate ?? 0) - (a.pass_rate ?? 0);
        }
        return subjectSortOrder === "desc"
          ? b.avg_percentage - a.avg_percentage
          : a.avg_percentage - b.avg_percentage;
      });
  }, [data?.subjects, subjectSearch, subjectTypeFilter, subjectSortOrder]);

  // Evaluation Char stacked data for Recharts
  const characterChartData = useMemo(() => {
    if (!data?.character_topics) return [];
    return data.character_topics.map((t) => ({
      name: t.name,
      ดีเยี่ยม: t.excellent,
      ดี: t.good,
      ผ่าน: t.pass,
      ไม่ผ่าน: t.fail,
      total: t.total,
      pass_rate: t.pass_rate,
    }));
  }, [data?.character_topics]);

  // Evaluation RWT stacked data for Recharts
  const rwtChartData = useMemo(() => {
    if (!data?.rwt_topics) return [];
    return data.rwt_topics.map((t) => ({
      name: t.name,
      ดีเยี่ยม: t.excellent,
      ดี: t.good,
      ผ่าน: t.pass,
      ไม่ผ่าน: t.fail,
      total: t.total,
      pass_rate: t.pass_rate,
    }));
  }, [data?.rwt_topics]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in-up">
      {/* 1. Header Section */}
      <SectionHeader
        icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        color="purple"
        title="สถิติและการวิเคราะห์เชิงเปรียบเทียบ"
        subtitle="ระบบวิเคราะห์ผลสัมฤทธิ์ทางการเรียนและการประเมินคุณภาพ แยกหมวดหมู่รายห้องและรายวิชาอย่างเป็นระบบ"
      >
        <div className="flex items-center gap-3">
          <TermSelector
            settingsList={settingsList}
            selectedId={selectedSettingId}
            onSelect={(id) => setSelectedSettingId(id)}
          />
          <button
            onClick={loadAnalyticsData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all duration-200 shadow-sm flex items-center gap-2 text-sm font-semibold"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>
      </SectionHeader>

      {/* 2. Primary Navigation Bar - Categorized Distinctly */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-card border border-border/80 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-xl">
          <button
            onClick={() => setActiveView("all")}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeView === "all"
                ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>ภาพรวมทั้งหมด</span>
          </button>

          <button
            onClick={() => setActiveView("classrooms")}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeView === "classrooms"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <School className="w-4 h-4" />
            <span>สถิติรายห้องเรียน</span>
            {data?.classrooms && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                activeView === "classrooms" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {data.classrooms.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView("subjects")}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeView === "subjects"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>สถิติรายวิชา</span>
            {data?.subjects && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                activeView === "subjects" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {data.subjects.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView("evaluation")}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeView === "evaluation"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>คุณลักษณะ & RWT</span>
          </button>
        </div>

        {/* Global Classroom Filter if on Overview or Classroom tabs */}
        {(activeView === "all" || activeView === "classrooms") && (
          <div className="flex items-center gap-2 px-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">ตัวกรองห้องเรียน:</span>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="input-modern py-1.5 px-3 text-xs md:text-sm rounded-xl font-medium min-w-[200px]"
            >
              <option value="all">ทุกชั้นเรียน (รวมทั้งโรงเรียน)</option>
              {data?.classrooms
                .filter((c) => c.student_count > 0)
                .map((c) => (
                  <option key={c.classroom_id} value={c.classroom_id}>
                    {getClassroomName(c)} ({c.student_count} คน)
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading & Empty States */}
      {loading && !data ? (
        <div className="p-16 text-center card-modern">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-semibold">กำลังคำนวณและประมวลผลสถิติเชิงเปรียบเทียบ...</p>
        </div>
      ) : !data ? (
        <div className="p-12 text-center card-modern">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">ไม่พบข้อมูลสถิติของภาคเรียนนี้</h3>
          <p className="text-muted-foreground text-sm mt-1">กรุณาตรวจสอบว่ามีการเปิดรายวิชาและบันทึกคะแนนในระบบแล้ว</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 3. Top Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: School Average */}
            <div className="card-modern p-5 border-l-4 border-l-indigo-600 relative overflow-hidden group hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">คะแนนเฉลี่ยทั้งโรงเรียน</p>
                  <h3 className="text-3xl font-black text-foreground mt-2">
                    {data.kpi.school_avg_percentage}%
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>นักเรียน {data.kpi.total_students} คน · {data.kpi.total_classrooms} ห้องเรียน</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* KPI 2: Top Performing Classroom */}
            <div className="card-modern p-5 border-l-4 border-l-emerald-600 relative overflow-hidden group hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ห้องเรียนผลสัมฤทธิ์สูงสุด</p>
                  <h3 className="text-xl font-black text-foreground mt-2 truncate max-w-[180px]">
                    {data.kpi.top_classroom ? getClassroomName(data.kpi.top_classroom as any) : "-"}
                  </h3>
                  <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>คะแนนเฉลี่ย {data.kpi.top_classroom?.overall_avg_percentage}%</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* KPI 3: Top Performing Subject */}
            <div className="card-modern p-5 border-l-4 border-l-blue-600 relative overflow-hidden group hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">วิชาที่คะแนนเฉลี่ยสูงสุด</p>
                  <h3 className="text-xl font-black text-foreground mt-2 truncate max-w-[180px]">
                    {data.kpi.top_subject ? data.kpi.top_subject.subject_name : "-"}
                  </h3>
                  <p className="text-xs text-blue-600 font-bold mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>คะแนนเฉลี่ย {data.kpi.top_subject?.avg_percentage}%</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* KPI 4: Character Pass Rate */}
            <div className="card-modern p-5 border-l-4 border-l-purple-600 relative overflow-hidden group hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ผ่านการประเมินคุณลักษณะฯ</p>
                  <h3 className="text-3xl font-black text-foreground mt-2">
                    {data.kpi.character_pass_rate}%
                  </h3>
                  <p className="text-xs text-purple-600 font-bold mt-1">
                    ระดับดีเยี่ยม {data.kpi.character_excellent_rate}% · RWT ผ่าน {data.kpi.rwt_pass_rate}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Executive Highlights Comparison Banner (จุดเด่น vs จุดที่ควรพัฒนา) */}
          {activeView === "all" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Classroom Best vs Needs Attention */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-indigo-100/30 dark:from-indigo-950/30 dark:to-indigo-900/10 border border-indigo-200/60 dark:border-indigo-900/50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-200/50 dark:border-indigo-800/40">
                  <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <School className="w-4 h-4" /> ไฮไลท์ผลสัมฤทธิ์รายห้องเรียน
                  </span>
                  <button
                    onClick={() => setActiveView("classrooms")}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>ดูทั้งหมด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-card border border-border/60">
                    <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" /> อันดับ 1 ของโรงเรียน
                    </div>
                    <div className="font-extrabold text-foreground truncate mt-1">
                      {data.kpi.top_classroom ? getClassroomName(data.kpi.top_classroom as any) : "-"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      เฉลี่ย <span className="font-bold text-emerald-600">{data.kpi.top_classroom?.overall_avg_percentage}%</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border/60">
                    <div className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" /> ควรพัฒนาเพิ่มเติม
                    </div>
                    <div className="font-extrabold text-foreground truncate mt-1">
                      {data.kpi.lowest_classroom ? getClassroomName(data.kpi.lowest_classroom as any) : "-"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      เฉลี่ย <span className="font-bold text-amber-600">{data.kpi.lowest_classroom?.overall_avg_percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Best vs Needs Attention */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/10 border border-emerald-200/60 dark:border-emerald-900/50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/50 dark:border-emerald-800/40">
                  <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> ไฮไลท์ผลสัมฤทธิ์รายวิชา
                  </span>
                  <button
                    onClick={() => setActiveView("subjects")}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>ดูทั้งหมด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-card border border-border/60">
                    <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" /> คะแนนเฉลี่ยสูงสุด
                    </div>
                    <div className="font-extrabold text-foreground truncate mt-1">
                      {data.kpi.top_subject ? data.kpi.top_subject.subject_name : "-"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      เฉลี่ย <span className="font-bold text-emerald-600">{data.kpi.top_subject?.avg_percentage}%</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border/60">
                    <div className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" /> ควรพัฒนาเพิ่มเติม
                    </div>
                    <div className="font-extrabold text-foreground truncate mt-1">
                      {data.kpi.lowest_subject ? data.kpi.lowest_subject.subject_name : "-"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      เฉลี่ย <span className="font-bold text-amber-600">{data.kpi.lowest_subject?.avg_percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION BLOCK A: 🏫 สถิติและผลการเรียนรายห้องเรียน (Classroom Block)        */}
          {/* ========================================================================= */}
          {(activeView === "all" || activeView === "classrooms") && (
            <div className="space-y-6 pt-2">
              {/* Section Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">การวิเคราะห์ผลสัมฤทธิ์รายห้องเรียน</h3>
                    <p className="text-xs text-muted-foreground">
                      เปรียบเทียบคะแนนเฉลี่ยร้อยละและเกรดเฉลี่ย (GPA) ของแต่ละห้องเรียนเทียบกับเกณฑ์มาตรฐานโรงเรียน
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setClassroomSortOrder(classroomSortOrder === "desc" ? "asc" : "desc")}
                    className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition flex items-center gap-1.5"
                    title="สลับการเรียงลำดับ"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>เรียง: {classroomSortOrder === "desc" ? "คะแนนสูงสุด ➔ ต่ำสุด" : "คะแนนต่ำสุด ➔ สูงสุด"}</span>
                  </button>

                  {activeView === "all" && (
                    <button
                      onClick={() => setActiveView("classrooms")}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition"
                    >
                      ดูมุมมองห้องเรียนเต็มจอ ➔
                    </button>
                  )}
                </div>
              </div>

              {/* Classroom Charts & Selected Classroom Spotlight */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Chart: Classroom Comparison Bar Chart (lg:col-span-8 or 12) */}
                <div className={`${currentFocusedClassroom ? "lg:col-span-7" : "lg:col-span-12"} card-modern p-6`}>
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <div>
                      <h4 className="font-extrabold text-foreground text-base">เปรียบเทียบคะแนนเฉลี่ยระหว่างชั้นเรียน (%)</h4>
                      <p className="text-xs text-muted-foreground">
                        เส้นสีแดงคือเกณฑ์คะแนนเฉลี่ยของทั้งโรงเรียน ({data.kpi.school_avg_percentage}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                        <span>สูงกว่าเกณฑ์</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
                        <span>ต่ำกว่าเกณฑ์</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayedClassrooms.map((c) => ({
                          id: c.classroom_id,
                          name: getClassroomName(c),
                          คะแนนเฉลี่ย: c.overall_avg_percentage,
                          GPA: c.gpa_avg,
                          นักเรียน: c.student_count,
                        }))}
                        margin={{ top: 15, right: 20, left: -10, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "currentColor", fontSize: 11 }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                        />
                        <YAxis domain={[0, 100]} tick={{ fill: "currentColor", fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: any, name: any) => [
                            name === "คะแนนเฉลี่ย" ? `${value}%` : value,
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "1rem",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <ReferenceLine
                          y={data.kpi.school_avg_percentage}
                          stroke="#ef4444"
                          strokeDasharray="4 4"
                          label={{
                            value: `เกณฑ์โรงเรียน ${data.kpi.school_avg_percentage}%`,
                            fill: "#ef4444",
                            fontSize: 11,
                            position: "top",
                          }}
                        />
                        <Bar
                          dataKey="คะแนนเฉลี่ย"
                          fill="#6366f1"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={55}
                          onClick={(barData) => {
                            const found = data.classrooms.find((c) => c.classroom_id === (barData as any).id);
                            if (found) setInspectClassroom(found);
                          }}
                          className="cursor-pointer"
                        >
                          {displayedClassrooms.map((entry, index) => (
                            <Cell
                              key={`cell-cls-${index}`}
                              fill={
                                entry.overall_avg_percentage >= data.kpi.school_avg_percentage
                                  ? "#6366f1"
                                  : "#94a3b8"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Focused Single Classroom Panel (when a room is selected in filter) */}
                {currentFocusedClassroom && (
                  <div className="lg:col-span-5 card-modern p-6 flex flex-col justify-between space-y-4 border-2 border-indigo-500/20 bg-indigo-50/10 dark:bg-indigo-950/10">
                    <div>
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            ข้อมูลเจาะลึกเฉพาะห้องเรียน
                          </div>
                          <h4 className="text-lg font-black text-foreground">
                            {getClassroomName(currentFocusedClassroom)}
                          </h4>
                        </div>
                        <button
                          onClick={() => setSelectedClassroomId("all")}
                          className="text-xs text-muted-foreground hover:text-foreground font-bold px-2 py-1 rounded-lg bg-muted"
                          title="ดูทุกห้อง"
                        >
                          ล้างตัวกรอง
                        </button>
                      </div>

                      {/* Room Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="p-2.5 rounded-xl bg-card border border-border/80">
                          <div className="text-[10px] font-bold text-muted-foreground">จำนวนนักเรียน</div>
                          <div className="text-base font-black text-foreground">{currentFocusedClassroom.student_count} คน</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-card border border-border/80">
                          <div className="text-[10px] font-bold text-muted-foreground">คะแนนเฉลี่ย</div>
                          <div className="text-base font-black text-indigo-600">{currentFocusedClassroom.overall_avg_percentage}%</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-card border border-border/80">
                          <div className="text-[10px] font-bold text-muted-foreground">เกรดเฉลี่ย (GPA)</div>
                          <div className="text-base font-black text-emerald-600">{currentFocusedClassroom.gpa_avg.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Subjects in this classroom */}
                      <div className="mt-4">
                        <div className="text-xs font-bold text-foreground mb-2 flex items-center justify-between">
                          <span>คะแนนเฉลี่ยรายวิชาในห้องนี้:</span>
                          <span className="text-[11px] text-muted-foreground">{currentFocusedClassroom.subjects.length} วิชา</span>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                          {currentFocusedClassroom.subjects.length === 0 ? (
                            <div className="text-xs text-muted-foreground text-center py-4">
                              ยังไม่มีข้อมูลรายวิชาในห้องเรียนนี้
                            </div>
                          ) : (
                            currentFocusedClassroom.subjects.map((sub) => {
                              const isPassing = sub.avg_percentage >= 50;
                              return (
                                <div
                                  key={sub.subject_id}
                                  className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="truncate flex-1">
                                    <div className="font-bold text-foreground truncate">{sub.subject_name}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      ประเมินแล้ว {sub.graded_count} คน
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`font-black ${isPassing ? "text-foreground" : "text-rose-600"}`}>
                                      {sub.avg_percentage}%
                                    </div>
                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                                      <div
                                        className={`h-full rounded-full ${
                                          sub.avg_percentage >= data.kpi.school_avg_percentage
                                            ? "bg-indigo-600"
                                            : isPassing
                                            ? "bg-amber-500"
                                            : "bg-rose-500"
                                        }`}
                                        style={{ width: `${Math.min(100, sub.avg_percentage)}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setInspectClassroom(currentFocusedClassroom)}
                      className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>เปิดตารางวิเคราะห์ฉบับเต็มของห้องนี้</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Classroom Detailed Ranking Table */}
              <div className="card-modern overflow-hidden">
                <div className="p-5 border-b border-border/80 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="font-extrabold text-foreground text-base">
                      ตารางจัดอันดับและเปรียบเทียบผลสัมฤทธิ์รายห้องเรียน
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      เรียงลำดับผลการเรียน ค่าเฉลี่ยร้อยละ และเกรดเฉลี่ย (GPA) ทั้งหมด {displayedClassrooms.length} ห้องเรียน
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    คลิกที่แถวห้องเรียนเพื่อดูคะแนนรายวิชาภายในห้อง
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/60 text-muted-foreground text-xs uppercase font-bold border-b border-border">
                      <tr>
                        <th className="px-5 py-3.5 text-center w-16">อันดับ</th>
                        <th className="px-5 py-3.5">ชั้นเรียน</th>
                        <th className="px-5 py-3.5 text-center">จำนวนนักเรียน</th>
                        <th className="px-5 py-3.5 text-right">คะแนนเฉลี่ย (%)</th>
                        <th className="px-5 py-3.5 text-right">เกรดเฉลี่ย (GPA)</th>
                        <th className="px-5 py-3.5 text-center">เทียบเกณฑ์โรงเรียน ({data.kpi.school_avg_percentage}%)</th>
                        <th className="px-5 py-3.5 text-center">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayedClassrooms.map((cls, idx) => {
                        const diff = cls.overall_avg_percentage - data.kpi.school_avg_percentage;
                        const isAbove = diff >= 0;
                        const rankNumber = idx + 1;

                        return (
                          <tr
                            key={cls.classroom_id}
                            className="hover:bg-muted/40 transition cursor-pointer"
                            onClick={() => setInspectClassroom(cls)}
                          >
                            {/* Rank Badge */}
                            <td className="px-5 py-4 text-center">
                              {rankNumber === 1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 font-black text-xs border border-amber-500/30">
                                  🥇 1
                                </span>
                              ) : rankNumber === 2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-600 dark:text-slate-300 font-black text-xs border border-slate-400/30">
                                  🥈 2
                                </span>
                              ) : rankNumber === 3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-700/20 text-orange-700 dark:text-orange-300 font-black text-xs border border-orange-700/30">
                                  🥉 3
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-muted-foreground">
                                  #{rankNumber}
                                </span>
                              )}
                            </td>

                            {/* Classroom Name */}
                            <td className="px-5 py-4 font-bold text-foreground">
                              <div className="flex items-center gap-2">
                                <School className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span>{getClassroomName(cls)}</span>
                              </div>
                            </td>

                            {/* Student Count */}
                            <td className="px-5 py-4 text-center text-muted-foreground font-medium">
                              {cls.student_count} คน
                            </td>

                            {/* Average Percentage */}
                            <td className="px-5 py-4 text-right">
                              <div className="font-black text-foreground text-base">
                                {cls.overall_avg_percentage}%
                              </div>
                              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden ml-auto mt-1">
                                <div
                                  className={`h-full rounded-full ${
                                    isAbove ? "bg-indigo-600" : "bg-slate-400"
                                  }`}
                                  style={{ width: `${Math.min(100, cls.overall_avg_percentage)}%` }}
                                />
                              </div>
                            </td>

                            {/* GPA */}
                            <td className="px-5 py-4 text-right">
                              <span className="font-extrabold text-foreground px-2.5 py-1 rounded-lg bg-muted text-sm">
                                {cls.gpa_avg.toFixed(2)}
                              </span>
                            </td>

                            {/* Comparison to school */}
                            <td className="px-5 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  isAbove
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                }`}
                              >
                                {isAbove ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {isAbove ? `สูงกว่าเกณฑ์ +${diff.toFixed(1)}%` : `ต่ำกว่าเกณฑ์ ${diff.toFixed(1)}%`}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectClassroom(cls);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>ดูรายวิชา</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION BLOCK B: 📚 สถิติและผลการเรียนรายวิชา (Subject Block)              */}
          {/* ========================================================================= */}
          {(activeView === "all" || activeView === "subjects") && (
            <div className="space-y-6 pt-6">
              {/* Section Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">การวิเคราะห์ผลสัมฤทธิ์รายวิชา</h3>
                    <p className="text-xs text-muted-foreground">
                      วิเคราะห์ผลการเรียนเฉลี่ย อัตราผ่านเกณฑ์ คะแนนสูงสุด-ต่ำสุด และการกระจายตัวของเกรดแยกตามรายวิชา
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Subject */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อวิชา..."
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="input-modern pl-8 pr-3 py-1.5 text-xs rounded-xl w-44 font-medium"
                    />
                  </div>

                  {/* Filter Subject Type */}
                  <select
                    value={subjectTypeFilter}
                    onChange={(e) => setSubjectTypeFilter(e.target.value as any)}
                    className="input-modern py-1.5 px-3 text-xs rounded-xl font-medium"
                  >
                    <option value="all">ทุกกลุ่มวิชา</option>
                    <option value="general">วิชาพื้นฐาน / เพิ่มเติม</option>
                    <option value="activity">กิจกรรมพัฒนาผู้เรียน</option>
                  </select>

                  {/* Sort Order */}
                  <select
                    value={subjectSortOrder}
                    onChange={(e) => setSubjectSortOrder(e.target.value as any)}
                    className="input-modern py-1.5 px-3 text-xs rounded-xl font-medium"
                  >
                    <option value="desc">คะแนนเฉลี่ยสูงสุด ➔ ต่ำสุด</option>
                    <option value="asc">คะแนนเฉลี่ยต่ำสุด ➔ สูงสุด</option>
                    <option value="pass_rate">อัตราผ่านเกณฑ์สูงสุด</option>
                  </select>

                  {activeView === "all" && (
                    <button
                      onClick={() => setActiveView("subjects")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      ดูมุมมองรายวิชาเต็มจอ ➔
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Visual Charts: Ranked Subjects + Grade Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Chart 1: Subject Performance Ranked Bar Chart (8 cols) */}
                <div className="lg:col-span-8 card-modern p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-extrabold text-foreground text-base">แผนภูมิผลสัมฤทธิ์รายวิชา (%)</h4>
                      <p className="text-xs text-muted-foreground">
                        คะแนนเฉลี่ยของแต่ละวิชา เทียบกับเกณฑ์มาตรฐานโรงเรียน ({data.kpi.school_avg_percentage}%)
                      </p>
                    </div>
                  </div>

                  <div className="h-[340px] w-full">
                    {processedSubjects.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        ไม่พบรายวิชาที่ตรงกับเงื่อนไขการค้นหา
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={processedSubjects.map((s) => ({
                            id: s.subject_id,
                            name: s.subject_name,
                            คะแนนเฉลี่ย: s.avg_percentage,
                            นักเรียน: s.graded_students,
                            อัตราผ่าน: s.pass_rate,
                          }))}
                          margin={{ top: 15, right: 20, left: -10, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "currentColor", fontSize: 11 }}
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                          />
                          <YAxis domain={[0, 100]} tick={{ fill: "currentColor", fontSize: 12 }} />
                          <Tooltip
                            formatter={(value: any, name: any) => [
                              name === "คะแนนเฉลี่ย" ? `${value}%` : value,
                              name,
                            ]}
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              borderRadius: "1rem",
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <ReferenceLine
                            y={data.kpi.school_avg_percentage}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            label={{
                              value: `เกณฑ์โรงเรียน ${data.kpi.school_avg_percentage}%`,
                              fill: "#ef4444",
                              fontSize: 11,
                              position: "top",
                            }}
                          />
                          <Bar
                            dataKey="คะแนนเฉลี่ย"
                            fill="#3b82f6"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={45}
                            onClick={(barData) => {
                              const found = data.subjects.find((s) => s.subject_id === (barData as any).id);
                              if (found) setSelectedSubject(found);
                            }}
                            className="cursor-pointer"
                          >
                            {processedSubjects.map((entry, index) => (
                              <Cell
                                key={`cell-subj-${index}`}
                                fill={
                                  entry.avg_percentage >= data.kpi.school_avg_percentage
                                    ? "#3b82f6"
                                    : "#f59e0b"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 2: Grade Distribution Breakdown across School (4 cols) */}
                <div className="lg:col-span-4 card-modern p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-foreground text-base">สัดส่วนระดับผลการเรียน</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      การกระจายตัวของเกรด 0.0 - 4.0 ทั้งหมดในภาคเรียน
                    </p>

                    <div className="h-[220px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.grade_distribution}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="grade" tick={{ fill: "currentColor", fontSize: 11 }} />
                          <YAxis tick={{ fill: "currentColor", fontSize: 11 }} />
                          <Tooltip
                            formatter={(value: any) => [`${value} วิชา/คน`, "จำนวน"]}
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              borderRadius: "0.75rem",
                              border: "1px solid #e2e8f0",
                            }}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {data.grade_distribution.map((entry, index) => (
                              <Cell
                                key={`cell-grade-${index}`}
                                fill={GRADE_COLORS[entry.grade] || "#6366f1"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="grid grid-cols-4 gap-1.5 pt-4 border-t border-border/60 text-center">
                    {data.grade_distribution.slice(0, 4).map((g) => (
                      <div key={g.grade} className="p-1.5 rounded-lg bg-muted/60">
                        <div className="text-[10px] font-bold text-muted-foreground">เกรด {g.grade}</div>
                        <div className="text-xs font-black text-foreground">{g.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subject Detailed Breakdown Table */}
              <div className="card-modern overflow-hidden">
                <div className="p-5 border-b border-border/80 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="font-extrabold text-foreground text-base">
                      ตารางสถิติและผลสัมฤทธิ์รายวิชาเชิงลึก
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      แสดงผลการประเมิน อัตราการผ่านเกณฑ์ คะแนนสูงสุด/ต่ำสุด และสัดส่วนเกรด (คลิกเพื่อดูผลแยกรายห้องเรียน)
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    พบ {processedSubjects.length} รายวิชา
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/60 text-muted-foreground text-xs uppercase font-bold border-b border-border">
                      <tr>
                        <th className="px-5 py-3.5">ชื่อรายวิชา</th>
                        <th className="px-5 py-3.5 text-center">ประเมินแล้ว</th>
                        <th className="px-5 py-3.5 text-right">คะแนนเฉลี่ย (%)</th>
                        <th className="px-5 py-3.5 text-right">อัตราผ่านเกณฑ์</th>
                        <th className="px-5 py-3.5 text-center">สูงสุด / ต่ำสุด</th>
                        <th className="px-5 py-3.5 text-center">การกระจายเกรด (0-4)</th>
                        <th className="px-5 py-3.5 text-center">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {processedSubjects.map((sub) => {
                        const isAbove = sub.avg_percentage >= data.kpi.school_avg_percentage;
                        return (
                          <tr
                            key={sub.subject_id}
                            className="hover:bg-muted/40 transition cursor-pointer"
                            onClick={() => setSelectedSubject(sub)}
                          >
                            <td className="px-5 py-4">
                              <div className="font-bold text-foreground">{sub.subject_name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  sub.subject_type === "activity"
                                    ? "bg-purple-500/10 text-purple-600"
                                    : "bg-blue-500/10 text-blue-600"
                                }`}>
                                  {sub.subject_type === "activity" ? "กิจกรรมพัฒนาผู้เรียน" : "วิชาพื้นฐาน/เพิ่มเติม"}
                                </span>
                                {sub.credit_hours ? <span>· {sub.credit_hours} หน่วยกิต</span> : ""}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-center font-medium text-muted-foreground">
                              {sub.graded_students} คน
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="font-black text-foreground text-base">{sub.avg_percentage}%</div>
                              {sub.raw_avg_score !== undefined && (
                                <div className="text-[11px] text-muted-foreground">
                                  ดิบ {sub.raw_avg_score}/{sub.max_possible_score || 100}
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                  (sub.pass_rate ?? 0) >= 80
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                    : (sub.pass_rate ?? 0) >= 50
                                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                }`}
                              >
                                {sub.pass_rate !== undefined ? `${sub.pass_rate}%` : "-"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center font-bold text-xs">
                              <span className="text-emerald-600 font-extrabold">{sub.highest_score}</span>
                              <span className="text-muted-foreground mx-1.5">/</span>
                              <span className="text-rose-600 font-extrabold">{sub.lowest_score}</span>
                            </td>

                            <td className="px-5 py-4">
                              {sub.grade_distribution && sub.grade_distribution.length > 0 ? (
                                <div className="w-32 h-2.5 bg-muted rounded-full overflow-hidden flex mx-auto">
                                  {sub.grade_distribution.map((g) => (
                                    <div
                                      key={g.grade}
                                      style={{
                                        width: `${g.percentage}%`,
                                        backgroundColor: GRADE_COLORS[g.grade] || "#6366f1",
                                      }}
                                      title={`เกรด ${g.grade}: ${g.count} คน (${g.percentage}%)`}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-xs text-muted-foreground">-</div>
                              )}
                            </td>

                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubject(sub);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>ดูรายห้อง</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION BLOCK C: 🌟 คุณลักษณะอันพึงประสงค์ & RWT (Evaluation Block)          */}
          {/* ========================================================================= */}
          {(activeView === "all" || activeView === "evaluation") && (
            <div className="space-y-6 pt-6">
              {/* Section Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-purple-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">
                      การประเมินคุณลักษณะอันพึงประสงค์ & RWT (อ่าน คิดวิเคราะห์ เขียน)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      สัดส่วนผลการประเมินระดับ ดีเยี่ยม (3), ดี (2), ผ่าน (1) และ ไม่ผ่าน (0) แยกตามหัวข้อสมรรถนะ
                    </p>
                  </div>
                </div>

                {activeView === "all" && (
                  <button
                    onClick={() => setActiveView("evaluation")}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-bold hover:bg-purple-100 transition"
                  >
                    ดูมุมมองคุณลักษณะเต็มจอ ➔
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Character Evaluation Stacked Bar Chart */}
                <div className="card-modern p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-extrabold text-foreground text-base">
                      คุณลักษณะอันพึงประสงค์ (แยกตามหัวข้อ)
                    </h4>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600">
                      ผ่านเฉลี่ย {data.kpi.character_pass_rate}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    สัดส่วนระดับผลการประเมิน: ดีเยี่ยม (3), ดี (2), ผ่าน (1), ไม่ผ่าน (0)
                  </p>

                  <div className="h-[320px] w-full">
                    {characterChartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        ยังไม่มีข้อมูลการประเมินคุณลักษณะฯ ในภาคเรียนนี้
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={characterChartData}
                          margin={{ top: 10, right: 10, left: -15, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "currentColor", fontSize: 11 }}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                          />
                          <YAxis tick={{ fill: "currentColor", fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              borderRadius: "0.75rem",
                              border: "1px solid #e2e8f0",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="ดีเยี่ยม" stackId="a" fill="#10b981" />
                          <Bar dataKey="ดี" stackId="a" fill="#3b82f6" />
                          <Bar dataKey="ผ่าน" stackId="a" fill="#f59e0b" />
                          <Bar dataKey="ไม่ผ่าน" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* RWT Evaluation Stacked Bar Chart */}
                <div className="card-modern p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-extrabold text-foreground text-base">
                      การอ่าน คิดวิเคราะห์ และเขียน (RWT 5 ด้าน)
                    </h4>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                      ผ่านเฉลี่ย {data.kpi.rwt_pass_rate}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    สัดส่วนระดับผลการประเมินตามสมรรถนะสำคัญของผู้เรียน 5 ด้าน
                  </p>

                  <div className="h-[320px] w-full">
                    {rwtChartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        ยังไม่มีข้อมูลการประเมิน RWT ในภาคเรียนนี้
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={rwtChartData}
                          margin={{ top: 10, right: 10, left: -15, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "currentColor", fontSize: 11 }}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                          />
                          <YAxis tick={{ fill: "currentColor", fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              borderRadius: "0.75rem",
                              border: "1px solid #e2e8f0",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="ดีเยี่ยม" stackId="a" fill="#10b981" />
                          <Bar dataKey="ดี" stackId="a" fill="#3b82f6" />
                          <Bar dataKey="ผ่าน" stackId="a" fill="#f59e0b" />
                          <Bar dataKey="ไม่ผ่าน" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 1: รายละเอียดวิชาเชิงลึกและผลสัมฤทธิ์แยกตามห้องเรียน (Subject Modal)  */}
          {/* ========================================================================= */}
          {selectedSubject && (
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setSelectedSubject(null)}
            >
              <div
                className="bg-card border border-border rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div>
                    <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-emerald-600" />
                      <span>{selectedSubject.subject_name}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedSubject.subject_type === "activity" ? "กิจกรรมพัฒนาผู้เรียน" : "วิชาพื้นฐาน/เพิ่มเติม"}
                      {selectedSubject.credit_hours ? ` · หน่วยกิต: ${selectedSubject.credit_hours}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground font-bold transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Subject KPI Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">คะแนนเฉลี่ย</div>
                    <div className="text-xl font-black text-foreground">{selectedSubject.avg_percentage}%</div>
                    {selectedSubject.raw_avg_score !== undefined && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">ดิบ {selectedSubject.raw_avg_score} คะแนน</div>
                    )}
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">อัตราผ่านเกณฑ์</div>
                    <div className="text-xl font-black text-foreground">{selectedSubject.pass_rate ?? "-"}%</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">ประเมินแล้ว {selectedSubject.graded_students} คน</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50">
                    <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400">คะแนนสูงสุด</div>
                    <div className="text-xl font-black text-foreground">{selectedSubject.highest_score}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">เต็ม {selectedSubject.max_possible_score || 100}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                    <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">คะแนนต่ำสุด</div>
                    <div className="text-xl font-black text-foreground">{selectedSubject.lowest_score}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">เต็ม {selectedSubject.max_possible_score || 100}</div>
                  </div>
                </div>

                {/* Grade Distribution Breakdown for this Subject */}
                {selectedSubject.grade_distribution && selectedSubject.grade_distribution.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                      การกระจายระดับผลการเรียนในรายวิชานี้ (เกรด 0.0 - 4.0)
                    </h5>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {selectedSubject.grade_distribution.map((g) => (
                        <div
                          key={g.grade}
                          className="p-2.5 rounded-xl border border-border/80 text-center bg-card"
                          style={{ borderTop: `3px solid ${GRADE_COLORS[g.grade] || "#6366f1"}` }}
                        >
                          <div className="text-xs font-bold text-foreground">เกรด {g.grade}</div>
                          <div className="text-sm font-black text-foreground mt-0.5">{g.count} คน</div>
                          <div className="text-[10px] text-muted-foreground">{g.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breakdown by Classroom */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <School className="w-4 h-4 text-indigo-500" />
                    <span>เปรียบเทียบผลสัมฤทธิ์ของวิชานี้ แยกตามห้องเรียน</span>
                  </h5>
                  <div className="border border-border rounded-2xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/60 text-muted-foreground text-xs uppercase font-bold border-b border-border">
                        <tr>
                          <th className="px-4 py-2.5">ห้องเรียน</th>
                          <th className="px-4 py-2.5 text-center">นักเรียนที่ประเมิน</th>
                          <th className="px-4 py-2.5 text-right">คะแนนเฉลี่ย (%)</th>
                          <th className="px-4 py-2.5 text-right">คะแนนดิบเฉลี่ย</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedSubject.classroom_breakdown.map((cls) => (
                          <tr key={cls.classroom_id} className="hover:bg-muted/30">
                            <td className="px-4 py-2.5 font-bold text-foreground">{cls.classroom_name}</td>
                            <td className="px-4 py-2.5 text-center text-muted-foreground">
                              {cls.graded_count ?? 0} / {cls.student_count ?? "-"} คน
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-indigo-600 dark:text-indigo-400">
                              {cls.avg_percentage}%
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                              {cls.raw_avg_score !== undefined ? `${cls.raw_avg_score.toFixed(1)} คะแนน` : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 2: รายละเอียดผลสัมฤทธิ์รายวิชาภายในห้องเรียน (Classroom Modal)         */}
          {/* ========================================================================= */}
          {inspectClassroom && (
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setInspectClassroom(null)}
            >
              <div
                className="bg-card border border-border rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div>
                    <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                      <School className="w-6 h-6 text-indigo-600" />
                      <span>{getClassroomName(inspectClassroom)}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      สรุปผลสัมฤทธิ์การเรียนและผลการประเมินแยกตามรายวิชาภายในห้องเรียนนี้
                    </p>
                  </div>
                  <button
                    onClick={() => setInspectClassroom(null)}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground font-bold transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Classroom Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">จำนวนนักเรียน</div>
                    <div className="text-xl font-black text-foreground">{inspectClassroom.student_count} คน</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">คะแนนเฉลี่ยร้อยละ</div>
                    <div className="text-xl font-black text-foreground">{inspectClassroom.overall_avg_percentage}%</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      เทียบเกณฑ์ {data.kpi.school_avg_percentage}% ({inspectClassroom.overall_avg_percentage >= data.kpi.school_avg_percentage ? "+" : ""}
                      {(inspectClassroom.overall_avg_percentage - data.kpi.school_avg_percentage).toFixed(1)}%)
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                    <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">เกรดเฉลี่ย (GPA)</div>
                    <div className="text-xl font-black text-foreground">{inspectClassroom.gpa_avg.toFixed(2)}</div>
                  </div>
                </div>

                {/* Subjects Table within this classroom */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                    <span>รายวิชาที่สอนในห้องเรียนนี้ ({inspectClassroom.subjects.length} วิชา)</span>
                  </h5>
                  <div className="border border-border rounded-2xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/60 text-muted-foreground text-xs uppercase font-bold border-b border-border">
                        <tr>
                          <th className="px-4 py-2.5">ชื่อรายวิชา</th>
                          <th className="px-4 py-2.5 text-center">นักเรียนที่บันทึกคะแนน</th>
                          <th className="px-4 py-2.5 text-right">คะแนนเฉลี่ย (%)</th>
                          <th className="px-4 py-2.5 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {inspectClassroom.subjects.map((sub) => {
                          const isAboveSchool = sub.avg_percentage >= data.kpi.school_avg_percentage;
                          return (
                            <tr key={sub.subject_id} className="hover:bg-muted/30">
                              <td className="px-4 py-3">
                                <div className="font-bold text-foreground">{sub.subject_name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {sub.subject_type === "activity" ? "กิจกรรมพัฒนาผู้เรียน" : "วิชาพื้นฐาน/เพิ่มเติม"}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground">
                                {sub.graded_count} / {inspectClassroom.student_count} คน
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="font-black text-foreground">{sub.avg_percentage}%</div>
                                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden ml-auto mt-1">
                                  <div
                                    className={`h-full rounded-full ${
                                      isAboveSchool ? "bg-indigo-600" : "bg-amber-500"
                                    }`}
                                    style={{ width: `${Math.min(100, sub.avg_percentage)}%` }}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    isAboveSchool
                                      ? "bg-emerald-500/10 text-emerald-600"
                                      : "bg-amber-500/10 text-amber-600"
                                  }`}
                                >
                                  {isAboveSchool ? "สูงกว่าเกณฑ์" : "ต่ำกว่าเกณฑ์"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
