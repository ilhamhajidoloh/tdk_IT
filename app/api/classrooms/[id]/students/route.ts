import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: classroom_id } = await params;
  const { student_ids } = await req.json();

  if (!Array.isArray(student_ids)) {
    return NextResponse.json({ error: "Invalid student_ids array" }, { status: 400 });
  }

  try {
    if (student_ids.length > 0) {
      const placeholders = student_ids.map((_, i) => `$${i + 2}`).join(", ");
      await pool.query(
        `UPDATE students SET classroom_id = $1 WHERE id IN (${placeholders})`,
        [classroom_id, ...student_ids]
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk assigning students:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
