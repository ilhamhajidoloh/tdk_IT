import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { ensureChatTables } from "@/app/lib/chatDb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await verifyUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await ensureChatTables();

  const participant = await pool.query(
    `SELECT 1 FROM chat_participants WHERE conversation_id = $1 AND user_id = $2`,
    [id, currentUser.id]
  );
  if (participant.rows.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT m.id, m.content, m.created_at, m.is_read,
            m.sender_user_id, u.username as sender_name, u.role as sender_role,
            m.sender_guest_session_id,
            p.guest_name as sender_guest_name,
            s.name as sender_student_name
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.sender_user_id
     LEFT JOIN students s ON s.student_id = u.student_id
     LEFT JOIN chat_participants p ON p.conversation_id = m.conversation_id AND p.guest_session_id = m.sender_guest_session_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC`,
    [id]
  );

  return NextResponse.json(result.rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await verifyUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await ensureChatTables();

  const participant = await pool.query(
    `SELECT 1 FROM chat_participants WHERE conversation_id = $1 AND user_id = $2`,
    [id, currentUser.id]
  );
  if (participant.rows.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const sanitized = content.trim().slice(0, 2000);

  const result = await pool.query(
    `INSERT INTO chat_messages (conversation_id, sender_user_id, content)
     VALUES ($1, $2, $3) RETURNING id, created_at`,
    [id, currentUser.id, sanitized]
  );

  await pool.query(
    `UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`,
    [id]
  );

  return NextResponse.json(result.rows[0]);
}
