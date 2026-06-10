"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./lib/firebase";

type LoginTab = "staff" | "teacher" | "student";

interface Classroom { id: string; name: string; }
interface Teacher { id: string; username: string; }
interface Student { id: string; name: string; student_id: string; }

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LoginTab>("student");
  const [isClient, setIsClient] = useState(false);

  // Dropdown data (from DB)
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentYear, setStudentYear] = useState("2568");

  // Form States - Staff
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  // Form States - Teacher
  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");

  // Form States - Student
  const [studentClassroom, setStudentClassroom] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  // โหลด classrooms, teachers, settings ครั้งแรก
  useEffect(() => {
    setIsClient(true);

    fetch("/api/public/classrooms")
      .then(r => r.json())
      .then((data: Classroom[]) => {
        setClassrooms(data);
        if (data.length > 0) setStudentClassroom(data[0].id);
      });

    fetch("/api/public/teachers")
      .then(r => r.json())
      .then((data: Teacher[]) => {
        setTeachers(data);
        if (data.length > 0) setTeacherUsername(data[0].username);
      });

    fetch("/api/public/settings")
      .then(r => r.json())
      .then(data => setStudentYear(data.academic_year ?? "2568"));
  }, []);

  // โหลด students เมื่อ classroom เปลี่ยน
  useEffect(() => {
    if (!studentClassroom) return;
    fetch(`/api/public/students?classroomId=${studentClassroom}`)
      .then(r => r.json())
      .then((data: Student[]) => {
        setStudents(data);
        setStudentId(data.length > 0 ? data[0].student_id : "");
      });
  }, [studentClassroom]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    let email = "";
    let password = "";

    if (activeTab === "staff") {
      email = `${staffUsername}@school.local`;
      password = staffPassword;
    } else if (activeTab === "teacher") {
      email = `${teacherUsername}@school.local`;
      password = teacherPassword;
    } else {
      email = `${studentId}@school.local`;
      password = studentPassword;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();

      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("User not found");
      const user = await res.json();

      Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ", timer: 1000, showConfirmButton: false });

      if (user.role === "admin") router.push("/admin");
      else if (user.role === "teacher") router.push("/teacher");
      else router.push("/student");

    } catch {
      Swal.fire({ icon: "error", title: "เข้าสู่ระบบไม่สำเร็จ", text: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />

      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden animate-fade-in-up relative z-10 border border-white">

        {/* Header */}
        <div className="bg-white/60 p-8 text-center border-b border-indigo-50">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 transform rotate-3">
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">ระบบจัดการโรงเรียน</h1>
          <p className="text-slate-600 mt-2 font-medium">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {(["student", "teacher", "staff"] as LoginTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-indigo-700 border-b-2 border-indigo-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/50"
              }`}
            >
              {tab === "student" ? "นักเรียน" : tab === "teacher" ? "คุณครู" : "บุคลากร"}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-8 bg-white">
          <form onSubmit={handleLogin} className="space-y-5">

            {/* STUDENT TAB */}
            {activeTab === "student" && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ปีการศึกษา (ถูกล็อกโดยแอดมิน)</label>
                  <select
                    value={studentYear}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 shadow-sm cursor-not-allowed font-medium"
                  >
                    <option value={studentYear}>{studentYear}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชั้นเรียน</label>
                  <select
                    value={studentClassroom}
                    onChange={(e) => setStudentClassroom(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                    required
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อนักเรียน</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                    required
                  >
                    {students.length === 0 ? (
                      <option value="" disabled>ไม่มีนักเรียนในชั้นนี้</option>
                    ) : (
                      students.map((s) => (
                        <option key={s.id} value={s.student_id}>{s.name} ({s.student_id})</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่าน</label>
                  <input
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                    placeholder="กรอกรหัสผ่าน"
                    required
                  />
                </div>
              </div>
            )}

            {/* TEACHER TAB */}
            {activeTab === "teacher" && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อคุณครู</label>
                  <select
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                    required
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.username}>{t.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่าน</label>
                  <input
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                    placeholder="กรอกรหัสผ่าน"
                    required
                  />
                </div>
              </div>
            )}

            {/* STAFF TAB */}
            {activeTab === "staff" && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อผู้ใช้งาน (Username)</label>
                  <input
                    type="text"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                    placeholder="admin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่าน</label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                    placeholder="กรอกรหัสผ่าน"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all transform mt-6 text-lg"
            >
              เข้าสู่ระบบ
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
