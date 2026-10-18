import { useState, useEffect, useRef } from "react";
import { ClipboardList, Download, FileText, Trophy } from "lucide-react";
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
    <div className="ui-card p-8 sm:p-10 text-center relative overflow-hidden bg-gradient-to-b from-card via-card to-amber-500/5 border-amber-500/30 dark:border-amber-500/20 shadow-xl rounded-3xl animate-scale-up space-y-6">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

      <div className="w-20 h-20 mx-auto bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-amber-500/20 animate-pulse">
        🔒
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold">
          ⏳ การประกาศผลการเรียน · เทอม {settingName}
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">
          ผลการเรียนยังไม่เปิดเผยสำหรับนักเรียน
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          ผู้ดูแลระบบได้กำหนดช่วงเวลาเปิดประกาศผลสัมฤทธิ์ทางการเรียนไว้
          {formattedTargetDate ? ` ในวันที่ ${formattedTargetDate} น.` : " ระบบกำลังเตรียมความพร้อม"}
        </p>
      </div>

      {/* Countdown Digits UI */}
      {targetDateStr && !timeLeft.isExpired ? (
        <div className="pt-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            นับเวลาถอยหลังเปิดระบบ (Countdown Timer)
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
            <div className="bg-muted/60 border border-border p-3 sm:p-4 rounded-2xl shadow-inner">
              <div className="text-2xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {String(timeLeft.days).padStart(2, "0")}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1">วัน</div>
            </div>
            <div className="bg-muted/60 border border-border p-3 sm:p-4 rounded-2xl shadow-inner">
              <div className="text-2xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1">ชั่วโมง</div>
            </div>
            <div className="bg-muted/60 border border-border p-3 sm:p-4 rounded-2xl shadow-inner">
              <div className="text-2xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1">นาที</div>
            </div>
            <div className="bg-muted/60 border border-border p-3 sm:p-4 rounded-2xl shadow-inner">
              <div className="text-2xl sm:text-4xl font-extrabold font-mono text-orange-600 dark:text-orange-400 animate-pulse">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1">วินาที</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-muted/40 rounded-2xl border border-border max-w-md mx-auto text-xs text-muted-foreground font-medium">
          ระบบปิดการแสดงผลการเรียนชั่วคราวโดยผู้ดูแลระบบ เมื่อถึงเวลากำหนด เกรดจะปรากฏขึ้นให้อัตโนมัติ
        </div>
      )}
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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-border">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">รายงานผลการเรียน</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold text-xs">
              📅 เทอม {activeTermStr}
            </span>
          </p>
        </div>
        {isGradeReleased && filteredGrades.length > 0 && (
          <button
            type="button"
            onClick={handleExportGrades}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <Download className="h-4 w-4" />
            ส่งออก Excel
          </button>
        )}
        {isGradeReleased && filteredGrades.length > 0 && (
          <select
            aria-label="ภาษาสำหรับรายงาน PDF"
            value={pdfLanguage}
            onChange={(event) => setPdfLanguage(event.target.value as PdfLanguage)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="th">PDF: ไทย</option>
            <option value="ms-rumi">PDF: Melayu (Rumi)</option>
            <option value="ms-jawi">PDF: Melayu (Jawi)</option>
          </select>
        )}
        {isGradeReleased && filteredGrades.length > 0 && (
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-card px-4 py-2.5 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <FileText className="h-4 w-4" />
            พิมพ์ / บันทึก PDF
          </button>
        )}
        <select
          className="px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground font-semibold text-sm hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={activeSettingId || ""}
          onChange={(e) => {
            const val = e.target.value;
            const s = settingsList.find((x: any) => String(x.id) === val);
            if (s) onChangeSetting(s);
          }}
        >
          {settingsList.map(s => (
            <option key={s.id} value={s.id}>
              ปี {s.academic_year} เทอม {s.term}{s.is_active ? " • ปัจจุบัน" : ""}
            </option>
          ))}
        </select>
      </div>

      {!isGradeReleased ? (
        <ReleaseCountdownTimer targetDateStr={releaseDateStr} settingName={activeTermStr} onReleased={onGradesReleased} />
      ) : (
        <>
          {filteredGrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/20 dark:to-fuchsia-900/20 flex items-center justify-center mb-6">
                <ClipboardList className="w-12 h-12 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">ยังไม่มีผลการเรียน</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                ระบบยังไม่มีข้อมูลคะแนนสำหรับเทอมนี้ กรุณารอคุณครูบันทึกคะแนนเข้าสู่ระบบ
              </p>
            </div>
          ) : (
            <>
              {/* Stats Overview Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* GPA Card - Redesigned */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
                  <div className="relative">
                    <div className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wider">เกรดเฉลี่ย</div>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-5xl sm:text-6xl font-black text-white leading-none">{gpaValue}</span>
                      <span className="text-white/70 text-xl font-bold mb-2">/ 4.00</span>
                    </div>
                    <div className="flex items-center justify-between text-white/90">
                      <span className="text-sm font-medium">{gpaCredits} หน่วยกิต</span>
                      <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
                        {gpaNum >= 3.5 ? '🌟 ดีเยี่ยม' : gpaNum >= 2.5 ? '✨ ดี' : gpaNum >= 1.5 ? '✓ ผ่าน' : '⚠ ปรับปรุง'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Average Score Card - New Design */}
                <div className="relative overflow-hidden rounded-2xl bg-card border-2 border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl sm:text-4xl font-black text-foreground">{avgPercent}%</div>
                      <div className="text-xs text-muted-foreground font-medium">คะแนนเฉลี่ย</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000 ease-out"
                        style={{ width: `${avgPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">ผลเฉลี่ยทุกวิชา ({subjectCount} วิชา)</p>
                  </div>
                </div>

                {/* Ranking Card - Redesigned */}
                {activeSetting?.is_ranking_released === true && ranking ? (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-6 h-6 text-white" />
                        <span className="text-white/90 text-sm font-bold uppercase tracking-wider">อันดับ</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-white/80 text-xs font-semibold">ในห้อง</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-white">{ranking.classroom_rank}</span>
                            <span className="text-white/70 text-sm font-bold">/{ranking.classroom_total}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-white/80 text-xs font-semibold">ในโรงเรียน</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-white">{ranking.school_rank}</span>
                            <span className="text-white/70 text-sm font-bold">/{ranking.school_total}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl bg-card border-2 border-dashed border-border p-6 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-muted flex items-center justify-center">
                        <span className="text-2xl opacity-50">🏆</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">อันดับยังไม่เปิดเผย</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Grades List Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground px-2">รายวิชา ({filteredGrades.length} วิชา)</h3>

                {/* Combined Activity Result */}
                {useCombinedActivity && (() => {
                  const combined = getCombinedActivityResult();
                  if (!combined) return null;
                  return (
                    <div className={`rounded-xl p-5 ${combined.pass ? "bg-emerald-50 dark:bg-emerald-950/10 border-2 border-emerald-300 dark:border-emerald-700/30" : "bg-rose-50 dark:bg-rose-950/10 border-2 border-rose-300 dark:border-rose-700/30"}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${combined.pass ? "bg-emerald-500" : "bg-rose-500"} shadow-lg`}>
                          <span className="text-2xl font-black text-white">{combined.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-foreground">ผลกิจกรรมรวม</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${combined.pass ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800/30 dark:text-emerald-300" : "bg-rose-200 text-rose-800 dark:bg-rose-800/30 dark:text-rose-300"}`}>
                              {Math.round(combined.percent)}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {combined.totalScore} / {combined.totalMax} คะแนน
                          </div>
                          <div className="h-2 rounded-full bg-white dark:bg-card overflow-hidden">
                            <div className={`h-full ${combined.bar} transition-all duration-700`} style={{ width: `${Math.min(100, combined.percent)}%` }} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 truncate">
                            {scoredActivitySubjects.map(s => s.name).join(", ")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Individual Grade Cards */}
                <div className="space-y-2">
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
                        className="group rounded-xl bg-card border border-border hover:border-primary/50 p-4 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          {/* Grade Display */}
                          <div className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${info.color}`}>
                            <span className="text-[9px] font-bold uppercase tracking-wide opacity-70">
                              {isActivity ? "ผลประเมิน" : "เกรด"}
                            </span>
                            {!isActivity ? (
                              <>
                                <span className="text-2xl font-black leading-none">{info.point}</span>
                                <span className="text-[10px] font-semibold opacity-70">{info.letter}</span>
                              </>
                            ) : (
                              <span className="text-lg font-black">{info.letter}</span>
                            )}
                          </div>

                          {/* Subject Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h4 className="font-bold text-foreground truncate">{grade.subject}</h4>
                              {isActivity ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 text-xs font-bold">
                                  กิจกรรม
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 text-xs font-bold">
                                  {Number(subject?.credit_hours) || 1} หน่วยกิต
                                </span>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                              <div className={`h-full ${info.bar} transition-all duration-500`} style={{ width: `${Math.min(100, percent)}%` }} />
                            </div>

                            {/* Score Details */}
                            <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                              {isCombined ? (
                                <span>รวม {totalScore}/{mMax + fMax}</span>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    เก็บ {grade.midterm_score ?? 0}/{mMax}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    สอบ {grade.final_score ?? 0}/{fMax}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Total Score */}
                          <div className="text-right shrink-0">
                            <div className="text-[10px] font-bold text-muted-foreground mb-1">คะแนนรวม</div>
                            <div className="text-3xl font-black text-foreground leading-none mb-1">{totalScore}</div>
                            <div className="text-xs text-muted-foreground font-semibold">/ {mMax + fMax}</div>
                            <div className="mt-1 px-2 py-0.5 rounded-md bg-muted text-xs font-bold">
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
