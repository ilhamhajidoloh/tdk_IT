import { type SystemSetting, type GradeStatusRow } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import StatCard from "../StatCard";

interface GradeStatusTabProps {
  settingsList: SystemSetting[];
  gradeStatusSettingId: number | null;
  handleSelectGradeStatusSetting: (id: number) => void;
  gradeStatusLoading: boolean;
  gradeStatusData: GradeStatusRow[];
  gradeStatusSubTab: "summary" | "detail";
  setGradeStatusSubTab: (subTab: "summary" | "detail") => void;
  selectedGradeStatusSubject: string;
  setSelectedGradeStatusSubject: (subjectId: string) => void;
  openStudentDetail: (row: GradeStatusRow) => void;
  token: string | null;
  loadGradeStatus: (settingId: number, token: string) => void;
}

export default function GradeStatusTab({
  settingsList,
  gradeStatusSettingId,
  handleSelectGradeStatusSetting,
  gradeStatusLoading,
  gradeStatusData,
  gradeStatusSubTab,
  setGradeStatusSubTab,
  selectedGradeStatusSubject,
  setSelectedGradeStatusSubject,
  openStudentDetail,
  token,
  loadGradeStatus,
}: GradeStatusTabProps) {
  return (
    <div className="p-8 animate-fade-in-up">
      <SectionHeader
        icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        color="amber"
        title="สถานะการกรอกคะแนน"
        subtitle="ตรวจสอบความคืบหน้าการกรอกคะแนนของครูแต่ละคน แต่ละวิชา"
      >
        <button
          onClick={() => {
            if (gradeStatusSettingId && token) loadGradeStatus(gradeStatusSettingId, token);
          }}
          disabled={!gradeStatusSettingId}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-muted disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          รีเฟรชข้อมูล
        </button>
      </SectionHeader>

      <TermSelector
        settingsList={settingsList}
        selectedId={gradeStatusSettingId}
        onSelect={handleSelectGradeStatusSetting}
      />

      {!gradeStatusSettingId ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : gradeStatusLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground font-semibold text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {/* Sub-tabs: Summary / Detail */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setGradeStatusSubTab("summary");
                setSelectedGradeStatusSubject("");
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                gradeStatusSubTab === "summary"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                  : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              สรุปภาพรวม
            </button>
            <button
              onClick={() => setGradeStatusSubTab("detail")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                gradeStatusSubTab === "detail"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                  : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              รายละเอียด
            </button>
          </div>

          {gradeStatusSubTab === "summary" &&
            (() => {
              const teacherMap = new Map<
                string,
                {
                  name: string;
                  subjects: Map<string, { total: number; midterm: number; final: number; classrooms: string[] }>;
                }
              >();
              gradeStatusData.forEach((row) => {
                const tid = row.teacher_id || "__none__";
                const tname = row.teacher_name || "ไม่มีครูผู้สอน";
                if (!teacherMap.has(tid)) teacherMap.set(tid, { name: tname, subjects: new Map() });
                const teacher = teacherMap.get(tid)!;
                if (!teacher.subjects.has(row.subject_id)) {
                  teacher.subjects.set(row.subject_id, { total: 0, midterm: 0, final: 0, classrooms: [] });
                }
                const subj = teacher.subjects.get(row.subject_id)!;
                subj.total += Number(row.total_students);
                subj.midterm += Number(row.midterm_entered);
                subj.final += Number(row.final_entered);
                if (row.classroom_name) subj.classrooms.push(row.classroom_name);
              });

              const teachers = Array.from(teacherMap.entries()).filter(([id]) => id !== "__none__");
              const totalTeachers = teachers.length;
              const completedTeachers = teachers.filter(([, t]) =>
                Array.from(t.subjects.values()).every(
                  (s) => s.total > 0 && s.midterm >= s.total && s.final >= s.total
                )
              ).length;
              const inProgressTeachers = teachers.filter(([, t]) => {
                const subs = Array.from(t.subjects.values());
                const hasAny = subs.some((s) => s.midterm > 0 || s.final > 0);
                const allDone = subs.every(
                  (s) => s.total > 0 && s.midterm >= s.total && s.final >= s.total
                );
                return hasAny && !allDone;
              }).length;
              const notStartedTeachers = totalTeachers - completedTeachers - inProgressTeachers;

              return (
                <div>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <StatCard
                      label="ครูผู้สอนทั้งหมด"
                      value={totalTeachers}
                      color="blue"
                      icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <StatCard
                      label="กรอกครบแล้ว"
                      value={completedTeachers}
                      sub={`${totalTeachers > 0 ? Math.round((completedTeachers / totalTeachers) * 100) : 0}%`}
                      color="green"
                      icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    <StatCard
                      label="กำลังดำเนินการ"
                      value={inProgressTeachers}
                      color="amber"
                      icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    <StatCard
                      label="ยังไม่เริ่ม"
                      value={notStartedTeachers}
                      color="red"
                      icon="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </div>

                  {/* Teacher Cards */}
                  {teachers.length === 0 ? (
                    <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
                      ไม่มีข้อมูลครูผู้สอนในเทอมนี้
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {teachers.map(([tid, teacher]) => {
                        const subs = Array.from(teacher.subjects.entries());
                        const allTotal = subs.reduce((a, [, s]) => a + s.total, 0);
                        const allMidterm = subs.reduce((a, [, s]) => a + s.midterm, 0);
                        const allFinal = subs.reduce((a, [, s]) => a + s.final, 0);
                        const allDone = subs.every(
                          ([, s]) => s.total > 0 && s.midterm >= s.total && s.final >= s.total
                        );
                        const hasAny = subs.some(([, s]) => s.midterm > 0 || s.final > 0);
                        const overallPct =
                          allTotal > 0 ? Math.round(((allMidterm + allFinal) / (allTotal * 2)) * 100) : 0;

                        let statusColor = "bg-muted text-muted-foreground border-border";
                        let statusText = "ยังไม่เริ่ม";
                        if (allDone) {
                          statusColor =
                            "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
                          statusText = "ครบแล้ว";
                        } else if (hasAny) {
                          statusColor =
                            "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30";
                          statusText = "กำลังดำเนินการ";
                        }

                        return (
                          <div key={tid} className="card-interactive p-5">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                                  {teacher.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-foreground text-sm">{teacher.name}</div>
                                  <div className="text-xs text-subtle-foreground">{subs.length} วิชา</div>
                                </div>
                              </div>
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}
                              >
                                {statusText}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>ความคืบหน้ารวม</span>
                                <span className="font-bold">{overallPct}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full transition-all ${
                                    allDone ? "bg-emerald-500" : overallPct > 0 ? "bg-amber-500" : "bg-border"
                                  }`}
                                  style={{ width: `${overallPct}%` }}
                                />
                              </div>
                            </div>

                            {/* Subject breakdown */}
                            <div className="space-y-2">
                              {subs.map(([sid, s]) => {
                                const midPct = s.total > 0 ? Math.round((s.midterm / s.total) * 100) : 0;
                                const finPct = s.total > 0 ? Math.round((s.final / s.total) * 100) : 0;
                                const subjectRow = gradeStatusData.find((r) => r.subject_id === sid);
                                const subjectName = subjectRow?.subject_name || sid;
                                return (
                                  <div key={sid} className="bg-muted rounded-xl p-3">
                                    <div className="font-semibold text-xs text-foreground mb-1.5">
                                      {subjectName}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                      <div>
                                        <span className="text-subtle-foreground">คะแนนเก็บ: </span>
                                        <span
                                          className={`font-bold ${
                                            midPct >= 100
                                              ? "text-emerald-600 dark:text-emerald-400"
                                              : midPct > 0
                                              ? "text-amber-600 dark:text-amber-400"
                                              : "text-subtle-foreground"
                                          }`}
                                        >
                                          {s.midterm}/{s.total}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-subtle-foreground">คะแนนสอบ: </span>
                                        <span
                                          className={`font-bold ${
                                            finPct >= 100
                                              ? "text-emerald-600 dark:text-emerald-400"
                                              : finPct > 0
                                              ? "text-amber-600 dark:text-amber-400"
                                              : "text-subtle-foreground"
                                          }`}
                                        >
                                          {s.final}/{s.total}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

          {gradeStatusSubTab === "detail" && (
            <div>
              {gradeStatusData.length === 0 ? (
                <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
                  ไม่มีข้อมูลในเทอมนี้
                </div>
              ) : (
                <>
                  <div className="mb-4 flex gap-3 items-end">
                    <div className="flex-1 max-w-xs">
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">เลือกวิชา</label>
                      <select
                        value={selectedGradeStatusSubject}
                        onChange={(e) => setSelectedGradeStatusSubject(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-border transition-colors"
                      >
                        <option value="">ทั้งหมด</option>
                        {Array.from(new Set(gradeStatusData.map((row) => row.subject_id))).map((subjectId) => {
                          const subjectName =
                            gradeStatusData.find((row) => row.subject_id === subjectId)?.subject_name || subjectId;
                          return (
                            <option key={subjectId} value={subjectId}>
                              {subjectName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-subtle-foreground mb-3">คลิกแถวเพื่อดูรายชื่อนักเรียน</p>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-bold text-xs">ครูผู้สอน</th>
                          <th className="px-4 py-3 font-bold text-xs">วิชา</th>
                          <th className="px-4 py-3 font-bold text-xs">ชั้นเรียน</th>
                          <th className="px-4 py-3 font-bold text-xs text-center">นักเรียน</th>
                          <th className="px-4 py-3 font-bold text-xs text-center">คะแนนเก็บ</th>
                          <th className="px-4 py-3 font-bold text-xs text-center">คะแนนสอบ</th>
                          <th className="px-4 py-3 font-bold text-xs text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {gradeStatusData
                          .filter(
                            (row) =>
                              !selectedGradeStatusSubject || row.subject_id === selectedGradeStatusSubject
                          )
                          .map((row, i) => {
                            const total = Number(row.total_students);
                            const mid = Number(row.midterm_entered);
                            const fin = Number(row.final_entered);
                            const midPct = total > 0 ? Math.round((mid / total) * 100) : 0;
                            const finPct = total > 0 ? Math.round((fin / total) * 100) : 0;
                            const isDone = total > 0 && mid >= total && fin >= total;
                            const hasAny = mid > 0 || fin > 0;

                            return (
                              <tr
                                key={i}
                                onClick={() => openStudentDetail(row)}
                                className="hover:bg-indigo-50/50 dark:hover:bg-indigo-500/20 cursor-pointer transition-colors"
                              >
                                <td className="px-4 py-3 text-sm font-semibold text-foreground">
                                  {row.teacher_name || <span className="text-subtle-foreground">ไม่ระบุ</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-semibold text-foreground">{row.subject_name}</div>
                                  <div className="text-[10px] text-subtle-foreground">
                                    {row.subject_type === "activity"
                                      ? "วิชากิจกรรม"
                                      : `วิชาหลัก (${row.credit_hours || 1} หน่วยกิต)`}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {row.classroom_name || "-"}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-bold text-foreground">
                                  {total}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div className="w-16 bg-muted rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          midPct >= 100 ? "bg-emerald-500" : midPct > 0 ? "bg-amber-500" : "bg-border"
                                        }`}
                                        style={{ width: `${Math.min(midPct, 100)}%` }}
                                      />
                                    </div>
                                    <span
                                      className={`text-xs font-bold ${
                                        midPct >= 100
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : midPct > 0
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-subtle-foreground"
                                      }`}
                                    >
                                      {mid}/{total}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div className="w-16 bg-muted rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          finPct >= 100 ? "bg-emerald-500" : finPct > 0 ? "bg-amber-500" : "bg-border"
                                        }`}
                                        style={{ width: `${Math.min(finPct, 100)}%` }}
                                      />
                                    </div>
                                    <span
                                      className={`text-xs font-bold ${
                                        finPct >= 100
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : finPct > 0
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-subtle-foreground"
                                      }`}
                                    >
                                      {fin}/{total}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {isDone ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2.5}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      ครบ
                                    </span>
                                  ) : hasAny ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2.5}
                                          d="M12 8v4l3 3"
                                        />
                                      </svg>
                                      กำลังกรอก
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                                      ยังไม่เริ่ม
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {gradeStatusData
                      .filter(
                        (row) =>
                          !selectedGradeStatusSubject || row.subject_id === selectedGradeStatusSubject
                      )
                      .map((row, i) => {
                        const total = Number(row.total_students);
                        const mid = Number(row.midterm_entered);
                        const fin = Number(row.final_entered);
                        const midPct = total > 0 ? Math.round((mid / total) * 100) : 0;
                        const finPct = total > 0 ? Math.round((fin / total) * 100) : 0;
                        const isDone = total > 0 && mid >= total && fin >= total;
                        const hasAny = mid > 0 || fin > 0;

                        return (
                          <div
                            key={i}
                            onClick={() => openStudentDetail(row)}
                            className="card-modern p-4 cursor-pointer hover:border-indigo-200 dark:border-indigo-500/30 hover:shadow-md transition-all active:scale-[0.99]"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="font-bold text-foreground text-sm">{row.subject_name}</div>
                                <div className="text-xs text-subtle-foreground">{row.classroom_name || "-"}</div>
                              </div>
                              {isDone ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                                  ครบ
                                </span>
                              ) : hasAny ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 shrink-0">
                                  กำลังกรอก
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border shrink-0">
                                  ยังไม่เริ่ม
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                              {row.teacher_name || "ไม่ระบุครูผู้สอน"}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="text-subtle-foreground mb-1">คะแนนเก็บ</div>
                                <div className="w-full bg-muted rounded-full h-1.5 mb-0.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      midPct >= 100 ? "bg-emerald-500" : midPct > 0 ? "bg-amber-500" : "bg-border"
                                    }`}
                                    style={{ width: `${Math.min(midPct, 100)}%` }}
                                  />
                                </div>
                                <span className="font-bold text-muted-foreground">
                                  {mid}/{total}
                                </span>
                              </div>
                              <div>
                                <div className="text-subtle-foreground mb-1">คะแนนสอบ</div>
                                <div className="w-full bg-muted rounded-full h-1.5 mb-0.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      finPct >= 100 ? "bg-emerald-500" : finPct > 0 ? "bg-amber-500" : "bg-border"
                                    }`}
                                    style={{ width: `${Math.min(finPct, 100)}%` }}
                                  />
                                </div>
                                <span className="font-bold text-muted-foreground">
                                  {fin}/{total}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
