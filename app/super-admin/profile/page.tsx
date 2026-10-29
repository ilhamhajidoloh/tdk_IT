"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  ShieldCheck,
  ArrowLeft,
  Mail,
  Key,
  LogOut,
  User,
  CheckCircle2,
  Lock,
  Globe,
  Share2,
  Building2,
  RefreshCw,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import ThemeToggle from "../../components/ThemeToggle";

interface DBUser {
  id: string;
  username: string;
  role: string;
  email?: string | null;
  school_id?: string | null;
  school_name?: string | null;
  subdomain?: string | null;
  created_at?: string;
}

export default function SuperAdminProfilePage() {
  const { user, loading, logout, token, update } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<DBUser | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "super_admin") {
      router.push("/login");
      return;
    }
    loadProfile();
  }, [user, loading, router, token]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setEmail(data.email || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      Swal.fire("ข้อผิดพลาด", "กรุณากรอกอีเมล", "error");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const response = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        if (update) await update();
        Swal.fire("สำเร็จ!", "อัปเดตอีเมลเรียบร้อยแล้ว", "success");
        loadProfile();
      } else {
        Swal.fire("ข้อผิดพลาด", result.error || "ไม่สามารถอัปเดตอีเมลได้", "error");
      }
    } catch (error) {
      Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Swal.fire("ข้อผิดพลาด", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire("ข้อผิดพลาด", "รหัสผ่านไม่ตรงกัน", "error");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire("สำเร็จ!", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "success");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Swal.fire("ข้อผิดพลาด", result.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้", "error");
      }
    } catch (error) {
      Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "ออกจากระบบ?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ Super Admin?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
    });

    if (result.isConfirmed) {
      await logout();
      router.push("/login");
    }
  };

  const handleSocialLink = async () => {
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
            <button id="sp-link-google" class="flex items-center gap-3 w-full px-5 py-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all font-semibold cursor-pointer">
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span class="text-sm">เชื่อมต่อกับ Google</span>
            </button>
            <button id="sp-link-line" class="flex items-center gap-3 w-full px-5 py-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all font-semibold cursor-pointer">
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#06C755"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              <span class="text-sm">เชื่อมต่อกับ LINE</span>
            </button>
            <button id="sp-link-facebook" class="flex items-center gap-3 w-full px-5 py-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all font-semibold cursor-pointer">
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span class="text-sm">เชื่อมต่อกับ Facebook</span>
            </button>
          </div>
        `,
        didOpen: () => {
          document.getElementById("sp-link-google")?.addEventListener("click", () => { Swal.close(); window.location.href = "/api/link-google/start"; });
          document.getElementById("sp-link-line")?.addEventListener("click", () => { Swal.close(); window.location.href = "/api/link-line/start"; });
          document.getElementById("sp-link-facebook")?.addEventListener("click", () => { Swal.close(); window.location.href = "/api/link-facebook/start"; });
        },
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">กำลังโหลดโปรไฟล์...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-600 selection:text-white dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/super-admin")}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title="กลับสู่หน้า Super Admin"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                โปรไฟล์ผู้ดูแลระบบ
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชี
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Profile Card Hero */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-indigo-600/20 shrink-0">
              {user.username?.charAt(0).toUpperCase() || "A"}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  ผู้ดูแลระบบสูงสุด (Super Admin)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  พร้อมใช้งาน
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {user.username}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px]">ชื่อผู้ใช้ (Username)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user.username}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px]">รหัสผู้ใช้งาน (User ID)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">{user.id}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px]">ขอบเขตสิทธิ์</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">ทุกโรงเรียนในระบบ</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 2-Column Settings Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Email Settings */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">อีเมลติดต่อ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">ใช้สำหรับการแจ้งเตือนและกู้คืนบัญชี</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  ที่อยู่อีเมล
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.ac.th"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <button
                onClick={handleUpdateEmail}
                disabled={isUpdatingEmail}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50 shadow-xs"
              >
                {isUpdatingEmail ? "กำลังบันทึก..." : "บันทึกอีเมล"}
              </button>
            </div>
          </section>

          {/* Social Account Linking */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">การเชื่อมต่อบัญชีโซเชียล</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">เข้าสู่ระบบได้สะดวกรวดเร็วผ่านโซเชียล</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">สถานะปัจจุบัน:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {user.email ? `เชื่อมต่อด้วย ${user.email}` : "ยังไม่ได้เชื่อมต่อโซเชียล"}
                  </span>
                </div>
                <span className={`w-2 h-2 rounded-full ${user.email ? "bg-emerald-500" : "bg-slate-400"}`} />
              </div>

              <button
                onClick={handleSocialLink}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition border border-slate-200 dark:border-slate-700"
              >
                {user.email ? "จัดการ / ยกเลิกการเชื่อมต่อ" : "เชื่อมต่อกับ Google / LINE / Facebook"}
              </button>
            </div>
          </section>

        </div>

        {/* Password Security Section */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">เปลี่ยนรหัสผ่าน</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">รักษาความปลอดภัยของบัญชีด้วยรหัสผ่านที่รัดกุม</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50 shadow-xs"
            >
              {isUpdatingPassword ? "กำลังเปลี่ยนรหัสผ่าน..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </div>
        </section>

      </main>

    </div>
  );
}
