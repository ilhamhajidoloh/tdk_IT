import { NextRequest, NextResponse } from "next/server";
import { ensureChatTables } from "@/app/lib/chatDb";

export async function GET() {
  await ensureChatTables();
  return NextResponse.json({ success: true, message: "Chat tables created" });
}

export async function POST(req: NextRequest) {
  await ensureChatTables();
  return NextResponse.json({ success: true, message: "Chat tables created" });
}
