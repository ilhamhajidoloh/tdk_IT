"use client";

import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PermissionDeniedProps {
  title?: string;
  action?: string;
  description?: string;
  showBackHome?: boolean;
}

export default function PermissionDenied({
  title = "ไม่มีสิทธิ์เข้าถึง",
  action,
  description,
  showBackHome = false,
}: PermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border shadow-sm my-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-1">
        {action ? `ไม่มีสิทธิ์สำหรับ: ${action}` : title}
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description || "คุณไม่มีสิทธิ์ในการเข้าถึงหรือดำเนินการในส่วนนี้ หากต้องการใช้งาน กรุณาติดต่อผู้ดูแลระบบหลัก (Admin) เพื่อขอเพิ่มสิทธิ์"}
      </p>

      {showBackHome && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>
      )}
    </div>
  );
}

