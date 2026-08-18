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

type SettingsSubTab = "general" | "translations";

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
  const [subTab, setSubTab] = useState<SettingsSubTab>("general");
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
        confirmButton:
          "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-xs cursor-pointer mr-2",
        cancelButton:
          "bg-muted hover:bg-muted/80 text-muted-foreground font-bold px-5 py-2.5 rounded-xl transition-all text-xs cursor-pointer",
      },
      preConfirm: () => {
        const isReleased = (document.getElementById("swal-modal-is-released") as HTMLInputElement).checked;
        const releaseDate = (document.getElementById("swal-modal-release-date") as HTMLInputElement).value;
        return {
          is_grade_released: isReleased,
          grade_release_date: releaseDate ? new Date(releaseDate).toISOString() : null,
        };
      },
    });

    if (formValues) {
      try {
        const res = await fetch(`/api/system-settings/${setting.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            academic_year: setting.academic_year,
            term: setting.term,
            start_date: setting.start_date,
            end_date: setting.end_date,
            midterm_max_score: setting.midterm_max_score,
            final_max_score: setting.final_max_score,
            is_active: setting.is_active,
            is_grade_released: formValues.is_grade_released,
            grade_release_date: formValues.grade_release_date,
          }),
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "บันทึกสำเร็จ!",
            text: "ตั้งเวลาประกาศผลการเรียนเรียบร้อยแล้ว",
            confirmButtonColor: "#4f46e5",
          });
          if (onSettingsUpdated) onSettingsUpdated();
        } else {
          Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกได้", "error");
        }
      } catch {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกได้", "error");
      }
    }
  };

  return (
    <div className="p-8">
      <SectionHeader
        icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        color="slate"
        title="ตั้งค่าระบบ (Settings)"
        subtitle="จัดการปีการศึกษา กำหนดช่วงเวลากรอกคะแนน และคำแปลภาษาในระบบ"
      >
        {subTab === "general" && (
          <button
            onClick={handleAddSetting}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มปีการศึกษา / เทอม
          </button>
        )}
      </SectionHeader>

      {/* Sub-Tab Navigation */}
      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl border border-border">
        <button
          onClick={() => setSubTab("general")}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            subTab === "general"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          }`}
        >
          ⚙️ ปีการศึกษา & การตั้งค่าระบบ
        </button>
        <button
          onClick={() => setSubTab("translations")}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            subTab === "translations"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          }`}
        >
          🌐 คำแปลภาษาในระบบ (Dictionary)
        </button>
      </div>

      {/* General Settings Sub-Tab */}
      {subTab === "general" && (
        <div className="space-y-6">
          {/* Current Active Period Overview Card */}
          <div className="p-6 bg-gradient-to-r from-indigo-50/80 dark:from-indigo-500/10 to-violet-50/80 dark:to-violet-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/25 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    ภาคเรียนที่เปิดใช้งานปัจจุบัน (Active Term)
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-foreground mt-1">
                  ปีการศึกษา {adminYear || "-"} · ภาคเรียนที่ {adminTerm || "-"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ช่วงเวลากรอกคะแนน:{" "}
                  <span className="font-semibold text-foreground">
                    {startDate && endDate ? formatThaiDateRange(startDate, endDate) : "ยังไม่ได้ระบุ"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                    isGradingActive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isGradingActive ? "bg-emerald-500" : "bg-rose-500"}`}
                  />
                  {isGradingActive ? "อยู่ในช่วงเวลากรอกคะแนน" : "อยู่นอกช่วงเวลากรอกคะแนน"}
                </span>
              </div>
            </div>
          </div>

          {/* Settings List */}
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border animate-fade-in-up">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-bold">ปีการศึกษา / เทอม</th>
                  <th className="px-6 py-4 font-bold">ช่วงเวลากรอกคะแนน</th>
                  <th className="px-6 py-4 font-bold text-center">คะแนนเต็ม (เก็บ/สอบ)</th>
                  <th className="px-6 py-4 font-bold text-center">📢 ประกาศผลการเรียน</th>
                  <th className="px-6 py-4 font-bold text-center">สถานะ</th>
                  <th className="px-6 py-4 font-bold text-center">จัดการ</th>
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
                    const isDateReached = hasReleaseDate
                      ? new Date().getTime() >= new Date(s.grade_release_date).getTime()
                      : false;
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
                            <span
                              className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                                isCurrentlyVisibleToStudent
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                                  : hasReleaseDate
                                  ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {isCurrentlyVisibleToStudent
                                ? "🟢 เปิดประกาศแล้ว"
                                : hasReleaseDate
                                ? "⏳ กำลังนับถอยหลัง"
                                : "🔒 ปิดประกาศ"}
                            </span>

                            <button
                              onClick={() => handleOpenReleaseModal(s)}
                              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer border-0 mt-0.5"
                            >
                              <span>⚙️ ตั้งเวลา/เปิด-ปิด</span>
                            </button>

                            {hasReleaseDate && (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {new Date(s.grade_release_date).toLocaleString("th-TH", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                น.
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
                const isDateReached = hasReleaseDate
                  ? new Date().getTime() >= new Date(s.grade_release_date).getTime()
                  : false;
                const isCurrentlyVisibleToStudent = hasReleaseDate ? isDateReached : isReleased;

                return (
                  <div
                    key={s.id}
                    className={`card-modern p-4 space-y-3 ${
                      s.is_active ? "bg-indigo-50/20 dark:bg-indigo-500/10" : ""
                    }`}
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
                          <span
                            className={
                              isCurrentlyVisibleToStudent
                                ? "text-emerald-600"
                                : hasReleaseDate
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            }
                          >
                            {isCurrentlyVisibleToStudent
                              ? "🟢 เปิดประกาศแล้ว"
                              : hasReleaseDate
                              ? `⏳ นับถอยหลัง (${new Date(s.grade_release_date).toLocaleString("th-TH", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })} น.)`
                              : "🔒 ปิดประกาศ"}
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

          {/* ⚠️ Danger Zone: Request School Deletion */}
          <div className="mt-10 p-6 rounded-2xl border-2 border-red-500/30 bg-red-500/5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-red-600 dark:text-red-400">
                  ⚠️ โซนอันตราย: ส่งคำขอลบโรงเรียน
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  เมื่อส่งคำขอแล้ว Super Admin จะสามารถลบข้อมูลโรงเรียนและข้อมูลทั้งหมดออกจากระบบได้อย่างถาวร
                  กรุณาแน่ใจก่อนดำเนินการ
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const { isConfirmed } = await Swal.fire({
                  title: "ส่งคำขอลบโรงเรียน?",
                  text: "Super Admin จะได้รับแจ้งและสามารถดำเนินการลบข้อมูลโรงเรียนทั้งหมดได้ ต้องการดำเนินการต่อหรือไม่?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "ส่งคำขอลบ",
                  cancelButtonText: "ยกเลิก",
                  confirmButtonColor: "#dc2626",
                });
                if (!isConfirmed) return;
                const res = await fetch("/api/admin/request-deletion", { method: "POST" });
                if (res.ok) {
                  Swal.fire({
                    icon: "success",
                    title: "ส่งคำขอเรียบร้อย",
                    text: "Super Admin จะดำเนินการลบข้อมูลโรงเรียนต่อไป",
                    timer: 2000,
                    showConfirmButton: false,
                  });
                } else {
                  const d = await res.json();
                  Swal.fire("ข้อผิดพลาด", d.error || "ไม่สามารถส่งคำขอได้", "error");
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              ส่งคำขอลบโรงเรียนนี้ออกจากระบบ
            </button>
          </div>
        </div>
      )}

      {/* Translations Sub-Tab (System Dictionary) */}
      {subTab === "translations" && <SystemTranslationsSection token={token} />}
    </div>
  );
}

// ===== System Translations Section (คำแปลคำศัพท์ทั่วไปในระบบ) =====
interface TranslationEntry {
  id: string;
  key: string;
  thai: string;
  malay_rumi: string;
  malay_jawi: string;
}

const DEFAULT_SYSTEM_TERMS = [
  { key: "grade", thai: "เกรด", malay_rumi: "Gred", malay_jawi: "ڬريد" },
  { key: "subject", thai: "วิชา", malay_rumi: "Subjek", malay_jawi: "سوبجيك" },
  { key: "student", thai: "นักเรียน", malay_rumi: "Murid", malay_jawi: "موريد" },
  { key: "teacher", thai: "ครูผู้สอน", malay_rumi: "Guru", malay_jawi: "ڬورو" },
  { key: "classroom", thai: "ชั้นเรียน/ห้อง", malay_rumi: "Kelas", malay_jawi: "كلس" },
  { key: "score", thai: "คะแนน", malay_rumi: "Markah", malay_jawi: "مركه" },
  { key: "midterm", thai: "คะแนนเก็บ", malay_rumi: "Kerja Kursus", malay_jawi: "كرج كورسوس" },
  { key: "final", thai: "คะแนนสอบ", malay_rumi: "Peperiksaan", malay_jawi: "ڤڤريقسان" },
  { key: "total", thai: "รวม", malay_rumi: "Jumlah", malay_jawi: "جومله" },
  { key: "average", thai: "เฉลี่ย", malay_rumi: "Purata", malay_jawi: "ڤوراة" },
  { key: "pass", thai: "ผ่าน", malay_rumi: "Lulus", malay_jawi: "لولوس" },
  { key: "fail", thai: "ไม่ผ่าน", malay_rumi: "Gagal", malay_jawi: "ڬاڬل" },
  { key: "period", thai: "คาบ", malay_rumi: "Waktu", malay_jawi: "وقتو" },
  { key: "break", thai: "พักเบรก", malay_rumi: "Rehat", malay_jawi: "ريحت" },
  { key: "report", thai: "รายงาน", malay_rumi: "Laporan", malay_jawi: "لاڤورن" },
];

function SystemTranslationsSection({ token }: { token?: string | null }) {
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ thai: "", malay_rumi: "", malay_jawi: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const loadTranslations = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/translations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTranslations(data);
      }
    } catch (err) {
      console.error("Failed to load translations", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTranslations();
  }, [token]);

  const handleEdit = (entry: TranslationEntry) => {
    setEditingId(entry.id);
    setEditForm({
      thai: entry.thai,
      malay_rumi: entry.malay_rumi,
      malay_jawi: entry.malay_jawi,
    });
  };

  const handleSave = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/translations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        await loadTranslations();
        setEditingId(null);
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch {
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกได้", "error");
    }
  };

  const handleDelete = async (id: string, keyName: string) => {
    if (!token) return;
    const confirmRes = await Swal.fire({
      title: `ลบคำศัพท์ "${keyName}"?`,
      text: "ต้องการลบคำศัพท์นี้ออกจากระบบคำแปลใช่หรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
    });

    if (confirmRes.isConfirmed) {
      try {
        const res = await fetch(`/api/translations/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          await loadTranslations();
          Swal.fire({
            icon: "success",
            title: "ลบสำเร็จ",
            timer: 1000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire("ข้อผิดพลาด", "ไม่สามารถลบได้", "error");
        }
      } catch {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์", "error");
      }
    }
  };

  const handleAddNew = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มคำศัพท์ระบบใหม่",
      html: `
        <div class="space-y-3 text-left mt-2">
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1">Key (รหัสคำศัพท์ภาษาอังกฤษ) <span class="text-red-500">*</span></label>
            <input id="key" class="w-full px-3 py-2 border border-border bg-card rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400" placeholder="เช่น certificate, passed_with_honors">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1">ภาษาไทย <span class="text-red-500">*</span></label>
            <input id="thai" class="w-full px-3 py-2 border border-border bg-card rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400" placeholder="เช่น เกียรตินิยม">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1">Bahasa Melayu (Rumi)</label>
            <input id="rumi" class="w-full px-3 py-2 border border-border bg-card rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400" placeholder="เช่น Cemerlang">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1">Bahasa Melayu (Jawi)</label>
            <input id="jawi" dir="rtl" class="w-full px-3 py-2 border border-border bg-card rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400" placeholder="เช่น چمرلڠ">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "เพิ่มคำศัพท์",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-border/50 p-6 shadow-2xl bg-card max-w-md w-full",
        title: "text-xl font-extrabold text-foreground mb-1",
        confirmButton:
          "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-xs cursor-pointer mr-2",
        cancelButton:
          "bg-muted hover:bg-muted/80 text-muted-foreground font-bold px-5 py-2.5 rounded-xl transition-all text-xs cursor-pointer",
      },
      preConfirm: () => {
        const key = (document.getElementById("key") as HTMLInputElement).value;
        const thai = (document.getElementById("thai") as HTMLInputElement).value;
        const rumi = (document.getElementById("rumi") as HTMLInputElement).value;
        const jawi = (document.getElementById("jawi") as HTMLInputElement).value;

        if (!key?.trim()) {
          Swal.showValidationMessage("กรุณากรอก Key (รหัสคำศัพท์)");
          return null;
        }
        if (!thai?.trim() && !rumi?.trim() && !jawi?.trim()) {
          Swal.showValidationMessage("กรุณากรอกคำแปลอย่างน้อย 1 ภาษา (ไทย, Rumi หรือ Jawi)");
          return null;
        }
        return { key: key.trim(), thai: thai.trim(), malay_rumi: rumi.trim(), malay_jawi: jawi.trim() };
      },
    });

    if (formValues && token) {
      try {
        const res = await fetch("/api/translations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formValues),
        });

        if (res.ok) {
          await loadTranslations();
          Swal.fire({
            icon: "success",
            title: "เพิ่มคำศัพท์สำเร็จ",
            timer: 1000,
            showConfirmButton: false,
          });
        } else {
          const data = await res.json();
          Swal.fire("ข้อผิดพลาด", data.error || "ไม่สามารถเพิ่มได้", "error");
        }
      } catch {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์", "error");
      }
    }
  };

  const handleInitDefaultTerms = async () => {
    if (!token) return;
    const confirmRes = await Swal.fire({
      title: "นำเข้าคำศัพท์ระบบเริ่มต้น?",
      text: "ระบบจะเพิ่มคำศัพท์พื้นฐาน (เกรด, รายงาน, คาบ, นักเรียน, ครู, สอบ, ฯลฯ) ลงในตาราง",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ตกลง นำเข้า",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
    });

    if (!confirmRes.isConfirmed) return;

    Swal.showLoading();
    for (const term of DEFAULT_SYSTEM_TERMS) {
      await fetch("/api/translations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(term),
      });
    }

    await loadTranslations();
    Swal.fire({
      icon: "success",
      title: "นำเข้าสำเร็จ!",
      text: "เพิ่มคำศัพท์ระบบมาตรฐานเรียบร้อยแล้ว",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-subtle-foreground font-semibold">
        กำลังโหลดข้อมูลคำแปลภาษาในระบบ...
      </div>
    );
  }

  const filtered = translations.filter(
    (t) =>
      t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.thai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.malay_rumi && t.malay_rumi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
        <div>
          <div className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
            🌐 คำแปลภาษาในระบบ (System Terms & UI Words)
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            คำศัพท์ทั่วไปสำหรับเอกสาร ใบ ปพ. ตารางเรียน และข้อความแสดงผลหลายภาษา (ยกเว้นชื่อวิชาเรียน)
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInitDefaultTerms}
            className="px-3.5 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📥 นำเข้าคำศัพท์ระบบเริ่มต้น</span>
          </button>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer border-0 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>เพิ่มคำศัพท์ใหม่</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder="ค้นหา Key หรือคำแปล..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-xs px-3.5 py-2 border border-border bg-card rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <span className="text-xs font-semibold text-muted-foreground">
          ทั้งหมด {filtered.length} คำศัพท์
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-bold">Key (รหัสอ้างอิง)</th>
              <th className="px-4 py-3 font-bold">ภาษาไทย</th>
              <th className="px-4 py-3 font-bold">Bahasa Melayu (Rumi)</th>
              <th className="px-4 py-3 font-bold">Bahasa Melayu (Jawi)</th>
              <th className="px-4 py-3 font-bold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-subtle-foreground font-semibold">
                  ยังไม่มีคำศัพท์ในระบบ กด &quot;นำเข้าคำศัพท์ระบบเริ่มต้น&quot; หรือ &quot;เพิ่มคำศัพท์ใหม่&quot;
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    {entry.key}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editForm.thai}
                        onChange={(e) => setEditForm({ ...editForm, thai: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-indigo-300 dark:border-indigo-500/40 bg-card rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    ) : (
                      <span className="text-foreground font-semibold">{entry.thai}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editForm.malay_rumi}
                        onChange={(e) => setEditForm({ ...editForm, malay_rumi: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-indigo-300 dark:border-indigo-500/40 bg-card rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    ) : (
                      <span className="text-muted-foreground font-medium">{entry.malay_rumi || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        dir="rtl"
                        value={editForm.malay_jawi}
                        onChange={(e) => setEditForm({ ...editForm, malay_jawi: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-indigo-300 dark:border-indigo-500/40 bg-card rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    ) : (
                      <span className="text-muted-foreground font-medium" dir="rtl">
                        {entry.malay_jawi || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === entry.id ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSave(entry.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer shadow-sm"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id, entry.key)}
                          className="px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer"
                        >
                          ลบ
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
