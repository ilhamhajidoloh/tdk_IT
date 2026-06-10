import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await pool.query("DELETE FROM grades WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
