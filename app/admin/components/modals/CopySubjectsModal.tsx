import { type DBSubject, type SystemSetting } from "../types";

interface CopySubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settingsList: SystemSetting[];
  copySubjectsSourceId: string | number | null;
  setCopySubjectsSourceId: (id: string | number | null) => void;
  copySubjectsTargetId: string | number | null;
  setCopySubjectsTargetId: (id: string | number | null) => void;
  sourceSubjects: DBSubject[];
  copySubjectsSelected: Record<string, boolean>;
  setCopySubjectsSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onSave: () => void;
}

export default function CopySubjectsModal({
  isOpen,
  onClose,
  settingsList,
  copySubjectsSourceId,
  setCopySubjectsSourceId,
  copySubjectsTargetId,
  setCopySubjectsTargetId,
  sourceSubjects,
  copySubjectsSelected,
  setCopySubjectsSelected,
  onSave,
}: CopySubjectsModalProps) {
  if (!isOpen) return null;

  const selectedCount = sourceSubjects.filter((s) => copySubjectsSelected[s.id]).length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] my-auto flex flex-col border border-border animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-card">
          <div>
            <h3 className="text-xl font-extrabold text-foreground">คัดลอกวิชาเรียนไปยังเทอมอื่น</h3>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              ดึงชื่อวิชา ชั้นเรียน และครูจากเทอมต้นทางมายังเทอมเป้าหมาย
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                1. เทอมต้นทาง (ที่ต้องการคัดลอก)
              </label>
              <select
                value={copySubjectsSourceId?.toString() || ""}
                onChange={(e) => setCopySubjectsSourceId(e.target.value || null)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-amber-400 outline-none text-sm font-semibold text-foreground"
              >
                <option value="">-- เลือกเทอมต้นทาง --</option>
                {settingsList.map((s) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isWaiting = (s.start_date ?? "") > todayStr;
                  const status = s.is_active ? "(ปัจจุบัน)" : isWaiting ? "(รอเปิดใช้งาน)" : "(สิ้นสุดแล้ว)";
                  return (
                    <option
                      key={s.id}
                      value={s.id?.toString()}
                      disabled={s.id?.toString() === copySubjectsTargetId?.toString()}
                    >
                      ปี {s.academic_year} เทอม {s.term} {status}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">2. เทอมปลายทาง (เป้าหมาย)</label>
              <select
                value={copySubjectsTargetId?.toString() || ""}
                onChange={(e) => setCopySubjectsTargetId(e.target.value || null)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-amber-400 outline-none text-sm font-semibold text-foreground"
              >
                <option value="">-- เลือกเทอมปลายทาง --</option>
                {settingsList.map((s) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isWaiting = (s.start_date ?? "") > todayStr;
                  const status = s.is_active ? "(ปัจจุบัน)" : isWaiting ? "(รอเปิดใช้งาน)" : "(สิ้นสุดแล้ว)";
                  return (
                    <option
                      key={s.id}
                      value={s.id?.toString()}
                      disabled={s.id?.toString() === copySubjectsSourceId?.toString()}
                    >
                      ปี {s.academic_year} เทอม {s.term} {status}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {copySubjectsSourceId && sourceSubjects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-foreground">
                  3. เลือกวิชาเรียนที่ต้องการคัดลอก
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCopySubjectsSelected(Object.fromEntries(sourceSubjects.map((s) => [s.id, true])))}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer border-0 bg-transparent"
                  >
                    เลือกทั้งหมด
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    onClick={() => setCopySubjectsSelected(Object.fromEntries(sourceSubjects.map((s) => [s.id, false])))}
                    className="text-xs font-semibold text-muted-foreground hover:underline cursor-pointer border-0 bg-transparent"
                  >
                    ยกเลิกทั้งหมด
                  </button>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left bg-card">
                  <thead className="bg-muted text-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-center w-14">คัดลอก</th>
                      <th className="px-4 py-3 font-semibold">ชื่อวิชา</th>
                      <th className="px-4 py-3 font-semibold">ครูผู้สอน</th>
                      <th className="px-4 py-3 font-semibold">ชั้นเรียน</th>
                      <th className="px-4 py-3 font-semibold text-center">ประเภท</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sourceSubjects.map((s) => (
                      <tr
                        key={s.id}
                        className={
                          copySubjectsSelected[s.id] ? "bg-amber-50/30 dark:bg-amber-500/10" : "bg-muted/30"
                        }
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!copySubjectsSelected[s.id]}
                            onChange={(e) =>
                              setCopySubjectsSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))
                            }
                            className="w-5 h-5 text-amber-600 rounded border-border focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">{s.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {s.teacher_names?.join(", ") || s.teacher_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {s.classroom_names?.join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              s.subject_type === "activity"
                                ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                : "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                            }`}
                          >
                            {s.subject_type === "activity" ? "วิชากิจกรรม" : "วิชาหลัก"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {sourceSubjects.map((s) => (
                  <div
                    key={s.id}
                    className={`p-4 rounded-xl border border-border transition-colors ${
                      copySubjectsSelected[s.id]
                        ? "bg-amber-50/30 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30"
                        : "bg-card"
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!copySubjectsSelected[s.id]}
                        onChange={(e) =>
                          setCopySubjectsSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))
                        }
                        className="mt-0.5 w-5 h-5 text-amber-600 rounded border-border focus:ring-amber-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground text-sm">{s.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ครู: {s.teacher_names?.join(", ") || s.teacher_name || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ชั้น: {s.classroom_names?.join(", ") || "-"}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
                          s.subject_type === "activity"
                            ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                        }`}
                      >
                        {s.subject_type === "activity" ? "กิจกรรม" : "วิชาหลัก"}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {copySubjectsSourceId && sourceSubjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-semibold bg-muted rounded-xl border border-dashed border-border">
              ไม่มีวิชาเรียนในเทอมต้นทางนี้
            </div>
          )}

          {copySubjectsSourceId && copySubjectsTargetId && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-sm text-amber-700 dark:text-amber-300 font-medium">
              ⚠️ ชั้นเรียนจะถูกจับคู่โดยอัตโนมัติ (จับคู่จากชื่อชั้นเรียนในเทอมปลายทาง)
              หากชั้นเรียนในเทอมปลายทางไม่มีชื่อเดียวกัน ชั้นเรียนนั้นจะไม่ถูกเชื่อม (แต่ยังคัดลอกวิชาได้)
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-border bg-card flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground bg-card border border-border hover:bg-muted transition-colors shadow-sm cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={onSave}
            disabled={!copySubjectsSourceId || !copySubjectsTargetId || selectedCount === 0}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md cursor-pointer flex items-center gap-2"
          >
            คัดลอกวิชา ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
