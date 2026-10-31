"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { SystemSetting } from "../types";
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
  FileSignature
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

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      Swal.fire("ชนิดไฟล์ไม่ถูกต้อง", "กรุณาเลือกไฟล์ภาพ PNG, JPEG หรือ WebP", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire("ขนาดไฟล์ใหญ่เกินไป", "ขนาดไฟล์ต้องไม่เกิน 2MB", "error");
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

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      Swal.fire("ชนิดไฟล์ไม่ถูกต้อง", "กรุณาเลือกไฟล์ภาพ PNG, JPEG หรือ WebP", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire("ขนาดไฟล์ใหญ่เกินไป", "ขนาดไฟล์ต้องไม่เกิน 2MB", "error");
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
    <div className="space-y-6">
      {/* Header Info & Term Selector */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FileSignature className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-foreground">
                จัดการลายเซ็นดิจิทัลประจำภาคเรียน
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ไฟล์ลายเซ็นจะถูกส่งไปจัดเก็บอย่างปลอดภัยบน <b>Oracle Cloud Infrastructure (OCI) Object Storage</b>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-foreground whitespace-nowrap">
              เลือกภาคเรียน:
            </label>
            <select
              value={selectedSettingId}
              onChange={(e) => setSelectedSettingId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-border bg-card text-foreground font-semibold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
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
        <div className="mt-4 flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
          <Cloud className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">
            <b>ระบบจัดเก็บ Oracle Storage พร้อมใช้งาน:</b> ลายเซ็นที่อัปโหลดจะถูกนำไปแสดงผลบนเอกสารสรุปผลการเรียน (Report Card) และเอกสารออกเกรดประจำเทอมโดยอัตโนมัติ
          </div>
        </div>
      </div>

      {/* Section 1: Academic Head Signature */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
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

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-dashed border-border bg-muted/20">
          {/* Signature Preview Box */}
          <div 
            className="w-56 h-28 rounded-xl border border-border bg-white dark:bg-card flex items-center justify-center p-2 relative overflow-hidden shadow-inner"
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
          <div className="flex flex-col gap-2">
            <input
              type="file"
              ref={academicFileInputRef}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadAcademicSignature(file);
              }}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => academicFileInputRef.current?.click()}
                disabled={uploadingAcademic}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {uploadingAcademic ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {hasAcademicSignature ? "เปลี่ยนไฟล์ลายเซ็น" : "อัปโหลดไฟล์ลายเซ็น"}
              </button>

              {hasAcademicSignature && (
                <>
                  <button
                    type="button"
                    onClick={() => viewSignatureModal("ลายเซ็นหัวหน้าฝ่ายวิชาการ", academicSignatureUrl)}
                    className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
                    title="ดูรูปขยาย"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAcademicSignature}
                    className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 transition-all cursor-pointer"
                    title="ลบลายเซ็น"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              💡 แนะนำ: ไฟล์ภาพ PNG แบบไม่มีพื้นหลัง (Transparent background) ขนาดไม่เกิน 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Teachers Signatures */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
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
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาชื่อครู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
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
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === "uploaded"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              มีลายเซ็นแล้ว ({uploadedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("missing")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === "missing"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ยังไม่มี ({totalTeachers - uploadedCount})
            </button>
          </div>
        </div>

        {/* Teachers Table / List */}
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border">
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
                            accept="image/png,image/jpeg,image/webp"
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isUploadingThis ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            {teacher.has_signature ? "เปลี่ยน" : "อัปโหลด"}
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
      </div>
    </div>
  );
}

