import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getAuthToken } from "@/app/lib/getAuthToken";
import { generateSubdomain } from "@/app/lib/format";

const MODULE_KEYS = ["news", "duty", "attendance", "evaluations", "correspondence", "grades", "schedule"] as const;

function cleanModules(input: unknown) {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return Object.fromEntries(MODULE_KEYS.map((key) => [key, source[key] !== false]));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken(req);
  const { id } = await params;

  try {
    const body = await req.json();

    // 1. Check existing request
    const existingReq = await pool.query(
      "SELECT id, status, subdomain, requested_by FROM public.school_creation_requests WHERE id = $1 LIMIT 1",
      [id]
    );

    const targetRequest = existingReq.rows[0];
    if (!targetRequest) {
      return NextResponse.json({ error: "ไม่พบคำขอที่ต้องการแก้ไข" }, { status: 404 });
    }

    if (targetRequest.status === "approved") {
      return NextResponse.json({ error: "คำขอนี้ได้รับการอนุมัติไปแล้ว ไม่สามารถแก้ไขได้" }, { status: 400 });
    }

    const schoolName = String(body.school_name || "").trim();
    const schoolNameEn = String(body.school_name_en || "").trim() || null;
    const rawSubdomain = String(body.subdomain || "").trim();
    const subdomain = generateSubdomain(rawSubdomain, schoolNameEn, schoolName);
    const logoUrl = String(body.logo_url || "").trim() || null;
    const address = String(body.address || "").trim() || null;
    const phone = String(body.phone || "").trim() || null;
    const email = String(body.email || "").trim() || null;
    const reason = String(body.reason || "").trim() || null;
    const requesterName = String(body.requester_name || "").trim();
    const requesterEmail = String(body.requester_email || "").trim() || null;

    if (!schoolName || !subdomain) {
      return NextResponse.json({ error: "กรุณาระบุชื่อโรงเรียน และ Subdomain หรือชื่อภาษาอังกฤษ" }, { status: 400 });
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)) {
      return NextResponse.json({ error: "Subdomain ใช้ได้เฉพาะ a-z, 0-9 และเครื่องหมาย -" }, { status: 400 });
    }

    // Check subdomain collision in active schools
    const schoolConflict = await pool.query(
      "SELECT 1 FROM public.schools WHERE LOWER(subdomain) = LOWER($1) LIMIT 1",
      [subdomain]
    );
    if (schoolConflict.rows.length > 0) {
      return NextResponse.json({ error: "Subdomain นี้ถูกใช้งานในระบบแล้ว" }, { status: 409 });
    }

    // Check subdomain collision in other requests
    const requestConflict = await pool.query(
      "SELECT 1 FROM public.school_creation_requests WHERE LOWER(subdomain) = LOWER($1) AND id != $2 LIMIT 1",
      [subdomain, id]
    );
    if (requestConflict.rows.length > 0) {
      return NextResponse.json({ error: "มีคำขออื่นที่ใช้ Subdomain นี้อยู่แล้ว" }, { status: 409 });
    }

    const modules = JSON.stringify(cleanModules(body.requested_modules));

    // 2. Update request and RESET status to 'pending'
    const result = await pool.query(
      `UPDATE public.school_creation_requests
       SET school_name = $1,
           school_name_en = $2,
           subdomain = $3,
           logo_url = $4,
           address = $5,
           phone = $6,
           email = $7,
           reason = $8,
           requested_modules = $9::jsonb,
           requester_username = COALESCE($10, requester_username),
           requester_email = COALESCE($11, requester_email),
           status = 'pending',
           review_note = NULL,
           reviewed_by = NULL,
           reviewed_at = NULL,
           updated_at = NOW()
       WHERE id = $12
       RETURNING id, status, school_name, subdomain, updated_at`,
      [
        schoolName,
        schoolNameEn,
        subdomain,
        logoUrl,
        address,
        phone,
        email,
        reason,
        modules,
        requesterName || null,
        requesterEmail || null,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "แก้ไขและส่งคำขอพิจารณาใหม่อีกครั้งเรียบร้อยแล้ว",
      request: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "มีคำขอหรือโรงเรียนที่ใช้ Subdomain นี้อยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "ไม่สามารถแก้ไขคำขอได้" }, { status: 500 });
  }
}
