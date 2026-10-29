"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  CheckCircle2,
  ChevronRight,
  Landmark,
  MapPin,
  Phone,
  Plus,
  Search,
  X,
  ArrowRight,
  ArrowUpRight,
  Globe,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import { SchoolLogo } from "./components/SchoolBrand";

// ==========================================
// TYPE DEFINITION (Preserved from API)
// ==========================================

interface School {
  id: string;
  name: string;
  name_en?: string;
  subdomain: string;
  logo_url?: string;
  logo_drive_file_id?: string;
  address?: string;
  phone?: string;
  email?: string;
}

function LandingPageContent() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const directSchoolParam = searchParams.get("school");

  // ==========================================
  // EXACT API LOGIC & ROUTING PRESERVED
  // ==========================================
  useEffect(() => {
    if (directSchoolParam) {
      router.push(`/home?school=${directSchoolParam}`);
      return;
    }
    const savedSchool = localStorage.getItem("selectedSchool");
    if (savedSchool && savedSchool.trim() !== "") {
      router.push(`/home?school=${savedSchool}`);
      return;
    }
    fetch("/api/public/schools")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSchools(data);
      })
      .catch((err) => console.error("Error fetching schools:", err))
      .finally(() => setLoading(false));
  }, [directSchoolParam, router]);

  const selectSchool = (subdomain: string) => {
    localStorage.setItem("selectedSchool", subdomain);
    router.push(`/home?school=${subdomain}`);
  };

  // Instant client-side search filter for schools
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    const q = searchQuery.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.name_en && s.name_en.toLowerCase().includes(q)) ||
        s.subdomain.toLowerCase().includes(q) ||
        (s.address && s.address.toLowerCase().includes(q))
    );
  }, [schools, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-600 selection:text-white dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Subtle Atmospheric Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-12 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-600/10" />
        <div className="absolute right-0 top-0 h-[30rem] w-[30rem] rounded-full bg-sky-200/25 blur-3xl dark:bg-sky-600/10" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-200/20 blur-3xl dark:bg-purple-600/10" />
      </div>

      {/* =========================================================================
          Top Bar: Header
          ========================================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <Link
            href="/"
            className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-2xl"
            aria-label="TDK IT หน้าแรก"
          >
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition-transform duration-300 group-hover:scale-105">
              <GraduationCap className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <p className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                TDK IT
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                School Network
              </p>
            </div>
          </Link>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/school-request"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">ขอเพิ่มโรงเรียนใหม่</span>
              <span className="sm:hidden">เพิ่มโรงเรียน</span>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* =========================================================================
          Main Content
          ========================================================================= */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
        
        {/* Hero Section */}
        <section className="grid items-center gap-8 lg:grid-cols-12 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
          
          {/* Hero Text (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-900 px-3 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              DIGITAL EDUCATION PLATFORM
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              จุดเริ่มต้นของทุก <br className="hidden sm:inline" />
              <span className="text-indigo-600 dark:text-indigo-400">โรงเรียนที่ดี</span>
            </h1>

            <p className="max-w-xl text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
              เลือกพื้นที่สถานศึกษาของคุณ เพื่อเข้าถึงข่าวสาร ตารางเวรปฏิบัติหน้าที่ และเครื่องมือบริหารจัดการที่เชื่อมโยงผู้บริหาร ครู นักเรียน และผู้ปกครองเข้าด้วยกัน
            </p>
          </div>

          {/* Hero Metrics Badges (5 cols) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4 lg:justify-self-end w-full lg:max-w-md">
            
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Landmark className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {loading ? "—" : schools.length}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                โรงเรียนในเครือข่าย
              </p>
            </div>

            <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                พร้อมใช้งาน
              </p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">
                เลือกและเริ่มต้นได้ทันที
              </p>
            </div>

          </div>

        </section>

        {/* =========================================================================
            School Directory Section
            ========================================================================= */}
        <section aria-labelledby="school-list-heading" className="space-y-6">
          
          {/* Controls: Title & Search Filter */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                School Directory
              </p>
              <h2 id="school-list-heading" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                เลือกโรงเรียนของคุณ
              </h2>
            </div>

            {/* Search Input Filter */}
            {!loading && schools.length > 0 && (
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อโรงเรียน..."
                  className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="ล้างคำค้นหา"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* School Grid */}
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 animate-pulse flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    <div className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-1/2 rounded-md bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
                </div>
              ))}
            </div>
          ) : schools.length === 0 ? (
            /* Empty State: 0 Schools */
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-12 text-center shadow-xs">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ยังไม่มีข้อมูลโรงเรียนในระบบ
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                คุณสามารถเข้าสู่โรงเรียนส่วนกลาง หรือส่งคำร้องเพื่อขอเพิ่มโรงเรียนใหม่เข้าสู่เครือข่าย
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/home?school=main"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
                >
                  เข้าสู่โรงเรียนหลัก
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/school-request"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                >
                  ขอเพิ่มโรงเรียน
                </Link>
              </div>
            </div>
          ) : filteredSchools.length === 0 ? (
            /* Empty Search Results */
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-12 text-center shadow-xs">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ไม่พบโรงเรียนที่ตรงกับ &quot;{searchQuery}&quot;
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                ลองตรวจสอบตัวสะกด หรือค้นหาด้วยชื่ออื่น
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                ล้างคำค้นหา
              </button>
            </div>
          ) : (
            /* School Cards Grid */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSchools.map((school, index) => (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => selectSchool(school.subdomain)}
                  className="group relative min-h-60 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-xs transition duration-200 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700/80 hover:shadow-lg hover:shadow-indigo-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Logo & Index */}
                    <div className="flex items-start justify-between gap-4">
                      <SchoolLogo
                        school={school}
                        schoolKey={school.id}
                        alt={school.name}
                        className="h-14 w-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 object-cover shadow-xs p-1"
                      />
                      <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* School Name & Subdomain */}
                    <div className="mt-4 space-y-1">
                      <h3 className="line-clamp-2 text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {school.name}
                      </h3>
                      {school.name_en && (
                        <p className="line-clamp-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {school.name_en}
                        </p>
                      )}
                    </div>

                    {/* Subdomain pill */}
                    <div className="mt-2.5">
                      <span className="inline-block font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                        {school.subdomain}.tdk-it
                      </span>
                    </div>
                  </div>

                  {/* Footer details: Address & Enter button */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    {(school.address || school.phone) && (
                      <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {school.address && (
                          <p className="flex items-center gap-1.5 line-clamp-1">
                            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{school.address}</span>
                          </p>
                        )}
                        {school.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                            <span>{school.phone}</span>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white pt-1">
                      <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        เข้าสู่พื้นที่โรงเรียน
                      </span>
                      <div className="grid h-7 w-7 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors group-hover:bg-indigo-600 group-hover:text-white shadow-xs">
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                </button>
              ))}
            </div>
          )}

        </section>

      </main>

      {/* =========================================================================
          Footer
          ========================================================================= */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 dark:text-white">TDK IT</span>
            <span>•</span>
            <span>School Network Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              นโยบายความเป็นส่วนตัว
            </Link>
            <span>•</span>
            <Link href="/school-request" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              ส่งคำขอเพิ่มโรงเรียน
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-400 flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">กำลังเตรียมพื้นที่โรงเรียน...</p>
        </div>
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}
