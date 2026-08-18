import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

// GET - Load all translations
export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT id, key, thai, malay_rumi, malay_jawi, created_at, updated_at
      FROM translations
      ORDER BY key ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error loading translations:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add new translation
export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, thai, malay_rumi, malay_jawi } = await req.json();

    if (!key?.trim()) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const thaiVal = thai?.trim() || "";
    const rumiVal = malay_rumi?.trim() || "";
    const jawiVal = malay_jawi?.trim() || "";

    if (!thaiVal && !rumiVal && !jawiVal) {
      return NextResponse.json({ error: "At least one translation language is required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO translations (key, thai, malay_rumi, malay_jawi)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key)
       DO UPDATE SET
         thai = EXCLUDED.thai,
         malay_rumi = EXCLUDED.malay_rumi,
         malay_jawi = EXCLUDED.malay_jawi,
         updated_at = NOW()
       RETURNING id, key, thai, malay_rumi, malay_jawi`,
      [key.trim(), thaiVal, rumiVal, jawiVal]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating translation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
