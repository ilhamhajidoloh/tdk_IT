"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { signIn } from "next-auth/react";
import GuestChatWidget from "./components/GuestChatWidget";

type LoginTab = "staff" | "teacher" | "student";

interface Classroom { id: string; name: string; }
interface Teacher { id: string; username: string; }
interface Student { id: string; name: string; student_id: string; student_number?: number | null; }

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LoginTab>("student");
  const [isClient, setIsClient] = useState(false);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentYear, setStudentYear] = useState("2568");

  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");

  const [studentClassroom, setStudentClassroom] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setShowPassword(false);
  }, [activeTab]);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const google = params.get("google");

    if (error) {
      Swal.fire({ icon: "error", title: "เข้าสู่ระบบไม่สำเร็จ", text: error });
      window.history.replaceState({}, "", "/");
      return;
    }

    const redirectAfterLogin = () => {
      fetch("/api/me")
        .then(res => res.ok ? res.json() : null)
        .then(user => {
          if (!user) return;
          Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ", timer: 1000, showConfirmButton: false });
          if (user.role === "admin") router.push("/admin");
          else if (user.role === "teacher") router.push("/teacher");
          else router.push("/student");
        });
    };

    if (google === "1") {
      window.history.replaceState({}, "", "/");
      redirectAfterLogin();
    }

    if (params.get("line") === "1") {
      window.history.replaceState({}, "", "/");
      redirectAfterLogin();
    }
  }, [router]);

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/?google=1" });
  };

  const handleLineLogin = () => {
    signIn("line", { callbackUrl: "/?line=1" });
  };

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

  const tabs: { key: LoginTab; label: string; icon: string }[] = [
    { key: "student", label: "นักเรียน", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
    { key: "teacher", label: "คุณครู", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { key: "staff", label: "บุคลากร", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-indigo-300/30 via-violet-300/20 to-transparent rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-purple-300/25 via-cyan-300/15 to-transparent rounded-full blur-3xl animate-float-slow" style={{ animationDelay: "-7s" }} />
      <div className="absolute top-[40%] left-[60%] w-72 h-72 bg-gradient-to-br from-pink-200/20 to-indigo-200/20 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: "-14s" }} />

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        {/* Main card */}
        <div className="glass-strong rounded-[2rem] shadow-xl overflow-hidden animate-glow-pulse">

          {/* Header */}
          <div className="relative px-8 pt-10 pb-8 text-center overflow-hidden">
            {/* Decorative rings */}
            <div className="absolute top-4 right-8 w-20 h-20 border border-indigo-100/50 rounded-full" />
            <div className="absolute top-8 right-12 w-10 h-10 border border-violet-100/50 rounded-full" />
            <div className="absolute bottom-2 left-6 w-16 h-16 border border-purple-100/30 rounded-full" />

            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl rotate-6 opacity-20" />
              <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-white/80 overflow-hidden rotate-3 hover:rotate-0 transition-transform duration-500">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="gradient-text">ระบบจัดการโรงเรียน</span>
            </h1>
            <p className="text-slate-500 mt-2.5 font-medium text-sm">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pb-2">
            <div className="flex gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                    activeTab === tab.key
                      ? "bg-white text-indigo-700 shadow-md shadow-indigo-100/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
                  </svg>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Body */}
          <div className="px-8 pt-4 pb-8">
            <form onSubmit={handleLogin} className="space-y-4">

              {/* STUDENT TAB */}
              {activeTab === "student" && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">ปีการศึกษา</label>
                    <div className="relative">
                      <select
                        value={studentYear}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border-1.5 border-slate-200 bg-slate-50 text-slate-400 shadow-sm cursor-not-allowed font-semibold text-sm"
                      >
                        <option value={studentYear}>{studentYear}</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">ล็อก</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">ชั้นเรียน</label>
                    <select
                      value={studentClassroom}
                      onChange={(e) => setStudentClassroom(e.target.value)}
                      className="input-modern text-sm"
                      required
                    >
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">ชื่อนักเรียน</label>
                    <select
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="input-modern text-sm"
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
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">รหัสผ่าน</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="input-modern text-sm pr-10"
                        placeholder="กรอกรหัสผ่าน"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-500 focus:outline-none transition-colors"
                      >
                        {showPassword ? (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">ชื่อคุณครู</label>
                    <select
                      value={teacherUsername}
                      onChange={(e) => setTeacherUsername(e.target.value)}
                      className="input-modern text-sm"
                      required
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.username}>{t.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">รหัสผ่าน</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        className="input-modern text-sm pr-10"
                        placeholder="กรอกรหัสผ่าน"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-500 focus:outline-none transition-colors"
                      >
                        {showPassword ? (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">ชื่อผู้ใช้งาน (Username)</label>
                    <input
                      type="text"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      className="input-modern text-sm"
                      placeholder="admin"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">รหัสผ่าน</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        className="input-modern text-sm pr-10"
                        placeholder="กรอกรหัสผ่าน"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-500 focus:outline-none transition-colors"
                      >
                        {showPassword ? (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="w-full btn-primary py-4 text-base mt-6 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  เข้าสู่ระบบ
                </span>
              </button>

            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">หรือ</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all border border-slate-200/80 hover:border-indigo-200 hover:shadow-md group"
              >
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                เข้าสู่ระบบด้วย Google
              </button>
              <button
                type="button"
                onClick={handleLineLogin}
                className="w-full flex items-center justify-center gap-2.5 bg-[#00B900] hover:bg-[#00a000] text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all border border-[#00B900]/30 hover:shadow-md group"
              >
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="white">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                เข้าสู่ระบบด้วย LINE
              </button>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-slate-400/80 mt-6 font-medium">
          ระบบจัดการโรงเรียน &copy; {new Date().getFullYear()}
        </p>
      </div>
      <GuestChatWidget />
    </div>
  );
}
