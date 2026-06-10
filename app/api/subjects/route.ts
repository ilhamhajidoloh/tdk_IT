import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await pool.query("SELECT * FROM subjects ORDER BY name");
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const result = await pool.query(
    "INSERT INTO subjects (name) VALUES ($1) RETURNING *",
    [name.trim()]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
