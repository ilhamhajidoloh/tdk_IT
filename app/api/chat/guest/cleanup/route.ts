import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureChatTables } from "@/app/lib/chatDb";

export async function POST(req: NextRequest) {
  await ensureChatTables();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const conversations = await pool.query(
    `SELECT c.id FROM chat_conversations c
     JOIN chat_participants p ON p.conversation_id = c.id
     WHERE c.type = 'guest' AND p.guest_session_id = $1`,
    [sessionId]
  );

  for (const conv of conversations.rows) {
    await pool.query(`DELETE FROM chat_messages WHERE conversation_id = $1`, [conv.id]);
    await pool.query(`DELETE FROM chat_participants WHERE conversation_id = $1`, [conv.id]);
    await pool.query(`DELETE FROM chat_conversations WHERE id = $1`, [conv.id]);
  }

  return NextResponse.json({ success: true });
}
