"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { SystemSetting } from "../types";
import ModalPortal from "@/app/components/ModalPortal";
import { 
  FileCheck, 
  Upload, 
  Trash2, 
  Eye, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Cloud,
  FileSignature,
  PenTool,
  Check
} from "lucide-react";

interface TeacherSignatureItem {
  id: string;
  name: string;
  email?: string;
  color?: string | null;
  has_signature: boolean;
  signature_url: string | null;
  updated_at: string | null;
}

interface TermSignaturesSectionProps {
  settingsList: SystemSetting[];
  token?: string | null;
  schoolId?: string;
  onSettingsUpdated?: () => void;
}

export default function TermSignaturesSection({
  settingsList,
  token,
  schoolId,
  onSettingsUpdated,
}: TermSignaturesSectionProps) {
  const [selectedSettingId, setSelectedSettingId] = useState<string>(
    settingsList[0]?.id ? String(settingsList[0].id) : ""
  );
  const [teachers, setTeachers] = useState<TeacherSignatureItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "uploaded" | "missing">("all");
  const [uploadingAcademic, setUploadingAcademic] = useState(false);
  const [uploadingTeacherId, setUploadingTeacherId] = useState<string | null>(null);
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
  const [padModal, setPadModal] = useState<{
    isOpen: boolean;
    type: "academic_head" | "teacher";
    teacherId?: string;
    title: string;
  }>({
    isOpen: false,
    type: "academic_head",
    title: "",
  });

  const academicFileInputRef = useRef<HTMLInputElement | null>(null);
  const teacherFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const currentSetting = settingsList.find(
    (s) => String(s.id) === String(selectedSettingId)
  ) || settingsList[0];

  useEffect(() => {
    if (settingsList.length > 0 && !selectedSettingId) {
      setSelectedSettingId(String(settingsList[0].id));
    }
  }, [settingsList, selectedSettingId]);

  useEffect(() => {
    if (selectedSettingId && token) {
      loadTeachers();
    }
  }, [selectedSettingId, token]);

  const loadTeachers = async () => {
    if (!selectedSettingId || !token) return;
    setLoadingTeachers(true);
    try {
      const schoolParam = schoolId ? `&schoolId=${encodeURIComponent(schoolId)}` : "";
      const res = await fetch(
        `/api/signatures/term-teachers?settingId=${selectedSettingId}${schoolParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      } else {
        console.error("Failed to load teachers signatures");
      }
    } catch (err) {
      console.error("Error loading teachers signatures:", err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleUploadAcademicSignature = async (file: File) => {
    if (!token || !selectedSettingId) return;

    const isSupported =
      ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"].includes(file.type) ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif") ||
      file.name.toLowerCase().endsWith(".png") ||
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg") ||
      file.name.toLowerCase().endsWith(".webp");

    if (!isSupported) {
      Swal.fire("ชนิดไฟล์ไม่ถูกต้อง", "รองรับไฟล์ PNG, JPEG, WebP และไฟล์จาก iPad/iPhone (HEIC)", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire("ขนาดไฟล์ใหญ่เกินไป", "ขนาดไฟล์ต้องไม่เกิน 10MB", "error");
      return;
    }

    setUploadingAcademic(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "academic_head");
      formData.append("settingId", selectedSettingId);
      if (schoolId) formData.append("schoolId", schoolId);

      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCacheBuster(Date.now());
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          text: "อัปโหลดลายเซ็นหัวหน้าฝ่ายวิชาการเรียบร้อยแล้ว",
          timer: 1800,
          showConfirmButton: false,
        });
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.error || data.details || "ไม่สามารถอัปโหลดได้", "error");
      }
    } catch (err: unknown) {
      Swal.fire("เกิดข้อผิดพลาด", (err as Error).message, "error");
    } finally {
      setUploadingAcademic(false);
      if (academicFileInputRef.current) academicFileInputRef.current.value = "";
    }
  };

  const handleDeleteAcademicSignature = async () => {
    if (!token || !selectedSettingId) return;

    const confirm = await Swal.fire({
      title: "ยืนยันการลบลายเซ็น?",
      text: "ลายเซ็นหัวหน้าฝ่ายวิชาการประจำเทอมนี้จะถูกลบออกจากระบบและ Cloud Storage",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });

    if (!confirm.isConfirmed) return;

    try {
      const schoolParam = schoolId ? `&schoolId=${encodeURIComponent(schoolId)}` : "";
      const res = await fetch(
        `/api/signatures?type=academic_head&settingId=${selectedSettingId}${schoolParam}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setCacheBuster(Date.now());
        Swal.fire("ลบเรียบร้อย", "ลบลายเซ็นหัวหน้าฝ่ายวิชาการแล้ว", "success");
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.error || "ไม่สามารถลบได้", "error");
      }
    } catch (err: unknown) {
      Swal.fire("เกิดข้อผิดพลาด", (err as Error).message, "error");
    }
  };

  const handleUploadTeacherSignature = async (teacherId: string, file: File) => {
    if (!token || !selectedSettingId) return;

    const isSupported =
      ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"].includes(file.type) ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif") ||
      file.name.toLowerCase().endsWith(".png") ||
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg") ||
      file.name.toLowerCase().endsWith(".webp");

    if (!isSupported) {
      Swal.fire("ชนิดไฟล์ไม่ถูกต้อง", "รองรับไฟล์ PNG, JPEG, WebP และไฟล์จาก iPad/iPhone (HEIC)", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire("ขนาดไฟล์ใหญ่เกินไป", "ขนาดไฟล์ต้องไม่เกิน 10MB", "error");
      return;
    }

    setUploadingTeacherId(teacherId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "teacher");
      formData.append("settingId", selectedSettingId);
      formData.append("teacherId", teacherId);
      if (schoolId) formData.append("schoolId", schoolId);

      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCacheBuster(Date.now());
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          text: "อัปโหลดลายเซ็นครูผู้สอนเรียบร้อยแล้ว",
          timer: 1800,
          showConfirmButton: false,
        });
        loadTeachers();
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.error || data.details || "ไม่สามารถอัปโหลดได้", "error");
      }
    } catch (err: unknown) {
      Swal.fire("เกิดข้อผิดพลาด", (err as Error).message, "error");
    } finally {
      setUploadingTeacherId(null);
      if (teacherFileInputRefs.current[teacherId]) {
        teacherFileInputRefs.current[teacherId]!.value = "";
      }
    }
  };

  const handleDeleteTeacherSignature = async (teacherId: string, teacherName: string) => {
    if (!token || !selectedSettingId) return;

    const confirm = await Swal.fire({
      title: `ลบลายเซ็นของ ${teacherName}?`,
      text: "ลายเซ็นของครูประจำเทอมนี้จะถูกลบออกจากระบบและ Cloud Storage",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });

    if (!confirm.isConfirmed) return;

    try {
      const schoolParam = schoolId ? `&schoolId=${encodeURIComponent(schoolId)}` : "";
      const res = await fetch(
        `/api/signatures?type=teacher&settingId=${selectedSettingId}&teacherId=${teacherId}${schoolParam}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setCacheBuster(Date.now());
        Swal.fire("ลบเรียบร้อย", "ลบลายเซ็นครูประจำเทอมนี้แล้ว", "success");
        loadTeachers();
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.error || "ไม่สามารถลบได้", "error");
      }
    } catch (err: unknown) {
      Swal.fire("เกิดข้อผิดพลาด", (err as Error).message, "error");
    }
  };

  const viewSignatureModal = (title: string, imageUrl: string) => {
    Swal.fire({
      title,
      html: `
        <div style="background-image: repeating-linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%, #f1f5f9), repeating-linear-gradient(45deg, #f1f5f9 25%, #ffffff 25%, #ffffff 75%, #f1f5f9 75%, #f1f5f9); background-position: 0 0, 10px 10px; background-size: 20px 20px; border-radius: 12px; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 140px; border: 1px solid #e2e8f0;">
          <img src="${imageUrl}" alt="${title}" style="max-height: 180px; max-width: 100%; object-fit: contain;" />
        </div>
      `,
      confirmButtonText: "ปิด",
      customClass: {
        popup: "rounded-3xl border border-border shadow-2xl",
      },
    });
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchQuery = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchQuery) return false;
    if (filterStatus === "uploaded") return t.has_signature;
    if (filterStatus === "missing") return !t.has_signature;
    return true;
  });

  const totalTeachers = teachers.length;
  const uploadedCount = teachers.filter((t) => t.has_signature).length;
  const hasAcademicSignature = Boolean(currentSetting?.academic_head_signature_key);
  const academicSignatureUrl = selectedSettingId
    ? `/api/signatures/proxy?type=academic_head&id=${selectedSettingId}&t=${cacheBuster}`
    : "";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Info & Term Selector */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FileSignature className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                จัดการลายเซ็นดิจิทัลประจำภาคเรียน
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ไฟล์ลายเซ็นจะถูกส่งไปจัดเก็บอย่างปลอดภัยบน <b>Oracle Cloud Infrastructure (OCI) Object Storage</b>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <label className="text-xs font-bold text-foreground whitespace-nowrap">
              เลือกภาคเรียน:
            </label>
            <select
              value={selectedSettingId}
              onChange={(e) => setSelectedSettingId(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {settingsList.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  ปีการศึกษา {s.academic_year} ภาคเรียนที่ {s.term} {s.is_active ? "(ปัจจุบัน)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Oracle Storage Banner Info */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
          <Cloud className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">
            <b>ระบบจัดเก็บ Oracle Storage พร้อมใช้งาน:</b> ลายเซ็นที่อัปโหลดจะถูกนำไปแสดงผลบนเอกสารสรุปผลการเรียน (Report Card) และเอกสารออกเกรดประจำเทอมโดยอัตโนมัติ
          </div>
        </div>
      </div>

      {/* Section 1: Academic Head Signature */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
              <span>👑 ลายเซ็นหัวหน้าฝ่ายวิชาการ / ผู้อำนวยการ</span>
              {hasAcademicSignature ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> อัปโหลดแล้ว
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-500/30">
                  <AlertCircle className="w-3 h-3" /> ยังไม่มีลายเซ็น
                </span>
              )}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              ชื่อหัวหน้าฝ่ายวิชาการในเทอมนี้: <b>{currentSetting?.academic_head || "ยังไม่ได้ระบุชื่อ (กำหนดในตั้งค่าภาคเรียน)"}</b>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-6 p-4 rounded-xl border border-dashed border-border bg-muted/20">
          {/* Signature Preview Box */}
          <div 
            className="w-full max-w-[260px] sm:w-56 h-28 rounded-xl border border-border bg-white dark:bg-card flex items-center justify-center p-2 relative overflow-hidden shadow-inner shrink-0"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03)), repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, #ffffff 25%, #ffffff 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03))",
              backgroundSize: "16px 16px",
            }}
          >
            {hasAcademicSignature ? (
              <img
                src={academicSignatureUrl}
                alt="Academic Head Signature"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="text-center text-muted-foreground text-xs font-medium">
                ไม่มีรูปลายเซ็น
              </div>
            )}
          </div>

          {/* Upload / Manage Actions */}
          <div className="flex flex-col gap-2.5 w-full sm:w-auto">
            <input
              type="file"
              ref={academicFileInputRef}
              accept="image/*,.heic,.heif,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadAcademicSignature(file);
              }}
            />

            <div className="flex flex-wrap items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => academicFileInputRef.current?.click()}
                disabled={uploadingAcademic}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {uploadingAcademic ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {hasAcademicSignature ? "เปลี่ยนไฟล์" : "อัปโหลดไฟล์"}
              </button>

              <button
                type="button"
                onClick={() => setPadModal({
                  isOpen: true,
                  type: "academic_head",
                  title: "หัวหน้าฝ่ายวิชาการ (" + (currentSetting?.academic_head || "ประจำเทอม") + ")"
                })}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                title="วาดลายเซ็นด้วย Apple Pencil หรือนิ้วมือบน iPad/iPhone"
              >
                <PenTool className="w-3.5 h-3.5" />
                วาดด้วย Apple Pencil / นิ้วมือ
              </button>

              {hasAcademicSignature && (
                <div className="flex items-center gap-1.5 self-center">
                  <button
                    type="button"
                    onClick={() => viewSignatureModal("ลายเซ็นหัวหน้าฝ่ายวิชาการ", academicSignatureUrl)}
                    className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-all cursor-pointer shadow-sm"
                    title="ดูรูปขยาย"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAcademicSignature}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 transition-all cursor-pointer"
                    title="ลบลายเซ็น"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              📱 รองรับ iPad/iPhone เต็มรูปแบบ: รูปถ่าย HEIC/HEIF จากกล้อง, คลังภาพ, หรือไฟล์ PNG/JPEG (แปลงไฟล์ให้อัตโนมัติ)
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Teachers Signatures */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
              <span>👨‍🏫 ลายเซ็นครูผู้สอนประจำภาคเรียน</span>
              <span className="text-xs font-medium text-muted-foreground">
                ({uploadedCount}/{totalTeachers} คน)
              </span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              จัดการไฟล์ลายเซ็นของครูผู้สอนแต่ละท่านเพื่อใช้ในการลงนามผลการเรียนและสมุดรายงาน
            </p>
          </div>

          <button
            type="button"
            onClick={loadTeachers}
            disabled={loadingTeachers}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTeachers ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาชื่อครู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-xl border border-border text-xs w-full sm:w-auto sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all text-center truncate ${
                filterStatus === "all"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ทั้งหมด ({totalTeachers})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("uploaded")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all text-center truncate ${
                filterStatus === "uploaded"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              มีลายเซ็น ({uploadedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("missing")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all text-center truncate ${
                filterStatus === "missing"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ยังไม่มี ({totalTeachers - uploadedCount})
            </button>
          </div>
        </div>

        {/* Teachers Desktop & Tablet Table (md and up) */}
        <div className="hidden md:block border border-border rounded-xl overflow-x-auto bg-card">
          <table className="w-full text-xs text-left min-w-[640px]">
            <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border">
              <tr>
                <th className="py-3 px-4">ครูผู้สอน</th>
                <th className="py-3 px-4 text-center">สถานะลายเซ็น</th>
                <th className="py-3 px-4 text-center">ตัวอย่างลายเซ็น</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingTeachers ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      กำลังโหลดข้อมูลครูผู้สอน...
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    ไม่พบข้อมูลครูผู้สอนตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => {
                  const teacherSigUrl = teacher.has_signature
                    ? `/api/signatures/proxy?type=teacher&id=${teacher.id}&settingId=${selectedSettingId}&t=${cacheBuster}`
                    : null;
                  const isUploadingThis = uploadingTeacherId === teacher.id;

                  return (
                    <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                            style={{ backgroundColor: teacher.color || "#6366f1" }}
                          >
                            {teacher.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{teacher.name}</div>
                            {teacher.email && (
                              <div className="text-[11px] text-muted-foreground">{teacher.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {teacher.has_signature ? (
                          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/30 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> อัปโหลดแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px]">
                            ยังไม่มีลายเซ็น
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {teacherSigUrl ? (
                          <div
                            onClick={() => viewSignatureModal(`ลายเซ็นของ ${teacher.name}`, teacherSigUrl)}
                            className="inline-block w-24 h-10 rounded-lg border border-border bg-white dark:bg-card p-1 cursor-pointer hover:border-indigo-400 transition-all shadow-sm"
                            style={{
                              backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03)), repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, #ffffff 25%, #ffffff 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03))",
                              backgroundSize: "10px 10px",
                            }}
                            title="คลิกเพื่อดูรูปขยาย"
                          >
                            <img
                              src={teacherSigUrl}
                              alt={teacher.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="file"
                            ref={(el) => {
                              teacherFileInputRefs.current[teacher.id] = el;
                            }}
                            accept="image/*,.heic,.heif,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadTeacherSignature(teacher.id, file);
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => teacherFileInputRefs.current[teacher.id]?.click()}
                            disabled={isUploadingThis}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            title="อัปโหลดไฟล์รูปภาพหรือไฟล์จาก iPad/iPhone"
                          >
                            {isUploadingThis ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            {teacher.has_signature ? "เปลี่ยน" : "อัปโหลด"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setPadModal({
                              isOpen: true,
                              type: "teacher",
                              teacherId: teacher.id,
                              title: "ครู " + teacher.name
                            })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                            title="วาดลายเซ็นด้วย Apple Pencil หรือนิ้วมือ"
                          >
                            <PenTool className="w-3 h-3" />
                            วาด
                          </button>

                          {teacher.has_signature && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTeacherSignature(teacher.id, teacher.name)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 transition-all cursor-pointer"
                              title="ลบลายเซ็น"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Teachers Mobile Cards (< md) */}
        <div className="md:hidden space-y-3">
          {loadingTeachers ? (
            <div className="py-8 text-center text-muted-foreground bg-muted/40 rounded-2xl border border-dashed border-border text-xs">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                กำลังโหลดข้อมูลครูผู้สอน...
              </div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground bg-muted/40 rounded-2xl border border-dashed border-border text-xs">
              ไม่พบข้อมูลครูผู้สอนตามเงื่อนไขที่ค้นหา
            </div>
          ) : (
            filteredTeachers.map((teacher) => {
              const teacherSigUrl = teacher.has_signature
                ? `/api/signatures/proxy?type=teacher&id=${teacher.id}&settingId=${selectedSettingId}&t=${cacheBuster}`
                : null;
              const isUploadingThis = uploadingTeacherId === teacher.id;

              return (
                <div
                  key={teacher.id}
                  className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3"
                >
                  {/* Top info row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: teacher.color || "#6366f1" }}
                      >
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm">{teacher.name}</div>
                        {teacher.email && (
                          <div className="text-[11px] text-muted-foreground">{teacher.email}</div>
                        )}
                      </div>
                    </div>

                    {teacher.has_signature ? (
                      <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/30 text-[10px] shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> มีลายเซ็น
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] shrink-0">
                        ยังไม่มี
                      </span>
                    )}
                  </div>

                  {/* Signature Preview Area on Mobile */}
                  {teacherSigUrl ? (
                    <div
                      onClick={() => viewSignatureModal(`ลายเซ็นของ ${teacher.name}`, teacherSigUrl)}
                      className="w-full h-20 rounded-xl border border-border bg-white dark:bg-card p-1.5 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-all shadow-inner relative group"
                      style={{
                        backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03)), repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, #ffffff 25%, #ffffff 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03))",
                        backgroundSize: "12px 12px",
                      }}
                      title="แตะเพื่อดูรูปขยาย"
                    >
                      <img
                        src={teacherSigUrl}
                        alt={teacher.name}
                        className="max-h-14 max-w-full object-contain"
                      />
                      <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> แตะเพื่อดูรูปขยาย
                      </span>
                    </div>
                  ) : (
                    <div className="w-full py-3 rounded-xl border border-dashed border-border bg-muted/20 text-center text-[11px] text-muted-foreground">
                      ยังไม่มีไฟล์ลายเซ็นสำหรับเทอมนี้
                    </div>
                  )}

                  {/* Mobile Action Buttons */}
                  <div className="pt-2 border-t border-border flex items-center gap-2">
                    <input
                      type="file"
                      ref={(el) => {
                        teacherFileInputRefs.current[teacher.id] = el;
                      }}
                      accept="image/*,.heic,.heif,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadTeacherSignature(teacher.id, file);
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => teacherFileInputRefs.current[teacher.id]?.click()}
                      disabled={isUploadingThis}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingThis ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      {teacher.has_signature ? "เปลี่ยนไฟล์" : "อัปโหลด"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPadModal({
                        isOpen: true,
                        type: "teacher",
                        teacherId: teacher.id,
                        title: "ครู " + teacher.name
                      })}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <PenTool className="w-3 h-3" />
                      วาดลายเซ็น
                    </button>

                    {teacher.has_signature && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTeacherSignature(teacher.id, teacher.name)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 transition-all cursor-pointer shrink-0"
                        title="ลบลายเซ็น"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* Signature Pad Modal for iPad / iPhone / Desktop */}
      <SignaturePadModal
        isOpen={padModal.isOpen}
        title={padModal.title}
        onClose={() => setPadModal({ ...padModal, isOpen: false })}
        onSave={async (file) => {
          if (padModal.type === "academic_head") {
            await handleUploadAcademicSignature(file);
          } else if (padModal.teacherId) {
            await handleUploadTeacherSignature(padModal.teacherId, file);
          }
        }}
      />
    </div>
  );
}

function cropSignatureCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return canvas;

  const padding = 24;
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropW = Math.min(width - cropX, maxX - minX + padding * 2);
  const cropH = Math.min(height - cropY, maxY - minY + padding * 2);

  const cropped = document.createElement("canvas");
  cropped.width = cropW;
  cropped.height = cropH;
  const cropCtx = cropped.getContext("2d");
  if (cropCtx) {
    cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  }
  return cropped;
}

function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(3.5);

  const initCanvas = () => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 2;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    setHasDrawn(false);
  };

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const timer = setTimeout(initCanvas, 80);
      window.addEventListener("resize", initCanvas);
      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
        window.removeEventListener("resize", initCanvas);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
      }
    }
  }, [strokeColor, strokeWidth]);

  if (!isOpen) return null;

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (!canvasRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (!canvasRef.current || !hasDrawn) return;
    setSaving(true);
    const cropped = cropSignatureCanvas(canvasRef.current);
    cropped.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], "digital_signature.png", { type: "image/png" });
        await onSave(file);
      }
      setSaving(false);
      onClose();
    }, "image/png");
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[999999] flex flex-col bg-slate-950/85 backdrop-blur-md p-0 sm:p-3 md:p-6 select-none animate-fade-in w-screen h-screen">
        <div className="flex-1 flex flex-col bg-card border border-border sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden h-full max-h-full">
        
        {/* Full-width Top Header Bar */}
        <div className="px-3.5 sm:px-6 py-3 border-b border-border bg-card flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="p-1.5 sm:p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs sm:text-base text-foreground truncate flex items-center gap-2">
                วาดลายเซ็นดิจิทัล
                <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
                  (Apple Pencil / Stylus / Touch)
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                ลงนามสำหรับ: <b className="text-foreground">{title}</b>
              </p>
            </div>
          </div>

          {/* Tool Controls: Colors and Pen Size */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Color choices */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setStrokeColor("#000000")}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg transition-all ${
                  strokeColor === "#000000"
                    ? "ring-2 ring-indigo-500 scale-110 shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{ backgroundColor: "#000000" }}
                title="หมึกสีดำ"
              />
              <button
                type="button"
                onClick={() => setStrokeColor("#1d4ed8")}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg transition-all ${
                  strokeColor === "#1d4ed8"
                    ? "ring-2 ring-indigo-500 scale-110 shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{ backgroundColor: "#1d4ed8" }}
                title="หมึกสีน้ำเงิน"
              />
            </div>

            {/* Thickness choices */}
            <div className="flex items-center gap-0.5 sm:gap-1 p-1 bg-muted rounded-xl border border-border text-[11px] sm:text-xs font-bold">
              <button
                type="button"
                onClick={() => setStrokeWidth(2.5)}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all ${
                  strokeWidth === 2.5
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                บาง
              </button>
              <button
                type="button"
                onClick={() => setStrokeWidth(3.8)}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all ${
                  strokeWidth === 3.8
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ปกติ
              </button>
              <button
                type="button"
                onClick={() => setStrokeWidth(5.5)}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all ${
                  strokeWidth === 5.5
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                หนา
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all text-xs sm:text-sm font-bold cursor-pointer"
              title="ปิด"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Full Screen Drawing Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 w-full relative bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center cursor-crosshair touch-none"
          style={{
            touchAction: "none",
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.015) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.015) 75%, rgba(0,0,0,0.015)), repeating-linear-gradient(45deg, rgba(0,0,0,0.015) 25%, #ffffff 25%, #ffffff 75%, rgba(0,0,0,0.015) 75%, rgba(0,0,0,0.015))",
            backgroundSize: "20px 20px",
          }}
        >
          {/* Guide baseline */}
          <div className="absolute left-6 sm:left-12 right-6 sm:right-12 bottom-1/4 border-b-2 border-dashed border-slate-300 dark:border-slate-700 pointer-events-none flex justify-end">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1 select-none">
              ✍️ เส้นบอกแนวการเซ็นชื่อ (ระบบตัดขอบให้อัตโนมัติ)
            </span>
          </div>

          <canvas
            ref={canvasRef}
            className="absolute inset-0 touch-none"
            style={{ touchAction: "none" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {!hasDrawn && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400/60 dark:text-slate-500/50 select-none p-4 text-center">
              <PenTool className="w-10 h-10 sm:w-12 sm:h-12 mb-2 stroke-1 animate-bounce" />
              <p className="font-bold text-sm sm:text-lg">
                จรด Apple Pencil หรือนิ้วมือเพื่อวาดลายเซ็นบนพื้นที่นี้ได้อย่างอิสระ
              </p>
              <p className="text-[11px] sm:text-xs mt-1">
                มีพื้นที่กว้างขวางเต็มหน้าจอ เซ็นชื่อได้อย่างสบายมือ
              </p>
            </div>
          )}
        </div>

        {/* Full-width Bottom Action Toolbar */}
        <div className="px-3.5 sm:px-6 py-3 border-t border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasDrawn}
            className="order-2 sm:order-1 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold text-foreground transition-all cursor-pointer disabled:opacity-40 text-center"
          >
            ล้างกระดานวาดใหม่
          </button>

          <div className="order-1 sm:order-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-xs sm:text-sm font-semibold text-muted-foreground transition-all cursor-pointer text-center"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasDrawn || saving}
              className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 text-center"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              บันทึกและส่งขึ้น Cloud
            </button>
          </div>
        </div>

      </div>
    </div>
    </ModalPortal>
  );
}
