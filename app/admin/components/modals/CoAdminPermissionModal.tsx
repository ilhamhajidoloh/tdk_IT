"use client";

import { useState, useEffect } from "react";
import {
  X,
  Shield,
  ShieldAlert,
  Check,
  AlertTriangle,
  Sparkles,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  TrendingUp,
  Newspaper,
  BookMarked,
  Clock,
  BarChart3,
  Settings,
  Sliders,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  AdminPermissions,
  CoAdminUser,
  PermissionCategory,
  PermissionAction,
} from "@/app/lib/permissions/types";
import {
  PERMISSION_CATEGORIES,
} from "@/app/lib/permissions/definitions";
import { PERMISSION_PRESETS } from "@/app/lib/permissions/presets";

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users: Users,
  GraduationCap: GraduationCap,
  Building2: Building2,
  BookOpen: BookOpen,
  CalendarDays: CalendarDays,
  ClipboardCheck: ClipboardCheck,
  TrendingUp: TrendingUp,
  Newspaper: Newspaper,
  BookMarked: BookMarked,
  Clock: Clock,
  BarChart3: BarChart3,
  Settings: Settings,
  ShieldAlert: ShieldAlert,
  Sliders: Sliders,
};

interface CoAdminPermissionModalProps {
  open: boolean;
  mode: "add" | "edit";
  targetUser: CoAdminUser | null;
  availableTeachers: CoAdminUser[];
  onClose: () => void;
  onSaved: () => void;
}

export default function CoAdminPermissionModal({
  open,
  mode,
  targetUser,
  availableTeachers,
  onClose,
  onSaved,
}: CoAdminPermissionModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [permissions, setPermissions] = useState<AdminPermissions>({});
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMessage(null);
    setActivePresetId(null);

    if (mode === "edit" && targetUser) {
      setSelectedUserId(targetUser.id);
      setPermissions(targetUser.admin_permissions || {});
    } else {
      // Add mode: pick first non-coadmin teacher if available
      const eligible = availableTeachers.filter((t) => !t.is_co_admin);
      setSelectedUserId(eligible[0]?.id || "");
      setPermissions({});
    }
  }, [open, mode, targetUser, availableTeachers]);

  if (!open) return null;

  const handleToggleAction = (category: PermissionCategory, action: PermissionAction) => {
    setActivePresetId(null);
    setPermissions((prev) => {
      const catObj = { ...(prev[category] || {}) };
      const currentVal = Boolean(catObj[action]);
      if (currentVal) {
        delete catObj[action];
      } else {
        catObj[action] = true;
      }

      const next = { ...prev };
      if (Object.keys(catObj).length === 0) {
        delete next[category];
      } else {
        next[category] = catObj;
      }
      return next;
    });
  };

  const handleToggleCategoryAll = (category: PermissionCategory, selectAll: boolean) => {
    setActivePresetId(null);
    const catDef = PERMISSION_CATEGORIES.find((c) => c.key === category);
    if (!catDef) return;

    setPermissions((prev) => {
      const next = { ...prev };
      if (!selectAll) {
        delete next[category];
      } else {
        const catObj: Partial<Record<PermissionAction, boolean>> = {};
        for (const act of catDef.actions) {
          if (act.permission !== "co_admins.manage") {
            catObj[act.action] = true;
          }
        }
        next[category] = catObj;
      }
      return next;
    });
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = PERMISSION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    setPermissions(JSON.parse(JSON.stringify(preset.permissions)));
  };

  const countGranted = () => {
    let count = 0;
    for (const cat of Object.values(permissions)) {
      if (!cat) continue;
      for (const granted of Object.values(cat)) {
        if (granted === true) count++;
      }
    }
    return count;
  };

  const handleSave = async () => {
    if (mode === "add" && !selectedUserId) {
      setErrorMessage("กรุณาเลือกครูที่ต้องการแต่งตั้งเป็น Co-admin");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      if (mode === "add") {
        const res = await fetch("/api/admin/co-admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUserId,
            admin_permissions: permissions,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการแต่งตั้ง Co-admin");

        Swal.fire({
          icon: "success",
          title: "แต่งตั้ง Co-admin สำเร็จ",
          text: data.message,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const res = await fetch(`/api/admin/co-admins/${selectedUserId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            admin_permissions: permissions,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการอัปเดตสิทธิ์");

        Swal.fire({
          icon: "success",
          title: "อัปเดตสิทธิ์สำเร็จ",
          text: data.message,
          timer: 1500,
          showConfirmButton: false,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  // Only show categories other than co_admins in modal
  const editableCategories = PERMISSION_CATEGORIES.filter((c) => c.key !== "co_admins");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-card text-card-foreground border border-border rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground">
                {mode === "add" ? "แต่งตั้ง Co-admin ใหม่" : `แก้ไขสิทธิ์ Co-admin: ${targetUser?.username || ""}`}
              </h3>
              <p className="text-xs text-muted-foreground">
                กำหนดสิทธิ์เฉพาะส่วนที่อนุญาตให้ครูสามารถเข้าถึงและจัดการได้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Teacher Selector (Add Mode) */}
          {mode === "add" && (
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                1. เลือกคุณครูที่ต้องการแต่งตั้งเป็น Co-admin <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-background text-foreground font-bold text-sm px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="" disabled>-- เลือกคุณครู --</option>
                {availableTeachers.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.is_co_admin}>
                    {t.username} {t.email ? `(${t.email})` : ""} {t.is_co_admin ? "— เป็น Co-admin อยู่แล้ว" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Presets Quick Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {mode === "add" ? "2. เลือก Preset สิทธิ์สำเร็จรูป (ทางเลือก)" : "เลือก Preset สิทธิ์สำเร็จรูป"}
              </label>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                เปิดแล้ว {countGranted()} สิทธิ์
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PERMISSION_PRESETS.map((preset) => {
                const Icon = CATEGORY_ICON_MAP[preset.icon] || Sliders;
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm scale-[1.02]"
                        : "bg-background hover:bg-muted text-foreground border-border"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-amber-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{preset.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories & Actions List */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              {mode === "add" ? "3. กำหนดสิทธิ์รายรายการ" : "ปรับแต่งสิทธิ์รายรายการ"}
            </label>

            <div className="space-y-3.5">
              {editableCategories.map((catDef) => {
                const Icon = CATEGORY_ICON_MAP[catDef.icon] || Shield;
                const catPermissions = permissions[catDef.key] || {};
                const grantedInCat = Object.values(catPermissions).filter(Boolean).length;
                const allSelected = grantedInCat === catDef.actions.length;

                return (
                  <div
                    key={catDef.key}
                    className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3 hover:border-border transition-all"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-foreground flex items-center gap-2">
                            <span>{catDef.label}</span>
                            <span className="text-[10px] font-normal text-muted-foreground">({catDef.labelEn})</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{catDef.description}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryAll(catDef.key, !allSelected)}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer px-2 py-1 rounded-lg hover:bg-muted"
                        >
                          {allSelected ? "ล้างทั้งหมด" : "เลือกทั้งหมด"}
                        </button>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          {grantedInCat}/{catDef.actions.length}
                        </span>
                      </div>
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {catDef.actions.map((act) => {
                        const isGranted = Boolean(catPermissions[act.action]);
                        return (
                          <label
                            key={act.permission}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                              isGranted
                                ? act.dangerous
                                  ? "bg-rose-500/10 border-rose-500/40 text-foreground"
                                  : "bg-amber-500/10 border-amber-500/40 text-foreground"
                                : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => handleToggleAction(catDef.key, act.action)}
                              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 shrink-0 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                <span>{act.label}</span>
                                {act.dangerous && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                    ความเสี่ยงสูง
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono opacity-80 mt-0.5">
                                {act.permission}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground font-semibold">
            {countGranted() === 0 ? "⚠️ ยังไม่ได้เลือกสิทธิ์ใดๆ (Blank Slate)" : `เปิดใช้งาน ${countGranted()} สิทธิ์`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-foreground bg-background hover:bg-muted border border-border transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกสิทธิ์ Co-admin</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

