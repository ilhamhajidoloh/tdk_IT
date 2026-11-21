import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureStatusSchema } from "@/app/lib/statusMigration";

export async function GET() {
  try {
    await ensureStatusSchema();
    const result = await pool.query(
      "SELECT id, name, name_en, name_jawi, village_thai, village_rumi, village_jawi, subdomain, logo_url, address, phone, email FROM public.schools WHERE is_active = true ORDER BY name ASC"
    );
    return NextResponse.json(result.rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch schools";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
