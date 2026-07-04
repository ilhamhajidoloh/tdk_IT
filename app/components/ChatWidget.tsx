"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Contact {
  id: string;
  username: string;
  role: string;
  student_id?: string;
  student_name?: string;
  classroom_name?: string;
  subject_name?: string;
  contact_type?: string;
  email?: string | null;
}

interface Participant {
  user_id: string | null;
  username: string | null;
  role: string | null;
  guest_name: string | null;
  guest_session_id: string | null;
  student_name?: string | null;
}

interface Conversation {
  id: string;
  type: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  other_participants: Participant[] | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_user_id: string | null;
  sender_name: string | null;
  sender_role: string | null;
  sender_guest_session_id: string | null;
  sender_guest_name: string | null;
  sender_student_name?: string | null;
}

type View = "conversations" | "contacts" | "messages";

export default function ChatWidget({ userId, userRole }: { userId: string; userRole: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("conversations");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeConvName, setActiveConvName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactFilter, setContactFilter] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unreadPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/unread");
      if (res.ok) {
        const data = await res.json();
        setUnreadTotal(data.unread);
      }
    } catch {}
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {}
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    } catch {}
  }, [scrollToBottom]);

  const markAsRead = useCallback(async (convId: string) => {
    try {
      await fetch(`/api/chat/conversations/${convId}/read`, { method: "POST" });
      fetchUnread();
    } catch {}
  }, [fetchUnread]);

  useEffect(() => {
    fetchUnread();
    unreadPollRef.current = setInterval(fetchUnread, 15000);
    return () => {
      if (unreadPollRef.current) clearInterval(unreadPollRef.current);
    };
  }, [fetchUnread]);

  useEffect(() => {
    if (isOpen && view === "conversations") {
      fetchConversations();
    }
    if (isOpen && view === "contacts") {
      fetchContacts();
    }
  }, [isOpen, view, fetchConversations, fetchContacts]);

  useEffect(() => {
    if (activeConvId && view === "messages") {
      fetchMessages(activeConvId);
      markAsRead(activeConvId);
      pollRef.current = setInterval(() => {
        fetchMessages(activeConvId);
        markAsRead(activeConvId);
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConvId, view, fetchMessages, markAsRead]);

  const openConversation = (conv: Conversation) => {
    const other = conv.other_participants?.[0];
    const name = other?.student_name || other?.username || other?.guest_name || "แชท";
    setActiveConvId(conv.id);
    setActiveConvName(name);
    setView("messages");
  };

  const startChat = async (contact: Contact) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: contact.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConvId(data.conversationId);
        setActiveConvName(contact.student_name || contact.username);
        setView("messages");
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages(activeConvId);
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "เมื่อกี้";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาที`;
    if (diff < 86400000) return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  };

  const getRoleBadge = (role: string | null) => {
    if (role === "admin") return { text: "แอดมิน", color: "bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-200" };
    if (role === "teacher") return { text: "ครู", color: "bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-200" };
    if (role === "student") return { text: "นักเรียน", color: "bg-green-100 dark:bg-green-900/80 text-green-700 dark:text-green-200" };
    return { text: "ผู้เยี่ยมชม", color: "bg-gray-100 text-gray-700" };
  };

  const getContactTypeBadge = (type: string) => {
    if (type === "homeroom" || type === "homeroom_teacher") return { text: "ประจำชั้น", color: "bg-amber-100 text-amber-700" };
    if (type === "subject" || type === "subject_teacher") return { text: "ประจำวิชา", color: "bg-purple-100 text-purple-700" };
    if (type === "admin") return { text: "แอดมิน", color: "bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-200" };
    return null;
  };

  const filteredContacts = contacts.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      c.username.toLowerCase().includes(q) ||
      c.student_name?.toLowerCase().includes(q) ||
      c.classroom_name?.toLowerCase().includes(q);
    const matchFilter = contactFilter === "all" ||
      c.contact_type === contactFilter ||
      c.role === contactFilter;
    return matchSearch && matchFilter;
  });

  const contactFilterOptions = (() => {
    const opts: { key: string; label: string }[] = [{ key: "all", label: "ทั้งหมด" }];
    if (userRole === "admin") {
      opts.push({ key: "teacher", label: "ครู" }, { key: "student", label: "นักเรียน" });
    } else if (userRole === "teacher") {
      opts.push({ key: "admin", label: "แอดมิน" }, { key: "homeroom", label: "ประจำชั้น" }, { key: "subject", label: "ประจำวิชา" });
    } else {
      opts.push({ key: "admin", label: "แอดมิน" }, { key: "homeroom_teacher", label: "ครูประจำชั้น" }, { key: "subject_teacher", label: "ครูประจำวิชา" });
    }
    return opts;
  })();

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {unreadTotal > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
            {view === "messages" && (
              <button
                onClick={() => { setView("conversations"); setActiveConvId(null); fetchConversations(); }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">
                {view === "messages" ? activeConvName : view === "contacts" ? "รายชื่อผู้ติดต่อ" : "แชท"}
              </h3>
              {view === "conversations" && (
                <p className="text-xs text-white/70">ข้อความของคุณ</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {view !== "messages" && (
                <button
                  onClick={() => setView(view === "contacts" ? "conversations" : "contacts")}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title={view === "contacts" ? "ดูแชท" : "แชทใหม่"}
                >
                  {view === "contacts" ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          {view === "conversations" && (
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                  <svg className="w-16 h-16 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-medium">ยังไม่มีการสนทนา</p>
                  <button
                    onClick={() => setView("contacts")}
                    className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 font-semibold"
                  >
                    เริ่มแชทใหม่
                  </button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = conv.other_participants?.[0];
                  const name = other?.student_name || other?.username || other?.guest_name || "ผู้ใช้";
                  const badge = getRoleBadge(other?.role || null);
                  const isGuest = conv.type === "guest";

                  return (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-indigo-600">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 truncate">{name}</span>
                          {isGuest ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">ผู้เยี่ยมชม</span>
                          ) : (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge.color}`}>{badge.text}</span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{conv.last_message}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {conv.last_message_at && (
                          <span className="text-[10px] text-slate-400">{formatTime(conv.last_message_at)}</span>
                        )}
                        {conv.unread_count > 0 && (
                          <span className="w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {conv.unread_count > 9 ? "9+" : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Contacts List */}
          {view === "contacts" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 space-y-2 shrink-0">
                <input
                  type="text"
                  placeholder="ค้นหาผู้ติดต่อ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
                />
                <div className="flex gap-1 flex-wrap">
                  {contactFilterOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setContactFilter(opt.key)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-full transition-colors ${
                        contactFilter === opt.key
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                    <p className="text-sm">ไม่พบผู้ติดต่อ</p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const badge = getRoleBadge(contact.role);
                    const typeBadge = getContactTypeBadge(contact.contact_type || "");

                    return (
                      <button
                        key={contact.id}
                        onClick={() => startChat(contact)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-indigo-600">
                            {(contact.student_name || contact.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800 truncate">
                              {contact.student_name || contact.username}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge.color}`}>
                              {badge.text}
                            </span>
                            {typeBadge && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${typeBadge.color}`}>
                                {typeBadge.text}
                              </span>
                            )}
                          </div>
                          {contact.classroom_name && (
                            <p className="text-xs text-slate-400 mt-0.5">{contact.classroom_name}</p>
                          )}
                          {contact.subject_name && (
                            <p className="text-xs text-slate-400 mt-0.5">วิชา: {contact.subject_name}</p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Messages View */}
          {view === "messages" && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p className="text-sm">เริ่มการสนทนา</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_user_id === userId;
                    const senderName = msg.sender_student_name || msg.sender_name || msg.sender_guest_name || "ผู้ใช้";

                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] ${isMe ? "order-1" : ""}`}>
                          {!isMe && (
                            <p className="text-[10px] text-slate-400 mb-0.5 ml-1 font-medium">{senderName}</p>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-md"
                                : "bg-slate-100 text-slate-800 rounded-bl-md"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <p className={`text-[10px] text-slate-400 mt-0.5 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                            {formatTime(msg.created_at)}
                            {isMe && msg.is_read && " ✓"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-3 py-2 border-t border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
                    maxLength={2000}
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white disabled:opacity-40 hover:shadow-md transition-all shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
