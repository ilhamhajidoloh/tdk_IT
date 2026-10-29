"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
  X,
  User,
  Copy,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  RefreshCw,
  Globe
} from "lucide-react";
import { useAuth } from "../lib/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import { slugify, generateSubdomain } from "../lib/format";
import { getSchoolLogoUrl } from "../components/SchoolBrand";

// ==========================================
// TYPE DEFINITIONS (API Logic Preserved)
// ==========================================

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
  name_jawi?: string | null;
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

const MODULE_DEFINITIONS: { key: keyof EnabledModules; label: string; desc: string }[] = [
  { key: "news", label: "ข่าวสารประชาสัมพันธ์", desc: "ประกาศและข่าวสารกิจกรรมของโรงเรียน" },
  { key: "duty", label: "เวรครูและแม่ครัว", desc: "ตารางเวรปฏิบัติหน้าที่ประจำสัปดาห์" },
  { key: "attendance", label: "เช็คชื่อเข้าเรียน", desc: "ระบบบันทึกเวลาและการเข้าแถวของนักเรียน" },
  { key: "evaluations", label: "ประเมินคุณลักษณะ", desc: "การประเมินพฤติกรรมและคุณลักษณะอันพึงประสงค์" },
  { key: "correspondence", label: "หนังสือราชการ", desc: "ระบบสารบรรณและหนังสือรับ-ส่งภายใน" },
  { key: "grades", label: "คะแนน เกรด & อันดับ", desc: "บันทึกผลการเรียนและการจัดอันดับ" },
  { key: "schedule", label: "ตารางเรียน & คาบสอน", desc: "ตารางสอนครูและตารางเรียนประจำห้อง" },
];

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"schools" | "admins" | "requests">("schools");
  const [schools, setSchools] = useState<School[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [schoolRequests, setSchoolRequests] = useState<SchoolRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestFilter, setRequestFilter] = useState<"all" | "pending" | "approved" | "denied">("all");
  const [copiedSubdomain, setCopiedSubdomain] = useState<string | null>(null);

  // School Modal State
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [schoolNameEn, setSchoolNameEn] = useState("");
  const [schoolNameJawi, setSchoolNameJawi] = useState("");
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

  const loadAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoadingData(true);
    }
    try {
      await Promise.all([
        fetchSchools(),
        fetchAdmins(),
        fetchSchoolRequests(),
      ]);
    } finally {
      setLoadingData(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === "super_admin") {
      void loadAllData();
    }
  }, [user]);

  // --- SCHOOL ACTIONS ---
  const openAddSchoolModal = () => {
    setEditingSchool(null);
    setSchoolName("");
    setSchoolNameEn("");
    setSchoolNameJawi("");
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
    setSchoolNameJawi(school.name_jawi || "");
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

    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      Swal.fire("ไฟล์ไม่ถูกต้อง", "กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP, SVG)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("ไฟล์ใหญ่เกินไป", "ขนาดสูงสุด 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

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
      Swal.fire("สำเร็จ", "อัปโหลดโลโก้เรียบร้อยแล้ว", "success");
    } catch (error: any) {
      console.error("Logo upload error:", error);
      Swal.fire("เกิดข้อผิดพลาด", error.message || "ไม่สามารถอัปโหลดโลโก้ได้", "error");
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
        name_jawi: schoolNameJawi.trim() || null,
        subdomain: finalSubdomain,
        logo_url: currentLogoUrl,
        logo_drive_file_id: currentDriveId,
        address: schoolAddress.trim() || null,
        phone: schoolPhone.trim() || null,
        email: schoolEmail.trim() || null,
        enabled_modules: enabledModules,
      };

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
          html: `โรงเรียน <strong>${data.name}</strong> ถูกเพิ่มและพร้อมแสดงผลแล้ว<br/><br/><strong>ต้องการสร้างบัญชีผู้ดูแลระบบ (Admin) สำหรับโรงเรียนนี้เลยหรือไม่?</strong>`,
          showCancelButton: true,
          confirmButtonText: "สร้างบัญชี Admin ทันที",
          cancelButtonText: "ไว้สร้างภายหลัง",
          confirmButtonColor: "#4f46e5",
          cancelButtonColor: "#64748b",
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
      html: `<p class="text-sm text-slate-600 dark:text-slate-400">การดำเนินการนี้<strong>ไม่สามารถย้อนกลับได้</strong><br/>ข้อมูลนักเรียน ครู คะแนน และข้อมูลทั้งหมดจะถูกลบอย่างถาวร</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน ลบถาวร",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
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
          cancelButtonColor: "#64748b",
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

  const copySubdomain = (sub: string) => {
    navigator.clipboard.writeText(`?school=${sub}`);
    setCopiedSubdomain(sub);
    setTimeout(() => setCopiedSubdomain(null), 2000);
  };

  // Filtered queries
  const filteredSchools = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.subdomain.toLowerCase().includes(q) ||
        (s.name_en && s.name_en.toLowerCase().includes(q))
    );
  }, [schools, searchQuery]);

  const filteredAdmins = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return admins.filter(
      (a) =>
        a.username.toLowerCase().includes(q) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.school_name && a.school_name.toLowerCase().includes(q))
    );
  }, [admins, searchQuery]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return schoolRequests.filter((request) => {
      const matchesSearch =
        request.school_name.toLowerCase().includes(q) ||
        request.subdomain.toLowerCase().includes(q) ||
        (request.requester_username || "").toLowerCase().includes(q) ||
        (request.requester_email || "").toLowerCase().includes(q);

      if (requestFilter === "all") return matchesSearch;
      return matchesSearch && request.status === requestFilter;
    });
  }, [schoolRequests, searchQuery, requestFilter]);

  const activeSchoolsCount = schools.filter((s) => s.is_active).length;
  const schoolAdminsCount = admins.filter((a) => a.role === "admin").length;
  const pendingRequestsCount = schoolRequests.filter((request) => request.status === "pending").length;

  if (loading || !user || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">กำลังเตรียมระบบ Super Admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-600 selection:text-white dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* =========================================================================
          Top Bar: Super Admin Portal Header
          ========================================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Super Admin Portal
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  ผู้ดูแลสูงสุด
                </span>
              </div>
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                การบริหารจัดการเครือข่ายโรงเรียนและผู้ดูแลระบบ
              </p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Refresh Data */}
            <button
              onClick={() => void loadAllData(true)}
              disabled={isRefreshing}
              title="รีเฟรชข้อมูล"
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <ThemeToggle />

            {/* Profile Navigation */}
            <button
              onClick={() => router.push("/super-admin/profile")}
              title="โปรไฟล์ผู้ดูแลระบบ"
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">โปรไฟล์</span>
            </button>

            {/* Social Account Linking */}
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
                    cancelButtonColor: "#64748b",
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
                        <button id="sa-link-google" class="flex items-center gap-3 w-full px-5 py-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all font-semibold cursor-pointer">
                          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span class="text-sm">เชื่อมต่อกับ Google</span>
                        </button>
                        <button id="sa-link-line" class="flex items-center gap-3 w-full px-5 py-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all font-semibold cursor-pointer">
                          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#06C755"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                          <span class="text-sm">เชื่อมต่อกับ LINE</span>
                        </button>
                        <button id="sa-link-facebook" class="flex items-center gap-3 w-full px-5 py-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all font-semibold cursor-pointer">
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
              className={`p-2 rounded-xl transition border ${
                user?.email
                  ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40"
                  : "text-slate-500 border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Mail className="w-4 h-4" />
            </button>

            {/* Change Password */}
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
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          Dashboard Overview Metrics
          ========================================================================= */}
      <section className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Metric 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {schools.length}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  โรงเรียนในระบบ
                </p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {activeSchoolsCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  โรงเรียนที่เปิดใช้งาน
                </p>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {schoolAdminsCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  แอดมินประจำโรงเรียน
                </p>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 relative">
                <ClipboardList className="w-5 h-5" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {pendingRequestsCount}
                  </p>
                  {pendingRequestsCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                      ใหม่
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  คำขอรอพิจารณา
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          Segmented Navigation & Action Bar
          ========================================================================= */}
      <div className="sticky top-16 z-30 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 py-3 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("schools")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === "schools"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>จัดการโรงเรียน</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "schools"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "bg-slate-300/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}>
                  {schools.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("admins")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === "admins"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>จัดการแอดมิน</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "admins"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "bg-slate-300/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}>
                  {schoolAdminsCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("requests")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === "requests"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>คำขอสร้างโรงเรียน</span>
                {pendingRequestsCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    {pendingRequestsCount}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-300/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {schoolRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search Input & Action Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === "schools"
                      ? "ค้นหาชื่อ หรือ subdomain..."
                      : activeTab === "admins"
                      ? "ค้นหาชื่อ หรือโรงเรียน..."
                      : "ค้นหาคำขอ หรือผู้ส่ง..."
                  }
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {activeTab === "schools" && (
                <button
                  onClick={openAddSchoolModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs shrink-0 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">เพิ่มโรงเรียนใหม่</span>
                  <span className="sm:hidden">เพิ่ม</span>
                </button>
              )}

              {activeTab === "admins" && (
                <button
                  onClick={() => openAddAdminModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs shrink-0 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">เพิ่มแอดมินใหม่</span>
                  <span className="sm:hidden">เพิ่ม</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* =========================================================================
          Main Content Container
          ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* =========================================================================
            TAB 1: SCHOOLS MANAGEMENT
            ========================================================================= */}
        {activeTab === "schools" && (
          loadingData ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 animate-pulse" />
              ))}
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-12 text-center shadow-xs">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {searchQuery ? `ไม่พบโรงเรียนที่ตรงกับ "${searchQuery}"` : "ยังไม่มีโรงเรียนในระบบ"}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {searchQuery ? "ลองตรวจสอบตัวสะกด หรือค้นหาด้วยคำอื่น" : "เริ่มต้นเพิ่มโรงเรียนแรกของคุณเข้าสู่แพลตฟอร์ม"}
              </p>
              {!searchQuery && (
                <button
                  onClick={openAddSchoolModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มโรงเรียนใหม่
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSchools.map((school) => {
                const schoolAdmins = admins.filter((a) => a.school_id === school.id && a.role === "admin");
                return (
                  <div
                    key={school.id}
                    className={`rounded-3xl border p-5 sm:p-6 flex flex-col justify-between transition-all shadow-xs ${
                      school.is_active
                        ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800"
                        : "bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Card Header: Logo, Name & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {school.logo_drive_file_id || school.logo_url ? (
                            <img
                              src={getSchoolLogoUrl(school.logo_drive_file_id, school.logo_url)}
                              alt={school.name}
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center font-black text-lg shrink-0">
                              {school.name.trim().charAt(0) || "S"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug line-clamp-1">
                              {school.name}
                            </h3>
                            {school.name_en && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                                {school.name_en}
                              </p>
                            )}
                            {school.name_jawi && (
                              <p dir="rtl" className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
                                {school.name_jawi}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                            school.is_active
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${school.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {school.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </span>
                      </div>

                      {/* Subdomain & Key Info */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span>Subdomain:</span>
                          <button
                            onClick={() => copySubdomain(school.subdomain)}
                            className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-400 flex items-center gap-1 transition"
                            title="คัดลอกพารามิเตอร์ URL"
                          >
                            <span>?school={school.subdomain}</span>
                            {copiedSubdomain === school.subdomain ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span>แอดมินประจำโรงเรียน:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {schoolAdmins.length} บัญชี
                          </span>
                        </div>

                        {school.address && (
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{school.address}</span>
                          </div>
                        )}

                        {/* Enabled Feature Flags Checklist */}
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                            สิทธิ์ระบบที่เปิดใช้งาน:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {MODULE_DEFINITIONS.map((mod) => {
                              const isEnabled = school.enabled_modules?.[mod.key] !== false;
                              return (
                                <span
                                  key={mod.key}
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                    isEnabled
                                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 line-through opacity-60"
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

                    {/* Action Toolbar */}
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <button
                        onClick={() => openAddAdminModal(school.id)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-98"
                      >
                        <UserPlus className="w-4 h-4 text-white" />
                        <span>เพิ่มแอดมินประจำโรงเรียนนี้</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditSchoolModal(school)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition shadow-xs"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-500" />
                          <span>แก้ไขข้อมูล & โมดูล</span>
                        </button>

                        <button
                          onClick={() => handleToggleSchoolActive(school)}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition shadow-xs ${
                            school.is_active
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                          }`}
                        >
                          {school.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        </button>
                      </div>

                      {/* Delete School Button */}
                      <button
                        onClick={() => school.deletion_requested && handleDeleteSchool(school)}
                        disabled={!school.deletion_requested}
                        title={
                          school.deletion_requested
                            ? "แอดมินโรงเรียนส่งคำขอลบแล้ว คลิกเพื่อลบถาวร"
                            : "ต้องให้แอดมินโรงเรียนส่งคำขอลบก่อน จึงจะสามารถลบถาวรได้"
                        }
                        className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          school.deletion_requested
                            ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 cursor-pointer shadow-sm animate-pulse"
                            : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200/50 dark:border-slate-800 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {school.deletion_requested
                          ? "⚠️ ยืนยันลบถาวร (มีคำขอจากโรงเรียน)"
                          : "ลบโรงเรียน (รอคำขอจากแอดมิน)"}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )
        )}

        {/* =========================================================================
            TAB 2: SCHOOL CREATION REQUESTS
            ========================================================================= */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            
            {/* Filter Sub-Tabs */}
            <div className="flex items-center gap-2 pb-2 overflow-x-auto">
              {[
                { key: "all", label: "ทั้งหมด", count: schoolRequests.length },
                { key: "pending", label: "รอพิจารณา", count: pendingRequestsCount },
                { key: "approved", label: "อนุมัติแล้ว", count: schoolRequests.filter((r) => r.status === "approved").length },
                { key: "denied", label: "ไม่อนุมัติ", count: schoolRequests.filter((r) => r.status === "denied").length },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRequestFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    requestFilter === f.key
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({f.count})</span>
                </button>
              ))}
            </div>

            {loadingData ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-44 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-12 text-center shadow-xs">
                <ClipboardList className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ไม่พบคำขอสร้างโรงเรียน
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  เมื่อมีผู้ส่งคำขอเพิ่มโรงเรียนใหม่ จะปรากฏรายการให้พิจารณาที่นี่
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const isPending = request.status === "pending";
                  const enabled = request.requested_modules || DEFAULT_ENABLED_MODULES;

                  return (
                    <article
                      key={request.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                        
                        <div className="space-y-3.5 min-w-0 flex-1">
                          
                          {/* Header info */}
                          <div className="flex items-start gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                                  {request.school_name}
                                </h3>
                                <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
                                  ?school={request.subdomain}
                                </code>
                              </div>
                              {request.school_name_en && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {request.school_name_en}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Requester & Contact Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">ผู้ส่งคำขอ</span>
                              <span className="font-bold text-slate-900 dark:text-white truncate block">
                                {request.requester_username || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">อีเมลผู้ส่ง</span>
                              <span className="font-bold text-slate-900 dark:text-white truncate block">
                                {request.requester_email || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">เบอร์ติดต่อ</span>
                              <span className="font-bold text-slate-900 dark:text-white truncate block">
                                {request.phone || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">อีเมลโรงเรียน</span>
                              <span className="font-bold text-slate-900 dark:text-white truncate block">
                                {request.email || "-"}
                              </span>
                            </div>
                          </div>

                          {request.address && (
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              <span className="font-bold text-slate-900 dark:text-white">ที่อยู่:</span> {request.address}
                            </p>
                          )}

                          {request.reason && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                              <span className="font-bold text-slate-900 dark:text-white">เหตุผลหรือรายละเอียดเพิ่มเติม:</span> {request.reason}
                            </p>
                          )}

                          {/* Requested modules */}
                          <div className="flex flex-wrap gap-1.5">
                            {MODULE_DEFINITIONS.map((mod) => (
                              <span
                                key={mod.key}
                                className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                                  enabled[mod.key] !== false
                                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 line-through opacity-60"
                                }`}
                              >
                                {mod.label}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>ส่งเมื่อ: {new Date(request.created_at).toLocaleString("th-TH")}</span>
                          </div>

                          {request.review_note && (
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 text-xs text-amber-800 dark:text-amber-300">
                              <span className="font-bold">หมายเหตุการพิจารณา:</span> {request.review_note}
                            </div>
                          )}

                        </div>

                        {/* Status badge & Approval actions */}
                        <div className="flex flex-col gap-2.5 sm:min-w-44 shrink-0">
                          <span
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                              request.status === "approved"
                                ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                                : request.status === "denied"
                                ? "text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
                                : "text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
                            }`}
                          >
                            {request.status === "pending" ? (
                              <Clock3 className="w-3.5 h-3.5 text-amber-500" />
                            ) : request.status === "approved" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            {request.status === "pending"
                              ? "รอการพิจารณา"
                              : request.status === "approved"
                              ? "อนุมัติแล้ว"
                              : "ไม่อนุมัติ"}
                          </span>

                          {isPending && (
                            <div className="flex flex-col gap-2 pt-1">
                              <button
                                onClick={() => handleReviewSchoolRequest(request, "approved")}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                              >
                                <Check className="w-4 h-4" />
                                อนุมัติคำขอ
                              </button>
                              <button
                                onClick={() => handleReviewSchoolRequest(request, "denied")}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs font-bold transition"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                ไม่อนุมัติ
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* =========================================================================
            TAB 3: SCHOOL ADMINS MANAGEMENT
            ========================================================================= */}
        {activeTab === "admins" && (
          loadingData ? (
            <div className="h-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    รายชื่อผู้ดูแลระบบประจำโรงเรียน
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    กำหนดและจัดการสิทธิ์แอดมินประจำแต่ละสถานศึกษา
                  </p>
                </div>
                <button
                  onClick={() => openAddAdminModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">เพิ่มแอดมินใหม่</span>
                  <span className="sm:hidden">เพิ่ม</span>
                </button>
              </div>

              {/* Table view for Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">ชื่อผู้ใช้ (Username)</th>
                      <th className="px-6 py-3.5 font-bold">บทบาท</th>
                      <th className="px-6 py-3.5 font-bold">โรงเรียนที่ดูแล</th>
                      <th className="px-6 py-3.5 font-bold">อีเมลติดต่อ</th>
                      <th className="px-6 py-3.5 font-bold text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100">
                    {filteredAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          ไม่พบผู้ดูแลระบบที่ค้นหา
                        </td>
                      </tr>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-bold flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <span className="font-mono text-sm">{admin.username}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                admin.role === "super_admin"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
                                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50"
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
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {admin.school_name || "ไม่ระบุ"}
                                </span>
                                {admin.subdomain && (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-mono">
                                    ?school={admin.subdomain}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                            {admin.email || "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {admin.role !== "super_admin" && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditAdminModal(admin)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 transition"
                                  title="แก้ไข / รีเซ็ตรหัสผ่าน"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition"
                                  title="ลบแอดมิน"
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

              {/* Cards for Mobile view */}
              <div className="space-y-3 p-4 md:hidden">
                {filteredAdmins.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">ไม่พบผู้ดูแลระบบ</div>
                ) : (
                  filteredAdmins.map((admin) => (
                    <article key={admin.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-sm text-slate-900 dark:text-white truncate">
                              {admin.username}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {admin.email || "—"}
                            </p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          admin.role === "super_admin"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200"
                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200"
                        }`}>
                          {admin.role === "super_admin" ? "Super Admin" : "School Admin"}
                        </span>
                      </div>

                      <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-[11px] block">สังกัดโรงเรียน:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {admin.role === "super_admin" ? "ทุกโรงเรียน (Platform)" : admin.school_name || "ไม่ระบุ"}
                          </span>
                        </div>

                        {admin.role !== "super_admin" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditAdminModal(admin)}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 shadow-xs"
                              title="แก้ไข"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900/50 shadow-xs"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>

            </div>
          )
        )}

      </main>

      {/* =========================================================================
          MODAL 1: ADD / EDIT SCHOOL
          ========================================================================= */}
      {isSchoolModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsSchoolModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 relative shrink-0">
              <button
                onClick={() => setIsSchoolModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {editingSchool ? "แก้ไขข้อมูลโรงเรียน" : "เพิ่มโรงเรียนใหม่"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    กำหนดรายละเอียดสถานศึกษาและสิทธิ์การใช้งานระบบ
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveSchool} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* Name TH */}
              <div>
                <label className="block text-slate-900 dark:text-white font-bold mb-1">
                  ชื่อโรงเรียน (ภาษาไทย) *
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="เช่น โรงเรียนบ้านนาวิทยา"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required
                />
              </div>

              {/* Name EN & JAWI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 dark:text-white font-bold mb-1">
                    ชื่อโรงเรียน (ภาษามลายูรูมี)
                  </label>
                  <input
                    type="text"
                    value={schoolNameEn}
                    onChange={(e) => handleSchoolNameEnChange(e.target.value)}
                    placeholder="Contoh: Sekolah Bannawittaya"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-900 dark:text-white font-bold mb-1">
                    ชื่อโรงเรียน (ภาษามลายูยาวี)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={schoolNameJawi}
                    onChange={(e) => setSchoolNameJawi(e.target.value)}
                    placeholder="چونتوه: سکوله بناويتايا"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-slate-900 dark:text-white font-bold mb-1">
                  Subdomain (ถ้าปล่อยว่าง จะสร้างจากชื่อภาษาอังกฤษอัตโนมัติ)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={schoolSubdomain}
                    onChange={(e) => setSchoolSubdomain(e.target.value)}
                    placeholder="เช่น bannawittaya"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  เข้าถึงผ่าน URL ตัวอย่าง: <span className="font-mono">?school=subdomain</span>
                </p>
              </div>

              {/* School Logo */}
              <div>
                <label className="block text-slate-900 dark:text-white font-bold mb-1.5">
                  โลโก้สถานศึกษา
                </label>

                {(logoPreview || schoolLogoDriveFileId || schoolLogoUrl) && (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-3 bg-white dark:bg-slate-800 p-1">
                    <img
                      src={logoPreview || getSchoolLogoUrl(schoolLogoDriveFileId, schoolLogoUrl)}
                      alt="Logo Preview"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => { e.currentTarget.src = "/logo.jpg"; }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition"
                      title="ลบโลโก้"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploadingLogo}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploadingLogo ? "กำลังอัปโหลดโลโก้..." : "เลือกไฟล์รูปภาพโลโก้"}
                </button>
                <p className="text-[11px] text-slate-400 mt-1">
                  รองรับ: JPG, PNG, WebP, SVG (ขนาดสูงสุด 5MB)
                </p>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 dark:text-white font-bold mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                    placeholder="เช่น 073-XXX-XXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-900 dark:text-white font-bold mb-1">
                    อีเมลติดต่อ
                  </label>
                  <input
                    type="email"
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    placeholder="contact@school.ac.th"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-900 dark:text-white font-bold mb-1">
                  ที่อยู่สถานศึกษา
                </label>
                <textarea
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  placeholder="ระบุที่ตั้ง ตำบล อำเภอ จังหวัด..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Module Feature Flags */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-slate-900 dark:text-white font-bold text-xs">
                  สิทธิ์การเปิด-ปิดฟังก์ชันใช้งาน (Module Feature Flags)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {MODULE_DEFINITIONS.map((mod) => {
                    const isChecked = enabledModules[mod.key] !== false;
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-start justify-between p-3 rounded-2xl border transition cursor-pointer ${
                          isChecked
                            ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className={`text-xs font-bold leading-tight ${isChecked ? "text-indigo-950 dark:text-indigo-200" : "text-slate-500"}`}>
                            {mod.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{mod.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setEnabledModules((prev) => ({
                              ...prev,
                              [mod.key]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploadingLogo}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploadingLogo ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังอัปโหลด...</span>
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

      {/* =========================================================================
          MODAL 2: ADD / EDIT ADMIN
          ========================================================================= */}
      {isAdminModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsAdminModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 relative">
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {editingAdmin ? "แก้ไขแอดมินประจำโรงเรียน" : "เพิ่มแอดมินประจำโรงเรียน"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    กำหนดบัญชีและโรงเรียนที่รับผิดชอบ
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAdmin} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-900 dark:text-white font-bold mb-1">
                  สังกัดโรงเรียน *
                </label>
                <select
                  value={adminSchoolId}
                  onChange={(e) => setAdminSchoolId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required
                >
                  <option value="" disabled>-- กรุณาเลือกโรงเรียน --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (?school={s.subdomain})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white font-bold mb-1">
                  ชื่อผู้ใช้ (Username) *
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="เช่น admin_bannawittaya"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white font-bold mb-1">
                  {editingAdmin ? "รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน *"}
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required={!editingAdmin}
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white font-bold mb-1">
                  อีเมลติดต่อ (ถ้ามี)
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@school.ac.th"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition"
                >
                  {editingAdmin ? "บันทึกการแก้ไข" : "สร้างบัญชีแอดมิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
