import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getSchoolContext } from "@/app/lib/schoolContext";

const DEFAULT_MODULES = {
  news: true,
  duty: true,
  attendance: true,
  evaluations: true,
  correspondence: true,
  grades: true,
  schedule: true,
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSchoolContext();
  if (!context?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const status = body.status === "approved" || body.status === "denied" ? body.status : null;
  const reviewNote = String(body.review_note || "").trim() || null;
  if (!status) {
    return NextResponse.json({ error: "สถานะต้องเป็น approved หรือ denied" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const requestResult = await client.query(
      `SELECT * FROM public.school_creation_requests
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );
    const request = requestResult.rows[0];
    if (!request) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });
    }
    if (request.status !== "pending") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "คำขอนี้ถูกพิจารณาไปแล้ว" }, { status: 409 });
    }

    let school = null;
    if (status === "approved") {
      const modules = request.requested_modules || DEFAULT_MODULES;
      const schoolResult = await client.query(
        `INSERT INTO public.schools
          (name, name_en, subdomain, logo_url, address, phone, email, is_active, enabled_modules)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8::jsonb)
         RETURNING id, name, name_en, subdomain, logo_url, enabled_modules`,
        [
          request.school_name,
          request.school_name_en,
          request.subdomain,
          request.logo_url,
          request.address,
          request.phone,
          request.email,
          JSON.stringify(modules),
        ]
      );
      school = schoolResult.rows[0];
    }

    const updated = await client.query(
      `UPDATE public.school_creation_requests
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_note = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, status, review_note, reviewed_at`,
      [status, context.userId, reviewNote, id]
    );
    await client.query("COMMIT");
    return NextResponse.json({ request: updated.rows[0], school });
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return NextResponse.json({ error: "Subdomain นี้ถูกใช้งานแล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "ไม่สามารถพิจารณาคำขอได้" }, { status: 500 });
  } finally {
    client.release();
  }
}
