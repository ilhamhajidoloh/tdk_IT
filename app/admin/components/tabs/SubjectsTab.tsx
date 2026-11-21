"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Plus,
  Copy,
  BookOpen,
  ArrowUpDown,
  Languages,
  Pencil,
  Trash2,
  ClipboardCheck,
  ChevronUp,
  ChevronDown,
  Save,
  Check,
  User,
  Building2,
} from "lucide-react";
import { type DBSubject, type SystemSetting } from "../types";
import SectionHeader from "../SectionHeader";
import TermSelector from "../TermSelector";
import PaginationBar, { usePagination } from "../PaginationBar";
import PermissionGate from "@/app/components/PermissionGate";
import SubjectMissingScores from "./SubjectMissingScores";

interface SubjectsTabProps {
  settingsList: SystemSetting[];
  selectedSubjectSettingId: number | null;
  handleSelectSubjectSetting: (id: number) => void;
  subjectsList: DBSubject[];
  handleAddSubject: () => void;
  handleOpenCopySubjectsModal: () => void;
  handleEditSubject: (subject: DBSubject) => void;
  handleDeleteSubject: (id: string, name: string) => void;
  token?: string | null;
}

type SubjectSubTab = "list" | "ordering" | "language";
type SubjectTypeFilter = "all" | "main" | "activity";

function formatClassroomsPreview(names?: string[]): { text: string; extra: number; full: string } {
  if (!names || names.length === 0) return { text: "", extra: 0, full: "" };
  const full = names.join(", ");
  if (names.length <= 3) return { text: full, extra: 0, full };
  return {
    text: names.slice(0, 3).join(", "),
    extra: names.length - 3,
    full,
  };
}

export default function SubjectsTab({
  settingsList,
  selectedSubjectSettingId,
  handleSelectSubjectSetting,
  subjectsList,
  handleAddSubject,
  handleOpenCopySubjectsModal,
  handleEditSubject,
  handleDeleteSubject,
  token,
}: SubjectsTabProps) {
  const [subTab, setSubTab] = useState<SubjectSubTab>("list");
  const [scoreSubject, setScoreSubject] = useState<DBSubject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SubjectTypeFilter>("all");

  const selectedSetting = settingsList.find((setting) => setting.id === selectedSubjectSettingId);

  const stats = useMemo(() => {
    let mainCount = 0;
    let activityCount = 0;
    for (const s of subjectsList) {
      if (s.subject_type === "activity") activityCount++;
      else mainCount++;
    }
    return { mainCount, activityCount };
  }, [subjectsList]);

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subjectsList.filter((sub) => {
      if (typeFilter === "main" && sub.subject_type === "activity") return false;
      if (typeFilter === "activity" && sub.subject_type !== "activity") return false;
      if (!q) return true;
      const inName = sub.name.toLowerCase().includes(q);
      const inTeachers =
        sub.teacher_names?.some((t) => t.toLowerCase().includes(q)) ||
        sub.teacher_name?.toLowerCase().includes(q);
      const inRooms = sub.classroom_names?.some((r) => r.toLowerCase().includes(q));
      return Boolean(inName || inTeachers || inRooms);
    });
  }, [subjectsList, searchQuery, typeFilter]);

  const subjectPagination = usePagination(filteredSubjects, 5);

  if (scoreSubject && selectedSetting) {
    return (
      <div className="p-6 md:p-8">
        <SubjectMissingScores
          subject={scoreSubject}
          setting={selectedSetting}
          token={token}
          onBack={() => setScoreSubject(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <SectionHeader
        icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        color="amber"
        title="จัดการวิชาเรียน"
        subtitle="จัดการรายวิชา เรียงลำดับการแสดงผล และคำแปลภาษารายวิชา"
        count={selectedSubjectSettingId && subTab === "list" ? subjectsList.length : undefined}
        countLabel="วิชา"
      >
        {subTab === "list" && (
          <PermissionGate permission="subjects.create">
            <button
              type="button"
              onClick={handleOpenCopySubjectsModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-border bg-card hover:bg-muted text-foreground shadow-sm transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 text-muted-foreground" />
              <span>คัดลอกวิชา</span>
            </button>
            <button
              type="button"
              onClick={handleAddSubject}
              disabled={!selectedSubjectSettingId}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 border-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มวิชาเรียน</span>
            </button>
          </PermissionGate>
        )}
      </SectionHeader>

      {/* Sub-Tab Navigation */}
      <div className="inline-flex w-full sm:w-auto gap-1 mb-5 p-1 bg-muted rounded-xl border border-border overflow-x-auto">
        {(
          [
            { key: "list", label: "รายการวิชา", icon: BookOpen },
            { key: "ordering", label: "เรียงลำดับ", icon: ArrowUpDown },
            { key: "language", label: "คำแปลภาษา", icon: Languages },
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

      {/* Term Selector */}
      <TermSelector
        settingsList={settingsList}
        selectedId={selectedSubjectSettingId}
        onSelect={(id) => {
          setSearchQuery("");
          setTypeFilter("all");
          handleSelectSubjectSetting(id);
        }}
      />

      {/* Tab Content: List */}
      {subTab === "list" && (
        <>
          {!selectedSubjectSettingId ? (
            <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
              <BookOpen className="w-8 h-8 mx-auto mb-2.5 opacity-40" />
              <div className="text-sm font-semibold">กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน</div>
            </div>
          ) : subjectsList.length === 0 ? (
            <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
              <BookOpen className="w-8 h-8 mx-auto mb-2.5 opacity-40" />
              <div className="text-sm font-semibold">
                ยังไม่มีวิชาเรียนในเทอมนี้ กด &quot;เพิ่มวิชาเรียน&quot; เพื่อเริ่มต้น
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in-up">
              {/* Toolbar: Search & Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาวิชา ครู หรือชั้นเรียน..."
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

                  {stats.activityCount > 0 && stats.mainCount > 0 && (
                    <div className="inline-flex items-center p-1 rounded-xl bg-muted border border-border">
                      {(
                        [
                          { key: "all", label: "ทั้งหมด", count: subjectsList.length },
                          { key: "main", label: "วิชาหลัก", count: stats.mainCount },
                          { key: "activity", label: "กิจกรรม", count: stats.activityCount },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setTypeFilter(item.key)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border-0 ${
                            typeFilter === item.key
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground bg-transparent"
                          }`}
                        >
                          {item.label} <span className="opacity-70">{item.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(searchQuery || typeFilter !== "all") && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    แสดง {filteredSubjects.length} / {subjectsList.length} วิชา
                  </span>
                )}
              </div>

              {filteredSubjects.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-card rounded-2xl border border-border">
                  <div className="text-sm font-semibold">ไม่พบวิชาเรียนที่ตรงกับเงื่อนไข</div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("all");
                    }}
                    className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer border-0 bg-transparent"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                          <th className="py-3 px-4">วิชาเรียน</th>
                          <th className="py-3 px-4">ครูผู้สอน</th>
                          <th className="py-3 px-4">ชั้นเรียน</th>
                          <th className="py-3 px-4 text-center w-36">คะแนนเต็ม</th>
                          <th className="py-3 px-4 text-right w-52">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {subjectPagination.paginatedItems.map((sub) => {
                          const hasScore =
                            (Number(sub.midterm_max_score) || 0) +
                              (Number(sub.final_max_score) || 0) >
                            0;
                          const isActivity = sub.subject_type === "activity";
                          const teachersText =
                            sub.teacher_names && sub.teacher_names.length > 0
                              ? sub.teacher_names.join(", ")
                              : sub.teacher_name || "";
                          const rooms = formatClassroomsPreview(sub.classroom_names);

                          return (
                            <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-foreground">
                                    {sub.name}
                                  </span>
                                  {isActivity ? (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25">
                                      กิจกรรม
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                      {Number(sub.credit_hours) || 1} นก.
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-sm">
                                {teachersText ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-foreground font-medium">
                                      {teachersText}
                                    </span>
                                    {sub.teacher_names && sub.teacher_names.length > 1 && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                        สอนรวม
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-subtle-foreground">ยังไม่กำหนด</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-sm">
                                {rooms.text ? (
                                  <div title={rooms.full}>
                                    <span className="text-foreground/90">{rooms.text}</span>
                                    {rooms.extra > 0 && (
                                      <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-semibold">
                                        +{rooms.extra} ห้อง
                                      </span>
                                    )}
                                    {(sub.score_disabled_classroom_ids?.length ?? 0) > 0 && (
                                      <div className="text-[11px] text-subtle-foreground mt-0.5">
                                        ไม่เก็บคะแนน {sub.score_disabled_classroom_ids?.length} ชั้น
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-subtle-foreground">—</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-center text-sm font-semibold tabular-nums">
                                {isActivity && !hasScore ? (
                                  <span className="text-subtle-foreground font-normal text-xs">
                                    ไม่มีคะแนน
                                  </span>
                                ) : (
                                  <span className="text-foreground">
                                    {sub.midterm_max_score ?? 50} / {sub.final_max_score ?? 50}
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center justify-end gap-1.5">
                                  {hasScore && (
                                    <PermissionGate permission="scores.view">
                                      <button
                                        type="button"
                                        onClick={() => setScoreSubject(sub)}
                                        title="เติมคะแนนที่ขาด"
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        เติมคะแนน
                                      </button>
                                    </PermissionGate>
                                  )}
                                  <PermissionGate permission="subjects.edit">
                                    <button
                                      type="button"
                                      onClick={() => handleEditSubject(sub)}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                      แก้ไข
                                    </button>
                                  </PermissionGate>
                                  <PermissionGate permission="subjects.delete">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                      title="ลบวิชาเรียน"
                                      aria-label={`ลบวิชา ${sub.name}`}
                                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-0 bg-transparent cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </PermissionGate>
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
                    {subjectPagination.paginatedItems.map((sub) => {
                      const hasScore =
                        (Number(sub.midterm_max_score) || 0) +
                          (Number(sub.final_max_score) || 0) >
                        0;
                      const isActivity = sub.subject_type === "activity";
                      const teachersText =
                        sub.teacher_names && sub.teacher_names.length > 0
                          ? sub.teacher_names.join(", ")
                          : sub.teacher_name || "";
                      const rooms = formatClassroomsPreview(sub.classroom_names);

                      return (
                        <div
                          key={sub.id}
                          className="bg-card rounded-2xl border border-border p-3.5 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-foreground">{sub.name}</div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {isActivity ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25">
                                    กิจกรรม
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                                    วิชาหลัก · {Number(sub.credit_hours) || 1} นก.
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {isActivity && !hasScore ? (
                                <span className="text-[11px] text-subtle-foreground">ไม่มีคะแนน</span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-muted text-foreground text-xs font-bold tabular-nums">
                                  {sub.midterm_max_score ?? 50} / {sub.final_max_score ?? 50}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              <span className="truncate">
                                {teachersText || (
                                  <span className="text-subtle-foreground">ยังไม่กำหนดครูผู้สอน</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              <span className="truncate">
                                {rooms.text ? (
                                  <>
                                    {rooms.text}
                                    {rooms.extra > 0 && ` (+${rooms.extra} ห้อง)`}
                                  </>
                                ) : (
                                  <span className="text-subtle-foreground">ยังไม่ระบุชั้นเรียน</span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border">
                            <div className="flex items-center gap-1.5 flex-1">
                              <PermissionGate permission="subjects.edit">
                                <button
                                  type="button"
                                  onClick={() => handleEditSubject(sub)}
                                  className="flex-1 justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  แก้ไข
                                </button>
                              </PermissionGate>
                              {hasScore && (
                                <PermissionGate permission="scores.view">
                                  <button
                                    type="button"
                                    onClick={() => setScoreSubject(sub)}
                                    className="flex-1 justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    เติมคะแนน
                                  </button>
                                </PermissionGate>
                              )}
                            </div>
                            <PermissionGate permission="subjects.delete">
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                aria-label={`ลบวิชา ${sub.name}`}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-0 bg-transparent cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <PaginationBar
                    totalItems={subjectPagination.totalItems}
                    currentPage={subjectPagination.currentPage}
                    totalPages={subjectPagination.totalPages}
                    perPage={subjectPagination.perPage}
                    onPageChange={subjectPagination.setCurrentPage}
                    onPerPageChange={subjectPagination.setPerPage}
                    unitLabel="วิชา"
                  />
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Ordering Tab */}
      {subTab === "ordering" && (
        <SubjectOrderingSection
          selectedSubjectSettingId={selectedSubjectSettingId}
          subjectsList={subjectsList}
          token={token}
        />
      )}

      {/* Subject Language Translations Tab */}
      {subTab === "language" && (
        <SubjectLanguageSection
          selectedSubjectSettingId={selectedSubjectSettingId}
          subjectsList={subjectsList}
          token={token}
        />
      )}
    </div>
  );
}

// ===== Subject Ordering Section =====
interface SubjectOrderingSectionProps {
  selectedSubjectSettingId: number | null;
  subjectsList: DBSubject[];
  token?: string | null;
}

function SubjectOrderingSection({
  selectedSubjectSettingId,
  subjectsList,
  token,
}: SubjectOrderingSectionProps) {
  const defaultOrdered = useMemo(
    () =>
      [...subjectsList].sort((a, b) => {
        const orderA = a.sort_order ?? 999;
        const orderB = b.sort_order ?? 999;
        return orderA - orderB || a.name.localeCompare(b.name, "th");
      }),
    [subjectsList]
  );

  const [draft, setDraft] = useState<{ source: DBSubject[]; items: DBSubject[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const orderedSubjects = draft?.source === subjectsList ? draft.items : defaultOrdered;

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...orderedSubjects];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setDraft({ source: subjectsList, items: newList });
  };

  const moveDown = (index: number) => {
    if (index === orderedSubjects.length - 1) return;
    const newList = [...orderedSubjects];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setDraft({ source: subjectsList, items: newList });
  };

  const saveOrder = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const updates = orderedSubjects.map((sub, idx) => ({
        id: sub.id,
        sort_order: idx + 1,
      }));

      const res = await fetch("/api/subjects/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      if (res.ok) {
        const Swal = (await import("sweetalert2")).default;
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          text: "เรียงลำดับวิชาเรียบร้อยแล้ว",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error("Failed to save order");
      }
    } catch {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกลำดับได้", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedSubjectSettingId) {
    return (
      <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
        กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
      </div>
    );
  }

  if (orderedSubjects.length === 0) {
    return (
      <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
        ยังไม่มีวิชาเรียนในเทอมนี้
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card rounded-2xl border border-border">
        <div>
          <div className="font-bold text-foreground text-sm">จัดเรียงลำดับการแสดงผลวิชาเรียน</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            ใช้กำหนดลำดับรายวิชาในใบรายงาน คะแนน และเอกสารต่างๆ ทั่วทั้งระบบ
          </div>
        </div>
        <PermissionGate permission="subjects.reorder">
          <button
            type="button"
            onClick={saveOrder}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer border-0 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "กำลังบันทึก..." : "บันทึกลำดับ"}</span>
          </button>
        </PermissionGate>
      </div>

      <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
        {orderedSubjects.map((sub, idx) => (
          <div
            key={sub.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
              {idx + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate">{sub.name}</span>
                {sub.subject_type === "activity" && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25">
                    กิจกรรม
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {sub.teacher_names?.join(", ") || sub.teacher_name || "ยังไม่กำหนดครูผู้สอน"}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                aria-label={`เลื่อน ${sub.name} ขึ้น`}
                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed text-foreground transition-colors border border-border/60 cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === orderedSubjects.length - 1}
                aria-label={`เลื่อน ${sub.name} ลง`}
                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed text-foreground transition-colors border border-border/60 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Subject Language Section (จัดการคำแปลรายวิชา) =====
interface SubjectLanguageSectionProps {
  selectedSubjectSettingId: number | null;
  subjectsList: DBSubject[];
  token?: string | null;
}

interface TranslationRecord {
  id: string;
  key: string;
  thai: string;
  malay_rumi: string;
  malay_jawi: string;
}

function SubjectLanguageSection({
  selectedSubjectSettingId,
  subjectsList,
  token,
}: SubjectLanguageSectionProps) {
  const [translations, setTranslations] = useState<TranslationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [editingSubjectName, setEditingSubjectName] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ thai: "", malay_rumi: "", malay_jawi: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTranslations = async (authToken: string): Promise<TranslationRecord[] | null> => {
    try {
      const res = await fetch("/api/translations", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        return await res.json();
      }
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

  const getTranslationForSubject = (subjectName: string) => {
    const trimmed = subjectName.trim().toLowerCase();
    return translations.find(
      (t) =>
        t.key.trim().toLowerCase() === trimmed ||
        t.key.trim().toLowerCase() === `subj_${trimmed}` ||
        t.thai.trim().toLowerCase() === trimmed ||
        t.malay_rumi.trim().toLowerCase() === trimmed ||
        t.malay_jawi.trim().toLowerCase() === trimmed
    );
  };

  const handleStartEdit = (subjectName: string) => {
    const existing = getTranslationForSubject(subjectName);

    setEditingSubjectName(subjectName);
    setEditForm({
      thai: existing?.thai || (/^[ก-๙]/.test(subjectName) ? subjectName : ""),
      malay_rumi: existing?.malay_rumi || (/^[a-zA-Z]/.test(subjectName) ? subjectName : ""),
      malay_jawi: existing?.malay_jawi || (/^[\u0600-\u06FF]/.test(subjectName) ? subjectName : ""),
    });
  };

  const handleSaveTranslation = async (subjectName: string) => {
    if (!token) return;
    try {
      const trimmedKey = subjectName.trim();
      const res = await fetch("/api/translations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: trimmedKey,
          thai: editForm.thai.trim(),
          malay_rumi: editForm.malay_rumi.trim(),
          malay_jawi: editForm.malay_jawi.trim(),
        }),
      });

      if (res.ok) {
        const refreshed = await fetchTranslations(token);
        if (refreshed) setTranslations(refreshed);
        setEditingSubjectName(null);
        const Swal = (await import("sweetalert2")).default;
        Swal.fire({
          icon: "success",
          title: "บันทึกคำแปลเรียบร้อย",
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        throw new Error("Failed to save translation");
      }
    } catch {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกคำแปลได้", "error");
    }
  };

  const filteredSubjects = useMemo(
    () =>
      subjectsList.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [subjectsList, searchTerm]
  );

  const langPagination = usePagination(filteredSubjects, 5);

  if (!selectedSubjectSettingId) {
    return (
      <div className="text-center py-14 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
        กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-14 text-subtle-foreground text-sm font-semibold">
        กำลังโหลดข้อมูลคำแปลรายวิชา...
      </div>
    );
  }

  const renderStatusBadge = (completedCount: number) => {
    if (completedCount === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/25">
          ครบ 3 ภาษา
        </span>
      );
    }
    if (completedCount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25">
          {completedCount}/3 ภาษา
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
        ยังไม่แปล
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อวิชา..."
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
        <span className="text-xs font-semibold text-muted-foreground">
          ทั้งหมด {filteredSubjects.length} วิชา
        </span>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-12 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border text-sm font-semibold">
          ไม่พบวิชาเรียนในเทอมนี้
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-xs font-bold text-muted-foreground">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">ชื่อวิชาในระบบ</th>
                  <th className="py-3 px-4">ภาษาไทย</th>
                  <th className="py-3 px-4">Rumi</th>
                  <th className="py-3 px-4">Jawi</th>
                  <th className="py-3 px-4 text-center w-28">สถานะ</th>
                  <th className="py-3 px-4 text-right w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {langPagination.paginatedItems.map((sub, idx) => {
                  const rowNum =
                    langPagination.perPage === 0
                      ? idx + 1
                      : (langPagination.currentPage - 1) * langPagination.perPage + idx + 1;
                  const trans = getTranslationForSubject(sub.name);
                  const isEditing = editingSubjectName === sub.name;
                  const completedCount =
                    (trans?.thai?.trim() ? 1 : 0) +
                    (trans?.malay_rumi?.trim() ? 1 : 0) +
                    (trans?.malay_jawi?.trim() ? 1 : 0);

                  return (
                    <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground tabular-nums">
                        {rowNum}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        {sub.name}
                        {sub.subject_type === "activity" && (
                          <span className="ml-2 text-[10px] bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold">
                            กิจกรรม
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.thai}
                            onChange={(e) => setEditForm({ ...editForm, thai: e.target.value })}
                            placeholder="ภาษาไทย"
                            className="w-full px-2.5 py-1.5 border border-indigo-300 dark:border-indigo-500/40 bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                        ) : (
                          <span className="text-foreground">
                            {trans?.thai || <span className="text-subtle-foreground">—</span>}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.malay_rumi}
                            onChange={(e) =>
                              setEditForm({ ...editForm, malay_rumi: e.target.value })
                            }
                            placeholder="Rumi"
                            className="w-full px-2.5 py-1.5 border border-indigo-300 dark:border-indigo-500/40 bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                        ) : (
                          <span className="text-foreground">
                            {trans?.malay_rumi || <span className="text-subtle-foreground">—</span>}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            dir="rtl"
                            value={editForm.malay_jawi}
                            onChange={(e) =>
                              setEditForm({ ...editForm, malay_jawi: e.target.value })
                            }
                            placeholder="Jawi"
                            className="w-full px-2.5 py-1.5 border border-indigo-300 dark:border-indigo-500/40 bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 text-right"
                          />
                        ) : (
                          <span className="text-foreground" dir="rtl">
                            {trans?.malay_jawi || <span className="text-subtle-foreground">—</span>}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{renderStatusBadge(completedCount)}</td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveTranslation(sub.name)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors border-0 cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              บันทึก
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubjectName(null)}
                              className="px-2.5 py-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-lg text-xs font-semibold transition-colors border-0 cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <PermissionGate permission="subjects.translations">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(sub.name)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              แก้ไข
                            </button>
                          </PermissionGate>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2.5">
            {langPagination.paginatedItems.map((sub) => {
              const trans = getTranslationForSubject(sub.name);
              const isEditing = editingSubjectName === sub.name;
              const completedCount =
                (trans?.thai?.trim() ? 1 : 0) +
                (trans?.malay_rumi?.trim() ? 1 : 0) +
                (trans?.malay_jawi?.trim() ? 1 : 0);

              return (
                <div
                  key={sub.id}
                  className="bg-card rounded-2xl border border-border p-3.5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sm text-foreground">{sub.name}</div>
                    <div className="shrink-0">{renderStatusBadge(completedCount)}</div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          ภาษาไทย
                        </label>
                        <input
                          type="text"
                          value={editForm.thai}
                          onChange={(e) => setEditForm({ ...editForm, thai: e.target.value })}
                          placeholder="ภาษาไทย"
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
                          onChange={(e) =>
                            setEditForm({ ...editForm, malay_rumi: e.target.value })
                          }
                          placeholder="Rumi"
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
                          onChange={(e) =>
                            setEditForm({ ...editForm, malay_jawi: e.target.value })
                          }
                          placeholder="Jawi"
                          className="w-full px-3 py-1.5 border border-border bg-card rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 text-right"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveTranslation(sub.name)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors border-0 cursor-pointer"
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSubjectName(null)}
                          className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-semibold transition-colors border-0 cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground shrink-0">ไทย</span>
                          <span className="text-foreground font-medium text-right truncate">
                            {trans?.thai || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground shrink-0">Rumi</span>
                          <span className="text-foreground font-medium text-right truncate">
                            {trans?.malay_rumi || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground shrink-0">Jawi</span>
                          <span className="text-foreground font-medium text-right truncate" dir="rtl">
                            {trans?.malay_jawi || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border flex justify-end">
                        <PermissionGate permission="subjects.translations">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(sub.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/60 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            แก้ไขคำแปล
                          </button>
                        </PermissionGate>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <PaginationBar
            totalItems={langPagination.totalItems}
            currentPage={langPagination.currentPage}
            totalPages={langPagination.totalPages}
            perPage={langPagination.perPage}
            onPageChange={langPagination.setCurrentPage}
            onPerPageChange={langPagination.setPerPage}
            unitLabel="วิชา"
          />
        </>
      )}
    </div>
  );
}
