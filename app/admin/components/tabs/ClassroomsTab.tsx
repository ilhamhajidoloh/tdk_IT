"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  X,
  Plus,
  MoreHorizontal,
  MoreVertical,
  Users,
  UserPlus,
  UserCheck,
  Pencil,
  Trash2,
  Download,
  Upload,
  Copy,
  FileSpreadsheet,
  LayoutGrid,
  List,
  ChevronDown,
  Building2,
} from "lucide-react";
import { type SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import PaginationBar, { usePagination } from "../PaginationBar";
import PermissionGate from "@/app/components/PermissionGate";

interface ClassroomItem {
  id: string;
  name: string;
  name_thai?: string | null;
  name_rumi?: string | null;
  name_jawi?: string | null;
  setting_id?: number | null;
  student_count?: number | null;
  homeroom_teacher_ids?: string[];
  homeroom_teacher_names?: string[];
}

interface ClassroomsTabProps<T extends ClassroomItem = ClassroomItem> {
  settingsList: SystemSetting[];
  selectedSettingId: number | null;
  setSelectedSettingId: (id: number) => void;
  setSelectedClassroomIds: React.Dispatch<React.SetStateAction<string[]>>;
  loadClassrooms: (settingId: number, token: string) => void;
  token: string | null;
  classrooms: T[];
  selectedClassroomIds: string[];
  classroomFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImportClassrooms: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadClassroomTemplate: () => void;
  handleOpenExportScoreModal: (classroomId?: string) => void;
  handleOpenCopyModal: () => void;
  handleBulkDeleteClassrooms: () => void;
  handleAddClassroom: () => void;
  handleOpenAssignModal: (classroom: T) => void;
  handleEditClassroom: (classroom: T) => void;
  handleDeleteClassroom: (id: string, name: string) => void;
  handleOpenHomeroomTeacherModal: (classroom: T) => void;
}

type FilterMode = "all" | "active" | "empty";
type ViewMode = "table" | "grid";

function getAltNames(c: ClassroomItem): string[] {
  const seen = new Set<string>([c.name.trim().toLowerCase()]);
  const result: string[] = [];
  for (const val of [c.name_thai, c.name_rumi, c.name_jawi]) {
    const trimmed = val?.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      result.push(trimmed);
    }
  }
  return result;
}

export default function ClassroomsTab<T extends ClassroomItem = ClassroomItem>({
  settingsList,
  selectedSettingId,
  setSelectedSettingId,
  setSelectedClassroomIds,
  loadClassrooms,
  token,
  classrooms,
  selectedClassroomIds,
  classroomFileInputRef,
  handleImportClassrooms,
  handleDownloadClassroomTemplate,
  handleOpenExportScoreModal,
  handleOpenCopyModal,
  handleBulkDeleteClassrooms,
  handleAddClassroom,
  handleOpenAssignModal,
  handleEditClassroom,
  handleDeleteClassroom,
  handleOpenHomeroomTeacherModal,
}: ClassroomsTabProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-classroom-menu]")) {
        setOpenMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setToolsMenuOpen(false);
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const stats = useMemo(() => {
    let activeCount = 0;
    let emptyCount = 0;
    let totalStudents = 0;
    for (const c of classrooms) {
      const count = c.student_count ?? 0;
      totalStudents += count;
      if (count > 0) activeCount++;
      else emptyCount++;
    }
    return { activeCount, emptyCount, totalStudents };
  }, [classrooms]);

  const filteredClassrooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return classrooms.filter((c) => {
      const hasStudents = (c.student_count ?? 0) > 0;
      if (filterMode === "active" && !hasStudents) return false;
      if (filterMode === "empty" && hasStudents) return false;
      if (!q) return true;
      const inName = c.name.toLowerCase().includes(q);
      const inAlt = [c.name_thai, c.name_rumi, c.name_jawi].some((n) =>
        n?.toLowerCase().includes(q)
      );
      const inTeachers = c.homeroom_teacher_names?.some((t) =>
        t.toLowerCase().includes(q)
      );
      return inName || inAlt || inTeachers;
    });
  }, [classrooms, searchQuery, filterMode]);

  const {
    paginatedItems: paginatedClassrooms,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
  } = usePagination(filteredClassrooms, 5);

  const allFilteredSelected =
    filteredClassrooms.length > 0 &&
    filteredClassrooms.every((c) => selectedClassroomIds.includes(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredClassrooms.map((c) => c.id));
      setSelectedClassroomIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const merged = new Set([
        ...selectedClassroomIds,
        ...filteredClassrooms.map((c) => c.id),
      ]);
      setSelectedClassroomIds(Array.from(merged));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedClassroomIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const renderOverflowMenu = (c: T, openUpward = false) => {
    const hasStudents = (c.student_count ?? 0) > 0;
    const isOpen = openMenuId === c.id;

    return (
      <PermissionGate anyOf={["scores.reports", "classrooms.edit", "classrooms.delete"]}>
        <div className="relative" data-classroom-menu>
          <button
            type="button"
            onClick={() => setOpenMenuId(isOpen ? null : c.id)}
            aria-label={`ตัวเลือกเพิ่มเติมของห้อง ${c.name}`}
            aria-expanded={isOpen}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border-0"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isOpen && (
            <div
              className={`absolute right-0 z-30 w-44 rounded-xl bg-card border border-border shadow-lg py-1.5 animate-fade-in ${
                openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
              }`}
            >
              {hasStudents && (
                <PermissionGate permission="scores.reports">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      handleOpenExportScoreModal(c.id);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    ส่งออกคะแนน
                  </button>
                </PermissionGate>
              )}
              <PermissionGate permission="classrooms.edit">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuId(null);
                    handleEditClassroom(c);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  แก้ไขชั้นเรียน
                </button>
              </PermissionGate>
              <PermissionGate permission="classrooms.delete">
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuId(null);
                    handleDeleteClassroom(c.id, c.name);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบชั้นเรียน
                </button>
              </PermissionGate>
            </div>
          )}
        </div>
      </PermissionGate>
    );
  };

  return (
    <div className="p-6 md:p-8">
      <SectionHeader
        icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M4 21h16M9 7h1m4 0h1m-6 4h1m4 0h1m-5 9v-4a1 1 0 011-1h1a1 1 0 011 1v4"
        color="purple"
        title="จัดการชั้นเรียน"
        subtitle="จัดการห้องเรียน ครูประจำชั้น และรายชื่อนักเรียนตามปีการศึกษา"
        count={classrooms.length}
        countLabel="ห้อง"
      >
        <PermissionGate permission="classrooms.import">
          <input
            type="file"
            ref={classroomFileInputRef}
            className="hidden"
            accept=".xlsx, .xls, .csv"
            onChange={handleImportClassrooms}
          />
        </PermissionGate>

        {/* Secondary Tools Dropdown */}
        <PermissionGate anyOf={["classrooms.import", "classrooms.create", "scores.reports"]}>
          <div className="relative" ref={toolsMenuRef}>
            <button
              type="button"
              onClick={() => setToolsMenuOpen((v) => !v)}
              aria-expanded={toolsMenuOpen}
              className="bg-card border border-border text-foreground hover:bg-muted px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              <span>เครื่องมือ</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                  toolsMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {toolsMenuOpen && (
              <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-30 w-56 max-w-[calc(100vw-2rem)] rounded-xl bg-card border border-border shadow-lg py-1.5 animate-fade-in">
                <PermissionGate permission="classrooms.create">
                  <button
                    type="button"
                    onClick={() => {
                      setToolsMenuOpen(false);
                      handleOpenCopyModal();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    คัดลอกชั้นเรียนจากเทอมอื่น
                  </button>
                </PermissionGate>
                <PermissionGate permission="scores.reports">
                  <button
                    type="button"
                    onClick={() => {
                      setToolsMenuOpen(false);
                      handleOpenExportScoreModal();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    ส่งออกคะแนนชั้นเรียน
                  </button>
                </PermissionGate>
                <PermissionGate permission="classrooms.import">
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setToolsMenuOpen(false);
                      classroomFileInputRef.current?.click();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    นำเข้าชั้นเรียน (Excel)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setToolsMenuOpen(false);
                      handleDownloadClassroomTemplate();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <Download className="w-4 h-4" />
                    ดาวน์โหลดเทมเพลต Excel
                  </button>
                </PermissionGate>
              </div>
            )}
          </div>
        </PermissionGate>

        {/* Primary CTA */}
        <PermissionGate permission="classrooms.create">
          <button
            type="button"
            onClick={handleAddClassroom}
            disabled={!selectedSettingId}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 border-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            เพิ่มชั้นเรียน
          </button>
        </PermissionGate>
      </SectionHeader>

      {/* Term Selector */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSettingId}
        onSelect={(id) => {
          setSelectedSettingId(id);
          setSelectedClassroomIds([]);
          setSearchQuery("");
          setFilterMode("all");
          if (token) loadClassrooms(id, token);
        }}
      />

      {/* Empty States */}
      {!selectedSettingId ? (
        <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
          <Building2 className="w-8 h-8 mx-auto mb-2.5 opacity-40" />
          <div className="text-sm font-semibold">กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน</div>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
          <Building2 className="w-8 h-8 mx-auto mb-2.5 opacity-40" />
          <div className="text-sm font-semibold">
            ยังไม่มีชั้นเรียนในเทอมนี้ กด &quot;เพิ่มชั้นเรียน&quot; เพื่อเริ่มต้น
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up">
          {/* Toolbar: Search, Filter, Summary & View Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาห้อง หรือครูประจำชั้น..."
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

              {/* Filter Pills (only show when there are both active & empty rooms) */}
              {stats.emptyCount > 0 && (
                <div className="inline-flex items-center p-1 rounded-xl bg-muted border border-border">
                  {(
                    [
                      { key: "all", label: "ทั้งหมด", count: classrooms.length },
                      { key: "active", label: "มีนักเรียน", count: stats.activeCount },
                      { key: "empty", label: "ห้องว่าง", count: stats.emptyCount },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilterMode(item.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border-0 ${
                        filterMode === item.key
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground bg-transparent"
                      }`}
                    >
                      {item.label}{" "}
                      <span className="opacity-70">{item.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Total students + View Toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/70">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>นักเรียนรวม</span>
                <span className="text-foreground font-bold">
                  {stats.totalStudents.toLocaleString()}
                </span>
                <span>คน</span>
              </div>

              <div className="hidden md:inline-flex items-center p-1 rounded-xl bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  title="มุมมองตาราง"
                  aria-label="มุมมองตาราง"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer border-0 ${
                    viewMode === "table"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-transparent"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="มุมมองการ์ด"
                  aria-label="มุมมองการ์ด"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer border-0 ${
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-transparent"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Contextual Bulk Selection Bar */}
          {selectedClassroomIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-red-50/80 dark:bg-red-500/10 border border-red-200/80 dark:border-red-500/30">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-bold text-red-700 dark:text-red-300">
                  เลือกแล้ว {selectedClassroomIds.length} ห้อง
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedClassroomIds([])}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground underline cursor-pointer border-0 bg-transparent"
                >
                  ยกเลิกทั้งหมด
                </button>
              </div>
              <PermissionGate permission="classrooms.delete">
                <button
                  type="button"
                  onClick={handleBulkDeleteClassrooms}
                  className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 border-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบที่เลือก ({selectedClassroomIds.length})
                </button>
              </PermissionGate>
            </div>
          )}

          {/* No search matches */}
          {filteredClassrooms.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-card rounded-2xl border border-border">
              <div className="text-sm font-semibold">ไม่พบชั้นเรียนที่ตรงกับเงื่อนไข</div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterMode("all");
                }}
                className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer border-0 bg-transparent"
              >
                ล้างตัวกรอง
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              {viewMode === "table" && (
                <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                        <th className="py-3 pl-4 pr-2 w-10 rounded-tl-2xl">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAll}
                            aria-label="เลือกชั้นเรียนทั้งหมด"
                            className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer align-middle"
                          />
                        </th>
                        <th className="py-3 px-4">ชั้นเรียน</th>
                        <th className="py-3 px-4">ครูประจำชั้น</th>
                        <th className="py-3 px-4 text-center w-36">นักเรียน</th>
                        <th className="py-3 pl-4 pr-4 text-right w-56 rounded-tr-2xl">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedClassrooms.map((c, idx) => {
                        const hasStudents = (c.student_count ?? 0) > 0;
                        const isSelected = selectedClassroomIds.includes(c.id);
                        const altNames = getAltNames(c);
                        const teachers = c.homeroom_teacher_names ?? [];
                        const openUpward =
                          paginatedClassrooms.length > 2 &&
                          idx >= paginatedClassrooms.length - 2;

                        return (
                          <tr
                            key={c.id}
                            className={`transition-colors ${
                              isSelected
                                ? "bg-red-50/40 dark:bg-red-500/5"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <td className="py-3.5 pl-4 pr-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOne(c.id)}
                                aria-label={`เลือกห้อง ${c.name}`}
                                className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer align-middle"
                              />
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-sm text-foreground">
                                {c.name}
                              </div>
                              {altNames.length > 0 && (
                                <div
                                  className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs"
                                  title={altNames.join(" · ")}
                                >
                                  {altNames.join(" · ")}
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-sm">
                              {teachers.length > 0 ? (
                                <span className="text-foreground font-medium">
                                  {teachers.join(", ")}
                                </span>
                              ) : (
                                <span className="text-subtle-foreground text-xs">
                                  ยังไม่กำหนด
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {hasStudents ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                                  <Users className="w-3 h-3" />
                                  {c.student_count} คน
                                </span>
                              ) : (
                                <span
                                  title="ชั้นเรียนว่าง (ใช้สำหรับตารางเรียนเท่านั้น)"
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25"
                                >
                                  ห้องว่าง
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 pl-4 pr-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <PermissionGate permission="classrooms.manage_students">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssignModal(c)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted transition-colors flex items-center gap-1.5 border border-border/60 cursor-pointer"
                                  >
                                    <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    นักเรียน
                                  </button>
                                </PermissionGate>
                                <PermissionGate permission="classrooms.edit">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenHomeroomTeacherModal(c)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted transition-colors flex items-center gap-1.5 border border-border/60 cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                                    ครูประจำชั้น
                                  </button>
                                </PermissionGate>
                                {renderOverflowMenu(c, openUpward)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Card Grid View (always shown on mobile, or on desktop when grid is selected) */}
              <div
                className={`${
                  viewMode === "grid" ? "grid" : "grid md:hidden"
                } grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}
              >
                {paginatedClassrooms.map((c) => {
                  const hasStudents = (c.student_count ?? 0) > 0;
                  const isSelected = selectedClassroomIds.includes(c.id);
                  const altNames = getAltNames(c);
                  const teachers = c.homeroom_teacher_names ?? [];

                  return (
                    <div
                      key={c.id}
                      className={`bg-card rounded-2xl border p-4 flex flex-col justify-between transition-all hover:shadow-sm ${
                        isSelected
                          ? "border-red-300 dark:border-red-500/40 bg-red-50/30 dark:bg-red-500/5"
                          : "border-border hover:border-indigo-300/70 dark:hover:border-indigo-500/40"
                      }`}
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(c.id)}
                              aria-label={`เลือกห้อง ${c.name}`}
                              className="w-4 h-4 mt-1 rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-base text-foreground truncate">
                                {c.name}
                              </div>
                              {altNames.length > 0 && (
                                <div
                                  className="text-xs text-muted-foreground truncate mt-0.5"
                                  title={altNames.join(" · ")}
                                >
                                  {altNames.join(" · ")}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {hasStudents ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                                <Users className="w-3 h-3" />
                                {c.student_count} คน
                              </span>
                            ) : (
                              <span
                                title="ชั้นเรียนว่าง (ใช้สำหรับตารางเรียนเท่านั้น)"
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25"
                              >
                                ห้องว่าง
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Homeroom Teacher */}
                        <div className="mt-3 pl-6.5 text-xs text-muted-foreground flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="truncate">
                            {teachers.length > 0 ? (
                              <span className="text-foreground font-medium">
                                {teachers.join(", ")}
                              </span>
                            ) : (
                              <span className="text-subtle-foreground">ยังไม่กำหนดครูประจำชั้น</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5 flex-1">
                          <PermissionGate permission="classrooms.manage_students">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(c)}
                              className="flex-1 justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted transition-colors flex items-center gap-1.5 border border-border/60 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              นักเรียน
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="classrooms.edit">
                            <button
                              type="button"
                              onClick={() => handleOpenHomeroomTeacherModal(c)}
                              className="flex-1 justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted transition-colors flex items-center gap-1.5 border border-border/60 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                              ครูประจำชั้น
                            </button>
                          </PermissionGate>
                        </div>
                        {renderOverflowMenu(c)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <PaginationBar
                totalItems={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
                perPage={perPage}
                onPageChange={setCurrentPage}
                onPerPageChange={setPerPage}
                unitLabel="ห้อง"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
