import { type SchedulePeriod, type ScheduleEntry, type SystemSetting, type DBSubject, type DBUser, ALL_DAYS } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";

const ACTIVE_DAYS = ALL_DAYS.filter((d) => d.value >= 1 && d.value <= 5);

interface ScheduleTabProps {
  settingsList: SystemSetting[];
  selectedSubjectSettingId: number | null;
  handleSelectSubjectSetting: (id: number) => void;
  schedulePeriods: SchedulePeriod[];
  updatePeriodField: (
    index: number,
    field: "start_time" | "end_time" | "label" | "is_break",
    value: any
  ) => void;
  handleSavePeriod: (period: SchedulePeriod) => void;
  handleDeletePeriod: (periodId: string) => void;
  handleAddPeriod: () => void;
  scheduleEntries: ScheduleEntry[];
  exportLanguage: "th" | "ms-rumi" | "ms-jawi";
  setExportLanguage: (lang: "th" | "ms-rumi" | "ms-jawi") => void;
  handleExportSchedule: (type: "overview" | "classroom" | "teacher") => void;
  scheduleClassroomId: string;
  setScheduleClassroomId: (id: string) => void;
  subjectClassrooms: { id: string; name: string }[];
  subjectsList: DBSubject[];
  handleScheduleCellChange: (
    day: number,
    periodId: string,
    subjectId: string,
    existingEntryId?: string
  ) => void;
  handleScheduleTeacherChange: (
    day: number,
    periodId: string,
    subjectId: string,
    teacherId: string | null,
    existingEntryId?: string
  ) => void;
  users: DBUser[];
}

export default function ScheduleTab({
  settingsList,
  selectedSubjectSettingId,
  handleSelectSubjectSetting,
  schedulePeriods,
  updatePeriodField,
  handleSavePeriod,
  handleDeletePeriod,
  handleAddPeriod,
  scheduleEntries,
  exportLanguage,
  setExportLanguage,
  handleExportSchedule,
  scheduleClassroomId,
  setScheduleClassroomId,
  subjectClassrooms,
  subjectsList,
  handleScheduleCellChange,
  handleScheduleTeacherChange,
  users,
}: ScheduleTabProps) {
  return (
    <div className="p-8 animate-fade-in-up">
      <SectionHeader
        icon="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        color="blue"
        title="ตารางเรียน (Schedule)"
        subtitle="กำหนดคาบเรียนและตารางสอนแต่ละห้องเรียน ผูกกับปีการศึกษา / เทอม"
        count={selectedSubjectSettingId ? schedulePeriods.length : undefined}
        countLabel="คาบ/วัน"
      />

      {/* Term Selector */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSubjectSettingId}
        onSelect={handleSelectSubjectSetting}
      />

      {!selectedSubjectSettingId ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
          กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
        </div>
      ) : (
        <div className="space-y-10">
          {/* Period Management */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">คาบเรียน</h3>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center">คาบที่</th>
                    <th className="px-4 py-3 font-semibold">เวลาเริ่ม</th>
                    <th className="px-4 py-3 font-semibold">เวลาจบ</th>
                    <th className="px-4 py-3 font-semibold">หมายเหตุ</th>
                    <th className="px-4 py-3 font-semibold text-center">คาบพัก</th>
                    <th className="px-4 py-3 font-semibold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schedulePeriods.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2 text-center font-semibold text-foreground">{p.period_no}</td>
                      <td className="px-4 py-2">
                        <input
                          type="time"
                          value={p.start_time}
                          onChange={(e) => updatePeriodField(idx, "start_time", e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-border text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="time"
                          value={p.end_time}
                          onChange={(e) => updatePeriodField(idx, "end_time", e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-border text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={p.label ?? ""}
                          onChange={(e) => updatePeriodField(idx, "label", e.target.value)}
                          placeholder="เช่น พักเที่ยง"
                          className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!p.is_break}
                          onChange={(e) => updatePeriodField(idx, "is_break", e.target.checked)}
                          className="w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSavePeriod(p)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => handleDeletePeriod(p.id)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {schedulePeriods.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-subtle-foreground">
                        ยังไม่มีคาบเรียน กด &quot;เพิ่มคาบเรียน&quot; เพื่อเริ่ม
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {schedulePeriods.map((p, idx) => (
                <div key={p.id} className="card-modern p-4">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <div className="font-extrabold text-foreground text-sm">คาบที่ {p.period_no}</div>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!p.is_break}
                        onChange={(e) => updatePeriodField(idx, "is_break", e.target.checked)}
                        className="w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border focus:ring-indigo-500"
                      />
                      คาบพัก
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-subtle-foreground mb-1">
                        เวลาเริ่ม
                      </label>
                      <input
                        type="time"
                        value={p.start_time}
                        onChange={(e) => updatePeriodField(idx, "start_time", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-border text-xs font-semibold focus:ring-2 focus:ring-indigo-400 outline-none bg-card"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-subtle-foreground mb-1">
                        เวลาจบ
                      </label>
                      <input
                        type="time"
                        value={p.end_time}
                        onChange={(e) => updatePeriodField(idx, "end_time", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-border text-xs font-semibold focus:ring-2 focus:ring-indigo-400 outline-none bg-card"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-[11px] font-semibold text-subtle-foreground mb-1">
                      หมายเหตุ
                    </label>
                    <input
                      type="text"
                      value={p.label ?? ""}
                      onChange={(e) => updatePeriodField(idx, "label", e.target.value)}
                      placeholder="เช่น พักเที่ยง"
                      className="w-full px-3 py-1.5 rounded-lg border border-border text-xs focus:ring-2 focus:ring-indigo-400 outline-none bg-card"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handleSavePeriod(p)}
                      className="flex-1 text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={() => handleDeletePeriod(p.id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
              {schedulePeriods.length === 0 && (
                <div className="text-center py-6 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-xs font-semibold">
                  ยังไม่มีคาบเรียน กด &quot;เพิ่มคาบเรียน&quot; เพื่อเริ่ม
                </div>
              )}
            </div>

            <button
              onClick={handleAddPeriod}
              className="mt-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มคาบเรียน
            </button>
          </div>

          {/* Export Schedule */}
          {schedulePeriods.length > 0 && scheduleEntries.length > 0 && (
            <div className="mt-2 pt-5 border-t border-border">
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                ส่งออกตารางเรียน
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={exportLanguage}
                  onChange={(e) => setExportLanguage(e.target.value as any)}
                  className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer"
                >
                  <option value="th">🇹🇭 ภาษาไทย</option>
                  <option value="ms-rumi">🇲🇾 Rumi</option>
                  <option value="ms-jawi">🇲🇾 Jawi (جاوي)</option>
                </select>
                <div className="w-px h-6 bg-muted mx-1 hidden sm:block"></div>
                <button
                  onClick={() => handleExportSchedule("overview")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold transition-all shadow-sm border-0 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  ภาพรวมทุกชั้น
                </button>
                <button
                  onClick={() => handleExportSchedule("classroom")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-sm border-0 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  รายชั้นเรียน
                </button>
                <button
                  onClick={() => handleExportSchedule("teacher")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-sm border-0 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  รายครูผู้สอน
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                คลิกปุ่ม &quot;พิมพ์ / บันทึก PDF&quot; ในหน้าที่เปิดขึ้นมา เพื่อพิมพ์หรือบันทึกเป็น PDF
              </p>
            </div>
          )}

          {/* Classroom Schedule Grid */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">ตารางสอนรายห้อง</h3>
            <div className="mb-4">
              <select
                value={scheduleClassroomId}
                onChange={(e) => setScheduleClassroomId(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">-- เลือกห้องเรียน --</option>
                {subjectClassrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {!scheduleClassroomId ? (
              <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
                กรุณาเลือกห้องเรียนด้านบน
              </div>
            ) : schedulePeriods.length === 0 ? (
              <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
                กรุณาเพิ่มคาบเรียนก่อน
              </div>
            ) : (
              <>
                {/* Desktop Grid Table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-base">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3 font-semibold">คาบ</th>
                        {ACTIVE_DAYS.map((d) => (
                          <th key={d.value} className="px-3 py-3 font-semibold text-center">
                            {d.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {schedulePeriods.map((p) => {
                        const subjectsForClassroom = subjectsList.filter((s) =>
                          s.classroom_ids?.includes(scheduleClassroomId)
                        );
                        return (
                          <tr key={p.id} className="hover:bg-muted/50">
                            <td className="px-3 py-2 font-semibold text-foreground whitespace-nowrap align-top">
                              คาบ {p.period_no}
                              <div className="text-xs text-subtle-foreground font-normal">
                                {p.start_time}-{p.end_time}
                              </div>
                              {p.label && (
                                <div className="text-xs text-amber-600 dark:text-amber-400 font-normal">
                                  {p.label}
                                </div>
                              )}
                            </td>
                            {p.is_break ? (
                              <td
                                colSpan={ACTIVE_DAYS.length}
                                className="px-3 py-2 align-middle text-center bg-muted border border-border rounded-md"
                              >
                                <div className="font-bold text-muted-foreground tracking-widest">
                                  {p.label || "พักเบรก"}
                                </div>
                              </td>
                            ) : (
                              ACTIVE_DAYS.map((d) => {
                                const entry = scheduleEntries.find(
                                  (e) =>
                                    e.classroom_id === scheduleClassroomId &&
                                    Number(e.day_of_week) === d.value &&
                                    e.period_id === p.id
                                );
                                const selectedSubj = entry?.subject_id
                                  ? subjectsList.find((s) => s.id === entry.subject_id)
                                  : null;
                                const subjectTeacherDisplay =
                                  selectedSubj?.teacher_names && selectedSubj.teacher_names.length > 0
                                    ? selectedSubj.teacher_names.join(", ")
                                    : selectedSubj?.teacher_name || "";
                                return (
                                  <td key={d.value} className="px-3 py-2 align-top min-w-[140px]">
                                    {/* Subject Selector */}
                                    <select
                                      value={entry?.subject_id ?? ""}
                                      onChange={(ev) =>
                                        handleScheduleCellChange(d.value, p.id, ev.target.value, entry?.id)
                                      }
                                      className="w-full px-2 py-1.5 rounded-lg border border-border text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                    >
                                      <option value="">- ว่าง -</option>
                                      {subjectsForClassroom.map((s) => {
                                        const tDisplay =
                                          s.teacher_names && s.teacher_names.length > 0
                                            ? s.teacher_names.join(", ")
                                            : s.teacher_name || "";
                                        return (
                                          <option key={s.id} value={s.id}>
                                            {s.name}
                                            {tDisplay ? ` (${tDisplay})` : ""}
                                          </option>
                                        );
                                      })}
                                    </select>

                                    {/* Teacher Override Selector */}
                                    {entry?.subject_id &&
                                      selectedSubj?.teacher_ids &&
                                      selectedSubj.teacher_ids.length > 0 && (
                                        <select
                                          value={entry.teacher_id ?? ""}
                                          onChange={(ev) =>
                                            handleScheduleTeacherChange(
                                              d.value,
                                              p.id,
                                              entry.subject_id,
                                              ev.target.value || null,
                                              entry.id
                                            )
                                          }
                                          className="w-full mt-1 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/10 text-xs text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-300 outline-none"
                                          title="ระบุครูผู้สอนเฉพาะห้องนี้ (กรณีครูต่างกันแต่ละชั้น)"
                                        >
                                          <option value="">
                                            {subjectTeacherDisplay
                                              ? `ครู: ${subjectTeacherDisplay}`
                                              : "-- เลือกครูผู้สอน --"}
                                          </option>
                                          {users
                                            .filter((u) => selectedSubj.teacher_ids!.includes(u.id))
                                            .map((u) => (
                                              <option key={u.id} value={u.id}>
                                                {u.username}
                                              </option>
                                            ))}
                                        </select>
                                      )}

                                    {/* Scenario A indicator */}
                                    {entry?.subject_id &&
                                      !entry.teacher_id &&
                                      selectedSubj?.teacher_names &&
                                      selectedSubj.teacher_names.length > 1 && (
                                        <div className="mt-0.5 text-xs text-blue-600 dark:text-blue-400 font-bold">
                                          สอนรวม
                                        </div>
                                      )}
                                  </td>
                                );
                              })
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {schedulePeriods.map((p) => {
                    const subjectsForClassroom = subjectsList.filter((s) =>
                      s.classroom_ids?.includes(scheduleClassroomId)
                    );
                    return (
                      <div key={`p-mob-${p.id}`} className="card-modern p-4">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
                          <div>
                            <span className="font-extrabold text-foreground text-sm">คาบ {p.period_no}</span>
                            <span className="ml-2 text-xs text-subtle-foreground">
                              ({p.start_time} - {p.end_time})
                            </span>
                          </div>
                          {p.label && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                              {p.label}
                            </span>
                          )}
                        </div>
                        {p.is_break ? (
                          <div className="p-3 text-center bg-muted rounded-xl text-xs font-bold text-muted-foreground tracking-widest">
                            {p.label || "พักเบรก"}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {ACTIVE_DAYS.map((d) => {
                              const entry = scheduleEntries.find(
                                (e) =>
                                  e.classroom_id === scheduleClassroomId &&
                                  Number(e.day_of_week) === d.value &&
                                  e.period_id === p.id
                              );
                              const selectedSubj = entry?.subject_id
                                ? subjectsList.find((s) => s.id === entry.subject_id)
                                : null;
                              const subjectTeacherDisplay =
                                selectedSubj?.teacher_names && selectedSubj.teacher_names.length > 0
                                  ? selectedSubj.teacher_names.join(", ")
                                  : selectedSubj?.teacher_name || "";
                              return (
                                <div key={d.value} className="p-2.5 rounded-xl border border-border bg-card">
                                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
                                    วัน{d.label}
                                  </div>
                                  <select
                                    value={entry?.subject_id ?? ""}
                                    onChange={(ev) =>
                                      handleScheduleCellChange(d.value, p.id, ev.target.value, entry?.id)
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold focus:ring-2 focus:ring-indigo-400 outline-none bg-card"
                                  >
                                    <option value="">- ว่าง -</option>
                                    {subjectsForClassroom.map((s) => {
                                      const tDisplay =
                                        s.teacher_names && s.teacher_names.length > 0
                                          ? s.teacher_names.join(", ")
                                          : s.teacher_name || "";
                                      return (
                                        <option key={s.id} value={s.id}>
                                          {s.name}
                                          {tDisplay ? ` (${tDisplay})` : ""}
                                        </option>
                                      );
                                    })}
                                  </select>

                                  {entry?.subject_id &&
                                    selectedSubj?.teacher_ids &&
                                    selectedSubj.teacher_ids.length > 0 && (
                                      <select
                                        value={entry.teacher_id ?? ""}
                                        onChange={(ev) =>
                                          handleScheduleTeacherChange(
                                            d.value,
                                            p.id,
                                            entry.subject_id,
                                            ev.target.value || null,
                                            entry.id
                                          )
                                        }
                                        className="w-full mt-1.5 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/10 text-xs text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-300 outline-none"
                                      >
                                        <option value="">
                                          {subjectTeacherDisplay
                                            ? `ครู: ${subjectTeacherDisplay}`
                                            : "-- เลือกครูผู้สอน --"}
                                        </option>
                                        {users
                                          .filter((u) => selectedSubj.teacher_ids!.includes(u.id))
                                          .map((u) => (
                                            <option key={u.id} value={u.id}>
                                              {u.username}
                                            </option>
                                          ))}
                                      </select>
                                    )}

                                  {entry?.subject_id &&
                                    !entry.teacher_id &&
                                    selectedSubj?.teacher_names &&
                                    selectedSubj.teacher_names.length > 1 && (
                                      <div className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                                        สอนรวม
                                      </div>
                                    )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
