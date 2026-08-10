import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getAuthToken } from "@/app/lib/getAuthToken";

import { generateSubdomain } from "@/app/lib/format";

const MODULE_KEYS = ["news", "duty", "attendance", "evaluations", "correspondence", "grades", "schedule"] as const;

function cleanModules(input: unknown) {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return Object.fromEntries(MODULE_KEYS.map((key) => [key, source[key] !== false]));
}

export async function GET(req: NextRequest) {
  const token = await getAuthToken(req);
  const search = req.nextUrl.searchParams.get("q") || req.nextUrl.searchParams.get("search");

  // Auto-cleanup requests that have completed setup (active school + admin user exists)
  try {
    await pool.query(`
      DELETE FROM public.school_creation_requests
      WHERE LOWER(subdomain) IN (
        SELECT LOWER(s.subdomain)
        FROM public.schools s
        JOIN public.users u ON u.school_id = s.id AND u.role = 'admin'
        WHERE s.is_active = true
      )
    `);
  } catch (e) {
    console.error("Error cleaning completed school requests:", e);
  }

  // Search functionality for checking request status
  if (search && search.trim().length >= 1) {
    const term = `%${search.trim()}%`;
    const result = await pool.query(
      `SELECT r.id, r.school_name, r.school_name_en, r.subdomain, r.logo_url, r.address, r.phone, r.email,
              r.requester_username, r.requester_email, r.requested_modules, r.reason, r.status, r.review_note,
              r.created_at, r.reviewed_at,
              s.id AS school_id, COALESCE(s.is_active, false) AS is_active,
              EXISTS (SELECT 1 FROM public.users u WHERE u.school_id = s.id AND u.role = 'admin') AS has_admin
       FROM public.school_creation_requests r
       LEFT JOIN public.schools s ON LOWER(s.subdomain) = LOWER(r.subdomain)
       WHERE r.school_name ILIKE $1
          OR r.school_name_en ILIKE $1
          OR r.requester_username ILIKE $1
          OR r.requester_email ILIKE $1
          OR r.subdomain ILIKE $1
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [term]
    );

    // If no request found in requests table, check if it matches an active school on Loading Home!
    if (result.rows.length === 0) {
      const activeSchools = await pool.query(
        `SELECT s.id AS school_id, s.name AS school_name, s.name_en AS school_name_en, s.subdomain, s.logo_url, s.address, s.phone, s.email,
                'approved' AS status, s.created_at, true AS is_active, true AS has_admin
         FROM public.schools s
         WHERE s.is_active = true
           AND (s.name ILIKE $1 OR s.name_en ILIKE $1 OR s.subdomain ILIKE $1)
         ORDER BY s.name ASC LIMIT 10`,
        [term]
      );
      return NextResponse.json(activeSchools.rows);
    }

    return NextResponse.json(result.rows);
  }

  // If logged in and no search parameter, return user's requests
  if (token?.id) {
    const result = await pool.query(
      `SELECT r.id, r.school_name, r.school_name_en, r.subdomain, r.logo_url, r.address, r.phone, r.email,
              r.requester_username, r.requester_email, r.requested_modules, r.reason, r.status, r.review_note,
              r.created_at, r.reviewed_at,
              s.id AS school_id, COALESCE(s.is_active, false) AS is_active,
              EXISTS (SELECT 1 FROM public.users u WHERE u.school_id = s.id AND u.role = 'admin') AS has_admin
       FROM public.school_creation_requests r
       LEFT JOIN public.schools s ON LOWER(s.subdomain) = LOWER(r.subdomain)
       WHERE r.requested_by = $1
       ORDER BY r.created_at DESC`,
      [token.id]
    );
    return NextResponse.json(result.rows);
  }

  return NextResponse.json([]);
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
