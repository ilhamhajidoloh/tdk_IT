import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import pool from "@/app/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET - Load all translations
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "admin" && decoded.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT id, key, thai, malay_rumi, malay_jawi, created_at, updated_at
       FROM translations
       ORDER BY key ASC`
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error loading translations:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add new translation
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "admin" && decoded.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key, thai, malay_rumi, malay_jawi } = await req.json();

    if (!key || !thai) {
      return NextResponse.json({ error: "Key and Thai translation are required" }, { status: 400 });
    }

    // Check if key already exists
    const existing = await pool.query(
      `SELECT id FROM translations WHERE key = $1`,
      [key]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Key already exists" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO translations (key, thai, malay_rumi, malay_jawi)
       VALUES ($1, $2, $3, $4)
       RETURNING id, key, thai, malay_rumi, malay_jawi`,
      [key, thai, malay_rumi || "", malay_jawi || ""]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating translation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
