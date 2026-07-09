import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const result = await pool.query(`
    SELECT g.id, g.name, g.order_no,
      COALESCE(json_agg(json_build_object('id', u.id, 'username', u.username)) FILTER (WHERE u.id IS NOT NULL), '[]') AS members
    FROM teacher_duty_groups g
    LEFT JOIN teacher_duty_members m ON m.group_id = g.id
    LEFT JOIN users u ON u.id = m.teacher_id
    GROUP BY g.id
    ORDER BY g.order_no ASC
  `);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }
  const { name, order_no, teacher_ids } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO teacher_duty_groups (name, order_no) VALUES ($1, $2) RETURNING *",
      [name.trim(), order_no ?? 0]
    );
    const group = result.rows[0];

    if (Array.isArray(teacher_ids) && teacher_ids.length > 0) {
      // A teacher can only belong to one group, so re-assigning them here moves
      // them out of whichever group they were previously in.
      const values = teacher_ids.map((_: string, i: number) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO teacher_duty_members (group_id, teacher_id) VALUES ${values}
         ON CONFLICT (teacher_id) DO UPDATE SET group_id = EXCLUDED.group_id`,
        [group.id, ...teacher_ids]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/teacher-duty-groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
