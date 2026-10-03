import { NextRequest } from "next/server";
import { getAuthToken } from "@/app/lib/getAuthToken";
import pool from "@/app/lib/db";

export async function verifyUser(req: NextRequest) {
  const token = await getAuthToken(req);
  if (!token?.id) return null;
  if (token.role === "teacher") {
    try {
      const result = await pool.query(
        "SELECT COALESCE(status, 'active') AS status FROM users WHERE id = $1",
        [token.id]
      );
      if (result.rows[0]?.status === "resigned") return null;
    } catch {
      // Status migration has not been applied yet; preserve legacy access.
    }
  }
  return {
    id: token.id as string,
    role: token.role as string,
    name: token.name as string,
    student_id: (token.student_id as string | undefined) ?? null,
    homeroom_classroom_id: (token.homeroom_classroom_id as string | undefined) ?? null,
    is_clerical: !!token.is_clerical,
  };
}
