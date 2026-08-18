import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

// PUT - Update translation
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { thai, malay_rumi, malay_jawi } = await req.json();

    if (!thai) {
      return NextResponse.json({ error: "Thai translation is required" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE translations
       SET
         thai = $1,
         malay_rumi = $2,
         malay_jawi = $3,
         updated_at = NOW()
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
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
