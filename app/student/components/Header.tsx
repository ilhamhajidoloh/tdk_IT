"use client";

import { Mail, Key, LogOut } from "lucide-react";
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
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={onChangePassword}
            title="เปลี่ยนรหัสผ่าน"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border bg-card"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-2 rounded-xl transition-colors border border-rose-100 dark:border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
}
