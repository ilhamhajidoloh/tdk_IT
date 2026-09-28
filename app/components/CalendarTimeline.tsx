"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, List } from "lucide-react";
import { normalizeScheduleDays } from "../lib/duty";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  academic_year: string | null;
};

type CalendarTimelineProps = {
  schoolId?: string | null;
  academicYear?: string | null;
};

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  general: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  exam: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  holiday: { bg: "bg-green-500/10", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
  activity: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500" },
  meeting: { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  deadline: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
};

export default function CalendarTimeline({ schoolId, academicYear }: CalendarTimelineProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let url = "/api/calendar-events";
        const params = new URLSearchParams();
        if (schoolId) params.append("schoolId", schoolId);
        if (academicYear) params.append("academicYear", academicYear);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to fetch calendar events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [schoolId, academicYear]);

  useEffect(() => {
    fetch("/api/public/settings?all=true")
      .then((response) => response.ok ? response.json() : [])
      .then((settings) => {
        const matching = Array.isArray(settings)
          ? settings.find((setting) => String(setting.academic_year) === String(academicYear)) || settings[0]
          : settings;
        if (Array.isArray(matching?.schedule_days) && matching.schedule_days.length > 0) {
          setScheduleDays(normalizeScheduleDays(matching.schedule_days));
        }
      })
      .catch(() => {});
  }, [academicYear]);

  const formatThaiDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: undefined
    });
  };

  const getEventColor = (type: string) => {
    return EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.general;
  };

  const isUpcoming = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  const visibleEvents = events.filter((event) => {
    const dayOfWeek = new Date(`${event.event_date.slice(0, 10)}T00:00:00Z`).getUTCDay();
    return event.event_type !== "holiday" || scheduleDays.includes(dayOfWeek);
  });
  const upcomingEvents = visibleEvents.filter(e => isUpcoming(e.event_date)).slice(0, 5);
  const displayEvents = isExpanded ? upcomingEvents : upcomingEvents.slice(0, 3);
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = monthStart.getDay();
  const monthCells = Array.from({ length: Math.ceil((firstWeekday + monthDays) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= monthDays ? day : null;
  });
  const eventsByDay = new Map<string, CalendarEvent[]>();
  visibleEvents.forEach((event) => {
    const key = event.event_date.slice(0, 10);
    eventsByDay.set(key, [...(eventsByDay.get(key) || []), event]);
  });
  const currentDate = new Date();
  const todayKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-foreground">ปฏิทินกำหนดการ</h3>
          <p className="text-xs text-muted-foreground">กิจกรรมและเหตุการณ์สำคัญ</p>
        </div>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1" role="tablist" aria-label="มุมมองปฏิทิน">
          <button type="button" role="tab" aria-selected={viewMode === "calendar"} onClick={() => setViewMode("calendar")} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold cursor-pointer ${viewMode === "calendar" ? "bg-background text-indigo-700 shadow-sm dark:text-indigo-300" : "text-muted-foreground"}`}><Calendar className="h-3.5 w-3.5" />ปฏิทิน</button>
          <button type="button" role="tab" aria-selected={viewMode === "timeline"} onClick={() => setViewMode("timeline")} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold cursor-pointer ${viewMode === "timeline" ? "bg-background text-indigo-700 shadow-sm dark:text-indigo-300" : "text-muted-foreground"}`}><List className="h-3.5 w-3.5" />Timeline</button>
        </div>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
          <p className="text-sm text-muted-foreground">ไม่มีกำหนดการที่กำลังจะมาถึง</p>
        </div>
      ) : viewMode === "calendar" ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2"><button type="button" aria-label="เดือนก่อนหน้า" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="rounded-md p-1 text-muted-foreground hover:bg-muted cursor-pointer"><ChevronLeft className="h-4 w-4" /></button><span className="text-sm font-bold text-foreground">{calendarMonth.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</span><button type="button" aria-label="เดือนถัดไป" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="rounded-md p-1 text-muted-foreground hover:bg-muted cursor-pointer"><ChevronRight className="h-4 w-4" /></button></div>
          <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-center text-[10px] font-semibold text-muted-foreground">{["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => <div key={day} className="py-1.5">{day}</div>)}</div>
          <div className="grid grid-cols-7">{monthCells.map((day, index) => { const key = day ? `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : ""; const dayEvents = key ? eventsByDay.get(key) || [] : []; const isToday = key === todayKey; return <div key={`${key}-${index}`} className={`min-h-14 border-b border-r border-border p-1 ${day ? "bg-background" : "bg-muted/10"} ${isToday ? "bg-indigo-50 ring-2 ring-inset ring-indigo-500 dark:bg-indigo-500/10" : ""}`}>{day && <><div className="flex items-center justify-between"><span className={`text-[10px] ${isToday ? "font-bold text-indigo-700 dark:text-indigo-300" : "text-muted-foreground"}`}>{day}</span>{isToday && <span className="text-[8px] font-bold text-indigo-700 dark:text-indigo-300">วันนี้</span>}</div>{dayEvents.slice(0, 1).map((event) => <div key={event.id} className={`mt-1 truncate rounded px-1 py-0.5 text-[9px] font-semibold ${getEventColor(event.event_type).bg} ${getEventColor(event.event_type).text}`}>{event.title}</div>)}</>}</div>; })}</div>
        </div>
      ) : (
        <div className="space-y-2">
          {displayEvents.map((event) => {
            const colors = getEventColor(event.event_type);
            return (
              <div
                key={event.id}
                className={`relative p-3 rounded-xl border border-border ${colors.bg} hover:shadow-sm transition-all group`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full ${colors.dot} mt-2 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold ${colors.text} mb-0.5`}>
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatThaiDate(event.event_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {upcomingEvents.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <span>ดูน้อยลง</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>ดูเพิ่มเติม ({upcomingEvents.length - 3})</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
