import ThemeToggle from "../../components/ThemeToggle";

interface HeaderProps {
  studentName: string;
  studentCode: string;
  classroomName: string;
  userEmail?: string | null;
  onConnectGoogle: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
}

export default function Header({
  studentName,
  studentCode,
  classroomName,
  userEmail,
  onConnectGoogle,
  onChangePassword,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-1 ring-border shadow-sm">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-foreground text-sm leading-tight truncate">{studentName}</div>
            <div className="text-xs text-muted-foreground font-medium">รหัส {studentCode} · ห้อง {classroomName || "—"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle className="!h-9 !w-9" />
          <button
            onClick={onConnectGoogle}
            title={userEmail ? `เชื่อมต่ออีเมล: ${userEmail}` : "เชื่อมต่ออีเมล Google"}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${userEmail ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10" : "text-muted-foreground border-border bg-card hover:text-foreground hover:bg-muted"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onChangePassword}
            title="เปลี่ยนรหัสผ่าน"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border bg-card"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-2 rounded-xl transition-colors border border-rose-100 dark:border-rose-500/30"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
}
