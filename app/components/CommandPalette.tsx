"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from "cmdk";
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  FileText,
  BarChart3,
  Key,
  Mail,
  Palette,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/useAuth";

interface PaletteCommand {
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
  section?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const getCommands = useCallback((): PaletteCommand[] => {
    const baseCommands: PaletteCommand[] = [
      {
        label: "หน้าแรก",
        description: "กลับสู่หน้าหลัก",
        shortcut: "H",
        icon: <Home className="w-4 h-4" />,
        action: () => router.push("/"),
        section: "navigation",
      },
      {
        label: "โหมดมืด/สว่าง",
        description: "สลับธีมสี",
        icon: <Palette className="w-4 h-4" />,
        action: () => {
          const html = document.documentElement;
          const isDark = html.getAttribute("data-theme") === "dark";
          html.setAttribute("data-theme", isDark ? "light" : "dark");
          localStorage.setItem("theme", isDark ? "light" : "dark");
        },
        section: "settings",
      },
      {
        label: "เปลี่ยนรหัสผ่าน",
        description: "อัปเดตรหัสผ่านของคุณ",
        icon: <Key className="w-4 h-4" />,
        action: () => {},
        section: "settings",
      },
      {
        label: "เชื่อมต่อ Google",
        description: "ผูกบัญชี Google เพื่อล็อกอินง่ายขึ้น",
        icon: <Mail className="w-4 h-4" />,
        action: () => {},
        section: "settings",
      },
      {
        label: "ออกจากระบบ",
        description: "Sign out",
        shortcut: "⌘⇧L",
        icon: <LogOut className="w-4 h-4" />,
        action: () => logout(),
        section: "account",
      },
    ];

    if (!user) return baseCommands;

    switch (user.role) {
      case "admin":
        return [
          ...baseCommands,
          {
            label: "แดชบอร์ดผู้ดูแล",
            description: "ภาพรวมระบบ",
            shortcut: "D",
            icon: <LayoutDashboard className="w-4 h-4" />,
            action: () => router.push("/admin"),
            section: "admin",
          },
          {
            label: "จัดการผู้ใช้งาน",
            description: "เพิ่ม/แก้ไข/ลบ ผู้ใช้",
            icon: <Users className="w-4 h-4" />,
            action: () => router.push("/admin"),
            section: "admin",
          },
          {
            label: "จัดการนักเรียน",
            description: "ข้อมูลนักเรียน ทุกชั้นปี",
            icon: <GraduationCap className="w-4 h-4" />,
            action: () => router.push("/admin?tab=students"),
            section: "admin",
          },
          {
            label: "จัดการวิชาเรียน",
            description: "วิชา ครู หน่วยกิต",
            icon: <BookOpen className="w-4 h-4" />,
            action: () => router.push("/admin?tab=subjects"),
            section: "admin",
          },
          {
            label: "ตารางเรียน",
            description: "จัดตารางสอน ทุกชั้น",
            icon: <Calendar className="w-4 h-4" />,
            action: () => router.push("/admin?tab=schedule"),
            section: "admin",
          },
          {
            label: "ส่งออกเกรด",
            description: "Export Excel/PDF",
            icon: <FileText className="w-4 h-4" />,
            action: () => router.push("/admin?tab=export-grades"),
            section: "admin",
          },
          {
            label: "อันดับผลการเรียน",
            description: "อันดับโรงเรียน/ห้องเรียน",
            icon: <BarChart3 className="w-4 h-4" />,
            action: () => router.push("/admin?tab=rankings"),
            section: "admin",
          },
          {
            label: "ตั้งค่าระบบ",
            description: "ปีการศึกษา เทอม วันสอน",
            icon: <Settings className="w-4 h-4" />,
            action: () => router.push("/admin?tab=settings"),
            section: "admin",
          },
        ];

      case "teacher":
        return [
          ...baseCommands,
          {
            label: "แดชบอร์ดครู",
            description: "ภาพรวมวิชา ชั้นเรียน คะแนน",
            shortcut: "D",
            icon: <LayoutDashboard className="w-4 h-4" />,
            action: () => router.push("/teacher"),
            section: "teacher",
          },
          {
            label: "บันทึกคะแนน",
            description: "กรอกคะแนนเก็บ/สอบ",
            icon: <ClipboardList className="w-4 h-4" />,
            action: () => router.push("/teacher?tab=enter"),
            section: "teacher",
          },
          {
            label: "เช็คชื่อนักเรียน",
            description: "บันทึกการมาเรียน",
            icon: <Users className="w-4 h-4" />,
            action: () => router.push("/teacher?tab=attendance"),
            section: "teacher",
          },
          {
            label: "ประเมินคุณลักษณะ",
            description: "อ่าน/คิดวิเคราะห์/เขียน",
            icon: <GraduationCap className="w-4 h-4" />,
            action: () => router.push("/teacher?tab=evaluate"),
            section: "teacher",
          },
          {
            label: "ตารางสอนของฉัน",
            description: "คาบสอน รายสัปดาห์",
            icon: <Calendar className="w-4 h-4" />,
            action: () => router.push("/teacher?tab=schedule"),
            section: "teacher",
          },
          {
            label: "ห้องประจำชั้น",
            description: "นักเรียน GPA อันดับ เกรดเฉลี่ย",
            icon: <BarChart3 className="w-4 h-4" />,
            action: () => router.push("/teacher?tab=homeroom"),
            section: "teacher",
          },
        ];

      case "student":
        return [
          ...baseCommands,
          {
            label: "ข้อมูลของฉัน",
            description: "ภาพรวม GPA ตารางวันนี้",
            shortcut: "D",
            icon: <LayoutDashboard className="w-4 h-4" />,
            action: () => router.push("/student"),
            section: "student",
          },
          {
            label: "ผลการเรียน",
            description: "คะแนน เกรด GPA ทุกวิชา",
            icon: <ClipboardList className="w-4 h-4" />,
            action: () => router.push("/student?tab=grades"),
            section: "student",
          },
          {
            label: "ตารางเรียน",
            description: "คาบเรียน ห้องเรียน ครู",
            icon: <Calendar className="w-4 h-4" />,
            action: () => router.push("/student?tab=schedule"),
            section: "student",
          },
          {
            label: "เฉลี่ยรวมทั้งปี",
            description: "GPA สะสม ทุกเทอม",
            icon: <BarChart3 className="w-4 h-4" />,
            action: () => router.push("/student?tab=yearly-average"),
            section: "student",
          },
          {
            label: "ผลการประเมิน",
            description: "คุณลักษณะ/อ่าน-เขียน",
            icon: <GraduationCap className="w-4 h-4" />,
            action: () => router.push("/student?tab=evaluation"),
            section: "student",
          },
        ];

      default:
        return baseCommands;
    }
  }, [user, router, logout]);

  const commands = getCommands();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <Command
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        <CommandInput placeholder="ค้นหาคำสั่ง... (⌘K)" />
        <CommandList>
          <CommandEmpty>ไม่พบคำสั่ง</CommandEmpty>
          <CommandGroup>
            {commands.map((cmd, idx) => (
              <CommandItem
                key={idx}
                onSelect={() => {
                  cmd.action();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-accent focus:bg-accent rounded-lg cursor-pointer"
              >
                <span className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                  {cmd.icon}
                </span>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-foreground truncate">{cmd.label}</div>
                  {cmd.description && (
                    <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                  )}
                </div>
                {cmd.shortcut && (
                  <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded bg-muted">
                    {cmd.shortcut}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

export function useCommandPalette() {
  return { open: false, setOpen: () => {} };
}
