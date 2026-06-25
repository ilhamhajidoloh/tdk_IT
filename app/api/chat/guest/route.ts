import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureChatTables } from "@/app/lib/chatDb";

export async function POST(req: NextRequest) {
  await ensureChatTables();
  const { guestName, sessionId } = await req.json();

  if (!guestName?.trim() || !sessionId?.trim()) {
    return NextResponse.json({ error: "guestName and sessionId are required" }, { status: 400 });
  }

  const sanitizedName = guestName.trim().slice(0, 100);
  const sanitizedSession = sessionId.trim().slice(0, 255);

  // check if guest conversation already exists
  const existing = await pool.query(
    `SELECT c.id FROM chat_conversations c
     JOIN chat_participants p ON p.conversation_id = c.id
     WHERE c.type = 'guest' AND p.guest_session_id = $1`,
    [sanitizedSession]
  );

  if (existing.rows.length > 0) {
    return NextResponse.json({ conversationId: existing.rows[0].id });
  }

  // find an admin to connect to
  const admin = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`
  );
  if (admin.rows.length === 0) {
    return NextResponse.json({ error: "No admin available" }, { status: 500 });
  }

  const conv = await pool.query(
    `INSERT INTO chat_conversations (type) VALUES ('guest') RETURNING id`
  );
  const convId = conv.rows[0].id;

  // add guest participant and admin participant
  await pool.query(
    `INSERT INTO chat_participants (conversation_id, guest_name, guest_session_id)
     VALUES ($1, $2, $3)`,
    [convId, sanitizedName, sanitizedSession]
  );

  await pool.query(
    `INSERT INTO chat_participants (conversation_id, user_id)
     VALUES ($1, $2)`,
    [convId, admin.rows[0].id]
  );

  return NextResponse.json({ conversationId: convId });
}

export async function DELETE(req: NextRequest) {
  await ensureChatTables();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // find and delete guest conversations
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
