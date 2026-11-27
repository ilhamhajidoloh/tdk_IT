import { ArrowLeft, BookOpen, Building2, CheckSquare, Loader2, Save } from "lucide-react";
import type { DBStudent, DBClassroom, DBSubject, AttendanceYearlyRow } from "../types";

interface AttendanceTabProps {
  mySubjects: DBSubject[];
  attendanceSubjectId: string;
  onSelectSubject: (id: string) => void;
  attendanceClassroomId: string;
  setAttendanceClassroomId: (id: string) => void;
  attendanceClassroomOptions: DBClassroom[];
  attendanceClassroomStudents: DBStudent[];
  attendanceRows: Record<string, AttendanceYearlyRow>;
  totalWeeks: number;
  attendanceLoading: boolean;
  attendanceSaving: boolean;
  onSetDays: (studentId: string, field: keyof Omit<AttendanceYearlyRow, "student_id">, value: string) => void;
  onSaveRow: (student: DBStudent) => void;
  onSaveAll: () => void;
}

export default function AttendanceTab(props: AttendanceTabProps) {
  const {
    mySubjects,
    attendanceSubjectId,
    onSelectSubject,
    attendanceClassroomId,
    setAttendanceClassroomId,
    attendanceClassroomOptions,
    attendanceClassroomStudents,
    attendanceRows,
    totalWeeks,
    attendanceLoading,
    attendanceSaving,
    onSetDays,
    onSaveRow,
    onSaveAll,
  } = props;

  const selectedSubject = mySubjects.find((s) => s.id === attendanceSubjectId);
  const selectedClassroom = attendanceClassroomOptions.find((c) => c.id === attendanceClassroomId);
  const inputClass =
    "w-16 sm:w-20 rounded-lg border border-input bg-card px-2 py-1.5 text-center text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors";

  const renderStudent = (student: DBStudent, index: number, mobile = false) => {
    const row = attendanceRows[student.student_id] ?? {
      student_id: student.student_id,
      present_days: 0,
      sick_leave_days: 0,
      personal_leave_days: 0,
    };
    const used = row.present_days + row.sick_leave_days + row.personal_leave_days;
    const absentDays = Math.max(0, totalWeeks - used);
    const pct = totalWeeks > 0 ? ((row.present_days / totalWeeks) * 100).toFixed(1) : "0.0";
    const fields = [
      { key: "present_days" as const, label: "มาเรียน" },
      { key: "sick_leave_days" as const, label: "ลาป่วย" },
      { key: "personal_leave_days" as const, label: "ลากิจ" },
    ];

    if (mobile) {
      return (
        <div key={student.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-sm text-foreground truncate">
                {index + 1}. {student.name}
              </div>
              <div className="text-xs text-primary font-semibold font-mono mt-0.5">
                {student.student_id}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSaveRow(student)}
              disabled={attendanceSaving}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 disabled:opacity-50 shrink-0"
            >
              บันทึก
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {fields.map((field) => (
              <label key={field.key} className="text-center">
                <span className="block text-[11px] font-medium text-muted-foreground mb-1">
                  {field.label}
                </span>
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, totalWeeks - (used - row[field.key]))}
                  value={row[field.key]}
                  onChange={(e) => onSetDays(student.student_id, field.key, e.target.value)}
                  className={`${inputClass} !w-full`}
                />
              </label>
            ))}
          </div>

          <div className="flex justify-between text-xs font-semibold border-t border-border pt-2.5">
            <span className="text-muted-foreground">
              รวม {used} / {totalWeeks}
            </span>
            <span className="text-rose-600 dark:text-rose-400">ขาดเรียน {absentDays} วัน</span>
            <span className="text-primary">{pct}%</span>
          </div>
        </div>
      );
    }

    return (
      <tr key={student.id} className="hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3 text-muted-foreground text-xs">{index + 1}</td>
        <td className="px-4 py-3">
          <div className="font-semibold text-foreground text-sm">{student.name}</div>
          <div className="text-xs text-primary font-mono">{student.student_id}</div>
        </td>
        {fields.map((field) => (
          <td key={field.key} className="px-4 py-3 text-center">
            <input
              type="number"
              min="0"
              max={Math.max(0, totalWeeks - (used - row[field.key]))}
              value={row[field.key]}
              onChange={(e) => onSetDays(student.student_id, field.key, e.target.value)}
              className={inputClass}
            />
          </td>
        ))}
        <td className="px-4 py-3 text-center font-bold text-foreground">
          {used} / {totalWeeks}
        </td>
        <td className="px-4 py-3 text-center font-bold text-rose-600 dark:text-rose-400">
          {absentDays}
        </td>
        <td className="px-4 py-3 text-center font-bold text-primary">{pct}%</td>
        <td className="px-4 py-3 text-center">
          <button
            type="button"
            onClick={() => onSaveRow(student)}
            disabled={attendanceSaving}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 disabled:opacity-50"
          >
            บันทึก
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {!attendanceSubjectId && (
        <div className="ui-card p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="font-bold text-sm text-foreground">เลือกวิชาสำหรับเช็คชื่อ</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mySubjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSubject(s.id)}
                className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 text-left font-bold text-sm text-foreground transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {attendanceSubjectId && !attendanceClassroomId && (
        <div className="ui-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <button
              type="button"
              onClick={() => onSelectSubject("")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ย้อนกลับ
            </button>
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Building2 className="w-4 h-4 text-primary" />
              เลือกชั้นเรียน: {selectedSubject?.name}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {attendanceClassroomOptions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setAttendanceClassroomId(c.id)}
                className="rounded-xl border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 py-4 px-3 font-bold text-sm text-foreground transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {attendanceSubjectId && attendanceClassroomId && (
        <div className="ui-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAttendanceClassroomId("")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                ย้อนกลับ
              </button>
              <div>
                <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  เช็คชื่อ: {selectedSubject?.name} / {selectedClassroom?.name}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ลาป่วยและลากิจไม่นับเป็นวันมาเรียน
                </p>
              </div>
            </div>
            <span className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              จำนวนสัปดาห์: {totalWeeks || "ยังไม่ได้กำหนด"}
            </span>
          </div>

          {attendanceLoading ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              กำลังโหลดข้อมูล...
            </div>
          ) : totalWeeks === 0 ? (
            <div className="p-8 text-center text-amber-700 dark:text-amber-300 bg-amber-500/5 text-sm font-semibold">
              แอดมินต้องกำหนดจำนวนสัปดาห์ก่อนบันทึก
            </div>
          ) : (
            <>
              <div className="md:hidden p-3 space-y-3">
                {attendanceClassroomStudents.map((s, i) => renderStudent(s, i, true))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-bold">#</th>
                      <th className="px-4 py-3 text-left font-bold">ชื่อ-สกุล</th>
                      <th className="px-4 py-3 text-center font-bold">มาเรียน</th>
                      <th className="px-4 py-3 text-center font-bold">ลาป่วย</th>
                      <th className="px-4 py-3 text-center font-bold">ลากิจ</th>
                      <th className="px-4 py-3 text-center font-bold">รวม</th>
                      <th className="px-4 py-3 text-center font-bold">ขาดเรียน</th>
                      <th className="px-4 py-3 text-center font-bold">% มาเรียน</th>
                      <th className="px-4 py-3 text-center font-bold">บันทึก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendanceClassroomStudents.map((s, i) => renderStudent(s, i))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                <button
                  type="button"
                  onClick={onSaveAll}
                  disabled={attendanceSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {attendanceSaving ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
