import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { ensureChatTables } from "@/app/lib/chatDb";

export async function POST(req: NextRequest) {
  await ensureChatTables();
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // delete messages older than 1 month for non-guest conversations
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  await pool.query(
    `DELETE FROM chat_messages
     WHERE created_at < $1
       AND conversation_id IN (
         SELECT id FROM chat_conversations WHERE type = 'direct'
       )`,
    [oneMonthAgo.toISOString()]
  );

  // delete empty conversations (no messages left)
  await pool.query(
    `DELETE FROM chat_conversations
     WHERE id NOT IN (SELECT DISTINCT conversation_id FROM chat_messages)
       AND type = 'direct'
       AND created_at < $1`,
    [oneMonthAgo.toISOString()]
  );

  return NextResponse.json({ success: true, cleanedBefore: oneMonthAgo.toISOString() });
}
