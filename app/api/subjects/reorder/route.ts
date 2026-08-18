import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await req.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "Invalid updates array" }, { status: 400 });
    }

    // Update sort_order for each subject
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const update of updates) {
        await client.query(
          `UPDATE subjects SET sort_order = $1 WHERE id = $2`,
          [update.sort_order, update.id]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error: any) {
    console.error("Error reordering subjects:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
