"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/useAuth";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { DBUser, DBStudent, DBClassroom } from "../components/types";

export default function StudentProfilePage() {
  const { user, loading, logout, token, update } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<DBUser | null>(null);
  const [studentData, setStudentData] = useState<DBStudent | null>(null);
  const [classroom, setClassroom] = useState<DBClassroom | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "student" || !user.student_id) {
      router.push("/login");
      return;
    }
    loadProfile();
    loadStudentData();
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

  const loadStudentData = async () => {
    if (!token || !user?.student_id) return;

    try {
      // Load student info
      const studentsResponse = await fetch("/api/students", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (studentsResponse.ok) {
        const students: DBStudent[] = await studentsResponse.json();
        const student = students.find(s => s.student_id === user.student_id);
        if (student) {
          setStudentData(student);

          // Load classroom
          if (student.classroom_id) {
            const classroomsResponse = await fetch("/api/classrooms", {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (classroomsResponse.ok) {
              const classrooms: DBClassroom[] = await classroomsResponse.json();
              const cls = classrooms.find(c => c.id === student.classroom_id);
              if (cls) setClassroom(cls);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading student data:", error);
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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/student")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">โปรไฟล์</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto pb-20">
        {/* Profile Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-purple-600 dark:text-purple-400">
                {studentData?.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || "S"}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{studentData?.name || user.username}</h2>
                <p className="text-purple-100 mt-1">นักเรียน</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  ชื่อ-นามสกุล
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {studentData?.name || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  รหัสนักเรียน
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {studentData?.student_id || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  ชั้นเรียน
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {classroom?.name_thai || classroom?.name || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  เลขที่
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {studentData?.student_number || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  บทบาท
                </label>
                <p className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                    Student
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  สถานะ
                </label>
                <p className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    {studentData?.status === "active" ? "กำลังศึกษา" :
                     studentData?.status === "graduated" ? "สำเร็จการศึกษา" : "ใช้งานอยู่"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ข้อมูลบัญชี
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                ชื่อผู้ใช้
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {user.username}
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>
            <button
              onClick={handleUpdateEmail}
              disabled={isUpdating}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={isUpdating}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </main>
    </div>
  );
}
