import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import pool from "@/app/lib/db";

export async function POST(req: NextRequest) {
  // ตรวจสอบ token
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userResult = await pool.query(
      "SELECT role FROM users WHERE firebase_uid = $1",
      [decoded.uid]
    );
    if (userResult.rows.length === 0 || userResult.rows[0].role !== "admin") {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing setting id" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Set all settings to inactive
    await client.query("UPDATE system_settings SET is_active = false");
    // Set the selected setting to active
    const result = await client.query(
      "UPDATE system_settings SET is_active = true WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error("Setting not found");
    }
    await client.query("COMMIT");
    return NextResponse.json({ success: true, activeSetting: result.rows[0] });
  } catch (e: unknown) {
    await client.query("ROLLBACK");
    const errorMessage = e instanceof Error ? e.message : "Failed to activate setting";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
