import { type SystemSetting, type DBStudent, type DBSubject } from "../types";

interface ExportScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportMode: "classroom" | "individual";
  setExportMode: (mode: "classroom" | "individual") => void;
  exportLanguage: "th" | "ms-rumi" | "ms-jawi";
  setExportLanguage: (lang: "th" | "ms-rumi" | "ms-jawi") => void;
  exportSettingId: number | null;
  setExportSettingId: (id: number | null) => void;
  exportClassroomId: string;
  setExportClassroomId: (id: string) => void;
  exportStudentId: string;
  setExportStudentId: (id: string) => void;
  includeActivitySubjects: boolean;
  setIncludeActivitySubjects: (include: boolean) => void;
  exportSubjectList: DBSubject[];
  exportSelectedSubjectIds: string[];
  setExportSelectedSubjectIds: React.Dispatch<React.SetStateAction<string[]>>;
  settingsList: SystemSetting[];
  classrooms: { id: string; name: string; setting_id?: number | null }[];
  students: DBStudent[];
  moveExportSubjectUp: (index: number) => void;
  moveExportSubjectDown: (index: number) => void;
  onExport: () => void;
}

export default function ExportScoreModal({
  isOpen,
  onClose,
  exportMode,
  setExportMode,
  exportLanguage,
  setExportLanguage,
  exportSettingId,
  setExportSettingId,
  exportClassroomId,
  setExportClassroomId,
  exportStudentId,
  setExportStudentId,
  includeActivitySubjects,
  setIncludeActivitySubjects,
  exportSubjectList,
  exportSelectedSubjectIds,
  setExportSelectedSubjectIds,
  settingsList,
  classrooms,
  students,
  moveExportSubjectUp,
  moveExportSubjectDown,
  onExport,
}: ExportScoreModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] my-auto flex flex-col border border-border animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground">ส่งออกคะแนน / พิมพ์รายงาน</h3>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                เลือกรูปแบบรายงาน ปีการศึกษา ชั้นเรียน และวิชาที่ต้องการส่งออก
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-full transition-all cursor-pointer border-0 bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Export Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-2xl border border-border/80">
            <button
              type="button"
              onClick={() => setExportMode("classroom")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer flex items-center justify-center gap-1.5 ${
                exportMode === "classroom"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16M9 7h1m4 0h1m-6 4h1m4 0h1m-5 9v-4a1 1 0 011-1h1a1 1 0 011 1v4"
                />
              </svg>
              สรุปคะแนนชั้นเรียน
            </button>
            <button
              type="button"
              onClick={() => setExportMode("individual")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer flex items-center justify-center gap-1.5 ${
                exportMode === "individual"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              รายงานผลการเรียนรายบุคคล
            </button>
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              ภาษาของรายงาน (Report Language)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportLanguage("th")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  exportLanguage === "th"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-indigo-300"
                }`}
              >
                🇹🇭 ภาษาไทย
              </button>
              <button
                type="button"
                onClick={() => setExportLanguage("ms-rumi")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  exportLanguage === "ms-rumi"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-indigo-300"
                }`}
              >
                🇲🇾 Melayu (Rumi)
              </button>
              <button
                type="button"
                onClick={() => setExportLanguage("ms-jawi")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  exportLanguage === "ms-jawi"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-indigo-300"
                }`}
              >
                🕌 Melayu (جاوي/Jawi)
              </button>
            </div>
          </div>

          {/* Select Setting & Classroom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                ปีการศึกษา / เทอม <span className="text-red-500">*</span>
              </label>
              <select
                value={exportSettingId || ""}
                onChange={(e) => setExportSettingId(Number(e.target.value) || null)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                {settingsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    ปี {s.academic_year} เทอม {s.term}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                ชั้นเรียน <span className="text-red-500">*</span>
              </label>
              <select
                value={exportClassroomId}
                onChange={(e) => setExportClassroomId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">-- เลือกชั้นเรียน --</option>
                {classrooms
                  .filter((c) => !exportSettingId || c.setting_id === exportSettingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      ชั้น {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Select Student for Individual Mode */}
          {exportMode === "individual" && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                เลือกนักเรียน <span className="text-red-500">*</span>
              </label>
              <select
                value={exportStudentId}
                onChange={(e) => setExportStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="all">-- นักเรียนทุกคนในชั้น (พิมพ์แยกใบละคน) --</option>
                {students
                  .filter((s) => s.classroom_id === exportClassroomId)
                  .sort((a, b) => (a.student_number || 999) - (b.student_number || 999))
                  .map((s) => (
                    <option key={s.id} value={s.student_id}>
                      {s.student_number ? `เลขที่ ${s.student_number}: ` : ""}
                      {s.name} ({s.student_id})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Include Activity Toggle */}
          <div className="p-3.5 rounded-2xl border border-border bg-muted/40 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-foreground">รวมวิชากิจกรรมในรายงาน</div>
              <div className="text-xs text-subtle-foreground">
                แสดงวิชาประเภทกิจกรรม (เช่น ลูกเสือ, สแกรตช์) ในตารางส่งออก
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeActivitySubjects}
                onChange={(e) => setIncludeActivitySubjects(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Subject Order Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                จัดลำดับวิชาเรียน (อยู่หน้า ➔ อยู่หลัง)
              </label>
              <span className="text-xs text-subtle-foreground font-semibold">
                เลือก {exportSelectedSubjectIds.length} / {exportSubjectList.length} วิชา
              </span>
            </div>

            {exportSubjectList.length === 0 ? (
              <div className="p-6 text-center text-subtle-foreground text-xs font-semibold border border-dashed border-border rounded-2xl bg-card">
                {exportClassroomId ? "ไม่มีวิชาเรียนในชั้นเรียนนี้" : "กรุณาเลือกชั้นเรียนด้านบน"}
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {exportSubjectList.map((subj, index) => {
                  const isChecked = exportSelectedSubjectIds.includes(subj.id);
                  return (
                    <div
                      key={subj.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        isChecked
                          ? "border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-500/10"
                          : "border-border bg-card opacity-60"
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked)
                              setExportSelectedSubjectIds((prev) => [...prev, subj.id]);
                            else
                              setExportSelectedSubjectIds((prev) => prev.filter((id) => id !== subj.id));
                          }}
                          className="w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-border"
                        />
                        <span className="font-bold text-foreground text-xs truncate">{subj.name}</span>
                        {subj.subject_type === "activity" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold shrink-0">
                            กิจกรรม
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                            วิชาหลัก ({subj.credit_hours} นก.)
                          </span>
                        )}
                      </label>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveExportSubjectUp(index)}
                          className="px-2 py-1 text-xs font-bold rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-30 cursor-pointer transition-colors"
                          title="ย้ายขึ้น (ให้อยู่หน้า)"
                        >
                          ⬆️ ขึ้น
                        </button>
                        <button
                          type="button"
                          disabled={index === exportSubjectList.length - 1}
                          onClick={() => moveExportSubjectDown(index)}
                          className="px-2 py-1 text-xs font-bold rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-30 cursor-pointer transition-colors"
                          title="ย้ายลง (ให้อยู่หลัง)"
                        >
                          ⬇️ ลง
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-card border-t border-border flex items-center justify-end gap-2.5 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground bg-muted hover:bg-border transition-all cursor-pointer border-0"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={!exportClassroomId || exportSelectedSubjectIds.length === 0}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-sm cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            ส่งออกคะแนน / พิมพ์รายงาน
          </button>
        </div>
      </div>
    </div>
  );
}
