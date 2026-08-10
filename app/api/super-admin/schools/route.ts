import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

const DEFAULT_MODULES = {
  news: true,
  duty: true,
  attendance: true,
  evaluations: true,
  correspondence: true,
  grades: true,
  schedule: true,
};

export async function GET() {
  const context = await getSchoolContext();
  if (!context || !context.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, name_en, subdomain, logo_url, address, phone, email, is_active, enabled_modules, deletion_requested, deletion_requested_at, created_at, updated_at FROM public.schools ORDER BY name ASC"
    );
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch schools" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getSchoolContext();
  if (!context || !context.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, name_en, subdomain, logo_url, address, phone, email, enabled_modules } = body;

    if (!name || !subdomain) {
      return NextResponse.json({ error: "Name and Subdomain are required" }, { status: 400 });
    }

    const cleanSubdomain = subdomain.trim().toLowerCase();
    const finalModules = enabled_modules ? JSON.stringify(enabled_modules) : JSON.stringify(DEFAULT_MODULES);

    const result = await pool.query(
      `INSERT INTO public.schools (name, name_en, subdomain, logo_url, address, phone, email, is_active, enabled_modules)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8::jsonb)
       RETURNING *`,
      [name, name_en || null, cleanSubdomain, logo_url || null, address || null, phone || null, email || null, finalModules]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") { // Unique violation
      return NextResponse.json({ error: "ชื่อโรงเรียน หรือ Subdomain นี้ถูกใช้งานแล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to create school" }, { status: 500 });
  }
}
