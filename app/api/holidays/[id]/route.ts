import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { id } = await params;
  const { date, reason, is_published, applies_to } = await req.json();
  if (!date || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const result = await pool.query(
      "UPDATE school_holidays SET date = $1, reason = $2, is_published = $3, applies_to = $4 WHERE id = $5 RETURNING *",
      [date, reason, is_published ?? true, applies_to ?? 'all', id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "วันที่นี้มีวันหยุดพิเศษอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { id } = await params;
  await pool.query("DELETE FROM school_holidays WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
