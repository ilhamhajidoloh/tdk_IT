"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Shield,
  BookOpen,
  GraduationCap,
  Download,
  Upload,
  Plus,
  Trash2,
  Pencil,
  Search,
  X,
  FileText,
  UserMinus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { type DBUser, type DBStudent } from "../types";
import SectionHeader from "../SectionHeader";
import PermissionGate from "@/app/components/PermissionGate";

interface UsersTabProps {
  users: DBUser[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImportUsers: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadTemplate: () => void;
  handleAddUser: () => void;
  selectedUserIds: string[];
  setSelectedUserIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleBulkDeleteUsers: () => void;
  userSubTab: "all" | "admin" | "teacher" | "student";
  setUserSubTab: (tab: "all" | "admin" | "teacher" | "student") => void;
  paginatedUsers: DBUser[];
  adminUser: DBUser | null;
  classrooms: { id: string; name: string }[];
  students: DBStudent[];
  handleEditUser: (user: DBUser) => void;
  handleDeleteUser: (id: string) => void;
  handleResignTeacher: (user: DBUser) => void;
  handleOpenExportScoreModal: (
    classroomId?: string,
    studentId?: string,
    mode?: "classroom" | "individual"
  ) => void;
  filteredUsers: DBUser[];
  userCurrentPage: number;
  setUserCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  usersPerPage: number;
  setUsersPerPage: (limit: number) => void;
  totalUserPages: number;
  onUpdateTeacherColor?: (teacherId: string, color: string) => void;
}

const ROLE_TABS: {
  key: "all" | "admin" | "teacher" | "student";
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "all", label: "ทั้งหมด", shortLabel: "ทั้งหมด", icon: Users },
  { key: "admin", label: "ผู้ดูแลระบบ", shortLabel: "แอดมิน", icon: Shield },
  { key: "teacher", label: "ครูผู้สอน", shortLabel: "ครู", icon: BookOpen },
  { key: "student", label: "นักเรียน", shortLabel: "นักเรียน", icon: GraduationCap },
];

export default function UsersTab({
  users,
  fileInputRef,
  handleImportUsers,
  handleDownloadTemplate,
  handleAddUser,
  selectedUserIds,
  setSelectedUserIds,
  handleBulkDeleteUsers,
  userSubTab,
  setUserSubTab,
  adminUser,
  classrooms,
  students,
  handleEditUser,
  handleDeleteUser,
  handleResignTeacher,
  handleOpenExportScoreModal,
  filteredUsers,
  userCurrentPage,
  setUserCurrentPage,
  usersPerPage,
  setUsersPerPage,
  onUpdateTeacherColor,
}: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Map student_id -> DBStudent for O(1) lookup of real student names & classrooms
  const studentById = useMemo(() => {
    const map = new Map<string, DBStudent>();
    students.forEach((s) => {
      if (s.student_id) map.set(s.student_id, s);
    });
    return map;
  }, [students]);

  const classroomNameById = useMemo(() => {
    const map = new Map<string, string>();
    classrooms.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [classrooms]);

  const getStudentInfo = (u: DBUser) => {
    if (u.role !== "student") return null;
    const student =
      (u.student_id ? studentById.get(u.student_id) : undefined) ||
      studentById.get(u.username);
    if (!student) return null;
    const classroomName = student.classroom_id
      ? classroomNameById.get(student.classroom_id) || null
      : null;
    return { student, classroomName };
  };

  // Search across student name, username, student_id, email, and classroom name
  const searchedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredUsers;
    return filteredUsers.filter((u) => {
      if (u.username.toLowerCase().includes(q)) return true;
      if (u.email?.toLowerCase().includes(q)) return true;
      if (u.student_id?.toLowerCase().includes(q)) return true;
      if (u.role === "student") {
        const student =
          (u.student_id ? studentById.get(u.student_id) : undefined) ||
          studentById.get(u.username);
        if (student?.name.toLowerCase().includes(q)) return true;
        if (student?.classroom_id) {
          const cName = classroomNameById.get(student.classroom_id);
          if (cName?.toLowerCase().includes(q)) return true;
        }
      }
      if (u.role === "teacher" && u.subjects?.some((sub) => sub.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [filteredUsers, searchQuery, studentById, classroomNameById]);

  const effectiveTotalPages = Math.max(1, Math.ceil(searchedUsers.length / usersPerPage));
  const safePage = Math.min(userCurrentPage, effectiveTotalPages);
  const displayUsers = useMemo(
    () => searchedUsers.slice((safePage - 1) * usersPerPage, safePage * usersPerPage),
    [searchedUsers, safePage, usersPerPage]
  );

  const roleCounts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      teacher: users.filter((u) => u.role === "teacher").length,
      student: users.filter((u) => u.role === "student").length,
    }),
    [users]
  );

  const selectableOnPage = displayUsers.filter((u) => u.id !== adminUser?.id);
  const allOnPageSelected =
    selectableOnPage.length > 0 &&
    selectableOnPage.every((u) => selectedUserIds.includes(u.id));

  const toggleSelectAllPage = (checked: boolean) => {
    const pageIds = selectableOnPage.map((u) => u.id);
    if (checked) {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const toggleSelectOne = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const renderRoleBadge = (role: DBUser["role"]) => {
    if (role === "admin" || role === "super_admin") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
          ผู้ดูแลระบบ
        </span>
      );
    }
    if (role === "teacher") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
          ครูผู้สอน
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
        นักเรียน
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 animate-fade-in-up">
      <SectionHeader
        icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        color="indigo"
        title="ผู้ใช้งานระบบ"
        subtitle="จัดการบัญชีผู้ดูแล ครู และนักเรียน"
        count={users.length}
        countLabel="บัญชี"
      >
        <PermissionGate permission="users.import">
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportUsers}
          />
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>เทมเพลต</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>นำเข้าไฟล์</span>
          </button>
        </PermissionGate>
        <PermissionGate permission="users.create">
          <button
            type="button"
            onClick={handleAddUser}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-sm border-0 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มผู้ใช้ใหม่</span>
          </button>
        </PermissionGate>
      </SectionHeader>

      {/* Role Sub-tabs + Quick Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-2 border border-border overflow-x-auto scrollbar-none shrink-0">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = userSubTab === tab.key;
            const count = roleCounts[tab.key];

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setUserSubTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-card text-indigo-600 dark:text-indigo-300 border-border shadow-xs"
                    : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
                  }`}
                />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="pointer-events-none w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setUserCurrentPage(1);
            }}
            placeholder="ค้นหาชื่อนักเรียน, username, รหัส..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-subtle-foreground text-xs sm:text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setUserCurrentPage(1);
              }}
              aria-label="ล้างคำค้นหา"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border-0 bg-transparent cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bulk Delete Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
          <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
            เลือกไว้ {selectedUserIds.length} บัญชี
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedUserIds([])}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-card hover:bg-muted text-foreground border border-border cursor-pointer"
            >
              ยกเลิกการเลือก
            </button>
            <PermissionGate permission="users.delete">
              <button
                type="button"
                onClick={handleBulkDeleteUsers}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold border-0 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบที่เลือก ({selectedUserIds.length})</span>
              </button>
            </PermissionGate>
          </div>
        </div>
      )}

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-2 text-muted-foreground border-b border-border text-xs">
            <tr>
              <th className="px-4 py-3.5 font-bold w-11 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border accent-indigo-600 cursor-pointer"
                  checked={allOnPageSelected}
                  onChange={(e) => toggleSelectAllPage(e.target.checked)}
                />
              </th>
              <th className="px-4 py-3.5 font-bold">ผู้ใช้งาน / ชื่อ-สกุล</th>
              <th className="px-4 py-3.5 font-bold whitespace-nowrap">บทบาท</th>
              <th className="px-4 py-3.5 font-bold">รหัส / ข้อมูลเพิ่มเติม</th>
              <th className="px-4 py-3.5 font-bold text-right whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {displayUsers.map((u) => {
              const studentInfo = getStudentInfo(u);
              const isStudent = u.role === "student";

              return (
                <tr key={u.id} className="hover:bg-surface-2/60 transition-colors align-middle">
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border accent-indigo-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      checked={selectedUserIds.includes(u.id)}
                      disabled={u.id === adminUser?.id}
                      onChange={(e) => toggleSelectOne(u.id, e.target.checked)}
                    />
                  </td>

                  {/* User Name + Username */}
                  <td className="px-4 py-3.5">
                    {isStudent ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">
                            {studentInfo?.student.name || u.username}
                          </span>
                          {studentInfo?.classroomName && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                              {studentInfo.classroomName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span>@{u.username}</span>
                          {u.email && (
                            <>
                              <span className="text-border-strong">•</span>
                              <span className="text-subtle-foreground">{u.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="font-bold text-foreground flex items-center gap-2 flex-wrap">
                          {u.role === "teacher" && (
                            <label
                              className="relative w-3.5 h-3.5 rounded-full inline-flex items-center justify-center border border-black/20 shrink-0 shadow-2xs cursor-pointer hover:scale-125 transition-transform overflow-hidden"
                              style={{ backgroundColor: u.color || "#1d4ed8" }}
                              title="คลิกเพื่อเปลี่ยนสีประจำตัวครู"
                            >
                              <input
                                type="color"
                                value={u.color || "#1d4ed8"}
                                onChange={(e) => onUpdateTeacherColor?.(u.id, e.target.value)}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                              />
                            </label>
                          )}
                          <span>{u.username}</span>
                          {u.role === "teacher" && u.is_clerical && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                              ธุรการ
                            </span>
                          )}
                          {u.status === "resigned" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                              พ้นสภาพ / ลาออก
                            </span>
                          )}
                        </div>
                        {u.email && (
                          <div className="text-xs text-subtle-foreground">{u.email}</div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Role Badge */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {renderRoleBadge(u.role)}
                  </td>

                  {/* Extra Details */}
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {isStudent ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold text-foreground">
                          {u.student_id || "-"}
                        </span>
                        {studentInfo?.student.student_number && (
                          <span className="text-[11px] text-subtle-foreground">
                            (เลขที่ {studentInfo.student.student_number})
                          </span>
                        )}
                      </div>
                    ) : u.role === "teacher" ? (
                      <div className="max-w-xs truncate" title={u.subjects?.join(", ") || "ไม่มีวิชาที่สอน"}>
                        <span className="text-subtle-foreground">สอน: </span>
                        <span className="font-medium text-foreground">
                          {u.subjects && u.subjects.length > 0 ? u.subjects.join(", ") : "-"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-subtle-foreground">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {isStudent && (
                        <button
                          type="button"
                          onClick={() => {
                            const cid = studentInfo?.student.classroom_id || "";
                            handleOpenExportScoreModal(cid, u.student_id || "all", "individual");
                          }}
                          title="พิมพ์ใบรายงานผลการเรียนรายบุคคล"
                          className="p-1.5 rounded-lg text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/15 border-0 bg-transparent cursor-pointer transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <PermissionGate permission="users.edit">
                        <button
                          type="button"
                          onClick={() => handleEditUser(u)}
                          title="แก้ไขผู้ใช้งาน"
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 border-0 bg-transparent cursor-pointer transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </PermissionGate>
                      {u.role === "teacher" && u.status !== "resigned" && (
                        <PermissionGate permission="users.edit">
                          <button
                            type="button"
                            onClick={() => handleResignTeacher(u)}
                            title="บันทึกการลาออก / พ้นสภาพ"
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/15 border-0 bg-transparent cursor-pointer transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                      )}
                      <PermissionGate permission="users.delete">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          title="ลบผู้ใช้งาน"
                          className="p-1.5 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 border-0 bg-transparent cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              );
            })}
            {displayUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-sm font-semibold text-muted-foreground">
                  {searchQuery ? `ไม่พบผู้ใช้งานที่ตรงกับ "${searchQuery}"` : "ไม่มีข้อมูลผู้ใช้งานในหมวดหมู่นี้"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards (< md) */}
      <div className="md:hidden space-y-3">
        {displayUsers.map((u) => {
          const studentInfo = getStudentInfo(u);
          const isStudent = u.role === "student";

          return (
            <article key={u.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-border accent-indigo-600 cursor-pointer disabled:opacity-40 shrink-0"
                  checked={selectedUserIds.includes(u.id)}
                  disabled={u.id === adminUser?.id}
                  onChange={(e) => toggleSelectOne(u.id, e.target.checked)}
                />

                <div className="min-w-0 flex-1 space-y-1">
                  {isStudent ? (
                    <>
                      <div className="font-extrabold text-sm text-foreground leading-snug">
                        {studentInfo?.student.name || u.username}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                        <span>@{u.username}</span>
                        {studentInfo?.classroomName && (
                          <span className="px-1.5 py-0.5 rounded-md font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                            {studentInfo.classroomName}
                          </span>
                        )}
                        {u.student_id && (
                          <span className="font-mono text-subtle-foreground">
                            #{u.student_id}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-extrabold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                        {u.role === "teacher" && (
                          <label
                            className="relative w-3.5 h-3.5 rounded-full inline-flex items-center justify-center border border-black/20 shrink-0 cursor-pointer overflow-hidden"
                            style={{ backgroundColor: u.color || "#1d4ed8" }}
                            title="คลิกเพื่อเปลี่ยนสีประจำตัวครู"
                          >
                            <input
                              type="color"
                              value={u.color || "#1d4ed8"}
                              onChange={(e) => onUpdateTeacherColor?.(u.id, e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                          </label>
                        )}
                        <span className="break-all">{u.username}</span>
                        {u.role === "teacher" && u.is_clerical && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/12 text-amber-700 dark:text-amber-300">
                            ธุรการ
                          </span>
                        )}
                      </div>
                      {u.email && (
                        <div className="text-[11px] text-subtle-foreground break-all">{u.email}</div>
                      )}
                    </>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {renderRoleBadge(u.role)}
                    {u.status === "resigned" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                        พ้นสภาพ / ลาออก
                      </span>
                    )}
                  </div>
                </div>

                {/* Compact Action Icons */}
                <div className="flex items-center gap-1 shrink-0">
                  {isStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        const cid = studentInfo?.student.classroom_id || "";
                        handleOpenExportScoreModal(cid, u.student_id || "all", "individual");
                      }}
                      aria-label="พิมพ์ใบรายงานผลการเรียน"
                      className="p-1.5 rounded-lg text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-0 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <PermissionGate permission="users.edit">
                    <button
                      type="button"
                      onClick={() => handleEditUser(u)}
                      aria-label="แก้ไขผู้ใช้งาน"
                      className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-0 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </PermissionGate>
                  {u.role === "teacher" && u.status !== "resigned" && (
                    <PermissionGate permission="users.edit">
                      <button
                        type="button"
                        onClick={() => handleResignTeacher(u)}
                        aria-label="บันทึกการลาออก"
                        className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-0 cursor-pointer"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGate>
                  )}
                  <PermissionGate permission="users.delete">
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id)}
                      aria-label="ลบผู้ใช้งาน"
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </PermissionGate>
                </div>
              </div>

              {u.role === "teacher" && u.subjects && u.subjects.length > 0 && (
                <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  <span className="font-semibold text-subtle-foreground">วิชาที่สอน: </span>
                  {u.subjects.join(", ")}
                </div>
              )}
            </article>
          );
        })}

        {displayUsers.length === 0 && (
          <div className="text-center py-10 text-sm font-semibold text-muted-foreground bg-surface-2/60 rounded-2xl border border-dashed border-border">
            {searchQuery ? `ไม่พบผู้ใช้งานที่ตรงกับ "${searchQuery}"` : "ไม่มีข้อมูลผู้ใช้งานในหมวดหมู่นี้"}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {searchedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card px-4 py-3 rounded-2xl border border-border">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
            <span>
              แสดง {Math.min((safePage - 1) * usersPerPage + 1, searchedUsers.length)}–
              {Math.min(safePage * usersPerPage, searchedUsers.length)} จาก{" "}
              <strong className="text-foreground">{searchedUsers.length}</strong> รายการ
            </span>
            <span className="flex items-center gap-1.5 sm:border-l sm:border-border sm:pl-3">
              <span>หน้าละ</span>
              <select
                value={usersPerPage}
                onChange={(e) => {
                  setUsersPerPage(Number(e.target.value));
                  setUserCurrentPage(1);
                }}
                className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={searchedUsers.length}>ทั้งหมด</option>
              </select>
            </span>
          </div>

          {effectiveTotalPages > 1 && (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setUserCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={safePage === 1}
                aria-label="หน้าก่อนหน้า"
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: effectiveTotalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === effectiveTotalPages ||
                    (pageNum >= safePage - 1 && pageNum <= safePage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setUserCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border ${
                          safePage === pageNum
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-card text-muted-foreground border-transparent hover:border-border hover:bg-muted"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === safePage - 2 || pageNum === safePage + 2) {
                    return (
                      <span key={pageNum} className="px-1 text-xs text-subtle-foreground">
                        …
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                onClick={() =>
                  setUserCurrentPage((prev) => Math.min(prev + 1, effectiveTotalPages))
                }
                disabled={safePage === effectiveTotalPages}
                aria-label="หน้าถัดไป"
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
