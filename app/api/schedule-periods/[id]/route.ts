import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { period_no, start_time, end_time, label, is_break } = await req.json();
  if (!period_no || !start_time || !end_time) {
    return NextResponse.json({ error: "Missing required fields: period_no, start_time, end_time" }, { status: 400 });
  }

  const result = await pool.query(
    "UPDATE schedule_periods SET period_no = $1, start_time = $2, end_time = $3, label = $4, is_break = $5 WHERE id = $6 RETURNING *",
    [period_no, start_time, end_time, label || null, is_break || false, id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM class_schedules WHERE period_id = $1", [id]);
    await client.query("DELETE FROM schedule_periods WHERE id = $1", [id]);
    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
