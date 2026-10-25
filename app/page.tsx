"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Building2, CheckCircle2, ChevronRight, GraduationCap, Landmark, LoaderCircle, MapPin, Phone, Plus } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import { SchoolLogo } from "./components/SchoolBrand";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const directSchoolParam = searchParams.get("school");

  useEffect(() => {
    if (directSchoolParam) { router.push(`/home?school=${directSchoolParam}`); return; }
    const savedSchool = localStorage.getItem("selectedSchool");
    if (savedSchool && savedSchool.trim() !== "") { router.push(`/home?school=${savedSchool}`); return; }
    fetch("/api/public/schools")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setSchools(data); })
      .catch((err) => console.error("Error fetching schools:", err))
      .finally(() => setLoading(false));
  }, [directSchoolParam, router]);

  const selectSchool = (subdomain: string) => {
    localStorage.setItem("selectedSchool", subdomain);
    router.push(`/home?school=${subdomain}`);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950 selection:bg-indigo-600 selection:text-white dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/15" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="group flex items-center gap-3" aria-label="TDK IT หน้าแรก">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15 transition-transform duration-300 group-hover:-rotate-6 dark:bg-white dark:text-slate-950"><GraduationCap className="h-5 w-5" strokeWidth={2.4} /></div>
          <div className="leading-none"><p className="text-sm font-black tracking-tight">TDK IT</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">School Network</p></div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/school-request" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800 sm:px-4"><Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">ขอเพิ่มโรงเรียน</span><span className="sm:hidden">เพิ่มโรงเรียน</span></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-10 pt-3 sm:px-8 sm:pb-14 lg:px-10 lg:pb-20">
        <section className="grid items-end gap-8 border-b border-slate-200/80 pb-10 dark:border-slate-800 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16 lg:pb-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-bold tracking-wide text-indigo-700 ring-1 ring-indigo-100 backdrop-blur dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />DIGITAL EDUCATION PLATFORM</div>
            <h1 className="max-w-3xl text-balance text-4xl font-black leading-[1.05] tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">จุดเริ่มต้นของทุก<span className="text-indigo-600 dark:text-indigo-400"> โรงเรียนที่ดี</span></h1>
            <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-base">เลือกพื้นที่โรงเรียนของคุณ เพื่อเข้าถึงข่าวสาร ตารางงาน และเครื่องมือบริหารที่เชื่อมทุกคนในชุมชนการศึกษาไว้ด้วยกัน</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md lg:justify-self-end">
            <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-xl shadow-slate-950/15 dark:bg-indigo-500"><Landmark className="h-5 w-5 text-indigo-300 dark:text-white/75" /><p className="mt-7 text-2xl font-black tracking-tight">{loading ? "—" : schools.length}</p><p className="mt-1 text-[11px] font-bold text-slate-300 dark:text-white/80">โรงเรียนในเครือข่าย</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/75"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><p className="mt-7 text-sm font-extrabold text-slate-900 dark:text-white">พร้อมใช้งาน</p><p className="mt-1 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">เลือกโรงเรียนและเริ่มต้นได้ทันที</p></div>
          </div>
        </section>

        <section className="pt-8 sm:pt-10" aria-labelledby="school-list-heading">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Your workspace</p><h2 id="school-list-heading" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">เลือกโรงเรียนของคุณ</h2></div>{!loading && schools.length > 0 && <p className="hidden text-xs font-medium text-slate-500 sm:block">พบ {schools.length} โรงเรียน</p>}</div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="กำลังโหลดรายการโรงเรียน">
              {[0, 1, 2].map((item) => <div key={item} className="h-52 animate-pulse rounded-3xl bg-white/70 ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:ring-slate-800" />)}
              <div className="col-span-full flex items-center justify-center gap-2 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin text-indigo-600" />กำลังเตรียมพื้นที่โรงเรียน...</div>
            </div>
          ) : schools.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300"><Building2 className="h-6 w-6" /></div><h3 className="mt-5 text-lg font-black">ยังไม่มีโรงเรียนในขณะนี้</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">คุณสามารถเข้าสู่โรงเรียนหลัก หรือติดต่อผู้ดูแลเพื่อเพิ่มโรงเรียนเข้าสู่เครือข่าย</p><Link href="/home?school=main" className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700">เข้าสู่โรงเรียนหลัก <ArrowUpRight className="h-4 w-4" /></Link></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {schools.map((school, index) => (
                <button key={school.id} type="button" onClick={() => selectSchool(school.subdomain)} className="group relative min-h-56 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50 dark:hover:shadow-black/30 sm:p-6">
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-50 transition-transform duration-500 group-hover:scale-150 dark:bg-indigo-400/10" />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4"><SchoolLogo school={school} schoolKey={school.id} alt={school.name} className="h-14 w-14 rounded-2xl border border-slate-100 bg-white object-cover shadow-sm dark:border-slate-700 dark:bg-slate-800" /><span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{String(index + 1).padStart(2, "0")}</span></div>
                    <div className="mt-5"><h3 className="line-clamp-2 text-lg font-black leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">{school.name}</h3>{school.name_en && <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500 dark:text-slate-400">{school.name_en}</p>}</div>
                    <div className="mt-auto pt-5">{school.address || school.phone ? <div className="min-h-9 space-y-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{school.address && <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-indigo-500" /><span className="line-clamp-1">{school.address}</span></p>}{school.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0 text-indigo-500" />{school.phone}</p>}</div> : <div className="min-h-9" />}<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-900 dark:border-slate-800 dark:text-white"><span>เข้าสู่พื้นที่โรงเรียน</span><span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800"><ChevronRight className="h-4 w-4" /></span></div></div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function LandingPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950"><LoaderCircle className="h-7 w-7 animate-spin text-white" /></div>}><LandingPageContent /></Suspense>;
}
