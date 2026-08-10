"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  Image,
  MapPin,
  Send,
  XCircle,
} from "lucide-react";
import { useAuth } from "../lib/useAuth";
import ThemeToggle from "../components/ThemeToggle";

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
  requested_modules: Record<string, boolean>;
  reason?: string | null;
  status: RequestStatus;
  review_note?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

const emptyModules = (): Record<ModuleKey, boolean> =>
  Object.fromEntries(MODULES.map(({ key }) => [key, true])) as Record<ModuleKey, boolean>;

function statusMeta(status: RequestStatus) {
  if (status === "approved") {
    return { label: "อนุมัติแล้ว", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" };
  }
  if (status === "denied") {
    return { label: "ไม่อนุมัติ", icon: XCircle, className: "text-red-600 bg-red-500/10 border-red-500/20" };
  }
  return { label: "รอพิจารณา", icon: Clock3, className: "text-amber-600 bg-amber-500/10 border-amber-500/20" };
}

export default function SchoolRequestPage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modules, setModules] = useState<Record<ModuleKey, boolean>>(emptyModules);

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
      const response = await fetch("/api/school-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: schoolName,
          school_name_en: schoolNameEn,
          subdomain,
          logo_url: logoUrl,
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

      setSchoolName("");
      setSchoolNameEn("");
      setSubdomain("");
      setLogoUrl("");
      setAddress("");
      setPhone("");
      setEmail("");
      setReason("");
      setModules(emptyModules());
      await fetchRequests();
      await Swal.fire({ icon: "success", title: "ส่งคำขอสำเร็จ", text: "คำขอของคุณถูกส่งไปยัง Super Admin แล้ว", timer: 1800, showConfirmButton: false });
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "ส่งคำขอไม่สำเร็จ", text: error.message });
    } finally {
      setSubmitting(false);
    }
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

      <main className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-8">
        <form onSubmit={submitRequest} className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black">รายละเอียดโรงเรียน</h2>
            <p className="text-xs text-muted-foreground mt-1">กรอกข้อมูลที่ต้องการใช้สำหรับสร้างโรงเรียนใหม่</p>
          </div>

          {!user && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
              <div>
                <h3 className="font-extrabold">ข้อมูลผู้ติดต่อ</h3>
                <p className="text-xs text-muted-foreground mt-1">กรอกเพื่อให้ Super Admin ติดต่อกลับและแจ้งผลคำขอ</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-1.5"><span className="ui-label">ชื่อผู้ติดต่อ *</span><input required={!user} value={requesterName} onChange={(e) => setRequesterName(e.target.value)} className="ui-input" /></label>
                <label className="space-y-1.5"><span className="ui-label">อีเมลผู้ติดต่อ *</span><input required={!user} type="email" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} className="ui-input" /></label>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1.5"><span className="ui-label">ชื่อโรงเรียน *</span><input required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="ui-input" placeholder="เช่น โรงเรียน..." /></label>
            <label className="space-y-1.5"><span className="ui-label">ชื่อภาษาอังกฤษ</span><input value={schoolNameEn} onChange={(e) => setSchoolNameEn(e.target.value)} className="ui-input" placeholder="School name" /></label>
            <label className="space-y-1.5"><span className="ui-label">Subdomain *</span><div className="relative"><Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase())} className="ui-input pl-9" placeholder="my-school" /></div></label>
            <label className="space-y-1.5"><span className="ui-label">URL โลโก้โรงเรียน</span><div className="relative"><Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="ui-input pl-9" placeholder="https://..." /></div></label>
          </div>

          <label className="space-y-1.5 block"><span className="ui-label">ที่อยู่โรงเรียน</span><div className="relative"><MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" /><textarea value={address} onChange={(e) => setAddress(e.target.value)} className="ui-input pl-9 min-h-24 resize-y" placeholder="ที่อยู่สำหรับแสดงในระบบ" /></div></label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1.5"><span className="ui-label">เบอร์โทรศัพท์</span><input value={phone} onChange={(e) => setPhone(e.target.value)} className="ui-input" /></label>
            <label className="space-y-1.5"><span className="ui-label">อีเมลติดต่อ</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ui-input" /></label>
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

          <button disabled={submitting} className="ui-btn ui-btn-primary w-full py-3.5 disabled:opacity-60"><Send className="w-4 h-4" />{submitting ? "กำลังส่งคำขอ..." : "ส่งคำขอให้ Super Admin"}</button>
        </form>

        <section className="space-y-4">
          <div className="flex items-end justify-between"><div><h2 className="text-xl font-black">คำขอของฉัน</h2><p className="text-xs text-muted-foreground mt-1">ติดตามผลการพิจารณาโรงเรียนที่ส่งคำขอ</p></div></div>
          {loadingRequests ? <div className="bg-card border border-border rounded-3xl p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div> : requests.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-10 text-center text-sm text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />ยังไม่มีคำขอ</div>
          ) : (
            requests.map((request) => {
              const meta = statusMeta(request.status);
              const StatusIcon = meta.icon;
              return (
                <article key={request.id} className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold">{request.school_name}</h3><p className="text-xs text-muted-foreground font-mono">?school={request.subdomain}</p></div><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${meta.className}`}><StatusIcon className="w-3.5 h-3.5" />{meta.label}</span></div>
                  <div className="flex flex-wrap gap-1.5">{MODULES.filter(({ key }) => request.requested_modules?.[key] !== false).map(({ key, label }) => <span key={key} className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">{label}</span>)}</div>
                  {request.review_note && <div className="rounded-xl bg-muted/60 border border-border p-3 text-xs"><span className="font-bold">หมายเหตุจาก Super Admin: </span>{request.review_note}</div>}
                  <p className="text-[11px] text-muted-foreground">ส่งเมื่อ {new Date(request.created_at).toLocaleString("th-TH")}</p>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
