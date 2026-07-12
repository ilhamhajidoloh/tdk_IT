"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

interface Book {
  id: string;
  book_type: "inward" | "outward";
  book_number: string;
  register_number: string;
  date_issued: string;
  date_registered: string;
  sender: string;
  receiver: string;
  title: string;
  description: string | null;
  created_by_name: string;
  attachments: Attachment[];
}

export default function CorrespondenceTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"all" | "inward" | "outward">("all");
  
  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Form State
  const [bookType, setBookType] = useState<"inward" | "outward">("inward");
  const [bookNumber, setBookNumber] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Track attachments to delete on edit
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBooks();
  }, [activeSubTab, searchTerm]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `/api/correspondence?`;
      if (activeSubTab !== "all") {
        url += `type=${activeSubTab}&`;
      }
      if (searchTerm.trim() !== "") {
        url += `search=${encodeURIComponent(searchTerm)}&`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      } else {
        console.error("Failed to fetch correspondence books");
      }
    } catch (error) {
      console.error("Error fetching correspondence books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedBook(null);
    setBookType(activeSubTab === "outward" ? "outward" : "inward");
    setBookNumber("");
    setRegisterNumber("");
    setDateIssued(new Date().toISOString().slice(0, 10));
    setSender("");
    setReceiver("");
    setTitle("");
    setDescription("");
    setSelectedFiles([]);
    setAttachmentsToDelete([]);
    setIsOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setModalMode("edit");
    setSelectedBook(book);
    setBookType(book.book_type);
    setBookNumber(book.book_number);
    setRegisterNumber(book.register_number);
    setDateIssued(book.date_issued.slice(0, 10));
    setSender(book.sender);
    setReceiver(book.receiver);
    setTitle(book.title);
    setDescription(book.description || "");
    setSelectedFiles([]);
    setAttachmentsToDelete([]);
    setIsOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const toggleDeleteAttachment = (id: string) => {
    if (attachmentsToDelete.includes(id)) {
      setAttachmentsToDelete((prev) => prev.filter((item) => item !== id));
    } else {
      setAttachmentsToDelete((prev) => [...prev, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookNumber.trim() || !registerNumber.trim() || !dateIssued || !sender.trim() || !receiver.trim() || !title.trim()) {
      Swal.fire("ข้อผิดพลาด", "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("book_type", bookType);
      formData.append("book_number", bookNumber.trim());
      formData.append("register_number", registerNumber.trim());
      formData.append("date_issued", dateIssued);
      formData.append("sender", sender.trim());
      formData.append("receiver", receiver.trim());
      formData.append("title", title.trim());
      formData.append("description", description.trim());

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      let res;
      if (modalMode === "add") {
        res = await fetch("/api/correspondence", {
          method: "POST",
          body: formData,
        });
      } else {
        // Edit mode
        attachmentsToDelete.forEach((id) => {
          formData.append("delete_attachments", id);
        });
        res = await fetch(`/api/correspondence/${selectedBook?.id}`, {
          method: "PUT",
          body: formData,
        });
      }

      if (res.ok) {
        Swal.fire({
          title: "สำเร็จ",
          text: modalMode === "add" ? "บันทึกข้อมูลหนังสือสำเร็จ" : "แก้ไขข้อมูลหนังสือสำเร็จ",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setIsOpen(false);
        fetchBooks();
      } else {
        const errorData = await res.json();
        Swal.fire("ข้อผิดพลาด", errorData.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการส่งข้อมูล", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBook = (bookId: string) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: "คุณแน่ใจว่าต้องการลบหนังสือเล่มนี้และไฟล์แนบทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ใช่, ลบเลย",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/correspondence/${bookId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            Swal.fire("ลบสำเร็จ", "ลบข้อมูลหนังสือเรียบร้อยแล้ว", "success");
            fetchBooks();
          } else {
            const err = await res.json();
            Swal.fire("ลบไม่สำเร็จ", err.error || "เกิดข้อผิดพลาด", "error");
          }
        } catch (error) {
          console.error(error);
          Swal.fire("ข้อผิดพลาด", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "error");
        }
      }
    });
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatThaiDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ระบบงานสารบรรณ (หนังสือรับ-ส่ง)</h1>
          <p className="text-sm text-muted-foreground mt-1">จัดการ ลงทะเบียน ค้นหาเอกสารรับและส่งภายในหน่วยงาน</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          ลงทะเบียนหนังสือใหม่
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 pb-4 border-b border-border">
        {/* Sub-tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full md:w-auto shrink-0">
          {(["all", "inward", "outward"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer whitespace-nowrap ${
                activeSubTab === tab
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {tab === "all" ? "ทั้งหมด" : tab === "inward" ? "หนังสือรับ (Inward)" : "หนังสือส่ง (Outward)"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="ค้นหาเลขที่หนังสือ, ผู้ส่ง, เรื่อง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm">ประเภท</th>
                  <th className="px-6 py-4 font-semibold text-sm">เลขที่หนังสือ</th>
                  <th className="px-6 py-4 font-semibold text-sm">เลขทะเบียนรับ-ส่ง</th>
                  <th className="px-6 py-4 font-semibold text-sm">ลงวันที่</th>
                  <th className="px-6 py-4 font-semibold text-sm">เรื่อง</th>
                  <th className="px-6 py-4 font-semibold text-sm">จาก → ถึง</th>
                  <th className="px-6 py-4 font-semibold text-sm">ไฟล์แนบ</th>
                  <th className="px-6 py-4 font-semibold text-sm text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          book.book_type === "inward"
                            ? "bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50"
                            : "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50"
                        }`}
                      >
                        {book.book_type === "inward" ? "หนังสือรับ" : "หนังสือส่ง"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{book.book_number}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{book.register_number}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{formatThaiDateString(book.date_issued)}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{book.title}</div>
                      {book.description && <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{book.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="font-medium">{book.sender}</div>
                      <div className="text-xs text-muted-foreground">ถึง: {book.receiver}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {book.attachments.map((file) => (
                          <a
                            key={file.id}
                            href={`/api/correspondence/download/${file.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="max-w-[150px] truncate" title={file.file_name}>
                              {file.file_name}
                            </span>
                          </a>
                        ))}
                        {book.attachments.length === 0 && <span className="text-xs text-muted-foreground">ไม่มีไฟล์แนบ</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(book)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:text-indigo-300 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-lg transition-colors font-semibold text-xs border-0 cursor-pointer"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {books.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-muted-foreground">
                      ไม่พบข้อมูลหนังสือในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4">
            {books.map((book) => (
              <div key={book.id} className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                {/* Header: Book Type badge & Date */}
                <div className="flex justify-between items-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      book.book_type === "inward"
                        ? "bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50"
                        : "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50"
                    }`}
                  >
                    {book.book_type === "inward" ? "หนังสือรับ" : "หนังสือส่ง"}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatThaiDateString(book.date_issued)}</span>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="font-extrabold text-foreground text-base leading-snug">{book.title}</h4>
                  {book.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{book.description}</p>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-border text-xs">
                  <div>
                    <div className="text-muted-foreground font-semibold">เลขที่หนังสือ</div>
                    <div className="text-foreground font-bold mt-0.5">{book.book_number}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-semibold">เลขทะเบียน</div>
                    <div className="text-foreground font-bold mt-0.5">{book.register_number}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-semibold">จาก</div>
                    <div className="text-foreground font-bold mt-0.5 truncate">{book.sender}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-semibold">ถึง</div>
                    <div className="text-foreground font-bold mt-0.5 truncate">{book.receiver}</div>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <div className="text-xs text-muted-foreground font-semibold mb-2">ไฟล์แนบ ({book.attachments.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {book.attachments.map((file) => (
                      <a
                        key={file.id}
                        href={`/api/correspondence/download/${file.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="max-w-[120px] truncate" title={file.file_name}>
                          {file.file_name}
                        </span>
                      </a>
                    ))}
                    {book.attachments.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">ไม่มีไฟล์แนบ</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    onClick={() => handleOpenEditModal(book)}
                    className="flex-1 sm:flex-initial text-center justify-center inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:bg-indigo-500/15 rounded-xl transition-colors font-bold text-xs border-0 cursor-pointer"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="flex-1 sm:flex-initial text-center justify-center inline-flex items-center text-red-500 dark:text-red-400 hover:text-red-700 px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:bg-red-500/15 rounded-xl transition-colors font-bold text-xs border-0 cursor-pointer"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {books.length === 0 && (
              <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-2xl">
                ไม่พบข้อมูลหนังสือในระบบ
              </div>
            )}
          </div>
        </>
      )}

      {/* Register / Edit Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col transform transition-all overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {modalMode === "add" ? "ลงทะเบียนหนังสือใหม่" : "แก้ไขข้อมูลหนังสือ"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  กรุณากรอกข้อมูลหนังสือเพื่อเก็บบันทึกเข้าระบบสารบรรณ
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-full border-0 bg-transparent cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Book Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  ประเภทหนังสือ <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(["inward", "outward"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBookType(type)}
                      className={`py-2 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                        bookType === type
                          ? type === "inward"
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-2 ring-teal-400/20"
                            : "border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-400/20"
                          : "border-border bg-muted text-muted-foreground hover:border-border"
                      }`}
                    >
                      {type === "inward" ? "หนังสือรับ (Inward)" : "หนังสือส่ง (Outward)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number and Register ID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    เลขที่หนังสือ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bookNumber}
                    onChange={(e) => setBookNumber(e.target.value)}
                    placeholder="เช่น ศธ 04001/..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    เลขทะเบียน รับ-ส่ง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="เช่น 125/2568"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
              </div>

              {/* Date Issued */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  ลงวันที่ในหนังสือ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateIssued}
                  onChange={(e) => setDateIssued(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              {/* Sender & Receiver */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    ผู้ส่ง (จาก) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="หน่วยงานผู้ส่ง"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    ผู้รับ (ถึง) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    placeholder="หน่วยงานผู้รับ"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  เรื่อง (ชื่อเรื่อง) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="รายละเอียดเรื่องที่รับหรือส่ง"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  รายละเอียด / หมายเหตุ
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 focus:bg-card text-foreground text-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                />
              </div>

              {/* File List for Edit Mode */}
              {modalMode === "edit" && selectedBook && selectedBook.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    ไฟล์แนบในระบบ
                  </label>
                  <div className="bg-muted/30 border border-border rounded-xl p-3 divide-y divide-border text-xs">
                    {selectedBook.attachments.map((attach) => {
                      const isDeleted = attachmentsToDelete.includes(attach.id);
                      return (
                        <div key={attach.id} className="py-2 flex items-center justify-between">
                          <div className={`truncate max-w-[250px] ${isDeleted ? "line-through text-red-400" : "text-foreground font-medium"}`}>
                            {attach.file_name} ({formatBytes(attach.file_size)})
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleDeleteAttachment(attach.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                              isDeleted
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            {isDeleted ? "ยกเลิกการลบ" : "ลบไฟล์"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Files */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {modalMode === "add" ? "อัปโหลดไฟล์แนบ" : "เพิ่มไฟล์แนบใหม่"}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-indigo-200 hover:border-indigo-400 dark:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 px-4 py-5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-indigo-600 dark:text-indigo-400"
                  >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs font-bold">เลือกไฟล์จากเครื่องคอมพิวเตอร์</span>
                    <span className="text-[10px] text-muted-foreground">อนุญาตไฟล์ PDF, JPG, PNG หรือไฟล์เอกสาร</span>
                  </button>
                </div>
                
                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="bg-indigo-50/40 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 text-xs space-y-1 animate-fade-in-up">
                    <div className="font-bold text-indigo-700 dark:text-indigo-300">ไฟล์ที่เลือกเตรียมอัปโหลด ({selectedFiles.length} ไฟล์):</div>
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="truncate text-muted-foreground font-semibold">
                        • {file.name} ({formatBytes(file.size)})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-card border-t border-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-foreground hover:bg-muted bg-transparent border-0 cursor-pointer transition-all"
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-sm border-0 cursor-pointer flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังบันทึก...
                  </>
                ) : modalMode === "add" ? (
                  "บันทึกหนังสือ"
                ) : (
                  "บันทึกการแก้ไข"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
