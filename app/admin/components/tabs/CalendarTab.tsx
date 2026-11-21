"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Clock,
  AlertCircle,
  CalendarCheck2,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  List,
  Search,
  X,
  EyeOff,
} from "lucide-react";
import Swal from "sweetalert2";
import type { SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import PaginationBar, { usePagination } from "../PaginationBar";
import { normalizeScheduleDays } from "../../../lib/duty";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  academic_year: string | null;
  school_id: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
};

type CalendarTabProps = {
  events: CalendarEvent[];
  settingsList: SystemSetting[];
  activeSettingId: number | null;
  onRefresh: () => void;
  token: string | null;
  schoolParam: string;
};

const EVENT_TYPES = [
  { value: "general", label: "ทั่วไป" },
  { value: "exam", label: "สอบ" },
  { value: "holiday", label: "วันหยุด" },
  { value: "activity", label: "กิจกรรม" },
  { value: "meeting", label: "ประชุม" },
  { value: "deadline", label: "กำหนดส่ง" },
];

function escapeHtmlAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getEventTypeConfig(type: string) {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[0];
}

function getEventTypeStyle(type: string) {
  const styles: Record<string, { badge: string; dot: string }> = {
    general: {
      badge:
        "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25",
      dot: "bg-sky-500",
    },
    exam: {
      badge:
        "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25",
      dot: "bg-rose-500",
    },
    holiday: {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
      dot: "bg-emerald-500",
    },
    activity: {
      badge:
        "bg-violet-50 text-violet-700 border-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/25",
      dot: "bg-violet-500",
    },
    meeting: {
      badge:
        "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
      dot: "bg-amber-500",
    },
    deadline: {
      badge:
        "bg-teal-50 text-teal-700 border-teal-200/70 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/25",
      dot: "bg-teal-500",
    },
  };
  return styles[type] || styles.general;
}

export default function CalendarTab({
  events,
  settingsList,
  activeSettingId,
  onRefresh,
  token,
  schoolParam,
}: CalendarTabProps) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("timeline");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [todayKey] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  });

  const activeSetting = settingsList.find((s) => s.id === activeSettingId);
  const currentYear = activeSetting?.academic_year || todayKey.slice(0, 4);

  const { years, yearTermCounts } = useMemo(() => {
    const map = new Map<string, Set<string>>();
    settingsList.forEach((setting) => {
      const year = String(setting.academic_year);
      const terms = map.get(year) || new Set<string>();
      terms.add(String(setting.term || ""));
      map.set(year, terms);
    });
    events.forEach((event) => {
      if (event.academic_year && !map.has(event.academic_year)) {
        map.set(event.academic_year, new Set<string>());
      }
    });
    if (!map.has(currentYear)) map.set(currentYear, new Set<string>());
    const sortedYears = Array.from(map.keys()).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true })
    );
    return { years: sortedYears, yearTermCounts: map };
  }, [settingsList, events, currentYear]);

  const displayYear = selectedYear && years.includes(selectedYear) ? selectedYear : currentYear;

  const yearLabel = (year: string) => {
    const termCount = yearTermCounts.get(year)?.size || 0;
    return termCount > 1 ? `ปี ${year} (${termCount} เทอม)` : `ปี ${year}`;
  };

  const normalOpenDays = useMemo(
    () => new Set(normalizeScheduleDays(activeSetting?.schedule_days)),
    [activeSetting?.schedule_days]
  );

  const yearEvents = useMemo(() => {
    return events.filter((event) => {
      const matchYear = !event.academic_year || event.academic_year === displayYear;
      const eventDay = new Date(`${event.event_date.slice(0, 10)}T00:00:00Z`).getUTCDay();
      const isSchoolHolidayOnClosedDay =
        event.event_type === "holiday" && !normalOpenDays.has(eventDay);
      return matchYear && !isSchoolHolidayOnClosedDay;
    });
  }, [events, displayYear, normalOpenDays]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return yearEvents.filter((event) => {
      const matchType = filterType === "all" || event.event_type === filterType;
      if (!matchType) return false;
      if (!q) return true;
      return (
        event.title.toLowerCase().includes(q) ||
        (event.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [yearEvents, filterType, searchQuery]);

  const holidayCount = useMemo(
    () => yearEvents.filter((event) => event.event_type === "holiday").length,
    [yearEvents]
  );
  const upcomingCount = useMemo(
    () => yearEvents.filter((event) => event.event_date.slice(0, 10) >= todayKey).length,
    [yearEvents, todayKey]
  );

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const aDate = a.event_date.slice(0, 10);
      const bDate = b.event_date.slice(0, 10);
      const aUpcoming = aDate >= todayKey;
      const bUpcoming = bDate >= todayKey;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return aUpcoming ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
    });
  }, [filteredEvents, todayKey]);

  const timelinePagination = usePagination(sortedEvents, 5);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((event) => {
      const key = event.event_date.slice(0, 10);
      map.set(key, [...(map.get(key) || []), event]);
    });
    return map;
  }, [filteredEvents]);

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthDays = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate();
  const firstWeekday = monthStart.getDay();
  const monthCells = Array.from(
    { length: Math.ceil((firstWeekday + monthDays) / 7) * 7 },
    (_, index) => {
      const day = index - firstWeekday + 1;
      return day > 0 && day <= monthDays ? day : null;
    }
  );

  const formatThaiDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  };

  const handleAddEvent = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มกำหนดการใหม่",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">หัวข้อ <span class="text-red-500">*</span></label>
            <input id="swal-title" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground" placeholder="เช่น วันเปิดเทอม, สอบกลางภาค">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">รายละเอียด</label>
            <textarea id="swal-description" rows="3" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm text-foreground" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">วันที่ <span class="text-red-500">*</span></label>
            <input id="swal-date" type="date" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">รูปแบบกำหนดการ</label>
            <select id="swal-date-mode" class="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm font-semibold text-foreground">
              <option value="single">วันเดียว</option><option value="range">หลายวัน</option>
            </select>
          </div>
          <div id="swal-end-date-wrap" style="display:none">
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">วันสิ้นสุด <span class="text-red-500">*</span></label>
            <input id="swal-end-date" type="date" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ประเภท</label>
            <select id="swal-type" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
              ${EVENT_TYPES.map((t) => `<option value="${t.value}">${t.label}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">แสดงให้</label>
            <select id="swal-visibility" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
              <option value="all">ทุกคน (ครู, นักเรียน, ผู้ปกครอง)</option>
              <option value="teacher_only">เฉพาะครู</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ปีการศึกษา</label>
            <select id="swal-year" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
              ${years.map((year) => `<option value="${year}" ${year === displayYear ? "selected" : ""}>${yearLabel(year)}</option>`).join("")}
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      didOpen: () => {
        document.getElementById("swal-date-mode")?.addEventListener("change", (event) => {
          const isRange = (event.target as HTMLSelectElement).value === "range";
          const endWrap = document.getElementById("swal-end-date-wrap");
          if (endWrap) endWrap.style.display = isRange ? "block" : "none";
        });
      },
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-border/50 p-6 sm:p-8 shadow-xl bg-card max-w-md w-[92vw] sm:w-full",
        title: "text-xl font-extrabold text-foreground mb-4",
        confirmButton:
          "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton:
          "bg-muted hover:bg-muted/80 text-muted-foreground font-bold px-6 py-2.5 rounded-xl transition-all text-sm cursor-pointer",
      },
      preConfirm: () => {
        const title = (document.getElementById("swal-title") as HTMLInputElement).value;
        const description = (document.getElementById("swal-description") as HTMLTextAreaElement).value;
        const event_date = (document.getElementById("swal-date") as HTMLInputElement).value;
        const dateMode = (document.getElementById("swal-date-mode") as HTMLSelectElement).value;
        const end_date = (document.getElementById("swal-end-date") as HTMLInputElement).value;
        const event_type = (document.getElementById("swal-type") as HTMLSelectElement).value;
        const visibility = (document.getElementById("swal-visibility") as HTMLSelectElement).value;
        const academic_year = (document.getElementById("swal-year") as HTMLSelectElement).value;

        if (!title || !event_date || (dateMode === "range" && !end_date)) {
          Swal.showValidationMessage("กรุณากรอกหัวข้อและวันที่ให้ครบ");
          return null;
        }
        if (dateMode === "range" && end_date < event_date) {
          Swal.showValidationMessage("วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น");
          return null;
        }

        return {
          title,
          description,
          event_date,
          end_date: dateMode === "range" ? end_date : null,
          event_type,
          visibility,
          academic_year,
        };
      },
    });

    if (formValues) {
      const res = await fetch(`/api/calendar-events${schoolParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formValues),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "เพิ่มกำหนดการเรียบร้อยแล้ว",
          confirmButtonColor: "#4f46e5",
        });
        onRefresh();
      } else {
        Swal.fire({
          icon: "error",
          title: "ข้อผิดพลาด",
          text: "ไม่สามารถเพิ่มกำหนดการได้",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  const handleEditEvent = async (event: CalendarEvent) => {
    const safeTitle = escapeHtmlAttr(event.title);
    const safeDesc = escapeHtmlAttr(event.description || "");
    const { value: formValues } = await Swal.fire({
      title: "แก้ไขกำหนดการ",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">หัวข้อ <span class="text-red-500">*</span></label>
            <input id="swal-title" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground" value="${safeTitle}">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">รายละเอียด</label>
            <textarea id="swal-description" rows="3" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm text-foreground">${safeDesc}</textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">วันที่ <span class="text-red-500">*</span></label>
            <input id="swal-date" type="date" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground" value="${event.event_date.slice(0, 10)}">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">รูปแบบกำหนดการ</label>
            <select id="swal-date-mode" class="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm font-semibold text-foreground">
              <option value="single">วันเดียว</option><option value="range">หลายวัน</option>
            </select>
          </div>
          <div id="swal-end-date-wrap" style="display:none">
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">วันสิ้นสุด <span class="text-red-500">*</span></label>
            <input id="swal-end-date" type="date" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ประเภท</label>
            <select id="swal-type" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
              ${EVENT_TYPES.map((t) => `<option value="${t.value}" ${t.value === event.event_type ? "selected" : ""}>${t.label}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">แสดงให้</label>
            <select id="swal-visibility" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
              <option value="all" ${event.visibility === "all" ? "selected" : ""}>ทุกคน (ครู, นักเรียน, ผู้ปกครอง)</option>
              <option value="teacher_only" ${event.visibility === "teacher_only" ? "selected" : ""}>เฉพาะครู</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ปีการศึกษา</label>
            <select id="swal-year" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
              ${years.map((year) => `<option value="${year}" ${year === event.academic_year ? "selected" : ""}>${yearLabel(year)}</option>`).join("")}
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      didOpen: () => {
        document.getElementById("swal-date-mode")?.addEventListener("change", (changeEvent) => {
          const isRange = (changeEvent.target as HTMLSelectElement).value === "range";
          const endWrap = document.getElementById("swal-end-date-wrap");
          if (endWrap) endWrap.style.display = isRange ? "block" : "none";
        });
      },
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-border/50 p-6 sm:p-8 shadow-xl bg-card max-w-md w-[92vw] sm:w-full",
        title: "text-xl font-extrabold text-foreground mb-4",
        confirmButton:
          "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton:
          "bg-muted hover:bg-muted/80 text-muted-foreground font-bold px-6 py-2.5 rounded-xl transition-all text-sm cursor-pointer",
      },
      preConfirm: () => {
        const title = (document.getElementById("swal-title") as HTMLInputElement).value;
        const description = (document.getElementById("swal-description") as HTMLTextAreaElement).value;
        const event_date = (document.getElementById("swal-date") as HTMLInputElement).value;
        const dateMode = (document.getElementById("swal-date-mode") as HTMLSelectElement).value;
        const end_date = (document.getElementById("swal-end-date") as HTMLInputElement).value;
        const event_type = (document.getElementById("swal-type") as HTMLSelectElement).value;
        const visibility = (document.getElementById("swal-visibility") as HTMLSelectElement).value;
        const academic_year = (document.getElementById("swal-year") as HTMLSelectElement).value;

        if (!title || !event_date || (dateMode === "range" && !end_date)) {
          Swal.showValidationMessage("กรุณากรอกหัวข้อและวันที่");
          return null;
        }
        if (dateMode === "range" && end_date < event_date) {
          Swal.showValidationMessage("วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น");
          return null;
        }

        return {
          title,
          description,
          event_date,
          end_date: dateMode === "range" ? end_date : null,
          event_type,
          visibility,
          academic_year,
        };
      },
    });

    if (formValues) {
      const res = await fetch(`/api/calendar-events${schoolParam}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: event.id, ...formValues }),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "แก้ไขกำหนดการเรียบร้อยแล้ว",
          confirmButtonColor: "#4f46e5",
        });
        onRefresh();
      } else {
        Swal.fire({
          icon: "error",
          title: "ข้อผิดพลาด",
          text: "ไม่สามารถแก้ไขกำหนดการได้",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: `คุณต้องการลบกำหนดการ "${event.title}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      const res = await fetch(
        `/api/calendar-events?id=${event.id}${schoolParam.replace("?", "&")}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 1200, showConfirmButton: false });
        onRefresh();
      } else {
        Swal.fire({ icon: "error", title: "ไม่สามารถลบได้", confirmButtonColor: "#ef4444" });
      }
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-5 animate-fade-in-up">
      <SectionHeader
        icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        color="blue"
        title="ปฏิทินประจำปี"
        subtitle="จัดการกำหนดการ วันสอบ วันหยุด และกิจกรรมตลอดปีการศึกษา"
        count={filteredEvents.length}
        countLabel="รายการ"
      >
        <button
          type="button"
          onClick={handleAddEvent}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 border-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มกำหนดการ</span>
        </button>
      </SectionHeader>

      {/* Compact Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">กำหนดการทั้งหมด</div>
            <div className="text-lg font-extrabold text-foreground tabular-nums">
              {yearEvents.length}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">กำลังจะมาถึง</div>
            <div className="text-lg font-extrabold text-foreground tabular-nums">
              {upcomingCount}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CalendarOff className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">วันหยุด</div>
            <div className="text-lg font-extrabold text-foreground tabular-nums">
              {holidayCount}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Filter & View Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Year Select */}
          <div className="relative w-full sm:w-44">
            <select
              aria-label="เลือกปีการศึกษา"
              value={displayYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2 bg-card border border-border rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {yearLabel(year)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Type Select */}
          <div className="relative w-full sm:w-36">
            <select
              aria-label="กรองประเภทกำหนดการ"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2 bg-card border border-border rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer"
            >
              <option value="all">ทุกประเภท</option>
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหากำหนดการ..."
              className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="ล้างคำค้นหา"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground border-0 bg-transparent cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div
          className="inline-flex items-center p-1 rounded-xl bg-muted border border-border"
          role="tablist"
          aria-label="มุมมองปฏิทิน"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "timeline"}
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
              viewMode === "timeline"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>รายการ</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "calendar"}
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
              viewMode === "calendar"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>ปฏิทิน</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "calendar" ? (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Calendar Month Bar */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-bold text-foreground">
              {calendarMonth.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCalendarMonth(new Date())}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-card border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                วันนี้
              </button>
              <button
                type="button"
                title="เดือนก่อนหน้า"
                aria-label="เดือนก่อนหน้า"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                  )
                }
                className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="เดือนถัดไป"
                aria-label="เดือนถัดไป"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                  )
                }
                className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-bold text-muted-foreground">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7">
            {monthCells.map((day, index) => {
              const key = day
                ? `${calendarMonth.getFullYear()}-${String(
                    calendarMonth.getMonth() + 1
                  ).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                : "";
              const dayEvents = key ? eventsByDay.get(key) || [] : [];
              const isToday = key === todayKey;

              return (
                <div
                  key={`${key}-${index}`}
                  className={`min-h-20 sm:min-h-24 border-b border-r border-border/70 p-1.5 ${
                    day ? "bg-card" : "bg-muted/25"
                  } ${isToday ? "bg-indigo-50/50 dark:bg-indigo-500/10" : ""}`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold tabular-nums ${
                            isToday
                              ? "bg-indigo-600 text-white font-bold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {day}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => handleEditEvent(event)}
                            title={`${event.title} (คลิกเพื่อแก้ไข)`}
                            className={`w-full text-left truncate rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-80 cursor-pointer ${
                              getEventTypeStyle(event.event_type).badge
                            }`}
                          >
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="block px-1 text-[10px] font-semibold text-muted-foreground">
                            +{dayEvents.length - 2} เพิ่มเติม
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
          <AlertCircle className="w-8 h-8 mx-auto mb-2.5 opacity-40" />
          <div className="text-sm font-semibold text-foreground">
            {searchQuery || filterType !== "all"
              ? "ไม่พบกำหนดการที่ตรงกับเงื่อนไข"
              : "ยังไม่มีกำหนดการในปีการศึกษานี้"}
          </div>
          {searchQuery || filterType !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
              className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer border-0 bg-transparent"
            >
              ล้างตัวกรอง
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddEvent}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มกำหนดการแรก
            </button>
          )}
        </div>
      ) : (
        <>
        <ol className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
          {timelinePagination.paginatedItems.map((event) => {
            const typeConfig = getEventTypeConfig(event.event_type);
            const typeStyle = getEventTypeStyle(event.event_type);
            const date = new Date(`${event.event_date.slice(0, 10)}T00:00:00`);
            const isPast = event.event_date.slice(0, 10) < todayKey;
            const isTeacherOnly = event.visibility === "teacher_only";

            return (
              <li
                key={event.id}
                className={`flex min-w-0 items-start gap-3.5 px-4 py-3.5 hover:bg-muted/35 transition-colors ${
                  isPast ? "opacity-60" : ""
                }`}
              >
                <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-muted/50 py-1.5 tabular-nums">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {date.toLocaleDateString("th-TH", { month: "short" })}
                  </span>
                  <span className="text-lg font-extrabold leading-5 text-foreground">
                    {date.toLocaleDateString("th-TH", { day: "numeric" })}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-sm font-bold text-foreground">
                      {event.title}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${typeStyle.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${typeStyle.dot}`} />
                      {typeConfig.label}
                    </span>
                    {isTeacherOnly && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        <EyeOff className="w-3 h-3" />
                        เฉพาะครู
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatThaiDate(event.event_date)}
                  </p>
                  {event.description && (
                    <p className="mt-1.5 whitespace-pre-line break-words text-xs leading-5 text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="แก้ไขกำหนดการ"
                    aria-label={`แก้ไข ${event.title}`}
                    onClick={() => handleEditEvent(event)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-muted transition-colors border-0 bg-transparent cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="ลบกำหนดการ"
                    aria-label={`ลบ ${event.title}`}
                    onClick={() => handleDeleteEvent(event)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-0 bg-transparent cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        <PaginationBar
          totalItems={timelinePagination.totalItems}
          currentPage={timelinePagination.currentPage}
          totalPages={timelinePagination.totalPages}
          perPage={timelinePagination.perPage}
          onPageChange={timelinePagination.setCurrentPage}
          onPerPageChange={timelinePagination.setPerPage}
          unitLabel="รายการ"
        />
        </>
      )}
    </div>
  );
}
