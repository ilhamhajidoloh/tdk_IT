import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getAuthToken } from "@/app/lib/getAuthToken";
import { normalizeScheduleDays } from "@/app/lib/duty";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req: NextRequest) {
  try {
    const schoolParam = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id");
    const academicYear = req.nextUrl.searchParams.get("academicYear");

    let query = `
      SELECT id, title, description, event_date, event_type,
             academic_year, school_id, created_at, updated_at
      FROM calendar_events
      WHERE 1=1
    `;
    const params: string[] = [];
    let paramIndex = 1;

    if (schoolParam) {
      query += ` AND school_id = $${paramIndex}`;
      params.push(schoolParam);
      paramIndex++;
    }

    if (academicYear) {
      query += ` AND academic_year = $${paramIndex}`;
      params.push(academicYear);
      paramIndex++;
    }

    query += ` ORDER BY event_date ASC, created_at ASC`;

    const result = await pool.query(query, params);

    // Keep legacy/calendar holiday entries visible to the duty engine as well.
    // This backfills records created before calendar holidays were linked to
    // school_holidays, including entries whose old school_id was null.
    if (schoolParam) {
      const holidayRows = result.rows.filter((row) => row.event_type === "holiday");
      for (const holiday of holidayRows) {
        await pool.query(
          `INSERT INTO school_holidays (date, reason, is_published, applies_to, school_id)
           VALUES ($1, $2, true, 'all', $3)
           ON CONFLICT DO NOTHING`,
          [holiday.event_date, holiday.title, schoolParam]
        );
      }
    }
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET calendar-events error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthToken(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, event_date, end_date, event_type, academic_year, school_id, applies_to } = body;
    const requestedSchoolId = req.nextUrl.searchParams.get("schoolId") || req.nextUrl.searchParams.get("school_id");
    const effectiveSchoolId = school_id || requestedSchoolId || session.school_id || null;

    if (!title || !event_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const start = new Date(`${event_date}T00:00:00Z`);
    const end = end_date ? new Date(`${end_date}T00:00:00Z`) : start;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    const dates: string[] = [];
    for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      dates.push(date.toISOString().slice(0, 10));
    }

    // Multi-day calendar entries follow the school's normal teaching days.
    // This intentionally does not read school_holidays: cook-only holidays
    // must not turn into school closures or disappear from the cook roster.
    if (end_date && dates.length > 1) {
      const schoolId = effectiveSchoolId;
      const settings = await pool.query(
        `SELECT schedule_days
         FROM system_settings
         WHERE academic_year = $1
           AND (school_id = $2 OR school_id IS NULL)
         ORDER BY school_id NULLS LAST, term DESC
         LIMIT 1`,
        [academic_year || null, schoolId]
      );
      const scheduleDays = normalizeScheduleDays(settings.rows[0]?.schedule_days);
      const openDays = new Set(scheduleDays);
      dates.splice(0, dates.length, ...dates.filter((date) => openDays.has(new Date(`${date}T00:00:00Z`).getUTCDay())));
      if (dates.length === 0) {
        return NextResponse.json({ error: "No school days in selected range" }, { status: 400 });
      }
    }

    const values = dates.map((date) => [title, description || null, date, event_type || "general", academic_year || null, effectiveSchoolId]);
    const placeholders = values.map((_, row) => `($${row * 6 + 1}, $${row * 6 + 2}, $${row * 6 + 3}, $${row * 6 + 4}, $${row * 6 + 5}, $${row * 6 + 6})`).join(", ");
    const result = await pool.query(
      `INSERT INTO calendar_events (title, description, event_date, event_type, academic_year, school_id)
       VALUES ${placeholders}
       RETURNING *`,
      values.flat()
    );

    if (event_type === "holiday") {
      const holidaySchoolId = effectiveSchoolId;
      for (const date of dates) {
        await pool.query(
          `INSERT INTO school_holidays (date, reason, is_published, applies_to, school_id)
           VALUES ($1, $2, true, $3, $4)
           ON CONFLICT DO NOTHING`,
          [date, title, applies_to || "all", holidaySchoolId]
        );
      }
    }

    return NextResponse.json({ ...result.rows[0], days_created: result.rows.length }, { status: 201 });
  } catch (error) {
    console.error("POST calendar-events error:", error);
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthToken(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, description, event_date, end_date, event_type, academic_year } = body;

    if (!id || !title || !event_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE calendar_events
       SET title = $1, description = $2, event_date = $3, event_type = $4,
           academic_year = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, description || null, event_date, event_type || "general", academic_year || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Calendar event not found" }, { status: 404 });
    }

    if (end_date) {
      const start = new Date(`${event_date}T00:00:00Z`);
      const end = new Date(`${end_date}T00:00:00Z`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
      }
      const dates: string[] = [];
      const nextDate = new Date(start);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      for (; nextDate <= end; nextDate.setUTCDate(nextDate.getUTCDate() + 1)) {
        dates.push(nextDate.toISOString().slice(0, 10));
      }
      const settings = await pool.query(
        `SELECT schedule_days
         FROM system_settings
         WHERE academic_year = $1
           AND (school_id = $2 OR school_id IS NULL)
         ORDER BY school_id NULLS LAST, term DESC
         LIMIT 1`,
        [academic_year || null, result.rows[0].school_id || session.school_id || null]
      );
      const scheduleDays = normalizeScheduleDays(settings.rows[0]?.schedule_days);
      const openDays = new Set(scheduleDays);
      dates.splice(0, dates.length, ...dates.filter((date) => openDays.has(new Date(`${date}T00:00:00Z`).getUTCDay())));
      if (dates.length > 0) {
        const values = dates.map((date) => [title, description || null, date, event_type || "general", academic_year || null, result.rows[0].school_id]);
        const placeholders = values.map((_, row) => `($${row * 6 + 1}, $${row * 6 + 2}, $${row * 6 + 3}, $${row * 6 + 4}, $${row * 6 + 5}, $${row * 6 + 6})`).join(", ");
        await pool.query(
          `INSERT INTO calendar_events (title, description, event_date, event_type, academic_year, school_id) VALUES ${placeholders}`,
          values.flat()
        );
      }
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("PUT calendar-events error:", error);
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthToken(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    await pool.query("DELETE FROM calendar_events WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE calendar-events error:", error);
    return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 });
  }
}
