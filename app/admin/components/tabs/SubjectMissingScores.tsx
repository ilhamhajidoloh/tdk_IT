"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import type { DBGrade, DBStudent, DBSubject, SystemSetting } from "../types";

type Classroom = { id: string; name: string };

interface Props {
  subject: DBSubject;
  setting: SystemSetting;
  token: string | null | undefined;
  onBack: () => void;
}

export default function SubjectMissingScores({ subject, setting, token, onBack }: Props) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<DBStudent[]>([]);
  const [grades, setGrades] = useState<DBGrade[]>([]);
  const [classroomId, setClassroomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, { midterm: string; final: string }>>({});

  const term = `${setting.term}/${setting.academic_year}`;
  const midMax = Number(subject.midterm_max_score) || 0;
  const finalMax = Number(subject.final_max_score) || 0;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [classroomsResponse, studentsResponse, gradesResponse] = await Promise.all([
        fetch(`/api/classrooms?settingId=${setting.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/students?settingId=${setting.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/grades?term=${encodeURIComponent(term)}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const allClassrooms: Classroom[] = classroomsResponse.ok ? await classroomsResponse.json() : [];
      setClassrooms(allClassrooms.filter(item =>
        subject.classroom_ids?.includes(item.id) &&
        !subject.score_disabled_classroom_ids?.includes(item.id)
      ));
      setStudents(studentsResponse.ok ? await studentsResponse.json() : []);
      setGrades(gradesResponse.ok ? await gradesResponse.json() : []);
    } catch (error) {
      console.error("Unable to load subject scores", error);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลคะแนนได้", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [setting.id, token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setDrafts({}); }, [classroomId]);

  const classroomStudents = useMemo(() => students
    .filter(student => student.classroom_id === classroomId)
    .sort((a, b) => (a.student_number ?? 9999) - (b.student_number ?? 9999) || a.name.localeCompare(b.name, "th")), [students, classroomId]);

  const gradeFor = (studentId: string) => grades.find(grade =>
    grade.student_id === studentId && grade.subject.trim().toLowerCase() === subject.name.trim().toLowerCase()
  );
  const changeScore = (value: string, max: number) => {
    if (value === "") return "";
    const numeric = Number(value);
    return Number.isNaN(numeric) || numeric < 0 ? "0" : String(Math.min(numeric, max));
  };
  const save = async (student: DBStudent) => {
    const grade = gradeFor(student.student_id);
    const draft = drafts[student.student_id] ?? { midterm: "", final: "" };
    const midterm = grade?.midterm_score ?? (draft.midterm === "" ? null : Number(draft.midterm));
    const final = grade?.final_score ?? (draft.final === "" ? null : Number(draft.final));
    if (midterm === null && final === null) return;
    setSaving(previous => ({ ...previous, [student.student_id]: true }));
    try {
      const response = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_id: student.student_id, subject: subject.name, midterm_score: midterm, final_score: final, term }),
      });
      if (!response.ok) throw new Error("Save failed");
      await load();
      setDrafts(previous => { const next = { ...previous }; delete next[student.student_id]; return next; });
    } catch (error) {
      console.error(error);
      Swal.fire("เกิดข้อผิดพลาด", "บันทึกคะแนนไม่สำเร็จ", "error");
    } finally {
      setSaving(previous => ({ ...previous, [student.student_id]: false }));
    }
  };

  const selectedClassroom = classrooms.find(item => item.id === classroomId);
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-start gap-3">
        <button onClick={onBack} className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-sm font-bold cursor-pointer">← กลับไปรายวิชา</button>
        <div>
          <h2 className="text-xl font-bold text-foreground">เติมคะแนนที่ขาด: {subject.name}</h2>
          <p className="text-sm text-muted-foreground">เลือกชั้นเรียน แล้วกรอกเฉพาะช่องคะแนนที่ยังไม่มีข้อมูล</p>
        </div>
      </div>

      {loading ? <div className="py-12 text-center text-muted-foreground font-semibold">กำลังโหลดข้อมูล...</div> : !classroomId ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map(item => {
            const count = students.filter(student => student.classroom_id === item.id).length;
            return <button key={item.id} onClick={() => setClassroomId(item.id)} className="text-left card-modern p-5 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer">
              <div className="text-lg font-bold text-foreground">{item.name}</div><div className="mt-1 text-sm text-muted-foreground">นักเรียน {count} คน</div>
              <div className="mt-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">ดูรายชื่อนักเรียน →</div>
            </button>;
          })}
          {classrooms.length === 0 && <div className="sm:col-span-2 lg:col-span-3 py-12 text-center bg-muted rounded-2xl text-muted-foreground">รายวิชานี้ยังไม่ได้กำหนดชั้นเรียน</div>}
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setClassroomId("")} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer border-0 bg-transparent">← เลือกชั้นเรียนอื่น</button>
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="font-bold text-foreground">{selectedClassroom?.name} <span className="text-sm font-medium text-muted-foreground">· {classroomStudents.length} คน</span></div>
            <div className="text-sm text-muted-foreground">คะแนนเต็ม เก็บ {midMax} / ปลายภาค {finalMax}</div>
          </div>

          {/* Compact student cards make score entry comfortable on narrow screens. */}
          <div className="md:hidden space-y-3">
            {classroomStudents.map((student, index) => {
              const grade = gradeFor(student.student_id);
              const draft = drafts[student.student_id] ?? { midterm: "", final: "" };
              const missingMid = midMax > 0 && grade?.midterm_score == null;
              const missingFinal = finalMax > 0 && grade?.final_score == null;
              const complete = !missingMid && !missingFinal;
              const canSave = draft.midterm !== "" || draft.final !== "";
              return <div key={student.id} className="card-modern p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="font-bold text-foreground">{student.student_number ?? index + 1}. {student.name}</div><div className="text-xs text-muted-foreground mt-0.5">{student.student_id}</div></div>
                  <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${complete ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>{complete ? "ครบแล้ว" : "ยังขาด"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-muted-foreground">เก็บคะแนน <span className="font-normal">/ {midMax}</span>
                    {missingMid ? <input value={draft.midterm} onChange={event => setDrafts(prev => ({ ...prev, [student.student_id]: { ...draft, midterm: changeScore(event.target.value, midMax) } }))} inputMode="decimal" type="number" min="0" max={midMax} placeholder="ยังไม่กรอก" className="input-modern mt-1.5 w-full text-center px-2 py-2 text-base" /> : <div className="mt-1.5 rounded-xl bg-muted px-3 py-2 text-center text-base font-bold text-foreground">{grade?.midterm_score ?? "-"}</div>}
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">ปลายภาค <span className="font-normal">/ {finalMax}</span>
                    {missingFinal ? <input value={draft.final} onChange={event => setDrafts(prev => ({ ...prev, [student.student_id]: { ...draft, final: changeScore(event.target.value, finalMax) } }))} inputMode="decimal" type="number" min="0" max={finalMax} placeholder="ยังไม่กรอก" className="input-modern mt-1.5 w-full text-center px-2 py-2 text-base" /> : <div className="mt-1.5 rounded-xl bg-muted px-3 py-2 text-center text-base font-bold text-foreground">{grade?.final_score ?? "-"}</div>}
                  </label>
                </div>
                {!complete && <button disabled={saving[student.student_id] || !canSave} onClick={() => save(student)} className="w-full min-h-11 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 cursor-pointer">{saving[student.student_id] ? "กำลังบันทึก..." : "บันทึกคะแนน"}</button>}
              </div>;
            })}
            {classroomStudents.length === 0 && <div className="py-10 text-center rounded-2xl bg-muted text-muted-foreground">ไม่มีนักเรียนในชั้นเรียนนี้</div>}
          </div>

          <div className="hidden md:block card-modern overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted text-muted-foreground text-xs"><tr><th className="p-3 text-center">#</th><th className="p-3 text-left">นักเรียน</th><th className="p-3 text-center">เก็บคะแนน</th><th className="p-3 text-center">ปลายภาค</th><th className="p-3 text-center">สถานะ</th><th className="p-3" /></tr></thead>
              <tbody className="divide-y divide-border">{classroomStudents.map((student, index) => { const grade = gradeFor(student.student_id); const draft = drafts[student.student_id] ?? { midterm: "", final: "" }; const missingMid = midMax > 0 && grade?.midterm_score == null; const missingFinal = finalMax > 0 && grade?.final_score == null; const complete = !missingMid && !missingFinal; return <tr key={student.id}><td className="p-3 text-center text-muted-foreground">{student.student_number ?? index + 1}</td><td className="p-3"><div className="font-semibold text-foreground">{student.name}</div><div className="text-xs text-muted-foreground">{student.student_id}</div></td><td className="p-3 text-center">{missingMid ? <input value={draft.midterm} onChange={event => setDrafts(prev => ({ ...prev, [student.student_id]: { ...draft, midterm: changeScore(event.target.value, midMax) } }))} type="number" min="0" max={midMax} placeholder={`0-${midMax}`} className="input-modern w-20 text-center px-2 py-1" /> : <span className="font-semibold">{grade?.midterm_score ?? "-"}/{midMax}</span>}</td><td className="p-3 text-center">{missingFinal ? <input value={draft.final} onChange={event => setDrafts(prev => ({ ...prev, [student.student_id]: { ...draft, final: changeScore(event.target.value, finalMax) } }))} type="number" min="0" max={finalMax} placeholder={`0-${finalMax}`} className="input-modern w-20 text-center px-2 py-1" /> : <span className="font-semibold">{grade?.final_score ?? "-"}/{finalMax}</span>}</td><td className="p-3 text-center"><span className={`text-xs font-bold ${complete ? "text-emerald-600" : "text-amber-600"}`}>{complete ? "ครบแล้ว" : "ยังขาด"}</span></td><td className="p-3 text-center">{!complete && <button disabled={saving[student.student_id] || (draft.midterm === "" && draft.final === "")} onClick={() => save(student)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white disabled:opacity-40 cursor-pointer">{saving[student.student_id] ? "กำลังบันทึก" : "บันทึก"}</button>}</td></tr>; })}</tbody>
            </table></div>
          </div>
        </div>
      )}
    </div>
  );
}
