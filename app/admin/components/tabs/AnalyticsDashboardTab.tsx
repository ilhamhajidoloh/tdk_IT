"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  School,
  ArrowUpDown,
  Eye,
  X,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
} from "lucide-react";
import { type SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import PaginationBar, { usePagination } from "../PaginationBar";
import { getClassroomName } from "@/app/lib/classroom";
import ModalPortal from "@/app/components/ModalPortal";

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
  histogram: {
    classrooms: Array<{
      classroom_id: string;
      observations: Array<{ percentage: number; gpa: number }>;
    }>;
    subjects: Array<{
      subject_id: string;
      max_score: number;
      scores: number[];
    }>;
  };
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

type ActiveView = "all" | "classrooms" | "subjects" | "histogram" | "evaluation";

const GRADE_COLORS: Record<string, string> = {
  "4.0": "#10b981",
  "3.5": "#06b6d4",
  "3.0": "#3b82f6",
  "2.5": "#6366f1",
  "2.0": "#f59e0b",
  "1.5": "#f97316",
  "1.0": "#ea580c",
  "0.0": "#ef4444",
};

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(255, 255, 255, 0.96)",
  borderRadius: "0.75rem",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
  color: "#111827",
  fontSize: "12px",
};

export default function AnalyticsDashboardTab({
  settingsList,
  selectedSettingId,
  setSelectedSettingId,
  token,
}: AnalyticsDashboardTabProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [activeView, setActiveView] = useState<ActiveView>("all");
  const [histogramMode, setHistogramMode] = useState<"classroom" | "subject">("classroom");
  const [histogramClassroomId, setHistogramClassroomId] = useState<string>("all");
  const [histogramClassMetric, setHistogramClassMetric] = useState<"percentage" | "gpa">("percentage");
  const [histogramSubjectId, setHistogramSubjectId] = useState<string>("");

  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("all");
  const [inspectClassroom, setInspectClassroom] = useState<AnalyticsData["classrooms"][number] | null>(null);
  const [classroomSortOrder, setClassroomSortOrder] = useState<"desc" | "asc">("desc");

  const [subjectSearch, setSubjectSearch] = useState<string>("");
  const [subjectTypeFilter, setSubjectTypeFilter] = useState<"all" | "general" | "activity">("all");
  const [subjectSortOrder, setSubjectSortOrder] = useState<"desc" | "asc" | "pass_rate">("desc");
  const [selectedSubject, setSelectedSubject] = useState<AnalyticsData["subjects"][number] | null>(null);

  const selectedSetting = settingsList.find((setting) => setting.id === selectedSettingId);
  const isAnnualEvaluationTerm = String(selectedSetting?.term ?? data?.term) === "2";

  useEffect(() => {
    if (!selectedSettingId && settingsList.length > 0) {
      const active = settingsList.find((s) => s.is_active);
      setSelectedSettingId(active ? active.id : settingsList[0].id);
    }
  }, [settingsList, selectedSettingId, setSelectedSettingId]);

  const fetchAnalytics = useCallback(async (settingId: number, authToken: string) => {
    const res = await fetch(`/api/admin/analytics?settingId=${settingId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return (await res.json()) as AnalyticsData;
  }, []);

  const handleRefresh = async () => {
    if (!selectedSettingId || !token) return;
    setLoading(true);
    try {
      const json = await fetchAnalytics(selectedSettingId, token);
      setData(json);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSettingId || !token) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const json = await fetchAnalytics(selectedSettingId, token);
        if (active) setData(json);
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [selectedSettingId, token, fetchAnalytics]);

  const rankedClassrooms = useMemo(() => {
    if (!data?.classrooms) return [];
    return [...data.classrooms].sort((a, b) =>
      classroomSortOrder === "desc"
        ? b.overall_avg_percentage - a.overall_avg_percentage
        : a.overall_avg_percentage - b.overall_avg_percentage
    );
  }, [data, classroomSortOrder]);

  const displayedClassrooms = useMemo(() => {
    if (selectedClassroomId === "all") return rankedClassrooms;
    return rankedClassrooms.filter((c) => c.classroom_id === selectedClassroomId);
  }, [rankedClassrooms, selectedClassroomId]);

  const classroomTablePagination = usePagination(displayedClassrooms, 5);

  const currentFocusedClassroom = useMemo(() => {
    if (selectedClassroomId === "all" || !data?.classrooms) return null;
    return data.classrooms.find((c) => c.classroom_id === selectedClassroomId) || null;
  }, [data, selectedClassroomId]);

  const processedSubjects = useMemo(() => {
    if (!data?.subjects) return [];
    const q = subjectSearch.trim().toLowerCase();
    return data.subjects
      .filter((s) => {
        const matchesSearch = !q || s.subject_name.toLowerCase().includes(q);
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
  }, [data, subjectSearch, subjectTypeFilter, subjectSortOrder]);

  const subjectTablePagination = usePagination(processedSubjects, 5);

  const characterChartData = useMemo(() => {
    if (!data?.character_topics) return [];
    return data.character_topics.map((t) => ({
      name: t.name,
      ดีเยี่ยม: t.excellent,
      ดี: t.good,
      ผ่าน: t.pass,
      ไม่ผ่าน: t.fail,
    }));
  }, [data]);

  const rwtChartData = useMemo(() => {
    if (!data?.rwt_topics) return [];
    return data.rwt_topics.map((t) => ({
      name: t.name,
      ดีเยี่ยม: t.excellent,
      ดี: t.good,
      ผ่าน: t.pass,
      ไม่ผ่าน: t.fail,
    }));
  }, [data]);

  const classroomHistogramData = useMemo(() => {
    if (!data?.histogram) return [];
    const observations = data.histogram.classrooms
      .filter((item) => histogramClassroomId === "all" || item.classroom_id === histogramClassroomId)
      .flatMap((item) => item.observations);
    const step = histogramClassMetric === "percentage" ? 10 : 0.5;
    const ceiling = histogramClassMetric === "percentage" ? 100 : 4;
    return Array.from({ length: ceiling / step }, (_, index) => {
      const start = index * step;
      const end = start + step;
      const count = observations.filter(({ percentage, gpa }) => {
        const value = histogramClassMetric === "percentage" ? percentage : gpa;
        return index === ceiling / step - 1
          ? value >= start && value <= end
          : value >= start && value < end;
      }).length;
      return {
        range: `${start}-${end}${histogramClassMetric === "percentage" ? "%" : ""}`,
        students: count,
      };
    });
  }, [data, histogramClassroomId, histogramClassMetric]);

  const subjectHistogramData = useMemo(() => {
    if (!data?.histogram) return [];
    const item =
      data.histogram.subjects.find((subject) => subject.subject_id === histogramSubjectId) ??
      data.histogram.subjects[0];
    if (!item) return [];
    const step = Math.max(1, Math.ceil(item.max_score / 10));
    return Array.from({ length: 10 }, (_, index) => {
      const start = index * step;
      const end = index === 9 ? item.max_score : Math.min(item.max_score, start + step);
      const count = item.scores.filter((score) =>
        index === 9 ? score >= start && score <= end : score >= start && score < end
      ).length;
      return { range: `${start}-${end}`, students: count };
    });
  }, [data, histogramSubjectId]);

  const hasHistogram = Boolean(
    data?.histogram && (data.histogram.classrooms.length > 0 || data.histogram.subjects.length > 0)
  );

  const navTabs = useMemo(() => {
    const items: {
      key: ActiveView;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      count?: number;
    }[] = [{ key: "all", label: "ภาพรวม", icon: LayoutGrid }];

    if (data?.classrooms.length) {
      items.push({
        key: "classrooms",
        label: "รายห้องเรียน",
        icon: School,
        count: data.classrooms.length,
      });
    }
    if (data?.subjects.length) {
      items.push({
        key: "subjects",
        label: "รายวิชา",
        icon: BookOpen,
        count: data.subjects.length,
      });
    }
    if (hasHistogram) {
      items.push({ key: "histogram", label: "ฮิสโทแกรม", icon: BarChart3 });
    }
    if (isAnnualEvaluationTerm) {
      items.push({ key: "evaluation", label: "คุณลักษณะ & RWT", icon: Award });
    }
    return items;
  }, [data, hasHistogram, isAnnualEvaluationTerm]);

  return (
    <div className="p-6 md:p-8 space-y-5 animate-fade-in-up">
      {/* Header */}
      <SectionHeader
        icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        color="purple"
        title="สถิติและวิเคราะห์ผลการเรียน"
        subtitle="ภาพรวมผลสัมฤทธิ์ เปรียบเทียบรายห้องเรียน รายวิชา และการกระจายคะแนน"
      >
        <button
          type="button"
          onClick={handleRefresh}
          disabled={!selectedSettingId || loading}
          className="bg-card border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          <span>รีเฟรช</span>
        </button>
      </SectionHeader>

      {/* Term Selector (in its proper full-width row) */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSettingId}
        onSelect={(id) => {
          if (String(settingsList.find((setting) => setting.id === id)?.term) !== "2") {
            setActiveView("all");
          }
          setSelectedClassroomId("all");
          setSubjectSearch("");
          setSelectedSettingId(id);
        }}
      />

      {/* Loading & Empty States */}
      {loading && !data ? (
        <div className="py-16 text-center bg-card rounded-2xl border border-border">
          <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground font-semibold text-sm">กำลังประมวลผลสถิติ...</p>
        </div>
      ) : !data ? (
        <div className="py-14 text-center bg-muted rounded-2xl border border-dashed border-border">
          <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2.5" />
          <div className="text-sm font-semibold text-foreground">ไม่พบข้อมูลสถิติของภาคเรียนนี้</div>
          <p className="text-xs text-muted-foreground mt-1">
            กรุณาตรวจสอบว่ามีการเปิดรายวิชาและบันทึกคะแนนในระบบแล้ว
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Segmented View Tabs */}
          <div className="inline-flex w-full sm:w-auto gap-1 p-1 bg-muted rounded-xl border border-border overflow-x-auto">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeView === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveView(tab.key)}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer border-0 ${
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${active ? "text-indigo-600 dark:text-indigo-400" : ""}`}
                  />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[11px] opacity-65 tabular-nums">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ===== VIEW 1: EXECUTIVE OVERVIEW ===== */}
          {activeView === "all" && (
            <div className="space-y-5">
              {/* 4 Balanced KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>เฉลี่ยทั้งโรงเรียน</span>
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-foreground mt-1.5 tabular-nums">
                    {data.kpi.school_avg_percentage}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {data.kpi.total_students} คน · {data.kpi.total_classrooms} ห้อง
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const found = data.classrooms.find(
                      (c) => c.classroom_id === data.kpi.top_classroom?.classroom_id
                    );
                    if (found) setInspectClassroom(found);
                  }}
                  className="text-left bg-card rounded-2xl border border-border hover:border-indigo-300/70 p-4 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>ห้องคะแนนสูงสุด</span>
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-lg font-extrabold text-foreground mt-1.5 truncate">
                    {data.kpi.top_classroom
                      ? getClassroomName(data.kpi.top_classroom)
                      : "—"}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                    เฉลี่ย {data.kpi.top_classroom?.overall_avg_percentage ?? 0}%
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const found = data.subjects.find(
                      (s) => s.subject_id === data.kpi.top_subject?.subject_id
                    );
                    if (found) setSelectedSubject(found);
                  }}
                  className="text-left bg-card rounded-2xl border border-border hover:border-indigo-300/70 p-4 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>วิชาคะแนนสูงสุด</span>
                    <BookOpen className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-lg font-extrabold text-foreground mt-1.5 truncate">
                    {data.kpi.top_subject ? data.kpi.top_subject.subject_name : "—"}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                    เฉลี่ย {data.kpi.top_subject?.avg_percentage ?? 0}%
                  </div>
                </button>

                {isAnnualEvaluationTerm ? (
                  <button
                    type="button"
                    onClick={() => setActiveView("evaluation")}
                    className="text-left bg-card rounded-2xl border border-border hover:border-indigo-300/70 p-4 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>ผ่านคุณลักษณะฯ</span>
                      <Award className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-extrabold text-foreground mt-1.5 tabular-nums">
                      {data.kpi.character_pass_rate}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      ดีเยี่ยม {data.kpi.character_excellent_rate}% · RWT {data.kpi.rwt_pass_rate}%
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveView("subjects")}
                    className="text-left bg-card rounded-2xl border border-border hover:border-indigo-300/70 p-4 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>รายวิชาที่ประเมิน</span>
                      <BookOpen className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-extrabold text-foreground mt-1.5 tabular-nums">
                      {data.kpi.total_subjects}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">คลิกดูรายละเอียดรายวิชา</div>
                  </button>
                )}
              </div>

              {/* Overview Main Charts: Classroom Comparison + Grade Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {data.classrooms.length > 0 && (
                  <div className="lg:col-span-8 bg-card rounded-2xl border border-border p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <h4 className="font-bold text-foreground text-sm">
                          คะแนนเฉลี่ยรายห้องเรียน (%)
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          เส้นประคือเกณฑ์เฉลี่ยโรงเรียน ({data.kpi.school_avg_percentage}%) · คลิกแท่งเพื่อดูรายวิชา
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView("classrooms")}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer border-0 bg-transparent"
                      >
                        <span>ดูตารางรายห้อง</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="h-[290px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={rankedClassrooms.map((c) => ({
                            id: c.classroom_id,
                            name: getClassroomName(c),
                            คะแนนเฉลี่ย: c.overall_avg_percentage,
                          }))}
                          margin={{ top: 14, right: 12, left: -16, bottom: 28 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "currentColor", fontSize: 11 }}
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                          />
                          <YAxis domain={[0, 100]} tick={{ fill: "currentColor", fontSize: 11 }} />
                          <Tooltip
                            formatter={(value) => [`${value}%`, "คะแนนเฉลี่ย"]}
                            contentStyle={TOOLTIP_STYLE}
                          />
                          <ReferenceLine
                            y={data.kpi.school_avg_percentage}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                          />
                          <Bar
                            dataKey="คะแนนเฉลี่ย"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={44}
                            onClick={(barData) => {
                              const id = (barData as { id?: string }).id;
                              const found = data.classrooms.find((c) => c.classroom_id === id);
                              if (found) setInspectClassroom(found);
                            }}
                            className="cursor-pointer"
                          >
                            {rankedClassrooms.map((entry, index) => (
                              <Cell
                                key={`ov-cls-${index}`}
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
                )}

                <div
                  className={`${
                    data.classrooms.length > 0 ? "lg:col-span-4" : "lg:col-span-12"
                  } bg-card rounded-2xl border border-border p-5 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-foreground text-sm">สัดส่วนเกรดทั้งโรงเรียน</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">การกระจายเกรด 0.0 – 4.0</p>
                      </div>
                    </div>

                    <div className="h-[210px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.grade_distribution}
                          margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                          <XAxis dataKey="grade" tick={{ fill: "currentColor", fontSize: 11 }} />
                          <YAxis tick={{ fill: "currentColor", fontSize: 11 }} />
                          <Tooltip
                            formatter={(value) => [`${value} รายการ`, "จำนวน"]}
                            contentStyle={TOOLTIP_STYLE}
                          />
                          <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                            {data.grade_distribution.map((entry, index) => (
                              <Cell
                                key={`ov-grade-${index}`}
                                fill={GRADE_COLORS[entry.grade] || "#6366f1"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-border text-center">
                    {data.grade_distribution.slice(0, 4).map((g) => (
                      <div key={g.grade} className="p-1.5 rounded-lg bg-muted/60">
                        <div className="text-[10px] font-semibold text-muted-foreground">
                          เกรด {g.grade}
                        </div>
                        <div className="text-xs font-bold text-foreground tabular-nums">
                          {g.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compact Focus Points (จุดที่ควรพัฒนา) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.kpi.lowest_classroom && (
                  <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        ห้องเรียนที่ควรพัฒนาเพิ่มเติม
                      </div>
                      <div className="font-bold text-sm text-foreground truncate mt-1">
                        {getClassroomName(data.kpi.lowest_classroom)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        คะแนนเฉลี่ย {data.kpi.lowest_classroom.overall_avg_percentage}% (เกณฑ์โรงเรียน{" "}
                        {data.kpi.school_avg_percentage}%)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const found = data.classrooms.find(
                          (c) => c.classroom_id === data.kpi.lowest_classroom?.classroom_id
                        );
                        if (found) setInspectClassroom(found);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 shrink-0 cursor-pointer"
                    >
                      ดูรายวิชา
                    </button>
                  </div>
                )}

                {data.kpi.lowest_subject && (
                  <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        รายวิชาที่ควรพัฒนาเพิ่มเติม
                      </div>
                      <div className="font-bold text-sm text-foreground truncate mt-1">
                        {data.kpi.lowest_subject.subject_name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        คะแนนเฉลี่ย {data.kpi.lowest_subject.avg_percentage}% (เกณฑ์โรงเรียน{" "}
                        {data.kpi.school_avg_percentage}%)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const found = data.subjects.find(
                          (s) => s.subject_id === data.kpi.lowest_subject?.subject_id
                        );
                        if (found) setSelectedSubject(found);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 shrink-0 cursor-pointer"
                    >
                      ดูรายห้อง
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== VIEW 2: CLASSROOMS ===== */}
          {activeView === "classrooms" && data.classrooms.length > 0 && (
            <div className="space-y-4">
              {/* Classroom Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <School className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    aria-label="กรองห้องเรียน"
                    value={selectedClassroomId}
                    onChange={(e) => setSelectedClassroomId(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer"
                  >
                    <option value="all">ทุกห้องเรียน ({data.classrooms.length} ห้อง)</option>
                    {data.classrooms
                      .filter((c) => c.student_count > 0)
                      .map((c) => (
                        <option key={c.classroom_id} value={c.classroom_id}>
                          {getClassroomName(c)} ({c.student_count} คน)
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setClassroomSortOrder(classroomSortOrder === "desc" ? "asc" : "desc")
                  }
                  className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    เรียง: {classroomSortOrder === "desc" ? "สูงสุด → ต่ำสุด" : "ต่ำสุด → สูงสุด"}
                  </span>
                </button>
              </div>

              {/* Chart + Focused Classroom Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div
                  className={`${
                    currentFocusedClassroom ? "lg:col-span-7" : "lg:col-span-12"
                  } bg-card rounded-2xl border border-border p-5`}
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <div>
                      <h4 className="font-bold text-foreground text-sm">
                        เปรียบเทียบคะแนนเฉลี่ยระหว่างชั้นเรียน (%)
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        เกณฑ์เฉลี่ยโรงเรียน {data.kpi.school_avg_percentage}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                        สูงกว่าเกณฑ์
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />
                        ต่ำกว่าเกณฑ์
                      </span>
                    </div>
                  </div>

                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayedClassrooms.map((c) => ({
                          id: c.classroom_id,
                          name: getClassroomName(c),
                          คะแนนเฉลี่ย: c.overall_avg_percentage,
                        }))}
                        margin={{ top: 14, right: 12, left: -16, bottom: 28 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "currentColor", fontSize: 11 }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                        />
                        <YAxis domain={[0, 100]} tick={{ fill: "currentColor", fontSize: 11 }} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, "คะแนนเฉลี่ย"]}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <ReferenceLine
                          y={data.kpi.school_avg_percentage}
                          stroke="#ef4444"
                          strokeDasharray="4 4"
                        />
                        <Bar
                          dataKey="คะแนนเฉลี่ย"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                          onClick={(barData) => {
                            const id = (barData as { id?: string }).id;
                            const found = data.classrooms.find((c) => c.classroom_id === id);
                            if (found) setInspectClassroom(found);
                          }}
                          className="cursor-pointer"
                        >
                          {displayedClassrooms.map((entry, index) => (
                            <Cell
                              key={`cls-bar-${index}`}
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

                {currentFocusedClassroom && (
                  <div className="lg:col-span-5 bg-card rounded-2xl border border-indigo-300/70 dark:border-indigo-500/40 p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div>
                          <div className="text-xs text-muted-foreground">ข้อมูลเฉพาะห้องเรียน</div>
                          <h4 className="text-base font-bold text-foreground">
                            {getClassroomName(currentFocusedClassroom)}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedClassroomId("all")}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg bg-muted cursor-pointer border-0"
                        >
                          ดูทุกห้อง
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="p-2.5 rounded-xl bg-muted/60">
                          <div className="text-[11px] text-muted-foreground">นักเรียน</div>
                          <div className="text-sm font-bold text-foreground tabular-nums">
                            {currentFocusedClassroom.student_count} คน
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/60">
                          <div className="text-[11px] text-muted-foreground">คะแนนเฉลี่ย</div>
                          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {currentFocusedClassroom.overall_avg_percentage}%
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/60">
                          <div className="text-[11px] text-muted-foreground">GPA</div>
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {currentFocusedClassroom.gpa_avg.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 max-h-[200px] overflow-y-auto divide-y divide-border/60">
                        {currentFocusedClassroom.subjects.length === 0 ? (
                          <div className="text-xs text-muted-foreground text-center py-6">
                            ยังไม่มีข้อมูลรายวิชา
                          </div>
                        ) : (
                          currentFocusedClassroom.subjects.map((sub) => (
                            <div
                              key={sub.subject_id}
                              className="py-2 flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="font-medium text-foreground truncate">
                                {sub.subject_name}
                              </span>
                              <span className="font-bold text-foreground tabular-nums shrink-0">
                                {sub.avg_percentage}%
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectClassroom(currentFocusedClassroom)}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 border-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูรายละเอียดทั้งหมดของห้องนี้</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Classroom Ranking Table */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                        <th className="py-3 px-4 text-center w-16">อันดับ</th>
                        <th className="py-3 px-4">ชั้นเรียน</th>
                        <th className="py-3 px-4 text-center w-28">นักเรียน</th>
                        <th className="py-3 px-4 text-right w-36">คะแนนเฉลี่ย</th>
                        <th className="py-3 px-4 text-right w-24">GPA</th>
                        <th className="py-3 px-4 text-center w-44">เทียบเกณฑ์โรงเรียน</th>
                        <th className="py-3 px-4 text-right w-28">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classroomTablePagination.paginatedItems.map((cls, idx) => {
                        const diff = cls.overall_avg_percentage - data.kpi.school_avg_percentage;
                        const isAbove = diff >= 0;
                        const rank =
                          classroomTablePagination.perPage === 0
                            ? idx + 1
                            : (classroomTablePagination.currentPage - 1) *
                                classroomTablePagination.perPage +
                              idx +
                              1;
                        return (
                          <tr
                            key={cls.classroom_id}
                            onClick={() => setInspectClassroom(cls)}
                            className="hover:bg-muted/40 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold tabular-nums ${
                                  rank === 1
                                    ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                    : rank === 2
                                    ? "bg-slate-200/80 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300"
                                    : rank === 3
                                    ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {rank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-foreground">
                              {getClassroomName(cls)}
                            </td>
                            <td className="py-3 px-4 text-center text-muted-foreground tabular-nums">
                              {cls.student_count} คน
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-foreground tabular-nums">
                              {cls.overall_avg_percentage}%
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-foreground tabular-nums">
                              {cls.gpa_avg.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                                  isAbove
                                    ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {isAbove ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                )}
                                {isAbove ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectClassroom(cls);
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                ดูรายวิชา
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Classroom Cards */}
                <div className="md:hidden divide-y divide-border">
                  {classroomTablePagination.paginatedItems.map((cls, idx) => {
                    const diff = cls.overall_avg_percentage - data.kpi.school_avg_percentage;
                    const isAbove = diff >= 0;
                    const rank =
                      classroomTablePagination.perPage === 0
                        ? idx + 1
                        : (classroomTablePagination.currentPage - 1) *
                            classroomTablePagination.perPage +
                          idx +
                          1;
                    return (
                      <button
                        key={cls.classroom_id}
                        type="button"
                        onClick={() => setInspectClassroom(cls)}
                        className="w-full p-3.5 text-left hover:bg-muted/40 transition-colors bg-transparent border-0 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-muted-foreground tabular-nums">
                              #{rank}
                            </span>
                            <span className="font-bold text-sm text-foreground truncate">
                              {getClassroomName(cls)}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold tabular-nums shrink-0 ${
                              isAbove
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {isAbove ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5 tabular-nums">
                          <span>{cls.student_count} คน</span>
                          <span>
                            เฉลี่ย <strong className="text-foreground">{cls.overall_avg_percentage}%</strong> · GPA{" "}
                            <strong className="text-foreground">{cls.gpa_avg.toFixed(2)}</strong>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 pb-3">
                  <PaginationBar
                    totalItems={classroomTablePagination.totalItems}
                    currentPage={classroomTablePagination.currentPage}
                    totalPages={classroomTablePagination.totalPages}
                    perPage={classroomTablePagination.perPage}
                    onPageChange={classroomTablePagination.setCurrentPage}
                    onPerPageChange={classroomTablePagination.setPerPage}
                    unitLabel="ห้อง"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== VIEW 3: SUBJECTS ===== */}
          {activeView === "subjects" && data.subjects.length > 0 && (
            <div className="space-y-4">
              {/* Subject Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อวิชา..."
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    {subjectSearch && (
                      <button
                        type="button"
                        onClick={() => setSubjectSearch("")}
                        aria-label="ล้างคำค้นหา"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground border-0 bg-transparent cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="inline-flex items-center p-1 rounded-xl bg-muted border border-border">
                    {(
                      [
                        { key: "all", label: "ทั้งหมด" },
                        { key: "general", label: "วิชาหลัก" },
                        { key: "activity", label: "กิจกรรม" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSubjectTypeFilter(item.key)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border-0 ${
                          subjectTypeFilter === item.key
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground bg-transparent"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <select
                    aria-label="เรียงลำดับรายวิชา"
                    value={subjectSortOrder}
                    onChange={(e) =>
                      setSubjectSortOrder(e.target.value as "desc" | "asc" | "pass_rate")
                    }
                    className="pl-3 pr-8 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="desc">เฉลี่ยสูงสุด → ต่ำสุด</option>
                    <option value="asc">เฉลี่ยต่ำสุด → สูงสุด</option>
                    <option value="pass_rate">อัตราผ่านเกณฑ์สูงสุด</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Subject Bar Chart */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="mb-4">
                  <h4 className="font-bold text-foreground text-sm">คะแนนเฉลี่ยรายวิชา (%)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    เทียบเกณฑ์โรงเรียน ({data.kpi.school_avg_percentage}%) · คลิกแท่งเพื่อดูแยกตามห้องเรียน
                  </p>
                </div>
                <div className="h-[300px] w-full">
                  {processedSubjects.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      ไม่พบรายวิชาที่ตรงกับเงื่อนไข
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processedSubjects.map((s) => ({
                          id: s.subject_id,
                          name: s.subject_name,
                          คะแนนเฉลี่ย: s.avg_percentage,
                        }))}
                        margin={{ top: 14, right: 12, left: -16, bottom: 36 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "currentColor", fontSize: 11 }}
                          interval={0}
                          angle={-28}
                          textAnchor="end"
                        />
                        <YAxis domain={[0, 100]} tick={{ fill: "currentColor", fontSize: 11 }} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, "คะแนนเฉลี่ย"]}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <ReferenceLine
                          y={data.kpi.school_avg_percentage}
                          stroke="#ef4444"
                          strokeDasharray="4 4"
                        />
                        <Bar
                          dataKey="คะแนนเฉลี่ย"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={42}
                          onClick={(barData) => {
                            const id = (barData as { id?: string }).id;
                            const found = data.subjects.find((s) => s.subject_id === id);
                            if (found) setSelectedSubject(found);
                          }}
                          className="cursor-pointer"
                        >
                          {processedSubjects.map((entry, index) => (
                            <Cell
                              key={`sub-bar-${index}`}
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

              {/* Subject Breakdown Table */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                        <th className="py-3 px-4">รายวิชา</th>
                        <th className="py-3 px-4 text-center w-24">ประเมิน</th>
                        <th className="py-3 px-4 text-right w-32">คะแนนเฉลี่ย</th>
                        <th className="py-3 px-4 text-right w-28">ผ่านเกณฑ์</th>
                        <th className="py-3 px-4 text-center w-32">สูงสุด / ต่ำสุด</th>
                        <th className="py-3 px-4 text-center w-36">สัดส่วนเกรด</th>
                        <th className="py-3 px-4 text-right w-28">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {subjectTablePagination.paginatedItems.map((sub) => (
                        <tr
                          key={sub.subject_id}
                          onClick={() => setSelectedSubject(sub)}
                          className="hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-foreground">{sub.subject_name}</span>
                              {sub.subject_type === "activity" ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                  กิจกรรม
                                </span>
                              ) : sub.credit_hours ? (
                                <span className="text-[11px] text-muted-foreground">
                                  {sub.credit_hours} นก.
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-muted-foreground tabular-nums">
                            {sub.graded_students}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            <div className="font-bold text-foreground">{sub.avg_percentage}%</div>
                            {sub.raw_avg_score !== undefined && (
                              <div className="text-[11px] text-muted-foreground">
                                {sub.raw_avg_score}/{sub.max_possible_score || 100}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                (sub.pass_rate ?? 0) >= 80
                                  ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : (sub.pass_rate ?? 0) >= 50
                                  ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              {sub.pass_rate !== undefined ? `${sub.pass_rate}%` : "—"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-xs font-bold tabular-nums">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {sub.highest_score}
                            </span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-rose-600 dark:text-rose-400">
                              {sub.lowest_score}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {sub.grade_distribution && sub.grade_distribution.length > 0 ? (
                              <div className="w-28 h-2 bg-muted rounded-full overflow-hidden flex mx-auto">
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
                              <div className="text-center text-xs text-subtle-foreground">—</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubject(sub);
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-500" />
                              ดูรายห้อง
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Subject Cards */}
                <div className="md:hidden divide-y divide-border">
                  {subjectTablePagination.paginatedItems.map((sub) => (
                    <button
                      key={sub.subject_id}
                      type="button"
                      onClick={() => setSelectedSubject(sub)}
                      className="w-full p-3.5 text-left hover:bg-muted/40 transition-colors bg-transparent border-0 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-foreground truncate">
                            {sub.subject_name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                            ประเมิน {sub.graded_students} คน · ผ่าน {sub.pass_rate ?? "—"}%
                          </div>
                        </div>
                        <span className="font-bold text-sm text-foreground tabular-nums shrink-0">
                          {sub.avg_percentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5 tabular-nums">
                        <span>
                          สูงสุด <strong className="text-emerald-600">{sub.highest_score}</strong> ·
                          ต่ำสุด <strong className="text-rose-600">{sub.lowest_score}</strong>
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          ดูรายห้อง →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-4 pb-3">
                  <PaginationBar
                    totalItems={subjectTablePagination.totalItems}
                    currentPage={subjectTablePagination.currentPage}
                    totalPages={subjectTablePagination.totalPages}
                    perPage={subjectTablePagination.perPage}
                    onPageChange={subjectTablePagination.setCurrentPage}
                    onPerPageChange={subjectTablePagination.setPerPage}
                    unitLabel="วิชา"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== VIEW 4: HISTOGRAM ===== */}
          {activeView === "histogram" && hasHistogram && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex p-1 rounded-xl bg-muted border border-border">
                  <button
                    type="button"
                    onClick={() => setHistogramMode("classroom")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border-0 ${
                      histogramMode === "classroom"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground bg-transparent"
                    }`}
                  >
                    แยกตามชั้นเรียน
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistogramMode("subject")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border-0 ${
                      histogramMode === "subject"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground bg-transparent"
                    }`}
                  >
                    แยกตามรายวิชา
                  </button>
                </div>

                {histogramMode === "classroom" ? (
                  <div className="flex flex-wrap gap-2">
                    <select
                      aria-label="เลือกชั้นเรียนสำหรับฮิสโทแกรม"
                      value={histogramClassroomId}
                      onChange={(e) => setHistogramClassroomId(e.target.value)}
                      className="px-3 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground"
                    >
                      <option value="all">ทุกชั้นเรียน</option>
                      {data.classrooms.map((classroom) => (
                        <option key={classroom.classroom_id} value={classroom.classroom_id}>
                          {getClassroomName(classroom)}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="เลือกตัวชี้วัด"
                      value={histogramClassMetric}
                      onChange={(e) =>
                        setHistogramClassMetric(e.target.value as "percentage" | "gpa")
                      }
                      className="px-3 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground"
                    >
                      <option value="percentage">เปอร์เซ็นต์รวม</option>
                      <option value="gpa">เกรดเฉลี่ย (GPA)</option>
                    </select>
                  </div>
                ) : (
                  <select
                    aria-label="เลือกวิชาสำหรับฮิสโทแกรม"
                    value={histogramSubjectId || data.histogram.subjects[0]?.subject_id || ""}
                    onChange={(e) => setHistogramSubjectId(e.target.value)}
                    className="px-3 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground min-w-[200px]"
                  >
                    {data.histogram.subjects.map((item) => {
                      const subject = data.subjects.find((v) => v.subject_id === item.subject_id);
                      return (
                        <option key={item.subject_id} value={item.subject_id}>
                          {subject?.subject_name ?? "รายวิชา"} (เต็ม {item.max_score})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="mb-4">
                  <h4 className="font-bold text-foreground text-sm">
                    {histogramMode === "classroom"
                      ? "การกระจายผลการเรียนรายชั้น"
                      : "การกระจายคะแนนรวมรายวิชา"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {histogramMode === "classroom"
                      ? "จำนวนนักเรียนในแต่ละช่วงเปอร์เซ็นต์รวม หรือ GPA"
                      : "จำนวนนักเรียนในแต่ละช่วงคะแนนรวมจริงของรายวิชา"}
                  </p>
                </div>
                <div className="h-[320px]" role="img" aria-label="ฮิสโทแกรมการกระจายคะแนน">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        histogramMode === "classroom"
                          ? classroomHistogramData
                          : subjectHistogramData
                      }
                      margin={{ top: 12, right: 12, left: -18, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                      <XAxis
                        dataKey="range"
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        tick={{ fill: "currentColor", fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tick={{ fill: "currentColor", fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) => [`${value} คน`, "จำนวนนักเรียน"]}
                        contentStyle={TOOLTIP_STYLE}
                      />
                      <Bar
                        dataKey="students"
                        name="จำนวนนักเรียน"
                        fill={histogramMode === "classroom" ? "#6366f1" : "#10b981"}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ===== VIEW 5: CHARACTER & RWT EVALUATION ===== */}
          {activeView === "evaluation" && isAnnualEvaluationTerm && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-foreground text-sm">คุณลักษณะอันพึงประสงค์</h4>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300">
                    ผ่าน {data.kpi.character_pass_rate}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  ผลประเมินรวมปีการศึกษา {data.academic_year} แยกตามหัวข้อ
                </p>
                <div className="h-[310px] w-full">
                  {characterChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      ยังไม่มีข้อมูลการประเมินคุณลักษณะฯ
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={characterChartData}
                        margin={{ top: 10, right: 10, left: -16, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "currentColor", fontSize: 11 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fill: "currentColor", fontSize: 11 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend />
                        <Bar dataKey="ดีเยี่ยม" stackId="a" fill="#10b981" />
                        <Bar dataKey="ดี" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="ผ่าน" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="ไม่ผ่าน" stackId="a" fill="#ef4444" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-foreground text-sm">
                    การอ่าน คิดวิเคราะห์ และเขียน (RWT)
                  </h4>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    ผ่าน {data.kpi.rwt_pass_rate}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  สัดส่วนระดับผลการประเมินแยกตามหัวข้อสมรรถนะ
                </p>
                <div className="h-[310px] w-full">
                  {rwtChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      ยังไม่มีข้อมูลการประเมิน RWT
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={rwtChartData}
                        margin={{ top: 10, right: 10, left: -16, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "currentColor", fontSize: 11 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fill: "currentColor", fontSize: 11 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend />
                        <Bar dataKey="ดีเยี่ยม" stackId="a" fill="#10b981" />
                        <Bar dataKey="ดี" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="ผ่าน" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="ไม่ผ่าน" stackId="a" fill="#ef4444" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== MODAL 1: Subject Detail ===== */}
          {selectedSubject && (
            <ModalPortal>
              <div
                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setSelectedSubject(null)}
              >
                <div
                  className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-3xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-scale-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedSubject.subject_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedSubject.subject_type === "activity"
                          ? "วิชากิจกรรม"
                          : "วิชาหลัก"}
                        {selectedSubject.credit_hours
                          ? ` · ${selectedSubject.credit_hours} หน่วยกิต`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSubject(null)}
                      aria-label="ปิดหน้าต่าง"
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-0 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-[11px] text-muted-foreground">คะแนนเฉลี่ย</div>
                      <div className="text-lg font-extrabold text-foreground tabular-nums">
                        {selectedSubject.avg_percentage}%
                      </div>
                      {selectedSubject.raw_avg_score !== undefined && (
                        <div className="text-[10px] text-muted-foreground">
                          ดิบ {selectedSubject.raw_avg_score} คะแนน
                        </div>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-[11px] text-muted-foreground">ผ่านเกณฑ์</div>
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {selectedSubject.pass_rate ?? "—"}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        ประเมิน {selectedSubject.graded_students} คน
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-[11px] text-muted-foreground">คะแนนสูงสุด</div>
                      <div className="text-lg font-extrabold text-foreground tabular-nums">
                        {selectedSubject.highest_score}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        เต็ม {selectedSubject.max_possible_score || 100}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-[11px] text-muted-foreground">คะแนนต่ำสุด</div>
                      <div className="text-lg font-extrabold text-foreground tabular-nums">
                        {selectedSubject.lowest_score}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        เต็ม {selectedSubject.max_possible_score || 100}
                      </div>
                    </div>
                  </div>

                  {selectedSubject.grade_distribution &&
                    selectedSubject.grade_distribution.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-muted-foreground">
                          สัดส่วนเกรด (0.0 – 4.0)
                        </h5>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {selectedSubject.grade_distribution.map((g) => (
                            <div
                              key={g.grade}
                              className="p-2 rounded-xl border border-border text-center bg-card"
                              style={{
                                borderTop: `3px solid ${GRADE_COLORS[g.grade] || "#6366f1"}`,
                              }}
                            >
                              <div className="text-[11px] font-bold text-foreground">{g.grade}</div>
                              <div className="text-xs font-extrabold text-foreground tabular-nums mt-0.5">
                                {g.count}
                              </div>
                              <div className="text-[10px] text-muted-foreground tabular-nums">
                                {g.percentage}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-muted-foreground">
                      ผลสัมฤทธิ์แยกตามห้องเรียน
                    </h5>
                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/60 text-muted-foreground text-xs font-bold border-b border-border">
                            <th className="px-4 py-2.5">ห้องเรียน</th>
                            <th className="px-4 py-2.5 text-center">ประเมินแล้ว</th>
                            <th className="px-4 py-2.5 text-right">เฉลี่ย (%)</th>
                            <th className="px-4 py-2.5 text-right hidden sm:table-cell">คะแนนดิบ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedSubject.classroom_breakdown.map((cls) => (
                            <tr key={cls.classroom_id} className="hover:bg-muted/30">
                              <td className="px-4 py-2.5 font-semibold text-foreground">
                                {cls.classroom_name}
                              </td>
                              <td className="px-4 py-2.5 text-center text-muted-foreground tabular-nums">
                                {cls.graded_count ?? 0}/{cls.student_count ?? "—"}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                {cls.avg_percentage}%
                              </td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground text-xs tabular-nums hidden sm:table-cell">
                                {cls.raw_avg_score !== undefined
                                  ? cls.raw_avg_score.toFixed(1)
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </ModalPortal>
          )}

          {/* ===== MODAL 2: Classroom Detail ===== */}
          {inspectClassroom && (
            <ModalPortal>
              <div
                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setInspectClassroom(null)}
              >
                <div
                  className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-3xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-scale-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {getClassroomName(inspectClassroom)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ผลสัมฤทธิ์รายวิชาภายในห้องเรียน
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectClassroom(null)}
                      aria-label="ปิดหน้าต่าง"
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-0 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-[11px] text-muted-foreground">นักเรียน</div>
                      <div className="text-lg font-extrabold text-foreground tabular-nums">
                        {inspectClassroom.student_count} คน
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-[11px] text-muted-foreground">คะแนนเฉลี่ย</div>
                      <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {inspectClassroom.overall_avg_percentage}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-[11px] text-muted-foreground">GPA</div>
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {inspectClassroom.gpa_avg.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-muted-foreground">
                      รายวิชาทั้งหมด ({inspectClassroom.subjects.length} วิชา)
                    </h5>
                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/60 text-muted-foreground text-xs font-bold border-b border-border">
                            <th className="px-4 py-2.5">รายวิชา</th>
                            <th className="px-4 py-2.5 text-center">ประเมินแล้ว</th>
                            <th className="px-4 py-2.5 text-right">เฉลี่ย (%)</th>
                            <th className="px-4 py-2.5 text-center">เทียบเกณฑ์</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {inspectClassroom.subjects.map((sub) => {
                            const isAbove = sub.avg_percentage >= data.kpi.school_avg_percentage;
                            return (
                              <tr key={sub.subject_id} className="hover:bg-muted/30">
                                <td className="px-4 py-2.5 font-semibold text-foreground">
                                  {sub.subject_name}
                                </td>
                                <td className="px-4 py-2.5 text-center text-muted-foreground tabular-nums">
                                  {sub.graded_count}/{inspectClassroom.student_count}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-foreground tabular-nums">
                                  {sub.avg_percentage}%
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                      isAbove
                                        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                        : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                    }`}
                                  >
                                    {isAbove ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <AlertCircle className="w-3 h-3" />
                                    )}
                                    {isAbove ? "สูงกว่าเกณฑ์" : "ต่ำกว่าเกณฑ์"}
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
            </ModalPortal>
          )}
        </div>
      )}
    </div>
  );
}
