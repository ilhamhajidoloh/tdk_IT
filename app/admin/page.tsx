"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../lib/useAuth";

interface DBUser {
  id: string; firebase_uid: string; username: string;
  role: "admin" | "teacher" | "student";
  student_id?: string; homeroom_classroom_id?: string; subjects?: string[];
}
interface DBStudent { id: string; name: string; student_id: string; classroom_id: string; }
interface DBSubject { id: string; name: string; }
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type Tab = "users" | "classrooms" | "students" | "settings" | "subjects";

export default function AdminPortal() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; setting_id?: number }[]>([]);
  const [selectedSettingId, setSelectedSettingId] = useState<number | null>(null);
  const [students, setStudents] = useState<DBStudent[]>([]);
  const [subjectsList, setSubjectsList] = useState<DBSubject[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [isClient, setIsClient] = useState(false);
  const [adminYear, setAdminYear] = useState("2568");
  const [adminTerm, setAdminTerm] = useState("1");
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-10-10");
  const [isGradingActive, setIsGradingActive] = useState(true);
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const router = useRouter();
  const { user: adminUser, loading, logout, token } = useAuth();

  // Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [studentId, setStudentId] = useState("");
  const [homeroomClassroomId, setHomeroomClassroomId] = useState("");
  const [subjects, setSubjects] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!adminUser || adminUser.role !== "admin") {
      router.push("/");
      return;
    }
    if (token) loadData(token);
    if (token) loadSettings(token);
  }, [loading, adminUser, token, router]);

  const loadData = (authToken: string) => {
    fetch("/api/users", { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(setUsers);
    fetch("/api/students", { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(setStudents);
    fetch("/api/subjects", { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(setSubjectsList);
  };

  const loadClassrooms = async (settingId: number, authToken: string) => {
    const res = await fetch(`/api/classrooms?settingId=${settingId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) setClassrooms(await res.json());
  };

  const loadSettings = async (authToken: string) => {
    const res = await fetch("/api/settings", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return;
    const list = await res.json();
    setSettingsList(list);

    const activeSetting = list.find((s: any) => s.is_active);
    if (activeSetting) {
      setAdminYear(activeSetting.academic_year ?? "2568");
      setAdminTerm(activeSetting.term ?? "1");
      setStartDate(activeSetting.start_date ?? "");
      setEndDate(activeSetting.end_date ?? "");
      const todayStr = new Date().toISOString().split("T")[0];
      setIsGradingActive(todayStr >= (activeSetting.start_date ?? "") && todayStr <= (activeSetting.end_date ?? ""));
      // โหลด classrooms ของ active setting เป็นค่าเริ่มต้น
      setSelectedSettingId(activeSetting.id);
      loadClassrooms(activeSetting.id, authToken);
    } else {
      setIsGradingActive(false);
    }
  };

  const handleAddSetting = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มปีการศึกษา/เทอม ใหม่",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ปีการศึกษา <span class="text-red-500">*</span></label>
            <input id="swal-year" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" placeholder="เช่น 2569">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">เทอม <span class="text-red-500">*</span></label>
            <input id="swal-term" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" placeholder="เช่น 1 หรือ 2">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">วันเริ่มต้นภาคเรียน <span class="text-red-500">*</span></label>
            <input id="swal-start-date" type="date" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">วันสิ้นสุดภาคเรียน <span class="text-red-500">*</span></label>
            <input id="swal-end-date" type="date" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-indigo-100 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const year = (document.getElementById("swal-year") as HTMLInputElement).value;
        const term = (document.getElementById("swal-term") as HTMLInputElement).value;
        const startDate = (document.getElementById("swal-start-date") as HTMLInputElement).value;
        const endDate = (document.getElementById("swal-end-date") as HTMLInputElement).value;

        if (!year || !term || !startDate || !endDate) {
          Swal.showValidationMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
          return null;
        }

        if (startDate > endDate) {
          Swal.showValidationMessage("วันเริ่มต้นต้องไม่เกินวันสิ้นสุดภาคเรียน");
          return null;
        }

        return { year, term, startDate, endDate };
      }
    });

    if (formValues) {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          academic_year: formValues.year.trim(),
          term: formValues.term.trim(),
          start_date: formValues.startDate,
          end_date: formValues.endDate,
        }),
      });

      if (!res.ok) {
        Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
        return;
      }

      if (token) loadSettings(token);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "เพิ่มปีการศึกษาใหม่เรียบร้อยแล้ว",
        confirmButtonColor: "#4f46e5"
      });
    }
  };

  const handleEditSetting = async (setting: any) => {
    const { value: formValues } = await Swal.fire({
      title: "แก้ไขปีการศึกษา/เทอม",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ปีการศึกษา <span class="text-red-500">*</span></label>
            <input id="swal-year" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${setting.academic_year}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">เทอม <span class="text-red-500">*</span></label>
            <input id="swal-term" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${setting.term}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">วันเริ่มต้นภาคเรียน <span class="text-red-500">*</span></label>
            <input id="swal-start-date" type="date" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${setting.start_date || ''}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">วันสิ้นสุดภาคเรียน <span class="text-red-500">*</span></label>
            <input id="swal-end-date" type="date" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${setting.end_date || ''}">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-indigo-100 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const year = (document.getElementById("swal-year") as HTMLInputElement).value;
        const term = (document.getElementById("swal-term") as HTMLInputElement).value;
        const startDate = (document.getElementById("swal-start-date") as HTMLInputElement).value;
        const endDate = (document.getElementById("swal-end-date") as HTMLInputElement).value;

        if (!year || !term || !startDate || !endDate) {
          Swal.showValidationMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
          return null;
        }

        if (startDate > endDate) {
          Swal.showValidationMessage("วันเริ่มต้นต้องไม่เกินวันสิ้นสุดภาคเรียน");
          return null;
        }

        return { year, term, startDate, endDate };
      }
    });

    if (formValues) {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: setting.id,
          academic_year: formValues.year.trim(),
          term: formValues.term.trim(),
          start_date: formValues.startDate,
          end_date: formValues.endDate,
        }),
      });

      if (!res.ok) {
        Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
        return;
      }

      if (token) loadSettings(token);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "แก้ไขปีการศึกษาเรียบร้อยแล้ว",
        confirmButtonColor: "#4f46e5"
      });
    }
  };

  const handleDeleteSetting = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: `ยืนยันการลบ ${name}?`,
      text: "การลบปีการศึกษานี้จะไม่สามารถกู้คืนได้ และไม่สามารถลบปีการศึกษาปัจจุบันที่เปิดใช้งานอยู่ได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      const deleteRes = await fetch(`/api/settings?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!deleteRes.ok) {
        const errorData = await deleteRes.json();
        Swal.fire("ข้อผิดพลาด", errorData.error || "ลบไม่สำเร็จ กรุณาลองใหม่", "error");
        return;
      }

      if (token) loadSettings(token);
      Swal.fire("ลบสำเร็จ", `ลบปีการศึกษา ${name} เรียบร้อยแล้ว`, "success");
    }
  };

  const handleActivateSetting = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: `ยืนยันการเปิดใช้งาน ${name}?`,
      text: "ระบบจะเปลี่ยนไปใช้ปีการศึกษา/เทอม และช่วงเวลากรอกคะแนนนี้แทน",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยันการเปิดใช้งาน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5"
    });
    if (res.isConfirmed) {
      const actRes = await fetch("/api/settings/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!actRes.ok) {
        Swal.fire("ข้อผิดพลาด", "เปลี่ยนการตั้งค่าไม่สำเร็จ กรุณาลองใหม่", "error");
        return;
      }

      if (token) loadSettings(token);
      Swal.fire("สำเร็จ", `เปิดใช้งานปีการศึกษา ${name} แล้ว`, "success");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleDeleteUser = async (id: string) => {
    const res = await Swal.fire({
      title: "ยืนยันการลบ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      await fetch(`/api/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (token) loadData(token);
      Swal.fire("ลบสำเร็จ", "", "success");
    }
  };

  // =========================================
  // Classroom Management Handlers
  // =========================================
  const handleAddClassroom = async () => {
    if (!selectedSettingId || !token) return;

    const { value: name } = await Swal.fire({
      title: "เพิ่มชั้นเรียนใหม่",
      input: "text",
      inputLabel: "ชื่อชั้นเรียน (Classroom Name)",
      inputPlaceholder: "เช่น M.1/3, M.4/2",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      inputValidator: (value) => (!value ? "กรุณากรอกชื่อชั้นเรียน!" : null),
    });

    if (name) {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), setting_id: selectedSettingId }),
      });
      if (res.ok) {
        await loadClassrooms(selectedSettingId, token);
        Swal.fire({ icon: "success", title: "สำเร็จ", text: `เพิ่มชั้นเรียน ${name.trim()} เรียบร้อยแล้ว`, confirmButtonColor: "#4f46e5" });
      } else {
        Swal.fire("ข้อผิดพลาด", "เพิ่มไม่สำเร็จ กรุณาลองใหม่", "error");
      }
    }
  };

  const handleEditClassroom = async (classroom: { id: string; name: string }) => {
    if (!selectedSettingId || !token) return;

    const { value: name } = await Swal.fire({
      title: "แก้ไขชื่อชั้นเรียน",
      input: "text",
      inputLabel: "ชื่อชั้นเรียน",
      inputValue: classroom.name,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      inputValidator: (value) => (!value ? "กรุณากรอกชื่อชั้นเรียน!" : null),
    });

    if (name) {
      const res = await fetch(`/api/classrooms/${classroom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        await loadClassrooms(selectedSettingId, token);
        Swal.fire({ icon: "success", title: "สำเร็จ", text: "แก้ไขชื่อชั้นเรียนเรียบร้อยแล้ว", confirmButtonColor: "#4f46e5" });
      } else {
        Swal.fire("ข้อผิดพลาด", "แก้ไขไม่สำเร็จ กรุณาลองใหม่", "error");
      }
    }
  };

  const handleDeleteClassroom = async (id: string, name: string) => {
    if (!selectedSettingId || !token) return;

    const res = await Swal.fire({
      title: `ยืนยันการลบชั้นเรียน ${name}?`,
      text: "การลบจะส่งผลต่อนักเรียนที่อยู่ในชั้นเรียนนี้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (res.isConfirmed) {
      await fetch(`/api/classrooms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadClassrooms(selectedSettingId, token);
      Swal.fire("ลบสำเร็จ", `ลบชั้นเรียน ${name} เรียบร้อยแล้ว`, "success");
    }
  };

  // =========================================
  // Student Management Handlers
  // =========================================
  const handleAddStudent = async () => {
    const classroomOptions = classrooms.map(c => 
      `<option value="${c.id}">${c.name}</option>`
    ).join("");

    const { value: formValues } = await Swal.fire({
      title: "เพิ่มนักเรียนใหม่",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">รหัสนักเรียน (Student ID) <span class="text-red-500">*</span></label>
            <input id="swal-student-id" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" placeholder="เช่น S006">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
            <input id="swal-student-name" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" placeholder="เช่น นายสมศักดิ์ รักดี">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ชั้นเรียน <span class="text-red-500">*</span></label>
            <select id="swal-student-classroom" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-700 shadow-sm">
              ${classroomOptions}
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-indigo-100 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const studentId = (document.getElementById("swal-student-id") as HTMLInputElement).value;
        const name = (document.getElementById("swal-student-name") as HTMLInputElement).value;
        const classroomId = (document.getElementById("swal-student-classroom") as HTMLSelectElement).value;

        if (!studentId || !name || !classroomId) {
          Swal.showValidationMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
          return null;
        }

        return { studentId, name, classroomId };
      }
    });

    if (formValues) {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_id: formValues.studentId.trim(), name: formValues.name.trim(), classroom_id: formValues.classroomId }),
      });
      if (!res.ok) { Swal.fire("ข้อผิดพลาด", "เพิ่มนักเรียนไม่สำเร็จ", "error"); return; }
      if (token) loadData(token);
      Swal.fire({ icon: "success", title: "สำเร็จ", text: "เพิ่มข้อมูลนักเรียนเรียบร้อยแล้ว", confirmButtonColor: "#4f46e5" });
    }
  };

  const handleEditStudent = async (student: DBStudent) => {
    const classroomOptions = classrooms.map(c =>
      `<option value="${c.id}" ${c.id === student.classroom_id ? 'selected' : ''}>${c.name}</option>`
    ).join("");

    const { value: formValues } = await Swal.fire({
      title: "แก้ไขข้อมูลนักเรียน",
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">รหัสนักเรียน (Student ID) <span class="text-red-500">*</span></label>
            <input id="swal-student-id" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${student.student_id}" placeholder="เช่น S006">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
            <input id="swal-student-name" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm" value="${student.name}" placeholder="เช่น นายสมศักดิ์ รักดี">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ชั้นเรียน <span class="text-red-500">*</span></label>
            <select id="swal-student-classroom" class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-semibold text-gray-700 shadow-sm">
              ${classroomOptions}
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-indigo-100 p-8 shadow-xl bg-white max-w-md w-full",
        title: "text-2xl font-extrabold text-gray-800 mb-4",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer mr-3",
        cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
      },
      preConfirm: () => {
        const studentId = (document.getElementById("swal-student-id") as HTMLInputElement).value;
        const name = (document.getElementById("swal-student-name") as HTMLInputElement).value;
        const classroomId = (document.getElementById("swal-student-classroom") as HTMLSelectElement).value;

        if (!studentId || !name || !classroomId) {
          Swal.showValidationMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
          return null;
        }

        return { studentId, name, classroomId };
      }
    });

    if (formValues) {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_id: formValues.studentId.trim(), name: formValues.name.trim(), classroom_id: formValues.classroomId }),
      });
      if (!res.ok) { Swal.fire("ข้อผิดพลาด", "แก้ไขนักเรียนไม่สำเร็จ", "error"); return; }
      if (token) loadData(token);
      Swal.fire({ icon: "success", title: "สำเร็จ", text: "แก้ไขข้อมูลนักเรียนเรียบร้อยแล้ว", confirmButtonColor: "#4f46e5" });
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: `ยืนยันการลบนักเรียน ${name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      await fetch(`/api/students/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (token) loadData(token);
      Swal.fire("ลบสำเร็จ", `ลบข้อมูลนักเรียน ${name} เรียบร้อยแล้ว`, "success");
    }
  };

  // =========================================
  // Subject Management Handlers
  // =========================================
  const handleAddSubject = async () => {
    const { value: name } = await Swal.fire({
      title: "เพิ่มวิชาเรียนใหม่",
      input: "text",
      inputLabel: "ชื่อวิชาเรียน (Subject Name)",
      inputPlaceholder: "เช่น English, Computer Science",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      inputValidator: (value) => {
        if (!value) {
          return "กรุณากรอกชื่อวิชาเรียน!";
        }
        return null;
      }
    });

    if (name) {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) { Swal.fire("ข้อผิดพลาด", "เพิ่มวิชาไม่สำเร็จ", "error"); return; }
      if (token) loadData(token);
      Swal.fire({ icon: "success", title: "สำเร็จ", text: `เพิ่มวิชาเรียน ${name.trim()} เรียบร้อยแล้ว`, confirmButtonColor: "#4f46e5" });
    }
  };

  const handleEditSubject = async (subject: DBSubject) => {
    const { value: name } = await Swal.fire({
      title: "แก้ไขชื่อวิชาเรียน",
      input: "text",
      inputLabel: "ชื่อวิชาเรียน",
      inputValue: subject.name,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      inputValidator: (value) => {
        if (!value) {
          return "กรุณากรอกชื่อวิชาเรียน!";
        }
        return null;
      }
    });

    if (name) {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) { Swal.fire("ข้อผิดพลาด", "แก้ไขวิชาไม่สำเร็จ", "error"); return; }
      if (token) loadData(token);
      Swal.fire({ icon: "success", title: "สำเร็จ", text: "แก้ไขชื่อวิชาเรียนเรียบร้อยแล้ว", confirmButtonColor: "#4f46e5" });
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: `ยืนยันการลบวิชาเรียน ${name}?`,
      text: "การลบวิชานี้จะไม่ลบผลการเรียนที่มีอยู่แล้ว แต่อาจส่งผลต่อการจัดการในอนาคต",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      await fetch(`/api/subjects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (token) loadData(token);
      Swal.fire("ลบสำเร็จ", `ลบวิชาเรียน ${name} เรียบร้อยแล้ว`, "success");
    }
  };

  const handleEditUser = (user: DBUser) => {
    setModalMode("edit");
    setEditingUser(user);
    setUsername(user.username);
    setPassword("");
    setRole(user.role);
    setStudentId(user.student_id || "");
    setHomeroomClassroomId(user.homeroom_classroom_id || "");
    setSubjects(user.subjects ? user.subjects.join(", ") : "");
    setValidationError("");
    setIsUserModalOpen(true);
  };

  const handleAddUser = () => {
    setModalMode("add");
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setRole("student");
    setStudentId("");
    setHomeroomClassroomId("");
    setSubjects("");
    setValidationError("");
    setIsUserModalOpen(true);
  };

  const handleSaveUserSubmit = async () => {
    if (!username.trim()) { setValidationError("กรุณากรอกชื่อผู้ใช้ (Username)"); return; }
    if (modalMode === "add" && !password.trim()) { setValidationError("กรุณากรอกรหัสผ่าน (Password)"); return; }
    if (role === "student" && !studentId.trim()) { setValidationError("กรุณากรอกรหัสนักเรียน (Student ID)"); return; }

    const body: Record<string, unknown> = {
      username: username.trim(),
      role,
      ...(password.trim() ? { password: password.trim() } : {}),
      ...(role === "student" ? { student_id: studentId.trim() } : {}),
      ...(role === "teacher" ? {
        homeroom_classroom_id: homeroomClassroomId || null,
        subjects: subjects ? subjects.split(",").map(s => s.trim()).filter(Boolean) : [],
      } : {}),
    };

    const url = modalMode === "edit" && editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = modalMode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setValidationError(err.error || "บันทึกไม่สำเร็จ กรุณาลองใหม่");
      return;
    }

    setIsUserModalOpen(false);
    if (token) loadData(token);
    Swal.fire({
      icon: "success",
      title: modalMode === "add" ? "เพิ่มผู้ใช้สำเร็จ" : "แก้ไขข้อมูลสำเร็จ",
      text: modalMode === "add" ? "เพิ่มบัญชีผู้ใช้งานในระบบเรียบร้อยแล้ว" : "อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว",
      confirmButtonColor: "#4f46e5"
    });
  };

  if (!isClient || loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-indigo-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-none">ระบบแอดมิน</h1>
              <p className="text-xs text-gray-500">จัดการโครงสร้างระบบและผู้ใช้งาน</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full text-left px-5 py-3.5 rounded-2xl font-semibold transition-all ${
                activeTab === "users" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-100"
              }`}
            >
              จัดการผู้ใช้งาน (Users)
            </button>
            <button
              onClick={() => setActiveTab("classrooms")}
              className={`w-full text-left px-5 py-3.5 rounded-2xl font-semibold transition-all ${
                activeTab === "classrooms" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-100"
              }`}
            >
              จัดการชั้นเรียน (Classrooms)
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`w-full text-left px-5 py-3.5 rounded-2xl font-semibold transition-all ${
                activeTab === "students" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-100"
              }`}
            >
              จัดการนักเรียน (Students)
            </button>
            <button
              onClick={() => setActiveTab("subjects")}
              className={`w-full text-left px-5 py-3.5 rounded-2xl font-semibold transition-all ${
                activeTab === "subjects" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-100"
              }`}
            >
              จัดการวิชาเรียน (Subjects)
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full text-left px-5 py-3.5 rounded-2xl font-semibold transition-all ${
                activeTab === "settings" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-100"
              }`}
            >
              ตั้งค่าระบบ (Settings)
            </button>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 bg-white rounded-3xl shadow-md border border-indigo-100 overflow-hidden min-h-[500px]">
            {activeTab === "users" && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">ผู้ใช้งานระบบ</h2>
                    <p className="text-gray-500 text-sm">จัดการบัญชีผู้ดูแล ครู และนักเรียน</p>
                  </div>
                  <button onClick={handleAddUser} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    เพิ่มผู้ใช้ใหม่
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Username</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Student ID</th>
                        <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-800">{u.username}</div>
                            {u.role === "teacher" && (
                              <div className="text-[11px] text-gray-500 mt-1 space-y-0.5">
                                <div><span className="font-medium">ห้องประจำชั้น:</span> {classrooms.find(c => c.id === u.homeroom_classroom_id)?.name || "ไม่มี"}</div>
                                <div><span className="font-medium">วิชาที่สอน:</span> {u.subjects && u.subjects.length > 0 ? u.subjects.join(", ") : "ไม่มี"}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.role === 'admin' ? 'bg-red-100 text-red-700' :
                              u.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{u.student_id || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => handleEditUser(u)} className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer">
                                แก้ไข
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer">
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "classrooms" && (
              <div className="p-8">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">จัดการชั้นเรียน</h2>
                    <p className="text-gray-500 text-sm">ชั้นเรียนแต่ละห้องผูกกับปีการศึกษา / เทอม</p>
                  </div>
                  <button
                    onClick={handleAddClassroom}
                    disabled={!selectedSettingId}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    เพิ่มชั้นเรียนใหม่
                  </button>
                </div>

                {/* Term Selector */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {settingsList.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSettingId(s.id);
                        if (token) loadClassrooms(s.id, token);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                        selectedSettingId === s.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      ปี {s.academic_year} เทอม {s.term}
                      {s.is_active && (
                        <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">Active</span>
                      )}
                    </button>
                  ))}
                  {settingsList.length === 0 && (
                    <p className="text-sm text-gray-400">ยังไม่มีปีการศึกษาในระบบ กรุณาเพิ่มที่แท็บ ตั้งค่าระบบ</p>
                  )}
                </div>

                {/* Classroom Grid */}
                {!selectedSettingId ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    กรุณาเลือกปีการศึกษา / เทอม ด้านบนก่อน
                  </div>
                ) : classrooms.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    ยังไม่มีชั้นเรียนในเทอมนี้ กด &quot;เพิ่มชั้นเรียนใหม่&quot; เพื่อเริ่ม
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                    {classrooms.map(c => (
                      <div key={c.id} className="bg-gradient-to-br from-indigo-50/40 to-blue-50/40 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-between hover:shadow-md transition-all">
                        <div>
                          <div className="font-extrabold text-lg text-indigo-700">{c.name}</div>
                          <div className="text-slate-400 text-xs mt-1 font-semibold truncate">ID: {c.id}</div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-indigo-100/30">
                          <button
                            onClick={() => handleEditClassroom(c)}
                            className="text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteClassroom(c.id, c.name)}
                            className="text-red-500 hover:text-red-700 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "students" && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">จัดการข้อมูลนักเรียน (Students)</h2>
                    <p className="text-gray-500 text-sm">จัดการข้อมูลและการนำนักเรียนเข้าชั้นเรียน (Enrollment)</p>
                  </div>
                  <button 
                    onClick={handleAddStudent} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    เพิ่มนักเรียนใหม่
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100 animate-fade-in-up">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">รหัสนักเรียน</th>
                        <th className="px-6 py-4 font-semibold">ชื่อ-สกุล</th>
                        <th className="px-6 py-4 font-semibold">ห้องเรียน</th>
                        <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-bold text-indigo-600">{s.student_id}</td>
                          <td className="px-6 py-4 text-gray-800 font-semibold">{s.name}</td>
                          <td className="px-6 py-4 text-gray-500">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                              ชั้น {classrooms.find(c => c.id === s.classroom_id)?.name || 'ยังไม่ระบุ'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => handleEditStudent(s)} 
                                className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                              >
                                แก้ไขข้อมูล / จัดห้องเรียน
                              </button>
                              <button 
                                onClick={() => handleDeleteStudent(s.id, s.name)} 
                                className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "subjects" && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">จัดการวิชาเรียน (Subjects)</h2>
                    <p className="text-gray-500 text-sm">จัดการรายวิชาหลักสูตรในระบบสำหรับคุณครูและคะแนนนักเรียน</p>
                  </div>
                  <button 
                    onClick={handleAddSubject} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    เพิ่มวิชาเรียนใหม่
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100 animate-fade-in-up">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold font-bold">ชื่อวิชาเรียน</th>
                        <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {subjectsList.map(sub => (
                        <tr key={sub.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-semibold text-gray-800">{sub.name}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => handleEditSubject(sub)} 
                                className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                              >
                                แก้ไขชื่อวิชา
                              </button>
                              <button 
                                onClick={() => handleDeleteSubject(sub.id, sub.name)} 
                                className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="p-8 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">ตั้งค่าระบบ</h2>
                    <p className="text-gray-500 text-sm">กำหนดปีการศึกษา เทอม และช่วงเวลาการบันทึกคะแนนในระบบทั้งหมด</p>
                  </div>
                  <button 
                    onClick={handleAddSetting} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-2 border-0 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    เพิ่มปีการศึกษาใหม่
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-5 rounded-2xl border flex flex-col gap-2 shadow-sm ${
                    isGradingActive
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-base">
                      {isGradingActive ? (
                        <>
                          <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span>🟢 สถานะระบบปัจจุบัน: เปิดการกรอกคะแนน (Active)</span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-3 w-3 rounded-full bg-rose-500 shrink-0" />
                          <span>🔴 สถานะระบบปัจจุบัน: ปิดการกรอกคะแนน (Expired/Inactive)</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-600/90 space-y-1 mt-1.5 font-medium">
                      <div><span className="font-bold text-gray-700">ปีการศึกษาปัจจุบัน:</span> {adminYear}</div>
                      <div><span className="font-bold text-gray-700">เทอมปัจจุบัน:</span> {adminTerm}</div>
                      <div><span className="font-bold text-gray-700">ช่วงเวลาทำงานปัจจุบัน:</span> {startDate} ถึง {endDate}</div>
                    </div>
                  </div>
                
                  {/* Settings List */}
                  <div className="overflow-x-auto rounded-xl border border-gray-100 animate-fade-in-up">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-6 py-4 font-semibold font-bold">ปีการศึกษา / เทอม</th>
                          <th className="px-6 py-4 font-semibold">ช่วงเวลากรอกคะแนน</th>
                          <th className="px-6 py-4 font-semibold text-center">สถานะ</th>
                          <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {settingsList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-semibold">
                              ไม่มีข้อมูลปีการศึกษาในระบบ
                            </td>
                          </tr>
                        ) : (
                          settingsList.map((s: any) => {
                            const todayStr = new Date().toISOString().split("T")[0];
                            const isPeriodActive = todayStr >= (s.start_date ?? "") && todayStr <= (s.end_date ?? "");
                            
                            return (
                              <tr key={s.id} className={`hover:bg-gray-50/50 ${s.is_active ? 'bg-indigo-50/20' : ''}`}>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-gray-800">ปีการศึกษา {s.academic_year}</div>
                                  <div className="text-xs text-indigo-600 font-semibold mt-0.5">ภาคเรียนที่ (เทอม) {s.term}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-700 font-semibold">{s.start_date} ถึง {s.end_date}</div>
                                  <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                    {isPeriodActive ? (
                                      <span className="text-emerald-600 font-bold">● กำลังอยู่ในช่วงเวลากรอกคะแนน</span>
                                    ) : (
                                      <span className="text-rose-500 font-bold">● อยู่นอกช่วงเวลากรอกคะแนน</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {s.is_active ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      กำลังใช้งาน
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                      ไม่ได้เปิดใช้งาน
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {!s.is_active && (
                                      <button 
                                        onClick={() => handleActivateSetting(s.id, `ปี ${s.academic_year} เทอม ${s.term}`)} 
                                        className="text-emerald-600 hover:text-emerald-800 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                                      >
                                        เปิดใช้งาน
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => handleEditSetting(s)} 
                                      className="text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                                    >
                                      แก้ไข
                                    </button>
                                    {!s.is_active && (
                                      <button 
                                        onClick={() => handleDeleteSetting(s.id, `ปี ${s.academic_year} เทอม ${s.term}`)} 
                                        className="text-red-500 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs border-0 cursor-pointer"
                                      >
                                        ลบ
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
            )}
          </div>
        </div>
      </main>

      {/* Modern React Modal for Adding/Editing Users */}
      {isUserModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in-up"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-indigo-50 shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative px-6 pt-6 pb-4 flex items-center gap-4 border-b border-slate-100">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md text-white bg-gradient-to-br ${
                modalMode === "add" ? "from-indigo-500 to-violet-600" : "from-amber-500 to-orange-600"
              }`}>
                {modalMode === "add" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  {modalMode === "add" ? "เพิ่มผู้ใช้งานใหม่" : "แก้ไขข้อมูลผู้ใช้งาน"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {modalMode === "add" ? "กรอกรายละเอียดเพื่อสร้างผู้ใช้ใหม่" : `กำลังแก้ไขผู้ใช้: ${editingUser?.username}`}
                </p>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-full transition-all duration-200 cursor-pointer border-0 bg-transparent"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[60vh]">
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น teacher2, s002"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  รหัสผ่าน (Password) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่านสำหรับเข้าใช้งาน"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Role Select (Only for Add) */}
              {modalMode === "add" ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    บทบาทหน้าที่ (Role) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Student */}
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        role === "student"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-400/20"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                        role === "student" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold leading-none">นักเรียน</span>
                      <span className="text-[9px] opacity-75 mt-0.5">Student</span>
                    </button>

                    {/* Teacher */}
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        role === "teacher"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-400/20"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                        role === "teacher" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 00-2-2m2 2a2 2 0 01-2 2m2 5a2 2 0 01-2 2m0-3a3 3 0 10-6 0 3 3 0 006 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold leading-none">คุณครู</span>
                      <span className="text-[9px] opacity-75 mt-0.5">Teacher</span>
                    </button>

                    {/* Admin */}
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        role === "admin"
                          ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm ring-2 ring-purple-400/20"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                        role === "admin" ? "bg-purple-500 text-white" : "bg-slate-200 text-slate-500"
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold leading-none">แอดมิน</span>
                      <span className="text-[9px] opacity-75 mt-0.5">Admin</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    บทบาทหน้าที่ (Role)
                  </label>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                      role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      role === 'teacher' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                      'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        role === 'admin' ? 'bg-rose-500' :
                        role === 'teacher' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} />
                      {role.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Student Fields */}
              {role === "student" && (
                <div className="space-y-1.5 animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    รหัสนักเรียน (Student ID) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 014 0" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="เช่น S002"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none placeholder-slate-400"
                    />
                  </div>
                </div>
              )}

              {role === "teacher" && (
                <div className="space-y-4 animate-fade-in-up">
                  {/* Homeroom Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      ห้องประจำชั้น (Homeroom)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <select
                        value={homeroomClassroomId}
                        onChange={(e) => setHomeroomClassroomId(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-700 text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none appearance-none cursor-pointer"
                      >
                        <option value="">-- ไม่มีห้องประจำชั้น --</option>
                        {classrooms.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      วิชาที่สอน (เลือกรายวิชาเรียน)
                    </label>
                    {subjectsList.length === 0 ? (
                      <div className="text-slate-400 text-xs py-2">ไม่มีรายวิชาเรียนในระบบ กรุณาเพิ่มที่เมนู จัดการวิชาเรียน</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mt-1 max-h-[150px] overflow-y-auto pr-1">
                        {subjectsList.map((sub) => {
                          const selectedSubjects = subjects.split(",").map(s => s.trim()).filter(Boolean);
                          const isChecked = selectedSubjects.includes(sub.name);
                          return (
                            <label key={sub.id} className="flex items-center gap-2 px-3 py-2 border border-slate-100 rounded-xl bg-slate-50/30 hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-all">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let newSubjectsList;
                                  if (e.target.checked) {
                                    newSubjectsList = [...selectedSubjects, sub.name];
                                  } else {
                                    newSubjectsList = selectedSubjects.filter(name => name !== sub.name);
                                  }
                                  setSubjects(newSubjectsList.join(", "));
                                }}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-700">{sub.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer border-0"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveUserSubmit}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 text-sm cursor-pointer border-0"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
