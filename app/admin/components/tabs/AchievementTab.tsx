"use client";

import { useState, useEffect, Fragment } from "react";
import Swal from "sweetalert2";
import { type SystemSetting } from "../types";
import TermSelector from "../TermSelector";

interface SubjectHeader {
  id: string;
  name: string;
  max_score: number;
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

interface AchievementData {
  academic_year: string;
  term: string;
  term_key: string;
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
        const json = await res.json();
        setData(json);
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

  const handlePrintReport = () => {
    if (!data) return;

    const todayStr = new Date().toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const subjectHeadersHtml = data.subjects
      .map(
        (s) => `
        <th colspan="2" style="text-align: center; font-size: 11px; border: 1px solid #4b5563; padding: 6px; background-color: #f3f4f6;">
          <strong>${s.name}</strong><br/>
          <span style="font-weight: normal; font-size: 10px; color: #4b5563;">(เต็ม ${s.max_score} คะแนน)</span>
        </th>
      `
      )
      .join("");

    const subjectSubHeadersHtml = data.subjects
      .map(
        () => `
        <th style="font-size: 10px; border: 1px solid #4b5563; padding: 4px; text-align: center; background-color: #f9fafb;">รวมดิบ</th>
        <th style="font-size: 10px; border: 1px solid #4b5563; padding: 4px; text-align: center; background-color: #f9fafb;">เฉลี่ย (%)</th>
      `
      )
      .join("");

    const bodyRowsHtml = data.matrix_rows
      .map(
        (row, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #4b5563; padding: 5px;">${idx + 1}</td>
          <td style="font-weight: bold; border: 1px solid #4b5563; padding: 5px;">${row.classroom_name}</td>
          <td style="text-align: center; border: 1px solid #4b5563; padding: 5px; font-weight: bold;">${row.student_count}</td>
          ${row.subject_stats
            .map(
              (st) => `
              <td style="text-align: right; border: 1px solid #4b5563; padding: 5px;">${st.total_score.toLocaleString()}</td>
              <td style="text-align: right; font-weight: bold; border: 1px solid #4b5563; padding: 5px;">${st.avg_percentage.toFixed(2)}%</td>
            `
            )
            .join("")}
          <td style="text-align: right; font-weight: bold; border: 1px solid #4b5563; padding: 5px; background-color: #f8fafc;">${row.total_all_subjects.toLocaleString()}</td>
          <td style="text-align: right; font-weight: bold; border: 1px solid #4b5563; padding: 5px; background-color: #f8fafc;">${row.overall_avg_percentage.toFixed(2)}%</td>
        </tr>
      `
      )
      .join("");

    const footerRowHtml = `
      <tr style="background-color: #e2e8f0; color: #0f172a; font-weight: bold;">
        <td colspan="2" style="text-align: center; border: 1px solid #4b5563; padding: 8px;">รวมทั้งหมด (ทุกระดับชั้น)</td>
        <td style="text-align: center; border: 1px solid #4b5563; padding: 8px; font-size: 13px;">${data.school_summary.total_students}</td>
        ${data.school_summary.subject_stats
          .map(
            (st) => `
            <td style="text-align: right; border: 1px solid #4b5563; padding: 8px;">${st.total_score.toLocaleString()}</td>
            <td style="text-align: right; border: 1px solid #4b5563; padding: 8px;">${st.avg_percentage.toFixed(2)}%</td>
          `
          )
          .join("")}
        <td style="text-align: right; border: 1px solid #4b5563; padding: 8px;">${data.school_summary.total_all_subjects.toLocaleString()}</td>
        <td style="text-align: right; border: 1px solid #4b5563; padding: 8px; font-size: 13px;">${data.school_summary.overall_avg_percentage.toFixed(2)}%</td>
      </tr>
    `;

    const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700;800&family=Sarabun:wght@300;400;600;700;800&family=Noto+Sans+Arabic:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Amiri', 'Cairo', 'Noto Naskh Arabic', 'Noto Sans Arabic', 'Inter', 'Sarabun', 'TH Sarabun New', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      padding: 24px;
      color: #111827;
      background: #fff;
      font-size: 12px;
      line-height: 1.4;
    }
    .print-btn {
      position: fixed;
      top: 16px;
      right: 16px;
      padding: 10px 20px;
      background: #4f46e5;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(79,70,229,0.35);
      z-index: 9999;
    }
    .header-container {
      text-align: center;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .header-agency {
      font-size: 15px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
    }
    .header-subtitle {
      font-size: 14px;
      color: #4b5563;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #4b5563;
      padding: 6px;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 700;
    }
    .formula-box {
      margin-top: 20px;
      padding: 12px 16px;
      border: 1px dashed #6b7280;
      border-radius: 8px;
      font-size: 11px;
      color: #374151;
      background: #f9fafb;
    }
    .footer-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .signature-box {
      text-align: center;
      width: 260px;
      font-size: 12px;
      line-height: 1.8;
    }
    @media print {
      .print-btn { display: none !important; }
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>

  <div class="header-container">
    <div class="header-title">${reportTitle}</div>
    ${agencyName ? `<div class="header-agency">${agencyName}</div>` : ""}
    <div class="header-subtitle">ภาคเรียนที่ ${data.term} ประจำปีการศึกษา ${data.academic_year}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th rowspan="2" style="width: 40px; text-align: center;">ที่</th>
        <th rowspan="2" style="width: 120px; text-align: center;">ระดับชั้น</th>
        <th rowspan="2" style="width: 90px; text-align: center;">จำนวนนักเรียน<br/>ทั้งชั้น (คน)</th>
        ${subjectHeadersHtml}
        <th colspan="2" style="text-align: center; background-color: #f1f5f9; color: #0f172a;">คะแนนรวมทุกวิชา</th>
      </tr>
      <tr>
        ${subjectSubHeadersHtml}
        <th style="font-size: 10px; text-align: center; background-color: #f8fafc; color: #0f172a;">รวมดิบ</th>
        <th style="font-size: 10px; text-align: center; background-color: #f8fafc; color: #0f172a;">เฉลี่ยรวม (%)</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRowsHtml}
      ${footerRowHtml}
    </tbody>
  </table>

  <div class="formula-box">
    <strong>คำอธิบายสูตรการคำนวณ:</strong><br/>
    1. <em>คะแนนรวมดิบทั้งชั้น</em> = ผลรวมคะแนนสอบของนักเรียนทุกคนในห้องเรียนนั้น<br/>
    2. <em>คะแนนเฉลี่ยร้อยละ (%) วิชา</em> = (คะแนนรวมทั้งชั้น × 100) ÷ (จำนวนนักเรียนทั้งชั้น × คะแนนเต็มวิชา)<br/>
    3. <em>คะแนนเฉลี่ยรวม (%) ทุกวิชา</em> = (คะแนนรวมทุกวิชา × 100) ÷ (จำนวนนักเรียนทั้งชั้น × คะแนนเต็มรวมทุกวิชา)
  </div>

  <div class="footer-signatures">
    <div class="signature-box">
      <p>ลงชื่อ..........................................................ผู้จัดทำ</p>
      <p style="margin-top: 2px;">( ........................................................... )</p>
      <p>ตำแหน่ง เจ้าหน้าที่วัดผล / นายทะเบียน</p>
      <p style="margin-top: 4px;">วันที่ ......./......./.......</p>
    </div>
    <div class="signature-box">
      <p>ลงชื่อ..........................................................ผู้ตรวจสอบ</p>
      <p style="margin-top: 2px;">( ........................................................... )</p>
      <p>ตำแหน่ง หัวหน้าฝ่ายวิชาการ / ผู้อำนวยการ</p>
      <p style="margin-top: 4px;">วันที่ ......./......./.......</p>
    </div>
  </div>
</body>
</html>`;

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
    } else {
      Swal.fire("แจ้งเตือน", "กรุณายินยอมให้เปิด Pop-up เพื่อพิมพ์รายงาน", "warning");
    }
  };

  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `"${reportTitle} - ภาคเรียนที่ ${data.term} ประจำปีการศึกษา ${data.academic_year}"\n\n`;

    // Header row 1
    let row1 = ["ที่", "ระดับชั้น", "จำนวนนักเรียนทั้งชั้น (คน)"];
    data.subjects.forEach((s) => {
      row1.push(`"${s.name} (คะแนนรวม)"`, `"${s.name} (เฉลี่ย %)"`);
    });
    row1.push('"คะแนนรวมทุกวิชา"', '"เฉลี่ยรวม (%)"');
    csvContent += row1.join(",") + "\n";

    // Body rows
    data.matrix_rows.forEach((row, idx) => {
      let r = [idx + 1, `"${row.classroom_name}"`, row.student_count];
      row.subject_stats.forEach((st) => {
        r.push(st.total_score, `${st.avg_percentage}%`);
      });
      r.push(row.total_all_subjects, `${row.overall_avg_percentage}%`);
      csvContent += r.join(",") + "\n";
    });

    // Summary row
    let sumRow = ['"รวมทั้งหมด"', '"ทุกระดับชั้น"', data.school_summary.total_students];
    data.school_summary.subject_stats.forEach((st) => {
      sumRow.push(st.total_score, `${st.avg_percentage}%`);
    });
    sumRow.push(data.school_summary.total_all_subjects, `${data.school_summary.overall_avg_percentage}%`);
    csvContent += sumRow.join(",") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `รายงานผลสัมฤทธิ์_${data.term}_${data.academic_year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card border border-border p-6 rounded-3xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Academic Achievement Matrix
          </div>
          <h1 className="text-2xl font-bold text-foreground">รายงานสรุปผลสัมฤทธิ์ทางการเรียน</h1>
          <p className="text-xs text-muted-foreground mt-1">
            ตารางวิเคราะห์คะแนนรวม และคะแนนเฉลี่ยร้อยละ (%) แยกตามระดับชั้นและรายวิชา
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={!data || loading}
            className="w-full sm:w-auto bg-card hover:bg-muted text-foreground border border-border font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h55.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ส่งออก CSV / Excel
          </button>
          <button
            onClick={handlePrintReport}
            disabled={!data || loading}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm border-0 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            🖨️ พิมพ์รายงาน (A4 Landscape)
          </button>
        </div>
      </div>

      {/* Control & Options Card */}
      <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Term Selector */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-border pb-4 lg:pb-0 lg:pr-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              เลือกปีการศึกษา / ภาคเรียน
            </label>
            <TermSelector
              settingsList={settingsList}
              selectedId={selectedSettingId}
              onSelect={setSelectedSettingId}
            />
          </div>

          {/* Title & Agency inputs */}
          <div className="lg:col-span-4 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                หัวข้อรายงาน (Report Title)
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                ชื่อสถานศึกษา / สังกัด (ถ้ามี)
              </label>
              <input
                type="text"
                placeholder="เช่น ศูนย์ตาดีกายันนาตุลฆุลดี หรือ โรงเรียน..."
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="lg:col-span-3 flex lg:justify-end items-center pt-2 lg:pt-0">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeActivity}
                onChange={(e) => setIncludeActivity(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-xs font-bold text-foreground">
                รวมวิชากิจกรรม
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
              👥
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground">นักเรียนทั้งหมด</div>
              <div className="text-lg font-extrabold text-foreground">{data.school_summary.total_students} คน</div>
            </div>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
              🏫
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground">จำนวนระดับชั้น</div>
              <div className="text-lg font-extrabold text-foreground">{data.matrix_rows.length} ห้อง</div>
            </div>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              📚
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground">จำนวนรายวิชา</div>
              <div className="text-lg font-extrabold text-foreground">{data.subjects.length} วิชา</div>
            </div>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              📈
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground">เฉลี่ยรวมภาพรวม</div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {data.school_summary.overall_avg_percentage.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Matrix Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-card border border-border rounded-3xl">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-sm font-semibold text-muted-foreground">กำลังคำนวณสถิติผลสัมฤทธิ์...</p>
        </div>
      ) : !data || data.matrix_rows.length === 0 ? (
        <div className="p-16 text-center bg-card border border-border rounded-3xl">
          <p className="text-muted-foreground text-sm">ไม่พบข้อมูลคะแนนในภาคเรียนที่เลือก</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th rowSpan={2} className="px-3 py-3 text-center border-r border-slate-700 min-w-[45px]">ที่</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-700 min-w-[130px]">ระดับชั้น</th>
                  <th rowSpan={2} className="px-3 py-3 text-center border-r border-slate-700 min-w-[100px]">
                    จำนวนนักเรียน<br/>ทั้งชั้น (คน)
                  </th>
                  {data.subjects.map((subj) => (
                    <th key={subj.id} colSpan={2} className="px-3 py-2 text-center border-r border-slate-700 border-b border-slate-700 bg-slate-800 text-slate-100">
                      {subj.name}
                      <span className="block text-[10px] font-normal text-slate-300">(เต็ม {subj.max_score} คะแนน)</span>
                    </th>
                  ))}
                  <th colSpan={2} className="px-4 py-2 text-center bg-indigo-700 text-white font-bold">
                    คะแนนรวมทุกวิชา
                  </th>
                </tr>
                <tr className="bg-slate-800 text-slate-300 border-b border-slate-700 text-[11px] font-semibold">
                  {data.subjects.map((subj) => (
                    <Fragment key={`head-sub-${subj.id}`}>
                      <th className="px-2.5 py-2 text-right border-r border-slate-700 font-mono">รวมดิบ</th>
                      <th className="px-2.5 py-2 text-right border-r border-slate-700 font-mono text-amber-300">เฉลี่ย (%)</th>
                    </Fragment>
                  ))}
                  <th className="px-3 py-2 text-right border-r border-indigo-600 bg-indigo-800 text-white font-mono">รวมดิบ</th>
                  <th className="px-3 py-2 text-right bg-indigo-800 text-amber-300 font-mono">เฉลี่ยรวม (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {data.matrix_rows.map((row, idx) => (
                  <tr key={row.classroom_id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-3 py-3 text-center border-r border-border text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 border-r border-border font-bold text-foreground">{row.classroom_name}</td>
                    <td className="px-3 py-3 text-center border-r border-border font-bold text-foreground">{row.student_count}</td>
                    {row.subject_stats.map((st) => (
                      <Fragment key={st.subject_id}>
                        <td className="px-3 py-3 text-right border-r border-border font-mono text-foreground">
                          {st.total_score.toLocaleString()}
                        </td>
                        <td
                          className={`px-3 py-3 text-right border-r border-border font-mono font-bold ${
                            st.avg_percentage >= 50
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {st.avg_percentage.toFixed(2)}%
                        </td>
                      </Fragment>
                    ))}
                    <td className="px-3 py-3 text-right border-r border-border font-mono font-bold text-foreground bg-muted/20">
                      {row.total_all_subjects.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20">
                      {row.overall_avg_percentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-900 text-white font-bold border-t-2 border-indigo-700">
                  <td colSpan={2} className="px-4 py-3.5 text-center border-r border-indigo-800">
                    รวมทั้งหมด (ทุกระดับชั้น)
                  </td>
                  <td className="px-3 py-3.5 text-center border-r border-indigo-800 text-sm font-bold">
                    {data.school_summary.total_students}
                  </td>
                  {data.school_summary.subject_stats.map((st) => (
                    <Fragment key={`sch-${st.subject_id}`}>
                      <td className="px-3 py-3.5 text-right border-r border-indigo-800 font-mono">
                        {st.total_score.toLocaleString()}
                      </td>
                      <td className="px-3 py-3.5 text-right border-r border-indigo-800 font-mono text-amber-300">
                        {st.avg_percentage.toFixed(2)}%
                      </td>
                    </Fragment>
                  ))}
                  <td className="px-3 py-3.5 text-right border-r border-indigo-800 font-mono">
                    {data.school_summary.total_all_subjects.toLocaleString()}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono text-amber-300 text-sm font-extrabold">
                    {data.school_summary.overall_avg_percentage.toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
