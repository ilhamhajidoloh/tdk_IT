import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { target_setting_id, classrooms } = await req.json();

  if (!target_setting_id || !Array.isArray(classrooms) || classrooms.length === 0) {
    return NextResponse.json({ error: "Missing required fields or empty classrooms" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const c of classrooms) {
      if (!c.new_name?.trim() || !c.old_classroom_id) continue;

      // Create new classroom
      const insertResult = await client.query(
        "INSERT INTO classrooms (name, setting_id) VALUES ($1, $2) RETURNING id",
        [c.new_name.trim(), target_setting_id]
      );
      const newClassroomId = insertResult.rows[0].id;

      // Move students
      if (c.move_students) {
        await client.query(
          "UPDATE students SET classroom_id = $1 WHERE classroom_id = $2",
          [newClassroomId, c.old_classroom_id]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error copying classrooms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
