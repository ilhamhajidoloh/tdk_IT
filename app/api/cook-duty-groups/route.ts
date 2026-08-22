import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;
  if (context?.isSuperAdmin) {
    schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
  }
  if (!schoolId) schoolId = "00000000-0000-0000-0000-000000000001";

  const result = await pool.query(
    `SELECT g.id, g.name, g.order_no,
       COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY m.order_no ASC) FILTER (WHERE c.id IS NOT NULL), '[]') AS members
     FROM cook_duty_groups g
     LEFT JOIN cook_duty_members m ON m.group_id = g.id
     LEFT JOIN cooks c ON c.id = m.cook_id
     WHERE g.school_id = $1 OR g.school_id IS NULL
     GROUP BY g.id
     ORDER BY g.order_no ASC`,
    [schoolId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized / Forbidden" }, { status: 401 });
  }

  const context = await getSchoolContext(req);
  let schoolId = context?.schoolId;
  if (context?.isSuperAdmin) {
    schoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id") || schoolId;
  }
  if (!schoolId) schoolId = "00000000-0000-0000-0000-000000000001";

  const { name, order_no, cook_ids } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO cook_duty_groups (name, order_no, school_id) VALUES ($1, $2, $3) RETURNING *",
      [name.trim(), order_no ?? 0, schoolId]
    );
    const group = result.rows[0];

    if (Array.isArray(cook_ids) && cook_ids.length > 0) {
      const values = cook_ids.map((_: string, i: number) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(", ");
      const params = cook_ids.flatMap((cookId: string, i: number) => [cookId, i]);
      await client.query(
        `INSERT INTO cook_duty_members (group_id, cook_id, order_no) VALUES ${values}
         ON CONFLICT (cook_id) DO UPDATE SET group_id = EXCLUDED.group_id, order_no = EXCLUDED.order_no`,
        [group.id, ...params]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/cook-duty-groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
