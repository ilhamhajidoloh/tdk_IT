"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Shield,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Swal from "sweetalert2";
import { CoAdminUser } from "@/app/lib/permissions/types";
import { PERMISSION_CATEGORIES } from "@/app/lib/permissions/definitions";
import SectionHeader from "../SectionHeader";
import CoAdminPermissionModal from "../modals/CoAdminPermissionModal";

interface CoAdminsTabProps {
  token: string;
  selectedSchoolId?: string | null;
}

export default function CoAdminsTab({ token, selectedSchoolId }: CoAdminsTabProps) {
  const [coAdmins, setCoAdmins] = useState<CoAdminUser[]>([]);
  const [teachers, setTeachers] = useState<CoAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCoAdmin, setEditingCoAdmin] = useState<CoAdminUser | null>(null);

  const loadCoAdmins = async () => {
    setLoading(true);
    try {
      const schoolParam = selectedSchoolId ? `?schoolId=${selectedSchoolId}&school_id=${selectedSchoolId}` : "";
      const res = await fetch(`/api/admin/co-admins${schoolParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoAdmins(data.coAdmins || []);
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error("Failed to load co-admins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoAdmins();
  }, [token, selectedSchoolId]);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingCoAdmin(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coAdmin: CoAdminUser) => {
    setModalMode("edit");
    setEditingCoAdmin(coAdmin);
    setIsModalOpen(true);
  };

  const handleRevokeCoAdmin = async (coAdmin: CoAdminUser) => {
    const result = await Swal.fire({
      title: "ยืนยันการถอดสิทธิ์ Co-admin?",
      html: `คุณต้องการถอดสิทธิ์ Co-admin ของ <strong class="text-foreground">${coAdmin.username}</strong> หรือไม่?<br/><span class="text-xs text-muted-foreground">ผู้ใช้จะกลับเป็นคุณครูปกติและไม่สามารถเข้าถึงหน้า Admin ได้</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ถอดสิทธิ์",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/co-admins/${coAdmin.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการถอดสิทธิ์");

      Swal.fire({
        icon: "success",
        title: "ถอดสิทธิ์สำเร็จ",
        text: data.message,
        timer: 1500,
        showConfirmButton: false,
      });

      loadCoAdmins();
    } catch (err: any) {
      Swal.fire("ข้อผิดพลาด", err.message || "ไม่สามารถถอดสิทธิ์ได้", "error");
    }
  };

  const filteredCoAdmins = useMemo(() => {
    if (!searchTerm.trim()) return coAdmins;
    const q = searchTerm.toLowerCase().trim();
    return coAdmins.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [coAdmins, searchTerm]);

  return (
    <div className="p-8 space-y-6">
      {/* Standard Section Header */}
      <SectionHeader
        icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        color="amber"
        title="จัดการผู้ช่วยผู้ดูแลระบบ (Co-admins)"
        subtitle="แต่งตั้งคุณครูให้มีสิทธิ์เข้าถึงและทำงานเฉพาะส่วนในระบบแอดมินตามที่ได้รับมอบหมาย"
        count={coAdmins.length}
        countLabel="คน"
      >
        <button
          onClick={loadCoAdmins}
          disabled={loading}
          className="bg-card border border-border text-muted-foreground hover:bg-muted p-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer text-sm"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={handleOpenAddModal}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 border-0 cursor-pointer text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>แต่งตั้ง Co-admin ใหม่</span>
        </button>
      </SectionHeader>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้หรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card text-foreground text-sm font-medium px-4 py-2.5 pl-10 rounded-xl border border-border outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-xs"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* List of Co-admins */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground font-medium">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          กำลังโหลดข้อมูล Co-admin...
        </div>
      ) : filteredCoAdmins.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">ยังไม่มีผู้ช่วยผู้ดูแลระบบ (Co-admin)</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              คุณสามารถแต่งตั้งคุณครูในโรงเรียนให้เป็น Co-admin และกำหนดสิทธิ์รายรายการ เพื่อช่วยแบ่งเบาภาระงานของผู้ดูแลระบบได้
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>เริ่มแต่งตั้ง Co-admin</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
          <table className="w-full text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">ผู้ใช้ / คุณครู</th>
                <th className="px-6 py-4">สิทธิ์ที่ได้รับ</th>
                <th className="px-6 py-4 text-center">จำนวนสิทธิ์</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredCoAdmins.map((coAdmin) => {
                const perms = coAdmin.admin_permissions || {};
                const activeCategories = Object.keys(perms).filter((cat) => {
                  const catObj = perms[cat as keyof typeof perms];
                  return catObj && Object.values(catObj).some((v) => v === true);
                });

                let totalGranted = 0;
                for (const cat of Object.values(perms)) {
                  if (!cat) continue;
                  for (const v of Object.values(cat)) {
                    if (v === true) totalGranted++;
                  }
                }

                return (
                  <tr key={coAdmin.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
                          {coAdmin.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-2">
                            <span>{coAdmin.username}</span>
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.2 rounded-md border border-amber-500/20">
                              Co-admin
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {coAdmin.email || "ไม่มีอีเมลผูกไว้"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {activeCategories.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          ⚠️ ยังไม่ได้รับสิทธิ์ใด ๆ (Blank slate)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-xl">
                          {activeCategories.map((catKey) => {
                            const catDef = PERMISSION_CATEGORIES.find((c) => c.key === catKey);
                            const actionCount = Object.values(perms[catKey as keyof typeof perms] || {}).filter(Boolean).length;
                            return (
                              <span
                                key={catKey}
                                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 inline-flex items-center gap-1"
                              >
                                <span>{catDef?.label || catKey}</span>
                                <span className="text-[9px] opacity-70">({actionCount})</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-foreground border border-border">
                        {totalGranted} สิทธิ์
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(coAdmin)}
                          className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all cursor-pointer"
                          title="แก้ไขสิทธิ์"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRevokeCoAdmin(coAdmin)}
                          className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
                          title="ถอดสิทธิ์ Co-admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Permission Modal */}
      <CoAdminPermissionModal
        open={isModalOpen}
        mode={modalMode}
        targetUser={editingCoAdmin}
        availableTeachers={teachers}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadCoAdmins}
      />
    </div>
  );
}
