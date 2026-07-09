"use client";

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import SectionHeader from "../SectionHeader";
import { formatThaiDate } from "../../../lib/format";

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
}

interface HolidayItem {
  id: string;
  date: string;
  reason: string;
  is_published: boolean;
  created_at: string;
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
  const [loading, setLoading] = useState(true);

  const authHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [newsRes, teachersRes, teacherGroupsRes, cooksRes, cookGroupsRes, dutySettingsRes, holidaysRes] = await Promise.all([
        fetch("/api/news", { headers: authHeaders() }),
        fetch("/api/public/teachers"),
        fetch("/api/teacher-duty-groups", { headers: authHeaders() }),
        fetch("/api/cooks", { headers: authHeaders() }),
        fetch("/api/cook-duty-groups", { headers: authHeaders() }),
        fetch("/api/duty-settings", { headers: authHeaders() }),
        fetch("/api/holidays", { headers: authHeaders() }),
      ]);
      if (newsRes.ok) setNews(await newsRes.json());
      if (teachersRes.ok) setTeachers(await teachersRes.json());
      if (teacherGroupsRes.ok) setTeacherGroups(await teacherGroupsRes.json());
      if (cooksRes.ok) setCooks(await cooksRes.json());
      if (cookGroupsRes.ok) setCookGroups(await cookGroupsRes.json());
      if (dutySettingsRes.ok) setDutySettings(await dutySettingsRes.json());
      if (holidaysRes.ok) setHolidays(await holidaysRes.json());
    } finally {
      setLoading(false);
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
          <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
            <p class="text-xs text-amber-700 dark:text-amber-400 font-semibold">
              ⚠️ วันหยุดนี้จะถูก <strong>ข้ามการนับเวร</strong> ของทั้งครูและแม่ครัวโดยอัตโนมัติ
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
        const isPublished = (document.getElementById("swal-holiday-published") as HTMLInputElement).checked;
        if (!date) { Swal.showValidationMessage("กรุณาเลือกวันที่"); return null; }
        if (!reason) { Swal.showValidationMessage("กรุณากรอกสาเหตุ"); return null; }
        return { date, reason, isPublished };
      },
    });

    if (!value) return;
    const url = existing ? `/api/holidays/${existing.id}` : "/api/holidays";
    const res = await fetch(url, {
      method: existing ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify({ date: value.date, reason: value.reason, is_published: value.isPublished }),
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

  // ---------- Import Cooks from file ----------
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleImportCooks = async (file: File) => {
    const text = await file.text();
    let names: string[] = [];

    if (file.name.endsWith(".csv")) {
      // รองรับ CSV: เอาคอลัมน์แรกของแต่ละแถว (ข้ามหัวตาราง ถ้าดูเหมือน header)
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      // ถ้าบรรทัดแรกไม่มีตัวเลขและเป็น header ให้ข้ามไป
      const firstCols = lines.map((l) => l.split(",")[0].replace(/^"|"$/g, "").trim());
      // ตรวจว่า row แรกเหมือน header (ไม่ได้เป็นชื่อคน) - ถ้าบรรทัดแรกเหมือนกับคำว่า "ชื่อ" หรือ "name" ให้ข้าม
      const headerKeywords = ["ชื่อ", "name", "ชื่อ-นามสกุล", "fullname", "full_name"];
      const startIdx = headerKeywords.some((k) =>
        firstCols[0]?.toLowerCase().includes(k.toLowerCase())
      ) ? 1 : 0;
      names = firstCols.slice(startIdx).filter(Boolean);
    } else {
      // .txt: ชื่อแต่ละบรรทัด
      names = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    }

    if (names.length === 0) {
      Swal.fire("ไม่พบข้อมูล", "ไม่พบรายชื่อในไฟล์ที่เลือก", "warning");
      return;
    }

    // กรองชื่อที่มีอยู่แล้วออก
    const existingNames = new Set(cooks.map((c) => c.name.trim()));
    const newNames = names.filter((n) => !existingNames.has(n));
    const dupNames = names.filter((n) => existingNames.has(n));

    const previewHtml = `
      <div class="text-left space-y-3 mt-2">
        <div>
          <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">จะเพิ่ม (${newNames.length} คน)</p>
          <div class="max-h-40 overflow-y-auto border border-border rounded-xl p-2.5 space-y-1 bg-card">
            ${newNames.length === 0
              ? '<p class="text-xs text-subtle-foreground">ไม่มีรายชื่อใหม่</p>'
              : newNames.map((n) => `<div class="flex items-center gap-1.5 text-sm"><span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block"></span>${n}</div>`).join("")}
          </div>
        </div>
        ${dupNames.length > 0 ? `
        <div>
          <p class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5">ข้ามเพราะมีอยู่แล้ว (${dupNames.length} คน)</p>
          <div class="max-h-24 overflow-y-auto border border-amber-200 dark:border-amber-500/30 rounded-xl p-2.5 space-y-1 bg-amber-50 dark:bg-amber-500/10">
            ${dupNames.map((n) => `<div class="text-xs text-amber-700 dark:text-amber-400">${n}</div>`).join("")}
          </div>
        </div>` : ""}
      </div>
    `;

    const { isConfirmed } = await Swal.fire({
      title: `นำเข้าจากไฟล์`,
      html: previewHtml,
      icon: newNames.length === 0 ? "info" : "question",
      showCancelButton: true,
      confirmButtonText: newNames.length === 0 ? "ตกลง" : `เพิ่ม ${newNames.length} คน`,
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: swalPopupClasses,
    });

    if (!isConfirmed || newNames.length === 0) return;

    // ส่ง API ทีละคน (batch)
    let successCount = 0;
    for (const name of newNames) {
      const res = await fetch("/api/cooks", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
      });
      if (res.ok) successCount++;
    }

    Swal.fire({
      icon: successCount > 0 ? "success" : "error",
      title: successCount > 0 ? `เพิ่มสำเร็จ ${successCount} คน` : "เกิดข้อผิดพลาด",
      timer: 1800,
      showConfirmButton: false,
    });
    loadAll();
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

  // ---------- Duty rotation settings ----------
  const openDutySettingsForm = async () => {
    const { value } = await Swal.fire({
      title: "ตั้งค่าจุดเริ่มต้นการหมุนเวร",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="${labelClass}">วันเริ่มต้นของกลุ่มเวรครูลำดับที่ 0</label>
            <input id="swal-teacher-anchor" type="date" class="${inputClass}" value="${dutySettings?.teacher_anchor_date ?? ""}">
          </div>
          <div>
            <label class="${labelClass}">วันเริ่มต้นของกลุ่มเวรแม่ครัวลำดับที่ 0</label>
            <input id="swal-cook-anchor" type="date" class="${inputClass}" value="${dutySettings?.cook_anchor_date ?? ""}">
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
        const cookAnchor = (document.getElementById("swal-cook-anchor") as HTMLInputElement).value;
        if (!teacherAnchor || !cookAnchor) {
          Swal.showValidationMessage("กรุณาเลือกวันที่ให้ครบถ้วน");
          return null;
        }
        return { teacherAnchor, cookAnchor };
      },
    });

    if (!value) return;
    const res = await fetch("/api/duty-settings", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ teacher_anchor_date: value.teacherAnchor, cook_anchor_date: value.cookAnchor }),
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">รายชื่อแม่ครัว</h3>
                  <div className="flex items-center gap-2">
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
                <p className="text-xs text-muted-foreground mb-3">
                  รองรับ <code className="bg-muted px-1.5 py-0.5 rounded font-mono">.txt</code> (ชื่อแต่ละบรรทัด) หรือ <code className="bg-muted px-1.5 py-0.5 rounded font-mono">.csv</code> (คอลัมน์แรก)
                </p>
                {cooks.length === 0 ? (
                  <div className="text-center py-6 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border font-semibold text-sm">
                    ยังไม่มีรายชื่อแม่ครัว
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cooks.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-sm font-semibold">
                        {c.name}
                        <button onClick={() => openCookForm(c)} className="text-indigo-500 hover:text-indigo-700 cursor-pointer border-0 bg-transparent">แก้ไข</button>
                        <button onClick={() => handleDeleteCook(c)} className="text-red-500 hover:text-red-700 cursor-pointer border-0 bg-transparent">ลบ</button>
                      </div>
                    ))}
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
            </div>
          )}

          {subTab === "settings" && (
            <div className="space-y-4 max-w-xl">
              <div className="card-modern p-5">
                <p className="text-sm text-muted-foreground mb-4">
                  กำหนดวันที่กลุ่มลำดับที่ 0 เริ่มเป็นเวรของสัปดาห์นั้น ระบบจะหมุนไปกลุ่มถัดไปทุกสัปดาห์โดยอัตโนมัติ
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-bold text-foreground">เวรครู เริ่มนับจาก:</span>{" "}
                    {dutySettings ? formatThaiDate(dutySettings.teacher_anchor_date) : "-"}
                  </div>
                  <div>
                    <span className="font-bold text-foreground">เวรแม่ครัว เริ่มนับจาก:</span>{" "}
                    {dutySettings ? formatThaiDate(dutySettings.cook_anchor_date) : "-"}
                  </div>
                </div>
                <button
                  onClick={openDutySettingsForm}
                  className="mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all cursor-pointer"
                >
                  แก้ไขวันเริ่มต้น
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
