"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarDays, Megaphone } from "lucide-react";

interface NewsItem { id: string; title: string; content: string; created_at: string; }

export default function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/news")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-screen-lg mx-auto space-y-5 animate-fade-in-up">
      <div className="ui-card p-5 sm:p-6 bg-gradient-to-br from-primary/10 via-card to-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm"><Megaphone className="w-6 h-6" /></div>
          <div><h2 className="text-xl font-extrabold text-foreground">ประกาศข่าว</h2><p className="text-sm text-muted-foreground mt-0.5">ข่าวสารและประกาศล่าสุดจากโรงเรียน</p></div>
        </div>
      </div>
      {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="ui-skeleton-card h-28" />)}</div>
        : items.length === 0 ? <div className="ui-empty"><Bell className="ui-empty-icon" /><h3 className="ui-empty-title">ยังไม่มีประกาศข่าว</h3><p className="ui-empty-description">เมื่อโรงเรียนเผยแพร่ข่าวสาร จะแสดงที่หน้านี้</p></div>
        : <div className="space-y-3 stagger-children">{items.map((item) => (
          <article key={item.id} className="ui-card-interactive p-5 sm:p-6">
            <div className="flex gap-4"><div className="hidden sm:flex w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary items-center justify-center"><Bell className="w-5 h-5" /></div><div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground text-base sm:text-lg">{item.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5"><CalendarDays className="w-3.5 h-3.5" />{new Date(item.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{item.content}</p>
            </div></div>
          </article>
        ))}</div>}
    </section>
  );
}
