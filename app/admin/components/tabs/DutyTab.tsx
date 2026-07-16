"use client";

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import SectionHeader from "../SectionHeader";
import { formatThaiDate } from "../../../lib/format";
import { buildCookSchedule } from "../../../lib/duty";

interface DutyTabProps {
  token: string | null;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
}

interface TeacherOption {
  id: string;
  username: string;
}

interface TeacherGroup {
  id: string;
  name: string;
  order_no: number;
  members: TeacherOption[];
}

interface CookItem {
  id: string;
  name: string;
}

interface CookGroup {
  id: string;
  name: string;
  order_no: number;
  members: CookItem[];
}

interface DutySettingsData {
  teacher_anchor_date: string;
  cook_anchor_date: string;
  teacher_anchor_offset?: number;
  cook_anchor_offset?: number;
}

interface HolidayItem {
  id: string;
  date: string;
  reason: string;
  is_published: boolean;
  created_at: string;
  applies_to?: 'all' | 'teachers' | 'cooks';
}

type DutySubTab = "news" | "teachers" | "cooks" | "settings";

const SUB_TABS: { key: DutySubTab; label: string }[] = [
  { key: "news", label: "ข่าวสาร" },
  { key: "teachers", label: "เวรครู" },
  { key: "cooks", label: "เวรแม่ครัว" },
  { key: "settings", label: "ตั้งค่าการหมุนเวร" },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-foreground placeholder-gray-400 shadow-sm";
const labelClass = "block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider";
const swalPopupClasses = {
  popup: "rounded-3xl border border-border/50 p-8 shadow-xl bg-card max-w-md w-full",
  title: "text-2xl font-extrabold text-foreground mb-4",
  confirmButton: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
  cancelButton: "bg-muted hover:bg-muted text-muted-foreground font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer",
};

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-xs text-subtle-foreground">ยังไม่มีสมาชิก</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((n) => (
        <span key={n} className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
          {n}
        </span>
      ))}
    </div>
  );
}

export default function DutyTab({ token }: DutyTabProps) {
  const [subTab, setSubTab] = useState<DutySubTab>("news");

  const [news, setNews] = useState<NewsItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [teacherGroups, setTeacherGroups] = useState<TeacherGroup[]>([]);
  const [cooks, setCooks] = useState<CookItem[]>([]);
  const [cookGroups, setCookGroups] = useState<CookGroup[]>([]);
  const [dutySettings, setDutySettings] = useState<DutySettingsData | null>(null);
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(true);

  // States for bulk deleting cooks
  const [isMultiDeleteMode, setIsMultiDeleteMode] = useState(false);
  const [selectedCookIds, setSelectedCookIds] = useState<Set<string>>(new Set());

  const authHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [newsRes, teachersRes, teacherGroupsRes, cooksRes, cookGroupsRes, dutySettingsRes, holidaysRes, settingsRes] = await Promise.all([
        fetch("/api/news", { headers: authHeaders() }),
        fetch("/api/public/teachers"),
        fetch("/api/teacher-duty-groups", { headers: authHeaders() }),
        fetch("/api/cooks", { headers: authHeaders() }),
        fetch("/api/cook-duty-groups", { headers: authHeaders() }),
        fetch("/api/duty-settings", { headers: authHeaders() }),
        fetch("/api/holidays", { headers: authHeaders() }),
        fetch("/api/settings", { headers: authHeaders() }),
      ]);
      if (newsRes.ok) setNews(await newsRes.json());
      if (teachersRes.ok) setTeachers(await teachersRes.json());
      if (teacherGroupsRes.ok) setTeacherGroups(await teacherGroupsRes.json());
      if (cooksRes.ok) setCooks(await cooksRes.json());
      if (cookGroupsRes.ok) setCookGroups(await cookGroupsRes.json());
      if (dutySettingsRes.ok) setDutySettings(await dutySettingsRes.json());
      if (holidaysRes.ok) setHolidays(await holidaysRes.json());
      if (settingsRes.ok) {
        const settingsList = await settingsRes.json();
        const activeSetting = settingsList.find((s: any) => s.is_active);
        if (activeSetting && Array.isArray(activeSetting.schedule_days)) {
          setScheduleDays(activeSetting.schedule_days);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- Cook Schedule Print ----------
  const printCookSchedule = (mode: "weekly" | "monthly") => {
    if (!dutySettings || cookGroups.length === 0) return;

    const anchorOffset = dutySettings.cook_anchor_offset ?? 0;
    const sortedGroups = [...cookGroups].sort((a, b) => a.order_no - b.order_no);
    const holidayDates = new Set(
      holidays
        .filter((h) => h.applies_to === "all" || h.applies_to === "cooks")
        .map((h) => h.date)
    );

    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    if (mode === "weekly") {
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(today);
      startDate.setDate(today.getDate() + mondayOffset);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const toLocalYYYYMMDD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDateStr = toLocalYYYYMMDD(startDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const cookEntries = buildCookSchedule(
      dutySettings.cook_anchor_date,
      sortedGroups,
      scheduleDays,
      startDateStr,
      totalDays,
      Array.from(holidayDates),
      anchorOffset
    );

    const days: { date: Date; label: string; group: CookGroup | null }[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = toLocalYYYYMMDD(current);
      const isHoliday = holidayDates.has(dateStr);
      const dayOfWeek = current.getDay();

      let group: CookGroup | null = null;
      if (!isHoliday && scheduleDays.includes(dayOfWeek)) {
        const entry = cookEntries.find((e) => e.date === dateStr);
        if (entry) {
          group = entry.item;
        }
      }

      const dayLabels = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
      days.push({
        date: new Date(current),
        label: `${dayLabels[dayOfWeek]} ${current.getDate()}/${current.getMonth() + 1}`,
        group,
      });
      current.setDate(current.getDate() + 1);
    }

    const rows = days
      .map(
        (d) => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">${d.label}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">
            ${
              d.group
                ? `<span style="background:#ede9fe;color:#5b21b6;padding:4px 12px;border-radius:9999px;font-size:13px;font-weight:700;">${d.group.name}</span>
                   <div style="margin-top:4px;font-size:12px;color:#6b7280;">${d.group.members.map((m) => m.name).join(", ")}</div>`
                : `<span style="color:#ef4444;font-weight:600;">วันหยุด</span>`
            }
          </td>
        </tr>`
      )
      .join("");

    const title = mode === "weekly"
      ? `ตารางเวรแม่ครัวประจำสัปดาห์ (${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()} - ${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()})`
      : `ตารางเวรแม่ครัวประจำเดือน ${startDate.getMonth() + 1}/${startDate.getFullYear()}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Sarabun', 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; }
          h1 { font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 4px; }
          h2 { font-size: 14px; font-weight: 600; text-align: center; color: #6b7280; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #e5e7eb; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <h2>โรงเรียน — ปีการศึกษา ${dutySettings ? "" : ""}</h2>
        <table>
          <thead>
            <tr>
              <th style="width:200px;">วัน</th>
              <th>กลุ่มเวรแม่ครัว / รายชื่อ</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------- News ----------
  const openNewsForm = async (existing?: NewsItem) => {
    const { value } = await Swal.fire({
      title: existing ? "แก้ไขข่าวประชาสัมพันธ์" : "เพิ่มข่าวประชาสัมพันธ์",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="${labelClass}">หัวข้อข่าว <span class="text-red-500">*</span></label>
            <input id="swal-title" class="${inputClass}" value="${existing?.title ?? ""}">
          </div>
          <div>
            <label class="${labelClass}">รายละเอียด <span class="text-red-500">*</span></label>
            <textarea id="swal-content" rows="5" class="${inputClass}">${existing?.content ?? ""}</textarea>
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" id="swal-published" class="w-4 h-4" ${existing?.is_published !== false ? "checked" : ""}>
            เผยแพร่บนหน้าแรกทันที
          </label>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: swalPopupClasses,
      preConfirm: () => {
        const title = (document.getElementById("swal-title") as HTMLInputElement).value.trim();
        const content = (document.getElementById("swal-content") as HTMLTextAreaElement).value.trim();
        const isPublished = (document.getElementById("swal-published") as HTMLInputElement).checked;
        if (!title || !content) {
          Swal.showValidationMessage("กรุณากรอกหัวข้อและรายละเอียดข่าว");
          return null;
        }
        return { title, content, isPublished };
      },
    });

    if (!value) return;
    const url = existing ? `/api/news/${existing.id}` : "/api/news";
    const res = await fetch(url, {
      method: existing ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify({ title: value.title, content: value.content, is_published: value.isPublished }),
    });
    if (res.ok) {
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1200, showConfirmButton: false });
      loadAll();
    } else {
      Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    }
  };

  const handleDeleteNews = async (item: NewsItem) => {
    const confirm = await Swal.fire({
      title: `ลบข่าว "${item.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/news/${item.id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) loadAll();
  };

  // ---------- School Holidays ----------
  const openHolidayForm = async (existing?: HolidayItem) => {
    const { value } = await Swal.fire({
      title: existing ? "แก้ไขวันหยุดพิเศษ" : "เพิ่มวันหยุดพิเศษ",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="${labelClass}">วันที่หยุด <span class="text-red-500">*</span></label>
            <input id="swal-holiday-date" type="date" class="${inputClass}" value="${existing?.date ?? ""}">
          </div>
          <div>
            <label class="${labelClass}">สาเหตุ / รายละเอียด <span class="text-red-500">*</span></label>
            <input id="swal-holiday-reason" class="${inputClass}" value="${existing?.reason ?? ""}" placeholder="เช่น วันหยุดชดเชยวันสงกรานต์">
          </div>
          <div>
            <label class="${labelClass}">ขอบเขตวันหยุด <span class="text-red-500">*</span></label>
            <select id="swal-holiday-applies" class="${inputClass}">
              <option value="all" ${existing?.applies_to === "all" || !existing?.applies_to ? "selected" : ""}>ทั้งหมด (ครูและแม่ครัว)</option>
              <option value="teachers" ${existing?.applies_to === "teachers" ? "selected" : ""}>เฉพาะครูเวร</option>
              <option value="cooks" ${existing?.applies_to === "cooks" ? "selected" : ""}>เฉพาะแม่ครัว</option>
            </select>
          </div>
          <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
            <p class="text-xs text-amber-700 dark:text-amber-400 font-semibold">
              ⚠️ ระบบจะข้ามการนับเวรตามขอบเขตที่เลือกโดยอัตโนมัติ
            </p>
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" id="swal-holiday-published" class="w-4 h-4" ${existing?.is_published !== false ? "checked" : ""}>
            เผยแพร่บนหน้าแรก
          </label>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: swalPopupClasses,
      preConfirm: () => {
        const date = (document.getElementById("swal-holiday-date") as HTMLInputElement).value;
        const reason = (document.getElementById("swal-holiday-reason") as HTMLInputElement).value.trim();
        const appliesTo = (document.getElementById("swal-holiday-applies") as HTMLSelectElement).value;
        const isPublished = (document.getElementById("swal-holiday-published") as HTMLInputElement).checked;
        if (!date) { Swal.showValidationMessage("กรุณาเลือกวันที่"); return null; }
        if (!reason) { Swal.showValidationMessage("กรุณากรอกสาเหตุ"); return null; }
        return { date, reason, appliesTo, isPublished };
      },
    });

    if (!value) return;
    const url = existing ? `/api/holidays/${existing.id}` : "/api/holidays";
    const res = await fetch(url, {
      method: existing ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify({ 
        date: value.date, 
        reason: value.reason, 
        is_published: value.isPublished,
        applies_to: value.appliesTo
      }),
    });

    if (res.ok) {
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1200, showConfirmButton: false });
      loadAll();
    } else {
      const err = await res.json().catch(() => ({}));
      Swal.fire("ข้อผิดพลาด", err.error ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    }
  };

  const handleDeleteHoliday = async (item: HolidayItem) => {
    const confirm = await Swal.fire({
      title: `ลบวันหยุด "${item.reason}"?`,
      text: `วันที่ ${item.date} จะกลับมานับเวรตามปกติ`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/holidays/${item.id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) loadAll();
  };

  // ---------- Teacher duty groups ----------
  const openTeacherGroupForm = async (existing?: TeacherGroup) => {
    const selectedIds = new Set(existing?.members.map((m) => m.id) ?? []);
    const otherGroupByTeacherId = new Map<string, string>();
    teacherGroups.forEach((g) => {
      if (g.id === existing?.id) return;
      g.members.forEach((m) => otherGroupByTeacherId.set(m.id, g.name));
    });
    const { value } = await Swal.fire({
      title: existing ? "แก้ไขกลุ่มเวรครู" : "เพิ่มกลุ่มเวรครู",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="${labelClass}">ชื่อกลุ่ม <span class="text-red-500">*</span></label>
            <input id="swal-name" class="${inputClass}" value="${existing?.name ?? ""}" placeholder="เช่น กลุ่ม 1">
          </div>
          <div>
            <label class="${labelClass}">ลำดับการหมุนเวร (เริ่มที่ 0)</label>
            <p class="text-[11px] text-subtle-foreground mb-1.5">แต่ละกลุ่มขึ้นเวร 1 สัปดาห์การเรียน (นับเฉพาะวันเปิดเรียนจริง) แล้วหมุนไปกลุ่มถัดไป</p>
            <input id="swal-order" type="number" min="0" class="${inputClass}" value="${existing?.order_no ?? teacherGroupsNextOrder()}">
          </div>
          <div>
            <label class="${labelClass}">สมาชิกครูในกลุ่ม</label>
            <p class="text-[11px] text-subtle-foreground mb-2">ครู 1 คนอยู่ได้เพียง 1 กลุ่ม ครูที่อยู่กลุ่มอื่นแล้วจะเลือกไม่ได้ ต้องนำออกจากกลุ่มเดิมก่อน</p>
            <div class="max-h-48 overflow-y-auto space-y-1.5 border border-border rounded-xl p-3">
              ${teachers.length === 0 ? '<p class="text-xs text-subtle-foreground">ไม่มีรายชื่อครูในระบบ</p>' : teachers.map((t) => `
                <label class="flex items-center gap-2 text-sm ${otherGroupByTeacherId.has(t.id) ? "text-subtle-foreground cursor-not-allowed" : "text-foreground cursor-pointer"}">
                  <input type="checkbox" value="${t.id}" class="swal-teacher-checkbox w-4 h-4" ${selectedIds.has(t.id) ? "checked" : ""} ${otherGroupByTeacherId.has(t.id) ? "disabled" : ""}>
                  ${t.username}
                  ${otherGroupByTeacherId.has(t.id) ? `<span class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(อยู่ในกลุ่ม ${otherGroupByTeacherId.get(t.id)})</span>` : ""}
                </label>
              `).join("")}
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: swalPopupClasses,
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement).value.trim();
        const order = Number((document.getElementById("swal-order") as HTMLInputElement).value);
        const teacherIds = Array.from(document.querySelectorAll(".swal-teacher-checkbox:checked")).map(
          (cb) => (cb as HTMLInputElement).value
        );
        if (!name) {
          Swal.showValidationMessage("กรุณากรอกชื่อกลุ่ม");
          return null;
        }
        return { name, order, teacherIds };
      },
    });

    if (!value) return;
    const url = existing ? `/api/teacher-duty-groups/${existing.id}` : "/api/teacher-duty-groups";
    const res = await fetch(url, {
      method: existing ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: value.name, order_no: value.order, teacher_ids: value.teacherIds }),
    });
    if (res.ok) {
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1200, showConfirmButton: false });
      loadAll();
    } else {
      Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    }
  };

  const teacherGroupsNextOrder = () => teacherGroups.length;

  const handleDeleteTeacherGroup = async (group: TeacherGroup) => {
    const confirm = await Swal.fire({
      title: `ลบกลุ่ม "${group.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/teacher-duty-groups/${group.id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) loadAll();
  };

  // ---------- Cooks (master data) ----------
  const openCookForm = async (existing?: CookItem) => {
    const { value: name } = await Swal.fire({
      title: existing ? "แก้ไขชื่อแม่ครัว" : "เพิ่มแม่ครัว",
      input: "text",
      inputValue: existing?.name ?? "",
      inputLabel: "ชื่อ-นามสกุล",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: swalPopupClasses,
      inputValidator: (v) => (!v?.trim() ? "กรุณากรอกชื่อ" : undefined),
    });
    if (!name) return;
    const url = existing ? `/api/cooks/${existing.id}` : "/api/cooks";
    const res = await fetch(url, {
      method: existing ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1200, showConfirmButton: false });
      loadAll();
    } else {
      Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    }
  };

  const handleDeleteCook = async (cook: CookItem) => {
    const confirm = await Swal.fire({
      title: `ลบ "${cook.name}" ออกจากรายชื่อแม่ครัว?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/cooks/${cook.id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) loadAll();
  };

  // ---------- Bulk delete handlers ----------
  const handleBulkDeleteCooks = async () => {
    if (selectedCookIds.size === 0) return;
    const confirm = await Swal.fire({
      title: `ลบแม่ครัว ${selectedCookIds.size} คน?`,
      text: "รายชื่อที่เลือกจะถูกลบออกจากระบบและกลุ่มเวรทั้งหมดอย่างถาวร",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบทั้งหมด",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      customClass: swalPopupClasses,
      buttonsStyling: false,
    });
    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "กำลังลบข้อมูล...",
      text: "โปรดรอสักครู่ ระบบกำลังลบรายชื่อแม่ครัวที่เลือก",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const idsToDelete = Array.from(selectedCookIds);
      for (const id of idsToDelete) {
        await fetch(`/api/cooks/${id}`, { method: "DELETE", headers: authHeaders() });
      }
      Swal.fire({
        icon: "success",
        title: "ลบรายชื่อสำเร็จ",
        timer: 1200,
        showConfirmButton: false
      });
      setSelectedCookIds(new Set());
      setIsMultiDeleteMode(false);
      loadAll();
    } catch (err) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลได้ทั้งหมด", "error");
      loadAll();
    }
  };

  const toggleSelectCook = (id: string) => {
    const next = new Set(selectedCookIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCookIds(next);
  };

  const toggleSelectAllCooks = () => {
    if (selectedCookIds.size === cooks.length) {
      setSelectedCookIds(new Set());
    } else {
      setSelectedCookIds(new Set(cooks.map(c => c.id)));
    }
  };

  // ---------- Import Cooks from file with Groups ----------
  const importFileRef = useRef<HTMLInputElement>(null);

  interface ImportRow {
    name: string;
    groupName?: string;
  }

  const handleImportCooks = async (file: File) => {
    const text = await file.text();
    let rows: ImportRow[] = [];

    const parseLine = (line: string, isCsv: boolean): ImportRow | null => {
      const parts = isCsv
        ? line.split(",").map(c => c.replace(/^"|"$/g, "").trim())
        : line.split(",").map(p => p.trim());
      
      const name = parts[0];
      if (!name) return null;
      
      const groupName = parts[1] || undefined;
      return { name, groupName };
    };

    if (file.name.endsWith(".csv")) {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let startIdx = 0;
      if (lines.length > 0) {
        const firstRowParts = lines[0].split(",").map(c => c.replace(/^"|"$/g, "").trim().toLowerCase());
        const headerKeywords = ["ชื่อ", "name", "ชื่อ-นามสกุล", "fullname", "full_name"];
        if (headerKeywords.some(k => firstRowParts[0]?.includes(k))) {
          startIdx = 1;
        }
      }
      for (let i = startIdx; i < lines.length; i++) {
        const parsed = parseLine(lines[i], true);
        if (parsed) rows.push(parsed);
      }
    } else {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const parsed = parseLine(line, false);
        if (parsed) rows.push(parsed);
      }
    }

    if (rows.length === 0) {
      Swal.fire("ไม่พบข้อมูล", "ไม่พบรายชื่อในไฟล์ที่เลือก", "warning");
      return;
    }

    const existingNames = new Set(cooks.map((c) => c.name.trim()));
    const newRows = rows.filter((r) => !existingNames.has(r.name));
    const dupRows = rows.filter((r) => existingNames.has(r.name));

    const previewHtml = `
      <div class="text-left space-y-3 mt-2">
        <div>
          <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">รายชื่อที่จะเพิ่ม (${newRows.length} คน)</p>
          <div class="max-h-40 overflow-y-auto border border-border rounded-xl p-2.5 space-y-1.5 bg-card">
            ${newRows.length === 0
              ? '<p class="text-xs text-subtle-foreground">ไม่มีรายชื่อใหม่</p>'
              : newRows.map((r) => `
                <div class="flex items-center justify-between text-sm">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block"></span>${r.name}</span>
                  ${r.groupName ? `<span class="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">กลุ่ม: ${r.groupName}</span>` : ""}
                </div>
              `).join("")}
          </div>
        </div>
        ${dupRows.length > 0 ? `
        <div>
          <p class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5">ข้ามเพราะมีอยู่แล้ว (${dupRows.length} คน)</p>
          <div class="max-h-24 overflow-y-auto border border-amber-200 dark:border-amber-500/30 rounded-xl p-2.5 space-y-1 bg-amber-50 dark:bg-amber-500/10">
            ${dupRows.map((r) => `<div class="text-xs text-amber-700 dark:text-amber-400">${r.name}</div>`).join("")}
          </div>
        </div>` : ""}
      </div>
    `;

    const { isConfirmed } = await Swal.fire({
      title: `นำเข้าจากไฟล์`,
      html: previewHtml,
      icon: newRows.length === 0 ? "info" : "question",
      showCancelButton: true,
      confirmButtonText: newRows.length === 0 ? "ตกลง" : `เพิ่ม ${newRows.length} คน`,
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: swalPopupClasses,
    });

    if (!isConfirmed || newRows.length === 0) return;

    Swal.fire({
      title: "กำลังนำเข้าข้อมูล...",
      text: "โปรดรอสักครู่ ระบบกำลังบันทึกรายชื่อแม่ครัวและจัดกลุ่มเวร",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const cookNameToIdMap: Record<string, string> = {};
      cooks.forEach(c => {
        cookNameToIdMap[c.name.trim()] = c.id;
      });

      for (const row of newRows) {
        const res = await fetch("/api/cooks", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ name: row.name }),
        });
        if (res.ok) {
          const newCook = await res.json();
          cookNameToIdMap[row.name] = newCook.id;
        }
      }

      const cooksByGroupName: Record<string, string[]> = {};
      newRows.forEach(r => {
        if (r.groupName) {
          const id = cookNameToIdMap[r.name];
          if (id) {
            if (!cooksByGroupName[r.groupName]) {
              cooksByGroupName[r.groupName] = [];
            }
            cooksByGroupName[r.groupName].push(id);
          }
        }
      });

      const groupNamesToProcess = Object.keys(cooksByGroupName);
      for (const gName of groupNamesToProcess) {
        const newCookIdsForGroup = cooksByGroupName[gName];
        const existingGroup = cookGroups.find(g => g.name.trim().toLowerCase() === gName.trim().toLowerCase());
        
        if (existingGroup) {
          const existingMemberIds = existingGroup.members.map(m => m.id);
          const mergedCookIds = Array.from(new Set([...existingMemberIds, ...newCookIdsForGroup]));
          
          await fetch(`/api/cook-duty-groups/${existingGroup.id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({
              name: existingGroup.name,
              order_no: existingGroup.order_no,
              cook_ids: mergedCookIds
            })
          });
        } else {
          const nextOrder = cookGroups.length;
          await fetch("/api/cook-duty-groups", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              name: gName,
              order_no: nextOrder,
              cook_ids: newCookIdsForGroup
            })
          });
        }
      }

      Swal.fire({
        icon: "success",
        title: "นำเข้าสำเร็จ",
        text: `นำเข้าและจัดกลุ่มเรียบร้อยแล้ว`,
        timer: 1800,
        showConfirmButton: false,
      });
      loadAll();
    } catch (err) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถนำเข้าข้อมูลได้สมบูรณ์ในบางส่วน", "error");
      loadAll();
    }
  };

  const downloadTemplate = (type: "name" | "name-group", format: "txt" | "csv") => {
    let content = "";
    let filename = "";
    if (type === "name") {
      if (format === "txt") {
        content = "แม่ครัว คนที่หนึ่ง\nแม่ครัว คนที่สอง\nแม่ครัว คนที่สาม\n";
        filename = "template_cook_names.txt";
      } else {
        content = "ชื่อ-นามสกุล\nแม่ครัว คนที่หนึ่ง\nแม่ครัว คนที่สอง\nแม่ครัว คนที่สาม\n";
        filename = "template_cook_names.csv";
      }
    } else {
      if (format === "txt") {
        content = "แม่ครัว คนที่หนึ่ง, กลุ่ม 1\nแม่ครัว คนที่สอง, กลุ่ม 1\nแม่ครัว คนที่สาม, กลุ่ม 2\n";
        filename = "template_cook_names_and_groups.txt";
      } else {
        content = "ชื่อ-นามสกุล,กลุ่ม\nแม่ครัว คนที่หนึ่ง,กลุ่ม 1\nแม่ครัว คนที่สอง,กลุ่ม 1\nแม่ครัว คนที่สาม,กลุ่ม 2\n";
        filename = "template_cook_names_and_groups.csv";
      }
    }
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------- Cook duty groups ----------
  const openCookGroupForm = async (existing?: CookGroup) => {
    const selectedIds = new Set(existing?.members.map((m) => m.id) ?? []);
    const otherGroupByCookId = new Map<string, string>();
    cookGroups.forEach((g) => {
      if (g.id === existing?.id) return;
      g.members.forEach((m) => otherGroupByCookId.set(m.id, g.name));
    });
    const { value } = await Swal.fire({
      title: existing ? "แก้ไขกลุ่มเวรแม่ครัว" : "เพิ่มกลุ่มเวรแม่ครัว",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="${labelClass}">ชื่อกลุ่ม <span class="text-red-500">*</span></label>
            <input id="swal-name" class="${inputClass}" value="${existing?.name ?? ""}" placeholder="เช่น กลุ่ม 1">
          </div>
          <div>
            <label class="${labelClass}">ลำดับการหมุนเวร (เริ่มที่ 0)</label>
            <p class="text-[11px] text-subtle-foreground mb-1.5">แต่ละกลุ่มขึ้นเวรทั้งกลุ่มพร้อมกัน 1 วันเปิดเรียน แล้วหมุนไปกลุ่มถัดไปในวันเปิดเรียนถัดไป</p>
            <input id="swal-order" type="number" min="0" class="${inputClass}" value="${existing?.order_no ?? cookGroups.length}">
          </div>
          <div>
            <label class="${labelClass}">สมาชิกแม่ครัวในกลุ่ม</label>
            <p class="text-[11px] text-subtle-foreground mb-2">แม่ครัว 1 คนอยู่ได้เพียง 1 กลุ่ม คนที่อยู่กลุ่มอื่นแล้วจะเลือกไม่ได้ ต้องนำออกจากกลุ่มเดิมก่อน</p>
            <div class="max-h-48 overflow-y-auto space-y-1.5 border border-border rounded-xl p-3">
              ${cooks.length === 0 ? '<p class="text-xs text-subtle-foreground">ยังไม่มีรายชื่อแม่ครัว</p>' : cooks.map((c) => `
                <label class="flex items-center gap-2 text-sm ${otherGroupByCookId.has(c.id) ? "text-subtle-foreground cursor-not-allowed" : "text-foreground cursor-pointer"}">
                  <input type="checkbox" value="${c.id}" class="swal-cook-checkbox w-4 h-4" ${selectedIds.has(c.id) ? "checked" : ""} ${otherGroupByCookId.has(c.id) ? "disabled" : ""}>
                  ${c.name}
                  ${otherGroupByCookId.has(c.id) ? `<span class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(อยู่ในกลุ่ม ${otherGroupByCookId.get(c.id)})</span>` : ""}
                </label>
              `).join("")}
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: swalPopupClasses,
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement).value.trim();
        const order = Number((document.getElementById("swal-order") as HTMLInputElement).value);
        const cookIds = Array.from(document.querySelectorAll(".swal-cook-checkbox:checked")).map(
          (cb) => (cb as HTMLInputElement).value
        );
        if (!name) {
          Swal.showValidationMessage("กรุณากรอกชื่อกลุ่ม");
          return null;
        }
        return { name, order, cookIds };
      },
    });

    if (!value) return;
    const url = existing ? `/api/cook-duty-groups/${existing.id}` : "/api/cook-duty-groups";
    const res = await fetch(url, {
      method: existing ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: value.name, order_no: value.order, cook_ids: value.cookIds }),
    });
    if (res.ok) {
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1200, showConfirmButton: false });
      loadAll();
    } else {
      Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    }
  };

  const handleDeleteCookGroup = async (group: CookGroup) => {
    const confirm = await Swal.fire({
      title: `ลบกลุ่ม "${group.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/cook-duty-groups/${group.id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) loadAll();
  };

  // ---------- Open Template Modal ----------
  const openTemplateModal = () => {
    Swal.fire({
      title: "ดาวน์โหลดเทมเพลตนำเข้า",
      html: `
        <div class="space-y-4 text-left mt-4 text-sm">
          <p class="font-bold text-muted-foreground mb-1.5 text-xs uppercase tracking-wider">📋 แบบที่ 1: เฉพาะรายชื่อ</p>
          <div class="grid grid-cols-2 gap-2">
            <button id="btn-tmpl-name-txt" class="w-full bg-card hover:bg-muted py-2.5 px-3 text-xs text-foreground font-bold rounded-xl transition-all cursor-pointer border border-border">📄 ข้อความ (.txt)</button>
            <button id="btn-tmpl-name-csv" class="w-full bg-card hover:bg-muted py-2.5 px-3 text-xs text-foreground font-bold rounded-xl transition-all cursor-pointer border border-border">📊 ตาราง (.csv)</button>
          </div>
          <p class="font-bold text-muted-foreground mb-1.5 text-xs uppercase tracking-wider pt-3 border-t border-border mt-3">👥 แบบที่ 2: รายชื่อพร้อมจัดกลุ่ม (ชื่อ, กลุ่ม)</p>
          <div class="grid grid-cols-2 gap-2">
            <button id="btn-tmpl-group-txt" class="w-full bg-card hover:bg-muted py-2.5 px-3 text-xs text-foreground font-bold rounded-xl transition-all cursor-pointer border border-border">📄 ข้อความ (.txt)</button>
            <button id="btn-tmpl-group-csv" class="w-full bg-card hover:bg-muted py-2.5 px-3 text-xs text-foreground font-bold rounded-xl transition-all cursor-pointer border border-border">📊 ตาราง (.csv)</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "ปิด",
      customClass: swalPopupClasses,
      didOpen: () => {
        document.getElementById("btn-tmpl-name-txt")?.addEventListener("click", () => {
          downloadTemplate("name", "txt");
          Swal.close();
        });
        document.getElementById("btn-tmpl-name-csv")?.addEventListener("click", () => {
          downloadTemplate("name", "csv");
          Swal.close();
        });
        document.getElementById("btn-tmpl-group-txt")?.addEventListener("click", () => {
          downloadTemplate("name-group", "txt");
          Swal.close();
        });
        document.getElementById("btn-tmpl-group-csv")?.addEventListener("click", () => {
          downloadTemplate("name-group", "csv");
          Swal.close();
        });
      }
    });
  };

  // ---------- Duty rotation settings ----------
  const openDutySettingsForm = async () => {
    const { value } = await Swal.fire({
      title: "ตั้งค่าจุดเริ่มต้นการหมุนเวร",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div class="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-700 dark:text-indigo-300 font-semibold mb-2">
            📌 สามารถกำหนดได้ว่า ณ วันที่ตั้งต้น (Anchor Date) ให้ระบบเริ่มรันเวรด้วยกลุ่มลำดับที่เท่าใด (เช่น สำหรับสัปดาห์แรกของการเปิดใช้เว็บ)
          </div>
          <div>
            <label class="${labelClass}">วันเริ่มต้นของกลุ่มเวรครู</label>
            <input id="swal-teacher-anchor" type="date" class="${inputClass}" value="${dutySettings?.teacher_anchor_date ?? ""}">
          </div>
          <div>
            <label class="${labelClass}">กลุ่มเวรครูเริ่มต้น (ระบุลำดับ เช่น 3)</label>
            <input id="swal-teacher-offset" type="number" min="0" class="${inputClass}" value="${dutySettings?.teacher_anchor_offset ?? 0}">
          </div>
          <div class="border-t border-border pt-3">
            <label class="${labelClass}">วันเริ่มต้นของกลุ่มเวรแม่ครัว</label>
            <input id="swal-cook-anchor" type="date" class="${inputClass}" value="${dutySettings?.cook_anchor_date ?? ""}">
          </div>
          <div>
            <label class="${labelClass}">กลุ่มเวรแม่ครัวเริ่มต้น (ระบุลำดับ เช่น 7)</label>
            <input id="swal-cook-offset" type="number" min="0" class="${inputClass}" value="${dutySettings?.cook_anchor_offset ?? 0}">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: swalPopupClasses,
      preConfirm: () => {
        const teacherAnchor = (document.getElementById("swal-teacher-anchor") as HTMLInputElement).value;
        const teacherOffset = Number((document.getElementById("swal-teacher-offset") as HTMLInputElement).value || 0);
        const cookAnchor = (document.getElementById("swal-cook-anchor") as HTMLInputElement).value;
        const cookOffset = Number((document.getElementById("swal-cook-offset") as HTMLInputElement).value || 0);
        if (!teacherAnchor || !cookAnchor) {
          Swal.showValidationMessage("กรุณาเลือกวันที่ให้ครบถ้วน");
          return null;
        }
        return { teacherAnchor, teacherOffset, cookAnchor, cookOffset };
      },
    });

    if (!value) return;
    const res = await fetch("/api/duty-settings", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ 
        teacher_anchor_date: value.teacherAnchor, 
        teacher_anchor_offset: value.teacherOffset,
        cook_anchor_date: value.cookAnchor,
        cook_anchor_offset: value.cookOffset
      }),
    });
    if (res.ok) {
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1200, showConfirmButton: false });
      loadAll();
    } else {
      Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    }
  };

  return (
    <div className="p-8 animate-fade-in-up">
      <SectionHeader
        icon="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"
        color="indigo"
        title="หน้าแรก & เวรประจำวัน"
        subtitle="จัดการข่าวประชาสัมพันธ์ เวรครู และเวรแม่ครัวที่แสดงบนหน้าแรกก่อนเข้าสู่ระบบ"
      />

      <div className="ui-segment mb-6 max-w-2xl">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSubTab(t.key)}
            data-active={subTab === t.key}
            className="ui-segment-item"
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-semibold">กำลังโหลดข้อมูล...</div>
      ) : (
        <>
          {subTab === "news" && (
            <div className="space-y-8">

              {/* Section 1: Regular news */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">ข่าวประชาสัมพันธ์</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">ประกาศและข่าวสารทั่วไป — ไม่มีผลต่อการหมุนเวร</p>
                  </div>
                  <button
                    onClick={() => openNewsForm()}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    เพิ่มข่าว
                  </button>
                </div>
                {news.length === 0 ? (
                  <div className="text-center py-8 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
                    ยังไม่มีข่าวประชาสัมพันธ์
                  </div>
                ) : (
                  <div className="space-y-3">
                    {news.map((n) => (
                      <div key={n.id} className="card-modern p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-foreground">{n.title}</h3>
                              {n.is_published ? (
                                <span className="ui-chip ui-chip-success">เผยแพร่แล้ว</span>
                              ) : (
                                <span className="ui-chip ui-chip-warning">ฉบับร่าง</span>
                              )}
                            </div>
                            <p className="text-xs text-subtle-foreground mt-0.5">{formatThaiDate(n.created_at)}</p>
                            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{n.content}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openNewsForm(n)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteNews(n)}
                              className="text-red-500 dark:text-red-400 hover:text-red-700 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Section 2: School Holidays */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-black">ห</span>
                      วันหยุดพิเศษ
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      วันหยุดในวันเรียนปกติ —{" "}
                      <strong className="text-amber-600 dark:text-amber-400">ข้ามการนับเวร</strong>{" "}
                      ทั้งครูและแม่ครัวในวันนั้นอัตโนมัติ
                    </p>
                  </div>
                  <button
                    onClick={() => openHolidayForm()}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    เพิ่มวันหยุด
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 mb-4 text-xs text-amber-800 dark:text-amber-300 font-semibold space-y-1">
                  <p>📌 ครู (รายสัปดาห์): ถ้ายังมีวันเปิดเรียนอื่นในสัปดาห์ → หมุนกลุ่มตามปกติ | ถ้าทั้งสัปดาห์ปิดหมด → ยกกลุ่มเดิมไปสัปดาห์ถัดไป</p>
                  <p>📌 แม่ครัว (รายวัน): ข้ามวันนั้นทันที กลุ่มถัดไปขึ้นวันเปิดเรียนวันถัดไป</p>
                </div>

                {holidays.length === 0 ? (
                  <div className="text-center py-8 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
                    ยังไม่มีวันหยุดพิเศษ
                  </div>
                ) : (
                  <div className="space-y-2">
                    {holidays.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-500/30">
                              {h.date}
                            </span>
                            <span className="font-semibold text-sm text-foreground">{h.reason}</span>
                            {h.is_published ? (
                              <span className="ui-chip ui-chip-success" style={{ fontSize: "10px" }}>เผยแพร่</span>
                            ) : (
                              <span className="ui-chip ui-chip-warning" style={{ fontSize: "10px" }}>ซ่อน</span>
                            )}
                            {h.applies_to === "teachers" ? (
                              <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30">เฉพาะครู</span>
                            ) : h.applies_to === "cooks" ? (
                              <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30">เฉพาะแม่ครัว</span>
                            ) : (
                              <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700">ครู & แม่ครัว</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openHolidayForm(h)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteHoliday(h)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}


          {subTab === "teachers" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => openTeacherGroupForm()}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มกลุ่มเวรครู
                </button>
              </div>
              {teacherGroups.length === 0 ? (
                <div className="text-center py-8 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
                  ยังไม่มีกลุ่มเวรครู
                </div>
              ) : (
                teacherGroups.map((g) => (
                  <div key={g.id} className="card-modern p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground">{g.name}</h3>
                          <span className="text-[10px] font-bold text-subtle-foreground">ลำดับที่ {g.order_no}</span>
                        </div>
                        <div className="mt-2">
                          <Chips items={g.members.map((m) => m.username)} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openTeacherGroupForm(g)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteTeacherGroup(g)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {subTab === "cooks" && (
            <div className="space-y-8">
              {/* hidden file input for import */}
              <input
                ref={importFileRef}
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportCooks(file);
                  // reset value so same file can be selected again
                  e.target.value = "";
                }}
              />
              <div>
                <div className="flex flex-col gap-4 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-bold text-foreground">รายชื่อแม่ครัว</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Templates Downloader Button calling openTemplateModal */}
                      <button
                        onClick={openTemplateModal}
                        className="bg-card border border-border text-muted-foreground hover:bg-muted px-4 py-2 rounded-xl font-medium shadow-sm transition-all flex items-center gap-1.5 cursor-pointer text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        ดาวน์โหลดเทมเพลต
                      </button>

                      <button
                        onClick={() => importFileRef.current?.click()}
                        className="bg-card border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 px-4 py-2 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer text-sm"
                        title="นำเข้ารายชื่อจากไฟล์ .txt หรือ .csv (ชื่อแต่ละบรรทัด)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        นำเข้าจากไฟล์
                      </button>

                      {cooks.length > 0 && (
                        <button
                          onClick={() => {
                            setIsMultiDeleteMode(!isMultiDeleteMode);
                            setSelectedCookIds(new Set());
                          }}
                          className={`px-4 py-2 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer text-sm border ${
                            isMultiDeleteMode 
                              ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                              : "bg-card border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/15"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {isMultiDeleteMode ? "ยกเลิกการเลือก" : "ลบทีละหลายคน"}
                        </button>
                      )}

                      <button
                        onClick={() => openCookForm()}
                        className="bg-card border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        เพิ่มแม่ครัว
                      </button>
                    </div>
                  </div>

                  {isMultiDeleteMode && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 animate-fade-in-up">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={toggleSelectAllCooks}
                          className="bg-card hover:bg-muted text-foreground border border-border text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                        >
                          {selectedCookIds.size === cooks.length ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
                        </button>
                        <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                          เลือกแล้ว {selectedCookIds.size} จาก {cooks.length} คน
                        </span>
                      </div>
                      <button
                        onClick={handleBulkDeleteCooks}
                        disabled={selectedCookIds.size === 0}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        ลบที่เลือก ({selectedCookIds.size})
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  รองรับ <code className="bg-muted px-1.5 py-0.5 rounded font-mono">.txt</code> หรือ <code className="bg-muted px-1.5 py-0.5 rounded font-mono">.csv</code> (ดูรูปแบบได้ที่ปุ่มดาวน์โหลดเทมเพลต)
                </p>

                {cooks.length === 0 ? (
                  <div className="text-center py-6 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold text-sm">
                    ยังไม่มีรายชื่อแม่ครัว
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cooks.map((c) => {
                      const isSelected = selectedCookIds.has(c.id);
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => isMultiDeleteMode && toggleSelectCook(c.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold transition-all ${
                            isMultiDeleteMode 
                              ? isSelected 
                                ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 cursor-pointer shadow-sm"
                                : "bg-card border-border hover:border-red-200 cursor-pointer"
                              : "bg-card border-border"
                          }`}
                        >
                          {isMultiDeleteMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-3.5 h-3.5 text-red-600 rounded border-border"
                            />
                          )}
                          <span>{c.name}</span>
                          {!isMultiDeleteMode && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); openCookForm(c); }} className="text-indigo-500 hover:text-indigo-700 cursor-pointer border-0 bg-transparent text-xs font-bold pl-1.5">แก้ไข</button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteCook(c); }} className="text-red-500 hover:text-red-700 cursor-pointer border-0 bg-transparent text-xs font-bold pl-1">ลบ</button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">กลุ่มเวรแม่ครัว</h3>
                  <button
                    onClick={() => openCookGroupForm()}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    เพิ่มกลุ่มเวรแม่ครัว
                  </button>
                </div>
                {cookGroups.length === 0 ? (
                  <div className="text-center py-8 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold">
                    ยังไม่มีกลุ่มเวรแม่ครัว
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cookGroups.map((g) => (
                      <div key={g.id} className="card-modern p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground">{g.name}</h4>
                              <span className="text-[10px] font-bold text-subtle-foreground">ลำดับที่ {g.order_no}</span>
                            </div>
                            <div className="mt-2">
                              <Chips items={g.members.map((m) => m.name)} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openCookGroupForm(g)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteCookGroup(g)}
                              className="text-red-500 dark:text-red-400 hover:text-red-700 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cookGroups.length > 0 && dutySettings && (
                <div className="card-modern p-5">
                  <h3 className="font-bold text-foreground mb-3">พิมพ์ตารางเวรแม่ครัว</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    พิมพ์หรือบันทึก PDF ตารางเวรแม่ครัวประจำสัปดาห์หรือประจำเดือน
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => printCookSchedule("weekly")}
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 cursor-pointer text-sm border-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      พิมพ์รายสัปดาห์
                    </button>
                    <button
                      onClick={() => printCookSchedule("monthly")}
                      className="bg-card border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      พิมพ์รายเดือน
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {subTab === "settings" && (
            <div className="space-y-4 max-w-xl">
              <div className="card-modern p-5">
                <p className="text-sm text-muted-foreground mb-4">
                  กำหนดวันเริ่มต้นการหมุนเวร และกำหนดกลุ่มเวรตั้งต้นสำหรับการขึ้นระบบ (Anchor Date / Anchor Offset)
                </p>
                <div className="space-y-3 text-sm">
                  <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                    <p className="font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                      เวรครูประจำสัปดาห์
                    </p>
                    <div className="space-y-1 pl-3 text-xs text-muted-foreground font-semibold">
                      <div>วันตั้งต้น: <span className="text-foreground">{dutySettings ? formatThaiDate(dutySettings.teacher_anchor_date) : "-"}</span></div>
                      <div>กลุ่มเริ่มต้น ณ วันตั้งต้น: <span className="text-foreground">ลำดับที่ {dutySettings?.teacher_anchor_offset ?? 0}</span></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                    <p className="font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                      เวรแม่ครัวประจำวัน
                    </p>
                    <div className="space-y-1 pl-3 text-xs text-muted-foreground font-semibold">
                      <div>วันตั้งต้น: <span className="text-foreground">{dutySettings ? formatThaiDate(dutySettings.cook_anchor_date) : "-"}</span></div>
                      <div>กลุ่มเริ่มต้น ณ วันตั้งต้น: <span className="text-foreground">ลำดับที่ {dutySettings?.cook_anchor_offset ?? 0}</span></div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={openDutySettingsForm}
                  className="mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all cursor-pointer"
                >
                  แก้ไขการตั้งค่าเริ่มต้น
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
