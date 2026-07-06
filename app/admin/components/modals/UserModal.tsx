import { type DBUser, type DBStudent } from "../types";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalMode: "add" | "edit";
  editingUser: DBUser | null;
  validationError: string | null;
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  email: string;
  setEmail: (email: string) => void;
  role: "admin" | "teacher" | "student";
  setRole: (role: "admin" | "teacher" | "student") => void;
  studentId: string;
  setStudentId: (studentId: string) => void;
  homeroomClassroomId: string;
  setHomeroomClassroomId: (id: string) => void;
  classrooms: { id: string; name: string }[];
  students: DBStudent[];
  onSave: () => void;
}

export default function UserModal({
  isOpen,
  onClose,
  modalMode,
  editingUser,
  validationError,
  name,
  setName,
  username,
  setUsername,
  password,
  setPassword,
  email,
  setEmail,
  role,
  setRole,
  studentId,
  setStudentId,
  homeroomClassroomId,
  setHomeroomClassroomId,
  classrooms,
  students,
  onSave,
}: UserModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md transition-opacity duration-300 animate-fade-in-up overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl border border-border shadow-2xl glass-strong w-full max-w-md max-h-[85vh] sm:max-h-[90vh] my-auto overflow-hidden transform transition-all duration-300 scale-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 relative px-5 sm:px-6 py-4 flex items-center gap-4 border-b border-border bg-card">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md text-white bg-gradient-to-br ${
              modalMode === "add" ? "from-indigo-500 to-violet-600" : "from-amber-500 to-orange-600"
            }`}
          >
            {modalMode === "add" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">
              {modalMode === "add" ? "เพิ่มผู้ใช้งานใหม่" : "แก้ไขข้อมูลผู้ใช้งาน"}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {modalMode === "add"
                ? "กรอกรายละเอียดเพื่อสร้างผู้ใช้ใหม่"
                : `กำลังแก้ไขผู้ใช้: ${editingUser?.username}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-full transition-all duration-200 cursor-pointer border-0 bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 sm:px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <svg
                className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          {/* Name Input */}
          {(role === "student" || role === "teacher") && modalMode === "add" && (
            <div className="space-y-1.5 animate-fade-in-up">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                ชื่อ-นามสกุล (Name)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อ นามสกุล"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                />
              </div>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              ชื่อผู้ใช้ (Username) {role === "admin" && <span className="text-red-500 dark:text-red-400">*</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  (role === "student" || role === "teacher") && modalMode === "add"
                    ? "เว้นว่างเพื่อสุ่มอัตโนมัติ"
                    : "เช่น teacher2, s002"
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              รหัสผ่าน (Password) {role === "admin" && <span className="text-red-500 dark:text-red-400">*</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  modalMode === "edit"
                    ? "ปล่อยว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน"
                    : role === "student" || role === "teacher"
                    ? "เว้นว่างเพื่อใช้ค่าเริ่มต้น password123"
                    : "รหัสผ่านสำหรับเข้าใช้งาน"
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              อีเมล (สำหรับเข้าสู่ระบบด้วย Google)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="เช่น user@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
              />
            </div>
          </div>

          {/* Role Select */}
          {modalMode === "add" ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                บทบาทหน้าที่ (Role) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    role === "student"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-400/20"
                      : "border-border bg-muted text-muted-foreground hover:border-border hover:bg-muted"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                      role === "student" ? "bg-emerald-500 text-white" : "bg-border text-muted-foreground"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold leading-none">นักเรียน</span>
                  <span className="text-[9px] opacity-75 mt-0.5">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    role === "teacher"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 shadow-sm ring-2 ring-blue-400/20"
                      : "border-border bg-muted text-muted-foreground hover:border-border hover:bg-muted"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                      role === "teacher" ? "bg-blue-500 text-white" : "bg-border text-muted-foreground"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.2}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 00-2-2m2 2a2 2 0 01-2 2m2 5a2 2 0 01-2 2m0-3a3 3 0 10-6 0 3 3 0 006 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold leading-none">คุณครู</span>
                  <span className="text-[9px] opacity-75 mt-0.5">Teacher</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                บทบาทหน้าที่ (Role)
              </label>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                    role === "admin"
                      ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-500/25"
                      : role === "teacher"
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-500/25"
                      : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/25"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      role === "admin" ? "bg-rose-500" : role === "teacher" ? "bg-blue-500" : "bg-emerald-500"
                    }`}
                  />
                  {role.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Student Fields */}
          {role === "student" && (
            <div className="space-y-1.5 animate-fade-in-up">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                รหัสนักเรียน (Student ID)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 014 0"
                    />
                  </svg>
                </div>
                <input
                  list="student-id-options"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder={modalMode === "add" ? "เว้นว่างเพื่อสุ่มอัตโนมัติ" : "รหัสนักเรียน"}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                />
                <datalist id="student-id-options">
                  {students.map((s) => (
                    <option key={s.id} value={s.student_id}>
                      {s.name}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {/* Teacher Fields */}
          {role === "teacher" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  ห้องประจำชั้น (Homeroom)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <select
                    value={homeroomClassroomId}
                    onChange={(e) => setHomeroomClassroomId(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-muted/50 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">-- ไม่มีห้องประจำชั้น --</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-card border-t border-border flex items-center justify-end gap-2.5 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground hover:text-foreground bg-muted hover:bg-border transition-all cursor-pointer border-0"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onSave}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 text-sm cursor-pointer border-0"
          >
            {modalMode === "add" ? "สร้างผู้ใช้" : "บันทึกการแก้ไข"}
          </button>
        </div>
      </div>
    </div>
  );
}
