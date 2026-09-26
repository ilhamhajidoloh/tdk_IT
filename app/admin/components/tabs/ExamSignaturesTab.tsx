"use client";

import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../SectionHeader";
import { getClassroomName } from "@/app/lib/classroom";
import type { DBClassroom, DBStudent, DBSubject, SystemSetting } from "../types";

type Language = "th" | "ms-rumi" | "ms-jawi";

const COPY = {
  th: {
    title: "ใบเซ็นชื่อเข้าห้องสอบ", subtitle: "พิมพ์รายชื่อสำหรับให้นักเรียนลงลายมือชื่อก่อนเข้าสอบ",
    term: "ปีการศึกษา / ภาคเรียน", room: "ห้องเรียน", allRooms: "ทุกห้องเรียน", school: "ชื่อโรงเรียน",
    subjects: "เลือกวิชา", noSubjects: "ไม่พบรายวิชาในเทอมนี้", date: "วันที่สอบ", print: "เปิดเอกสารเพื่อพิมพ์", loading: "กำลังโหลดข้อมูล...",
    no: "ลำดับ", id: "รหัสนักเรียน", name: "ชื่อ - สกุล", coursework: "คะแนนเก็บ", examScore: "สอบ", scoreTotal: "รวม", signature: "ลายมือชื่อ", total: "รวม",
    students: "คน", examSheet: "ใบเซ็นชื่อเข้าห้องสอบ", class: "ชั้นเรียน", examName: "วิชา / การสอบ", invigilator: "ครูผู้คุมสอบ", teacher: "ครูผู้สอน",
    examDate: "วันที่สอบ", printPdf: "พิมพ์ / บันทึก PDF", noStudents: "ไม่พบรายชื่อนักเรียนในห้องนี้",
  },
  "ms-rumi": {
    title: "Borang Tandatangan Bilik Peperiksaan", subtitle: "Cetak senarai untuk pelajar menandatangani sebelum memasuki bilik peperiksaan",
    term: "Tahun Akademik / Penggal", room: "Kelas", allRooms: "Semua Kelas", school: "Nama Sekolah",
    subjects: "Pilih Subjek", noSubjects: "Tiada subjek dalam penggal ini", date: "Tarikh Peperiksaan", print: "Buka dokumen untuk cetakan", loading: "Memuatkan data...",
    no: "Bil.", id: "ID Pelajar", name: "Nama Penuh", coursework: "Markah Kursus", examScore: "Peperiksaan", scoreTotal: "Jumlah", signature: "Tandatangan", total: "Jumlah",
    students: "orang", examSheet: "Borang Tandatangan Bilik Peperiksaan", class: "Kelas", examName: "Subjek / Peperiksaan", invigilator: "Guru Pengawas", teacher: "Guru Pengajar",
    examDate: "Tarikh", printPdf: "Cetak / Simpan PDF", noStudents: "Tiada pelajar dalam kelas ini",
  },
  "ms-jawi": {
    title: "بورڠ تندا تاڠن بيليق ڤڤريقساءن", subtitle: "چتق سناراي اونتوق ڤلاجر مننداتڠاني سبلوم ماسوق بيليق ڤڤريقساءن",
    term: "تاهون اكدميک / ڤڠݢل", room: "کلس", allRooms: "سموا کلس", school: "نام سکوله",
    subjects: "ڤيليه ڤلاجران", noSubjects: "تياد ڤلاجران دالم ڤڠݢل اين", date: "تاريخ ڤڤريقساءن", print: "بوک دوکومن اونتوق چتق", loading: "ممواݢ داتا...",
    no: "بيل.", id: "ايدي ڤلاجر", name: "نام ڤنوه", coursework: "مركة كڬياتن", examScore: "مركة ففريقسأن", scoreTotal: "مركة سموا", signature: "تندا تاڠن", total: "جومله",
    students: "اورڠ", examSheet: "بورڠ تندا تاڠن بيليق ڤڤريقساءن", class: "کلس", examName: "ڤلاجران / ڤڤريقساءن", invigilator: "ݢورو ڤڠاوس", teacher: "ݢورو ڤڠاجر",
    examDate: "تاريخ", printPdf: "چتق / سيمڤن PDF", noStudents: "تياد ڤلاجر دالم کلس اين",
  },
} as const;

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
}

export default function ExamSignaturesTab({ settingsList, token, schoolId }: {
  settingsList: SystemSetting[];
  token: string | null;
  schoolId: string;
}) {
  const [language, setLanguage] = useState<Language>("th");
  // Native <select> values are strings. Keep the selected term as a string too,
  // otherwise some browsers can retain the previously selected numeric option.
  const [settingId, setSettingId] = useState("");
  const [classroomId, setClassroomId] = useState("all");
  const [classrooms, setClassrooms] = useState<DBClassroom[]>([]);
  const [students, setStudents] = useState<DBStudent[]>([]);
  const [subjects, setSubjects] = useState<DBSubject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(false);
  const text = COPY[language];
  const direction = language === "ms-jawi" ? "rtl" : "ltr";

  const activeSettingId = settingId || (settingsList[0]?.id ? String(settingsList[0].id) : "");

  useEffect(() => {
    if (!activeSettingId || !token) return;
    const controller = new AbortController();
    const schoolQuery = schoolId && schoolId !== "main" ? `&schoolId=${encodeURIComponent(schoolId)}&school_id=${encodeURIComponent(schoolId)}` : "";
    const request = Promise.all([
      fetch(`/api/classrooms?settingId=${activeSettingId}${schoolQuery}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
      fetch(`/api/students?settingId=${activeSettingId}${schoolQuery}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
      fetch(`/api/subjects?settingId=${activeSettingId}${schoolQuery}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
      fetch(`/api/public/schools/${encodeURIComponent(schoolId)}`, { signal: controller.signal }),
    ])
      .then(async ([classroomResponse, studentResponse, subjectResponse, schoolResponse]) => {
        const [nextClassrooms, nextStudents, nextSubjects, school] = await Promise.all([
          classroomResponse.ok ? classroomResponse.json() : [],
          studentResponse.ok ? studentResponse.json() : [],
          subjectResponse.ok ? subjectResponse.json() : [],
          schoolResponse.ok ? schoolResponse.json() : null,
        ]);
        setClassrooms(nextClassrooms);
        setStudents(nextStudents);
        setSubjects(nextSubjects);
        setSelectedSubjectIds((previous) => previous.filter((id) => nextSubjects.some((subject: DBSubject) => subject.id === id)));
        setSchoolName(school?.name || "");
      })
      .catch((error: unknown) => { if ((error as { name?: string }).name !== "AbortError") console.error("Unable to load exam signature data", error); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    void Promise.resolve().then(() => { if (!controller.signal.aborted) setLoading(true); });
    void request;
    return () => controller.abort();
  }, [activeSettingId, token, schoolId]);

  const selectedClassrooms = useMemo(
    () => classroomId === "all" ? classrooms : classrooms.filter((classroom) => classroom.id === classroomId),
    [classroomId, classrooms],
  );

  const selectedSubjects = useMemo(
    () => subjects.filter((subject) => selectedSubjectIds.includes(subject.id)),
    [subjects, selectedSubjectIds],
  );

  const getSubjectName = (subject: DBSubject) => {
    if (language === "th") return subject.name_thai?.trim() || subject.name;
    if (language === "ms-rumi") return subject.name_rumi?.trim() || subject.name;
    return subject.name_jawi?.trim() || subject.name;
  };

  const handleSettingChange = (value: string) => {
    if (!value) return;
    // Clear term-specific choices before loading the new term's records.
    setSettingId(value);
    setClassroomId("all");
    setSelectedSubjectIds([]);
  };

  const printDocument = () => {
    if (!selectedClassrooms.length || !selectedSubjects.length) return;
    const pages = selectedSubjects.flatMap((subject) => selectedClassrooms
      .filter((classroom) => !subject.classroom_ids?.length || subject.classroom_ids.includes(classroom.id))
      .map((classroom) => {
      const roomStudents = students
        .filter((student) => student.classroom_id === classroom.id && student.status !== "graduated" && student.status !== "resigned")
        .sort((a, b) => (a.student_number ?? Number.MAX_SAFE_INTEGER) - (b.student_number ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "th"));
      const rows = roomStudents.map((student, index) => `<tr>
        <td>${escapeHtml(student.student_number ?? index + 1)}</td><td>${escapeHtml(student.student_id)}</td>
        <td class="name">${escapeHtml(student.name)}</td><td class="score"></td><td class="score"></td><td class="score"></td><td class="signature"></td></tr>`).join("") || `<tr><td colspan="7" class="empty">${text.noStudents}</td></tr>`;
      return `<section class="page" dir="${direction}">
        <h1>${escapeHtml(schoolName || " ")}</h1><h2>${text.examSheet}</h2>
        <div class="details"><span><b>${text.class}:</b> ${escapeHtml(getClassroomName(classroom, language))}</span>
          <span><b>${text.examName}:</b> ${escapeHtml(getSubjectName(subject))}</span><span><b>${text.examDate}:</b> ${escapeHtml(examDate || "-")}</span></div>
        <table><thead><tr><th>${text.no}</th><th>${text.id}</th><th>${text.name}</th><th>${text.coursework}</th><th>${text.examScore}</th><th>${text.scoreTotal}</th><th>${text.signature}</th></tr></thead>
        <tbody>${rows}</tbody></table><p class="total">${text.total}: ${roomStudents.length} ${text.students}</p>
        <div class="signatures"><div>${text.invigilator} ................................................</div><div>${text.teacher} ................................................</div></div></section>`;
      })).join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!doctype html><html lang="${language === "th" ? "th" : "ms"}" dir="${direction}"><head><meta charset="utf-8"><title>${text.examSheet}</title>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
      <style>*{box-sizing:border-box}body{font-family:${language === "ms-jawi" ? "Amiri" : "Sarabun"},sans-serif;color:#111827;margin:0;background:#f1f5f9}.toolbar{position:fixed;top:16px;right:16px;z-index:2}button{background:#4f46e5;color:#fff;border:0;border-radius:8px;padding:10px 16px;font-weight:700;cursor:pointer}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;padding:18mm 15mm;page-break-after:always}h1{text-align:center;font-size:18px;margin:0 0 4px;min-height:24px}h2{text-align:center;font-size:22px;margin:0 0 12px}.details{display:flex;flex-wrap:wrap;gap:8px 24px;border-top:1px solid #94a3b8;border-bottom:1px solid #94a3b8;padding:9px 0;margin-bottom:14px;font-size:14px}.details span{min-width:30%}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #475569;padding:7px 5px;vertical-align:middle}th{background:#e2e8f0;text-align:center;font-weight:700}td:first-child{width:6%;text-align:center}td:nth-child(2){width:13%;text-align:center}.name{width:29%}.score{width:9%;height:38px;text-align:center}.signature{height:38px;width:25%}.empty{text-align:center;color:#64748b;padding:20px}.total{text-align:${language === "ms-jawi" ? "left" : "right"};font-weight:700;margin-top:10px}.signatures{display:flex;justify-content:space-between;gap:32px;margin-top:42px;font-size:14px}.signatures div{flex:1;white-space:nowrap}@media print{body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;page-break-after:always}@page{size:A4 portrait;margin:0}}</style></head><body><div class="toolbar"><button onclick="window.print()">${text.printPdf}</button></div>${pages}</body></html>`);
    win.document.close();
  };

  return <div className="p-8 animate-fade-in-up" dir={direction}>
    <SectionHeader icon="M9 12l2 2 4-4" color="indigo" title={text.title} subtitle={text.subtitle}>
      <button type="button" onClick={printDocument} disabled={loading || selectedClassrooms.length === 0 || selectedSubjects.length === 0} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 cursor-pointer">
        {text.print}
      </button>
    </SectionHeader>
    <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 space-y-5 shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        {(["th", "ms-rumi", "ms-jawi"] as Language[]).map((item) => <button key={item} type="button" onClick={() => setLanguage(item)} className={`rounded-xl py-2 text-xs font-bold border cursor-pointer ${language === item ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground"}`}>
          {item === "th" ? "ไทย" : item === "ms-rumi" ? "Melayu (Rumi)" : "ملايو (Jawi)"}
        </button>)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-sm font-bold text-foreground">{text.school}<input value={schoolName} readOnly className="mt-1.5 w-full rounded-xl border border-border bg-muted px-3 py-2.5 font-medium cursor-not-allowed" /></label>
        <label className="text-sm font-bold text-foreground">{text.term}<select value={activeSettingId} onChange={(event) => handleSettingChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-medium"><option value="" disabled>--</option>{settingsList.map((setting) => <option key={setting.id} value={String(setting.id)}>{setting.academic_year} / {setting.term}</option>)}</select></label>
        <label className="text-sm font-bold text-foreground">{text.room}<select value={classroomId} onChange={(event) => setClassroomId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-medium"><option value="all">{text.allRooms}</option>{classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{getClassroomName(classroom, language)}</option>)}</select></label>
        <label className="text-sm font-bold text-foreground">{text.date}<input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-medium" /></label>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-3"><label className="text-sm font-bold text-foreground">{text.subjects}</label><span className="text-xs text-muted-foreground">{selectedSubjectIds.length} / {subjects.length}</span></div>
        {subjects.length === 0 ? <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{loading ? text.loading : text.noSubjects}</p> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {subjects.map((subject) => <label key={subject.id} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium cursor-pointer"><input type="checkbox" checked={selectedSubjectIds.includes(subject.id)} onChange={(event) => setSelectedSubjectIds((previous) => event.target.checked ? [...previous, subject.id] : previous.filter((id) => id !== subject.id))} className="h-4 w-4 accent-indigo-600" /><span dir={language === "ms-jawi" ? "rtl" : "ltr"}>{getSubjectName(subject)}</span></label>)}
        </div>}
      </div>
      <p className="text-sm text-muted-foreground">{loading ? text.loading : `${selectedClassrooms.length} ${text.room} · ${students.filter((student) => classroomId === "all" || student.classroom_id === classroomId).length} ${text.students}`}</p>
    </div>
  </div>;
}
