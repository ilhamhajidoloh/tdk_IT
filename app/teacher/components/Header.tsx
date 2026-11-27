"use client";

import { Mail, KeyRound, LogOut, User, Shield, GraduationCap } from "lucide-react";
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
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Logo + Teacher Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-1 ring-border bg-muted shadow-xs">
            <SchoolLogo school={school} schoolKey={schoolId} className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-foreground text-sm sm:text-[15px] leading-tight truncate">
                {teacherName || "ครู"}
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary shrink-0">
                <GraduationCap className="w-3 h-3" />
                ครูผู้สอน
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-medium truncate mt-0.5">
              {school?.name ? (
                <span>
                  {school.name}
                  {homeroomClassName && (
                    <span className="hidden sm:inline text-subtle-foreground"> · ประจำชั้น {homeroomClassName}</span>
                  )}
                </span>
              ) : homeroomClassName ? (
                `ครูประจำชั้น · ${homeroomClassName}`
              ) : (
                "ระบบจัดการคะแนน"
              )}
            </div>
          </div>
        </div>

        {/* Center: Grading Status Pill */}
        <div
          className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${
            isGradingActive
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isGradingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          {isGradingActive ? `เปิดบันทึก · เทอม ${term}` : "ปิดบันทึก · นอกช่วงเวลา"}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isCoAdmin && (
            <button
              type="button"
              onClick={() => router.push("/admin")}
              title="สลับไปยังหน้าระบบแอดมิน (Co-admin Portal)"
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 h-9 px-2.5 sm:px-3 rounded-xl transition-colors border border-amber-500/25"
            >
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden lg:inline">หน้าระบบแอดมิน</span>
            </button>
          )}

          <ThemeToggle className="!h-9 !w-9 !rounded-xl" />

          <button
            type="button"
            onClick={() => router.push("/teacher/profile")}
            title="โปรไฟล์ของฉัน"
            aria-label="โปรไฟล์ของฉัน"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border bg-card"
          >
            <User className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onConnectGoogle}
            title={userEmail ? `เชื่อมต่ออีเมลแล้ว: ${userEmail}` : "เชื่อมต่อบัญชีอีเมล"}
            aria-label="เชื่อมต่อบัญชีอีเมล"
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${
              userEmail
                ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15"
                : "text-muted-foreground border-border bg-card hover:text-foreground hover:bg-muted"
            }`}
          >
            <Mail className="w-4 h-4" />
            {userEmail && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={onChangePassword}
            title="เปลี่ยนรหัสผ่าน"
            aria-label="เปลี่ยนรหัสผ่าน"
            className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border bg-card"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 h-9 px-2.5 sm:px-3.5 rounded-xl transition-colors border border-rose-500/20"
          >
            <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
}
