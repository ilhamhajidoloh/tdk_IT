"use client";

import { ShieldCheck, BookOpen, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/app/lib/hooks/usePermissions";

export default function PermissionBanner() {
  const { isCoAdmin, isFullAdmin, activePermissionsCount } = usePermissions();

  if (!isCoAdmin || isFullAdmin) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/15 border border-amber-500/30 p-4 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md ring-2 ring-white/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Co-Admin Portal
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                ได้รับอนุญาต {activePermissionsCount} สิทธิ์
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground mt-0.5">
              คุณกำลังใช้งานในฐานะ <span className="text-amber-600 dark:text-amber-400 font-extrabold">ผู้ช่วยผู้ดูแลระบบ (Co-admin)</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              ระบบแสดงเฉพาะเมนูและข้อมูลที่คุณได้รับอนุญาตจาก Admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-background/80 hover:bg-background text-foreground border border-border shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>ไปหน้าระบบครู</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </div>
      </div>
    </div>
  );
}

