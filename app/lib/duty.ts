// Rotation helpers for teacher/cook duty schedules.
//
// Teacher duty: 1 group per week. A "week" is a 7-calendar-day window anchored
// at teacher_anchor_date. A week counts as an "active" week only if it has at
// least one school day that is NOT a holiday. Weeks where ALL school days are
// holidays do NOT advance the rotation — the same group carries over.
//
// Cook duty: 1 group per school day. Groups rotate on every date matching
// scheduleDays that is NOT a holiday. Weekends / non-school days / holidays
// are all skipped — rotation does not advance on those days. This naturally
// means that a week where every school day is a holiday doesn't advance the
// cook rotation either.

function toUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function mondayOf(dateStr: string): string {
  const d = toUTCDate(dateStr);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return toDateStr(d);
}

export function addDays(dateStr: string, days: number): string {
  const d = toUTCDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
}

function daysBetween(a: string, b: string): number {
  return Math.round((toUTCDate(b).getTime() - toUTCDate(a).getTime()) / (24 * 3600 * 1000));
}

/** Today's date in the server's local timezone (not UTC — toISOString would shift the calendar day). */
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** scheduleDays values follow the app-wide convention: 0=Sun..6=Sat. */
export function isScheduleDay(dateStr: string, scheduleDays: number[]): boolean {
  return scheduleDays.includes(toUTCDate(dateStr).getUTCDay());
}

/** Returns true if a date is an effective school day (schedule day AND not a holiday). */
export function isEffectiveSchoolDay(
  dateStr: string,
  scheduleDays: number[],
  holidayDates: string[]
): boolean {
  return isScheduleDay(dateStr, scheduleDays) && !holidayDates.includes(dateStr);
}

// ---------------------------------------------------------------------------
// Teacher duty — weekly rotation, anchored 7-day windows
// ---------------------------------------------------------------------------

export interface WeeklyForecastEntry<T> {
  weekStart: string;
  weekEnd: string;
  index: number;
  item: T;
  allDaysClosed: boolean; // true when every school day in the window is a holiday
}

function firstEffectiveDayInRange(
  start: string,
  end: string,
  scheduleDays: number[],
  holidayDates: string[]
): string | null {
  let cur = start;
  while (cur <= end) {
    if (isEffectiveSchoolDay(cur, scheduleDays, holidayDates)) return cur;
    cur = addDays(cur, 1);
  }
  return null;
}

function lastEffectiveDayInRange(
  start: string,
  end: string,
  scheduleDays: number[],
  holidayDates: string[]
): string | null {
  let cur = end;
  while (cur >= start) {
    if (isEffectiveSchoolDay(cur, scheduleDays, holidayDates)) return cur;
    cur = addDays(cur, -1);
  }
  return null;
}

function hasEffectiveSchoolDay(
  start: string,
  end: string,
  scheduleDays: number[],
  holidayDates: string[]
): boolean {
  return firstEffectiveDayInRange(start, end, scheduleDays, holidayDates) !== null;
}

/** Also used for fallback display bounds when all days are closed. */
function firstScheduleDayInRange(start: string, end: string, scheduleDays: number[]): string | null {
  let cur = start;
  while (cur <= end) {
    if (isScheduleDay(cur, scheduleDays)) return cur;
    cur = addDays(cur, 1);
  }
  return null;
}

function lastScheduleDayInRange(start: string, end: string, scheduleDays: number[]): string | null {
  let cur = end;
  while (cur >= start) {
    if (isScheduleDay(cur, scheduleDays)) return cur;
    cur = addDays(cur, -1);
  }
  return null;
}

/**
 * Forecast which teacher-duty group is on duty for each of the next `weeksAhead`
 * 7-day windows starting with the window containing `fromDate`. Windows are
 * anchored at `anchorDate` (group #0's first week).
 *
 * Rotation rule: a window only advances the rotation index if it has at least
 * one effective school day (schedule day that is NOT a holiday). An all-closed
 * week carries the same group forward without consuming a slot.
 */
export function buildTeacherForecast<T>(
  anchorDate: string,
  orderedItems: T[],
  weeksAhead: number,
  fromDate: string,
  scheduleDays: number[],
  holidayDates: string[] = []
): WeeklyForecastEntry<T>[] {
  if (orderedItems.length === 0) return [];

  // Which calendar window contains fromDate?
  const currentWindowIndex = Math.floor(daysBetween(anchorDate, fromDate) / 7);
  const currentWindowStart = addDays(anchorDate, currentWindowIndex * 7);

  // Count how many "active" weeks elapsed before the current window,
  // starting from anchor. Only weeks with ≥1 effective school day consume a slot.
  let activeSlots = 0;
  for (let i = 0; i < currentWindowIndex; i++) {
    const wStart = addDays(anchorDate, i * 7);
    const wEnd = addDays(wStart, 6);
    if (hasEffectiveSchoolDay(wStart, wEnd, scheduleDays, holidayDates)) {
      activeSlots++;
    }
  }

  const results: WeeklyForecastEntry<T>[] = [];
  let rotationSlot = activeSlots;

  for (let i = 0; i < weeksAhead; i++) {
    const windowStart = addDays(currentWindowStart, i * 7);
    const windowEnd = addDays(windowStart, 6);
    const active = hasEffectiveSchoolDay(windowStart, windowEnd, scheduleDays, holidayDates);

    const index = ((rotationSlot % orderedItems.length) + orderedItems.length) % orderedItems.length;

    // Display bounds: prefer effective days; fall back to plain schedule days if all closed
    const displayStart = active
      ? (firstEffectiveDayInRange(windowStart, windowEnd, scheduleDays, holidayDates) ?? windowStart)
      : (firstScheduleDayInRange(windowStart, windowEnd, scheduleDays) ?? windowStart);
    const displayEnd = active
      ? (lastEffectiveDayInRange(windowStart, windowEnd, scheduleDays, holidayDates) ?? windowEnd)
      : (lastScheduleDayInRange(windowStart, windowEnd, scheduleDays) ?? windowEnd);

    results.push({
      weekStart: displayStart,
      weekEnd: displayEnd,
      index,
      item: orderedItems[index],
      allDaysClosed: !active,
    });

    if (active) rotationSlot++;
  }
  return results;
}

// ---------------------------------------------------------------------------
// Cook duty — daily rotation, one group per effective school day
// ---------------------------------------------------------------------------

export interface DailyRotationEntry<T> {
  date: string;
  index: number;
  item: T;
}

/**
 * Returns up to `count` effective-school-day duty assignments on/after `fromDate`
 * (inclusive). Rotation advances only on days that are both in scheduleDays AND
 * NOT in holidayDates. This naturally means a week where every school day is a
 * holiday doesn't advance the rotation.
 */
export function buildCookSchedule<T>(
  anchorDate: string,
  orderedItems: T[],
  scheduleDays: number[],
  fromDate: string,
  count: number,
  holidayDates: string[] = []
): DailyRotationEntry<T>[] {
  if (orderedItems.length === 0 || scheduleDays.length === 0 || count <= 0) return [];

  const weekScheduleDaysCount: Record<number, number> = {};
  const weekIsActive: Record<number, boolean> = {};

  function getWeekInfo(w: number) {
    if (w in weekScheduleDaysCount) {
      return { count: weekScheduleDaysCount[w], active: weekIsActive[w] };
    }
    const wStart = addDays(anchorDate, w * 7);
    const wEnd = addDays(wStart, 6);
    let schedCount = 0;
    let holidaysCount = 0;
    let cur = wStart;
    while (cur <= wEnd) {
      if (isScheduleDay(cur, scheduleDays)) {
        schedCount++;
        if (holidayDates.includes(cur)) {
          holidaysCount++;
        }
      }
      cur = addDays(cur, 1);
    }
    const active = schedCount > 0 && holidaysCount < schedCount;
    weekScheduleDaysCount[w] = schedCount;
    weekIsActive[w] = active;
    return { count: schedCount, active };
  }

  const weekOffsets: Record<number, number> = {};
  function getWeekOffset(w: number): number {
    if (w <= 0) return 0;
    if (w in weekOffsets) return weekOffsets[w];
    const prevInfo = getWeekInfo(w - 1);
    const prevOffset = getWeekOffset(w - 1);
    const offset = prevOffset + (prevInfo.active ? prevInfo.count : 0);
    weekOffsets[w] = offset;
    return offset;
  }

  const results: DailyRotationEntry<T>[] = [];
  let cur = fromDate > anchorDate ? fromDate : anchorDate;
  const MAX_ITERATIONS = 20 * 366;

  for (let i = 0; i < MAX_ITERATIONS && results.length < count; i++) {
    if (isScheduleDay(cur, scheduleDays)) {
      const daysDiff = daysBetween(anchorDate, cur);
      const weekNum = Math.floor(daysDiff / 7);

      const weekInfo = getWeekInfo(weekNum);
      if (weekInfo.active) {
        // Calculate the day's index within the week's schedule days
        const wStart = addDays(anchorDate, weekNum * 7);
        let position = 0;
        let wDate = wStart;
        while (wDate < cur) {
          if (isScheduleDay(wDate, scheduleDays)) {
            position++;
          }
          wDate = addDays(wDate, 1);
        }

        // If this specific day is not a holiday, calculate the group and add to results
        if (!holidayDates.includes(cur)) {
          const offset = getWeekOffset(weekNum);
          const index = (offset + position) % orderedItems.length;
          results.push({ date: cur, index, item: orderedItems[index] });
        }
      }
    }
    cur = addDays(cur, 1);
  }
  return results;
}
