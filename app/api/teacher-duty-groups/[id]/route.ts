import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { id } = await params;
  const { name, order_no, teacher_ids } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE teacher_duty_groups SET name = $1, order_no = $2 WHERE id = $3 RETURNING *",
      [name.trim(), order_no ?? 0, id]
    );
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    await client.query("DELETE FROM teacher_duty_members WHERE group_id = $1", [id]);
    if (Array.isArray(teacher_ids) && teacher_ids.length > 0) {
      // A teacher can only belong to one group, so re-assigning them here moves
      // them out of whichever group they were previously in.
      const values = teacher_ids.map((_: string, i: number) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO teacher_duty_members (group_id, teacher_id) VALUES ${values}
         ON CONFLICT (teacher_id) DO UPDATE SET group_id = EXCLUDED.group_id`,
        [id, ...teacher_ids]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PUT /api/teacher-duty-groups/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { id } = await params;
  await pool.query("DELETE FROM teacher_duty_groups WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
