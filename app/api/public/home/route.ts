export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { addDays, buildCookSchedule, buildTeacherForecast, mondayOf, todayStr } from "@/app/lib/duty";
import { getSchoolFromUrl } from "@/app/lib/getSchoolByParam";

const TEACHER_FORECAST_WEEKS = 5;
const COOK_FORECAST_DAYS = 8;

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const aDate = new Date(Date.UTC(ay, am - 1, ad));
  const bDate = new Date(Date.UTC(by, bm - 1, bd));
  return Math.round((bDate.getTime() - aDate.getTime()) / (24 * 3600 * 1000));
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

export async function GET(req: NextRequest) {
  const today = todayStr();
  const schoolSubdomain = getSchoolFromUrl(req);

  // Get school ID
  const schoolRes = await pool.query(
    "SELECT id FROM public.schools WHERE LOWER(subdomain) = LOWER($1) AND is_active = true",
    [schoolSubdomain]
  );
  const schoolId = schoolRes.rows[0]?.id || "00000000-0000-0000-0000-000000000001";

  // Look-ahead window for holiday fetching (cover all forecast + some buffer)
  const holidayWindowEnd = addDays(today, TEACHER_FORECAST_WEEKS * 7 + COOK_FORECAST_DAYS + 14);

  const [newsRes, teacherGroupsRes, cookGroupsRes, dutySettingsRes, scheduleDaysRes, holidaysRes] =
    await Promise.all([
      pool.query(
        "SELECT id, title, content, created_at FROM public.news WHERE is_published = true AND (school_id = $1 OR school_id IS NULL) ORDER BY created_at DESC LIMIT 10",
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
        WHERE (school_id = $1 OR school_id IS NULL) AND end_date >= CURRENT_DATE
        ORDER BY start_date ASC LIMIT 1`,
        [schoolId]
      ),
      pool.query(
        "SELECT id, date, reason, applies_to FROM public.school_holidays WHERE is_published = true AND (school_id = $1 OR school_id IS NULL) AND date >= $2 AND date <= $3 ORDER BY date ASC",
        [schoolId, addDays(today, -7), holidayWindowEnd]
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
  const scheduleDays: number[] = Array.isArray(rawScheduleDays) ? rawScheduleDays : [1, 2, 3, 4, 5];

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

  // Determine if we have passed the last school day of the current week for teachers (anchored week window)
  const teacherEffectiveFrom = today < teacherAnchor ? teacherAnchor : today;
  const teacherWindowIndex = Math.floor(daysBetween(teacherAnchor, teacherEffectiveFrom) / 7);
  const teacherWindowStart = addDays(teacherAnchor, teacherWindowIndex * 7);
  let teacherLastSchoolDay = teacherWindowStart;
  for (let i = 6; i >= 0; i--) {
    const curDateStr = addDays(teacherWindowStart, i);
    const [y, m, d] = curDateStr.split("-").map(Number);
    const dayVal = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (scheduleDays.includes(dayVal)) {
      teacherLastSchoolDay = curDateStr;
      break;
    }
  }
  const teacherHasPassedLastSchoolDay = today > teacherLastSchoolDay;

  // Normalize holiday dates to YYYY-MM-DD strings
  const holidays: { id: string; date: string; reason: string; applies_to: string }[] = holidaysRes.rows.map((r) => ({
    id: r.id,
    date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0],
    reason: r.reason,
    applies_to: r.applies_to || 'all',
  }));
  
  const teacherHolidayDates: string[] = holidays
    .filter((h) => h.applies_to === "all" || h.applies_to === "teachers")
    .map((h) => h.date);
    
  const cookHolidayDates: string[] = holidays
    .filter((h) => h.applies_to === "all" || h.applies_to === "cooks")
    .map((h) => h.date);

  const teacherGroups: TeacherGroupRow[] = teacherGroupsRes.rows;
  const cookGroups: CookGroupRow[] = cookGroupsRes.rows;

  // Teacher duty: 1 group per effective school week
  const teacherFromDate = teacherHasPassedLastSchoolDay ? addDays(today, 7) : today;
  const teacherForecast = buildTeacherForecast(
    teacherAnchor,
    teacherGroups,
    TEACHER_FORECAST_WEEKS,
    teacherFromDate,
    scheduleDays,
    teacherHolidayDates,
    teacherOffset
  );
  const teacherCurrent = teacherForecast[0]
    ? {
        ...teacherForecast[0].item,
        weekStart: teacherForecast[0].weekStart,
        weekEnd: teacherForecast[0].weekEnd,
        allDaysClosed: teacherForecast[0].allDaysClosed,
      }
    : null;

  // Cook duty: 1 group per effective school day (skip holidays)
  const weekStart = cookHasPassedLastSchoolDay ? addDays(baseWeekStart, 7) : baseWeekStart;
  const weekEnd = addDays(weekStart, 6);
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
  const cookThisWeek: any[] = [];
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
    holidays,
    teacherDuty: {
      current: teacherCurrent,
      forecast: teacherForecast.slice(1).map((f) => ({
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
      thisWeek: cookThisWeek,
      today: cookToday ? serializeCookEntry(cookToday) : null,
      forecast: cookForecast.map(serializeCookEntry),
    },
  });
}
