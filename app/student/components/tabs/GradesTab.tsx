import { useState, useEffect, useRef } from "react";
import {
  Download,
  FileText,
  TrendingUp,
  Award,
  BarChart3,
  Clock,
  Star,
  Sparkles,
  Check,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { type DBGrade, type DBSubject, type DBClassroom, type CombinedActivityResult, getGradeInfo } from "../types";
import { getSchoolLogoUrl } from "../../../components/SchoolBrand";
import { getClassroomName } from "../../../lib/classroom";

interface GradesTabProps {
  studentName: string;
  studentCode: string;
  studentNumber?: number | null;
  classroom?: DBClassroom | null;
  classroomName: string;
  homeroomTeacherNames?: string[];
  homeroomTeacherIds?: string[];
  schoolId?: string;
  activeTermStr: string;
  academicHead?: string | null;
  settingsList: any[];
  activeSettingId: number | null;
  onChangeSetting: (setting: any) => void;
  filteredGrades: DBGrade[];
  gpaValue: string;
  gpaCredits: number;
  gpaNum: number;
  gpaColor: string;
  useCombinedActivity: boolean;
  getCombinedActivityResult: () => CombinedActivityResult | null;
  scoredActivitySubjects: DBSubject[];
  subjectsList: DBSubject[];
  midtermMax: number;
  finalMax: number;
  ranking: { school_rank: number; school_total: number; classroom_rank: number; classroom_total: number } | null;
  onGradesReleased: () => void;
}

type PdfLanguage = "th" | "ms-rumi" | "ms-jawi";

function ReleaseCountdownTimer({ targetDateStr, settingName, onReleased }: { targetDateStr: string | null; settingName: string; onReleased: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false
  });
  const hasTriggeredRelease = useRef(false);

  useEffect(() => {
    if (!targetDateStr) return;

    const target = new Date(targetDateStr).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (!hasTriggeredRelease.current) {
          hasTriggeredRelease.current = true;
          onReleased();
        }
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr, onReleased]);

  const formattedTargetDate = targetDateStr
    ? new Date(targetDateStr).toLocaleString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-amber-500/30 p-6 sm:p-10 shadow-sm">
      <div className="pointer-events-none absolute inset-0 bg-amber-500/5" />

      <div className="relative z-10 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
          <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/12 border border-amber-500/25">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">เทอม {settingName}</span>
          </div>

          <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground px-2">
            ผลการเรียนยังไม่เปิดเผย
          </h3>

          <p className="text-sm text-muted-foreground max-w-md mx-auto px-2">
            {formattedTargetDate
              ? `ระบบจะเปิดเผยผลการเรียนในวันที่ ${formattedTargetDate}`
              : "ผู้ดูแลระบบกำลังเตรียมประกาศผลการเรียน"}
          </p>
        </div>

        {targetDateStr && !timeLeft.isExpired && (
          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3">
              เหลือเวลาอีก
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-lg mx-auto">
              {[
                { value: timeLeft.days, label: "วัน" },
                { value: timeLeft.hours, label: "ชั่วโมง" },
                { value: timeLeft.minutes, label: "นาที" },
                { value: timeLeft.seconds, label: "วินาที" }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-muted/60 rounded-xl p-3 sm:p-4 border border-border"
                >
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GradesTab({
  studentName,
  studentCode,
  studentNumber,
  classroom,
  classroomName,
  homeroomTeacherNames = [],
  homeroomTeacherIds = [],
  schoolId,
  activeTermStr,
  academicHead,
  settingsList,
  activeSettingId,
  onChangeSetting,
  filteredGrades,
  gpaValue,
  gpaCredits,
  gpaNum,
  gpaColor,
  useCombinedActivity,
  getCombinedActivityResult,
  scoredActivitySubjects,
  subjectsList,
  midtermMax,
  finalMax,
  ranking,
  onGradesReleased,
}: GradesTabProps) {
  const [pdfLanguage, setPdfLanguage] = useState<PdfLanguage>("th");
  const [school, setSchool] = useState<{ name?: string; name_en?: string; name_jawi?: string; logo_url?: string; logo_drive_file_id?: string } | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    fetch(`/api/public/schools/${encodeURIComponent(schoolId)}`)
      .then((response) => response.ok ? response.json() : null)
      .then(setSchool)
      .catch(() => setSchool(null));
  }, [schoolId]);

  // Check release status for active setting
  const activeSetting = settingsList.find((s: any) => s.id === activeSettingId);
  const isManualReleased = activeSetting?.is_grade_released !== false;
  const releaseDateStr = activeSetting?.grade_release_date || null;

  let isGradeReleased = true;

  if (releaseDateStr && releaseDateStr.trim() !== "") {
    const targetTime = new Date(releaseDateStr).getTime();
    const now = new Date().getTime();
    isGradeReleased = now >= targetTime;
  } else {
    isGradeReleased = isManualReleased;
  }

  const orderedGrades = [...filteredGrades].sort((a, b) => {
    const aOrder = subjectsList.find(s => s.name?.trim().toLowerCase() === a.subject?.trim().toLowerCase() && s.setting_id === activeSettingId)?.sort_order ?? 999;
    const bOrder = subjectsList.find(s => s.name?.trim().toLowerCase() === b.subject?.trim().toLowerCase() && s.setting_id === activeSettingId)?.sort_order ?? 999;
    return aOrder - bOrder || a.subject.localeCompare(b.subject, "th");
  });

  // Include scored activities in the student's total and percentage. GPA remains academic-only.
  let totalPercent = 0;
  let subjectCount = 0;
  let totalEarnedScore = 0;
  let totalPossibleScore = 0;
  filteredGrades.forEach(g => {
    const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
    const isActivity = subject?.subject_type === "activity";
    const activityHasScores = (Number(subject?.midterm_max_score) || 0) + (Number(subject?.final_max_score) || 0) > 0;
    if (isActivity && !activityHasScores) return;
    const mMax = isActivity ? Number(subject?.midterm_max_score) : Number(subject?.midterm_max_score) || midtermMax;
    const fMax = isActivity ? Number(subject?.final_max_score) : Number(subject?.final_max_score) || finalMax;
    const totalScore = (g.midterm_score ?? 0) + (g.final_score ?? 0);
    const percent = mMax + fMax > 0 ? (totalScore / (mMax + fMax)) * 100 : 0;
    totalPercent += percent;
    totalEarnedScore += totalScore;
    totalPossibleScore += mMax + fMax;
    subjectCount++;
  });
  const avgPercent = subjectCount > 0 ? Math.round(totalPercent / subjectCount) : 0;
  const overallPercent = totalPossibleScore > 0
    ? Number(((totalEarnedScore / totalPossibleScore) * 100).toFixed(2))
    : 0;

  const handleExportGrades = () => {
    const rows = orderedGrades.map((grade, index) => {
      const subject = subjectsList.find(
        (item) =>
          item.name?.trim().toLowerCase() === grade.subject?.trim().toLowerCase() &&
          item.setting_id === activeSettingId,
      );
      const midtermMaxScore = Number(subject?.midterm_max_score) || midtermMax;
      const finalMaxScore = Number(subject?.final_max_score) || finalMax;
      const totalScore = (grade.midterm_score ?? 0) + (grade.final_score ?? 0);
      const totalMaxScore = midtermMaxScore + finalMaxScore;
      const percent = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
      const isActivity = subject?.subject_type === "activity";
      const activityResult = isActivity && useCombinedActivity ? getCombinedActivityResult() : null;
      const gradeInfo = isActivity
        ? activityResult
          ? { point: "-", letter: activityResult.label }
          : { point: "-", letter: percent >= 50 ? "ผ่าน" : "ไม่ผ่าน" }
        : getGradeInfo(percent);

      return {
        "بيلاڠن": index + 1,
        "نام ڤلاجران": grade.subject,
        "جم كريديت": isActivity ? "-" : Number(subject?.credit_hours) || 1,
        "مركة كڬياتن": `${grade.midterm_score ?? 0}`,
        "مركة ڤڤريقسأن": `${grade.final_score ?? 0}`,
        "مركة سموا": totalScore,
        "ڬريد": isActivity ? gradeInfo.letter : gradeInfo.point,
      };
    });

    const summaryRows = [
      ["รายงานผลการเรียน"],
      ["ชื่อนักเรียน", studentName],
      ["รหัสนักเรียน", studentCode],
      ["ชั้นเรียน", classroomName],
      ["เลขที่", studentNumber ?? "-"],
      ["ภาคเรียน", activeTermStr],
      ["เกรดเฉลี่ย (GPA)", gpaValue],
      ["หน่วยกิตรวม", gpaCredits],
      ["คะแนนรวม", `${totalEarnedScore}/${totalPossibleScore}`],
      ["เปอร์เซ็นต์รวม", `${overallPercent}%`],
      ["อันดับในห้อง", ranking ? `${ranking.classroom_rank}` : "-"],
      ["อันดับในโรงเรียน", ranking ? `${ranking.school_rank}` : "-"],
      [],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.sheet_add_json(worksheet, rows, { origin: "A14" });
    worksheet["!cols"] = [
      { wch: 10 }, { wch: 35 }, { wch: 12 }, { wch: 14 },
      { wch: 16 }, { wch: 14 }, { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ผลการเรียน");
    XLSX.writeFile(workbook, `ผลการเรียน_${studentCode}_${activeTermStr}.xlsx`);
  };

  const handlePrintTermReport = () => {
    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const dict: Record<string, { th: string; rumi: string; jawi: string }> = {
      "ใบรายงานผลการเรียนรายบุคคล": {
        th: "ใบรายงานผลการเรียนรายบุคคล",
        rumi: "Laporan Natijah Peperiksaan Seseorang",
        jawi: "بورڠ لاڤوران نتيجة ڤڤريقسأن سسؤرڠ",
      },
      "ปีการศึกษา": { th: "ปีการศึกษา", rumi: "Tahun Pengajian", jawi: "تاهون ڤڠاجين" },
      "ภาคเรียนที่": { th: "ภาคเรียนที่", rumi: "Penggal", jawi: "ڤڠگل" },
      "ชื่อ - นามสกุล": { th: "ชื่อ - นามสกุล", rumi: "Nama Murid", jawi: "نام ڤلاجر" },
      "รหัสประจำตัว": { th: "รหัสประจำตัว", rumi: "No. ID", jawi: "نمبر اءي-دي" },
      "ชั้นเรียน": { th: "ชั้นเรียน", rumi: "Kelas", jawi: "كلس" },
      "ชั้น": { th: "ชั้น", rumi: "Kelas", jawi: "كلس" },
      "เลขที่": { th: "เลขที่", rumi: "No.", jawi: "نمبر" },
      "ลำดับ": { th: "ลำดับ", rumi: "Bil.", jawi: "بيلاڠن" },
      "หน่วยกิต": { th: "หน่วยกิต", rumi: "Jam Kredit", jawi: "جم كريديت" },
      "คะแนนเก็บ": { th: "คะแนนเก็บ", rumi: "Kerja Kursus", jawi: "مركة كڬياتن" },
      "คะแนนสอบ": { th: "คะแนนสอบ", rumi: "Peperiksaan", jawi: "مركة ڤڤريقسأن" },
      "คะแนนรวม": { th: "คะแนนรวม", rumi: "Jumlah Markah", jawi: "مركة سموا" },
      "เกรด": { th: "เกรด", rumi: "Gred", jawi: "ڬريد" },
      "ผ่าน": { th: "ผ่าน", rumi: "Lulus", jawi: "لولوس" },
      "ไม่ผ่าน": { th: "ไม่ผ่าน", rumi: "Gagal", jawi: "ڬاڬل" },
      "คะแนนรวมทั้งหมด": { th: "คะแนนรวมทั้งหมด", rumi: "Jumlah Keseluruhan", jawi: "جومله كسولوروهن" },
      "คิดเป็นร้อยละ": { th: "คิดเป็นร้อยละ", rumi: "Peratusan", jawi: "ڤراتوسن" },
      "เกรดเฉลี่ย (GPA)": { th: "เกรดเฉลี่ย (GPA)", rumi: "Purata Gred (GPA)", jawi: "ڤوراتا ڬريد (GPA)" },
      "อันดับในห้องเรียน": { th: "อันดับในห้องเรียน", rumi: "Kedudukan Dalam Kelas", jawi: "كدودوقن دالم كلس" },
      "อันดับในโรงเรียน": { th: "อันดับในโรงเรียน", rumi: "Kedudukan Dalam Sekolah", jawi: "كدودوقن دالم سكوله" },
      "อันดับที่": { th: "อันดับที่", rumi: "Ke-", jawi: "ك-" },
      "ครูประจำชั้น": { th: "ครูประจำชั้น", rumi: "Guru Kelas", jawi: "ڬورو كلس" },
      "หัวหน้าฝ่ายวิชาการ / ผู้อำนวยการ": {
        th: "หัวหน้าฝ่ายวิชาการ / ผู้อำนวยการ",
        rumi: "Guru Penolong Kanan / Pengetua",
        jawi: "كتوابهاڬين ڤلاجران",
      },
      "พิมพ์ / บันทึก PDF": { th: "พิมพ์ / บันทึก PDF", rumi: "Cetak / Simpan PDF", jawi: "چيتق / سيمڤن PDF" },
      "ขนาดตัวอักษร": { th: "ขนาดตัวอักษร", rumi: "Saiz Fon", jawi: "سايز فون" },
    };

    const t = (key: string) => {
      if (pdfLanguage === "ms-rumi") return dict[key]?.rumi || key;
      if (pdfLanguage === "ms-jawi") return dict[key]?.jawi || key;
      return dict[key]?.th || key;
    };

    const isJawi = pdfLanguage === "ms-jawi";
    const langDir = isJawi ? "rtl" : "ltr";
    const alignLeftOrRight = isJawi ? "right" : "left";

    const getSubjectDisplayName = (sub: DBSubject | undefined, fallbackName: string) => {
      if (!sub) return fallbackName;
      if (pdfLanguage === "ms-jawi") return sub.name_jawi || sub.name;
      if (pdfLanguage === "ms-rumi") return sub.name_rumi || sub.name;
      return sub.name;
    };

    const classroomDisplayName = classroom ? getClassroomName(classroom, pdfLanguage) : classroomName;
    const [termVal, yearVal] = activeTermStr.split("/");
    const subtitleText =
      termVal && yearVal
        ? `${t("ปีการศึกษา")} ${yearVal} ${t("ภาคเรียนที่")} ${termVal}`
        : activeTermStr;

    const subjectRowsHTML = orderedGrades
      .map((grade, idx) => {
        const subject = subjectsList.find(
          (item) =>
            item.name?.trim().toLowerCase() === grade.subject?.trim().toLowerCase() &&
            item.setting_id === activeSettingId
        );
        const isActivity = subject?.subject_type === "activity";
        const midMaxScore = Number(subject?.midterm_max_score) || midtermMax;
        const finalMaxScore = Number(subject?.final_max_score) || finalMax;
        const mid = grade.midterm_score ?? null;
        const fin = grade.final_score ?? null;
        const total = mid !== null || fin !== null ? (mid ?? 0) + (fin ?? 0) : null;
        const totalMax = midMaxScore + finalMaxScore;
        const pct = total !== null && totalMax > 0 ? (total / totalMax) * 100 : 0;

        let gStr = "0";
        if (pct >= 80) gStr = "4.0";
        else if (pct >= 75) gStr = "3.5";
        else if (pct >= 70) gStr = "3.0";
        else if (pct >= 65) gStr = "2.5";
        else if (pct >= 60) gStr = "2.0";
        else if (pct >= 55) gStr = "1.5";
        else if (pct >= 50) gStr = "1.0";

        const midText = mid !== null ? mid : "—";
        const finText = fin !== null ? fin : "—";
        const totalText = total !== null ? total : "—";
        const gradeText =
          isActivity && total !== null
            ? t(pct >= 50 ? "ผ่าน" : "ไม่ผ่าน")
            : total !== null
            ? gStr
            : "—";

        return `
          <tr>
            <td style="padding:3.5px 5px;text-align:center;border:1px solid #000;font-size:calc(12px * var(--fs));">${idx + 1}</td>
            <td dir="auto" style="padding:3.5px 8px;border:1px solid #000;font-size:calc(12px * var(--fs));font-weight:600;text-align:${alignLeftOrRight};">${escapeHtml(getSubjectDisplayName(subject, grade.subject))}</td>
            <td style="padding:3.5px 5px;text-align:center;border:1px solid #000;font-size:calc(12px * var(--fs));">${isActivity ? "-" : Number(subject?.credit_hours) || 1}</td>
            <td style="padding:3.5px 5px;text-align:center;border:1px solid #000;font-size:calc(12px * var(--fs));">${midText}</td>
            <td style="padding:3.5px 5px;text-align:center;border:1px solid #000;font-size:calc(12px * var(--fs));">${finText}</td>
            <td style="padding:3.5px 5px;text-align:center;border:1px solid #000;font-size:calc(12px * var(--fs));font-weight:bold;">${totalText}</td>
            <td style="padding:3.5px 5px;text-align:center;border:1px solid #000;font-size:calc(12px * var(--fs));font-weight:800;color:${isActivity ? "#0f172a" : "#4f46e5"};">${escapeHtml(gradeText)}</td>
          </tr>
        `;
      })
      .join("");

    const schoolName =
      pdfLanguage === "ms-jawi"
        ? school?.name_jawi || school?.name || ""
        : pdfLanguage === "ms-rumi"
        ? school?.name_en || school?.name || ""
        : school?.name || "";
    const schoolLogoUrl = getSchoolLogoUrl(school?.logo_drive_file_id, school?.logo_url);
    const schoolLogo = schoolLogoUrl
      ? `<img class="logo" src="${escapeHtml(schoolLogoUrl)}" alt="" />`
      : "";
    const teacherName = homeroomTeacherNames.join(", ") || "-";
    const academicHeadSigImg = activeSettingId
      ? `<img src="/api/signatures/proxy?type=academic_head&id=${activeSettingId}" style="max-height:44px;max-width:130px;object-fit:contain;" onerror="this.style.visibility='hidden'" />`
      : "";
    const homeroomTeacherSigImg =
      homeroomTeacherIds && homeroomTeacherIds.length === 1 && activeSettingId
        ? `<img src="/api/signatures/proxy?type=teacher&id=${homeroomTeacherIds[0]}&settingId=${activeSettingId}" style="max-height:44px;max-width:130px;object-fit:contain;" onerror="this.style.visibility='hidden'" />`
        : "";

    const subjectColTitle =
      pdfLanguage === "th"
        ? "ชื่อวิชาเรียน"
        : pdfLanguage === "ms-rumi"
        ? "Nama Subjek"
        : "نام ڤلاجران";

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html dir="${langDir}" lang="${isJawi ? "ms-Arab" : pdfLanguage}">
      <head>
        <title>${escapeHtml(t("ใบรายงานผลการเรียนรายบุคคล"))} - ${escapeHtml(studentName)}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&family=Sarabun:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: ${isJawi ? "'Noto Naskh Arabic'" : "Sarabun"}, sans-serif;
            margin: 5mm;
            background: #eee;
            color: #111;
            direction: ${langDir};
            text-align: ${alignLeftOrRight};
          }
          .toolbar {
            position: fixed;
            top: 12px;
            ${isJawi ? "left: 12px;" : "right: 12px;"}
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 100;
          }
          .toolbar button {
            padding: 9px 14px;
            background: #1d4ed8;
            color: white;
            border: 0;
            border-radius: 7px;
            font-weight: 700;
            cursor: pointer;
          }
          .fs-controls {
            display: flex;
            align-items: center;
            gap: 6px;
            background: white;
            padding: 6px 12px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-size: 12px;
            font-weight: 600;
          }
          .fs-btn {
            min-width: 28px;
            height: 28px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
          }
          .fs-btn:hover { background: #e2e8f0; }
          .fs-val { min-width: 42px; text-align: center; color: #4f46e5; }
          .report-card {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            margin: 10px auto;
            background: #fff;
            padding: 10mm 15mm;
            transform-origin: top center;
            border: 0;
            box-sizing: border-box;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-top: 2mm;
            margin-bottom: 2.5mm;
          }
          .logo {
            width: 46px;
            height: 46px;
            object-fit: contain;
            margin-bottom: 2px;
          }
          :root { --fs: 1; }
          .school {
            font-size: calc(14px * var(--fs));
            font-weight: 400;
            margin: 0 0 2px;
          }
          .header h1 {
            font-size: calc(16px * var(--fs));
            font-weight: 600;
            margin: 0;
          }
          .header h2 {
            font-size: calc(12px * var(--fs));
            font-weight: 400;
            margin: 2px 0 0;
            color: #555;
          }
          .student-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px 18px;
            margin: 2.5mm 0;
            padding: 2mm 0;
            font-size: calc(12px * var(--fs));
          }
          .info-row { line-height: 1.35; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2.5mm;
            font-size: calc(11.5px * var(--fs));
          }
          th, td {
            border: 1px solid #000;
            padding: 3px 4px;
            line-height: 1.2;
            background: #fff;
            text-align: center;
          }
          th { font-weight: 600; }
          .summary {
            margin-top: 0;
            border: 1px solid #000;
            padding: 2.5mm 3.5mm;
            font-size: calc(11.5px * var(--fs));
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 3px 8px;
          }
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 5mm;
            font-size: calc(12px * var(--fs));
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sig-box {
            width: 220px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .sig-slot {
            height: 46px;
            width: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: center;
          }
          .sig-line {
            width: 180px;
            border-top: 1px dotted #000;
            margin: 4px auto 5px;
          }
          .sig-role {
            font-size: calc(11px * var(--fs));
            color: #555;
            margin-top: 2px;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            body {
              background: #fff !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .toolbar { display: none !important; }
            .report-card {
              margin: 0 auto !important;
              padding: 10mm 15mm !important;
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              border: 0 !important;
              box-shadow: none !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div class="fs-controls">
            <span>${escapeHtml(t("ขนาดตัวอักษร"))}</span>
            <button type="button" class="fs-btn" id="fs-dec">A−</button>
            <span class="fs-val" id="fs-val">100%</span>
            <button type="button" class="fs-btn" id="fs-inc">A+</button>
          </div>
          <button type="button" onclick="window.print()" style="display:inline-flex;align-items:center;gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            ${escapeHtml(t("พิมพ์ / บันทึก PDF"))}
          </button>
        </div>

        <div class="report-card">
          <div class="header">
            ${schoolLogo}
            ${schoolName ? `<div class="school">${escapeHtml(schoolName)}</div>` : ""}
            <h1>${escapeHtml(t("ใบรายงานผลการเรียนรายบุคคล"))}</h1>
            <h2>${escapeHtml(subtitleText)}</h2>
          </div>

          <div class="student-info">
            <div class="info-row"><span>${escapeHtml(t("ชื่อ - นามสกุล"))}:</span> <b>${escapeHtml(studentName)}</b></div>
            <div class="info-row"><span>${escapeHtml(t("รหัสประจำตัว"))}:</span> <b style="font-family:monospace;color:#4f46e5;">${escapeHtml(studentCode)}</b></div>
            <div class="info-row"><span>${escapeHtml(t("ชั้นเรียน"))}:</span> <b>${escapeHtml(t("ชั้น"))} ${escapeHtml(classroomDisplayName)}</b></div>
            <div class="info-row"><span>${escapeHtml(t("เลขที่"))}:</span> <b>${escapeHtml(studentNumber || "-")}</b></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:40px;">${escapeHtml(t("ลำดับ"))}</th>
                <th style="text-align:${alignLeftOrRight};">${escapeHtml(subjectColTitle)}</th>
                <th style="width:70px;">${escapeHtml(t("หน่วยกิต"))}</th>
                <th style="width:80px;">${escapeHtml(t("คะแนนเก็บ"))}</th>
                <th style="width:80px;">${escapeHtml(t("คะแนนสอบ"))}</th>
                <th style="width:80px;">${escapeHtml(t("คะแนนรวม"))}</th>
                <th style="width:70px;">${escapeHtml(t("เกรด"))}</th>
              </tr>
            </thead>
            <tbody>
              ${subjectRowsHTML}
            </tbody>
          </table>

          <div class="summary">
            <div><strong>${escapeHtml(t("คะแนนรวมทั้งหมด"))}:</strong> ${totalEarnedScore} / ${totalPossibleScore}</div>
            <div><strong>${escapeHtml(t("คิดเป็นร้อยละ"))}:</strong> <span style="color:#2563eb;">${overallPercent.toFixed(1)}%</span></div>
            <div><strong>${escapeHtml(t("เกรดเฉลี่ย (GPA)"))}:</strong> <span style="color:#059669;">${escapeHtml(gpaValue)}</span></div>
            <div><strong>${escapeHtml(t("อันดับในห้องเรียน"))}:</strong> ${ranking ? `${escapeHtml(t("อันดับที่"))} ${ranking.classroom_rank}` : "-"}</div>
            <div><strong>${escapeHtml(t("อันดับในโรงเรียน"))}:</strong> ${ranking ? `${escapeHtml(t("อันดับที่"))} ${ranking.school_rank}` : "-"}</div>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-slot">${homeroomTeacherSigImg}</div>
              <div class="sig-line"></div>
              <div><b>( ${escapeHtml(teacherName)} )</b></div>
              <div class="sig-role">${escapeHtml(t("ครูประจำชั้น"))}</div>
            </div>
            <div class="sig-box">
              <div class="sig-slot">${academicHeadSigImg}</div>
              <div class="sig-line"></div>
              <div><b>( ${escapeHtml(academicHead || "........................................................")} )</b></div>
              <div class="sig-role">${escapeHtml(t("หัวหน้าฝ่ายวิชาการ / ผู้อำนวยการ"))}</div>
            </div>
          </div>
        </div>

        <script>
          (function() {
            var scale = 1;
            var MIN = 0.7, MAX = 1.6, STEP = 0.1;
            function apply() {
              document.documentElement.style.setProperty('--fs', scale);
              var valEl = document.getElementById('fs-val');
              if (valEl) valEl.textContent = Math.round(scale * 100) + '%';
            }
            var decBtn = document.getElementById('fs-dec');
            var incBtn = document.getElementById('fs-inc');
            if (decBtn) decBtn.onclick = function() { scale = Math.max(MIN, +(scale - STEP).toFixed(1)); apply(); };
            if (incBtn) incBtn.onclick = function() { scale = Math.min(MAX, +(scale + STEP).toFixed(1)); apply(); };
            apply();
          })();
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Header & Toolbar ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 w-44 h-44 bg-primary/8 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">ผลการเรียน</h2>
              <p className="text-xs text-muted-foreground">รายงานคะแนนและเกรดเฉลี่ยรายภาคเรียน</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="เลือกภาคเรียน"
              className="ui-input !w-auto !py-2 !text-xs sm:!text-sm font-semibold text-foreground"
              value={activeSettingId || ""}
              onChange={(e) => {
                const s = settingsList.find((x: any) => String(x.id) === e.target.value);
                if (s) onChangeSetting(s);
              }}
            >
              {settingsList.map((s) => (
                <option key={s.id} value={s.id}>
                  ปี {s.academic_year} เทอม {s.term}{s.is_active ? " · ปัจจุบัน" : ""}
                </option>
              ))}
            </select>

            {isGradeReleased && filteredGrades.length > 0 && (
              <>
                <select
                  aria-label="ภาษาสำหรับรายงาน PDF"
                  value={pdfLanguage}
                  onChange={(event) => setPdfLanguage(event.target.value as PdfLanguage)}
                  className="ui-input !w-auto !py-2 !text-xs sm:!text-sm font-semibold text-foreground"
                >
                  <option value="th">PDF: ไทย</option>
                  <option value="ms-rumi">PDF: Melayu (Rumi)</option>
                  <option value="ms-jawi">PDF: Melayu (Jawi)</option>
                </select>

                <button
                  type="button"
                  onClick={handlePrintTermReport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-xs hover:opacity-95 transition-opacity"
                >
                  <FileText className="h-4 w-4" />
                  รายงานรายเทอม
                </button>

                <button
                  type="button"
                  onClick={handleExportGrades}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold text-xs sm:text-sm transition-colors"
                >
                  <Download className="h-4 w-4 text-primary" />
                  Excel
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {!isGradeReleased ? (
        <ReleaseCountdownTimer targetDateStr={releaseDateStr} settingName={activeTermStr} onReleased={onGradesReleased} />
      ) : (
        <>
          {filteredGrades.length === 0 ? (
            <div className="ui-card p-10 sm:p-14 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">ยังไม่มีผลการเรียน</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                ระบบยังไม่มีข้อมูลคะแนนสำหรับเทอมนี้ กรุณารอคุณครูบันทึกคะแนนเข้าสู่ระบบ
              </p>
            </div>
          ) : (
            <>
              {/* Status Notice */}
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      คะแนนรวมและอันดับ รวมรายวิชากิจกรรมที่มีการเก็บคะแนนแล้ว
                    </p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                      เกรดเฉลี่ย (GPA) คำนวณจากรายวิชาการเท่านั้น
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  รวมแล้ว
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* GPA Card */}
                <div className="ui-card p-5 sm:p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary/70" />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          gpaNum >= 3.5
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                            : gpaNum >= 2.5
                            ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25"
                            : gpaNum >= 1.5
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                            : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25"
                        }`}
                      >
                        {gpaNum >= 3.5 ? (
                          <>
                            <Star className="w-3.5 h-3.5" /> ดีเยี่ยม
                          </>
                        ) : gpaNum >= 2.5 ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> ดี
                          </>
                        ) : gpaNum >= 1.5 ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> ผ่าน
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" /> ปรับปรุง
                          </>
                        )}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">เกรดเฉลี่ย (GPA)</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-4xl sm:text-5xl font-extrabold ${gpaColor}`}>{gpaValue}</span>
                        <span className="text-base font-semibold text-subtle-foreground">/ 4.00</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">หน่วยกิตรวม</span>
                      <span className="font-bold text-foreground">{gpaCredits} หน่วยกิต</span>
                    </div>
                  </div>
                </div>

                {/* Average Score Card */}
                <div className="ui-card p-5 sm:p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500/70" />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold text-sky-600 dark:text-sky-400">
                        {avgPercent}%
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">คะแนนเฉลี่ยรวม</div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-700"
                          style={{ width: `${Math.min(100, avgPercent)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2.5">
                        คำนวณจาก {subjectCount} รายวิชา ({totalEarnedScore}/{totalPossibleScore} คะแนน)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ranking Card */}
                {activeSetting?.is_ranking_released === true && ranking ? (
                  <div className="ui-card p-5 sm:p-6 relative overflow-hidden md:col-span-2 lg:col-span-1">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/70" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Award className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground">อันดับผลการเรียน</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-muted/60 border border-border p-3">
                          <div className="text-xs text-muted-foreground font-medium">ในห้องเรียน</div>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                              {ranking.classroom_rank}
                            </span>
                            <span className="text-xs font-semibold text-subtle-foreground">
                              /{ranking.classroom_total}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl bg-muted/60 border border-border p-3">
                          <div className="text-xs text-muted-foreground font-medium">ในโรงเรียน</div>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                              {ranking.school_rank}
                            </span>
                            <span className="text-xs font-semibold text-subtle-foreground">
                              /{ranking.school_total}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ui-card border-dashed p-5 sm:p-6 flex items-center justify-center md:col-span-2 lg:col-span-1">
                    <div className="text-center space-y-2">
                      <div className="w-11 h-11 mx-auto rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground">อันดับยังไม่เปิดเผย</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Combined Activity Result */}
              {useCombinedActivity &&
                (() => {
                  const combined = getCombinedActivityResult();
                  if (!combined) return null;
                  return (
                    <div
                      className={`rounded-2xl p-4 sm:p-5 border ${
                        combined.pass
                          ? "bg-emerald-500/8 border-emerald-500/25"
                          : "bg-rose-500/8 border-rose-500/25"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center shrink-0 ${combined.color}`}
                        >
                          <span className="text-base sm:text-lg font-extrabold">{combined.label}</span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-foreground">ผลกิจกรรมรวม</h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                combined.pass
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              {combined.totalScore} / {combined.totalMax} ({Math.round(combined.percent)}%)
                            </span>
                          </div>

                          <div className="h-2 rounded-full bg-card border border-border overflow-hidden">
                            <div
                              className={`h-full ${combined.bar} transition-all duration-700`}
                              style={{ width: `${Math.min(100, combined.percent)}%` }}
                            />
                          </div>

                          <div className="text-[11px] text-muted-foreground truncate">
                            รวมจาก: {scoredActivitySubjects.map((s) => s.name).join(", ")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Subjects List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-base font-bold text-foreground">รายวิชาทั้งหมด</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {filteredGrades.length} วิชา
                  </span>
                </div>

                <div className="grid gap-3">
                  {orderedGrades.map((grade) => {
                    const subject = subjectsList.find(
                      (s) =>
                        s.name?.trim().toLowerCase() === grade.subject?.trim().toLowerCase() &&
                        s.setting_id === activeSettingId
                    );
                    const mMax = Number(subject?.midterm_max_score) || midtermMax;
                    const fMax = Number(subject?.final_max_score) || finalMax;
                    const totalScore = (grade.midterm_score ?? 0) + (grade.final_score ?? 0);
                    const percent = mMax + fMax > 0 ? (totalScore / (mMax + fMax)) * 100 : 0;
                    const isActivity = subject?.subject_type === "activity";
                    const isCombined = isActivity && subject?.score_display_mode === "combined";
                    const combinedActResult =
                      isActivity && useCombinedActivity ? getCombinedActivityResult() : null;
                    const info = isActivity
                      ? combinedActResult
                        ? {
                            letter: combinedActResult.label,
                            point: combinedActResult.label,
                            color: combinedActResult.color,
                            bar: combinedActResult.bar,
                          }
                        : percent >= 50
                        ? {
                            letter: "ผ่าน",
                            point: "ผ่าน",
                            color: "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:text-emerald-300",
                            bar: "bg-emerald-500",
                          }
                        : {
                            letter: "ไม่ผ่าน",
                            point: "ไม่ผ่าน",
                            color: "bg-rose-500/12 text-rose-700 border-rose-500/25 dark:text-rose-300",
                            bar: "bg-rose-500",
                          }
                      : getGradeInfo(percent);

                    return (
                      <div
                        key={grade.id}
                        className="ui-card-interactive p-4 sm:p-5"
                      >
                        <div className="flex items-center gap-3.5 sm:gap-5">
                          {/* Grade Badge */}
                          <div
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${info.color}`}
                          >
                            <span className="text-[9px] font-bold uppercase tracking-wide opacity-75">
                              {isActivity ? "ผล" : "เกรด"}
                            </span>
                            {!isActivity ? (
                              <>
                                <span className="text-xl sm:text-2xl font-extrabold leading-none mt-0.5">
                                  {info.point}
                                </span>
                                <span className="text-[10px] font-semibold opacity-75">{info.letter}</span>
                              </>
                            ) : (
                              <span className="text-sm sm:text-base font-extrabold">{info.letter}</span>
                            )}
                          </div>

                          {/* Subject Info */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                                {grade.subject}
                              </h4>
                              {isActivity ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[11px] font-semibold">
                                  กิจกรรม
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
                                  {Number(subject?.credit_hours) || 1} หน่วยกิต
                                </span>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${info.bar} transition-all duration-500`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>

                            {/* Score Details */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                              {isCombined ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-primary" />
                                  รวม {totalScore}/{mMax + fMax}
                                </span>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                                    เก็บ {grade.midterm_score ?? 0}/{mMax}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                    สอบ {grade.final_score ?? 0}/{fMax}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Total Score */}
                          <div className="text-right shrink-0">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                              รวม
                            </div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-foreground leading-none mt-0.5">
                              {totalScore}
                            </div>
                            <div className="text-[11px] text-subtle-foreground font-medium">
                              /{mMax + fMax}
                            </div>
                            <div className="mt-1 inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">
                              {Math.round(percent)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
