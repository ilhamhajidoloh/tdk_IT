import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureStatusSchema } from "@/app/lib/statusMigration";

export async function GET() {
  try {
    const sql = "SELECT id, name, name_en, name_jawi, village_thai, village_rumi, village_jawi, subdomain, logo_url, address, phone, email FROM public.schools WHERE is_active = true ORDER BY name ASC";
    let result;
    try {
      result = await pool.query(sql);
    } catch (err) {
      if ((err as { code?: string })?.code !== "42703") throw err;
      await ensureStatusSchema();
      result = await pool.query(sql);
    }
    return NextResponse.json(result.rows, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch schools";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
