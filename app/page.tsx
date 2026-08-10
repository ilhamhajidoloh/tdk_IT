"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { School as SchoolIcon, ArrowRight, Building2, Sparkles, ShieldCheck, MapPin, Phone } from "lucide-react";
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
    // If direct school param in URL, redirect directly to /home?school=...
    if (directSchoolParam) {
      router.push(`/home?school=${directSchoolParam}`);
      return;
    }

    // Check if user already saved a school in localStorage
    const savedSchool = localStorage.getItem("selectedSchool");
    if (savedSchool && savedSchool.trim() !== "") {
      router.push(`/home?school=${savedSchool}`);
      return;
    }

    // Otherwise fetch list of active schools
    fetch("/api/public/schools")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSchools(data);
        }
      })
      .catch((err) => console.error("Error fetching schools:", err))
      .finally(() => setLoading(false));
  }, [directSchoolParam, router]);

  const selectSchool = (subdomain: string) => {
    localStorage.setItem("selectedSchool", subdomain);
    router.push(`/home?school=${subdomain}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <SchoolIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-foreground">
                TDK IT
              </span>
              <span className="text-[10px] uppercase font-bold text-primary block tracking-widest">
                Multi-School Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/school-request"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 text-primary text-xs font-bold hover:bg-primary/10 transition-colors"
            >
              ขอสร้างโรงเรียน
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col justify-center space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            เลือกระบบโรงเรียนของคุณ
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
            ยินดีต้อนรับสู่ระบบจัดการโรงเรียน TDK IT
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base font-medium leading-relaxed">
            เลือกโรงเรียนที่ต้องการเข้าสู่ระบบ เพื่อดูข่าวประชาสัมพันธ์ ตารางเวรครู-แม่ครัว และระบบบริหารจัดการ
          </p>
        </div>

        {/* School Cards Grid */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-semibold">กำลังโหลดรายการโรงเรียน...</p>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-3xl bg-card border border-border max-w-md mx-auto space-y-4 shadow-sm">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-extrabold text-foreground">ยังไม่มีรายการโรงเรียนในระบบ</h3>
            <p className="text-xs text-muted-foreground">โปรดติดต่อผู้ดูแลระบบเพื่อเพิ่มโรงเรียนแรกเข้าสู่ระบบ</p>
            <Link
              href="/home?school=main"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md"
            >
              เข้าสู่โรงเรียนหลัก (Main)
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.map((school) => (
              <div
                key={school.id}
                onClick={() => selectSchool(school.subdomain)}
                className="group relative rounded-3xl bg-card border border-border p-6 flex flex-col justify-between hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />

                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <SchoolLogo
                      school={school}
                      schoolKey={school.id}
                      alt={school.name}
                      className="w-14 h-14 rounded-2xl ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
                    />
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted border border-border text-foreground font-mono">
                      {school.subdomain}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                      {school.name}
                    </h3>
                    {school.name_en && (
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{school.name_en}</p>
                    )}
                  </div>

                  {school.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{school.address}</span>
                    </div>
                  )}
                </div>

                <div className="relative pt-6 mt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-primary group-hover:underline inline-flex items-center gap-1">
                    เข้าสู่หน้าระบบโรงเรียน
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ระบบบริหารจัดการโรงเรียน TDK IT Multi-School Platform</p>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <LandingPageContent />
    </Suspense>
  );
}
