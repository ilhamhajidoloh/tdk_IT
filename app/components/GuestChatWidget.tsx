"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_user_id: string | null;
  sender_name: string | null;
  sender_role: string | null;
  sender_guest_session_id: string | null;
  sender_guest_name: string | null;
}

export default function GuestChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNameForm, setShowNameForm] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const convIdRef = useRef<string | null>(null);

  useEffect(() => { convIdRef.current = conversationId; }, [conversationId]);

  useEffect(() => {
    const sid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setSessionId(sid);

    const handleBeforeUnload = () => {
      if (sid) {
        navigator.sendBeacon(`/api/chat/guest/cleanup?sessionId=${encodeURIComponent(sid)}`, "");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (sid && convIdRef.current) {
        fetch(`/api/chat/guest?sessionId=${encodeURIComponent(sid)}`, { method: "DELETE" }).catch(() => {});
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/chat/guest/${encodeURIComponent(sessionId)}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    } catch {}
  }, [sessionId, scrollToBottom]);

  useEffect(() => {
    if (conversationId && !showNameForm) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversationId, showNameForm, fetchMessages]);

  const startGuestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    try {
      const res = await fetch("/api/chat/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: guestName.trim(), sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
        setShowNameForm(false);
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/guest/${encodeURIComponent(sessionId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages();
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
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  };

  const handleClose = () => {
    setIsOpen(false);
    if (sessionId && conversationId) {
      fetch(`/api/chat/guest?sessionId=${encodeURIComponent(sessionId)}`, { method: "DELETE" }).catch(() => {});
    }
    setConversationId(null);
    setMessages([]);
    setShowNameForm(true);
    setGuestName("");
    const sid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setSessionId(sid);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => isOpen ? handleClose() : setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-3 shrink-0">
            <h3 className="font-bold text-sm">ติดต่อแอดมิน</h3>
            <p className="text-xs text-white/70">แชทสำหรับสอบถามปัญหาการใช้งาน</p>
          </div>

          {/* Guest Name Form */}
          {showNameForm ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <form onSubmit={startGuestChat} className="w-full space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">กรุณาใส่ชื่อของคุณเพื่อเริ่มแชท</p>
                  <p className="text-xs text-slate-400 mt-1">ข้อความจะถูกลบเมื่อปิดหน้านี้</p>
                </div>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="ชื่อของคุณ"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
                  maxLength={100}
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 hover:shadow-md transition-all"
                >
                  เริ่มแชท
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <div className="text-center">
                      <p className="text-sm font-medium">สวัสดีคุณ {guestName}!</p>
                      <p className="text-xs mt-1">พิมพ์ข้อความเพื่อติดต่อแอดมิน</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_guest_session_id === sessionId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[75%]">
                          {!isMe && (
                            <p className="text-[10px] text-slate-400 mb-0.5 ml-1 font-medium">
                              {msg.sender_name || "แอดมิน"}
                            </p>
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
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
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
