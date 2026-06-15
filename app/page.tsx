"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { signIn } from "next-auth/react";

type LoginTab = "staff" | "teacher" | "student";

interface Classroom { id: string; name: string; }
interface Teacher { id: string; username: string; }
interface Student { id: string; name: string; student_id: string; student_number?: number | null; }

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
  const [showPassword, setShowPassword] = useState(false);

  // Reset showPassword when switching tabs
  useEffect(() => {
    setShowPassword(false);
  }, [activeTab]);

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

  // จัดการผลลัพธ์จากการเข้าสู่ระบบด้วย Google (redirect กลับมาที่หน้านี้)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const google = params.get("google");

    if (error) {
      Swal.fire({ icon: "error", title: "เข้าสู่ระบบไม่สำเร็จ", text: error });
      window.history.replaceState({}, "", "/");
      return;
    }

    if (google === "1") {
      window.history.replaceState({}, "", "/");
      fetch("/api/me")
        .then(res => res.ok ? res.json() : null)
        .then(user => {
          if (!user) return;
          Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ", timer: 1000, showConfirmButton: false });
          if (user.role === "admin") router.push("/admin");
          else if (user.role === "teacher") router.push("/teacher");
          else router.push("/student");
        });
    }
  }, [router]);

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/?google=1" });
  };

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

    let username = "";
    let password = "";

    if (activeTab === "staff") {
      username = staffUsername;
      password = staffPassword;
    } else if (activeTab === "teacher") {
      username = teacherUsername;
      password = teacherPassword;
    } else {
      username = studentId;
      password = studentPassword;
    }

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
         throw new Error(result.error);
      }

      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("User not found");
      const user = await res.json();

      Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ", timer: 1000, showConfirmButton: false });

      if (user.role === "admin") router.push("/admin");
      else if (user.role === "teacher") router.push("/teacher");
      else router.push("/student");

    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เข้าสู่ระบบไม่สำเร็จ", text: err.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
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
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 transform rotate-3 overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
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
                        <option key={s.id} value={s.student_id}>
                          {s.student_number ? `เลขที่ ${s.student_number} : ` : ""}{s.name} ({s.student_id})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                      placeholder="กรอกรหัสผ่าน"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                      placeholder="กรอกรหัสผ่าน"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
                      placeholder="กรอกรหัสผ่าน"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">หรือ</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl shadow-sm transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            เข้าสู่ระบบด้วย Google
          </button>
        </div>
      </div>
    </div>
  );
}
