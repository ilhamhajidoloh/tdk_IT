"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Pencil,
  RotateCcw,
  Search,
  Send,
  Upload,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "../lib/useAuth";
import ThemeToggle from "../components/ThemeToggle";

import { slugify, generateSubdomain } from "../lib/format";

const MODULES = [
  { key: "news", label: "ข่าวสารประชาสัมพันธ์" },
  { key: "duty", label: "เวรครู-แม่ครัว" },
  { key: "attendance", label: "เช็กชื่อเข้าเรียน" },
  { key: "evaluations", label: "ประเมินคุณลักษณะ" },
  { key: "correspondence", label: "หนังสือรับ-ส่ง" },
  { key: "grades", label: "เกรดและคะแนน" },
  { key: "schedule", label: "ตารางเรียน" },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];
type RequestStatus = "pending" | "approved" | "denied";

interface SchoolRequest {
  id: string;
  school_name: string;
  school_name_en?: string | null;
  subdomain: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  requester_username?: string | null;
  requester_email?: string | null;
  requested_modules: Record<string, boolean>;
  reason?: string | null;
  status: RequestStatus;
  review_note?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  school_id?: string | null;
  is_active?: boolean;
  has_admin?: boolean;
}

const emptyModules = (): Record<ModuleKey, boolean> =>
  Object.fromEntries(MODULES.map(({ key }) => [key, true])) as Record<ModuleKey, boolean>;

function statusMeta(status: RequestStatus, hasAdmin?: boolean) {
  if (status === "approved") {
    if (hasAdmin) {
      return { label: "เปิดใช้งานแล้ว", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    }
    return { label: "อนุมัติแล้ว (รอสร้าง Admin)", icon: UserPlus, className: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
  }
  if (status === "denied") {
    return { label: "ไม่อนุมัติ (แก้ไขได้)", icon: XCircle, className: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20" };
  }
  return { label: "รอพิจารณา", icon: Clock3, className: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" };
}

export default function SchoolRequestPage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modules, setModules] = useState<Record<ModuleKey, boolean>>(emptyModules);

  // Form Fields
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [schoolNameEn, setSchoolNameEn] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");

  // Logo Upload State
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoUploadPromiseRef = useRef<Promise<{ fileId?: string; logoUrl: string } | null> | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SchoolRequest[]>([]);
  const [searching, setSearching] = useState(false);

  // Setup Admin Modal State
  const [isSetupAdminModalOpen, setIsSetupAdminModalOpen] = useState(false);
  const [setupTargetRequest, setSetupTargetRequest] = useState<SchoolRequest | null>(null);
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupSubmitting, setSetupSubmitting] = useState(false);

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
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingLogo(true);
    const promise = (async () => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/school-requests/upload-logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถอัปโหลดโลโก้ได้");

      const uploadedUrl = data.url || data.logo_url;
      setLogoUrl(uploadedUrl);
      setLogoPreview(uploadedUrl);
      return { fileId: data.fileId as string, logoUrl: uploadedUrl as string };
    })();

    logoUploadPromiseRef.current = promise;

    try {
      await promise;
      Swal.fire({ icon: "success", title: "อัปโหลดโลโก้เรียบร้อยแล้ว", timer: 1500, showConfirmButton: false });
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
    setLogoUrl("");
    setLogoPreview("");
    logoUploadPromiseRef.current = null;
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleStartEdit = (request: SchoolRequest) => {
    setEditingRequestId(request.id);
    setSchoolName(request.school_name || "");
    setSchoolNameEn(request.school_name_en || "");
    setSubdomain(request.subdomain || "");
    setLogoUrl(request.logo_url || "");
    setLogoPreview(request.logo_url || "");
    setAddress(request.address || "");
    setPhone(request.phone || "");
    setEmail(request.email || "");
    setReason(request.reason || "");
    setRequesterName(request.requester_username || "");
    setRequesterEmail(request.requester_email || "");

    if (request.requested_modules) {
      const activeMods = { ...emptyModules() };
      MODULES.forEach(({ key }) => {
        activeMods[key] = request.requested_modules[key] !== false;
      });
      setModules(activeMods);
    } else {
      setModules(emptyModules());
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingRequestId(null);
    setSchoolName("");
    setSchoolNameEn("");
    setSubdomain("");
    handleRemoveLogo();
    setAddress("");
    setPhone("");
    setEmail("");
    setReason("");
    setModules(emptyModules());
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(`/api/school-requests?q=${encodeURIComponent(query.trim())}`);
      if (response.ok) {
        setSearchResults(await response.json());
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const openSetupAdminModal = (request: SchoolRequest) => {
    setSetupTargetRequest(request);
    setSetupUsername(`admin_${request.subdomain}`);
    setSetupPassword("");
    setSetupConfirmPassword("");
    setSetupEmail(request.requester_email || request.email || "");
    setIsSetupAdminModalOpen(true);
  };

  const handleSetupAdmin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!setupTargetRequest) return;
    if (setupPassword !== setupConfirmPassword) {
      Swal.fire("ข้อผิดพลาด", "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน", "error");
      return;
    }

    setSetupSubmitting(true);
    try {
      const response = await fetch("/api/school-requests/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: setupTargetRequest.id,
          username: setupUsername.trim(),
          password: setupPassword.trim(),
          email: setupEmail.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ไม่สามารถสร้างบัญชี Admin ได้");

      setIsSetupAdminModalOpen(false);
      if (searchQuery.trim()) handleSearch(searchQuery);
      fetchRequests();

      const result = await Swal.fire({
        icon: "success",
        title: "🎉 เปิดใช้งานโรงเรียนสำเร็จ!",
        html: `สร้างบัญชี Admin (<strong>${setupUsername}</strong>) เรียบร้อยแล้ว<br/>โรงเรียน <strong>${setupTargetRequest.school_name}</strong> อยู่ในรายการเลือกโรงเรียนบนหน้าหลักเรียบร้อยแล้ว`,
        showCancelButton: true,
        confirmButtonText: "เข้าสู่หน้าโรงเรียนทันที",
        cancelButtonText: "ปิดหน้าต่าง",
        confirmButtonColor: "#10b981",
      });

      if (result.isConfirmed) {
        window.location.href = `/home?school=${encodeURIComponent(setupTargetRequest.subdomain)}`;
      }
    } catch (err: any) {
      Swal.fire("ข้อผิดพลาด", err.message, "error");
    } finally {
      setSetupSubmitting(false);
    }
  };

  const handleSchoolNameEnChange = (val: string) => {
    setSchoolNameEn(val);
    if (!subdomain || subdomain === slugify(schoolNameEn)) {
      setSubdomain(slugify(val));
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
    else if (!loading) setLoadingRequests(false);
  }, [user, loading]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await fetch("/api/school-requests");
      if (response.ok) setRequests(await response.json());
    } finally {
      setLoadingRequests(false);
    }
  };

  const toggleModule = (key: ModuleKey) => {
    setModules((current) => ({ ...current, [key]: !current[key] }));
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      let finalLogoUrl = logoUrl.trim() || null;

      if (logoUploadPromiseRef.current) {
        try {
          const uploadRes = await logoUploadPromiseRef.current;
          if (uploadRes?.logoUrl) {
            finalLogoUrl = uploadRes.logoUrl;
          }
        } catch (uploadErr) {
          console.error("In-flight logo upload failed before save:", uploadErr);
        }
      }

      const finalSubdomain = generateSubdomain(subdomain, schoolNameEn, schoolName);
      const isEdit = !!editingRequestId;
      const url = isEdit ? `/api/school-requests/${editingRequestId}` : "/api/school-requests";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: schoolName,
          school_name_en: schoolNameEn,
          subdomain: finalSubdomain,
          logo_url: finalLogoUrl,
          address,
          phone,
          email,
          reason,
          requester_name: requesterName,
          requester_email: requesterEmail,
          requested_modules: modules,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ไม่สามารถส่งคำขอได้");

      cancelEdit();
      if (searchQuery.trim()) handleSearch(searchQuery);
      await fetchRequests();

      await Swal.fire({
        icon: "success",
        title: isEdit ? "🎉 ส่งคำขอพิจารณาใหม่สำเร็จ!" : "ส่งคำขอสำเร็จ",
        text: isEdit
          ? "สถานะคำขอถูกปรับเป็น 'รอพิจารณา' และส่งไปยัง Super Admin เรียบร้อยแล้ว"
          : "คำขอของคุณถูกส่งไปยัง Super Admin แล้ว",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "ไม่สามารถดำเนินการได้", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequestCard = (request: SchoolRequest) => {
    const meta = statusMeta(request.status, request.has_admin);
    const StatusIcon = meta.icon;
    const isApproved = request.status === "approved";

    return (
      <article key={request.id} className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3.5 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-foreground">{request.school_name}</h3>
            {request.school_name_en && (
              <p className="text-xs text-muted-foreground font-medium">{request.school_name_en}</p>
            )}
            {request.requester_username && (
              <p className="text-xs text-muted-foreground mt-1 font-semibold">
                ผู้ขอ: <span className="text-foreground">{request.requester_username}</span>
              </p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shrink-0 ${meta.className}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {meta.label}
          </span>
        </div>

        {isApproved && request.has_admin && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold">โรงเรียนอนุมัติและเปิดใช้งานแล้ว!</span>
              <Link
                href={`/home?school=${encodeURIComponent(request.subdomain)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm"
              >
                <span>เข้าสู่ระบบโรงเรียน</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-[11px] font-mono opacity-90">URL: ?school={request.subdomain}</p>
          </div>
        )}

        {isApproved && !request.has_admin && (
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-extrabold flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>คำขอได้รับอนุมัติแล้ว! ขั้นตอนสุดท้าย: สร้างบัญชี Admin</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                สร้างบัญชีผู้ดูแลระบบ (Admin) เพื่อเปิดใช้งานโรงเรียนบนหน้าหลัก
              </p>
            </div>
            <button
              onClick={() => openSetupAdminModal(request)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>สร้างบัญชี Admin และเปิดใช้งานโรงเรียน</span>
            </button>
          </div>
        )}

        {request.status === "denied" && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-200 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-extrabold flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>คำขอนี้ไม่ผ่านการอนุมัติ (สามารถแก้ไขแล้วส่งพิจารณาใหม่ได้)</span>
              </p>
              {request.review_note && (
                <p className="text-[11px] font-medium opacity-90">
                  <strong>เหตุผลจาก Super Admin:</strong> {request.review_note}
                </p>
              )}
            </div>
            <button
              onClick={() => handleStartEdit(request)}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              <span>แก้ไขข้อมูล และส่งคำขอพิจารณาใหม่</span>
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {MODULES.filter(({ key }) => request.requested_modules?.[key] !== false).map(({ key, label }) => (
            <span key={key} className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-semibold">
              {label}
            </span>
          ))}
        </div>

        {request.review_note && request.status !== "denied" && (
          <div className="rounded-2xl bg-muted/70 border border-border p-3 text-xs">
            <span className="font-extrabold text-foreground">หมายเหตุจาก Super Admin: </span>
            <span className="text-muted-foreground font-medium">{request.review_note}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50 font-medium">
          <span>ส่งเมื่อ {new Date(request.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
          <span className="font-mono">Subdomain: {request.subdomain}</span>
        </div>
      </article>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
            <div>
              <h1 className="font-black text-lg">ขอสร้างโรงเรียน</h1>
              <p className="text-xs text-muted-foreground">ส่งรายละเอียดให้ Super Admin พิจารณา</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"><ArrowLeft className="w-4 h-4" />กลับหน้าหลัก</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] gap-8">
        {/* Left Column: School Request Form */}
        <form onSubmit={submitRequest} className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">
                {editingRequestId ? "✏️ แก้ไขคำขอสร้างโรงเรียน" : "รายละเอียดโรงเรียน"}
              </h2>
              {editingRequestId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  ยกเลิกแก้ไข
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {editingRequestId
                ? "แก้ไขข้อมูลที่ถูกปฏิเสธแล้วส่งพิจารณาใหม่อีกครั้ง"
                : "กรอกข้อมูลที่ต้องการใช้สำหรับสร้างโรงเรียนใหม่"}
            </p>
          </div>

          {editingRequestId && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-semibold">
              ⚠️ คุณกำลังแก้ไขคำขอที่ถูกปฏิเสธ เมื่อบันทึกระบบจะปรับสถานะเป็น &quot;รอพิจารณา&quot; ให้ Super Admin ทบทวนใหม่อีกครั้ง
            </div>
          )}

          {!user && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
              <div>
                <h3 className="font-extrabold">ข้อมูลผู้ติดต่อ</h3>
                <p className="text-xs text-muted-foreground mt-1">กรอกเพื่อให้ Super Admin ติดต่อกลับและใช้สำหรับค้นหาสถานะคำขอ</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-1.5"><span className="ui-label">ชื่อผู้ติดต่อ *</span><input required={!user} value={requesterName} onChange={(e) => setRequesterName(e.target.value)} className="ui-input" placeholder="เช่น สมชาย ใจดี" /></label>
                <label className="space-y-1.5"><span className="ui-label">อีเมลผู้ติดต่อ *</span><input required={!user} type="email" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} className="ui-input" placeholder="email@domain.com" /></label>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="ui-label">ชื่อโรงเรียน (ภาษาไทย) *</span>
              <input required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="ui-input" placeholder="เช่น โรงเรียนบ้านนาวิทยา" />
            </label>
            <label className="space-y-1.5">
              <span className="ui-label">ชื่อโรงเรียน (ภาษาอังกฤษ)</span>
              <input value={schoolNameEn} onChange={(e) => handleSchoolNameEnChange(e.target.value)} className="ui-input" placeholder="เช่น Bannawittaya School" />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 block">
              <span className="ui-label">Subdomain</span>
              <input pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase())} className="ui-input font-mono" placeholder="เช่น bannawittaya" />
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">* หากไม่ระบุ ระบบจะสร้างจากชื่อภาษาอังกฤษให้อัตโนมัติ</p>
            </label>

            <div className="space-y-1.5 block">
              <span className="ui-label">โลโก้โรงเรียน</span>

              {(logoPreview || logoUrl) && (
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-border mb-2 shadow-sm">
                  <img
                    src={logoPreview || logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/tdk-it-logo.svg"; }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                    title="ลบรูปโลโก้"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={isUploadingLogo}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="ui-btn ui-btn-outline text-xs py-2 px-3.5 disabled:opacity-60 font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingLogo ? "กำลังอัพโหลด..." : "อัปโหลดไฟล์รูปโลโก้"}</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">รองรับ JPG, PNG, WebP, SVG (สูงสุด 5MB)</p>
            </div>
          </div>

          <label className="space-y-1.5 block">
            <span className="ui-label">ที่อยู่โรงเรียน</span>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="ui-input min-h-24 resize-y" placeholder="ที่อยู่สำหรับแสดงในระบบ" />
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1.5"><span className="ui-label">เบอร์โทรศัพท์</span><input value={phone} onChange={(e) => setPhone(e.target.value)} className="ui-input" placeholder="08X-XXX-XXXX" /></label>
            <label className="space-y-1.5"><span className="ui-label">อีเมลติดต่อ</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ui-input" placeholder="contact@school.ac.th" /></label>
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-primary" /><h3 className="font-extrabold">ฟังก์ชันที่ต้องการใช้งาน</h3></div>
            <div className="grid sm:grid-cols-2 gap-2">
              {MODULES.map((module) => (
                <label key={module.key} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer">
                  <input type="checkbox" checked={modules[module.key]} onChange={() => toggleModule(module.key)} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-semibold">{module.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="space-y-1.5 block"><span className="ui-label">รายละเอียดเพิ่มเติม / เหตุผลที่ขอสร้างโรงเรียน</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="ui-input min-h-28 resize-y" placeholder="อธิบายความต้องการหรือข้อมูลเพิ่มเติม" /></label>

          <button disabled={submitting || isUploadingLogo} className="ui-btn ui-btn-primary w-full py-3.5 disabled:opacity-60">
            <Send className="w-4 h-4" />
            {isUploadingLogo
              ? "กำลังอัพโหลดโลโก้..."
              : submitting
              ? "กำลังส่งคำขอ..."
              : editingRequestId
              ? "บันทึกและส่งคำขอพิจารณาใหม่"
              : "ส่งคำขอให้ Super Admin"}
          </button>
        </form>

        {/* Right Column: Status Search & My Requests */}
        <section className="space-y-6">
          {/* Status Search Card */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                <span>ตรวจสอบสถานะคำขอ</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                พิมพ์ชื่อโรงเรียน ชื่อผู้ติดต่อ หรืออีเมล เพื่อเช็กสถานะคำขอ
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ paddingLeft: "2.6rem" }}
                className="ui-input pr-4 py-2.5 text-sm"
                placeholder="พิมพ์ชื่อโรงเรียน หรือ ผู้ติดต่อ..."
              />
            </div>

            {searchQuery.trim() !== "" && (
              <div className="space-y-3 pt-2 border-t border-border">
                <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                  ผลการค้นหา ({searchResults.length})
                </h3>
                {searching ? (
                  <div className="py-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-muted/40 rounded-2xl border border-dashed border-border font-medium">
                    ไม่พบคำขอที่ตรงกับ &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  searchResults.map((request) => renderRequestCard(request))
                )}
              </div>
            )}
          </div>

          {/* My Requests (If logged in or submitted) */}
          {user && searchQuery.trim() === "" && (
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-black">คำขอของฉัน</h2>
                  <p className="text-xs text-muted-foreground mt-1">คำขอที่คุณส่งจากบัญชีนี้</p>
                </div>
              </div>
              {loadingRequests ? (
                <div className="bg-card border border-border rounded-3xl p-8 text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : requests.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-8 text-center text-sm text-muted-foreground font-medium">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  ยังไม่มีคำขอในบัญชีนี้
                </div>
              ) : (
                requests.map((request) => renderRequestCard(request))
              )}
            </div>
          )}
        </section>
      </main>

      {/* Setup Admin Modal */}
      {isSetupAdminModalOpen && setupTargetRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in-up overflow-y-auto"
          onClick={() => setIsSetupAdminModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">สร้างบัญชีผู้ดูแลระบบ (Admin)</h3>
                  <p className="text-xs text-white/80 font-medium">{setupTargetRequest.school_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSetupAdminModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSetupAdmin} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-foreground space-y-1">
                <p className="font-bold text-xs">🎉 คำขอได้รับอนุมัติเรียบร้อยแล้ว!</p>
                <p className="text-[11px] text-muted-foreground">
                  ตั้งค่าบัญชี Admin สำหรับเข้าล็อกอินเพื่อจัดการโรงเรียน เมื่อสร้างเสร็จแล้ว โรงเรียนของคุณจะปรากฏในรายการเลือกโรงเรียนบนหน้าหลักทันที
                </p>
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">Username ผู้ดูแลระบบ *</label>
                <input
                  type="text"
                  required
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  placeholder="เช่น admin_bannawittaya"
                  className="ui-input font-mono"
                />
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">รหัสผ่าน (Password) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="ui-input"
                />
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">ยืนยันรหัสผ่าน *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className="ui-input"
                />
              </div>

              <div>
                <label className="block text-foreground font-bold mb-1">อีเมลติดต่อ</label>
                <input
                  type="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="ui-input"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSetupAdminModalOpen(false)}
                  className="ui-btn ui-btn-outline"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={setupSubmitting}
                  className="ui-btn ui-btn-primary disabled:opacity-60"
                >
                  {setupSubmitting ? "กำลังเปิดใช้งาน..." : "สร้าง Admin & เปิดใช้งานโรงเรียน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
