import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { verifyUser } from "@/app/lib/verifyUser";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await pool.query("DELETE FROM grades WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
