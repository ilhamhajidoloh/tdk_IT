import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getAuthToken } from "@/app/lib/getAuthToken";

const MODULE_KEYS = ["news", "duty", "attendance", "evaluations", "correspondence", "grades", "schedule"] as const;

function cleanModules(input: unknown) {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return Object.fromEntries(MODULE_KEYS.map((key) => [key, source[key] !== false]));
}

export async function GET(req: NextRequest) {
  const token = await getAuthToken(req);
  if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await pool.query(
    `SELECT id, school_name, school_name_en, subdomain, logo_url, address, phone, email,
            requested_modules, reason, status, review_note, created_at, reviewed_at
     FROM public.school_creation_requests
     WHERE requested_by = $1
     ORDER BY created_at DESC`,
    [token.id]
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const token = await getAuthToken(req);

  try {
    const body = await req.json();
    if (token?.school_id) {
      return NextResponse.json({ error: "บัญชีนี้อยู่ในโรงเรียนที่มีอยู่ในระบบแล้ว" }, { status: 403 });
    }

    const schoolName = String(body.school_name || "").trim();
    const schoolNameEn = String(body.school_name_en || "").trim() || null;
    const subdomain = String(body.subdomain || "").trim().toLowerCase();
    const logoUrl = String(body.logo_url || "").trim() || null;
    const address = String(body.address || "").trim() || null;
    const phone = String(body.phone || "").trim() || null;
    const email = String(body.email || "").trim() || null;
    const reason = String(body.reason || "").trim() || null;
    const requesterName = String(body.requester_name || "").trim();
    const requesterEmail = String(body.requester_email || "").trim() || null;

    if (!schoolName || !subdomain) {
      return NextResponse.json({ error: "กรุณาระบุชื่อโรงเรียนและ Subdomain" }, { status: 400 });
    }
    if (!token?.id && (!requesterName || !requesterEmail)) {
      return NextResponse.json({ error: "กรุณาระบุชื่อผู้ติดต่อและอีเมลสำหรับติดตามคำขอ" }, { status: 400 });
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)) {
      return NextResponse.json({ error: "Subdomain ใช้ได้เฉพาะ a-z, 0-9 และเครื่องหมาย -" }, { status: 400 });
    }

    const existingSchool = await pool.query(
      "SELECT 1 FROM public.schools WHERE LOWER(subdomain) = LOWER($1) LIMIT 1",
      [subdomain]
    );
    if (existingSchool.rows.length > 0) {
      return NextResponse.json({ error: "Subdomain นี้ถูกใช้งานแล้ว" }, { status: 409 });
    }

    const requester = token?.id
      ? await pool.query("SELECT username, email FROM public.users WHERE id = $1 LIMIT 1", [token.id])
      : { rows: [] as Array<{ username?: string; email?: string }> };
    const modules = JSON.stringify(cleanModules(body.requested_modules));

    const result = await pool.query(
      `INSERT INTO public.school_creation_requests
        (requested_by, requester_username, requester_email, school_name, school_name_en,
         subdomain, logo_url, address, phone, email, requested_modules, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
       RETURNING id, status, created_at`,
      [
        token?.id || null,
        requester.rows[0]?.username || String(token?.name || requesterName || ""),
        requester.rows[0]?.email || token?.email || requesterEmail,
        schoolName,
        schoolNameEn,
        subdomain,
        logoUrl,
        address,
        phone,
        email,
        modules,
        reason,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "มีคำขอหรือโรงเรียนที่ใช้ Subdomain นี้อยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "ไม่สามารถส่งคำขอได้" }, { status: 500 });
  }
}
