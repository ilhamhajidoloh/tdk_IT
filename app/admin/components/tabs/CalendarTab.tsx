"use client";

import { useState } from "react";
import { CalendarDays, Plus, Pencil, Trash2, Clock, AlertCircle, CalendarCheck2, CalendarOff, ChevronLeft, ChevronRight, List } from "lucide-react";
import Swal from "sweetalert2";
import type { SystemSetting } from "../types";
import { normalizeScheduleDays } from "../../../lib/duty";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  academic_year: string | null;
  school_id: string | null;
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
  { value: "general", label: "ทั่วไป", color: "bg-blue-500" },
  { value: "exam", label: "สอบ", color: "bg-red-500" },
  { value: "holiday", label: "วันหยุด", color: "bg-green-500" },
  { value: "activity", label: "กิจกรรม", color: "bg-purple-500" },
  { value: "meeting", label: "ประชุม", color: "bg-orange-500" },
  { value: "deadline", label: "กำหนดส่ง", color: "bg-amber-500" },
];

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
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("timeline");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const activeSetting = settingsList.find(s => s.id === activeSettingId);
  const currentYear = activeSetting?.academic_year || new Date().getFullYear().toString();
  const yearTermCounts = new Map<string, Set<string>>();
  settingsList.forEach((setting) => {
    const year = String(setting.academic_year);
    const terms = yearTermCounts.get(year) || new Set<string>();
    terms.add(String(setting.term || ""));
    yearTermCounts.set(year, terms);
  });
  events.forEach((event) => {
    if (event.academic_year && !yearTermCounts.has(event.academic_year)) {
      yearTermCounts.set(event.academic_year, new Set<string>());
    }
  });
  if (!yearTermCounts.has(currentYear)) yearTermCounts.set(currentYear, new Set<string>());
  const years = Array.from(yearTermCounts.keys()).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  const displayYear = selectedYear && years.includes(selectedYear) ? selectedYear : currentYear;
  const normalOpenDays = new Set(normalizeScheduleDays(activeSetting?.schedule_days));
  const yearLabel = (year: string) => {
    const termCount = yearTermCounts.get(year)?.size || 0;
    return termCount > 1 ? `${year} (${termCount} เทอม)` : year;
  };

  const filteredEvents = events.filter(event => {
    const matchYear = !event.academic_year || event.academic_year === displayYear;
    const matchType = filterType === "all" || event.event_type === filterType;
    // School-calendar holidays are shown only on normal teaching days.
    // Cook-only holidays live in the duty system and are intentionally not filtered here.
    const eventDay = new Date(`${event.event_date.slice(0, 10)}T00:00:00Z`).getUTCDay();
    const isSchoolHolidayOnClosedDay = event.event_type === "holiday" && !normalOpenDays.has(eventDay);
    return matchYear && matchType && !isSchoolHolidayOnClosedDay;
  });

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
              ${EVENT_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ปีการศึกษา</label>
            <select id="swal-year" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
              ${years.map(year => `<option value="${year}" ${year === currentYear ? "selected" : ""}>${yearLabel(year)}</option>`).join("")}
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
        popup: "rounded-3xl border border-border/50 p-8 shadow-xl bg-card max-w-md w-full",
        title: "text-2xl font-extrabold text-foreground mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-muted hover:bg-muted/80 text-muted-foreground font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const title = (document.getElementById("swal-title") as HTMLInputElement).value;
        const description = (document.getElementById("swal-description") as HTMLTextAreaElement).value;
        const event_date = (document.getElementById("swal-date") as HTMLInputElement).value;
        const dateMode = (document.getElementById("swal-date-mode") as HTMLSelectElement).value;
        const end_date = (document.getElementById("swal-end-date") as HTMLInputElement).value;
        const event_type = (document.getElementById("swal-type") as HTMLSelectElement).value;
        const academic_year = (document.getElementById("swal-year") as HTMLSelectElement).value;

        if (!title || !event_date || (dateMode === "range" && !end_date)) {
          Swal.showValidationMessage("กรุณากรอกหัวข้อและวันที่ให้ครบ");
          return null;
        }

        if (dateMode === "range" && end_date < event_date) {
          Swal.showValidationMessage("วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น");
          return null;
        }

        return { title, description, event_date, end_date: dateMode === "range" ? end_date : null, event_type, academic_year };
      }
    });

    if (formValues) {
      const res = await fetch(`/api/calendar-events${schoolParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formValues),
      });

      if (res.ok) {
        Swal.fire({ icon: "success", title: "สำเร็จ", text: "เพิ่มกำหนดการเรียบร้อยแล้ว", confirmButtonColor: "#4f46e5" });
        onRefresh();
      } else {
        Swal.fire({ icon: "error", title: "ข้อผิดพลาด", text: "ไม่สามารถเพิ่มกำหนดการได้", confirmButtonColor: "#ef4444" });
      }
    }
  };

  const handleEditEvent = async (event: CalendarEvent) => {
    const { value: formValues } = await Swal.fire({
      title: "แก้ไขกำหนดการ",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">หัวข้อ <span class="text-red-500">*</span></label>
            <input id="swal-title" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground" value="${event.title}">
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">รายละเอียด</label>
            <textarea id="swal-description" rows="3" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm text-foreground">${event.description || ""}</textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">วันที่ <span class="text-red-500">*</span></label>
            <input id="swal-date" type="date" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground" value="${event.event_date}">
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
              ${EVENT_TYPES.map(t => `<option value="${t.value}" ${t.value === event.event_type ? "selected" : ""}>${t.label}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">ปีการศึกษา</label>
            <select id="swal-year" class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground">
              ${years.map(year => `<option value="${year}" ${year === event.academic_year ? "selected" : ""}>${yearLabel(year)}</option>`).join("")}
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
        popup: "rounded-3xl border border-border/50 p-8 shadow-xl bg-card max-w-md w-full",
        title: "text-2xl font-extrabold text-foreground mb-4",
        confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-muted hover:bg-muted/80 text-muted-foreground font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const title = (document.getElementById("swal-title") as HTMLInputElement).value;
        const description = (document.getElementById("swal-description") as HTMLTextAreaElement).value;
        const event_date = (document.getElementById("swal-date") as HTMLInputElement).value;
        const dateMode = (document.getElementById("swal-date-mode") as HTMLSelectElement).value;
        const end_date = (document.getElementById("swal-end-date") as HTMLInputElement).value;
        const event_type = (document.getElementById("swal-type") as HTMLSelectElement).value;
        const academic_year = (document.getElementById("swal-year") as HTMLSelectElement).value;

        if (!title || !event_date || (dateMode === "range" && !end_date)) {
          Swal.showValidationMessage("กรุณากรอกหัวข้อและวันที่");
          return null;
        }

        if (dateMode === "range" && end_date < event_date) {
          Swal.showValidationMessage("วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น");
          return null;
        }

        return { title, description, event_date, end_date: dateMode === "range" ? end_date : null, event_type, academic_year };
      }
    });

    if (formValues) {
      const res = await fetch(`/api/calendar-events${schoolParam}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: event.id, ...formValues }),
      });

      if (res.ok) {
        Swal.fire({ icon: "success", title: "สำเร็จ", text: "แก้ไขกำหนดการเรียบร้อยแล้ว", confirmButtonColor: "#4f46e5" });
        onRefresh();
      } else {
        Swal.fire({ icon: "error", title: "ข้อผิดพลาด", text: "ไม่สามารถแก้ไขกำหนดการได้", confirmButtonColor: "#ef4444" });
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
      cancelButtonColor: "#6b7280"
    });

    if (result.isConfirmed) {
      const res = await fetch(`/api/calendar-events?id=${event.id}${schoolParam.replace("?", "&")}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 1200, showConfirmButton: false });
        onRefresh();
      } else {
        Swal.fire({ icon: "error", title: "ไม่สามารถลบได้", confirmButtonColor: "#ef4444" });
      }
    }
  };

  const formatThaiDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  };

  const getEventTypeConfig = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
  };

  const getEventTypeStyle = (type: string) => {
    const styles: Record<string, { badge: string; dot: string }> = {
      general: { badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30", dot: "bg-sky-500" },
      exam: { badge: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30", dot: "bg-rose-500" },
      holiday: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30", dot: "bg-emerald-500" },
      activity: { badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30", dot: "bg-violet-500" },
      meeting: { badge: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30", dot: "bg-amber-500" },
      deadline: { badge: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30", dot: "bg-teal-500" },
    };
    return styles[type] || styles.general;
  };

  const holidayCount = filteredEvents.filter((event) => event.event_type === "holiday").length;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const upcomingCount = filteredEvents.filter((event) => event.event_date.slice(0, 10) >= today).length;
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const aDate = a.event_date.slice(0, 10);
    const bDate = b.event_date.slice(0, 10);
    const aUpcoming = aDate >= today;
    const bUpcoming = bDate >= today;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return aUpcoming ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
  });
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = monthStart.getDay();
  const monthCells = Array.from({ length: Math.ceil((firstWeekday + monthDays) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= monthDays ? day : null;
  });
  const eventsByDay = new Map<string, CalendarEvent[]>();
  filteredEvents.forEach((event) => {
    const key = event.event_date.slice(0, 10);
    eventsByDay.set(key, [...(eventsByDay.get(key) || []), event]);
  });
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="mx-auto w-[calc(100%-2rem)] max-w-[1180px] space-y-4 py-4 sm:w-[calc(100%-3rem)] sm:py-6 lg:w-[calc(100%-4rem)]">
      <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">ปฏิทินประจำปี</h2>
            <p className="mt-1 text-sm text-muted-foreground">จัดการกำหนดการและกิจกรรมต่างๆ ตลอดปีการศึกษา</p>
          </div>
        </div>
        <button onClick={handleAddEvent} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          เพิ่มกำหนดการ
        </button>
      </header>

      <section className="grid grid-cols-2 divide-x divide-border border-b border-border sm:grid-cols-4" aria-label="สรุปปฏิทิน">
        <div className="px-3 py-2.5 first:pl-0">
          <p className="text-xs font-medium text-muted-foreground">ปีการศึกษา</p>
          <p className="mt-1 text-lg font-bold text-foreground">{yearLabel(displayYear)}</p>
        </div>
        <div className="px-3 py-2.5 sm:border-l sm:border-border">
          <p className="text-xs font-medium text-muted-foreground">กำหนดการ</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold text-foreground"><CalendarCheck2 className="h-4 w-4 text-sky-600" />{filteredEvents.length}</p>
        </div>
        <div className="border-t border-border px-3 py-2.5 sm:border-t-0 sm:border-l">
          <p className="text-xs font-medium text-muted-foreground">วันหยุด</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold text-foreground"><CalendarOff className="h-4 w-4 text-emerald-600" />{holidayCount}</p>
        </div>
        <div className="border-t border-border px-3 py-2.5 sm:border-l sm:border-t-0 sm:pr-0">
          <p className="text-xs font-medium text-muted-foreground">กำลังจะมาถึง</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold text-foreground"><Clock className="h-4 w-4 text-amber-600" />{upcomingCount}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between" aria-label="ตัวกรองปฏิทิน">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <label className="block min-w-0 sm:w-40">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">ปีการศึกษา</span>
            <select value={displayYear} onChange={(e) => setSelectedYear(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              {years.map((year) => <option key={year} value={year}>{yearLabel(year)}</option>)}
            </select>
          </label>
          <label className="block min-w-0 sm:w-44">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">ประเภท</span>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              <option value="all">ทั้งหมด</option>
              {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{filteredEvents.length} รายการ</p>
      </section>

      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1" role="tablist" aria-label="มุมมองปฏิทิน">
          <button type="button" role="tab" aria-selected={viewMode === "calendar"} onClick={() => setViewMode("calendar")} className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors cursor-pointer ${viewMode === "calendar" ? "bg-background text-sky-700 shadow-sm dark:text-sky-300" : "text-muted-foreground hover:text-foreground"}`}><CalendarDays className="h-4 w-4" />ปฏิทิน</button>
          <button type="button" role="tab" aria-selected={viewMode === "timeline"} onClick={() => setViewMode("timeline")} className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors cursor-pointer ${viewMode === "timeline" ? "bg-background text-sky-700 shadow-sm dark:text-sky-300" : "text-muted-foreground hover:text-foreground"}`}><List className="h-4 w-4" />Timeline</button>
        </div>
        {viewMode === "calendar" && <div className="flex items-center gap-2"><button type="button" title="เดือนก่อนหน้า" aria-label="เดือนก่อนหน้า" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted cursor-pointer"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-32 text-center text-sm font-bold text-foreground">{calendarMonth.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</span><button type="button" title="เดือนถัดไป" aria-label="เดือนถัดไป" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted cursor-pointer"><ChevronRight className="h-4 w-4" /></button></div>}
      </div>

      {viewMode === "calendar" ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground">{["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => <div key={day} className="py-2">{day}</div>)}</div>
          <div className="grid grid-cols-7">
            {monthCells.map((day, index) => {
              const key = day ? `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const dayEvents = key ? eventsByDay.get(key) || [] : [];
              const isToday = key === todayKey;
              return <div key={`${key}-${index}`} className={`min-h-20 border-b border-r border-border p-1.5 sm:min-h-24 ${day ? "bg-background" : "bg-muted/20"} ${isToday ? "bg-sky-50/80 ring-2 ring-inset ring-sky-500 dark:bg-sky-500/10" : ""}`}>{day && <><div className="flex items-center justify-between"><span className={`text-xs font-semibold ${isToday ? "text-sky-700 dark:text-sky-300" : "text-muted-foreground"}`}>{day}</span>{isToday && <span className="text-[9px] font-bold text-sky-700 dark:text-sky-300">วันนี้</span>}</div><div className="mt-1 space-y-1">{dayEvents.slice(0, 2).map((event) => <div key={event.id} title={event.title} className={`truncate rounded px-1.5 py-1 text-[10px] font-semibold ${getEventTypeStyle(event.event_type).badge}`}>{event.title}</div>)}{dayEvents.length > 2 && <span className="px-1 text-[10px] text-muted-foreground">+{dayEvents.length - 2} รายการ</span>}</div></>}</div>;
            })}
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border bg-muted/20 px-4 py-10 text-center sm:py-12">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="font-semibold text-foreground">ยังไม่มีกำหนดการในปีการศึกษานี้</p>
          <p className="mt-1 text-sm text-muted-foreground">เพิ่มกำหนดการเพื่อแสดงใน timeline</p>
          <button onClick={handleAddEvent} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50 hover:text-sky-900 dark:text-sky-300 dark:hover:bg-sky-500/10 cursor-pointer"><Plus className="h-4 w-4" />เพิ่มกำหนดการ</button>
        </div>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {sortedEvents.map((event) => {
            const typeConfig = getEventTypeConfig(event.event_type);
            const typeStyle = getEventTypeStyle(event.event_type);
            const date = new Date(`${event.event_date.slice(0, 10)}T00:00:00`);
            const isPast = event.event_date.slice(0, 10) < today;
            return (
              <li key={event.id} className={`group flex min-w-0 gap-3 py-4 sm:gap-4 ${isPast ? "opacity-65" : ""}`}>
                <div className="flex w-12 shrink-0 flex-col items-center justify-center self-start rounded-lg border border-border bg-muted/40 py-2 sm:w-14">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{date.toLocaleDateString("th-TH", { month: "short" })}</span>
                  <span className="text-xl font-bold leading-6 text-foreground">{date.toLocaleDateString("th-TH", { day: "numeric" })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="break-words text-sm font-bold text-foreground sm:text-base">{event.title}</h3>
                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${typeStyle.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${typeStyle.dot}`} />{typeConfig.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatThaiDate(event.event_date)}</p>
                  {event.description && <p className="mt-2 whitespace-pre-line break-words text-sm leading-5 text-muted-foreground">{event.description}</p>}
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  <button type="button" title="แก้ไขกิจกรรม" aria-label={`แก้ไข ${event.title}`} onClick={() => handleEditEvent(event)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-500/10 dark:hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" title="ลบกิจกรรม" aria-label={`ลบ ${event.title}`} onClick={() => handleDeleteEvent(event)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
