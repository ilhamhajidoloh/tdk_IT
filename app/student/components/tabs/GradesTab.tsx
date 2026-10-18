import { useState, useEffect, useRef } from "react";
import { Download, FileText, TrendingUp, Award, BarChart3, Clock } from "lucide-react";
import * as XLSX from "xlsx";
import { type DBGrade, type DBSubject, type CombinedActivityResult, getGradeInfo } from "../types";

interface GradesTabProps {
  studentName: string;
  studentCode: string;
  studentNumber?: number | null;
  classroomName: string;
  activeTermStr: string;
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-900/20 border-2 border-amber-200 dark:border-amber-800/30 p-8 sm:p-12 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.1),transparent_50%)]" />

      <div className="relative z-10 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg animate-pulse">
          <Clock className="w-10 h-10 text-white" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm">
            <span className="text-sm font-bold text-amber-800 dark:text-amber-300">เทอม {settingName}</span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
            ผลการเรียนยังไม่เปิดเผย
          </h3>

          <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {formattedTargetDate
              ? `ระบบจะเปิดเผยผลการเรียนในวันที่ ${formattedTargetDate}`
              : "ผู้ดูแลระบบกำลังเตรียมประกาศผลการเรียน"}
          </p>
        </div>

        {targetDateStr && !timeLeft.isExpired && (
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-4">
              เหลือเวลาอีก
            </p>
            <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto">
              {[
                { value: timeLeft.days, label: "วัน" },
                { value: timeLeft.hours, label: "ชั่วโมง" },
                { value: timeLeft.minutes, label: "นาที" },
                { value: timeLeft.seconds, label: "วินาที" }
              ].map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                  <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-xl border border-amber-200 dark:border-amber-800/30">
                    <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent font-mono">
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 mt-2">{item.label}</div>
                  </div>
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
  classroomName,
  activeTermStr,
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

  // Calculate average percentage across all academic subjects
  let totalPercent = 0;
  let subjectCount = 0;
  let totalEarnedScore = 0;
  let totalPossibleScore = 0;
  filteredGrades.forEach(g => {
    const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === g.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
    if (subject?.subject_type === "activity") return;
    const mMax = Number(subject?.midterm_max_score) || midtermMax;
    const fMax = Number(subject?.final_max_score) || finalMax;
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
        "ลำดับ": index + 1,
        "รายวิชา": grade.subject,
        "ประเภท": isActivity ? "กิจกรรม" : "วิชาการ",
        "หน่วยกิต": isActivity ? "-" : Number(subject?.credit_hours) || 1,
        "คะแนนเก็บ": `${grade.midterm_score ?? 0}/${midtermMaxScore}`,
        "คะแนนสอบ": `${grade.final_score ?? 0}/${finalMaxScore}`,
        "คะแนนรวม": `${totalScore}/${totalMaxScore}`,
        "เกรด": gradeInfo.point,
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
      ["อันดับในห้อง", ranking ? `${ranking.classroom_rank}/${ranking.classroom_total}` : "-"],
      ["อันดับในโรงเรียน", ranking ? `${ranking.school_rank}/${ranking.school_total}` : "-"],
      [],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.sheet_add_json(worksheet, rows, { origin: "A14" });
    worksheet["!cols"] = [
      { wch: 8 }, { wch: 30 }, { wch: 14 }, { wch: 12 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ผลการเรียน");
    XLSX.writeFile(workbook, `ผลการเรียน_${studentCode}_${activeTermStr}.xlsx`);
  };

  const handleExportPdf = () => {
    const escapeHtml = (value: unknown) => String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    const textForPdf = (thai: string, rumi: string, jawi: string) => {
      if (pdfLanguage === "ms-rumi") return rumi;
      if (pdfLanguage === "ms-jawi") return jawi;
      return thai;
    };
    const tableRows = orderedGrades.map((grade, index) => {
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
          ? { point: "-", letter: activityResult.pass ? textForPdf("ผ่าน", "Lulus", "لولوس") : textForPdf("ไม่ผ่าน", "Gagal", "ݢاݢل") }
          : { point: "-", letter: percent >= 50 ? textForPdf("ผ่าน", "Lulus", "لولوس") : textForPdf("ไม่ผ่าน", "Gagal", "ݢاݢل") }
        : getGradeInfo(percent);

      return `<tr><td>${index + 1}</td><td>${escapeHtml(grade.subject)}</td><td>${isActivity ? textForPdf("กิจกรรม", "Aktiviti", "اکتيۏيتي") : textForPdf("วิชาการ", "Akademik", "اکاديميك")}</td><td>${escapeHtml(`${grade.midterm_score ?? 0}/${midtermMaxScore}`)}</td><td>${escapeHtml(`${grade.final_score ?? 0}/${finalMaxScore}`)}</td><td>${totalScore}/${totalMaxScore}</td><td>${percent.toFixed(2)}%</td><td>${gradeInfo.point}</td><td>${escapeHtml(gradeInfo.letter)}</td></tr>`;
    }).join("");
    const reportRows = orderedGrades.map((grade, index) => {
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
      const gradeLabel = isActivity
        ? activityResult
          ? activityResult.pass ? textForPdf("ผ่าน", "Lulus", "لولوس") : textForPdf("ไม่ผ่าน", "Gagal", "ݢاݢل")
          : percent >= 50 ? textForPdf("ผ่าน", "Lulus", "لولوس") : textForPdf("ไม่ผ่าน", "Gagal", "ݢاݢل")
        : getGradeInfo(percent).letter;

      return `<tr><td>${index + 1}</td><td>${escapeHtml(grade.subject)}</td><td>${isActivity ? textForPdf("กิจกรรม", "Aktiviti", "اکتيۏيتي") : textForPdf("วิชาหลัก", "Subjek Utama", "سوبجيک اوتام")}</td><td>${isActivity ? "-" : Number(subject?.credit_hours) || 1}</td><td>${grade.midterm_score ?? 0}/${midtermMaxScore}</td><td>${grade.final_score ?? 0}/${finalMaxScore}</td><td>${totalScore}/${totalMaxScore}</td><td>${escapeHtml(gradeLabel)}</td></tr>`;
    }).join("");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ผลการเรียน_${escapeHtml(studentCode)}</title><style>body{font-family:Sarabun,Tahoma,sans-serif;color:#111827;margin:0;background:#f8fafc}.toolbar{position:fixed;top:16px;right:16px}.toolbar button{border:0;border-radius:8px;background:#4f46e5;color:#fff;padding:10px 16px;font-weight:700;cursor:pointer}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;padding:16mm}.title{text-align:center;margin:0 0 4px;font-size:22px}.subtitle{text-align:center;margin:0 0 18px;color:#475569}.details{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;border-top:1px solid #94a3b8;border-bottom:1px solid #94a3b8;padding:10px 0;margin-bottom:16px;font-size:13px}.summary{display:flex;gap:24px;margin:0 0 16px;font-size:13px;font-weight:700}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #64748b;padding:7px 5px;text-align:center}th{background:#e2e8f0;font-weight:700}th:nth-child(2),td:nth-child(2){text-align:left}@media print{body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none}@page{size:A4 portrait;margin:0}}</style></head><body><div class="toolbar"><button onclick="window.print()">พิมพ์ / บันทึก PDF</button></div><main class="page"><h1 class="title">รายงานผลการเรียน</h1><p class="subtitle">${escapeHtml(activeTermStr)}</p><section class="details"><div><b>ชื่อนักเรียน:</b> ${escapeHtml(studentName)}</div><div><b>รหัสนักเรียน:</b> ${escapeHtml(studentCode)}</div></section><section class="summary"><span>เกรดเฉลี่ย (GPA): ${escapeHtml(gpaValue)}</span><span>หน่วยกิตรวม: ${escapeHtml(gpaCredits)}</span></section><table><thead><tr><th>ลำดับ</th><th>รายวิชา</th><th>ประเภท</th><th>เก็บ</th><th>สอบ</th><th>คะแนนรวม</th><th>ร้อยละ</th><th>เกรด</th><th>ผลการเรียน</th></tr></thead><tbody>${tableRows}</tbody></table></main></body></html>`);
    printWindow.document.close();
    const triLabel = (thai: string, rumi: string, jawi: string) => {
      if (pdfLanguage === "ms-rumi") return rumi;
      if (pdfLanguage === "ms-jawi") return `<span class="jawi-label" lang="ms-Arab" dir="rtl">${jawi}</span>`;
      return thai;
    };
    const pdfDocument = printWindow.document;
    pdfDocument.documentElement.lang = pdfLanguage === "ms-jawi" ? "ms-Arab" : pdfLanguage;
    if (pdfLanguage === "ms-jawi") pdfDocument.body.classList.add("jawi-document");
    const reportHeaders: [string, string, string][] = [
      ["ลำดับ", "Bil.", "بيل."],
      ["ชื่อวิชาเรียน", "Nama Subjek", "نام سوبجيک"],
      ["ประเภท", "Jenis", "جينيس"],
      ["หน่วยกิต", "Kredit", "کريديت"],
      ["คะแนนเก็บ", "Markah Kerja Kursus", "مرکه کرجا کورسوس"],
      ["คะแนนสอบ", "Markah Peperiksaan", "مرکه ڤڤريکساءن"],
      ["คะแนนรวม", "Jumlah Markah", "جومله مرکه"],
      ["เกรด", "Gred", "ݢريد"],
    ];
    const reportTable = pdfDocument.querySelector("table");
    if (reportTable) {
      reportTable.querySelector("thead")!.innerHTML = `<tr>${reportHeaders.map(([thai, rumi, jawi]) => `<th>${triLabel(thai, rumi, jawi)}</th>`).join("")}</tr>`;
      reportTable.querySelector("tbody")!.innerHTML = reportRows;
    }
    const title = pdfDocument.querySelector(".title");
    if (title) title.innerHTML = `${triLabel("รายงานผลการเรียน", "Laporan Keputusan Akademik", "لاڤورن کڤوتوسن اکناديميك")}`;
    const subtitle = pdfDocument.querySelector(".subtitle");
    if (title) title.innerHTML = triLabel("ใบรายงานผลการเรียนรายบุคคล", "Laporan Keputusan Akademik Individu", "لاڤورن کڤوتوسن اکناديميك انديۏيدو");
    if (subtitle) subtitle.innerHTML = `${triLabel("ภาคเรียน", "Sesi", "سيسي")}: ${escapeHtml(activeTermStr)}`;
    const details = pdfDocument.querySelector(".details");
    if (details) {
      details.innerHTML = `<div><b>${triLabel("ชื่อ - นามสกุล", "Nama Penuh", "نام ڤنوه")}</b>: ${escapeHtml(studentName)}</div><div><b>${triLabel("รหัสประจำตัว", "Nombor Pelajar", "نومبور ڤلاجر")}</b>: ${escapeHtml(studentCode)}</div><div><b>${triLabel("ชั้นเรียน", "Kelas", "کلس")}</b>: ${escapeHtml(classroomName)}</div><div><b>${triLabel("เลขที่", "Nombor", "نومبور")}</b>: ${studentNumber ?? "-"}</div>`;
    }
    const headers: [string, string, string][] = [
      ["ลำดับ", "Bil.", "بيل."],
      ["รายวิชา", "Mata Pelajaran", "ماتا ڤلاجرن"],
      ["ประเภท", "Jenis", "جينيس"],
      ["คะแนนเก็บ", "Markah Kerja Kursus", "مرکه کرجا کورسوس"],
      ["คะแนนสอบ", "Markah Peperiksaan", "مرکه ڤڤريکساءن"],
      ["คะแนนรวม", "Jumlah Markah", "جومله مرکه"],
      ["ร้อยละ", "Peratus", "ڤراتوس"],
      ["เกรด", "Gred", "ݢريد"],
      ["ผลการเรียน", "Keputusan", "کڤوتوسن"],
    ];
    pdfDocument.querySelectorAll("thead th").forEach((cell, index) => {
      const label = headers[index];
      if (label) cell.innerHTML = triLabel(...label);
    });
    const summary = pdfDocument.querySelector(".summary");
    if (summary) {
      summary.innerHTML = [
        `<span>${triLabel("เกรดเฉลี่ย (GPA)", "Purata Nilai Gred", "ڤوراتا نيلاي ݢريد")}: ${escapeHtml(gpaValue)}</span>`,
        `<span>${triLabel("หน่วยกิตรวม", "Jumlah Kredit", "جومله کريديت")}: ${escapeHtml(gpaCredits)}</span>`,
        `<span>${triLabel("เปอร์เซ็นต์รวม", "Peratus Keseluruhan", "ڤراتوس کسلوروهان")}: ${overallPercent}%</span>`,
      ].join("");
    }
    if (summary) {
      summary.innerHTML = [
        `<span>${triLabel("คะแนนรวมวิชาหลัก", "Jumlah Markah Subjek Utama", "جومله مرکه سوبجيک اوتام")}: ${totalEarnedScore}/${totalPossibleScore}</span>`,
        `<span>${triLabel("คิดเป็นร้อยละ", "Peratus", "ڤراتوس")}: ${overallPercent}%</span>`,
        `<span>${triLabel("เกรดเฉลี่ย (GPA)", "Purata Nilai Gred", "ڤوراتا نيلاي ݢريد")}: ${escapeHtml(gpaValue)}</span>`,
        `<span>${triLabel("อันดับในห้องเรียน", "Kedudukan Dalam Kelas", "کدودوقن دالم کلس")}: ${ranking ? `${ranking.classroom_rank}/${ranking.classroom_total}` : "-"}</span>`,
        `<span>${triLabel("อันดับในโรงเรียน", "Kedudukan Dalam Sekolah", "کدودوقن دالم سکوله")}: ${ranking ? `${ranking.school_rank}/${ranking.school_total}` : "-"}</span>`,
      ].join("");
    }
    const style = pdfDocument.createElement("style");
    style.textContent = ".page{width:210mm;min-height:297mm;padding:12mm}.title small,th small,.summary small{font-weight:500;color:#475569}.summary{display:grid;grid-template-columns:repeat(3,1fr);align-items:stretch;gap:10px}.summary span{display:block;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center}@media print{@page{size:A4 portrait;margin:0}}";
    pdfDocument.head.append(style);
    const jawiStyle = pdfDocument.createElement("style");
    jawiStyle.textContent = ".jawi-document{font-family:'Noto Naskh Arabic','Amiri','Traditional Arabic',serif;font-size:16px}.jawi-document .title{font-size:28px;font-weight:700;line-height:1.35}.jawi-document .subtitle{font-size:18px}.jawi-document .details,.jawi-document .summary{font-size:16px}.jawi-document table{font-size:14px}.jawi-document th{font-weight:700}.jawi-document .jawi-label{font-family:'Noto Naskh Arabic','Amiri','Traditional Arabic',serif;line-height:1.4}";
    pdfDocument.head.append(jawiStyle);
  };

  return (
    <div className="space-y-6">
      {/* Header Section - New Design */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">ผลการเรียน</h2>
                <p className="text-white/80 text-sm font-medium">Academic Performance Report</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border-2 border-white/30 text-white font-bold text-sm hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none cursor-pointer"
              value={activeSettingId || ""}
              onChange={(e) => {
                const val = e.target.value;
                const s = settingsList.find((x: any) => String(x.id) === val);
                if (s) onChangeSetting(s);
              }}
            >
              {settingsList.map(s => (
                <option key={s.id} value={s.id} className="bg-gray-900 text-white">
                  ปี {s.academic_year} เทอม {s.term}{s.is_active ? " • ปัจจุบัน" : ""}
                </option>
              ))}
            </select>

            {isGradeReleased && filteredGrades.length > 0 && (
              <>
                <select
                  aria-label="ภาษาสำหรับรายงาน PDF"
                  value={pdfLanguage}
                  onChange={(event) => setPdfLanguage(event.target.value as PdfLanguage)}
                  className="px-3 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="th" className="bg-gray-900 text-white">PDF: ไทย</option>
                  <option value="ms-rumi" className="bg-gray-900 text-white">PDF: Melayu (Rumi)</option>
                  <option value="ms-jawi" className="bg-gray-900 text-white">PDF: Melayu (Jawi)</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border-2 border-white/30 text-white font-bold text-sm hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </button>

                <button
                  type="button"
                  onClick={handleExportGrades}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-600 font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {!isGradeReleased ? (
        <ReleaseCountdownTimer targetDateStr={releaseDateStr} settingName={activeTermStr} onReleased={onGradesReleased} />
      ) : (
        <>
          {filteredGrades.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_70%)]" />

              <div className="relative z-10 space-y-4">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-xl">
                  <BarChart3 className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">ยังไม่มีผลการเรียน</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  ระบบยังไม่มีข้อมูลคะแนนสำหรับเทอมนี้ กรุณารอคุณครูบันทึกคะแนนเข้าสู่ระบบ
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Modern Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* GPA Card - Premium Design */}
                <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 shadow-xl hover:shadow-2xl transition-all">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                        <span className="text-xs font-bold text-white">
                          {gpaNum >= 3.5 ? '🌟 ดีเยี่ยม' : gpaNum >= 2.5 ? '✨ ดี' : gpaNum >= 1.5 ? '✓ ผ่าน' : '⚠ ปรับปรุง'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">เกรดเฉลี่ย GPA</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-white">{gpaValue}</span>
                        <span className="text-2xl font-bold text-white/70">/ 4.00</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/20">
                      <div className="flex items-center justify-between text-white/90 text-sm">
                        <span className="font-medium">หน่วยกิตรวม</span>
                        <span className="font-bold">{gpaCredits} หน่วย</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Average Score Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                          {avgPercent}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">คะแนนเฉลี่ย</div>
                      <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000 ease-out shadow-lg"
                          style={{ width: `${avgPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">ผลเฉลี่ยจาก {subjectCount} วิชา</p>
                    </div>
                  </div>
                </div>

                {/* Ranking Card */}
                {activeSetting?.is_ranking_released === true && ranking ? (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-6 shadow-xl hover:shadow-2xl transition-all group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-white/90 text-xs font-bold uppercase tracking-wider">อันดับของคุณ</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-white/80 text-xs font-semibold">ในห้องเรียน</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white">{ranking.classroom_rank}</span>
                            <span className="text-lg font-bold text-white/70">/{ranking.classroom_total}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-white/80 text-xs font-semibold">ในโรงเรียน</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white">{ranking.school_rank}</span>
                            <span className="text-lg font-bold text-white/70">/{ranking.school_total}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Award className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400">อันดับยังไม่เปิดเผย</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Combined Activity Result */}
              {useCombinedActivity && (() => {
                const combined = getCombinedActivityResult();
                if (!combined) return null;
                return (
                  <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg border-2 ${
                    combined.pass
                      ? "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/20 dark:to-green-900/20 border-emerald-300 dark:border-emerald-700/30"
                      : "bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950/20 dark:to-red-900/20 border-rose-300 dark:border-rose-700/30"
                  }`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${
                        combined.pass ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-gradient-to-br from-rose-500 to-red-600"
                      }`}>
                        <span className="text-2xl font-black text-white">{combined.label}</span>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-black text-gray-900 dark:text-white">ผลกิจกรรมรวม</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              combined.pass
                                ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200"
                                : "bg-rose-200 text-rose-800 dark:bg-rose-800/50 dark:text-rose-200"
                            }`}>
                              {Math.round(combined.percent)}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {combined.totalScore} / {combined.totalMax} คะแนน
                          </div>
                        </div>

                        <div className="h-3 rounded-full bg-white dark:bg-gray-900/50 overflow-hidden shadow-inner">
                          <div
                            className={`h-full ${combined.bar} transition-all duration-1000 ease-out shadow-lg`}
                            style={{ width: `${Math.min(100, combined.percent)}%` }}
                          />
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                          รวมจาก: {scoredActivitySubjects.map(s => s.name).join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Subjects List - Modern Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">รายวิชาทั้งหมด</h3>
                  <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-bold">
                    {filteredGrades.length} วิชา
                  </span>
                </div>

                <div className="grid gap-3">
                  {orderedGrades.map(grade => {
                    const subject = subjectsList.find(s => s.name?.trim().toLowerCase() === grade.subject?.trim().toLowerCase() && s.setting_id === activeSettingId);
                    const mMax = Number(subject?.midterm_max_score) || midtermMax;
                    const fMax = Number(subject?.final_max_score) || finalMax;
                    const totalScore = (grade.midterm_score ?? 0) + (grade.final_score ?? 0);
                    const percent = mMax + fMax > 0 ? (totalScore / (mMax + fMax)) * 100 : 0;
                    const isActivity = subject?.subject_type === "activity";
                    const isCombined = isActivity && subject?.score_display_mode === "combined";
                    const combinedActResult = isActivity && useCombinedActivity ? getCombinedActivityResult() : null;
                    const info = isActivity
                      ? (combinedActResult
                          ? { letter: combinedActResult.label, point: combinedActResult.label, color: combinedActResult.color, bar: combinedActResult.bar }
                          : (percent >= 50 ? { letter: "ผ่าน", point: "ผ่าน", color: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/10 dark:text-emerald-300 dark:border-emerald-700/30", bar: "bg-emerald-500" } : { letter: "ไม่ผ่าน", point: "ไม่ผ่าน", color: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/10 dark:text-rose-300 dark:border-rose-700/30", bar: "bg-rose-500" }))
                      : getGradeInfo(percent);

                    return (
                      <div
                        key={grade.id}
                        className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 p-5 transition-all hover:shadow-xl"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />

                        <div className="relative z-10 flex items-center gap-5">
                          {/* Grade Badge */}
                          <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 ${info.color}`}>
                            <span className="text-[9px] font-bold uppercase tracking-wide opacity-70">
                              {isActivity ? "ผล" : "เกรด"}
                            </span>
                            {!isActivity ? (
                              <>
                                <span className="text-3xl font-black leading-none">{info.point}</span>
                                <span className="text-[10px] font-semibold opacity-70">{info.letter}</span>
                              </>
                            ) : (
                              <span className="text-xl font-black">{info.letter}</span>
                            )}
                          </div>

                          {/* Subject Info */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-lg text-gray-900 dark:text-white truncate">{grade.subject}</h4>
                              {isActivity ? (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-bold">
                                  กิจกรรม
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-xs font-bold">
                                  {Number(subject?.credit_hours) || 1} หน่วยกิต
                                </span>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-inner">
                              <div className={`h-full ${info.bar} transition-all duration-700 shadow-lg`} style={{ width: `${Math.min(100, percent)}%` }} />
                            </div>

                            {/* Score Details */}
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                              {isCombined ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                  รวม {totalScore}/{mMax + fMax}
                                </span>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    เก็บ {grade.midterm_score ?? 0}/{mMax}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    สอบ {grade.final_score ?? 0}/{fMax}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Total Score Display */}
                          <div className="text-right shrink-0 space-y-1">
                            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">คะแนนรวม</div>
                            <div className="text-4xl font-black bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                              {totalScore}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-bold">/ {mMax + fMax}</div>
                            <div className="mt-2 px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-black">
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
