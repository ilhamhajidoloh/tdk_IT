"use client";

import { Mail, Key, LogOut, User, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";
import { SchoolLogo, useSchoolBrand } from "../../components/SchoolBrand";

interface HeaderProps {
  teacherName: string;
  homeroomClassName: string | null;
  isGradingActive: boolean;
  term: string;
  userEmail?: string | null;
  onConnectGoogle: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  schoolId?: string | null;
  isCoAdmin?: boolean;
}

export default function Header({
  teacherName,
  homeroomClassName,
  isGradingActive,
  term,
  userEmail,
  onConnectGoogle,
  onChangePassword,
  onLogout,
  schoolId,
  isCoAdmin,
}: HeaderProps) {
  const { school } = useSchoolBrand(schoolId);
  const router = useRouter();

  return (
    <header className="header-gradient border-b border-border sticky top-0 z-20">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo + Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 shadow-lg shadow-indigo-200/30 border border-border ring-2 ring-indigo-100/50">
            <SchoolLogo school={school} schoolKey={schoolId} className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-foreground text-sm leading-tight truncate">
              {teacherName || "ครู"}
            </div>
            <div className="text-xs text-muted-foreground font-medium truncate">
              {school?.name || (homeroomClassName ? `ครูประจำชั้น · ${homeroomClassName}` : "ระบบจัดการคะแนน")}
            </div>
          </div>
        </div>

        {/* Center: Status Badge */}
        <div
          className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${
            isGradingActive
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          {isGradingActive
            ? `เปิดบันทึก · เทอม ${term}`
            : "ปิดบันทึก · นอกช่วงเวลา"}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isCoAdmin && (
            <button
              onClick={() => router.push("/admin")}
              title="สลับไปยังหน้าระบบแอดมิน (Co-admin Portal)"
              className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-xl transition-all border border-amber-500/30 cursor-pointer shadow-2xs"
            >
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">หน้าระบบแอดมิน</span>
            </button>
          )}
          <ThemeToggle className="!h-9 !w-9" />
          <button
            onClick={() => router.push("/teacher/profile")}
            title="โปรไฟล์"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border bg-card"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={onConnectGoogle}
            title={
              userEmail ? `เชื่อมต่ออีเมล: ${userEmail}` : "เชื่อมต่ออีเมล Google"
            }
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${
              userEmail
                ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
                : "text-muted-foreground border-border bg-card hover:text-foreground hover:bg-muted"
            }`}
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
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/20 px-3 py-2 rounded-xl transition-colors border border-rose-200 dark:border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
}
