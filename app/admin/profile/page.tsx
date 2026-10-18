"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/useAuth";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import AdminHeader from "../components/AdminHeader";
import { DBUser } from "../components/types";

export default function AdminProfilePage() {
  const { user, loading, logout, token, update } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<DBUser | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      router.push("/login");
      return;
    }
    loadProfile();
  }, [user, loading, router, token]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` }
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

    setIsUpdating(true);
    try {
      const response = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok) {
        await update();
        Swal.fire("สำเร็จ!", "อัปเดตอีเมลเรียบร้อยแล้ว", "success");
        loadProfile();
      } else {
        Swal.fire("ข้อผิดพลาด", result.error || "ไม่สามารถอัปเดตอีเมลได้", "error");
      }
    } catch (error) {
      Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setIsUpdating(false);
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

    setIsUpdating(true);
    try {
      const response = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
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
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "ออกจากระบบ?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626"
    });

    if (result.isConfirmed) {
      await logout();
      router.push("/login");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const profileBackPath = user.role === "super_admin" ? "/super-admin" : "/admin";
  const isSuperAdmin = user.role === "super_admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-blue-950 dark:to-gray-900">
      {/* Modern Header with Glass Effect */}
      <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-700/30 sticky top-0 z-50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(profileBackPath)}
              className="group flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50 transition-all duration-300 shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                โปรไฟล์ของฉัน
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">จัดการข้อมูลส่วนตัวและการตั้งค่า</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 pb-24">
        {/* Hero Profile Section */}
        <div className="relative mb-8">
          <div className={`absolute inset-0 ${isSuperAdmin ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500' : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500'} rounded-3xl blur-2xl opacity-20 dark:opacity-10`}></div>
          <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 border border-white/50 dark:border-gray-700/50 overflow-hidden">
            <div className={`absolute top-0 right-0 w-96 h-96 ${isSuperAdmin ? 'bg-gradient-to-br from-violet-400/20 via-purple-400/20 to-fuchsia-400/20' : 'bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-blue-400/20'} rounded-full blur-3xl`}></div>
            <div className={`absolute bottom-0 left-0 w-80 h-80 ${isSuperAdmin ? 'bg-gradient-to-tr from-fuchsia-400/20 via-pink-400/20 to-violet-400/20' : 'bg-gradient-to-tr from-cyan-400/20 via-blue-400/20 to-indigo-400/20'} rounded-full blur-3xl`}></div>

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative group">
                  <div className={`absolute inset-0 ${isSuperAdmin ? 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500' : 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-500'} rounded-3xl blur-xl group-hover:blur-2xl opacity-75 group-hover:opacity-100 transition-all duration-300`}></div>
                  <div className={`relative w-32 h-32 rounded-3xl ${isSuperAdmin ? 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500' : 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-500'} flex items-center justify-center shadow-xl`}>
                    <span className="text-5xl font-black text-white drop-shadow-lg">
                      {user.username?.charAt(0).toUpperCase() || "A"}
                    </span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                    {user.username}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${isSuperAdmin ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-violet-500/30' : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/30'} text-white text-sm font-semibold shadow-lg`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        {isSuperAdmin ? (
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        )}
                      </svg>
                      {isSuperAdmin ? "ผู้ดูแลระบบสูงสุด" : "ผู้ดูแลระบบ"}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 text-sm font-semibold shadow-md backdrop-blur-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      ใช้งานอยู่
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 border border-white/50 dark:border-gray-700/50">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ชื่อผู้ใช้</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white truncate">{user.username}</div>
                    </div>
                    <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 border border-white/50 dark:border-gray-700/50">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสผู้ใช้</div>
                      <div className="text-sm font-mono font-bold text-gray-900 dark:text-white truncate">{user.id}</div>
                    </div>
                    <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 border border-white/50 dark:border-gray-700/50">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">บทบาท</div>
                      <div className={`text-lg font-bold ${isSuperAdmin ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400' : 'bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400'} bg-clip-text text-transparent`}>
                        {isSuperAdmin ? "Super Admin" : "Admin"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Account Information */}
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl shadow-black/5 border border-white/50 dark:border-gray-700/50 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl ${isSuperAdmin ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/30' : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/30'} flex items-center justify-center shadow-lg`}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">ข้อมูลบัญชี</h3>
            </div>
            <div className="space-y-4">
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">ชื่อผู้ใช้</label>
                <div className={`px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white font-medium ${isSuperAdmin ? 'group-hover:from-violet-50 group-hover:to-fuchsia-50 dark:group-hover:from-violet-900/30 dark:group-hover:to-fuchsia-900/30' : 'group-hover:from-blue-50 group-hover:to-cyan-50 dark:group-hover:from-blue-900/30 dark:group-hover:to-cyan-900/30'} transition-all duration-300`}>
                  {user.username}
                </div>
              </div>
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">รหัสผู้ใช้</label>
                <div className={`px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 font-mono text-sm ${isSuperAdmin ? 'group-hover:from-violet-50 group-hover:to-fuchsia-50 dark:group-hover:from-violet-900/30 dark:group-hover:to-fuchsia-900/30' : 'group-hover:from-blue-50 group-hover:to-cyan-50 dark:group-hover:from-blue-900/30 dark:group-hover:to-cyan-900/30'} transition-all duration-300`}>
                  {user.id}
                </div>
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl shadow-black/5 border border-white/50 dark:border-gray-700/50 p-6 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl ${isSuperAdmin ? 'bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-fuchsia-500/30' : 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-cyan-500/30'} flex items-center justify-center shadow-lg`}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">อีเมล</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">ที่อยู่อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 ${isSuperAdmin ? 'focus:border-fuchsia-500 dark:focus:border-fuchsia-400 focus:ring-fuchsia-500/20' : 'focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20'} focus:ring-4 transition-all duration-200 outline-none`}
                  placeholder="example@email.com"
                />
              </div>
              <button
                onClick={handleUpdateEmail}
                disabled={isUpdating}
                className={`w-full px-6 py-3 ${isSuperAdmin ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-violet-500/30 hover:shadow-violet-500/40' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/30 hover:shadow-cyan-500/40'} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg`}
              >
                {isUpdating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    กำลังบันทึก...
                  </span>
                ) : "บันทึกอีเมล"}
              </button>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="mt-6 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl shadow-black/5 border border-white/50 dark:border-gray-700/50 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl ${isSuperAdmin ? 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-violet-500/30' : 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/30'} flex items-center justify-center shadow-lg`}>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">ความปลอดภัย</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">รหัสผ่านใหม่</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 ${isSuperAdmin ? 'focus:border-violet-500 dark:focus:border-violet-400 focus:ring-violet-500/20' : 'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20'} focus:ring-4 transition-all duration-200 outline-none`}
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 ${isSuperAdmin ? 'focus:border-violet-500 dark:focus:border-violet-400 focus:ring-violet-500/20' : 'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20'} focus:ring-4 transition-all duration-200 outline-none`}
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
            </div>
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={isUpdating}
            className={`mt-6 px-6 py-3 ${isSuperAdmin ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/30 hover:shadow-violet-500/40' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-500/40'} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg`}
          >
            {isUpdating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                กำลังบันทึก...
              </span>
            ) : "เปลี่ยนรหัสผ่าน"}
          </button>
        </div>

        {/* Logout Section */}
        <div className="mt-6 backdrop-blur-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 rounded-2xl shadow-xl shadow-red-500/10 border border-red-200 dark:border-red-800/50 p-6 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">ออกจากระบบ</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                เมื่อคุณออกจากระบบ คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อใช้งานต่อ
              </p>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
