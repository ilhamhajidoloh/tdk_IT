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
    highest_score: number;
    lowest_score: number;
    graded_students: number;
    classroom_breakdown: Array<{
      classroom_id: string;
      classroom_name: string;
      avg_percentage: number;
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
  const [activeView, setActiveView] = useState<"all" | "academic" | "evaluation">("all");
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("all");
  const [subjectSortOrder, setSubjectSortOrder] = useState<"desc" | "asc">("desc");

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

  // Filtered Classrooms
  const displayedClassrooms = useMemo(() => {
    if (!data?.classrooms) return [];
    if (selectedClassroomId === "all") return data.classrooms;
    return data.classrooms.filter((c) => c.classroom_id === selectedClassroomId);
  }, [data?.classrooms, selectedClassroomId]);

  // Filtered & Sorted Subjects
  const sortedSubjects = useMemo(() => {
    if (!data?.subjects) return [];
    const filtered = data.subjects.filter((s) => s.graded_students > 0);
    return [...filtered].sort((a, b) =>
      subjectSortOrder === "desc"
        ? b.avg_percentage - a.avg_percentage
        : a.avg_percentage - b.avg_percentage
    );
  }, [data?.subjects, subjectSortOrder]);

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
    <div className="p-8 animate-fade-in-up">
      {/* Header */}
      <SectionHeader
        icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        color="purple"
        title="สถิติและการวิเคราะห์เชิงเปรียบเทียบ"
        subtitle="วิเคราะห์ผลสัมฤทธิ์ทางการเรียนและการประเมินคุณลักษณะฯ แยกตามรายวิชาและชั้นเรียน"
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
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all duration-200 shadow-sm flex items-center gap-2 text-sm font-medium"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>
      </SectionHeader>

      {/* View Filter Mode Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-card border border-border/80 p-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl">
          <button
            onClick={() => setActiveView("all")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeView === "all"
                ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📊 ภาพรวมทั้งหมด
          </button>
          <button
            onClick={() => setActiveView("academic")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeView === "academic"
                ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🎓 ผลการเรียนรายวิชา & ชั้นเรียน
          </button>
          <button
            onClick={() => setActiveView("evaluation")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeView === "evaluation"
                ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🌟 ผลการประเมินคุณลักษณะ & RWT
          </button>
        </div>

        {/* Classroom Quick Selector Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">ชั้นเรียน:</span>
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="input-modern py-1.5 px-3 text-sm rounded-xl font-medium"
          >
            <option value="all">ทุกชั้นเรียน (รวมทั้งโรงเรียน)</option>
            {data?.classrooms.map((c) => (
              <option key={c.classroom_id} value={c.classroom_id}>
                {getClassroomName(c)} ({c.student_count} คน)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !data ? (
        <div className="p-16 text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">กำลังคำนวณและประมวลผลสถิติ...</p>
        </div>
      ) : !data ? (
        <div className="p-12 text-center card-modern">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">ไม่พบข้อมูลสถิติของภาคเรียนนี้</h3>
          <p className="text-muted-foreground text-sm mt-1">กรุณาตรวจสอบว่ามีการเปิดรายวิชาและบันทึกคะแนนในระบบแล้ว</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {/* KPI 1: School Average */}
            <div className="card-modern p-5 border-l-4 border-l-indigo-600 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">คะแนนเฉลี่ยทั้งโรงเรียน</p>
                  <h3 className="text-3xl font-black text-foreground mt-2">
                    {data.kpi.school_avg_percentage}%
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    จากนักเรียนทั้งหมด {data.kpi.total_students} คน
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* KPI 2: Top Performing Classroom */}
            <div className="card-modern p-5 border-l-4 border-l-emerald-600 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ห้องเรียนผลสัมฤทธิ์สูงสุด</p>
                  <h3 className="text-xl font-extrabold text-foreground mt-2 truncate max-w-[180px]">
                    {data.kpi.top_classroom ? getClassroomName(data.kpi.top_classroom as any) : "-"}
                  </h3>
                  <p className="text-xs text-emerald-600 font-bold mt-1">
                    เฉลี่ย {data.kpi.top_classroom?.overall_avg_percentage}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* KPI 3: Top Performing Subject */}
            <div className="card-modern p-5 border-l-4 border-l-blue-600 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">วิชาที่คะแนนเฉลี่ยสูงสุด</p>
                  <h3 className="text-xl font-extrabold text-foreground mt-2 truncate max-w-[180px]">
                    {data.kpi.top_subject ? data.kpi.top_subject.subject_name : "-"}
                  </h3>
                  <p className="text-xs text-blue-600 font-bold mt-1">
                    เฉลี่ย {data.kpi.top_subject?.avg_percentage}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* KPI 4: Character Pass Rate */}
            <div className="card-modern p-5 border-l-4 border-l-purple-600 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ผ่านการประเมินคุณลักษณะฯ</p>
                  <h3 className="text-3xl font-black text-foreground mt-2">
                    {data.kpi.character_pass_rate}%
                  </h3>
                  <p className="text-xs text-purple-600 font-bold mt-1">
                    ระดับดีเยี่ยม {data.kpi.character_excellent_rate}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Charts Section: Academic Comparisons */}
          {(activeView === "all" || activeView === "academic") && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border/80 pb-3">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-foreground">การเปรียบเทียบผลสัมฤทธิ์ทางการเรียน</h3>
              </div>

              {/* Grid 2 Columns: Classroom Comparison & Grade Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Chart 1: Classroom Average Comparison (8 cols) */}
                <div className="lg:col-span-8 card-modern p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="font-extrabold text-foreground text-base">เปรียบเทียบคะแนนเฉลี่ยระหว่างชั้นเรียน (%)</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        เปรียบเทียบคะแนนเฉลี่ยร้อยละของแต่ละห้องเรียน กับเส้นเกณฑ์เฉลี่ยโรงเรียน ({data.kpi.school_avg_percentage}%)
                      </p>
                    </div>
                  </div>

                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayedClassrooms.map((c) => ({
                          name: getClassroomName(c),
                          คะแนนเฉลี่ย: c.overall_avg_percentage,
                          GPA: c.gpa_avg,
                          นักเรียน: c.student_count,
                        }))}
                        margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "currentColor", fontSize: 12 }}
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
                          maxBarSize={50}
                        >
                          {displayedClassrooms.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
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

                {/* Chart 2: Grade Distribution (4 cols) */}
                <div className="lg:col-span-4 card-modern p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-foreground text-base">สัดส่วนระดับผลการเรียน</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      การกระจายตัวของเกรด 0 - 4 ทั้งหมดในระบบ
                    </p>

                    <div className="h-[240px] w-full mt-4">
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
                      <div key={g.grade} className="p-1.5 rounded-lg bg-muted/50">
                        <div className="text-[11px] font-bold text-muted-foreground">เกรด {g.grade}</div>
                        <div className="text-xs font-black text-foreground">{g.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart 3: Subject Performance Breakdown (Horizontal / Ranked) */}
              <div className="card-modern p-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                  <div>
                    <h4 className="font-extrabold text-foreground text-base">วิเคราะห์ผลสัมฤทธิ์รายวิชา (%)</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      คะแนนเฉลี่ยร้อยละของแต่ละวิชา เรียงลำดับตามผลสัมฤทธิ์
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSubjectSortOrder(subjectSortOrder === "desc" ? "asc" : "desc")}
                      className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition"
                    >
                      เรียงลำดับ: {subjectSortOrder === "desc" ? "คะแนนสูงสุด ➔ ต่ำสุด" : "คะแนนต่ำสุด ➔ สูงสุด"}
                    </button>
                  </div>
                </div>

                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedSubjects.map((s) => ({
                        name: s.subject_name,
                        คะแนนเฉลี่ย: s.avg_percentage,
                        นักเรียนที่ประเมิน: s.graded_students,
                      }))}
                      margin={{ top: 10, right: 20, left: -10, bottom: 40 }}
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
                      />
                      <Bar
                        dataKey="คะแนนเฉลี่ย"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={45}
                      >
                        {sortedSubjects.map((entry, index) => (
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
                </div>
              </div>
            </div>
          )}

          {/* 3. Charts Section: Evaluation (Character & RWT) */}
          {(activeView === "all" || activeView === "evaluation") && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2 border-b border-border/80 pb-3">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-extrabold text-foreground">
                  ผลการประเมินคุณลักษณะอันพึงประสงค์ & การอ่าน คิดวิเคราะห์ เขียน
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Character Evaluation Stacked Bar Chart */}
                <div className="card-modern p-6">
                  <h4 className="font-extrabold text-foreground text-base mb-1">
                    คุณลักษณะอันพึงประสงค์ (แยกตามหัวข้อ)
                  </h4>
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
                          margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
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
                  <h4 className="font-extrabold text-foreground text-base mb-1">
                    การอ่าน คิดวิเคราะห์ และเขียน (RWT 5 ด้าน)
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    สัดส่วนระดับผลการประเมินตามสมรรถนะสำคัญของผู้เรียน
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
                          margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
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

          {/* 4. Detailed Summary Table */}
          <div className="card-modern overflow-hidden">
            <div className="p-5 border-b border-border/80 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-foreground text-base">สรุปผลสัมฤทธิ์เชิงเปรียบเทียบตามห้องเรียน</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ตารางแสดงข้อมูลสรุปคะแนนเฉลี่ย เกรดเฉลี่ย GPA และจำนวนนักเรียน
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/60 text-muted-foreground text-xs uppercase font-bold border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5">ชั้นเรียน</th>
                    <th className="px-6 py-3.5 text-center">จำนวนนักเรียน</th>
                    <th className="px-6 py-3.5 text-right">คะแนนเฉลี่ยร้อยละ (%)</th>
                    <th className="px-6 py-3.5 text-right">เกรดเฉลี่ย (GPA)</th>
                    <th className="px-6 py-3.5 text-center">สถานะเทียบเกณฑ์โรงเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedClassrooms.map((cls) => {
                    const diff = cls.overall_avg_percentage - data.kpi.school_avg_percentage;
                    const isAbove = diff >= 0;
                    return (
                      <tr key={cls.classroom_id} className="hover:bg-muted/30 transition">
                        <td className="px-6 py-4 font-bold text-foreground">
                          {getClassroomName(cls)}
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground">
                          {cls.student_count} คน
                        </td>
                        <td className="px-6 py-4 text-right font-black text-foreground">
                          {cls.overall_avg_percentage}%
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {cls.gpa_avg.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
