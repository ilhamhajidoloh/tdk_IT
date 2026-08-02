import { useState, useEffect } from "react";
import Swal from "sweetalert2";
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
  classrooms?: { id: string; name: string }[];
  token?: string | null;
  onSettingsUpdated?: () => void;
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
  classrooms = [],
  token,
  onSettingsUpdated,
}: SettingsTabProps) {
  const [selectedHighest, setSelectedHighest] = useState(settingsList[0]?.highest_grade_level || "");
  const [selectedRetention, setSelectedRetention] = useState(settingsList[0]?.data_retention_years ?? 5);

  useEffect(() => {
    if (settingsList[0]) {
      setSelectedHighest(settingsList[0]?.highest_grade_level || "");
      setSelectedRetention(settingsList[0]?.data_retention_years ?? 5);
    }
  }, [settingsList]);

  const levelOptions = Array.from(
    new Set(
      classrooms
        .flatMap((c) => {
          if (!c.name) return [];
          const name = c.name.trim();
          const prefix = name.split("/")[0].trim();
          return [prefix, name];
        })
        .filter(Boolean)
    )
  ).sort();

  const handleOpenReleaseModal = async (setting: any) => {
    const isReleasedChecked = setting.is_grade_released !== false ? "checked" : "";
    const releaseDateVal = setting.grade_release_date || "";

    const { value: formValues } = await Swal.fire({
      title: `📢 ตั้งเวลาประกาศผลการเรียน`,
      html: `
        <div class="space-y-4 text-left mt-3">
          <div class="p-3 bg-amber-50/70 dark:bg-amber-500/10 rounded-2xl border border-amber-200/80 dark:border-amber-500/30">
            <div class="text-xs font-extrabold text-amber-900 dark:text-amber-200">
              ปีการศึกษา ${setting.academic_year} · ภาคเรียนที่ (เทอม) ${setting.term}
            </div>
            <div class="text-[11px] text-muted-foreground mt-0.5 font-medium">
              กำหนดสวิตช์เปิด/ปิด หรือระบุเวลานับถอยหลังให้นักเรียนเห็นเกรดเฉพาะเทอมนี้
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-foreground">1. สวิตช์เปิด/ปิดการเห็นเกรด (Manual Toggle)</label>
            <label class="flex items-center gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/40 transition-colors">
              <input id="swal-modal-is-released" type="checkbox" class="w-4 h-4 text-indigo-600 rounded border-border" ${isReleasedChecked}>
              <span class="text-xs font-bold text-foreground">เปิดประกาศผลการเรียนให้นักเรียนเห็นทันที</span>
            </label>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-foreground">2. กำหนดวัน-เวลานับถอยหลังเปิดระบบล่วงหน้า (ถ้ามี)</label>
            <input id="swal-modal-release-date" type="datetime-local" class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-amber-400" value="${releaseDateVal}">
            <p class="text-[11px] text-muted-foreground font-medium">
              💡 หากระบุวัน-เวลาไว้ เกรดจะถูกล็อกและแสดงตัวนับเวลาถอยหลังให้นักเรียนเห็นจนกว่าจะถึงกำหนด
            </p>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึกการตั้งค่า",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-border/50 p-6 shadow-2xl bg-card max-w-md w-full",
        title: "text-xl font-extrabold text-foreground mb-1",
        confirmButton: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md text-xs cursor-pointer mr-3",
        cancelButton: "bg-muted hover:bg-muted text-muted-foreground font-bold px-5 py-2.5 rounded-xl transition-all text-xs cursor-pointer"
      },
      preConfirm: () => {
        const isReleased = (document.getElementById("swal-modal-is-released") as HTMLInputElement).checked;
        const releaseDate = (document.getElementById("swal-modal-release-date") as HTMLInputElement).value;
        return { isReleased, releaseDate };
      }
    });

    if (formValues) {
      setting.is_grade_released = formValues.isReleased;
      setting.grade_release_date = formValues.releaseDate || null;

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(setting),
      });

      if (res.ok) {
        if (onSettingsUpdated) onSettingsUpdated();
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          text: `อัปเดตการประกาศผลการเรียน ปี ${setting.academic_year} เทอม ${setting.term} เรียบร้อยแล้ว`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
      }
    }
  };

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
          className={`p-5 rounded-2xl border flex flex-col gap-2 shadow-sm ${isGradingActive
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

        {/* Data Retention & Storage Policy Card */}
        <div className="p-6 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-500/10 dark:to-violet-500/10 space-y-4">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-base">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>💾 การจัดเก็บข้อมูลและประหยัดพื้นที่ฐานข้อมูล (Data Retention Policy)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="bg-card p-4 rounded-xl border border-border">
              <label className="block text-foreground mb-1.5 font-bold">
                🎓 ชั้นจบการศึกษาของโรงเรียน (Highest Grade Level)
              </label>
              <p className="text-subtle-foreground text-[11px] mb-2 font-normal">
                นักเรียนชั้นนี้เมื่อขึ้นปีการศึกษาใหม่ จะถูกปรับสถานะเป็น "จบการศึกษา" อัตโนมัติ
              </p>
              <select
                value={selectedHighest}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground font-bold cursor-pointer"
                onChange={async (e) => {
                  const newVal = e.target.value;
                  setSelectedHighest(newVal);
                  if (settingsList[0]) {
                    settingsList[0].highest_grade_level = newVal;
                    await fetch("/api/settings", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({ ...settingsList[0], highest_grade_level: newVal }),
                    });
                    if (onSettingsUpdated) onSettingsUpdated();
                  }
                }}
              >
                <option value="">-- เลือกชั้นจบการศึกษา --</option>
                {levelOptions.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border">
              <label className="block text-foreground mb-1.5 font-bold">
                ⏳ ระยะเวลาเก็บข้อมูลการเช็คชื่อ/แชท (Retention Period)
              </label>
              <p className="text-subtle-foreground text-[11px] mb-2 font-normal">
                เมื่อพ้นกำหนด N ปี ระบบจะสรุปเกรดถาวรไว้ และคืนพื้นที่ฐานข้อมูลจากการเช็คชื่อรายวัน
              </p>
              <select
                value={selectedRetention}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground font-bold cursor-pointer"
                onChange={async (e) => {
                  const newVal = Number(e.target.value);
                  setSelectedRetention(newVal);
                  if (settingsList[0]) {
                    settingsList[0].data_retention_years = newVal;
                    await fetch("/api/settings", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({ ...settingsList[0], data_retention_years: newVal }),
                    });
                    if (onSettingsUpdated) onSettingsUpdated();
                  }
                }}
              >
                <option value={3}>3 ปี (ประหยัดพื้นที่สูงสุด)</option>
                <option value={5}>5 ปี (แนะนำมาตรฐาน)</option>
                <option value={10}>10 ปี (จัดเก็บระยะยาว)</option>
                <option value={999}>ไม่ลบข้อมูล (เก็บถาวรตลอดไป)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 dark:border-indigo-500/20 flex-wrap gap-2">
            <span className="text-xs text-subtle-foreground font-medium">
              💡 ข้อมูลเกรดรวมและ Transcript จะถูกสรุปไว้ถาวร สามารถเรียกดูได้ตลอดไปแม้จะคืนพื้นที่เช็คชื่อรายวันแล้ว
            </span>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/admin/retention-cleanup", { method: "POST" });
                  const data = await res.json();
                  if (res.ok) {
                    alert(`✅ ประมวลผลคืนพื้นที่เรียบร้อยแล้ว!\nนักเรียนที่ประมวลผล: ${data.processed_students} คน\nประหยัดพื้นที่ได้ประมาณ: ${data.approx_saved_mb} MB`);
                  } else {
                    alert(`❌ เกิดข้อผิดพลาด: ${data.error}`);
                  }
                } catch {
                  alert("❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer border-0 flex items-center gap-1.5"
            >
              🧹 ประมวลผลล้างข้อมูลเก่าเพื่อคืนพื้นที่
            </button>
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
                <th className="px-6 py-4 font-semibold text-center">📢 ประกาศผลการเรียน</th>
                <th className="px-6 py-4 font-semibold text-center">สถานะ</th>
                <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {settingsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-subtle-foreground font-semibold">
                    ไม่มีข้อมูลปีการศึกษาในระบบ
                  </td>
                </tr>
              ) : (
                settingsList.map((s: any) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isPeriodActive = todayStr >= (s.start_date ?? "") && todayStr <= (s.end_date ?? "");
                  const isWaiting = (s.start_date ?? "") > todayStr;

                  const isReleased = s.is_grade_released !== false;
                  const hasReleaseDate = s.grade_release_date && s.grade_release_date.trim() !== "";
                  const isDateReached = hasReleaseDate ? new Date().getTime() >= new Date(s.grade_release_date).getTime() : false;
                  const isCurrentlyVisibleToStudent = hasReleaseDate ? isDateReached : isReleased;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-muted/50 ${s.is_active ? "bg-indigo-50/20 dark:bg-indigo-500/10" : ""}`}
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
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                            isCurrentlyVisibleToStudent
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : (hasReleaseDate ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300" : "bg-muted text-muted-foreground border-border")
                          }`}>
                            {isCurrentlyVisibleToStudent ? "🟢 เปิดประกาศแล้ว" : (hasReleaseDate ? "⏳ กำลังนับถอยหลัง" : "🔒 ปิดประกาศ")}
                          </span>

                          <button
                            onClick={() => handleOpenReleaseModal(s)}
                            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer border-0 mt-0.5"
                          >
                            <span>⚙️ ตั้งเวลา/เปิด-ปิด</span>
                          </button>

                          {hasReleaseDate && (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {new Date(s.grade_release_date).toLocaleString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} น.
                            </span>
                          )}
                        </div>
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

              const isReleased = s.is_grade_released !== false;
              const hasReleaseDate = s.grade_release_date && s.grade_release_date.trim() !== "";
              const isDateReached = hasReleaseDate ? new Date().getTime() >= new Date(s.grade_release_date).getTime() : false;
              const isCurrentlyVisibleToStudent = hasReleaseDate ? isDateReached : isReleased;

              return (
                <div
                  key={s.id}
                  className={`card-modern p-4 space-y-3 ${s.is_active ? "bg-indigo-50/20 dark:bg-indigo-500/10" : ""}`}
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

                  <div className="pt-2 border-t border-border space-y-1">
                    <div className="text-sm text-foreground font-semibold">
                      {formatThaiDateRange(s.start_date, s.end_date)}
                    </div>
                    <div className="text-[10px] text-subtle-foreground font-semibold">
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
                  </div>

                  {/* Mobile Grade Release Button */}
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-500/10 rounded-xl border border-amber-200/60 dark:border-amber-500/20 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-foreground">📢 ประกาศผลการเรียน:</div>
                      <div className="text-[11px] font-bold mt-0.5">
                        <span className={isCurrentlyVisibleToStudent ? "text-emerald-600" : (hasReleaseDate ? "text-amber-600" : "text-muted-foreground")}>
                          {isCurrentlyVisibleToStudent ? "🟢 เปิดประกาศแล้ว" : (hasReleaseDate ? `⏳ นับถอยหลัง (${new Date(s.grade_release_date).toLocaleString("th-TH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} น.)` : "🔒 ปิดประกาศ")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenReleaseModal(s)}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all border-0 shrink-0 cursor-pointer"
                    >
                      ⚙️ ตั้งเวลา
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => handleEditSetting(s)}
                      className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl transition-colors border-0 cursor-pointer text-center"
                    >
                      แก้ไขข้อมูล
                    </button>
                    {!s.is_active && (
                      <button
                        onClick={() =>
                          handleDeleteSetting(s.id, `ปี ${s.academic_year} เทอม ${s.term}`)
                        }
                        className="py-2 px-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-500 dark:text-red-400 font-bold text-xs rounded-xl transition-colors border-0 cursor-pointer"
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
