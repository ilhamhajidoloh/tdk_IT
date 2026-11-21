"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Calendar,
  CalendarDays,
  Languages,
  PenTool,
  Pencil,
  Trash2,
  Check,
  Search,
  X,
  Download,
  Megaphone,
  Clock,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { type SystemSetting } from "../types";
import { formatThaiDateRange } from "../../../lib/format";
import SectionHeader from "../SectionHeader";
import PaginationBar, { usePagination } from "../PaginationBar";
import PermissionGate from "@/app/components/PermissionGate";
import TermSignaturesSection from "./TermSignaturesSection";

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
  schoolId?: string;
  onSettingsUpdated?: () => void;
}

type SettingsSubTab = "general" | "translations" | "signatures";

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  token,
  schoolId,
  onSettingsUpdated,
}: SettingsTabProps) {
  const [subTab, setSubTab] = useState<SettingsSubTab>("general");
  const [nowMs] = useState(() => Date.now());
  const settingsPagination = usePagination(settingsList, 5);

  const handleAttendanceWeeks = async () => {
    const years = Array.from(new Set(settingsList.map((setting) => String(setting.academic_year))));
    if (years.length === 0) {
      Swal.fire("ยังไม่มีปีการศึกษา", "กรุณาเพิ่มปีการศึกษาก่อนตั้งจำนวนสัปดาห์", "info");
      return;
    }
    const options = years.map((year) => `<option value="${year}">${year}</option>`).join("");
    const { value } = await Swal.fire({
      title: "กำหนดจำนวนสัปดาห์การมาเรียน",
      html: `<div class="text-left space-y-3 mt-3">
        <div><label class="block text-xs font-bold mb-1.5">ปีการศึกษา</label><select id="swal-weeks-year" class="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm">${options}</select></div>
        <div><label class="block text-xs font-bold mb-1.5">จำนวนสัปดาห์ทั้งหมดของปีการศึกษา</label><input id="swal-weeks-value" type="number" min="1" value="${settingsList.find((s) => String(s.academic_year) === years[0])?.attendance_total_weeks || 40}" class="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm" /></div>
        <p class="text-[11px] text-muted-foreground">ค่านี้ใช้ร่วมกันทั้งเทอม 1 และเทอม 2 ของปีการศึกษาที่เลือก</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      preConfirm: () => {
        const year = (document.getElementById("swal-weeks-year") as HTMLSelectElement).value;
        const weeks = Number((document.getElementById("swal-weeks-value") as HTMLInputElement).value);
        if (!Number.isInteger(weeks) || weeks < 1) {
          Swal.showValidationMessage("กรุณาระบุจำนวนสัปดาห์ตั้งแต่ 1 ขึ้นไป");
          return null;
        }
        return { year, weeks };
      },
    });
    if (!value) return;
    const setting = settingsList.find((s) => String(s.academic_year) === value.year);
    if (!setting) return;
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id: setting.id,
        academic_year: setting.academic_year,
        term: setting.term,
        start_date: setting.start_date,
        end_date: setting.end_date,
        academic_head: setting.academic_head,
        midterm_max_score: setting.midterm_max_score,
        final_max_score: setting.final_max_score,
        schedule_days: setting.schedule_days,
        highest_grade_level: setting.highest_grade_level,
        data_retention_years: setting.data_retention_years,
        auto_cleanup_enabled: setting.auto_cleanup_enabled,
        is_grade_released: setting.is_grade_released,
        grade_release_date: setting.grade_release_date,
        is_ranking_released: setting.is_ranking_released,
        attendance_total_weeks: value.weeks,
      }),
    });
    if (!response.ok) {
      Swal.fire("บันทึกไม่สำเร็จ", "ไม่สามารถบันทึกจำนวนสัปดาห์ได้", "error");
      return;
    }
    Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1200, showConfirmButton: false });
    onSettingsUpdated?.();
  };

  const handleOpenReleaseModal = async (setting: SystemSetting) => {
    const isReleasedChecked = setting.is_grade_released !== false ? "checked" : "";
    const isRankingReleasedChecked = setting.is_ranking_released === true ? "checked" : "";
    const releaseDateVal = toDateTimeLocalValue(setting.grade_release_date);

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

          <div class="space-y-2 pt-2 border-t border-border">
            <label class="block text-xs font-bold text-foreground">3. การแสดงอันดับ (แยกจากผลการเรียน)</label>
            <label class="flex items-center gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/40 transition-colors">
              <input id="swal-modal-is-ranking-released" type="checkbox" class="w-4 h-4 text-violet-600 rounded border-border" ${isRankingReleasedChecked}>
              <span class="text-xs font-bold text-foreground">แสดงอันดับในหน้า “ผลการเรียน” ของนักเรียน</span>
            </label>
            <p class="text-[11px] text-muted-foreground font-medium">เปิดหรือปิดได้โดยไม่กระทบการประกาศเกรด</p>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึกการตั้งค่า",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup:
          "rounded-3xl border border-border/50 p-4 sm:p-6 shadow-2xl bg-card max-w-md w-[92vw] sm:w-full",
        title: "text-lg sm:text-xl font-extrabold text-foreground mb-1",
        confirmButton:
          "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-xs cursor-pointer mr-2",
        cancelButton:
          "bg-muted hover:bg-muted/80 text-muted-foreground font-bold px-5 py-2.5 rounded-xl transition-all text-xs cursor-pointer",
      },
      preConfirm: () => {
        const isReleased = (document.getElementById("swal-modal-is-released") as HTMLInputElement)
          .checked;
        const isRankingReleased = (
          document.getElementById("swal-modal-is-ranking-released") as HTMLInputElement
        ).checked;
        const releaseDate = (document.getElementById("swal-modal-release-date") as HTMLInputElement)
          .value;
        return {
          is_grade_released: isReleased,
          grade_release_date: releaseDate ? new Date(releaseDate).toISOString() : null,
          is_ranking_released: isRankingReleased,
        };
      },
    });

    if (formValues) {
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: setting.id,
            academic_year: setting.academic_year,
            term: setting.term,
            start_date: setting.start_date,
            end_date: setting.end_date,
            academic_head: setting.academic_head,
            midterm_max_score: setting.midterm_max_score,
            final_max_score: setting.final_max_score,
            schedule_days: setting.schedule_days,
            highest_grade_level: setting.highest_grade_level,
            data_retention_years: setting.data_retention_years,
            auto_cleanup_enabled: setting.auto_cleanup_enabled,
            is_grade_released: formValues.is_grade_released,
            grade_release_date: formValues.grade_release_date,
            is_ranking_released: formValues.is_ranking_released,
            attendance_total_weeks: setting.attendance_total_weeks,
          }),
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "บันทึกสำเร็จ!",
            text: "ตั้งเวลาประกาศผลการเรียนเรียบร้อยแล้ว",
            confirmButtonColor: "#4f46e5",
          });
          onSettingsUpdated?.();
        } else {
          Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกได้", "error");
        }
      } catch {
        Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกได้", "error");
      }
    }
  };

  const todayStr = new Date(nowMs).toISOString().split("T")[0];

  const getSettingMeta = (s: SystemSetting) => {
    const isPeriodActive = todayStr >= (s.start_date ?? "") && todayStr <= (s.end_date ?? "");
    const isWaiting = (s.start_date ?? "") > todayStr;
    const isReleased = s.is_grade_released !== false;
    const hasReleaseDate = Boolean(s.grade_release_date && s.grade_release_date.trim() !== "");
    const isDateReached =
      hasReleaseDate && s.grade_release_date
        ? nowMs >= new Date(s.grade_release_date).getTime()
        : false;
    const isCurrentlyVisible = hasReleaseDate ? isDateReached : isReleased;
    const formattedReleaseDate =
      hasReleaseDate && s.grade_release_date
        ? new Date(s.grade_release_date).toLocaleString("th-TH", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;

    return {
      isPeriodActive,
      isWaiting,
      hasReleaseDate,
      isCurrentlyVisible,
      formattedReleaseDate,
    };
  };

  const renderTermStatusBadge = (s: SystemSetting, isWaiting: boolean) => {
    if (s.is_active) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/25 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          กำลังใช้งาน
        </span>
      );
    }
    if (isWaiting) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25 shrink-0">
          รอเปิดใช้งาน
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground shrink-0">
        สิ้นสุดแล้ว
      </span>
    );
  };

  const renderReleaseButton = (s: SystemSetting) => {
    const { isCurrentlyVisible, hasReleaseDate, formattedReleaseDate } = getSettingMeta(s);
    if (isCurrentlyVisible) {
      return (
        <button
          type="button"
          onClick={() => handleOpenReleaseModal(s)}
          title="คลิกเพื่อตั้งค่าการประกาศผล"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/25 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors cursor-pointer"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>เปิดประกาศแล้ว</span>
        </button>
      );
    }
    if (hasReleaseDate) {
      return (
        <button
          type="button"
          onClick={() => handleOpenReleaseModal(s)}
          title="คลิกเพื่อตั้งค่าการประกาศผล"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25 hover:bg-amber-100 dark:hover:bg-amber-500/25 transition-colors cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>นับถอยหลัง · {formattedReleaseDate} น.</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleOpenReleaseModal(s)}
        title="คลิกเพื่อตั้งค่าการประกาศผล"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>ปิดประกาศ</span>
      </button>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-5">
      <SectionHeader
        icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        color="slate"
        title="ตั้งค่าระบบ"
        subtitle="จัดการปีการศึกษา ช่วงเวลากรอกคะแนน คำแปลภาษา และลายเซ็นประจำภาคเรียน"
      >
        {subTab === "general" && (
          <PermissionGate permission="settings.academic_year">
            <button
              type="button"
              onClick={handleAttendanceWeeks}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-border bg-card hover:bg-muted text-foreground shadow-sm transition-all cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span>สัปดาห์มาเรียน</span>
            </button>
            <button
              type="button"
              onClick={handleAddSetting}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 border-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มปีการศึกษา</span>
            </button>
          </PermissionGate>
        )}
      </SectionHeader>

      {/* Sub-Tab Navigation */}
      <div className="inline-flex w-full sm:w-auto gap-1 p-1 bg-muted rounded-xl border border-border overflow-x-auto">
        {(
          [
            { key: "general", label: "ปีการศึกษา", icon: Calendar },
            { key: "translations", label: "คำแปลภาษา", icon: Languages },
            { key: "signatures", label: "ลายเซ็นประจำเทอม", icon: PenTool },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSubTab(tab.key)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer border-0 ${
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* General Settings Sub-Tab */}
      {subTab === "general" && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Active Term Summary Card */}
          <div className="p-4 sm:p-5 bg-card rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ภาคเรียนที่ใช้งานปัจจุบัน</span>
              </div>
              <div className="text-lg font-extrabold text-foreground">
                ปีการศึกษา {adminYear || "-"} · เทอม {adminTerm || "-"}
              </div>
              <div className="text-xs text-muted-foreground">
                ช่วงเวลากรอกคะแนน:{" "}
                <span className="font-semibold text-foreground">
                  {startDate && endDate ? formatThaiDateRange(startDate, endDate) : "ยังไม่ได้ระบุ"}
                </span>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold self-start sm:self-center shrink-0 border ${
                isGradingActive
                  ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/25"
                  : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/25"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isGradingActive ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {isGradingActive ? "เปิดกรอกคะแนนอยู่" : "นอกช่วงเวลากรอกคะแนน"}
            </span>
          </div>

          {/* Desktop Table */}
          {settingsList.length === 0 ? (
            <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
              ยังไม่มีข้อมูลปีการศึกษาในระบบ
            </div>
          ) : (
            <>
              <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                      <th className="py-3 px-4">ปีการศึกษา / เทอม</th>
                      <th className="py-3 px-4">ช่วงเวลากรอกคะแนน</th>
                      <th className="py-3 px-4 text-center w-32">คะแนนเต็ม</th>
                      <th className="py-3 px-4 text-center">ประกาศผลการเรียน</th>
                      <th className="py-3 px-4 text-right w-32">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {settingsPagination.paginatedItems.map((s) => {
                      const { isPeriodActive, isWaiting } = getSettingMeta(s);
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-muted/40 transition-colors ${
                            s.is_active ? "bg-indigo-50/20 dark:bg-indigo-500/5" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-foreground">
                                ปี {s.academic_year} · เทอม {s.term}
                              </span>
                              {renderTermStatusBadge(s, isWaiting)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-sm font-medium text-foreground">
                              {formatThaiDateRange(s.start_date, s.end_date)}
                            </div>
                            <div className="text-[11px] mt-0.5 font-semibold">
                              {isPeriodActive ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  อยู่ในช่วงกรอกคะแนน
                                </span>
                              ) : (
                                <span className="text-subtle-foreground">นอกช่วงกรอกคะแนน</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-foreground tabular-nums">
                            {s.midterm_max_score ?? 50} / {s.final_max_score ?? 50}
                          </td>
                          <td className="py-3.5 px-4 text-center">{renderReleaseButton(s)}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <PermissionGate permission="settings.edit">
                                <button
                                  type="button"
                                  onClick={() => handleEditSetting(s)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  แก้ไข
                                </button>
                              </PermissionGate>
                              {!s.is_active && (
                                <PermissionGate permission="settings.academic_year">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteSetting(
                                        String(s.id),
                                        `ปี ${s.academic_year} เทอม ${s.term}`
                                      )
                                    }
                                    title="ลบปีการศึกษา"
                                    aria-label={`ลบปี ${s.academic_year} เทอม ${s.term}`}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-0 bg-transparent cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </PermissionGate>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-2.5">
                {settingsPagination.paginatedItems.map((s) => {
                  const { isPeriodActive, isWaiting } = getSettingMeta(s);
                  return (
                    <div
                      key={s.id}
                      className={`bg-card rounded-2xl border p-3.5 space-y-3 ${
                        s.is_active
                          ? "border-indigo-300/80 dark:border-indigo-500/40"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-foreground">
                            ปีการศึกษา {s.academic_year} · เทอม {s.term}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatThaiDateRange(s.start_date, s.end_date)}
                          </div>
                        </div>
                        {renderTermStatusBadge(s, isWaiting)}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            isPeriodActive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-subtle-foreground"
                          }`}
                        >
                          {isPeriodActive ? "อยู่ในช่วงกรอกคะแนน" : "นอกช่วงกรอกคะแนน"}
                        </span>
                        <span className="text-muted-foreground font-semibold tabular-nums">
                          เต็ม {s.midterm_max_score ?? 50}/{s.final_max_score ?? 50}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border">
                        {renderReleaseButton(s)}

                        <div className="flex items-center gap-1.5">
                          <PermissionGate permission="settings.edit">
                            <button
                              type="button"
                              onClick={() => handleEditSetting(s)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              แก้ไข
                            </button>
                          </PermissionGate>
                          {!s.is_active && (
                            <PermissionGate permission="settings.academic_year">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteSetting(
                                    String(s.id),
                                    `ปี ${s.academic_year} เทอม ${s.term}`
                                  )
                                }
                                aria-label={`ลบปี ${s.academic_year} เทอม ${s.term}`}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-0 bg-transparent cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <PaginationBar
                totalItems={settingsPagination.totalItems}
                currentPage={settingsPagination.currentPage}
                totalPages={settingsPagination.totalPages}
                perPage={settingsPagination.perPage}
                onPageChange={settingsPagination.setCurrentPage}
                onPerPageChange={settingsPagination.setPerPage}
                unitLabel="รายการ"
              />
            </>
          )}

          {/* Danger Zone: Request School Deletion */}
          <PermissionGate requireFullAdmin>
            <div className="mt-6 p-4 rounded-2xl border border-red-200/80 dark:border-red-500/25 bg-red-50/40 dark:bg-red-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-700 dark:text-red-400">
                    ส่งคำขอลบโรงเรียนออกจากระบบ
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    เมื่อส่งคำขอแล้ว Super Admin จะสามารถลบข้อมูลโรงเรียนและข้อมูลทั้งหมดได้อย่างถาวร
                  </p>
                </div>
              </div>
              <button
                type="button"
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
                className="w-full sm:w-auto shrink-0 py-2 px-4 rounded-xl border border-red-300 dark:border-red-500/40 bg-card hover:bg-red-600 hover:text-white hover:border-red-600 text-red-600 dark:text-red-400 font-semibold text-xs transition-colors cursor-pointer"
              >
                ส่งคำขอลบโรงเรียน
              </button>
            </div>
          </PermissionGate>
        </div>
      )}

      {/* Translations Sub-Tab (System Dictionary) */}
      {subTab === "translations" && <SystemTranslationsSection token={token} />}

      {/* Term Signatures Sub-Tab */}
      {subTab === "signatures" && (
        <TermSignaturesSection
          settingsList={settingsList}
          token={token}
          schoolId={schoolId}
          onSettingsUpdated={onSettingsUpdated}
        />
      )}
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
  { key: "subject", thai: "วิชา", malay_rumi: "Subjek", malay_jawi: "ڤلاجران" },
  { key: "student", thai: "นักเรียน", malay_rumi: "Murid", malay_jawi: "موريد" },
  { key: "teacher", thai: "ครูผู้สอน", malay_rumi: "Guru", malay_jawi: "ڬورو" },
  { key: "classroom", thai: "ชั้นเรียน/ห้อง", malay_rumi: "Kelas", malay_jawi: "كلس" },
  { key: "score", thai: "คะแนน", malay_rumi: "Markah", malay_jawi: "مركه" },
  { key: "midterm", thai: "คะแนนเก็บ", malay_rumi: "Kerja Kursus", malay_jawi: "مركة كڬياتن" },
  { key: "final", thai: "คะแนนสอบ", malay_rumi: "Peperiksaan", malay_jawi: "مركة ففريقسأن" },
  { key: "total", thai: "รวม", malay_rumi: "Jumlah", malay_jawi: "مركة سموا" },
  { key: "average", thai: "เฉลี่ย", malay_rumi: "Purata", malay_jawi: "ڤوراة" },
  { key: "pass", thai: "ผ่าน", malay_rumi: "Lulus", malay_jawi: "لولوس" },
  { key: "fail", thai: "ไม่ผ่าน", malay_rumi: "Gagal", malay_jawi: "ڬاڬل" },
  { key: "period", thai: "คาบ", malay_rumi: "Waktu", malay_jawi: "وقتو" },
  { key: "break", thai: "พักเบรก", malay_rumi: "Rehat", malay_jawi: "ريحت" },
  { key: "report", thai: "รายงาน", malay_rumi: "Laporan", malay_jawi: "لاڤورن" },
];

function SystemTranslationsSection({ token }: { token?: string | null }) {
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ thai: "", malay_rumi: "", malay_jawi: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTranslations = async (authToken: string): Promise<TranslationEntry[] | null> => {
    try {
      const res = await fetch("/api/translations", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error("Failed to load translations", err);
    }
    return null;
  };

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchTranslations(token).then((data) => {
      if (!active) return;
      if (data) setTranslations(data);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token]);

  const reloadTranslations = async () => {
    if (!token) return;
    const data = await fetchTranslations(token);
    if (data) setTranslations(data);
  };

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
        await reloadTranslations();
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
          await reloadTranslations();
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
        return {
          key: key.trim(),
          thai: thai.trim(),
          malay_rumi: rumi.trim(),
          malay_jawi: jawi.trim(),
        };
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
          await reloadTranslations();
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

    await reloadTranslations();
    Swal.fire({
      icon: "success",
      title: "นำเข้าสำเร็จ!",
      text: "เพิ่มคำศัพท์ระบบมาตรฐานเรียบร้อยแล้ว",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const filtered = translations.filter(
    (t) =>
      t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.thai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.malay_rumi && t.malay_rumi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const transPagination = usePagination(filtered, 5);

  if (isLoading) {
    return (
      <div className="text-center py-14 text-subtle-foreground text-sm font-semibold">
        กำลังโหลดข้อมูลคำแปลภาษาในระบบ...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหา Key หรือคำแปล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="ล้างคำค้นหา"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {filtered.length} คำศัพท์
          </span>
        </div>

        <PermissionGate permission="settings.translations">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleInitDefaultTerms}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>นำเข้าค่าเริ่มต้น</span>
            </button>
            <button
              type="button"
              onClick={handleAddNew}
              className="flex-1 sm:flex-initial justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer border-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มคำศัพท์</span>
            </button>
          </div>
        </PermissionGate>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
              <th className="py-3 px-4">Key</th>
              <th className="py-3 px-4">ภาษาไทย</th>
              <th className="py-3 px-4">Rumi</th>
              <th className="py-3 px-4">Jawi</th>
              <th className="py-3 px-4 text-right w-32">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-subtle-foreground text-sm font-semibold">
                  ยังไม่มีคำศัพท์ในระบบ กด &quot;นำเข้าค่าเริ่มต้น&quot; หรือ &quot;เพิ่มคำศัพท์&quot;
                </td>
              </tr>
            ) : (
              transPagination.paginatedItems.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    {entry.key}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editForm.thai}
                        onChange={(e) => setEditForm({ ...editForm, thai: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-indigo-300 dark:border-indigo-500/40 bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <span className="text-foreground font-medium">{entry.thai}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editForm.malay_rumi}
                        onChange={(e) => setEditForm({ ...editForm, malay_rumi: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-indigo-300 dark:border-indigo-500/40 bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    ) : (
                      <span className="text-muted-foreground">{entry.malay_rumi || "—"}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        dir="rtl"
                        value={editForm.malay_jawi}
                        onChange={(e) => setEditForm({ ...editForm, malay_jawi: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-indigo-300 dark:border-indigo-500/40 bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 text-right"
                      />
                    ) : (
                      <span className="text-muted-foreground" dir="rtl">
                        {entry.malay_jawi || "—"}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingId === entry.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSave(entry.id)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors border-0 cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-lg text-xs font-semibold transition-colors border-0 cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <PermissionGate permission="settings.translations">
                          <button
                            type="button"
                            onClick={() => handleEdit(entry)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id, entry.key)}
                            aria-label={`ลบคำศัพท์ ${entry.key}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-0 bg-transparent cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
            ยังไม่มีคำศัพท์ในระบบ
          </div>
        ) : (
          transPagination.paginatedItems.map((entry) => {
            const isEditing = editingId === entry.id;
            return (
              <div
                key={entry.id}
                className="p-3.5 rounded-2xl border border-border bg-card space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-indigo-600 dark:text-indigo-400">
                    {entry.key}
                  </span>

                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <PermissionGate permission="settings.translations">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors cursor-pointer"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id, entry.key)}
                          aria-label={`ลบคำศัพท์ ${entry.key}`}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-0 bg-transparent cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </PermissionGate>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        ภาษาไทย
                      </label>
                      <input
                        type="text"
                        value={editForm.thai}
                        onChange={(e) => setEditForm({ ...editForm, thai: e.target.value })}
                        className="w-full px-3 py-1.5 border border-border bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Rumi
                      </label>
                      <input
                        type="text"
                        value={editForm.malay_rumi}
                        onChange={(e) => setEditForm({ ...editForm, malay_rumi: e.target.value })}
                        className="w-full px-3 py-1.5 border border-border bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Jawi
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={editForm.malay_jawi}
                        onChange={(e) => setEditForm({ ...editForm, malay_jawi: e.target.value })}
                        className="w-full px-3 py-1.5 border border-border bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 text-right"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSave(entry.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors border-0 cursor-pointer"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-semibold transition-colors border-0 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 pt-2 border-t border-border text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">ไทย</span>
                      <span className="font-semibold text-foreground text-right">
                        {entry.thai || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Rumi</span>
                      <span className="text-muted-foreground text-right">
                        {entry.malay_rumi || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Jawi</span>
                      <span className="text-foreground text-right" dir="rtl">
                        {entry.malay_jawi || "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <PaginationBar
        totalItems={transPagination.totalItems}
        currentPage={transPagination.currentPage}
        totalPages={transPagination.totalPages}
        perPage={transPagination.perPage}
        onPageChange={transPagination.setCurrentPage}
        onPerPageChange={transPagination.setPerPage}
        unitLabel="คำศัพท์"
      />
    </div>
  );
}
