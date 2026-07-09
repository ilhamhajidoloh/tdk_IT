import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const result = await pool.query("SELECT id, name FROM cooks ORDER BY name");
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }
  const result = await pool.query("INSERT INTO cooks (name) VALUES ($1) RETURNING *", [name.trim()]);
  return NextResponse.json(result.rows[0]);
}
