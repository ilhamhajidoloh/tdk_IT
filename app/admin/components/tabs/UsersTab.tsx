import { type DBUser, type DBStudent } from "../types";
import SectionHeader from "../SectionHeader";

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
}

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
  paginatedUsers,
  adminUser,
  classrooms,
  students,
  handleEditUser,
  handleDeleteUser,
  handleOpenExportScoreModal,
  filteredUsers,
  userCurrentPage,
  setUserCurrentPage,
  usersPerPage,
  setUsersPerPage,
  totalUserPages,
}: UsersTabProps) {
  return (
    <div className="p-8">
      <SectionHeader
        icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        color="indigo"
        title="ผู้ใช้งานระบบ"
        subtitle="จัดการบัญชีผู้ดูแล ครู และนักเรียน"
        count={users.length}
        countLabel="บัญชี"
      >
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImportUsers}
        />
        <button
          onClick={handleDownloadTemplate}
          className="bg-card border border-border text-muted-foreground hover:bg-muted px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          โหลดเทมเพลต
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-card border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          นำเข้า (CSV/Excel)
        </button>
        <button
          onClick={handleAddUser}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มผู้ใช้ใหม่
        </button>
        {selectedUserIds.length > 0 && (
          <button
            onClick={handleBulkDeleteUsers}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            ลบที่เลือก ({selectedUserIds.length})
          </button>
        )}
      </SectionHeader>

      {/* Sub-tabs for User Roles */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
        <button
          onClick={() => setUserSubTab("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
            userSubTab === "all"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
              : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/20"
          }`}
        >
          <span>ทั้งหมด</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full font-bold ${
              userSubTab === "all" ? "bg-card/20 text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setUserSubTab("admin")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
            userSubTab === "admin"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
              : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/20"
          }`}
        >
          <span>ผู้ดูแลระบบ (Admin)</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full font-bold ${
              userSubTab === "admin"
                ? "bg-card/20 text-white"
                : "bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-300"
            }`}
          >
            {users.filter((u) => u.role === "admin").length}
          </span>
        </button>
        <button
          onClick={() => setUserSubTab("teacher")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
            userSubTab === "teacher"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
              : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/20"
          }`}
        >
          <span>ครูผู้สอน (Teacher)</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full font-bold ${
              userSubTab === "teacher"
                ? "bg-card/20 text-white"
                : "bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300"
            }`}
          >
            {users.filter((u) => u.role === "teacher").length}
          </span>
        </button>
        <button
          onClick={() => setUserSubTab("student")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
            userSubTab === "student"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
              : "bg-card text-muted-foreground border-border hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/20"
          }`}
        >
          <span>นักเรียน (Student)</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full font-bold ${
              userSubTab === "student"
                ? "bg-card/20 text-white"
                : "bg-green-50 dark:bg-green-950/80 text-green-600 dark:text-green-300"
            }`}
          >
            {users.filter((u) => u.role === "student").length}
          </span>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-semibold w-12 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer"
                  checked={
                    paginatedUsers.filter((u) => u.id !== adminUser?.id).length > 0 &&
                    paginatedUsers
                      .filter((u) => u.id !== adminUser?.id)
                      .every((u) => selectedUserIds.includes(u.id))
                  }
                  onChange={(e) => {
                    const currentPageIds = paginatedUsers
                      .filter((u) => u.id !== adminUser?.id)
                      .map((u) => u.id);
                    if (e.target.checked) {
                      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
                    } else {
                      setSelectedUserIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
                    }
                  }}
                />
              </th>
              <th className="px-6 py-4 font-semibold">Username</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Student ID</th>
              <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedUsers.map((u) => (
              <tr key={u.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    checked={selectedUserIds.includes(u.id)}
                    disabled={u.id === adminUser?.id}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds((prev) => [...prev, u.id]);
                      } else {
                        setSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    {u.username}
                    {u.role === "teacher" && u.is_clerical && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                        ธุรการ
                      </span>
                    )}
                  </div>
                  {u.email && <div className="text-[11px] text-subtle-foreground mt-0.5">{u.email}</div>}
                  {u.role === "teacher" && (
                    <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                      <div>
                        <span className="font-medium">ห้องประจำชั้น:</span>{" "}
                        {classrooms.find((c) => c.id === u.homeroom_classroom_id)?.name || "ไม่มี"}
                      </div>
                      <div>
                        <span className="font-medium">วิชาที่สอน:</span>{" "}
                        {u.subjects && u.subjects.length > 0 ? u.subjects.join(", ") : "ไม่มี"}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-200"
                        : u.role === "teacher"
                        ? "bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-200"
                        : "bg-green-100 dark:bg-green-900/80 text-green-700 dark:text-green-200"
                    }`}
                  >
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{u.student_id || "-"}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleEditUser(u)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer"
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-subtle-foreground bg-muted/50">
                  ไม่มีข้อมูลผู้ใช้งานในหมวดหมู่นี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paginatedUsers.map((u) => (
          <div key={u.id} className="card-modern p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="pt-1 shrink-0">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  checked={selectedUserIds.includes(u.id)}
                  disabled={u.id === adminUser?.id}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUserIds((prev) => [...prev, u.id]);
                    } else {
                      setSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
                    }
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground break-all flex items-center gap-1.5">
                  {u.username}
                  {u.role === "teacher" && u.is_clerical && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 shrink-0">
                      ธุรการ
                    </span>
                  )}
                </div>
                {u.email && <div className="text-[11px] text-subtle-foreground break-all">{u.email}</div>}
                <span
                  className={`inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    u.role === "admin"
                      ? "bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-200"
                      : u.role === "teacher"
                      ? "bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-200"
                      : "bg-green-100 dark:bg-green-900/80 text-green-700 dark:text-green-200"
                  }`}
                >
                  {u.role.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {u.role === "student" && (
                  <button
                    onClick={() => {
                      const studentObj = students.find((s) => s.student_id === u.student_id);
                      const cid = studentObj?.classroom_id || "";
                      handleOpenExportScoreModal(cid, u.student_id || "all", "individual");
                    }}
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 px-2.5 py-1.5 bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:bg-teal-500/15 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer flex items-center gap-1"
                    title="พิมพ์ใบรายงานผลการเรียนรายบุคคล"
                  >
                    📄 ใบรายงาน
                  </button>
                )}
                <button
                  onClick={() => handleEditUser(u)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer"
                >
                  ลบ
                </button>
              </div>
            </div>
            {u.student_id && (
              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                <span className="font-medium">Student ID:</span> {u.student_id}
              </div>
            )}
            {u.role === "teacher" && (
              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border space-y-0.5">
                <div>
                  <span className="font-medium">ห้องประจำชั้น:</span>{" "}
                  {classrooms.find((c) => c.id === u.homeroom_classroom_id)?.name || "ไม่มี"}
                </div>
                <div>
                  <span className="font-medium">วิชาที่สอน:</span>{" "}
                  {u.subjects && u.subjects.length > 0 ? u.subjects.join(", ") : "ไม่มี"}
                </div>
              </div>
            )}
          </div>
        ))}
        {paginatedUsers.length === 0 && (
          <div className="text-center py-8 text-subtle-foreground bg-muted rounded-2xl border border-dashed border-border">
            ไม่มีข้อมูลผู้ใช้งานในหมวดหมู่นี้
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredUsers.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
            <span>
              แสดง {Math.min((userCurrentPage - 1) * usersPerPage + 1, filteredUsers.length)} ถึง{" "}
              {Math.min(userCurrentPage * usersPerPage, filteredUsers.length)} จากทั้งหมด{" "}
              {filteredUsers.length} รายการ
            </span>
            <span className="flex items-center gap-1.5 border-l border-border pl-4">
              <span>แสดงหน้าละ</span>
              <select
                value={usersPerPage}
                onChange={(e) => {
                  setUsersPerPage(Number(e.target.value));
                  setUserCurrentPage(1);
                }}
                className="bg-muted border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all hover:bg-muted"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={filteredUsers.length}>ทั้งหมด</option>
              </select>
              <span>รายการ</span>
            </span>
          </div>

          {totalUserPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setUserCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={userCurrentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors cursor-pointer"
              >
                ก่อนหน้า
              </button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalUserPages }).map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalUserPages ||
                    (pageNum >= userCurrentPage - 1 && pageNum <= userCurrentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setUserCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors cursor-pointer border ${
                          userCurrentPage === pageNum
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-sm"
                            : "bg-card text-muted-foreground border-transparent hover:border-border hover:bg-muted"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === userCurrentPage - 2 || pageNum === userCurrentPage + 2) {
                    return (
                      <span key={pageNum} className="text-subtle-foreground">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setUserCurrentPage((prev) => Math.min(prev + 1, totalUserPages))}
                disabled={userCurrentPage === totalUserPages}
                className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors cursor-pointer"
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
