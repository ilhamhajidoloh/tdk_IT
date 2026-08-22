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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">กลับ</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">โปรไฟล์</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                โปรไฟล์ของฉัน
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี
              </p>
            </div>

            {/* Profile Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {user.username?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">{user.username}</h2>
                    <p className="text-blue-100 mt-1">
                      {user.role === "super_admin" ? "ผู้ดูแลระบบสูงสุด" : "ผู้ดูแลระบบ"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ชื่อผู้ใช้
                    </label>
                    <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                      {user.username}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      บทบาท
                    </label>
                    <p className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                        {user.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      รหัสผู้ใช้
                    </label>
                    <p className="mt-1 text-sm font-mono text-gray-700 dark:text-gray-300">
                      {user.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      สถานะ
                    </label>
                    <p className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        ใช้งานอยู่
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ตั้งค่าอีเมล
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="example@email.com"
                  />
                </div>
                <button
                  onClick={handleUpdateEmail}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "กำลังบันทึก..." : "บันทึกอีเมล"}
                </button>
              </div>
            </div>

            {/* Password Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                เปลี่ยนรหัสผ่าน
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    รหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ยืนยันรหัสผ่านใหม่"
                  />
                </div>
                <button
                  onClick={handleUpdatePassword}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
                เขตอันตราย
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                การออกจากระบบจะต้องเข้าสู่ระบบใหม่อีกครั้ง
              </p>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </main>
      </div>
  );
}
