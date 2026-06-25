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
    `SELECT
       c.id, c.type, c.updated_at,
       (
         SELECT content FROM chat_messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC LIMIT 1
       ) as last_message,
       (
         SELECT created_at FROM chat_messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC LIMIT 1
       ) as last_message_at,
       (
         SELECT COUNT(*)::int FROM chat_messages
         WHERE conversation_id = c.id AND is_read = false AND sender_user_id != $1
       ) as unread_count,
       (
         SELECT json_agg(json_build_object(
           'user_id', p2.user_id,
           'username', u2.username,
           'role', u2.role,
           'guest_name', p2.guest_name,
           'guest_session_id', p2.guest_session_id,
           'student_name', s2.name
         ))
         FROM chat_participants p2
         LEFT JOIN users u2 ON u2.id = p2.user_id
         LEFT JOIN students s2 ON s2.student_id = u2.student_id
         WHERE p2.conversation_id = c.id AND (p2.user_id != $1 OR p2.user_id IS NULL)
       ) as other_participants
     FROM chat_conversations c
     JOIN chat_participants p ON p.conversation_id = c.id
     WHERE p.user_id = $1
     ORDER BY COALESCE(
       (SELECT created_at FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
       c.created_at
     ) DESC`,
    [currentUser.id]
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const currentUser = await verifyUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureChatTables();

  const { targetUserId } = await req.json();
  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
  }

  // check if conversation already exists between these two users
  const existing = await pool.query(
    `SELECT c.id FROM chat_conversations c
     WHERE c.type = 'direct'
       AND EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = c.id AND user_id = $1)
       AND EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = c.id AND user_id = $2)
       AND (SELECT COUNT(*) FROM chat_participants WHERE conversation_id = c.id) = 2`,
    [currentUser.id, targetUserId]
  );

  if (existing.rows.length > 0) {
    return NextResponse.json({ conversationId: existing.rows[0].id });
  }

  // create new conversation
  const conv = await pool.query(
    `INSERT INTO chat_conversations (type) VALUES ('direct') RETURNING id`
  );
  const convId = conv.rows[0].id;

  await pool.query(
    `INSERT INTO chat_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
    [convId, currentUser.id, targetUserId]
  );

  return NextResponse.json({ conversationId: convId });
}
