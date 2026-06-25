import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/app/lib/verifyUser";
import pool from "@/app/lib/db";
import { ensureChatTables } from "@/app/lib/chatDb";

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

  await pool.query(
    `UPDATE chat_messages SET is_read = true
     WHERE conversation_id = $1 AND sender_user_id != $2 AND is_read = false`,
    [id, currentUser.id]
  );

  return NextResponse.json({ success: true });
}
