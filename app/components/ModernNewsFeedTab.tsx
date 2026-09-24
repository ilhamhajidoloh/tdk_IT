"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Calendar,
  Clock,
  Search,
  Sparkles,
  Share2,
  Check,
  Copy,
  RotateCw,
  Megaphone,
  GraduationCap,
  Users,
  BookOpen,
  X,
  ExternalLink,
  ChevronRight,
  Pin,
  Filter,
} from "lucide-react";
import { formatThaiDate } from "../lib/format";

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  target_audience?: "all" | "admin" | "teacher" | "student" | null;
  target_role?: string | null; // fallback for legacy data
  is_published?: boolean;
}

interface ModernNewsFeedTabProps {
  role: "teacher" | "student";
}

// Relative time formatter in Thai
function getRelativeTimeThai(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "เมื่อสักครู่";
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
    if (diffDay === 1) return "เมื่อวานนี้";
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} สัปดาห์ที่แล้ว`;
    return formatThaiDate(dateStr);
  } catch {
    return formatThaiDate(dateStr);
  }
}

// Check if news was posted recently (within 3 days)
function isRecentNews(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 72;
  } catch {
    return false;
  }
}

// Estimate reading time in minutes
function estimateReadTime(text: string): string {
  const words = text.trim().length;
  const minutes = Math.max(1, Math.ceil(words / 400));
  return `อ่าน ~${minutes} นาที`;
}

export default function ModernNewsFeedTab({ role }: ModernNewsFeedTabProps) {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAudience, setFilterAudience] = useState<"all" | "targeted" | "general">("all");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTeacher = role === "teacher";

  const fetchNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Normalize audience: match target_audience or target_role
          const normalized: NewsItem[] = data.map((item) => ({
            ...item,
            target_audience: item.target_audience || (item.target_role as any) || "all",
          }));

          // Filter announcements relevant to the current user role:
          // Must be for 'all', the specific role ('teacher' or 'student'), or unspecified
          const relevant = normalized.filter((item) => {
            if (item.is_published === false) return false;
            const aud = item.target_audience;
            if (!aud || aud === "all") return true;
            return aud === role;
          });

          setAllNews(relevant);
        }
      }
    } catch (err) {
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Copy text to clipboard with feedback
  const handleCopy = (news: NewsItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const textToCopy = `${news.title}\n\n${news.content}\n\n— ประกาศ ณ วันที่ ${formatThaiDate(news.created_at)}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(news.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Filtered and searched news
  const filteredNews = useMemo(() => {
    return allNews.filter((item) => {
      // Filter by category pill
      if (filterAudience === "targeted") {
        if (item.target_audience !== role) return false;
      } else if (filterAudience === "general") {
        if (item.target_audience !== "all" && item.target_audience !== null && item.target_audience !== undefined) {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchContent = item.content?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent) return false;
      }

      return true;
    });
  }, [allNews, filterAudience, searchQuery, role]);

  // Highlight latest announcement if not searching/filtering
  const isDefaultView = searchQuery === "" && filterAudience === "all";
  const featuredItem = isDefaultView && filteredNews.length > 0 ? filteredNews[0] : null;
  const regularNews = isDefaultView && filteredNews.length > 1 ? filteredNews.slice(1) : filteredNews;

  // Render Audience Badge
  const renderAudienceBadge = (audience?: string | null) => {
    if (audience === "teacher") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <GraduationCap className="w-3.5 h-3.5" />
          เฉพาะคุณครู
        </span>
      );
    }
    if (audience === "student") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          <BookOpen className="w-3.5 h-3.5" />
          เฉพาะนักเรียน
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
        <Users className="w-3.5 h-3.5" />
        ทุกคน
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── HERO BANNER ── */}
      <div className="aurora-panel relative rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-xl border border-white/10">
        {/* Glow decorative orbs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Megaphone className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                  {isTeacher ? "ประกาศข่าวสารสำหรับครู" : "ประกาศข่าวสารสำหรับนักเรียน"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  อัปเดตแบบเรียลไทม์
                </span>
              </div>
              <p className="mt-1 text-sm sm:text-base text-white/80 font-medium max-w-xl">
                {isTeacher
                  ? "ศูนย์รวมข่าวสาร ประกาศนโยบาย หนังสือแจ้งเวียน และกิจกรรมสำคัญสำหรับคณะครูและบุคลากร"
                  : "ติดตามข่าวสารกิจกรรม กำหนดการสำคัญ ประกาศจากโรงเรียน และข้อมูลการเรียนการสอน"}
              </p>
            </div>
          </div>

          {/* Quick Counter & Refresh */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-center">
              <span className="block text-2xl font-black">{allNews.length}</span>
              <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">ประกาศทั้งหมด</span>
            </div>
            <button
              onClick={() => fetchNews(true)}
              disabled={refreshing || loading}
              title="รีเฟรชข่าวสาร"
              className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 backdrop-blur-md transition-all text-white cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH & CATEGORY FILTERS ── */}
      <div className="ui-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามหัวข้อ หรือเนื้อหาประกาศ..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterAudience("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterAudience === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            ทั้งหมด ({allNews.length})
          </button>
          <button
            onClick={() => setFilterAudience("targeted")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterAudience === "targeted"
                ? isTeacher
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-sky-600 text-white shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {isTeacher ? (
              <>
                <GraduationCap className="w-3.5 h-3.5" />
                เฉพาะคุณครู ({allNews.filter((n) => n.target_audience === "teacher").length})
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                เฉพาะนักเรียน ({allNews.filter((n) => n.target_audience === "student").length})
              </>
            )}
          </button>
          <button
            onClick={() => setFilterAudience("general")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterAudience === "general"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            ทั่วไป ({allNews.filter((n) => !n.target_audience || n.target_audience === "all").length})
          </button>
        </div>
      </div>

      {/* ── LOADING SKELETON ── */}
      {loading ? (
        <div className="space-y-4">
          <div className="ui-card p-6 border-dashed animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-muted rounded-lg" />
            <div className="h-4 w-3/4 bg-muted/60 rounded" />
            <div className="h-4 w-1/2 bg-muted/40 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="ui-card p-5 animate-pulse space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-20 bg-muted rounded-full" />
                  <div className="h-4 w-24 bg-muted/50 rounded" />
                </div>
                <div className="h-5 w-4/5 bg-muted rounded-lg" />
                <div className="h-16 w-full bg-muted/40 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredNews.length === 0 ? (
        /* ── EMPTY STATE ── */
        <div className="ui-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <Bell className="w-8 h-8 opacity-80" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-foreground">
              {searchQuery ? "ไม่พบประกาศที่ตรงกับการค้นหา" : "ยังไม่มีประกาศข่าวสารในขณะนี้"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? `ลองตรวจสอบคำค้นหา "${searchQuery}" หรือเลือกหมวดหมู่อื่นดูอีกครั้ง`
                : "เมื่อทางโรงเรียนเผยแพร่ข่าวสารหรือประกาศสำคัญ จะปรากฏให้เห็นในหน้านี้ทันที"}
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterAudience("all");
              }}
              className="ui-btn ui-btn-outline text-xs px-4 py-2 rounded-xl mt-2"
            >
              ล้างการค้นหา
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── FEATURED ANNOUNCEMENT (Latest Highlight) ── */}
          {featuredItem && (
            <div
              onClick={() => setSelectedNews(featuredItem)}
              className="group relative ui-card-interactive p-6 sm:p-7 rounded-3xl border-2 border-primary/20 hover:border-primary/50 transition-all cursor-pointer bg-gradient-to-br from-primary/5 via-card to-card shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-primary text-primary-foreground shadow-sm animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    ประกาศล่าสุด
                  </span>
                  {renderAudienceBadge(featuredItem.target_audience)}
                  {isRecentNews(featuredItem.created_at) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      ใหม่ 🔥
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {getRelativeTimeThai(featuredItem.created_at)}
                  </span>
                  <span>•</span>
                  <span>{estimateReadTime(featuredItem.content)}</span>
                </div>
              </div>

              <div className="mt-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {featuredItem.title}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-line">
                  {featuredItem.content}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{formatThaiDate(featuredItem.created_at)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleCopy(featuredItem, e)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="คัดลอกข้อความประกาศ"
                  >
                    {copiedId === featuredItem.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    อ่านฉบับเต็ม
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── REGULAR NEWS GRID ── */}
          {regularNews.length > 0 && (
            <div>
              {featuredItem && (
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    ประกาศทั้งหมด ({filteredNews.length})
                  </h3>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {regularNews.map((item) => {
                  const isRecent = isRecentNews(item.created_at);
                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelectedNews(item)}
                      className="group ui-card-interactive p-5 sm:p-6 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {renderAudienceBadge(item.target_audience)}
                            {isRecent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                ใหม่
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                            {getRelativeTimeThai(item.created_at)}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-foreground text-base sm:text-lg group-hover:text-primary transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h4>

                        {/* Content preview */}
                        <p className="mt-2.5 text-sm text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-line">
                          {item.content}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="mt-5 pt-3.5 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{formatThaiDate(item.created_at)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleCopy(item, e)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="คัดลอกข้อความ"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="inline-flex items-center font-bold text-primary group-hover:translate-x-0.5 transition-transform text-xs">
                            อ่านต่อ
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FULL ANNOUNCEMENT MODAL (Rendered in document.body to ensure 100% full screen coverage) ── */}
      {selectedNews && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedNews(null)}
        >
          <div
            className="bg-card text-foreground rounded-3xl border border-border shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-border/80 flex items-start justify-between gap-4 bg-muted/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {renderAudienceBadge(selectedNews.target_audience)}
                  {isRecentNews(selectedNews.created_at) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      ใหม่ 🔥
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {formatThaiDate(selectedNews.created_at)}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground leading-snug">
                  {selectedNews.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedNews(null)}
                className="p-2 rounded-2xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  โพสต์เมื่อ: {formatThaiDate(selectedNews.created_at)} ({getRelativeTimeThai(selectedNews.created_at)})
                </span>
                <span>{estimateReadTime(selectedNews.content)}</span>
              </div>

              <div className="text-foreground leading-relaxed text-sm sm:text-base font-normal whitespace-pre-wrap break-words">
                {selectedNews.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3">
              <button
                onClick={() => handleCopy(selectedNews)}
                className="ui-btn ui-btn-outline text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                {copiedId === selectedNews.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    คัดลอกแล้ว!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    คัดลอกข้อความ
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedNews(null)}
                className="ui-btn ui-btn-primary text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

