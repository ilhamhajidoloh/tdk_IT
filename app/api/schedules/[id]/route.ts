import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { requirePermission } from "@/app/lib/permissions/middleware";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const permError = await requirePermission(req, "schedules.delete");
  if (permError) return permError;

  const { id } = await params;
  await pool.query("DELETE FROM class_schedules WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
