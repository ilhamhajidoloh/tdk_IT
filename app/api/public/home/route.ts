export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { addDays, buildCookSchedule, buildTeacherForecast, mondayOf, normalizeScheduleDays, todayStr } from "@/app/lib/duty";
import { getSchoolFromUrl } from "@/app/lib/getSchoolByParam";

const TEACHER_FORECAST_WEEKS = 5;
const COOK_FORECAST_DAYS = 8;

function hasEffectiveSchoolDayInRange(
  start: string,
  end: string,
  scheduleDays: number[],
  holidayDates: string[]
): boolean {
  let date = start;
  while (date <= end) {
    const [year, month, day] = date.split("-").map(Number);
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (scheduleDays.includes(dayOfWeek) && !holidayDates.includes(date)) return true;
    date = addDays(date, 1);
  }
  return false;
}

interface TeacherGroupRow {
  id: string;
  name: string;
  order_no: number;
  members: { id: string; username: string }[];
}

interface CookGroupRow {
  id: string;
  name: string;
  order_no: number;
  members: { id: string; name: string }[];
}

interface CookDisplayEntry {
  date: string;
  id: string;
  name: string;
  members: { id: string; name: string }[];
}

export async function GET(req: NextRequest) {
  const today = todayStr();
  const schoolSubdomain = getSchoolFromUrl(req);
  const activeTab = req.nextUrl.searchParams.get("tab") || "news";

  // Get school ID
  const schoolRes = await pool.query(
    "SELECT id FROM public.schools WHERE LOWER(subdomain) = LOWER($1) AND is_active = true",
    [schoolSubdomain]
  );
  const schoolId = schoolRes.rows[0]?.id || "00000000-0000-0000-0000-000000000001";

  // The landing page opens on the news tab. Do not calculate the full duty
  // rotation (groups, members and future dates) until a visitor explicitly
  // opens that tab.
  if (activeTab === "news") {
    const newsQuery = pool.query(
      "SELECT id, title, content, created_at, target_audience FROM public.news WHERE is_published = true AND COALESCE(target_audience, 'all') = 'all' AND (expires_at IS NULL OR expires_at > NOW()) AND (school_id = $1 OR school_id IS NULL) ORDER BY created_at DESC LIMIT 10",
      [schoolId]
    );
    const scheduleDaysQuery = pool.query(
      `SELECT schedule_days FROM public.system_settings
       WHERE (school_id = $1 OR school_id IS NULL)
       ORDER BY (CURRENT_DATE BETWEEN start_date AND end_date) DESC, school_id NULLS LAST, start_date DESC, term DESC
       LIMIT 1`,
      [schoolId]
    );
    const holidaysQuery = pool.query(
      "SELECT id, date, reason, applies_to FROM public.school_holidays WHERE is_published = true AND (school_id = $1 OR school_id IS NULL) AND date >= $2 ORDER BY date ASC",
      [schoolId, today]
    );
    const calendarHolidaysQuery = pool.query(
      `SELECT id, event_date AS date, title AS reason
       FROM public.calendar_events
       WHERE event_type = 'holiday' AND (school_id = $1 OR school_id IS NULL) AND event_date >= $2`,
      [schoolId, today]
    );
    const [newsRes, scheduleDaysRes, holidaysRes, calendarHolidayRes] = await Promise.all([
      newsQuery,
      scheduleDaysQuery,
      holidaysQuery,
      calendarHolidaysQuery,
    ]);
    const scheduleDays = normalizeScheduleDays(scheduleDaysRes.rows[0]?.schedule_days);
    const visibleHolidayMap = new Map<string, { id: string; date: string; reason: string; applies_to: string }>();
    const holidays = [
      ...holidaysRes.rows,
      ...calendarHolidayRes.rows.map((row) => ({ ...row, id: `calendar-${row.id}`, applies_to: "all" })),
    ];
    for (const holiday of holidays) {
      const date = String(holiday.date).slice(0, 10);
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      if (!scheduleDays.includes(weekday)) continue;
      const key = `${date}|${String(holiday.reason).trim().toLocaleLowerCase()}`;
      const existing = visibleHolidayMap.get(key);
      if (!existing || (existing.applies_to !== "all" && holiday.applies_to === "all")) {
        visibleHolidayMap.set(key, { ...holiday, date });
      }
    }

    return NextResponse.json({
      news: newsRes.rows,
      holidays: Array.from(visibleHolidayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      teacherDuty: { current: null, currentWeekClosed: false, forecast: [] },
      cookDuty: { weekStart: today, weekEnd: today, currentWeekClosed: false, thisWeek: [], today: null, forecast: [] },
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  }

  // Look-ahead window for holiday fetching (cover all forecast + some buffer)
  const holidayWindowEnd = addDays(today, TEACHER_FORECAST_WEEKS * 7 + COOK_FORECAST_DAYS + 14);

  const [newsRes, teacherGroupsRes, cookGroupsRes, dutySettingsRes, scheduleDaysRes, holidaysRes] =
    await Promise.all([
      pool.query(
        "SELECT id, title, content, created_at, target_audience FROM public.news WHERE is_published = true AND COALESCE(target_audience, 'all') = 'all' AND (expires_at IS NULL OR expires_at > NOW()) AND (school_id = $1 OR school_id IS NULL) ORDER BY created_at DESC LIMIT 10",
        [schoolId]
      ),
      pool.query(
        `SELECT g.id, g.name, g.order_no,
          COALESCE(json_agg(json_build_object('id', u.id, 'username', u.username)) FILTER (WHERE u.id IS NOT NULL), '[]') AS members
        FROM public.teacher_duty_groups g
        LEFT JOIN public.teacher_duty_members m ON m.group_id = g.id
        LEFT JOIN public.users u ON u.id = m.teacher_id
        WHERE g.school_id = $1 OR g.school_id IS NULL
        GROUP BY g.id
        ORDER BY g.order_no ASC`,
        [schoolId]
      ),
      pool.query(
        `SELECT g.id, g.name, g.order_no,
          COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY m.order_no ASC) FILTER (WHERE c.id IS NOT NULL), '[]') AS members
        FROM public.cook_duty_groups g
        LEFT JOIN public.cook_duty_members m ON m.group_id = g.id
        LEFT JOIN public.cooks c ON c.id = m.cook_id
        WHERE g.school_id = $1 OR g.school_id IS NULL
        GROUP BY g.id
        ORDER BY g.order_no ASC`,
        [schoolId]
      ),
      pool.query(
        "SELECT teacher_anchor_date, cook_anchor_date, teacher_anchor_offset, cook_anchor_offset FROM public.duty_settings WHERE school_id = $1 OR id = 1 LIMIT 1",
        [schoolId]
      ),
      pool.query(
        `SELECT schedule_days FROM public.system_settings
        WHERE (school_id = $1 OR school_id IS NULL)
        ORDER BY
          (CURRENT_DATE BETWEEN start_date AND end_date) DESC,
          school_id NULLS LAST,
          start_date DESC,
          term DESC
        LIMIT 1`,
        [schoolId]
      ),
      pool.query(
        // Rotation is calculated from its anchor date, so prior holidays must
        // remain available; limiting this to the last week makes older
        // closures incorrectly consume cook-duty groups.
        "SELECT id, date, reason, applies_to FROM public.school_holidays WHERE is_published = true AND (school_id = $1 OR school_id IS NULL) AND date <= $2 ORDER BY date ASC",
        [schoolId, holidayWindowEnd]
      ),
    ]);

  const dutySettings = dutySettingsRes.rows[0] ?? { 
    teacher_anchor_date: today, 
    cook_anchor_date: today,
    teacher_anchor_offset: 0,
    cook_anchor_offset: 0
  };
  const teacherAnchor = dutySettings.teacher_anchor_date instanceof Date
    ? dutySettings.teacher_anchor_date.toISOString().split("T")[0]
    : dutySettings.teacher_anchor_date;
  const cookAnchor = dutySettings.cook_anchor_date instanceof Date
    ? dutySettings.cook_anchor_date.toISOString().split("T")[0]
    : dutySettings.cook_anchor_date;
  const teacherOffset = Number(dutySettings.teacher_anchor_offset ?? 0);
  const cookOffset = Number(dutySettings.cook_anchor_offset ?? 0);

  const rawScheduleDays = scheduleDaysRes.rows[0]?.schedule_days;
  const scheduleDays: number[] = normalizeScheduleDays(rawScheduleDays);

  // Calendar holidays are the canonical school-calendar input. Merge them
  // into the duty view so older entries created before the holiday link was
  // added still pause teacher/cook rotations.
  const calendarHolidayRes = await pool.query(
    `SELECT id, event_date AS date, title AS reason
     FROM public.calendar_events
     WHERE event_type = 'holiday'
       AND (school_id = $1 OR school_id IS NULL)
       AND event_date <= $2`,
    [schoolId, holidayWindowEnd]
  );

  // Determine if we have passed the last school day of the current week for cooks (Monday to Sunday)
  const baseWeekStart = mondayOf(today);
  let cookLastSchoolDay = baseWeekStart;
  for (let i = 6; i >= 0; i--) {
    const curDateStr = addDays(baseWeekStart, i);
    const [y, m, d] = curDateStr.split("-").map(Number);
    const dayVal = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (scheduleDays.includes(dayVal)) {
      cookLastSchoolDay = curDateStr;
      break;
    }
  }
  const cookHasPassedLastSchoolDay = today > cookLastSchoolDay;

  // Teacher duty uses the same Monday-to-Sunday week as cook duty.
  const teacherWindowStart = baseWeekStart;
  const teacherHasPassedLastSchoolDay = cookHasPassedLastSchoolDay;

  // Normalize holiday dates to YYYY-MM-DD strings
  const holidays: { id: string; date: string; reason: string; applies_to: string }[] = [
    ...holidaysRes.rows.map((r) => ({
    id: r.id,
    date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0],
    reason: r.reason,
    applies_to: r.applies_to || 'all',
    })),
    ...calendarHolidayRes.rows.map((r) => ({
      id: `calendar-${r.id}`,
      date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0],
      reason: r.reason,
      applies_to: 'all',
    })),
  ];
  
  const teacherHolidayDates: string[] = holidays
    .filter((h) => h.applies_to === "all" || h.applies_to === "teachers")
    .map((h) => h.date);
    
  const cookHolidayDates: string[] = holidays
    .filter((h) => h.applies_to === "all" || h.applies_to === "cooks")
    .map((h) => h.date);

  const teacherWeekHasEffectiveSchoolDay = hasEffectiveSchoolDayInRange(
    teacherWindowStart,
    addDays(teacherWindowStart, 6),
    scheduleDays,
    teacherHolidayDates
  );
  const cookWeekHasEffectiveSchoolDay = hasEffectiveSchoolDayInRange(
    baseWeekStart,
    addDays(baseWeekStart, 6),
    scheduleDays,
    cookHolidayDates
  );

  // The duty engine keeps every holiday source above so that rotations remain
  // correct. For the home-page list, show only dates that have not passed,
  // fall on a regular school day, and collapse entries imported from both
  // calendar tables.
  const visibleHolidayMap = new Map<string, (typeof holidays)[number]>();
  for (const holiday of holidays) {
    if (holiday.date < today) continue;
    const dayOfWeek = new Date(`${holiday.date}T00:00:00Z`).getUTCDay();
    if (!scheduleDays.includes(dayOfWeek)) continue;
    const key = `${holiday.date}|${holiday.reason.trim().toLocaleLowerCase()}`;
    const existing = visibleHolidayMap.get(key);
    if (!existing || (existing.applies_to !== "all" && holiday.applies_to === "all")) {
      visibleHolidayMap.set(key, holiday);
    }
  }
  const visibleHolidays = Array.from(visibleHolidayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const teacherGroups: TeacherGroupRow[] = teacherGroupsRes.rows;
  const cookGroups: CookGroupRow[] = cookGroupsRes.rows;

  // Teacher duty: 1 group per effective school week
  // Keep an all-closed current week visible as "closed", even after its last
  // regular school day. An active week retains the existing next-week rollover.
  const teacherFromDate = teacherHasPassedLastSchoolDay && teacherWeekHasEffectiveSchoolDay
    ? addDays(today, 7)
    : today;
  const teacherForecast = buildTeacherForecast(
    teacherAnchor,
    teacherGroups,
    TEACHER_FORECAST_WEEKS,
    teacherFromDate,
    scheduleDays,
    teacherHolidayDates,
    teacherOffset
  );
  const teacherCurrent = teacherForecast[0] && !teacherForecast[0].allDaysClosed
    ? {
        ...teacherForecast[0].item,
        weekStart: teacherForecast[0].weekStart,
        weekEnd: teacherForecast[0].weekEnd,
        allDaysClosed: teacherForecast[0].allDaysClosed,
      }
    : null;

  // Cook duty: 1 group per effective school day (skip holidays)
  const weekStart = cookHasPassedLastSchoolDay && cookWeekHasEffectiveSchoolDay
    ? addDays(baseWeekStart, 7)
    : baseWeekStart;
  const weekEnd = addDays(weekStart, 6);
  const cookDisplayWeekHasEffectiveSchoolDay = hasEffectiveSchoolDayInRange(
    weekStart,
    weekEnd,
    scheduleDays,
    cookHolidayDates
  );
  const cookEntries = buildCookSchedule(
    cookAnchor,
    cookGroups,
    scheduleDays,
    weekStart,
    scheduleDays.length + COOK_FORECAST_DAYS + 3,
    cookHolidayDates,
    cookOffset
  );

  const serializeCookEntry = (e: (typeof cookEntries)[number]) => ({
    date: e.date,
    id: e.item.id,
    name: e.item.name,
    members: e.item.members,
  });

  // Construct cookThisWeek representing all schedule days for this week
  const cookThisWeek: CookDisplayEntry[] = [];
  let curDate = weekStart;
  while (curDate <= weekEnd) {
    const dayOfWeek = new Date(Date.UTC(
      Number(curDate.split("-")[0]),
      Number(curDate.split("-")[1]) - 1,
      Number(curDate.split("-")[2])
    )).getUTCDay();

    if (scheduleDays.includes(dayOfWeek)) {
      const isHoliday = cookHolidayDates.includes(curDate);
      if (isHoliday) {
        cookThisWeek.push({
          date: curDate,
          id: "",
          name: "",
          members: [],
        });
      } else {
        const entry = cookEntries.find((e) => e.date === curDate);
        if (entry) {
          cookThisWeek.push(serializeCookEntry(entry));
        }
      }
    }
    curDate = addDays(curDate, 1);
  }

  const cookToday = cookEntries.find((e) => e.date === today) ?? null;
  const cookForecast = cookEntries.filter((e) => e.date > weekEnd).slice(0, COOK_FORECAST_DAYS);

  return NextResponse.json({
    news: newsRes.rows,
    holidays: visibleHolidays,
    teacherDuty: {
      current: teacherCurrent,
      currentWeekClosed: teacherForecast[0]?.allDaysClosed ?? false,
      forecast: teacherForecast.slice(1).filter((f) => !f.allDaysClosed).map((f) => ({
        weekStart: f.weekStart,
        weekEnd: f.weekEnd,
        id: f.item.id,
        name: f.item.name,
        members: f.item.members,
        allDaysClosed: f.allDaysClosed,
      })),
    },
    cookDuty: {
      weekStart,
      weekEnd,
      currentWeekClosed: !cookDisplayWeekHasEffectiveSchoolDay,
      thisWeek: cookThisWeek,
      today: cookToday ? serializeCookEntry(cookToday) : null,
      forecast: cookForecast.map(serializeCookEntry),
    },
  });
}
