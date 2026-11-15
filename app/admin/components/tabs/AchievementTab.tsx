"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import Swal from "sweetalert2";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  GraduationCap,
  Info,
  Layers,
  Printer,
  RotateCcw,
  Save,
  School,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  X,
  AlertCircle,
  Eye,
  Sliders,
} from "lucide-react";
import { type SystemSetting } from "../types";
import { getClassroomName } from "@/app/lib/classroom";

interface SubjectHeader {
  id: string;
  name: string;
  max_score: number;
  subject_type?: "main" | "activity";
  score_enabled_classroom_ids?: string[];
}

interface SubjectStat {
  subject_id: string;
  subject_name: string;
  total_score: number;
  max_possible_score: number;
  avg_percentage: number;
}

interface MatrixRow {
  classroom_id: string;
  classroom_name: string;
  classroom_name_thai?: string | null;
  classroom_name_rumi?: string | null;
  classroom_name_jawi?: string | null;
  student_count: number;
  subject_stats: SubjectStat[];
  total_all_subjects: number;
  max_possible_all_subjects: number;
  overall_avg_percentage: number;
}

interface SchoolSummary {
  total_students: number;
  subject_stats: SubjectStat[];
  total_all_subjects: number;
  max_possible_all_subjects: number;
  overall_avg_percentage: number;
}

export interface MultiLangSubjectEntry {
  thai?: string;
  rumi?: string;
  arabic?: string;
  active_lang?: "thai" | "rumi" | "arabic";
}

interface AchievementData {
  academic_year: string;
  term: string;
  term_key: string;
  school_name?: string;
  subject_display_names?: Record<string, MultiLangSubjectEntry | string>;
  subjects: SubjectHeader[];
  matrix_rows: MatrixRow[];
  school_summary: SchoolSummary;
}

interface AchievementTabProps {
  settingsList: SystemSetting[];
  selectedSettingId: number | null;
  setSelectedSettingId: (id: number) => void;
  token: string | null;
}

// Built-in preset translations for Islamic / Tadika Subjects (Thai -> Rumi & Arabic)
const DEFAULT_ARABIC_MAP: Record<string, { thai: string; rumi: string; arabic: string }> = {
  "อัลกุรอาน": { thai: "อัลกุรอาน", rumi: "Al-Quran", arabic: "القرآن الكريم" },
  "กุรอาน": { thai: "อัลกุรอาน", rumi: "Al-Quran", arabic: "القرآن الكريم" },
  "อัตตัฟซีร": { thai: "อัตตัฟซีร", rumi: "Al-Tafsir", arabic: "التفسير" },
  "อัลฮะดีษ": { thai: "อัลฮะดีษ", rumi: "Al-Hadith", arabic: "الحديث الشريف" },
  "ฮะดีษ": { thai: "อัลฮะดีษ", rumi: "Al-Hadith", arabic: "الحديث الشريف" },
  "อัลเตาฮีด": { thai: "อัลเตาฮีด (หลักศรัทธา)", rumi: "Al-Tauhid", arabic: "التوحيد" },
  "เตาฮีด": { thai: "เตาฮีด (หลักศรัทธา)", rumi: "Al-Tauhid", arabic: "التوحيد" },
  "อัลฟิกฮ์": { thai: "อัลฟิกฮ์ (นิติศาสตร์อิสลาม)", rumi: "Al-Fiqh", arabic: "الفقه الإسلامي" },
  "ฟิกฮ์": { thai: "ฟิกฮ์ (นิติศาสตร์อิสลาม)", rumi: "Al-Fiqh", arabic: "الفقه الإسلامي" },
  "ประวัติศาสตร์": { thai: "ประวัติศาสตร์อิสลาม", rumi: "Tarikh", arabic: "التاريخ الإسلامي" },
  "สิระฮ์": { thai: "สิระฮ์ (ชีวประวัติ)", rumi: "Sirah", arabic: "السيرة النبوية" },
  "ภาษามลายู": { thai: "ภาษามลายู", rumi: "Bahasa Melayu", arabic: "اللغة الجاوية" },
  "ภาษาอาหรับ": { thai: "ภาษาอาหรับ", rumi: "Bahasa Arab", arabic: "اللغة العربية" },
  "อัคลาก": { thai: "อัคลาก (จริยธรรม)", rumi: "Akhlak", arabic: "الأخلاق" },
  "ศาสนสมบัติ": { thai: "ศาสนสมบัติ", rumi: "Pendidikan Islam", arabic: "التربية الإسلامية" },
  "กิจกรรม": { thai: "กิจกรรมพัฒนาผู้เรียน", rumi: "Aktiviti", arabic: "الأنشطة" },
};

export default function AchievementTab({
  settingsList,
  selectedSettingId,
  setSelectedSettingId,
  token,
}: AchievementTabProps) {
  const [data, setData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [reportTitle, setReportTitle] = useState<string>("รายงานสรุปผลสัมฤทธิ์ทางการเรียน");
  const [agencyName, setAgencyName] = useState<string>("");
  const [includeActivity, setIncludeActivity] = useState<boolean>(false);
  const [showReportDetails, setShowReportDetails] = useState<boolean>(false);
  const [mobileViewMode, setMobileViewMode] = useState<"cards" | "table">("cards");

  // Feature 1: Classroom calculation selection
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);

  // Feature 2: Multi-Language Custom Subject Names JSON (thai, rumi, arabic)
  const [customSubjectNames, setCustomSubjectNames] = useState<Record<string, MultiLangSubjectEntry>>({});
  const [globalActiveLang, setGlobalActiveLang] = useState<"thai" | "rumi" | "arabic">("thai");
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);

  // Load saved custom subject names from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && selectedSettingId) {
      const storageKey = `achievement_subject_names_${selectedSettingId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setCustomSubjectNames(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved subject names from localStorage", e);
        }
      }
    }
  }, [selectedSettingId]);

  useEffect(() => {
    if (selectedSettingId && token) {
      fetchAchievementData(selectedSettingId, includeActivity);
    }
  }, [selectedSettingId, includeActivity, token]);

  const fetchAchievementData = async (settingId: number, incAct: boolean = includeActivity) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/grades/achievement?settingId=${settingId}&includeActivity=${incAct}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json: AchievementData = await res.json();
        setData(json);
        if (json.school_name) {
          setAgencyName((prev) => prev || json.school_name || "");
        }
        if (json.matrix_rows) {
          setSelectedClassroomIds(json.matrix_rows.map((r) => r.classroom_id));
        }

        const normalized: Record<string, MultiLangSubjectEntry> = {};

        // Normalize DB JSONB subject display names if available
        if (json.subject_display_names && Object.keys(json.subject_display_names).length > 0) {
          Object.entries(json.subject_display_names).forEach(([id, val]) => {
            if (typeof val === "string") {
              normalized[id] = { thai: val, rumi: "", arabic: val };
            } else if (typeof val === "object" && val !== null) {
              normalized[id] = val;
            }
          });
        }

        // Also fetch from /api/translations to sync any fresh subject translation
        try {
          const transRes = await fetch("/api/translations", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (transRes.ok) {
            const transList: { key: string; thai: string; malay_rumi: string; malay_jawi: string }[] = await transRes.json();
            transList.forEach((t) => {
              const item = {
                thai: t.thai || t.key,
                rumi: t.malay_rumi || "",
                arabic: t.malay_jawi || "",
              };
              if (t.key) normalized[t.key] = { ...item, ...(normalized[t.key] || {}) };
              if (t.thai) normalized[t.thai] = { ...item, ...(normalized[t.thai] || {}) };
            });

            if (json.subjects) {
              json.subjects.forEach((s) => {
                const match = transList.find(
                  (t) =>
                    t.key === s.name ||
                    t.key === `subj_${s.id}` ||
                    (t.thai && t.thai.trim().toLowerCase() === s.name.trim().toLowerCase()) ||
                    (t.malay_rumi && t.malay_rumi.trim().toLowerCase() === s.name.trim().toLowerCase()) ||
                    (t.malay_jawi && t.malay_jawi.trim().toLowerCase() === s.name.trim().toLowerCase())
                );
                if (match) {
                  const item = {
                    thai: match.thai || s.name,
                    rumi: match.malay_rumi || "",
                    arabic: match.malay_jawi || "",
                  };
                  normalized[s.id] = { ...item, ...(normalized[s.id] || {}) };
                  normalized[s.name] = { ...item, ...(normalized[s.name] || {}) };
                }
              });
            }
          }
        } catch (e) {
          console.error("Error fetching translations for achievement", e);
        }

        setCustomSubjectNames(normalized);
      } else {
        const err = await res.json();
        console.error("Failed to load achievement data:", err);
      }
    } catch (error) {
      console.error("Error loading achievement data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Toggle classroom selection
  const handleToggleClassroom = (classroomId: string) => {
    setSelectedClassroomIds((prev) =>
      prev.includes(classroomId)
        ? prev.filter((id) => id !== classroomId)
        : [...prev, classroomId]
    );
  };

  const handleSelectAllClassrooms = () => {
    if (!data) return;
    if (selectedClassroomIds.length === data.matrix_rows.length) {
      setSelectedClassroomIds([]);
    } else {
      setSelectedClassroomIds(data.matrix_rows.map((r) => r.classroom_id));
    }
  };

  // Helper: Resolve subject name according to active language (thai, rumi, arabic)
  const getSubjectName = (subj: SubjectHeader | SubjectStat) => {
    const id = "id" in subj ? subj.id : subj.subject_id;
    const rawDefaultName = "name" in subj ? subj.name : subj.subject_name;
    const cleanName = (rawDefaultName || "").trim();
    const entry = customSubjectNames[id] || customSubjectNames[cleanName] || customSubjectNames[rawDefaultName];

    if (!entry) return rawDefaultName;

    const lang = entry.active_lang || globalActiveLang;
    if (lang === "rumi" && entry.rumi && entry.rumi.trim()) return entry.rumi.trim();
    if (lang === "arabic" && entry.arabic && entry.arabic.trim()) return entry.arabic.trim();
    if (lang === "thai" && entry.thai && entry.thai.trim()) return entry.thai.trim();

    return entry.thai?.trim() || entry.rumi?.trim() || entry.arabic?.trim() || rawDefaultName;
  };

  // Helper: Auto-fill Arabic & Rumi presets
  const handleApplyArabicPresets = () => {
    if (!data) return;
    const updatedMap: Record<string, MultiLangSubjectEntry> = { ...customSubjectNames };
    let count = 0;
    data.subjects.forEach((subj) => {
      const cleanName = subj.name.trim();
      for (const [key, preset] of Object.entries(DEFAULT_ARABIC_MAP)) {
        if (cleanName.includes(key)) {
          updatedMap[subj.id] = {
            thai: subj.name,
            rumi: preset.rumi,
            arabic: preset.arabic,
            active_lang: globalActiveLang,
          };
          count++;
          break;
        }
      }
    });
    setCustomSubjectNames(updatedMap);
    Swal.fire({
      title: "เติมพรีเซ็ตสำเร็จ",
      text: `เติมชื่อวิชาภาษา Thai/Rumi/Arabic แล้ว ${count} วิชา (กดบันทึกลงฐานข้อมูลเพื่อจัดเก็บ)`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Save subject display names to PostgreSQL DB via API + localStorage
  const handleSaveSubjectNames = async () => {
    if (selectedSettingId && token) {
      try {
        const res = await fetch("/api/grades/achievement", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            settingId: selectedSettingId,
            subjectDisplayNames: customSubjectNames,
          }),
        });
        if (res.ok) {
          if (typeof window !== "undefined") {
            localStorage.setItem(`achievement_subject_names_${selectedSettingId}`, JSON.stringify(customSubjectNames));
          }
          setShowSubjectModal(false);
          Swal.fire({
            title: "บันทึกลงฐานข้อมูลสำเร็จ",
            text: "ระบบได้บันทึกโครงสร้างภาษา (Thai, Rumi, Arabic) ลงใน PostgreSQL เรียบร้อยแล้ว",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
          return;
        }
      } catch (err) {
        console.error("Failed to save subject names to PostgreSQL DB:", err);
      }
    }

    if (typeof window !== "undefined" && selectedSettingId) {
      localStorage.setItem(`achievement_subject_names_${selectedSettingId}`, JSON.stringify(customSubjectNames));
    }
    setShowSubjectModal(false);
    Swal.fire({
      title: "บันทึกสำเร็จ",
      text: "ระบบได้บันทึกการตั้งค่าภาษาเรียบร้อยแล้ว",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleResetSubjectNames = () => {
    setCustomSubjectNames({});
    if (typeof window !== "undefined" && selectedSettingId) {
      localStorage.removeItem(`achievement_subject_names_${selectedSettingId}`);
    }
  };

  // Recalculate every displayed row from raw scores.
  const calculatedMatrixRows = useMemo(() => {
    if (!data) return [];

    return data.matrix_rows.map((row) => {
      let totalAllSubjects = 0;
      let maxPossibleAllSubjects = 0;

      const subjectStats = data.subjects.map((subject) => {
        const sourceStat = row.subject_stats.find((stat) => stat.subject_id === subject.id);
        const totalScore = Number(sourceStat?.total_score) || 0;
        const isActivityScoreEnabled =
          subject.subject_type !== "activity" ||
          subject.score_enabled_classroom_ids?.includes(row.classroom_id) === true;
        const maxPossibleScore = isActivityScoreEnabled
          ? row.student_count * Math.max(0, Number(subject.max_score) || 0)
          : 0;
        const avgPercentage = maxPossibleScore > 0
          ? (totalScore * 100) / maxPossibleScore
          : 0;

        totalAllSubjects += totalScore;
        maxPossibleAllSubjects += maxPossibleScore;

        return {
          subject_id: subject.id,
          subject_name: sourceStat?.subject_name || subject.name,
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          avg_percentage: avgPercentage,
        };
      });

      const overallAvgPercentage = maxPossibleAllSubjects > 0
        ? (totalAllSubjects * 100) / maxPossibleAllSubjects
        : 0;

      return {
        ...row,
        subject_stats: subjectStats,
        total_all_subjects: totalAllSubjects,
        max_possible_all_subjects: maxPossibleAllSubjects,
        overall_avg_percentage: overallAvgPercentage,
      };
    });
  }, [data]);

  // Dynamic Filtering: Compute recalculated matrix rows for selected classrooms
  const filteredMatrixRows = useMemo(() => {
    return calculatedMatrixRows.filter((r) => selectedClassroomIds.includes(r.classroom_id));
  }, [calculatedMatrixRows, selectedClassroomIds]);

  // Dynamic Filtering: Recalculate summary totals for selected classrooms.
  const filteredSchoolSummary = useMemo(() => {
    if (!data) {
      return {
        total_students: 0,
        subject_stats: [],
        total_all_subjects: 0,
        max_possible_all_subjects: 0,
        overall_avg_percentage: 0,
      };
    }

    const totalStudents = filteredMatrixRows.reduce((sum, r) => sum + r.student_count, 0);
    let schoolAllSubjectsTotal = 0;
    let schoolAllSubjectsMaxTotal = 0;

    const subjectStats = data.subjects.map((subj) => {
      let totalSubjectScore = 0;
      let classroomPercentageTotal = 0;
      let classroomPercentageCount = 0;

      filteredMatrixRows.forEach((r) => {
        const st = r.subject_stats.find((s) => s.subject_id === subj.id);
        if (st) {
          totalSubjectScore += st.total_score;
          classroomPercentageTotal += st.avg_percentage;
          classroomPercentageCount += 1;
        }
      });

      const maxPossibleScore = filteredMatrixRows.reduce(
        (sum, row) => sum + (row.subject_stats.find((stat) => stat.subject_id === subj.id)?.max_possible_score || 0),
        0
      );
      const avgPercentage = classroomPercentageCount > 0
        ? classroomPercentageTotal / classroomPercentageCount
        : 0;

      schoolAllSubjectsTotal += totalSubjectScore;
      schoolAllSubjectsMaxTotal += maxPossibleScore;

      return {
        subject_id: subj.id,
        subject_name: subj.name,
        total_score: totalSubjectScore,
        max_possible_score: maxPossibleScore,
        avg_percentage: parseFloat(avgPercentage.toFixed(2)),
      };
    });

    const overallAvgPercentage = filteredMatrixRows.length > 0
      ? filteredMatrixRows.reduce((sum, row) => sum + row.overall_avg_percentage, 0) / filteredMatrixRows.length
      : 0;

    return {
      total_students: totalStudents,
      subject_stats: subjectStats,
      total_all_subjects: schoolAllSubjectsTotal,
      max_possible_all_subjects: schoolAllSubjectsMaxTotal,
      overall_avg_percentage: parseFloat(overallAvgPercentage.toFixed(2)),
    };
  }, [data, filteredMatrixRows]);

  // Print PDF Export (A4 Landscape - รายงานสรุปผลสัมฤทธิ์)
  const handlePrintReport = () => {
    if (!data || filteredMatrixRows.length === 0) {
      Swal.fire("แจ้งเตือน", "กรุณาเลือกระดับชั้นเรียนที่ต้องการคำนวณอย่างน้อย 1 ห้อง", "warning");
      return;
    }

    const title = reportTitle || "รายงานสรุปผลสัมฤทธิ์ทางการเรียน";
    const agency = agencyName ? `<div style="font-size: 14px; font-weight: 600; margin-bottom: 2px;">${agencyName}</div>` : "";
    const termInfo = `ปีการศึกษา ${data.academic_year} ภาคเรียนที่ ${data.term}`;

    const headersTopHtml = data.subjects
      .map(
        (s) =>
          `<th colspan="2" style="border: 1px solid #1e293b; padding: 6px 4px; background: #f8fafc; font-size: 11px; text-align: center;">
            ${getSubjectName(s)}<br/>
            <span style="font-size: 9px; font-weight: normal; color: #475569;">(เต็ม ${s.max_score})</span>
          </th>`
      )
      .join("");

    const headersSubHtml = data.subjects
      .map(
        () =>
          `<th style="border: 1px solid #1e293b; padding: 4px 2px; font-size: 10px; text-align: right; background: #f1f5f9;">รวม</th>
           <th style="border: 1px solid #1e293b; padding: 4px 2px; font-size: 10px; text-align: right; background: #f1f5f9; color: #b45309;">%</th>`
      )
      .join("");

    const rowsHtml = filteredMatrixRows
      .map((row, idx) => {
        const statsCols = row.subject_stats
          .map(
            (st) =>
              `<td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: right; font-family: monospace; font-size: 11px;">
                ${st.total_score.toLocaleString()}
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: right; font-family: monospace; font-size: 11px; font-weight: bold; color: ${
                st.avg_percentage >= 50 ? "#047857" : "#be123c"
              }">
                ${st.avg_percentage.toFixed(2)}%
              </td>`
          )
          .join("");

        return `<tr>
          <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-size: 11px;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: bold; font-size: 11px;">${getClassroomName(row, globalActiveLang)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-weight: bold; font-size: 11px;">${row.student_count}</td>
          ${statsCols}
          <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: right; font-family: monospace; font-size: 11px; font-weight: bold; background: #f8fafc;">
            ${row.total_all_subjects.toLocaleString()}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: right; font-family: monospace; font-size: 11px; font-weight: bold; color: #4338ca; background: #f5f3ff;">
            ${row.overall_avg_percentage.toFixed(2)}%
          </td>
        </tr>`;
      })
      .join("");

    const summaryStatsCols = filteredSchoolSummary.subject_stats
      .map(
        (st) =>
          `<td style="border: 1px solid #1e293b; padding: 6px 4px; text-align: right; font-family: monospace; font-size: 11px;">
            ${st.total_score.toLocaleString()}
          </td>
          <td style="border: 1px solid #1e293b; padding: 6px 4px; text-align: right; font-family: monospace; font-size: 11px; font-weight: bold; color: #f59e0b;">
            ${st.avg_percentage.toFixed(2)}%
          </td>`
      )
      .join("");

    const summaryRowHtml = `<tr style="background: #1e1b4b; color: white; font-weight: bold;">
      <td colspan="2" style="border: 1px solid #1e293b; padding: 6px 8px; text-align: center; font-size: 11px;">
        รวมทั้งหมด (${filteredMatrixRows.length} ระดับชั้น)
      </td>
      <td style="border: 1px solid #1e293b; padding: 6px 4px; text-align: center; font-size: 11px;">
        ${filteredSchoolSummary.total_students}
      </td>
      ${summaryStatsCols}
      <td style="border: 1px solid #1e293b; padding: 6px 4px; text-align: right; font-family: monospace; font-size: 11px;">
        ${filteredSchoolSummary.total_all_subjects.toLocaleString()}
      </td>
      <td style="border: 1px solid #1e293b; padding: 6px 4px; text-align: right; font-family: monospace; font-size: 11px; color: #facc15;">
        ${filteredSchoolSummary.overall_avg_percentage.toFixed(2)}%
      </td>
    </tr>`;

    const printHtml = `<!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8">
      <title>${title} - ${termInfo}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: 'Sarabun', 'Noto Sans Thai', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; }
        .report-header { text-align: center; margin-bottom: 12px; }
        .report-title { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
        .report-sub { font-size: 12px; color: #475569; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
        th, td { border: 1px solid #94a3b8; }
        .signature-section { margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .signature-box { width: 220px; text-align: center; font-size: 11px; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="report-header">
        ${agency}
        <div class="report-title">${title}</div>
        <div class="report-sub">${termInfo} ${includeActivity ? "(รวมวิชากิจกรรม)" : ""}</div>
      </div>
      <table>
        <thead>
          <tr style="background: #0f172a; color: white;">
            <th rowspan="2" style="border: 1px solid #0f172a; padding: 6px 2px; width: 30px; text-align: center;">ที่</th>
            <th rowspan="2" style="border: 1px solid #0f172a; padding: 6px 8px; text-align: left; width: 110px;">ระดับชั้น</th>
            <th rowspan="2" style="border: 1px solid #0f172a; padding: 6px 4px; text-align: center; width: 65px;">จำนวน<br/>นักเรียน</th>
            ${headersTopHtml}
            <th colspan="2" style="border: 1px solid #0f172a; padding: 6px 4px; background: #3730a3; text-align: center;">รวมทุกวิชา</th>
          </tr>
          <tr style="background: #1e293b; color: #cbd5e1;">
            ${headersSubHtml}
            <th style="border: 1px solid #1e293b; padding: 4px 2px; text-align: right; background: #312e81; color: white;">รวม</th>
            <th style="border: 1px solid #1e293b; padding: 4px 2px; text-align: right; background: #312e81; color: #facc15;">%</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          ${summaryRowHtml}
        </tfoot>
      </table>
      <div class="signature-section">
        <div class="signature-box">
          <div>ลงชื่อ..........................................................</div>
          <div>(..........................................................)</div>
          <div>เจ้าหน้าที่ฝ่ายวิชาการ / วัดผล</div>
          <div>วันที่........เดือน....................พ.ศ. ........</div>
        </div>
        <div class="signature-box">
          <div>ลงชื่อ..........................................................</div>
          <div>(..........................................................)</div>
          <div>ผู้อำนวยการ / หัวหน้าสถานศึกษา</div>
          <div>วันที่........เดือน....................พ.ศ. ........</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>`;

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  };

  // Export to Excel (Full matrix calculations)
  const handleExportExcel = async () => {
    if (!data || filteredMatrixRows.length === 0) return;
    try {
      const XLSX = await import("xlsx");
      const title = reportTitle || "รายงานสรุปผลสัมฤทธิ์ทางการเรียน";
      const termInfo = `ปีการศึกษา ${data.academic_year} ภาคเรียนที่ ${data.term}`;

      const headerRow1: string[] = ["ที่", "ระดับชั้น", "จำนวนนักเรียน"];
      const headerRow2: string[] = ["", "", ""];

      data.subjects.forEach((subj) => {
        const sName = `${getSubjectName(subj)} (เต็ม ${subj.max_score})`;
        headerRow1.push(sName, "");
        headerRow2.push("รวมดิบ", "เฉลี่ย (%)");
      });

      headerRow1.push("คะแนนรวมทุกวิชา", "");
      headerRow2.push("รวมดิบ", "เฉลี่ยรวม (%)");

      const dataRows: (string | number)[][] = filteredMatrixRows.map((row, idx) => {
        const r: (string | number)[] = [idx + 1, getClassroomName(row, globalActiveLang), row.student_count];
        row.subject_stats.forEach((st) => {
          r.push(st.total_score, Number(st.avg_percentage.toFixed(2)));
        });
        r.push(row.total_all_subjects, Number(row.overall_avg_percentage.toFixed(2)));
        return r;
      });

      const summaryRow: (string | number)[] = [
        "",
        `รวมทั้งหมด (${filteredMatrixRows.length} ระดับชั้น)`,
        filteredSchoolSummary.total_students,
      ];
      filteredSchoolSummary.subject_stats.forEach((st) => {
        summaryRow.push(st.total_score, Number(st.avg_percentage.toFixed(2)));
      });
      summaryRow.push(
        filteredSchoolSummary.total_all_subjects,
        Number(filteredSchoolSummary.overall_avg_percentage.toFixed(2))
      );

      const aoa = [
        [title],
        [agencyName || data.school_name || ""],
        [termInfo + (includeActivity ? " (รวมวิชากิจกรรม)" : "")],
        [],
        headerRow1,
        headerRow2,
        ...dataRows,
        summaryRow,
      ];

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ผลสัมฤทธิ์");

      const fileName = `${title}_${data.academic_year}_เทอม${data.term}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      console.error("Excel export error:", e);
      Swal.fire("ผิดพลาด", "ไม่สามารถส่งออก Excel ได้", "error");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!data || filteredMatrixRows.length === 0) return;
    const title = reportTitle || "รายงานสรุปผลสัมฤทธิ์ทางการเรียน";
    const header1 = ["ที่", "ระดับชั้น", "จำนวนนักเรียน"];
    data.subjects.forEach((subj) => {
      header1.push(`"${getSubjectName(subj)} (รวมดิบ)"`, `"${getSubjectName(subj)} (เฉลี่ย %)"`);
    });
    header1.push("คะแนนรวมทุกวิชารวมดิบ", "คะแนนเฉลี่ยรวมทุกวิชาร้อยละ");

    const rows = filteredMatrixRows.map((row, idx) => {
      const r = [idx + 1, `"${getClassroomName(row, globalActiveLang)}"`, row.student_count];
      row.subject_stats.forEach((st) => {
        r.push(st.total_score, st.avg_percentage.toFixed(2));
      });
      r.push(row.total_all_subjects, row.overall_avg_percentage.toFixed(2));
      return r.join(",");
    });

    const sumRow = ["", `"รวมทั้งหมด (${filteredMatrixRows.length} ชั้น)"`, filteredSchoolSummary.total_students];
    filteredSchoolSummary.subject_stats.forEach((st) => {
      sumRow.push(st.total_score, st.avg_percentage.toFixed(2));
    });
    sumRow.push(filteredSchoolSummary.total_all_subjects, filteredSchoolSummary.overall_avg_percentage.toFixed(2));

    const csvContent = "\uFEFF" + [header1.join(","), ...rows, sumRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title}_${data.academic_year}_${data.term}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto animate-fade-in-up pb-16">
      {/* =========================================================================
          SECTION 1: TOP EXECUTIVE COMMAND BAR (Title, Language, Actions)
          ========================================================================= */}
      <div className="card-modern p-4 sm:p-6 border border-border/80 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                <TrendingUp className="w-3.5 h-3.5" />
                Academic Matrix Report
              </span>
              {data && (
                <span className="text-xs font-semibold text-muted-foreground">
                  ปีการศึกษา {data.academic_year} · ภาคเรียนที่ {data.term}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              รายงานสรุปผลสัมฤทธิ์ทางการเรียน
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              ตารางวิเคราะห์คะแนนรวมและคะแนนเฉลี่ยร้อยละ (%) ทุกระดับชั้นและรายวิชา
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Language Switcher */}
            <div className="inline-flex p-1 bg-muted rounded-xl border border-border text-xs font-bold">
              <button
                type="button"
                onClick={() => setGlobalActiveLang("thai")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  globalActiveLang === "thai"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🇹🇭 ไทย
              </button>
              <button
                type="button"
                onClick={() => setGlobalActiveLang("rumi")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  globalActiveLang === "rumi"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🇲🇾 Rumi
              </button>
              <button
                type="button"
                onClick={() => setGlobalActiveLang("arabic")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  globalActiveLang === "arabic"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🇸🇦 Jawi
              </button>
            </div>

            {/* Config & Exports */}
            <button
              type="button"
              onClick={() => setShowSubjectModal(true)}
              disabled={!data || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 transition-all cursor-pointer disabled:opacity-40"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ปรับแต่งชื่อวิชา</span>
            </button>

            <div className="inline-flex rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={!data || loading || filteredMatrixRows.length === 0}
                className="px-3 py-2 text-xs font-bold text-foreground hover:bg-muted border-r border-border transition-colors cursor-pointer disabled:opacity-40"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!data || loading || filteredMatrixRows.length === 0}
                className="px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-40"
              >
                Excel
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrintReport}
              disabled={!data || loading || filteredMatrixRows.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน A4</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: CONSOLIDATED CONTROL & FILTER CONSOLE (Clean, unified card)
          ========================================================================= */}
      <div className="card-modern p-4 sm:p-5 border border-border/80 shadow-xs space-y-4">
        {/* Row 1: Academic Year / Term selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-foreground">เลือกปีการศึกษา / ภาคเรียน:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {settingsList.length === 0 ? (
              <span className="text-xs text-muted-foreground">ไม่มีข้อมูลปีการศึกษา</span>
            ) : (
              settingsList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSettingId(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedSettingId === s.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-border hover:border-indigo-400 hover:text-foreground"
                  }`}
                >
                  ปี {s.academic_year} เทอม {s.term}
                  {s.is_active && (
                    <span
                      className={`ml-1.5 text-[10px] px-1 py-0.2 rounded-full ${
                        selectedSettingId === s.id
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      Active
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Row 2: Classroom Scope Filter Chips - FULL TEXT VISIBLE, NEVER CUT OFF! */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                🏫 เลือกระดับชั้นที่นำมาคำนวณ ({selectedClassroomIds.length}/{data?.matrix_rows.length || 0} ชั้น):
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                (คลิกเพื่อเปิด/ปิดระดับชั้นที่ต้องการสรุป)
              </span>
            </div>
            {data && data.matrix_rows.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllClassrooms}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {selectedClassroomIds.length === data.matrix_rows.length ? "✕ ยกเลิกทั้งหมด" : "✓ เลือกทุกระดับชั้น"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!data || data.matrix_rows.length === 0 ? (
              <span className="text-xs text-muted-foreground py-1">ไม่มีข้อมูลระดับชั้นเรียน</span>
            ) : (
              data.matrix_rows.map((row) => {
                const isSelected = selectedClassroomIds.includes(row.classroom_id);
                const name = getClassroomName(row, globalActiveLang);
                return (
                  <button
                    key={row.classroom_id}
                    type="button"
                    onClick={() => handleToggleClassroom(row.classroom_id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-xs"
                        : "bg-muted/30 text-muted-foreground border-border hover:border-indigo-400 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] font-bold ${
                        isSelected ? "bg-white text-indigo-600" : "border border-border text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span>{name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-muted text-subtle-foreground"
                      }`}
                    >
                      {row.student_count} คน
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Row 3: Options (Activity switch + Report header drawer toggle) */}
        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeActivity}
              onChange={(e) => setIncludeActivity(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative h-5 w-9 shrink-0 rounded-full bg-muted-foreground/20 peer peer-focus:outline-none peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all" />
            <span className="font-semibold text-foreground">รวมวิชากิจกรรมพัฒนาผู้เรียน (ที่มีคะแนน)</span>
          </label>

          <button
            type="button"
            onClick={() => setShowReportDetails(!showReportDetails)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-muted transition-colors"
          >
            <span>✏️ ปรับแต่งหัวกระดาษรายงาน (ชื่อเรื่อง / สังกัด)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showReportDetails ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Collapsible Panel for Report Title & Agency */}
        {showReportDetails && (
          <div className="p-3.5 bg-muted/30 rounded-xl border border-border grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">หัวข้อรายงาน (Report Title):</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="รายงานสรุปผลสัมฤทธิ์ทางการเรียน"
                className="input-modern !py-1.5 !px-3 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">ชื่อสถานศึกษา / สังกัด (สำหรับหัวกระดาษพิมพ์):</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder={data?.school_name || "เช่น ศูนย์ตาดีกา..."}
                className="input-modern !py-1.5 !px-3 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: KPI METRICS (Clean 4-column summary strip)
          ========================================================================= */}
      {data && data.matrix_rows.length > 0 && data.subjects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card-modern p-3.5 border border-border/80 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-muted-foreground truncate">นักเรียนที่คำนวณ</div>
              <div className="text-base sm:text-lg font-extrabold text-foreground truncate">
                {filteredSchoolSummary.total_students} <span className="text-xs font-normal text-muted-foreground">คน</span>
              </div>
            </div>
          </div>

          <div className="card-modern p-3.5 border border-border/80 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <School className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-muted-foreground truncate">ระดับชั้นที่เลือก</div>
              <div className="text-base sm:text-lg font-extrabold text-foreground truncate">
                {filteredMatrixRows.length} <span className="text-xs font-normal text-muted-foreground">/ {data.matrix_rows.length} ชั้น</span>
              </div>
            </div>
          </div>

          <div className="card-modern p-3.5 border border-border/80 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-muted-foreground truncate">จำนวนรายวิชา</div>
              <div className="text-base sm:text-lg font-extrabold text-foreground truncate">
                {data.subjects.length} <span className="text-xs font-normal text-muted-foreground">วิชา</span>
              </div>
            </div>
          </div>

          <div className="card-modern p-3.5 border border-border/80 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-muted-foreground truncate">เฉลี่ยรวมภาพรวม</div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                {filteredSchoolSummary.overall_avg_percentage.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 4: ACADEMIC ACHIEVEMENT MATRIX (Main Report Table)
          ========================================================================= */}
      {loading ? (
        <div className="card-modern p-16 text-center border border-border shadow-sm">
          <div className="inline-block w-9 h-9 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">กำลังคำนวณสถิติผลสัมฤทธิ์...</p>
        </div>
      ) : !data || data.matrix_rows.length === 0 ? (
        <div className="card-modern p-16 text-center border border-dashed border-border shadow-sm">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h4 className="font-bold text-foreground text-base">ไม่พบข้อมูลคะแนนในภาคเรียนที่เลือก</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            กรุณาเลือกปีการศึกษาและภาคเรียนที่มีการบันทึกคะแนนเรียบร้อยแล้ว
          </p>
        </div>
      ) : filteredMatrixRows.length === 0 ? (
        <div className="card-modern p-16 text-center border border-dashed border-border shadow-sm space-y-3">
          <AlertCircle className="w-12 h-12 text-amber-500/50 mx-auto" />
          <h4 className="font-bold text-foreground text-base">ไม่ได้เลือกระดับชั้นเรียนสำหรับการคำนวณ</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            กรุณาติ๊กเลือกระดับชั้นเรียนในกล่องด้านบนอย่างน้อย 1 ห้อง เพื่อประมวลผลตารางผลสัมฤทธิ์
          </p>
          <button
            type="button"
            onClick={handleSelectAllClassrooms}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
          >
            เลือกทุกระดับชั้น
          </button>
        </div>
      ) : (
        <div className="card-modern overflow-hidden border border-border/80 shadow-sm">
          {/* Mobile View Toggle Bar */}
          <div className="md:hidden p-3 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20">
            <span className="text-xs font-bold text-foreground">มุมมองผลสัมฤทธิ์:</span>
            <div className="inline-flex p-0.5 bg-muted rounded-lg border border-border text-xs font-bold">
              <button
                type="button"
                onClick={() => setMobileViewMode("cards")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  mobileViewMode === "cards" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                }`}
              >
                การ์ดสรุป
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode("table")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  mobileViewMode === "table" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                }`}
              >
                ตารางเต็ม
              </button>
            </div>
          </div>

          {/* DESKTOP & TABLET MATRIX TABLE (md:block or mobile table mode) */}
          <div className={`${mobileViewMode === "table" ? "block" : "hidden md:block"} overflow-x-auto max-h-[720px] overflow-y-auto scrollbar-thin`}>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                {/* Top Tier Headers */}
                <tr className="bg-slate-800 text-white sticky top-0 z-20">
                  <th
                    rowSpan={2}
                    className="w-12 text-center border-r border-slate-700 py-3 px-2 font-bold text-xs"
                  >
                    ที่
                  </th>
                  <th
                    rowSpan={2}
                    className="min-w-[150px] border-r border-slate-700 py-3 px-3.5 font-bold text-xs"
                  >
                    ระดับชั้น
                  </th>
                  <th
                    rowSpan={2}
                    className="min-w-[90px] text-center border-r border-slate-700 py-3 px-2 font-bold text-xs"
                  >
                    จำนวนนักเรียน<br />
                    <span className="font-normal text-[10px] text-slate-300">(คน)</span>
                  </th>

                  {data.subjects.map((subj) => (
                    <th
                      key={subj.id}
                      colSpan={2}
                      className="px-3 py-2 text-center border-b border-r border-slate-700 font-bold bg-slate-800 text-slate-100 min-w-[150px]"
                    >
                      <div className="truncate font-bold">{getSubjectName(subj)}</div>
                      <span className="text-[10px] font-normal text-slate-300 block">
                        (เต็ม {subj.max_score} คะแนน)
                      </span>
                    </th>
                  ))}

                  <th
                    colSpan={2}
                    className="bg-indigo-700 text-white font-extrabold px-4 py-2 text-center border-b border-indigo-600 min-w-[170px]"
                  >
                    คะแนนรวมทุกวิชา
                  </th>
                </tr>

                {/* Sub Tier Headers */}
                <tr className="bg-slate-700 text-slate-200 text-[11px] font-semibold sticky top-[48px] z-20">
                  {data.subjects.map((subj) => (
                    <Fragment key={`head-sub-${subj.id}`}>
                      <th className="px-3 py-1.5 text-right border-r border-slate-600 font-mono min-w-[75px]">
                        รวมดิบ
                      </th>
                      <th className="px-3 py-1.5 text-right border-r border-slate-600 text-amber-300 font-mono font-bold min-w-[75px]">
                        เฉลี่ย (%)
                      </th>
                    </Fragment>
                  ))}
                  <th className="px-3.5 py-1.5 text-right border-r border-indigo-600 bg-indigo-800 text-white font-mono min-w-[85px]">
                    รวมดิบ
                  </th>
                  <th className="px-3.5 py-1.5 text-right bg-indigo-800 text-amber-300 font-mono font-bold min-w-[85px]">
                    เฉลี่ยรวม (%)
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/70 font-medium">
                {filteredMatrixRows.map((row, idx) => (
                  <tr key={row.classroom_id} className="hover:bg-muted/40 transition-colors">
                    {/* Col 1: Index */}
                    <td className="text-center py-3 px-2 border-r border-border text-muted-foreground font-semibold">
                      {idx + 1}
                    </td>

                    {/* Col 2: Classroom Name */}
                    <td className="py-3 px-3.5 border-r border-border font-bold text-foreground whitespace-nowrap">
                      {getClassroomName(row, globalActiveLang)}
                    </td>

                    {/* Col 3: Student Count */}
                    <td className="text-center py-3 px-2 border-r border-border font-bold text-foreground">
                      {row.student_count}
                    </td>

                    {/* Subject Columns: Raw Score + Percentage (PLENTY OF PADDING, NO DIGITS CUT OFF!) */}
                    {row.subject_stats.map((st) => (
                      <Fragment key={st.subject_id}>
                        <td className="px-3.5 py-3 text-right border-r border-border/60 font-mono text-foreground whitespace-nowrap">
                          {st.total_score.toLocaleString()}
                        </td>
                        <td
                          className={`px-3.5 py-3 text-right border-r border-border font-mono font-bold whitespace-nowrap ${
                            st.avg_percentage >= 50
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {st.avg_percentage.toFixed(2)}%
                        </td>
                      </Fragment>
                    ))}

                    {/* Total Columns */}
                    <td className="px-3.5 py-3 text-right border-r border-border font-mono font-bold text-foreground bg-muted/20 whitespace-nowrap">
                      {row.total_all_subjects.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 whitespace-nowrap">
                      {row.overall_avg_percentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Summary Footer */}
              <tfoot>
                <tr className="bg-indigo-950 text-white font-bold border-t-2 border-indigo-700 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                  <td
                    colSpan={2}
                    className="px-4 py-3.5 text-center border-r border-indigo-800 text-xs sm:text-sm whitespace-nowrap"
                  >
                    รวมทั้งหมด ({filteredMatrixRows.length} ระดับชั้น)
                  </td>
                  <td className="px-3 py-3.5 text-center border-r border-indigo-800 text-sm font-bold">
                    {filteredSchoolSummary.total_students}
                  </td>
                  {filteredSchoolSummary.subject_stats.map((st) => (
                    <Fragment key={`sch-${st.subject_id}`}>
                      <td className="px-3.5 py-3.5 text-right border-r border-indigo-800 font-mono whitespace-nowrap">
                        {st.total_score.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-3.5 text-right border-r border-indigo-800 font-mono text-amber-300 font-bold whitespace-nowrap">
                        {st.avg_percentage.toFixed(2)}%
                      </td>
                    </Fragment>
                  ))}
                  <td className="px-3.5 py-3.5 text-right border-r border-indigo-800 font-mono bg-indigo-900 whitespace-nowrap">
                    {filteredSchoolSummary.total_all_subjects.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-3.5 text-right font-mono text-amber-300 text-sm font-extrabold bg-indigo-900 whitespace-nowrap">
                    {filteredSchoolSummary.overall_avg_percentage.toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* MOBILE CARDS VIEW (md:hidden when mobileViewMode === "cards") */}
          {mobileViewMode === "cards" && (
            <div className="space-y-3.5 p-3.5 sm:p-4 md:hidden">
              {filteredMatrixRows.map((row, index) => (
                <article
                  key={row.classroom_id}
                  className="card-modern p-4 space-y-3.5 border border-border/80 shadow-xs"
                >
                  {/* Classroom Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-sm truncate">
                          {getClassroomName(row, globalActiveLang)}
                        </h4>
                        <div className="text-xs text-muted-foreground">{row.student_count} คน</div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                        row.overall_avg_percentage >= 50
                          ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                          : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30"
                      }`}
                    >
                      เฉลี่ย {row.overall_avg_percentage.toFixed(2)}%
                    </span>
                  </div>

                  {/* Totals Strip */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-center text-xs">
                    <div>
                      <div className="text-muted-foreground text-[11px]">คะแนนรวมดิบ</div>
                      <div className="font-mono font-bold text-foreground mt-0.5">
                        {row.total_all_subjects.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[11px]">เฉลี่ยรวมร้อยละ</div>
                      <div className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {row.overall_avg_percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Subject Breakdown */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      คะแนนแยกตามรายวิชา:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {row.subject_stats.map((stat) => (
                        <div
                          key={stat.subject_id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border/60 text-xs"
                        >
                          <span className="min-w-0 truncate text-muted-foreground font-medium">
                            {getSubjectName(stat)}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-foreground text-[11px]">
                              {stat.total_score.toLocaleString()}
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                stat.avg_percentage >= 50
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {stat.avg_percentage.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 5: MULTI-LANGUAGE SUBJECT MODAL (Clean, modern form)
          ========================================================================= */}
      {showSubjectModal && data && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  จัดการภาษาชื่อรายวิชา (Thai / Rumi / Arabic)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ป้อนชื่อภาษาไทย ภาษาอักษรรูมี (Rumi) และอักษรอาหรับ/ยาวี (Arabic/Jawi) บันทึกลงฐานข้อมูล PostgreSQL
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubjectModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Global Display Language Selector */}
              <div className="bg-muted/30 border border-border p-4 rounded-2xl space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  เลือกภาษาหลักที่จะให้แสดงในรายงาน ณ ปัจจุบัน:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setGlobalActiveLang("thai")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      globalActiveLang === "thai"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-card text-foreground border-border hover:border-indigo-400"
                    }`}
                  >
                    🇹🇭 ภาษาไทย (Thai)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalActiveLang("rumi")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      globalActiveLang === "rumi"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-card text-foreground border-border hover:border-indigo-400"
                    }`}
                  >
                    🔤 Rumi / English
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalActiveLang("arabic")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      globalActiveLang === "arabic"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-card text-foreground border-border hover:border-indigo-400"
                    }`}
                  >
                    🇸🇦 อักษรอาหรับ (Arabic / Jawi)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleApplyArabicPresets}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>เติมชื่อพรีเซ็ตอัตโนมัติ (Presets)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSubjectNames}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ล้างชื่อทั้งหมด</span>
                  </button>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  ดึงจากระบบ ({data.subjects.length} วิชา)
                </span>
              </div>

              {/* Multi-Language Subject Inputs */}
              <div className="space-y-3">
                {data.subjects.map((subj) => {
                  const entry = customSubjectNames[subj.id] || {};
                  return (
                    <div
                      key={`mod-subj-${subj.id}`}
                      className="bg-card p-3.5 sm:p-4 rounded-2xl border border-border/80 space-y-3 shadow-2xs"
                    >
                      <div className="flex justify-between items-center border-b border-border/60 pb-2">
                        <div>
                          <span className="text-sm font-bold text-foreground">{subj.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">
                            (เต็ม {subj.max_score} คะแนน)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                          แสดงปัจจุบัน: {getSubjectName(subj)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground block">
                            🇹🇭 ภาษาไทย (thai)
                          </label>
                          <input
                            type="text"
                            placeholder={subj.name}
                            value={entry.thai || ""}
                            onChange={(e) =>
                              setCustomSubjectNames((prev) => ({
                                ...prev,
                                [subj.id]: {
                                  ...prev[subj.id],
                                  thai: e.target.value,
                                },
                              }))
                            }
                            className="input-modern px-3 py-1.5 text-xs font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground block">
                            🔤 Rumi / English (rumi)
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น Al-Quran / Fiqh"
                            value={entry.rumi || ""}
                            onChange={(e) =>
                              setCustomSubjectNames((prev) => ({
                                ...prev,
                                [subj.id]: {
                                  ...prev[subj.id],
                                  rumi: e.target.value,
                                },
                              }))
                            }
                            className="input-modern px-3 py-1.5 text-xs font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground block">
                            🇸🇦 อักษรอาหรับ (arabic)
                          </label>
                          <input
                            type="text"
                            dir="auto"
                            placeholder="เช่น القرآن الكريم"
                            value={entry.arabic || ""}
                            onChange={(e) =>
                              setCustomSubjectNames((prev) => ({
                                ...prev,
                                [subj.id]: {
                                  ...prev[subj.id],
                                  arabic: e.target.value,
                                },
                              }))
                            }
                            className="input-modern px-3 py-1.5 text-xs font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSubjectModal(false)}
                className="px-4 py-2 bg-card hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveSubjectNames}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกลงฐานข้อมูล (PostgreSQL)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
