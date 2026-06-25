import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureChatTables } from "@/app/lib/chatDb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  await ensureChatTables();

  const conv = await pool.query(
    `SELECT c.id FROM chat_conversations c
     JOIN chat_participants p ON p.conversation_id = c.id
     WHERE c.type = 'guest' AND p.guest_session_id = $1`,
    [sessionId]
  );

  if (conv.rows.length === 0) {
    return NextResponse.json([]);
  }

  const convId = conv.rows[0].id;

  const result = await pool.query(
    `SELECT m.id, m.content, m.created_at, m.is_read,
            m.sender_user_id, u.username as sender_name, u.role as sender_role,
            m.sender_guest_session_id,
            p.guest_name as sender_guest_name
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.sender_user_id
     LEFT JOIN chat_participants p ON p.conversation_id = m.conversation_id AND p.guest_session_id = m.sender_guest_session_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC`,
    [convId]
  );

  return NextResponse.json(result.rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  await ensureChatTables();
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const conv = await pool.query(
    `SELECT c.id FROM chat_conversations c
     JOIN chat_participants p ON p.conversation_id = c.id
     WHERE c.type = 'guest' AND p.guest_session_id = $1`,
    [sessionId]
  );

  if (conv.rows.length === 0) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const convId = conv.rows[0].id;
  const sanitized = content.trim().slice(0, 2000);

  const result = await pool.query(
    `INSERT INTO chat_messages (conversation_id, sender_guest_session_id, content)
     VALUES ($1, $2, $3) RETURNING id, created_at`,
    [convId, sessionId, sanitized]
  );

  await pool.query(
    `UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`,
    [convId]
  );

  return NextResponse.json(result.rows[0]);
}
