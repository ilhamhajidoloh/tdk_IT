import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  if (!await verifyUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    "SELECT id, name_th, name_rumi, name_jawi, sort_order, is_active FROM evaluation_topics ORDER BY sort_order, created_at"
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const { name_th, name_rumi, name_jawi } = await req.json();
  if (!name_th?.trim()) {
    return NextResponse.json({ error: "Missing name_th" }, { status: 400 });
  }

  const maxOrderResult = await pool.query("SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM evaluation_topics");
  const nextOrder = Number(maxOrderResult.rows[0].max_order) + 1;

  const result = await pool.query(
    `INSERT INTO evaluation_topics (name_th, name_rumi, name_jawi, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name_th, name_rumi, name_jawi, sort_order, is_active`,
    [name_th.trim(), name_rumi?.trim() || null, name_jawi?.trim() || null, nextOrder]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
