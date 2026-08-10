import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT id, name, name_en, subdomain, logo_url, address, phone, email FROM public.schools WHERE is_active = true ORDER BY name ASC"
    );
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch schools" }, { status: 500 });
  }
}
