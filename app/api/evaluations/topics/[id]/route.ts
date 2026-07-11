import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const { id } = await params;
  const { name_th, name_rumi, name_jawi, sort_order, is_active } = await req.json();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (name_th !== undefined) {
    if (!String(name_th).trim()) {
      return NextResponse.json({ error: "name_th cannot be empty" }, { status: 400 });
    }
    values.push(String(name_th).trim());
    fields.push(`name_th = $${values.length}`);
  }
  if (name_rumi !== undefined) {
    values.push(String(name_rumi ?? "").trim() || null);
    fields.push(`name_rumi = $${values.length}`);
  }
  if (name_jawi !== undefined) {
    values.push(String(name_jawi ?? "").trim() || null);
    fields.push(`name_jawi = $${values.length}`);
  }
  if (sort_order !== undefined) {
    values.push(Number(sort_order) || 0);
    fields.push(`sort_order = $${values.length}`);
  }
  if (is_active !== undefined) {
    values.push(!!is_active);
    fields.push(`is_active = $${values.length}`);
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE evaluation_topics SET ${fields.join(", ")} WHERE id = $${values.length}
     RETURNING id, name_th, name_rumi, name_jawi, sort_order, is_active`,
    values
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const { id } = await params;

  const usedCheck = await pool.query(
    "SELECT 1 FROM evaluation_records WHERE category = 'character' AND topic_key = $1 LIMIT 1",
    [id]
  );
  if (usedCheck.rows.length > 0) {
    return NextResponse.json(
      { error: "Topic already has recorded evaluations — deactivate it instead of deleting" },
      { status: 409 }
    );
  }

  await pool.query("DELETE FROM evaluation_topics WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
