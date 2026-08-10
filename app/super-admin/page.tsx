"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Building2,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Users,
  ShieldCheck,
  Search,
  LogOut,
  Sparkles,
  MapPin,
  Phone,
  UserPlus,
  Key,
  Mail,
  Trash2,
  UserCheck,
  ClipboardList,
  Check,
  Ban,
  Clock3,
  Upload,
  X
} from "lucide-react";
import { useAuth } from "../lib/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import { slugify, generateSubdomain } from "../lib/format";
import { getSchoolLogoUrl } from "../components/SchoolBrand";

interface EnabledModules {
  news?: boolean;
  duty?: boolean;
  attendance?: boolean;
  evaluations?: boolean;
  correspondence?: boolean;
  grades?: boolean;
  schedule?: boolean;
}

interface School {
  id: string;
  name: string;
  name_en?: string | null;
  subdomain: string;
  logo_url?: string | null;
  logo_drive_file_id?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  enabled_modules?: EnabledModules | null;
  deletion_requested?: boolean;
  deletion_requested_at?: string | null;
  created_at?: string;
}

interface AdminUser {
  id: string;
  username: string;
  email?: string | null;
  role: string;
  school_id: string;
  school_name?: string | null;
  subdomain?: string | null;
  created_at?: string;
}

interface SchoolRequest {
  id: string;
  requested_by?: string | null;
  requester_username?: string | null;
  requester_email?: string | null;
  school_name: string;
  school_name_en?: string | null;
  subdomain: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  requested_modules?: EnabledModules | null;
  reason?: string | null;
  status: "pending" | "approved" | "denied";
  review_note?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"schools" | "admins" | "requests">("schools");
  const [schools, setSchools] = useState<School[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [schoolRequests, setSchoolRequests] = useState<SchoolRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // School Modal State
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [schoolNameEn, setSchoolNameEn] = useState("");
  const [schoolSubdomain, setSchoolSubdomain] = useState("");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState("");
  const [schoolLogoDriveFileId, setSchoolLogoDriveFileId] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoUploadPromiseRef = useRef<Promise<{ fileId: string; logoUrl: string } | null> | null>(null);
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");

  const DEFAULT_ENABLED_MODULES: EnabledModules = {
    news: true,
    duty: true,
    attendance: true,
    evaluations: true,
    correspondence: true,
    grades: true,
    schedule: true,
  };

  const [enabledModules, setEnabledModules] = useState<EnabledModules>(DEFAULT_ENABLED_MODULES);

  // Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminSchoolId, setAdminSchoolId] = useState("");

  // Check auth
  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "super_admin") {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch data
  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/super-admin/schools");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSchools(data);
      }
    } catch (err) {
      console.error("Error fetching schools:", err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/super-admin/admins");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAdmins(data);
      }
    } catch (err) {
      console.error("Error fetching admins:", err);
    }
  };

  const fetchSchoolRequests = async () => {
    try {
      const res = await fetch("/api/super-admin/school-requests");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSchoolRequests(data);
      }
    } catch (err) {
      console.error("Error fetching school requests:", err);
    }
  };

  const loadAllData = async () => {
    setLoadingData(true);
    await Promise.all([fetchSchools(), fetchAdmins(), fetchSchoolRequests()]);
    setLoadingData(false);
  };

  useEffect(() => {
    if (user?.role === "super_admin") {
      loadAllData();
    }
  }, [user]);

  // --- SCHOOL ACTIONS ---
  const openAddSchoolModal = () => {
    setEditingSchool(null);
    setSchoolName("");
    setSchoolNameEn("");
    setSchoolSubdomain("");
    setSchoolLogoUrl("");
    setSchoolLogoDriveFileId("");
    setLogoPreview("");
    setSchoolAddress("");
    setSchoolPhone("");
    setSchoolEmail("");
    setEnabledModules(DEFAULT_ENABLED_MODULES);
    setIsSchoolModalOpen(true);
  };

  const openEditSchoolModal = (school: School) => {
    setEditingSchool(school);
    setSchoolName(school.name || "");
    setSchoolNameEn(school.name_en || "");
    setSchoolSubdomain(school.subdomain || "");
    setSchoolLogoUrl(school.logo_url || "");
    setSchoolLogoDriveFileId(school.logo_drive_file_id || "");
    setLogoPreview("");
    setSchoolAddress(school.address || "");
    setSchoolPhone(school.phone || "");
    setSchoolEmail(school.email || "");
    setEnabledModules(school.enabled_modules ? { ...DEFAULT_ENABLED_MODULES, ...school.enabled_modules } : DEFAULT_ENABLED_MODULES);
    setIsSchoolModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      Swal.fire("ไฟล์ไม่ถูกต้อง", "กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP, SVG)", "error");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("ไฟล์ใหญ่เกินไป", "ขนาดสูงสุด 5MB", "error");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploadingLogo(true);
    const promise = (async () => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/super-admin/schools/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload logo");

      const uploadedUrl = data.url || data.logo_url || `/api/public/schools/logo/${data.fileId}`;
      setSchoolLogoDriveFileId(data.fileId);
      setSchoolLogoUrl(uploadedUrl);
      setLogoPreview(uploadedUrl);
      return { fileId: data.fileId as string, logoUrl: uploadedUrl as string };
    })();

    logoUploadPromiseRef.current = promise;

    try {
      await promise;
      Swal.fire("สำเร็จ", "อัพโหลดโลโก้เรียบร้อยแล้ว", "success");
    } catch (error: any) {
      console.error("Logo upload error:", error);
      Swal.fire("เกิดข้อผิดพลาด", error.message || "ไม่สามารถอัพโหลดโลโก้ได้", "error");
      setLogoPreview("");
    } finally {
      setIsUploadingLogo(false);
      logoUploadPromiseRef.current = null;
    }
  };

  const handleRemoveLogo = () => {
    setSchoolLogoDriveFileId("");
    setSchoolLogoUrl("");
    setLogoPreview("");
    logoUploadPromiseRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSchoolNameEnChange = (val: string) => {
    setSchoolNameEn(val);
    if (!schoolSubdomain || schoolSubdomain === slugify(schoolNameEn)) {
      setSchoolSubdomain(slugify(val));
    }
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubdomain = generateSubdomain(schoolSubdomain, schoolNameEn, schoolName);

    if (!schoolName.trim() || !finalSubdomain) {
      Swal.fire("ข้อผิดพลาด", "กรุณากรอกชื่อโรงเรียน และ Subdomain หรือชื่อภาษาอังกฤษ", "error");
      return;
    }

    try {
      // If logo is currently uploading in background, wait for it to finish!
      let currentDriveId = schoolLogoDriveFileId.trim() || null;
      let currentLogoUrl = schoolLogoUrl.trim() || null;

      if (logoUploadPromiseRef.current) {
        try {
          const uploadRes = await logoUploadPromiseRef.current;
          if (uploadRes) {
            currentDriveId = uploadRes.fileId;
            currentLogoUrl = uploadRes.logoUrl;
          }
        } catch (uploadErr) {
          console.error("In-flight logo upload failed before save:", uploadErr);
        }
      }

      if (!currentLogoUrl && currentDriveId) {
        currentLogoUrl = `/api/public/schools/logo/${currentDriveId}`;
      }

      const url = editingSchool
        ? `/api/super-admin/schools/${editingSchool.id}`
        : "/api/super-admin/schools";
      const method = editingSchool ? "PUT" : "POST";

      const payload = {
        name: schoolName.trim(),
        name_en: schoolNameEn.trim() || null,
        subdomain: finalSubdomain,
        logo_url: currentLogoUrl,
        logo_drive_file_id: currentDriveId,
        address: schoolAddress.trim() || null,
        phone: schoolPhone.trim() || null,
        email: schoolEmail.trim() || null,
        enabled_modules: enabledModules,
      };

      console.log("Saving school with payload:", payload);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก");

      setIsSchoolModalOpen(false);
      await fetchSchools();

      if (!editingSchool && data.id) {
        const createAdminConfirm = await Swal.fire({
          icon: "success",
          title: "🎉 สร้างโรงเรียนสำเร็จ!",
          html: `โรงเรียน <strong>${data.name}</strong> ถูกเพิ่มและพร้อมแสดงผลบนหน้าหลักแล้ว<br/><br/><strong>ต้องการสร้างบัญชีผู้ดูแลระบบ (Admin) สำหรับโรงเรียนนี้เลยหรือไม่?</strong>`,
          showCancelButton: true,
          confirmButtonText: "สร้างบัญชี Admin ทันที",
          cancelButtonText: "ไว้สร้างภายหลัง",
          confirmButtonColor: "#4f46e5",
          cancelButtonColor: "#6b7280",
        });

        if (createAdminConfirm.isConfirmed) {
          const defaultUser = `admin_${data.subdomain}`;
          openAddAdminModal(data.id, defaultUser, data.email || "");
        }
      } else {
        Swal.fire({
          icon: "success",
          title: "อัปเดตโรงเรียนสำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire("ข้อผิดพลาด", err.message, "error");
    }
  };

  const handleToggleSchoolActive = async (school: School) => {
    const actionText = school.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน";
    const result = await Swal.fire({
      title: `ยืนยันการ${actionText}?`,
      text: `ต้องการ${actionText}โรงเรียน "${school.name}" หรือไม่`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: school.is_active ? "#ef4444" : "#10b981",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/super-admin/schools/${school.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !school.is_active }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "ไม่สามารถเปลี่ยนสถานะได้");
      }

      Swal.fire({ icon: "success", title: "เปลี่ยนสถานะสำเร็จ", timer: 1200, showConfirmButton: false });
      fetchSchools();
    } catch (err: any) {
      Swal.fire("ข้อผิดพลาด", err.message, "error");
    }
  };

  const handleDeleteSchool = async (school: School) => {
    if (!school.deletion_requested) return;

    const result = await Swal.fire({
      title: `⚠️ ลบโรงเรียน "${school.name}" ถาวร?`,
      html: `<p class="text-sm text-gray-600">การดำเนินการนี้<strong>ไม่สามารถย้อนกลับได้</strong><br/>ข้อมูลนักเรียน ครู คะแนน และข้อมูลทั้งหมดของโรงเรียนนี้จะถูกลบออกจากระบบอย่างถาวร</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน ลบถาวร",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      input: "text",
      inputLabel: `พิมพ์ชื่อโรงเรียน "${school.name}" เพื่อยืนยัน`,
      inputPlaceholder: school.name,
      inputValidator: (value) => {
        if (value !== school.name) return "ชื่อโรงเรียนไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง";
      },
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/super-admin/schools/${school.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถลบได้");
      Swal.fire({ icon: "success", title: "ลบโรงเรียนสำเร็จ", text: data.message, timer: 2000, showConfirmButton: false });
      fetchSchools();
    } catch (err: any) {
      Swal.fire("ข้อผิดพลาด", err.message, "error");
    }
  };

  // --- ADMIN ACTIONS ---
  const openAddAdminModal = (targetSchoolId?: string, defaultUsername?: string, defaultEmail?: string) => {
    setEditingAdmin(null);
    setAdminUsername(defaultUsername || "");
    setAdminPassword("");
    setAdminEmail(defaultEmail || "");
    setAdminSchoolId(targetSchoolId || (schools.length > 0 ? schools[0].id : ""));
    setIsAdminModalOpen(true);
  };

  const openEditAdminModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setAdminUsername(admin.username || "");
    setAdminPassword("");
    setAdminEmail(admin.email || "");
    setAdminSchoolId(admin.school_id || "");
    setIsAdminModalOpen(true);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || (!editingAdmin && !adminPassword.trim()) || !adminSchoolId) {
      Swal.fire("ข้อผิดพลาด", "กรุณากรอก Username, Password และเลือกโรงเรียน", "error");
      return;
    }

    try {
      const url = editingAdmin
        ? `/api/super-admin/admins/${editingAdmin.id}`
        : "/api/super-admin/admins";
      const method = editingAdmin ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword.trim() || undefined,
          email: adminEmail.trim() || null,
          school_id: adminSchoolId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกผู้ดูแลระบบ");

      setIsAdminModalOpen(false);
      Swal.fire({
        icon: "success",
        title: editingAdmin ? "อัปเดตข้อมูลแอดมินสำเร็จ" : "สร้างแอดมินสำเร็จ",
        text: "โรงเรียนพร้อมสำหรับการเข้าใช้งานบนหน้าหลักแล้ว",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchAdmins();
    } catch (err: any) {
      Swal.fire("ข้อผิดพลาด", err.message, "error");
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.role === "super_admin") {
      Swal.fire("ไม่อนุญาต", "ไม่สามารถลบบัญชี Super Admin ได้", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "ลบผู้ดูแลระบบนี้?",
      text: `ต้องการลบแอดมิน "${admin.username}" ของโรงเรียน ${admin.school_name || ""} ใช่หรือไม่`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/super-admin/admins/${admin.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "ลบแอดมินไม่สำเร็จ");
      }

      Swal.fire({ icon: "success", title: "ลบผู้ดูแลระบบเรียบร้อย", timer: 1200, showConfirmButton: false });
      fetchAdmins();
    } catch (err: any) {
      Swal.fire("ข้อผิดพลาด", err.message, "error");
    }
  };

  const handleReviewSchoolRequest = async (request: SchoolRequest, status: "approved" | "denied") => {
    const result = await Swal.fire({
      title: status === "approved" ? "อนุมัติคำขอสร้างโรงเรียน?" : "ไม่อนุมัติคำขอนี้?",
      text: `${request.school_name} (${request.subdomain})`,
      icon: status === "approved" ? "question" : "warning",
      input: status === "denied" ? "textarea" : undefined,
      inputLabel: status === "denied" ? "หมายเหตุถึงผู้ส่งคำขอ (ไม่บังคับ)" : undefined,
      inputPlaceholder: status === "denied" ? "ระบุเหตุผลหรือข้อเสนอแนะ" : undefined,
      showCancelButton: true,
      confirmButtonText: status === "approved" ? "อนุมัติ" : "ไม่อนุมัติ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: status === "approved" ? "#059669" : "#dc2626",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/super-admin/school-requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review_note: status === "denied" ? result.value || null : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถดำเนินการกับคำขอได้");

      await Promise.all([fetchSchoolRequests(), fetchSchools()]);

      if (status === "approved" && data.school) {
        const createAdminConfirm = await Swal.fire({
          icon: "success",
          title: "🎉 อนุมัติคำขอสำเร็จ!",
          html: `โรงเรียน <strong>${data.school.name}</strong> ถูกสร้างและเพิ่มลงหน้าหลักแล้ว<br/><br/><strong>ต้องการสร้างบัญชีผู้ดูแลระบบ (Admin) สำหรับโรงเรียนนี้ตอนนี้เลยหรือไม่?</strong>`,
          showCancelButton: true,
          confirmButtonText: "สร้างบัญชี Admin ทันที",
          cancelButtonText: "ไว้สร้างภายหลัง",
          confirmButtonColor: "#4f46e5",
          cancelButtonColor: "#6b7280",
        });

        if (createAdminConfirm.isConfirmed) {
          const defaultUser = `admin_${data.school.subdomain}`;
          openAddAdminModal(data.school.id, defaultUser, request.requester_email || "");
        }
      } else {
        Swal.fire({
          icon: "success",
          title: "บันทึกการไม่อนุมัติแล้ว",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
    }
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.name_en && s.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAdmins = admins.filter(
    (a) =>
      a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.school_name && a.school_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredRequests = schoolRequests.filter(
    (request) =>
      request.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.requester_username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.requester_email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSchoolsCount = schools.filter((s) => s.is_active).length;
  const schoolAdminsCount = admins.filter((a) => a.role === "admin").length;
  const pendingRequestsCount = schoolRequests.filter((request) => request.status === "pending").length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-muted-foreground">กำลังตรวจสอบสิทธิ์ Super Admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Super Admin Top Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-foreground">
                Super Admin Portal
              </h1>
              <p className="text-xs text-amber-500 dark:text-amber-400 font-bold uppercase tracking-wider">
                Platform Control & Multi-School Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Social Mail Link Button */}
            <button
              onClick={async () => {
                if (user?.email) {
                  const result = await Swal.fire({
                    title: "การเชื่อมต่อบัญชีโซเชียล",
                    text: `คุณเชื่อมต่อบัญชีด้วยอีเมล ${user.email} อยู่ในขณะนี้`,
                    icon: "info",
                    showCancelButton: true,
                    confirmButtonText: "ยกเลิกการเชื่อมต่อ",
                    cancelButtonText: "ปิด",
                    confirmButtonColor: "#ef4444",
                    cancelButtonColor: "#6b7280",
                  });
                  if (result.isConfirmed) {
                    Swal.fire({ title: "กำลังดำเนินการ...", allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
                    const res = await fetch("/api/auth/unlink-account", { method: "POST" });
                    if (res.ok) {
                      Swal.fire({ icon: "success", title: "สำเร็จ", text: "ยกเลิกการเชื่อมต่อบัญชีโซเชียลเรียบร้อยแล้ว", timer: 1500 }).then(() => window.location.reload());
                    } else {
                      Swal.fire("ข้อผิดพลาด", "ไม่สามารถยกเลิกการเชื่อมต่อได้", "error");
                    }
                  }
                } else {
                  await Swal.fire({
                    title: "เชื่อมต่อบัญชีโซเชียล",
                    text: "เลือกบริการที่คุณต้องการใช้เชื่อมต่อกับบัญชีของคุณ",
                    icon: "question",
                    showConfirmButton: false,
                    showCancelButton: true,
                    cancelButtonText: "ยกเลิก",
                    html: `
                      <div class="flex flex-col gap-3 mt-4 text-left">
                        <button id="sa-link-google" class="flex items-center gap-3 w-full px-5 py-3 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all font-semibold cursor-pointer">
                          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span class="text-sm">เชื่อมต่อกับ Google</span>
                        </button>
                        <button id="sa-link-line" class="flex items-center gap-3 w-full px-5 py-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all font-semibold cursor-pointer">
                          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#06C755"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                          <span class="text-sm">เชื่อมต่อกับ LINE</span>
                        </button>
                        <button id="sa-link-facebook" class="flex items-center gap-3 w-full px-5 py-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all font-semibold cursor-pointer">
                          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          <span class="text-sm">เชื่อมต่อกับ Facebook</span>
                        </button>
                      </div>
                    `,
                    didOpen: () => {
                      document.getElementById("sa-link-google")?.addEventListener("click", () => { Swal.close(); window.location.href = "/api/link-google/start"; });
                      document.getElementById("sa-link-line")?.addEventListener("click", () => { Swal.close(); window.location.href = "/api/link-line/start"; });
                      document.getElementById("sa-link-facebook")?.addEventListener("click", () => { Swal.close(); window.location.href = "/api/link-facebook/start"; });
                    },
                  });
                }
              }}
              title={user?.email ? `เชื่อมต่ออีเมล: ${user.email}` : "เชื่อมต่อบัญชีโซเชียล"}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all shrink-0 border ${
                user?.email
                  ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
                  : "text-muted-foreground border-border hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
              }`}
            >
              <Mail className="w-4 h-4" />
            </button>

            {/* Change Password Button */}
            <button
              onClick={async () => {
                const { value: newPassword } = await Swal.fire({
                  title: "เปลี่ยนรหัสผ่าน",
                  input: "password",
                  inputLabel: "รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)",
                  inputPlaceholder: "กรอกรหัสผ่านใหม่",
                  showCancelButton: true,
                  confirmButtonText: "บันทึก",
                  cancelButtonText: "ยกเลิก",
                  confirmButtonColor: "#4f46e5",
                  inputValidator: (value) => { if (!value || value.length < 6) return "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร!"; },
                });
                if (newPassword) {
                  const res = await fetch("/api/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword }) });
                  if (res.ok) { Swal.fire("สำเร็จ!", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "success"); }
                  else { const d = await res.json(); Swal.fire("ข้อผิดพลาด", d.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้", "error"); }
                }
              }}
              title="เปลี่ยนรหัสผ่าน"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all shrink-0 border border-border"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-card border border-border flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{schools.length}</span>
              <span className="text-xs text-muted-foreground block font-semibold">โรงเรียนในระบบ</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{activeSchoolsCount}</span>
              <span className="text-xs text-muted-foreground block font-semibold">โรงเรียนที่เปิดใช้งาน</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{schoolAdminsCount}</span>
              <span className="text-xs text-muted-foreground block font-semibold">แอดมินประจำโรงเรียน</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/30">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-foreground">{pendingRequestsCount}</span>
              <span className="text-xs text-muted-foreground block font-semibold">คำขอรอพิจารณา</span>
            </div>
          </div>
        </div>

        {/* Tab Selection & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 p-1.5 bg-card border border-border rounded-2xl shadow-sm">
            <button
              onClick={() => setActiveTab("schools")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "schools"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>จัดการโรงเรียน ({schools.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("admins")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "admins"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>จัดการแอดมินโรงเรียน ({schoolAdminsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "requests"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>คำขอสร้างโรงเรียน ({pendingRequestsCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "schools" ? "ค้นหาชื่อ หรือ subdomain..." : activeTab === "admins" ? "ค้นหาแอดมิน หรือโรงเรียน..." : "ค้นหาคำขอ ชื่อโรงเรียน หรือผู้ส่ง..."}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {activeTab === "schools" ? (
              <button
                onClick={openAddSchoolModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มโรงเรียนใหม่</span>
              </button>
            ) : activeTab === "admins" ? (
              <button
                onClick={() => openAddAdminModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>เพิ่มแอดมินประจำโรงเรียน</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* TAB 1: SCHOOLS MANAGEMENT */}
        {activeTab === "schools" && (
          loadingData ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">กำลังโหลดรายการโรงเรียน...</p>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-3xl shadow-sm">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">ไม่พบโรงเรียนที่ตรงกับคำค้นหา</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchools.map((school) => {
                const schoolAdmins = admins.filter((a) => a.school_id === school.id && a.role === "admin");
                return (
                  <div
                    key={school.id}
                    className={`rounded-3xl border p-6 flex flex-col justify-between transition-all shadow-sm ${
                      school.is_active
                        ? "bg-card border-border hover:border-primary/40"
                        : "bg-muted/40 border-border/60 opacity-75"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {school.logo_drive_file_id || school.logo_url ? (
                            <img
                              src={getSchoolLogoUrl(school.logo_drive_file_id, school.logo_url)}
                              alt={school.name}
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary/20 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                              {school.name.trim().charAt(0) || "S"}
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-base text-foreground">{school.name}</h3>
                            {school.name_en && (
                              <p className="text-xs text-muted-foreground font-medium">{school.name_en}</p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                            school.is_active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                          }`}
                        >
                          {school.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {school.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </span>
                      </div>

                      {/* Subdomain & Info */}
                      <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Subdomain:</span>
                          <code className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded font-mono">
                            ?school={school.subdomain}
                          </code>
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>แอดมินดูแลประจำโรงเรียน:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{schoolAdmins.length} บัญชี</span>
                        </div>

                        {school.address && (
                          <div className="flex items-center gap-1.5 text-muted-foreground truncate pt-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{school.address}</span>
                          </div>
                        )}

                        {/* Enabled Feature Badges */}
                        <div className="pt-2 border-t border-border/60">
                          <span className="text-[11px] font-bold text-muted-foreground block mb-1.5">
                            สิทธิ์ระบบที่เปิดใช้งาน:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { key: "news", label: "ข่าวสาร" },
                              { key: "duty", label: "เวรครู-แม่ครัว" },
                              { key: "attendance", label: "เช็คชื่อ" },
                              { key: "evaluations", label: "ประเมินคุณลักษณะ" },
                              { key: "correspondence", label: "หนังสือรับ-ส่ง" },
                              { key: "grades", label: "เกรด&คะแนน" },
                              { key: "schedule", label: "ตารางเรียน" },
                            ].map((mod) => {
                              const isEnabled = school.enabled_modules?.[mod.key as keyof EnabledModules] !== false;
                              return (
                                <span
                                  key={mod.key}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    isEnabled
                                      ? "bg-primary/10 text-primary border-primary/20"
                                      : "bg-muted/40 text-muted-foreground/60 border-border line-through"
                                  }`}
                                >
                                  {mod.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 mt-4 border-t border-border space-y-2">
                      <button
                        onClick={() => openAddAdminModal(school.id)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>เพิ่มแอดมินประจำโรงเรียนนี้</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditSchoolModal(school)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-card hover:bg-muted text-foreground text-xs font-bold border border-border transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-500" />
                          <span>แก้ไขข้อมูล & กำหนดสิทธิ์สวิตช์ระบบ</span>
                        </button>

                        <button
                          onClick={() => handleToggleSchoolActive(school)}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                            school.is_active
                              ? "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {school.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        </button>
                      </div>

                      {/* Delete School Button — enabled only when deletion_requested */}
                      <button
                        onClick={() => school.deletion_requested && handleDeleteSchool(school)}
                        disabled={!school.deletion_requested}
                        title={
                          school.deletion_requested
                            ? `แอดมินโรงเรียนส่งคำขอลบแล้ว กดเพื่อลบถาวร`
                            : "รอการส่งคำขอลบจากแอดมินโรงเรียน"
                        }
                        className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                          school.deletion_requested
                            ? "bg-red-600 hover:bg-red-700 text-white border-red-600 cursor-pointer"
                            : "bg-muted/40 text-muted-foreground/50 border-border/50 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {school.deletion_requested
                          ? `⚠️ ลบถาวร (มีคำขอจากแอดมิน)`
                          : "ลบโรงเรียน (รอคำขอจากแอดมิน)"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TAB 2: SCHOOL CREATION REQUESTS */}
        {activeTab === "requests" && (
          loadingData ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">กำลังโหลดคำขอ...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-3xl shadow-sm">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">ไม่พบคำขอสร้างโรงเรียน</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const pending = request.status === "pending";
                const enabled = request.requested_modules || DEFAULT_ENABLED_MODULES;
                return (
                  <article key={request.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      <div className="space-y-4 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-black text-lg">{request.school_name}</h3>
                            {request.school_name_en && <p className="text-xs text-muted-foreground">{request.school_name_en}</p>}
                            <code className="text-xs text-primary font-bold">?school={request.subdomain}</code>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div><span className="text-muted-foreground block">ผู้ส่งคำขอ</span><span className="font-bold">{request.requester_username || "-"}</span></div>
                          <div><span className="text-muted-foreground block">อีเมลผู้ส่ง</span><span className="font-bold break-all">{request.requester_email || "-"}</span></div>
                          <div><span className="text-muted-foreground block">เบอร์ติดต่อโรงเรียน</span><span className="font-bold">{request.phone || "-"}</span></div>
                          <div><span className="text-muted-foreground block">อีเมลโรงเรียน</span><span className="font-bold break-all">{request.email || "-"}</span></div>
                        </div>

                        {request.address && <p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">ที่อยู่:</span> {request.address}</p>}
                        {request.reason && <p className="text-xs text-muted-foreground whitespace-pre-wrap"><span className="font-bold text-foreground">รายละเอียดเพิ่มเติม:</span> {request.reason}</p>}

                        <div className="flex flex-wrap gap-1.5">
                          {[
                            ["news", "ข่าวสาร"], ["duty", "เวรครู"], ["attendance", "เช็กชื่อ"],
                            ["evaluations", "ประเมิน"], ["correspondence", "หนังสือรับ-ส่ง"],
                            ["grades", "เกรด"], ["schedule", "ตารางเรียน"],
                          ].map(([key, label]) => (
                            <span key={key} className={`text-[10px] px-2 py-1 rounded-lg border font-bold ${enabled[key as keyof EnabledModules] !== false ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border line-through"}`}>
                              {label}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">ส่งเมื่อ {new Date(request.created_at).toLocaleString("th-TH")}</p>
                        {request.review_note && <div className="rounded-xl bg-muted/60 border border-border p-3 text-xs"><span className="font-bold">หมายเหตุการพิจารณา:</span> {request.review_note}</div>}
                      </div>

                      <div className="flex flex-col gap-2 lg:min-w-40">
                        <span className={`inline-flex justify-center items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold ${request.status === "approved" ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : request.status === "denied" ? "text-red-600 bg-red-500/10 border-red-500/20" : "text-amber-600 bg-amber-500/10 border-amber-500/20"}`}>
                          {request.status === "pending" ? <Clock3 className="w-3.5 h-3.5" /> : request.status === "approved" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {request.status === "pending" ? "รอพิจารณา" : request.status === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติ"}
                        </span>
                        {pending && (
                          <>
                            <button onClick={() => handleReviewSchoolRequest(request, "approved")} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"><Check className="w-4 h-4" />อนุมัติ</button>
                            <button onClick={() => handleReviewSchoolRequest(request, "denied")} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/30 text-xs font-bold"><Ban className="w-4 h-4" />ไม่อนุมัติ</button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        )}

        {/* TAB 3: SCHOOL ADMINS MANAGEMENT */}
        {activeTab === "admins" && (
          loadingData ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">กำลังโหลดรายการผู้ดูแลระบบ...</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-foreground">รายชื่อแอดมินประจำโรงเรียน</h3>
                  <p className="text-xs text-muted-foreground">สร้างและจัดการสิทธิ์แอดมินประจำแต่ละโรงเรียน</p>
                </div>

                <button
                  onClick={() => openAddAdminModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>เพิ่มแอดมินใหม่</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-bold">ชื่อผู้ใช้ (Username)</th>
                      <th className="px-6 py-4 font-bold">บทบาท</th>
                      <th className="px-6 py-4 font-bold">โรงเรียนที่ดูแล</th>
                      <th className="px-6 py-4 font-bold">อีเมลติดต่อ</th>
                      <th className="px-6 py-4 font-bold text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          ไม่พบผู้ดูแลระบบ
                        </td>
                      </tr>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <span>{admin.username}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                admin.role === "super_admin"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                              }`}
                            >
                              {admin.role === "super_admin" ? "Super Admin" : "School Admin"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {admin.role === "super_admin" ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">ทุกโรงเรียน (Platform)</span>
                            ) : (
                              <div>
                                <span className="font-bold text-foreground">{admin.school_name || "ไม่ระบุ"}</span>
                                {admin.subdomain && (
                                  <span className="text-[11px] text-muted-foreground block font-mono">
                                    ?school={admin.subdomain}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{admin.email || "-"}</td>
                          <td className="px-6 py-4 text-right">
                            {admin.role !== "super_admin" && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditAdminModal(admin)}
                                  className="p-1.5 rounded-lg bg-card hover:bg-muted text-amber-500 border border-border shadow-sm"
                                  title="แก้ไข / รีเซ็ตรหัสผ่าน"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                                  title="ลบผู้ใช้งาน"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>

      {/* Modal: Add/Edit School */}
      {isSchoolModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in-up overflow-y-auto"
          onClick={() => setIsSchoolModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">
                    {editingSchool ? "แก้ไขข้อมูลโรงเรียน" : "เพิ่มโรงเรียนใหม่"}
                  </h3>
                  <p className="text-xs text-white/80 font-medium">กรอกรายละเอียดของโรงเรียน</p>
                </div>
              </div>
              <button
                onClick={() => setIsSchoolModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchool} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-foreground font-bold mb-1">ชื่อโรงเรียน (ภาษาไทย) *</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="เช่น โรงเรียนบ้านนาวิทยา"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">ชื่อโรงเรียน (ภาษาอังกฤษ)</label>
                <input
                  type="text"
                  value={schoolNameEn}
                  onChange={(e) => handleSchoolNameEnChange(e.target.value)}
                  placeholder="เช่น Bannawittaya School"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">Subdomain (ถ้าไม่ระบุ จะสร้างจากชื่อภาษาอังกฤษให้อัตโนมัติ)</label>
                <input
                  type="text"
                  value={schoolSubdomain}
                  onChange={(e) => setSchoolSubdomain(e.target.value)}
                  placeholder="เช่น bannawittaya"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-1">ใช้สำหรับเข้าถึงระบบผ่าน URL: `?school=subdomain`</p>
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">โลโก้โรงเรียน</label>

                {/* Show current/preview logo */}
                {(logoPreview || schoolLogoDriveFileId || schoolLogoUrl) && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-border mb-3">
                    <img
                      src={logoPreview || getSchoolLogoUrl(schoolLogoDriveFileId, schoolLogoUrl)}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "/logo.jpg"; }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploadingLogo}
                />

                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingLogo ? "กำลังอัพโหลด..." : "เลือกไฟล์โลโก้"}
                </button>

                <p className="text-xs text-muted-foreground mt-2">
                  รองรับ: JPG, PNG, WebP, SVG (สูงสุด 5MB)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-bold mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                    placeholder="02-XXX-XXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-bold mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    placeholder="contact@school.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">ที่อยู่โรงเรียน</label>
                <textarea
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  placeholder="ที่อยู่โรงเรียน..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Feature Modules Toggle */}
              <div className="pt-2 border-t border-border space-y-3">
                <div>
                  <label className="block text-foreground font-extrabold text-xs">
                    กำหนดสิทธิ์ฟังก์ชันการใช้งาน (Module Feature Flags)
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    เลือกเปิด-ปิดการใช้งานแต่ละระบบย่อยของโรงเรียนนี้
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { key: "news", label: "📰 ข่าวประชาสัมพันธ์" },
                    { key: "duty", label: "📌 เวรครู-แม่ครัว" },
                    { key: "attendance", label: "⏱️ เช็คชื่อเข้าเรียน" },
                    { key: "evaluations", label: "⭐ ประเมินคุณลักษณะ" },
                    { key: "correspondence", label: "📬 หนังสือรับ-ส่ง" },
                    { key: "grades", label: "📊 คะแนน เกรด & อันดับ" },
                    { key: "schedule", label: "📅 จัดการตารางเรียน" },
                  ].map((mod) => {
                    const isChecked = enabledModules[mod.key as keyof EnabledModules] !== false;
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-primary/10 border-primary/30 text-foreground font-bold"
                            : "bg-muted/30 border-border text-muted-foreground opacity-60"
                        }`}
                      >
                        <span className="text-xs">{mod.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setEnabledModules((prev) => ({
                              ...prev,
                              [mod.key]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 rounded text-primary focus:ring-primary"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploadingLogo}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploadingLogo ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังอัปโหลดโลโก้...</span>
                    </>
                  ) : (
                    <span>บันทึกข้อมูลโรงเรียน</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Admin */}
      {isAdminModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in-up overflow-y-auto"
          onClick={() => setIsAdminModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">
                    {editingAdmin ? "แก้ไขแอดมินประจำโรงเรียน" : "เพิ่มแอดมินประจำโรงเรียน"}
                  </h3>
                  <p className="text-xs text-white/80 font-medium">ระบุบัญชีผู้ใช้และกำหนดโรงเรียนที่ดูแล</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-foreground font-bold mb-1">สังกัดโรงเรียน *</label>
                <select
                  value={adminSchoolId}
                  onChange={(e) => setAdminSchoolId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="" disabled>-- เลือกโรงเรียน --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (?school={s.subdomain})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">ชื่อผู้ใช้ (Username) *</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="เช่น admin_school1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">
                  {editingAdmin ? "รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)" : "รหัสผ่าน *"}
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
                  required={!editingAdmin}
                />
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">อีเมลติดต่อ (ถ้ามี)</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@school.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
                >
                  บันทึกแอดมิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
