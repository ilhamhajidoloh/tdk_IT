import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";
import pool from "./db";

export async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const result = await pool.query(
      "SELECT role FROM users WHERE firebase_uid = $1",
      [decoded.uid]
    );
    return result.rows.length > 0 && result.rows[0].role === "admin";
  } catch {
    return false;
  }
}
