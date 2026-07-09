import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { addDays, buildCookSchedule, buildTeacherForecast, mondayOf, todayStr } from "@/app/lib/duty";

const TEACHER_FORECAST_WEEKS = 5;
const COOK_FORECAST_DAYS = 8;

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

export async function GET() {
  const today = todayStr();

  // Look-ahead window for holiday fetching (cover all forecast + some buffer)
  const holidayWindowEnd = addDays(today, TEACHER_FORECAST_WEEKS * 7 + COOK_FORECAST_DAYS + 14);

  const [newsRes, teacherGroupsRes, cookGroupsRes, dutySettingsRes, scheduleDaysRes, holidaysRes] =
    await Promise.all([
      pool.query(
        "SELECT id, title, content, created_at FROM news WHERE is_published = true ORDER BY created_at DESC LIMIT 10"
      ),
      pool.query(`
        SELECT g.id, g.name, g.order_no,
          COALESCE(json_agg(json_build_object('id', u.id, 'username', u.username)) FILTER (WHERE u.id IS NOT NULL), '[]') AS members
        FROM teacher_duty_groups g
        LEFT JOIN teacher_duty_members m ON m.group_id = g.id
        LEFT JOIN users u ON u.id = m.teacher_id
        GROUP BY g.id
        ORDER BY g.order_no ASC
      `),
      pool.query(`
        SELECT g.id, g.name, g.order_no,
          COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY m.order_no ASC) FILTER (WHERE c.id IS NOT NULL), '[]') AS members
        FROM cook_duty_groups g
        LEFT JOIN cook_duty_members m ON m.group_id = g.id
        LEFT JOIN cooks c ON c.id = m.cook_id
        GROUP BY g.id
        ORDER BY g.order_no ASC
      `),
      pool.query("SELECT teacher_anchor_date, cook_anchor_date, teacher_anchor_offset, cook_anchor_offset FROM duty_settings WHERE id = 1"),
      pool.query(`
        SELECT schedule_days FROM system_settings
        WHERE end_date >= CURRENT_DATE
        ORDER BY start_date ASC LIMIT 1
      `),
      pool.query(
        "SELECT id, date, reason FROM school_holidays WHERE is_published = true AND date >= $1 AND date <= $2 ORDER BY date ASC",
        [addDays(today, -7), holidayWindowEnd]
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

  // Normalize holiday dates to YYYY-MM-DD strings
  const holidays: { id: string; date: string; reason: string }[] = holidaysRes.rows.map((r) => ({
    id: r.id,
    date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0],
    reason: r.reason,
  }));
  const holidayDates: string[] = holidays.map((h) => h.date);

  const teacherGroups: TeacherGroupRow[] = teacherGroupsRes.rows;
  const cookGroups: CookGroupRow[] = cookGroupsRes.rows;

  // Teacher duty: 1 group per effective school week
  const teacherForecast = buildTeacherForecast(
    teacherAnchor,
    teacherGroups,
    TEACHER_FORECAST_WEEKS,
    today,
    scheduleDays,
    holidayDates,
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
  const weekStart = mondayOf(today);
  const weekEnd = addDays(weekStart, 6);
  const cookEntries = buildCookSchedule(
    cookAnchor,
    cookGroups,
    scheduleDays,
    weekStart,
    scheduleDays.length + COOK_FORECAST_DAYS + 3,
    holidayDates,
    cookOffset
  );
  const cookThisWeek = cookEntries.filter((e) => e.date <= weekEnd);
  const cookToday = cookEntries.find((e) => e.date === today) ?? null;
  const cookForecast = cookEntries.filter((e) => e.date > weekEnd).slice(0, COOK_FORECAST_DAYS);

  const serializeCookEntry = (e: (typeof cookEntries)[number]) => ({
    date: e.date,
    id: e.item.id,
    name: e.item.name,
    members: e.item.members,
  });

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
      thisWeek: cookThisWeek.map(serializeCookEntry),
      today: cookToday ? serializeCookEntry(cookToday) : null,
      forecast: cookForecast.map(serializeCookEntry),
    },
  });
}
