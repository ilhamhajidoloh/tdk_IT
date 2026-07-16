"use client";

import { Mail, Key, LogOut } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import { formatThaiDate } from "../../lib/format";
import type { DBUser } from "./types";

interface AdminHeaderProps {
  adminUser: DBUser | null;
  handleConnectGoogle: () => void;
  handleChangePassword: () => void;
  handleLogout: () => void;
}

export default function AdminHeader({
  adminUser,
  handleConnectGoogle,
  handleChangePassword,
  handleLogout,
}: AdminHeaderProps) {
  return (
    <header className="header-gradient shadow-sm sticky top-0 z-20 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl opacity-15 blur-sm" />
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 bg-card relative border border-border/80">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-foreground leading-none gradient-text">
              ระบบแอดมิน
            </h1>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              จัดการโครงสร้างระบบและผู้ใช้งาน
            </p>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-sm font-bold text-foreground">
            สวัสดี, {adminUser?.username || "ผู้ดูแลระบบ"}
          </span>
          <span className="text-xs text-subtle-foreground">
            {formatThaiDate(new Date().toISOString())}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle className="!h-9 !w-9" />

          <button
            onClick={handleConnectGoogle}
            title={
              adminUser?.email
                ? `เชื่อมต่ออีเมล: ${adminUser.email}`
                : "เชื่อมต่ออีเมล Google"
            }
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all shrink-0 border ${
              adminUser?.email
                ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
                : "text-muted-foreground border-border hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:border-indigo-200 dark:border-indigo-500/30"
            }`}
          >
            <Mail className="w-4 h-4" />
          </button>

          <button
            onClick={handleChangePassword}
            title="เปลี่ยนรหัสผ่าน"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:border-indigo-200 dark:border-indigo-500/30 transition-all shrink-0 border border-border"
          >
            <Key className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:bg-rose-500/15 px-3.5 py-2 rounded-xl transition-all shrink-0 border border-rose-100 dark:border-rose-500/25 hover:border-rose-200 dark:border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
}
