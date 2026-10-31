import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSignatureFromOracle } from "@/app/lib/oracleStorage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "academic_head" | "teacher"
    const id = searchParams.get("id");
    const settingId = searchParams.get("settingId");

    if (!type || !id) {
      return NextResponse.json({ error: "Missing required query parameters: type and id" }, { status: 400 });
    }

    let signatureKey: string | null = null;

    if (type === "academic_head") {
      // id is settingId
      const res = await pool.query(
        "SELECT academic_head_signature_key FROM system_settings WHERE id = $1",
        [id]
      );
      signatureKey = res.rows[0]?.academic_head_signature_key || null;
    } else if (type === "teacher") {
      // id is teacher's user_id
      if (settingId) {
        const res = await pool.query(
          "SELECT signature_key FROM teacher_term_signatures WHERE user_id = $1 AND setting_id = $2",
          [id, settingId]
        );
        signatureKey = res.rows[0]?.signature_key || null;
      }

      // If no signature found for this specific term, fallback to latest signature of this teacher
      if (!signatureKey) {
        const fallbackRes = await pool.query(
          "SELECT signature_key FROM teacher_term_signatures WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
          [id]
        );
        signatureKey = fallbackRes.rows[0]?.signature_key || null;
      }
    } else {
      return NextResponse.json({ error: "Invalid signature type" }, { status: 400 });
    }

    if (!signatureKey) {
      return new NextResponse(null, { status: 404 });
    }

    const file = await getSignatureFromOracle(signatureKey);
    if (!file) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: unknown) {
    console.error("Error retrieving signature from Oracle Storage:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature", details: (error as Error).message },
      { status: 500 }
    );
  }
}

