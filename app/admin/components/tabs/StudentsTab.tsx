"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Shuffle,
  Pencil,
  ChevronDown,
  Users,
  Building2,
} from "lucide-react";
import { type DBStudent, type SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import PaginationBar, { usePagination } from "../PaginationBar";
import Swal from "sweetalert2";
import PermissionGate from "@/app/components/PermissionGate";

interface StudentsTabProps {
  settingsList: SystemSetting[];
  selectedSettingId: number | null;
  setSelectedSettingId: (id: number) => void;
  loadClassrooms: (settingId: number, token: string) => void;
  loadStudents: (settingId: number, token: string) => void;
  token: string | null;
  filteredStudents: DBStudent[];
  studentFilterClassroomId: string;
  setStudentFilterClassroomId: (id: string) => void;
  classrooms: {
    id: string;
    name: string;
    name_thai?: string | null;
    name_rumi?: string | null;
    name_jawi?: string | null;
    student_count?: number | null;
  }[];
  exportLanguage: "th" | "ms-rumi" | "ms-jawi";
  setExportLanguage: (lang: "th" | "ms-rumi" | "ms-jawi") => void;
  handleExportStudents: () => void;
  handleExportStudentsExcel: () => void;
  handleRandomStudentNumbers: () => void;
  setStudents: React.Dispatch<React.SetStateAction<DBStudent[]>>;
  handleUpdateStudentNumber: (studentDbId: string, rawValue: string) => void;
  handleEditStudent: (student: DBStudent) => void;
}

const EXPORT_LANG_OPTIONS: { value: "th" | "ms-rumi" | "ms-jawi"; label: string }[] = [
  { value: "th", label: "ไทย" },
  { value: "ms-rumi", label: "Rumi" },
  { value: "ms-jawi", label: "Jawi" },
];

function StatusBadge({ student }: { student: DBStudent }) {
  const st = student.status || "active";
  if (st === "graduated") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        จบการศึกษา{student.graduation_year ? ` (${student.graduation_year})` : ""}
      </span>
    );
  }
  if (st === "resigned") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        ลาออก/จำหน่าย
      </span>
    );
  }
  if (st === "expired") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        สิ้นสุดการจัดเก็บ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-500/25">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
      กำลังศึกษา
    </span>
  );
}

export default function StudentsTab({
  settingsList,
  selectedSettingId,
  setSelectedSettingId,
  loadClassrooms,
  loadStudents,
  token,
  filteredStudents,
  studentFilterClassroomId,
  setStudentFilterClassroomId,
  classrooms,
  exportLanguage,
  setExportLanguage,
  handleExportStudents,
  handleExportStudentsExcel,
  handleRandomStudentNumbers,
  setStudents,
  handleUpdateStudentNumber,
  handleEditStudent,
}: StudentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const activeStudentSetting = settingsList.find((s) => s.id === selectedSettingId);

  const classroomMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classrooms) {
      map.set(c.id, c.name);
    }
    return map;
  }, [classrooms]);

  const activeClassrooms = useMemo(
    () => classrooms.filter((c) => (c.student_count ?? 0) > 0),
    [classrooms]
  );

  const displayedStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredStudents;
    return filteredStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        (s.student_number != null && String(s.student_number).includes(q))
    );
  }, [filteredStudents, searchQuery]);

  const {
    paginatedItems: paginatedStudents,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
  } = usePagination(displayedStudents, 5);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleBatchPromote = async () => {
    const { value: formValues } = await Swal.fire({
      title: "🎓 อนุมัติจบการศึกษาและเลื่อนชั้นปี",
      html: `
        <div style="text-align:left; font-size: 13px; line-height: 1.6;">
          <p style="margin-bottom:8px; color:#555;">
            ระบบจะตรวจจับนักเรียนชั้นจบการศึกษา (เช่น ม.6/ป.6) แล้วปรับสถานะเป็น <b>"จบการศึกษา"</b> อัตโนมัติ<br/>
            ส่วนนักเรียนชั้นอื่นๆ จะถูกเตรียมเลื่อนชั้นปีไปยังระดับถัดไป (เช่น ม.1 -> ม.2)
          </p>
          <label style="font-weight:bold; display:block; margin-top:12px; color:#333;">📅 เลือกวันที่อนุมัติจบการศึกษา:</label>
          <input id="swal-grad-date" type="date" class="swal2-input" value="${new Date().toISOString().split("T")[0]}" style="margin-top:4px; width:85%; font-size:14px;" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "อนุมัติจบการศึกษา & เลื่อนชั้น",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#10b981",
      preConfirm: () => {
        const gradDate = (document.getElementById("swal-grad-date") as HTMLInputElement).value;
        if (!gradDate) {
          Swal.showValidationMessage("กรุณาระบุวันที่จบการศึกษา");
          return false;
        }
        return { gradDate };
      },
    });

    if (formValues && selectedSettingId && token) {
      Swal.showLoading();
      try {
        const res = await fetch("/api/admin/batch-promote", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            current_setting_id: selectedSettingId,
            graduation_date: formValues.gradDate,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "อนุมัติจบการศึกษาสำเร็จ!",
            html: `
              <div style="text-align:left; font-size:13px; line-height:1.8;">
                <p>🎓 นักเรียนที่จบการศึกษา: <b style="color:#10b981;">${data.graduatedCount} คน</b></p>
                <p>⬆️ นักเรียนที่เลื่อนชั้นปี: <b style="color:#6366f1;">${data.promotedCount} คน</b></p>
              </div>
            `,
          });
          loadStudents(selectedSettingId, token);
        } else {
          Swal.fire("เกิดข้อผิดพลาด", data.error || "ไม่สามารถเลื่อนชั้นปีได้", "error");
        }
      } catch {
        Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
      }
    }
  };

  const handleNumberChange = (studentId: string, rawVal: string) => {
    setStudents((prev) =>
      prev.map((item) =>
        item.id === studentId
          ? { ...item, student_number: rawVal === "" ? null : Number(rawVal) }
          : item
      )
    );
  };

  return (
    <div className="p-6 md:p-8">
      <SectionHeader
        icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
        color="green"
        title="จัดการข้อมูลนักเรียน"
        subtitle={
          activeStudentSetting
            ? `ปีการศึกษา ${activeStudentSetting.academic_year} เทอม ${activeStudentSetting.term}`
            : "จัดการรายชื่อ เลขที่ และสถานะนักเรียนในแต่ละชั้นเรียน"
        }
        count={filteredStudents.length}
        countLabel="คน"
      >
        {/* Export Dropdown */}
        <PermissionGate permission="students.export">
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportMenuOpen((v) => !v)}
              aria-expanded={exportMenuOpen}
              className="bg-card border border-border text-foreground hover:bg-muted px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
              <span>ส่งออกรายชื่อ</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                  exportMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {exportMenuOpen && (
              <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-30 w-64 max-w-[calc(100vw-2rem)] rounded-xl bg-card border border-border shadow-lg p-3 space-y-2.5 animate-fade-in">
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">
                    ภาษาเอกสาร
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted border border-border">
                    {EXPORT_LANG_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setExportLanguage(opt.value)}
                        className={`py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-0 ${
                          exportLanguage === opt.value
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground bg-transparent"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportStudents();
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ส่งออกรายชื่อ (เอกสาร)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportStudentsExcel();
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ส่งออกไฟล์ Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </PermissionGate>

        {/* Batch Promote CTA */}
        <PermissionGate permission="students.promote">
          <button
            type="button"
            onClick={handleBatchPromote}
            disabled={!selectedSettingId}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 border-0 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>จบการศึกษา / เลื่อนชั้น</span>
          </button>
        </PermissionGate>
      </SectionHeader>

      {/* Term Selector */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSettingId}
        onSelect={(id) => {
          setSelectedSettingId(id);
          setStudentFilterClassroomId("unassigned");
          setSearchQuery("");
          if (token) {
            loadClassrooms(id, token);
            loadStudents(id, token);
          }
        }}
      />

      {/* Filter & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Classroom Filter */}
          <div className="relative w-full sm:w-56">
            <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="เลือกชั้นเรียน"
              className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all cursor-pointer appearance-none"
              value={studentFilterClassroomId}
              onChange={(e) => setStudentFilterClassroomId(e.target.value)}
            >
              <option value="unassigned">ยังไม่ระบุชั้นเรียน</option>
              {activeClassrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.name_thai && c.name_thai !== c.name ? ` (${c.name_thai})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ-สกุล หรือรหัสนักเรียน..."
              className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="ล้างคำค้นหา"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Count + Random Numbers */}
        <div className="flex items-center gap-2.5">
          {searchQuery && (
            <span className="text-xs font-semibold text-muted-foreground">
              พบ {displayedStudents.length} / {filteredStudents.length} คน
            </span>
          )}
          {filteredStudents.length > 0 && (
            <PermissionGate permission="students.edit">
              <button
                type="button"
                onClick={handleRandomStudentNumbers}
                title="กำหนดเลขที่แบบสุ่ม"
                className="px-3 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Shuffle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>สุ่มเลขที่</span>
              </button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Empty State */}
      {displayedStudents.length === 0 ? (
        <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
          <Users className="w-8 h-8 mx-auto mb-2.5 opacity-40" />
          <div className="text-sm font-semibold">
            {searchQuery ? "ไม่พบนักเรียนที่ตรงกับคำค้นหา" : "ไม่มีข้อมูลนักเรียนในกลุ่มนี้"}
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer border-0 bg-transparent"
            >
              ล้างคำค้นหา
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-x-auto animate-fade-in-up">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                  <th className="py-3 px-4 w-24 text-center">เลขที่</th>
                  <th className="py-3 px-4 w-36">รหัสนักเรียน</th>
                  <th className="py-3 px-4">ชื่อ-สกุล</th>
                  <th className="py-3 px-4 w-36">ห้องเรียน</th>
                  <th className="py-3 px-4 w-44 text-center">สถานะ</th>
                  <th className="py-3 px-4 w-28 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedStudents.map((s) => {
                  const roomName = s.classroom_id ? classroomMap.get(s.classroom_id) : undefined;
                  return (
                    <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          aria-label={`เลขที่ของ ${s.name}`}
                          className="w-14 px-2 py-1 border border-border rounded-lg text-center text-sm font-semibold text-foreground focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-card hover:bg-muted tabular-nums"
                          value={s.student_number ?? ""}
                          placeholder="-"
                          onChange={(e) => handleNumberChange(s.id, e.target.value)}
                          onBlur={(e) => handleUpdateStudentNumber(s.id, e.target.value)}
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-sm text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {s.student_id}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-foreground">
                        {s.name}
                      </td>
                      <td className="py-3 px-4">
                        {roomName ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-semibold">
                            {roomName}
                          </span>
                        ) : (
                          <span className="text-xs text-subtle-foreground">ยังไม่ระบุ</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge student={s} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <PermissionGate permission="students.edit">
                          <button
                            type="button"
                            onClick={() => handleEditStudent(s)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            แก้ไข
                          </button>
                        </PermissionGate>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2.5 animate-fade-in-up">
            {paginatedStudents.map((s) => {
              const roomName = s.classroom_id ? classroomMap.get(s.classroom_id) : undefined;
              return (
                <div
                  key={s.id}
                  className="bg-card rounded-2xl border border-border p-3.5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <input
                        type="number"
                        aria-label={`เลขที่ของ ${s.name}`}
                        placeholder="#"
                        className="w-12 px-1.5 py-1.5 border border-border rounded-lg text-center text-xs font-bold text-foreground focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-muted/40 shrink-0 tabular-nums"
                        value={s.student_number ?? ""}
                        onChange={(e) => handleNumberChange(s.id, e.target.value)}
                        onBlur={(e) => handleUpdateStudentNumber(s.id, e.target.value)}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-foreground truncate">
                          {s.name}
                        </div>
                        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
                          {s.student_id}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge student={s} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border">
                    {roomName ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-semibold">
                        {roomName}
                      </span>
                    ) : (
                      <span className="text-xs text-subtle-foreground">ยังไม่ระบุชั้นเรียน</span>
                    )}

                    <PermissionGate permission="students.edit">
                      <button
                        type="button"
                        onClick={() => handleEditStudent(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        แก้ไข
                      </button>
                    </PermissionGate>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <PaginationBar
              totalItems={totalItems}
              currentPage={currentPage}
              totalPages={totalPages}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={setPerPage}
              unitLabel="คน"
            />
          </div>
        </>
      )}
    </div>
  );
}
