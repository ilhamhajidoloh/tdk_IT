import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET() {
  const result = await pool.query(
    "SELECT id, username FROM users WHERE role = 'teacher' ORDER BY username"
  );
  return NextResponse.json(result.rows);
}
