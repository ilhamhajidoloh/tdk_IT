import { ClipboardCheck, BookOpen } from "lucide-react";
import { type DBStudent, type DBGrade, type DBClassroom, type DBSubject } from "../types";

interface StatusTabProps {
  mySubjects: DBSubject[];
  statusSubject: string;
  setStatusSubject: (name: string) => void;
  statusClassroom: string;
  setStatusClassroom: (id: string) => void;
  classrooms: DBClassroom[];
  statusStudents: DBStudent[];
  statusTerm: string;
  grades: DBGrade[];
}

interface ScoreStatusBadgeProps {
  isCombined: boolean;
  hasMidterm: boolean;
  hasFinal: boolean;
}

function ScoreStatusBadge({ isCombined, hasMidterm, hasFinal }: ScoreStatusBadgeProps) {
  const complete = hasMidterm && (isCombined || hasFinal);
  const hasAny = hasMidterm || hasFinal;
  const containerClass = complete
    ? "border-emerald-500/25 bg-emerald-500/8"
    : hasAny
    ? "border-amber-500/25 bg-amber-500/8"
    : "border-rose-500/25 bg-rose-500/8";
  const statusClass = (done: boolean) =>
    done ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300";

  return (
    <div className={`inline-flex w-[160px] max-w-full flex-col gap-1 rounded-xl border px-3 py-2 text-left ${containerClass}`}>
      {isCombined ? (
        <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
          <span className="text-muted-foreground">คะแนนรวม</span>
          <span className={statusClass(hasMidterm)}>{hasMidterm ? "กรอกแล้ว" : "ยังไม่กรอก"}</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className="text-muted-foreground">คะแนนเก็บ</span>
            <span className={statusClass(hasMidterm)}>{hasMidterm ? "กรอกแล้ว" : "ยังไม่กรอก"}</span>
          </div>
          <div className="h-px bg-border/60" />
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className="text-muted-foreground">คะแนนสอบ</span>
            <span className={statusClass(hasFinal)}>{hasFinal ? "กรอกแล้ว" : "ยังไม่กรอก"}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function StatusTab({
  mySubjects,
  statusSubject,
  setStatusSubject,
  statusClassroom,
  setStatusClassroom,
  classrooms,
  statusStudents,
  statusTerm,
  grades,
}: StatusTabProps) {
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Filter Bar */}
      <div className="ui-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="ui-label">รายวิชา</label>
            <select
              value={statusSubject}
              onChange={(e) => {
                setStatusSubject(e.target.value);
                setStatusClassroom("");
              }}
              className="ui-input"
            >
              <option value="">— เลือกรายวิชา —</option>
              {mySubjects.map((s, i) => (
                <option key={i} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ui-label">ชั้นเรียน</label>
            <select
              value={statusClassroom}
              onChange={(e) => setStatusClassroom(e.target.value)}
              disabled={!statusSubject}
              className="ui-input"
            >
              <option value="">— เลือกชั้นเรียน —</option>
              {classrooms
                .filter((c) => mySubjects.find((s) => s.name === statusSubject)?.classroom_ids?.includes(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.name_thai && c.name_thai !== c.name ? ` (${c.name_thai})` : ""}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Table */}
      {statusSubject && statusClassroom ? (
        (() => {
          const subject = mySubjects.find(
            (s) => s.name.trim().toLowerCase() === statusSubject.trim().toLowerCase()
          );
          const isCombined =
            subject?.subject_type === "activity" && subject.score_display_mode === "combined";
          const getGrade = (studentId: string) =>
            grades.find(
              (g) =>
                g.student_id === studentId &&
                g.subject.trim().toLowerCase() === statusSubject.trim().toLowerCase() &&
                g.term === statusTerm
            );
          const getParts = (studentId: string) => {
            const grade = getGrade(studentId);
            return {
              hasMidterm: grade?.midterm_score != null,
              hasFinal: grade?.final_score != null,
            };
          };
          const midtermCount = statusStudents.filter((s) => getParts(s.student_id).hasMidterm).length;
          const finalCount = statusStudents.filter((s) => getParts(s.student_id).hasFinal).length;
          const completeCount = statusStudents.filter((s) => {
            const parts = getParts(s.student_id);
            return parts.hasMidterm && (isCombined || parts.hasFinal);
          }).length;
          const pct = statusStudents.length > 0 ? Math.round((completeCount / statusStudents.length) * 100) : 0;

          return (
            <div className="ui-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm sm:text-base">
                      วิชา: <span className="text-primary">{statusSubject}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ห้อง {classrooms.find((c) => c.id === statusClassroom)?.name} · เทอม {statusTerm}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex items-stretch gap-3">
                  <div className="text-center px-2">
                    <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {isCombined ? `${completeCount}/${statusStudents.length}` : `${midtermCount}/${statusStudents.length}`}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
                      {isCombined ? "คะแนนรวม" : "คะแนนเก็บ"}
                    </div>
                  </div>
                  <div className="hidden sm:block w-px h-8 self-center bg-border" />
                  <div className="text-center px-2">
                    <div
                      className={`text-lg sm:text-xl font-extrabold ${
                        isCombined
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isCombined
                        ? `${statusStudents.length - completeCount}/${statusStudents.length}`
                        : `${finalCount}/${statusStudents.length}`}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
                      {isCombined ? "ยังไม่กรอก" : "คะแนนสอบ"}
                    </div>
                  </div>
                  {!isCombined && (
                    <>
                      <div className="hidden sm:block w-px h-8 self-center bg-border" />
                      <div className="text-center px-2 col-span-2 sm:col-span-1">
                        <div className="text-lg sm:text-xl font-extrabold text-primary">
                          {completeCount}/{statusStudents.length}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
                          ครบทั้งสองส่วน
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {statusStudents.length > 0 && (
                <div className="px-5 py-3.5 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1.5">
                    <span>{isCombined ? "ความคืบหน้าคะแนนรวม" : "ความคืบหน้าคะแนนเก็บและสอบ"}</span>
                    <span className="text-primary font-bold">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border text-foreground text-xs">
                      <th className="px-5 py-3 text-center font-bold w-14">#</th>
                      <th className="px-5 py-3 text-left font-bold w-32">รหัส</th>
                      <th className="px-5 py-3 text-left font-bold">ชื่อนักเรียน</th>
                      <th className="px-5 py-3 text-center font-bold w-56">สถานะคะแนน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {statusStudents.map((s, idx) => {
                      const { hasMidterm, hasFinal } = getParts(s.student_id);
                      const has = hasMidterm && (isCombined || hasFinal);
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-muted/40 transition-colors ${
                            has ? "bg-emerald-500/5" : ""
                          }`}
                        >
                          <td className="px-5 py-3.5 text-center text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-5 py-3.5 font-bold text-primary text-xs font-mono">
                            {s.student_id}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-foreground">{s.name}</td>
                          <td className="px-5 py-3 text-center align-middle">
                            <ScoreStatusBadge isCombined={isCombined} hasMidterm={hasMidterm} hasFinal={hasFinal} />
                          </td>
                        </tr>
                      );
                    })}
                    {statusStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-muted-foreground">
                          ไม่มีนักเรียนในห้องนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border">
                {statusStudents.map((s) => {
                  const { hasMidterm, hasFinal } = getParts(s.student_id);
                  const has = hasMidterm && (isCombined || hasFinal);
                  return (
                    <div
                      key={s.id}
                      className={`flex items-start justify-between gap-3 p-4 ${
                        has ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="font-semibold text-sm text-foreground">{s.name}</div>
                        <div className="text-xs text-primary font-semibold font-mono mt-0.5">
                          {s.student_id}
                        </div>
                      </div>
                      <ScoreStatusBadge isCombined={isCombined} hasMidterm={hasMidterm} hasFinal={hasFinal} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      ) : (
        <div className="ui-card text-center py-16 px-6 text-muted-foreground">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <p className="font-bold text-foreground text-base">
            {!statusSubject ? "เลือกรายวิชาเพื่อดูสถานะ" : "เลือกชั้นเรียนเพื่อดูรายชื่อ"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">ตรวจสอบความคืบหน้าการบันทึกคะแนน</p>
        </div>
      )}
    </div>
  );
}
