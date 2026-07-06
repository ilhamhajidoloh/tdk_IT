import { type SystemSetting } from "../types";

interface CopyClassroomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settingsList: SystemSetting[];
  copySourceSettingId: string | number | null;
  setCopySourceSettingId: (id: string | number | null) => void;
  copyTargetSettingId: string | number | null;
  setCopyTargetSettingId: (id: string | number | null) => void;
  sourceClassrooms: { id: string; name: string }[];
  copyClassroomsMap: Record<string, { selected: boolean; newName: string; moveStudents: boolean }>;
  setCopyClassroomsMap: React.Dispatch<
    React.SetStateAction<Record<string, { selected: boolean; newName: string; moveStudents: boolean }>>
  >;
  onSave: () => void;
}

export default function CopyClassroomsModal({
  isOpen,
  onClose,
  settingsList,
  copySourceSettingId,
  setCopySourceSettingId,
  copyTargetSettingId,
  setCopyTargetSettingId,
  sourceClassrooms,
  copyClassroomsMap,
  setCopyClassroomsMap,
  onSave,
}: CopyClassroomsModalProps) {
  if (!isOpen) return null;

  const selectedCount = sourceClassrooms.filter((c) => copyClassroomsMap[c.id]?.selected).length;

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
            <h3 className="text-xl font-extrabold text-foreground">คัดลอกชั้นเรียนและเลื่อนชั้น</h3>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              ดึงข้อมูลชั้นเรียนและนักเรียนจากเทอมอื่นมายังเทอมเป้าหมาย
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
            {/* Source Term */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                1. เทอมต้นทาง (ที่ต้องการคัดลอก)
              </label>
              <select
                value={copySourceSettingId?.toString() || ""}
                onChange={(e) => setCopySourceSettingId(e.target.value || null)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-semibold text-foreground"
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
                      disabled={s.id?.toString() === copyTargetSettingId?.toString()}
                    >
                      ปี {s.academic_year} เทอม {s.term} {status}
                    </option>
                  );
                })}
              </select>
            </div>
            {/* Target Term */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">2. เทอมปลายทาง (เป้าหมาย)</label>
              <select
                value={copyTargetSettingId?.toString() || ""}
                onChange={(e) => setCopyTargetSettingId(e.target.value || null)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-semibold text-foreground"
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
                      disabled={s.id?.toString() === copySourceSettingId?.toString()}
                    >
                      ปี {s.academic_year} เทอม {s.term} {status}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {copySourceSettingId && sourceClassrooms.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                3. เลือกชั้นเรียนที่ต้องการคัดลอก
              </label>
              {/* Desktop Table */}
              <div className="hidden md:block border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left bg-card">
                  <thead className="bg-muted text-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-center w-16">คัดลอก</th>
                      <th className="px-4 py-3 font-semibold">ชื่อชั้นเรียนเดิม</th>
                      <th className="px-4 py-3 font-semibold">ชื่อชั้นเรียนใหม่ (แก้ไขได้)</th>
                      <th className="px-4 py-3 font-semibold text-center">ย้ายนักเรียนมาด้วย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sourceClassrooms.map((c) => {
                      const m = copyClassroomsMap[c.id];
                      if (!m) return null;
                      return (
                        <tr
                          key={c.id}
                          className={m.selected ? "bg-indigo-50/20 dark:bg-indigo-500/10" : "bg-muted/50"}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={m.selected}
                              onChange={(e) =>
                                setCopyClassroomsMap((prev) => ({
                                  ...prev,
                                  [c.id]: { ...prev[c.id], selected: e.target.checked },
                                }))
                              }
                              className="w-5 h-5 text-indigo-600 dark:text-indigo-400 rounded border-border focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-bold text-foreground">{c.name}</td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={m.newName}
                              onChange={(e) =>
                                setCopyClassroomsMap((prev) => ({
                                  ...prev,
                                  [c.id]: { ...prev[c.id], newName: e.target.value },
                                }))
                              }
                              disabled={!m.selected}
                              className="w-full px-3 py-2 rounded-lg border border-border disabled:bg-muted disabled:text-muted-foreground focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-foreground transition-all"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={m.moveStudents}
                              disabled={!m.selected}
                              onChange={(e) =>
                                setCopyClassroomsMap((prev) => ({
                                  ...prev,
                                  [c.id]: { ...prev[c.id], moveStudents: e.target.checked },
                                }))
                              }
                              className="w-5 h-5 text-emerald-600 dark:text-emerald-400 rounded border-border focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {sourceClassrooms.map((c) => {
                  const m = copyClassroomsMap[c.id];
                  if (!m) return null;
                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border border-border transition-colors ${
                        m.selected
                          ? "bg-indigo-50/20 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30"
                          : "bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={m.selected}
                            onChange={(e) =>
                              setCopyClassroomsMap((prev) => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], selected: e.target.checked },
                              }))
                            }
                            className="w-5 h-5 text-indigo-600 dark:text-indigo-400 rounded border-border focus:ring-indigo-500"
                          />
                          <span className="font-bold text-foreground text-sm">{c.name}</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={m.moveStudents}
                            disabled={!m.selected}
                            onChange={(e) =>
                              setCopyClassroomsMap((prev) => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], moveStudents: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 text-emerald-600 dark:text-emerald-400 rounded border-border focus:ring-emerald-500 disabled:opacity-50"
                          />
                          ย้ายนักเรียนมาด้วย
                        </label>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-subtle-foreground mb-1">
                          ชื่อชั้นเรียนใหม่
                        </label>
                        <input
                          type="text"
                          value={m.newName}
                          onChange={(e) =>
                            setCopyClassroomsMap((prev) => ({
                              ...prev,
                              [c.id]: { ...prev[c.id], newName: e.target.value },
                            }))
                          }
                          disabled={!m.selected}
                          className="w-full px-3 py-1.5 rounded-lg border border-border disabled:bg-muted disabled:text-muted-foreground focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-semibold text-foreground bg-card"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {copySourceSettingId && sourceClassrooms.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-semibold bg-muted rounded-xl border border-dashed border-border">
              ไม่มีชั้นเรียนในเทอมต้นทางนี้
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
            disabled={!copySourceSettingId || !copyTargetSettingId || selectedCount === 0}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-md cursor-pointer flex items-center gap-2"
          >
            บันทึกการคัดลอก
          </button>
        </div>
      </div>
    </div>
  );
}
