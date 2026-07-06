import { type SystemSetting, type DBUser } from "../types";

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectModalMode: "add" | "edit";
  subjectSettingId: number | null;
  settingsList: SystemSetting[];
  validationError: string | null;
  subjectName: string;
  setSubjectName: (name: string) => void;
  subjectTeacherIds: string[];
  setSubjectTeacherIds: (ids: string[]) => void;
  users: DBUser[];
  subjectType: "main" | "activity";
  setSubjectType: (type: "main" | "activity") => void;
  subjectHasScore: boolean;
  setSubjectHasScore: React.Dispatch<React.SetStateAction<boolean>>;
  subjectCreditHours: number;
  setSubjectCreditHours: (hours: number) => void;
  subjectMidtermMax: number;
  setSubjectMidtermMax: (score: number) => void;
  subjectFinalMax: number;
  setSubjectFinalMax: (score: number) => void;
  subjectClassrooms: { id: string; name: string }[];
  subjectClassroomIds: string[];
  setSubjectClassroomIds: (ids: string[]) => void;
  onSave: () => void;
}

export default function SubjectModal({
  isOpen,
  onClose,
  subjectModalMode,
  subjectSettingId,
  settingsList,
  validationError,
  subjectName,
  setSubjectName,
  subjectTeacherIds,
  setSubjectTeacherIds,
  users,
  subjectType,
  setSubjectType,
  subjectHasScore,
  setSubjectHasScore,
  subjectCreditHours,
  setSubjectCreditHours,
  subjectMidtermMax,
  setSubjectMidtermMax,
  subjectFinalMax,
  setSubjectFinalMax,
  subjectClassrooms,
  subjectClassroomIds,
  setSubjectClassroomIds,
  onSave,
}: SubjectModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] sm:max-h-[90vh] my-auto overflow-hidden transform transition-all animate-slide-up-fade flex flex-col border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-border bg-card flex items-center justify-between relative">
          <div>
            <h3 className="text-xl font-extrabold text-foreground">
              {subjectModalMode === "add" ? "เพิ่มวิชาเรียนใหม่" : "แก้ไขวิชาเรียน"}
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {(() => {
                const s = settingsList.find((s) => s.id === subjectSettingId);
                return s
                  ? `ปีการศึกษา ${s.academic_year} เทอม ${s.term}`
                  : "ระบุชื่อวิชา เลือกครูผู้สอน และชั้นเรียน";
              })()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-full transition-all duration-200 cursor-pointer border-0 bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 sm:px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {validationError}
            </div>
          )}

          {/* Setting Badge */}
          {subjectSettingId &&
            (() => {
              const s = settingsList.find((s) => s.id === subjectSettingId);
              return s ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-border/50">
                  <svg
                    className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    ปีการศึกษา {s.academic_year} ภาคเรียนที่ {s.term}
                  </span>
                  {s.is_active && (
                    <span className="ml-auto bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs px-1.5 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  )}
                </div>
              ) : null;
            })()}

          {/* Subject Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              ชื่อวิชาเรียน <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="เช่น ภาษาไทย พื้นฐาน"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
            />
          </div>

          {/* Teacher Multi-Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              ครูผู้สอน
              <span className="ml-1.5 font-normal normal-case text-muted-foreground">
                (เลือกได้หลายคน กรณีสอนรวม)
              </span>
            </label>
            {users.filter((u) => u.role === "teacher").length === 0 ? (
              <div className="text-muted-foreground text-xs py-2 px-3 rounded-xl border border-dashed border-border">
                ไม่มีครูในระบบ กรุณาเพิ่มผู้ใช้ที่มีบทบาทครูก่อน
              </div>
            ) : (
              <div className="max-h-[120px] overflow-y-auto border border-border rounded-xl divide-y divide-slate-50">
                {users
                  .filter((u) => u.role === "teacher")
                  .map((u) => {
                    const isChecked = subjectTeacherIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                          isChecked ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSubjectTeacherIds([...subjectTeacherIds, u.id]);
                            } else {
                              setSubjectTeacherIds(subjectTeacherIds.filter((id) => id !== u.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 border-border cursor-pointer"
                        />
                        <span
                          className={`text-sm font-semibold ${
                            isChecked ? "text-indigo-700 dark:text-indigo-300" : "text-foreground"
                          }`}
                        >
                          {u.username}
                        </span>
                      </label>
                    );
                  })}
              </div>
            )}
            {subjectTeacherIds.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">สอนรวม:</span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {subjectTeacherIds
                    .map((id) => users.find((u) => u.id === id)?.username)
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Subject Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              ประเภทวิชา
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSubjectType("main")}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                  subjectType === "main"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                    : "bg-muted/50 text-foreground border-border hover:bg-muted"
                }`}
              >
                วิชาหลัก
              </button>
              <button
                type="button"
                onClick={() => setSubjectType("activity")}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                  subjectType === "activity"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                    : "bg-muted/50 text-foreground border-border hover:bg-muted"
                }`}
              >
                วิชากิจกรรม
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {subjectType === "main"
                ? "นับหน่วยกิตและคำนวณเกรด A-F เข้า GPA"
                : "ตัดสินผ่าน/ไม่ผ่าน ไม่นับ GPA"}
            </p>
          </div>

          {/* Has Score Toggle (activity only) */}
          {subjectType === "activity" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <button
                type="button"
                onClick={() => setSubjectHasScore((v) => !v)}
                className={`relative shrink-0 w-10 h-5 rounded-full border-2 transition-all ${
                  subjectHasScore ? "bg-amber-500 border-amber-500" : "bg-border border-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-card shadow transition-all ${
                    subjectHasScore ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
              <div>
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">มีการเก็บคะแนน</div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                  {subjectHasScore
                    ? "กำหนดคะแนนเต็มด้านล่าง · ใช้คะแนนรวมตัดสิน ผ่าน/ไม่ผ่าน"
                    : "ไม่มีช่องกรอกคะแนน · ผ่าน/ไม่ผ่านโดยไม่ใช้คะแนน"}
                </div>
              </div>
            </div>
          )}

          {/* Credit Hours (main subjects only) */}
          {subjectType === "main" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                หน่วยกิต <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={subjectCreditHours}
                onChange={(e) => setSubjectCreditHours(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
              />
            </div>
          )}

          {/* Max Scores Input */}
          {(subjectType !== "activity" || subjectHasScore) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  คะแนนเก็บเต็ม <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={subjectMidtermMax}
                  onChange={(e) => setSubjectMidtermMax(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  คะแนนสอบเต็ม <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={subjectFinalMax}
                  onChange={(e) => setSubjectFinalMax(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                />
              </div>
            </div>
          )}

          {/* Classroom Multi-Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              ชั้นเรียน (เลือกได้หลายห้อง)
            </label>
            {subjectClassrooms.length === 0 ? (
              <div className="text-muted-foreground text-xs py-2">
                ไม่มีชั้นเรียนในเทอมนี้ กรุณาเพิ่มที่เมนู จัดการชั้นเรียน
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-1 max-h-[150px] overflow-y-auto pr-1">
                {subjectClassrooms.map((c) => {
                  const isChecked = subjectClassroomIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl bg-muted/30 hover:bg-muted hover:border-border cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSubjectClassroomIds([...subjectClassroomIds, c.id]);
                          } else {
                            setSubjectClassroomIds(subjectClassroomIds.filter((id) => id !== c.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 border-border cursor-pointer"
                      />
                      <span className="text-xs font-bold text-foreground">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-card border-t border-border flex items-center justify-end gap-2.5 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground hover:text-foreground bg-muted hover:bg-border transition-all cursor-pointer border-0"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onSave}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 text-sm cursor-pointer border-0"
          >
            {subjectModalMode === "add" ? "สร้างวิชา" : "บันทึกการแก้ไข"}
          </button>
        </div>
      </div>
    </div>
  );
}
