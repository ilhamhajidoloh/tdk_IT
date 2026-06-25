import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { ensureChatTables } from "@/app/lib/chatDb";

export async function GET(req: NextRequest) {
  const currentUser = await verifyUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureChatTables();

  const result = await pool.query(
    `SELECT COUNT(*)::int as count
     FROM chat_messages m
     JOIN chat_participants p ON p.conversation_id = m.conversation_id AND p.user_id = $1
     WHERE m.is_read = false AND m.sender_user_id != $1
       AND (m.sender_guest_session_id IS NOT NULL OR m.sender_user_id IS NOT NULL)`,
    [currentUser.id]
  );

  return NextResponse.json({ unread: result.rows[0]?.count || 0 });
}
