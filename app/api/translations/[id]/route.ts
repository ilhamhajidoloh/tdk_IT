import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import pool from "@/app/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// PUT - Update translation
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { thai, malay_rumi, malay_jawi } = await req.json();
    const { id } = params;

    if (!thai) {
      return NextResponse.json({ error: "Thai translation is required" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE translations
       SET thai = $1, malay_rumi = $2, malay_jawi = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, key, thai, malay_rumi, malay_jawi`,
      [thai, malay_rumi || "", malay_jawi || "", id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Translation not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating translation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete translation
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;

    const result = await pool.query(
      `DELETE FROM translations WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Translation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting translation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
