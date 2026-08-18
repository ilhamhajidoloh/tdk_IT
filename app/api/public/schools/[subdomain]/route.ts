import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

const DEFAULT_MAIN_SCHOOL = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "โรงเรียนหลัก",
  name_en: "Main School",
  subdomain: "main",
  logo_url: "/logo.jpg",
  address: null,
  phone: null,
  email: null,
  enabled_modules: {
    news: true,
    duty: true,
    attendance: true,
    evaluations: true,
    correspondence: true,
    grades: true,
    schedule: true,
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;
  const param = (subdomain || "main").trim();
  const isMain = param.toLowerCase() === "main" || param === "00000000-0000-0000-0000-000000000001";

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    let query = "";
    let queryParams = [param];

    if (isUuid) {
      query = "SELECT id, name, name_en, subdomain, logo_url, address, phone, email, enabled_modules FROM public.schools WHERE id = $1 AND is_active = true";
    } else {
      query = "SELECT id, name, name_en, subdomain, logo_url, address, phone, email, enabled_modules FROM public.schools WHERE LOWER(subdomain) = LOWER($1) AND is_active = true";
    }

    let result = await pool.query(query, queryParams);

    // Fallback: ถ้าค้นหาโรงเรียนหลัก (main) แล้วยังไม่มีในฐานข้อมูล ให้สร้าง/ดึง Default School
    if (result.rows.length === 0 && isMain) {
      try {
        await pool.query(`
          INSERT INTO public.schools (id, name, name_en, subdomain, logo_url, is_active)
          VALUES ('00000000-0000-0000-0000-000000000001', 'โรงเรียนหลัก', 'Main School', 'main', '/logo.jpg', true)
          ON CONFLICT (id) DO UPDATE SET is_active = true, subdomain = 'main'
        `);
        result = await pool.query(query, queryParams);
      } catch (insertErr) {
        console.warn("Auto-insert main school failed, returning default fallback:", insertErr);
        return NextResponse.json(DEFAULT_MAIN_SCHOOL);
      }
    }

    if (result.rows.length === 0) {
      if (isMain) {
        return NextResponse.json(DEFAULT_MAIN_SCHOOL);
      }
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("GET /api/public/schools/[subdomain] error:", error);
    // หากเป็น main ให้ fallback ส่ง default config เพื่อไม่ให้หน้าเว็บล่ม
    if (isMain) {
      return NextResponse.json(DEFAULT_MAIN_SCHOOL);
    }
    return NextResponse.json({ error: error.message || "Failed to fetch school info" }, { status: 500 });
  }
}
