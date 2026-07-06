import { type SystemSetting } from "../types";
import { formatThaiDateRange } from "../../../lib/format";
import SectionHeader from "../SectionHeader";

interface SettingsTabProps {
  settingsList: SystemSetting[];
  isGradingActive: boolean;
  adminYear: string | number;
  adminTerm: string | number;
  startDate: string;
  endDate: string;
  handleAddSetting: () => void;
  handleEditSetting: (setting: SystemSetting) => void;
  handleDeleteSetting: (id: string, name: string) => void;
}

export default function SettingsTab({
  settingsList,
  isGradingActive,
  adminYear,
  adminTerm,
  startDate,
  endDate,
  handleAddSetting,
  handleEditSetting,
  handleDeleteSetting,
}: SettingsTabProps) {
  return (
    <div className="p-8 animate-fade-in-up">
      <SectionHeader
        icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
        color="slate"
        title="ตั้งค่าระบบ"
        subtitle="กำหนดปีการศึกษา เทอม และช่วงเวลาการบันทึกคะแนนในระบบทั้งหมด"
        count={new Set(settingsList.map((s: any) => s.academic_year)).size}
        countLabel="ปีการศึกษา"
      >
        <button
          onClick={handleAddSetting}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มปีการศึกษาใหม่
        </button>
      </SectionHeader>

      <div className="space-y-6">
        {/* Status Banner */}
        <div
          className={`p-5 rounded-2xl border flex flex-col gap-2 shadow-sm ${
            isGradingActive
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-base">
            {isGradingActive ? (
              <>
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>🟢 สถานะระบบปัจจุบัน: เปิดการกรอกคะแนน (Active)</span>
              </>
            ) : (
              <>
                <span className="flex h-3 w-3 rounded-full bg-rose-500 shrink-0" />
                <span>🔴 สถานะระบบปัจจุบัน: ปิดการกรอกคะแนน (Expired/Inactive)</span>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground/90 space-y-1 mt-1.5 font-medium">
            <div>
              <span className="font-bold text-foreground">ปีการศึกษาปัจจุบัน:</span> {adminYear}
            </div>
            <div>
              <span className="font-bold text-foreground">เทอมปัจจุบัน:</span> {adminTerm}
            </div>
            <div>
              <span className="font-bold text-foreground">ช่วงเวลาทำงานปัจจุบัน:</span>{" "}
              {formatThaiDateRange(startDate, endDate)}
            </div>
          </div>
        </div>

        {/* Settings List */}
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-border animate-fade-in-up">
          <table className="w-full text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold font-bold">ปีการศึกษา / เทอม</th>
                <th className="px-6 py-4 font-semibold">ช่วงเวลากรอกคะแนน</th>
                <th className="px-6 py-4 font-semibold text-center">คะแนนเต็ม (เก็บ/สอบ)</th>
                <th className="px-6 py-4 font-semibold text-center">สถานะ</th>
                <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {settingsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-subtle-foreground font-semibold">
                    ไม่มีข้อมูลปีการศึกษาในระบบ
                  </td>
                </tr>
              ) : (
                settingsList.map((s: any) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isPeriodActive = todayStr >= (s.start_date ?? "") && todayStr <= (s.end_date ?? "");
                  const isWaiting = (s.start_date ?? "") > todayStr;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-muted/50 ${
                        s.is_active ? "bg-indigo-50/20 dark:bg-indigo-500/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">ปีการศึกษา {s.academic_year}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                          ภาคเรียนที่ (เทอม) {s.term}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground font-semibold">
                          {formatThaiDateRange(s.start_date, s.end_date)}
                        </div>
                        <div className="text-[10px] text-subtle-foreground font-semibold mt-0.5">
                          {isPeriodActive ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ● กำลังอยู่ในช่วงเวลากรอกคะแนน
                            </span>
                          ) : (
                            <span className="text-rose-500 dark:text-rose-400 font-bold">
                              ● อยู่นอกช่วงเวลากรอกคะแนน
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                        {s.midterm_max_score ?? 50} / {s.final_max_score ?? 50}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            กำลังใช้งาน (ปัจจุบัน)
                          </span>
                        ) : isWaiting ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            รอเปิดใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                            สิ้นสุดแล้ว
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditSetting(s)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            แก้ไข
                          </button>
                          {!s.is_active && (
                            <button
                              onClick={() =>
                                handleDeleteSetting(s.id, `ปี ${s.academic_year} เทอม ${s.term}`)
                              }
                              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                            >
                              ลบ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 animate-fade-in-up">
          {settingsList.length === 0 ? (
            <div className="text-center py-8 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
              ไม่มีข้อมูลปีการศึกษาในระบบ
            </div>
          ) : (
            settingsList.map((s: any) => {
              const todayStr = new Date().toISOString().split("T")[0];
              const isPeriodActive = todayStr >= (s.start_date ?? "") && todayStr <= (s.end_date ?? "");
              const isWaiting = (s.start_date ?? "") > todayStr;

              return (
                <div
                  key={s.id}
                  className={`card-modern p-4 ${s.is_active ? "bg-indigo-50/20 dark:bg-indigo-500/10" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-foreground">ปีการศึกษา {s.academic_year}</div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                        ภาคเรียนที่ (เทอม) {s.term}
                      </div>
                    </div>
                    {s.is_active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        กำลังใช้งาน
                      </span>
                    ) : isWaiting ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 shrink-0">
                        รอเปิดใช้งาน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border shrink-0">
                        สิ้นสุดแล้ว
                      </span>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="text-sm text-foreground font-semibold">
                      {formatThaiDateRange(s.start_date, s.end_date)}
                    </div>
                    <div className="text-[10px] text-subtle-foreground font-semibold mt-0.5">
                      {isPeriodActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ● กำลังอยู่ในช่วงเวลากรอกคะแนน
                        </span>
                      ) : (
                        <span className="text-rose-500 dark:text-rose-400 font-bold">
                          ● อยู่นอกช่วงเวลากรอกคะแนน
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold mt-1.5">
                      คะแนนเต็ม: เก็บ {s.midterm_max_score ?? 50} / สอบ {s.final_max_score ?? 50}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => handleEditSetting(s)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                    >
                      แก้ไข
                    </button>
                    {!s.is_active && (
                      <button
                        onClick={() => handleDeleteSetting(s.id, `ปี ${s.academic_year} เทอม ${s.term}`)}
                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
