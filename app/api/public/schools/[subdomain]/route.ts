import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;
  const param = (subdomain || "main").trim();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    let query = "";
    let queryParams = [param];

    if (isUuid) {
      query = "SELECT id, name, name_en, subdomain, logo_url, address, phone, email, enabled_modules FROM public.schools WHERE id = $1 AND is_active = true";
    } else {
      query = "SELECT id, name, name_en, subdomain, logo_url, address, phone, email, enabled_modules FROM public.schools WHERE LOWER(subdomain) = LOWER($1) AND is_active = true";
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch school info" }, { status: 500 });
  }
}
