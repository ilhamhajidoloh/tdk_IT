"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import {
  BookMarked,
  Inbox,
  Send,
  Archive,
  Printer,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Paperclip,
  Download,
  Upload,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
} from "lucide-react";
import ModalPortal from "./ModalPortal";

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

interface Book {
  id: string;
  book_type: "inward" | "outward" | "archive";
  book_number: string | null;
  register_number: string | null;
  date_issued: string;
  date_registered: string;
  sender: string | null;
  receiver: string | null;
  title: string;
  description: string | null;
  created_by_name: string;
  attachments: Attachment[];
}

export default function CorrespondenceTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"inward" | "outward" | "archive">("inward");
  
  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Form State
  const [bookType, setBookType] = useState<"inward" | "outward" | "archive">("inward");
  const [bookNumber, setBookNumber] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Track attachments to delete on edit
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print Register Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printType, setPrintType] = useState<"current" | "inward" | "outward" | "archive" | "all">("current");
  const [printStartDate, setPrintStartDate] = useState("");
  const [printEndDate, setPrintEndDate] = useState("");
  const [printSearch, setPrintSearch] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [officerPosition, setOfficerPosition] = useState("เจ้าหน้าที่สารบรรณ");
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  const handleOpenPrintModal = () => {
    setPrintType("current");
    setPrintStartDate("");
    setPrintEndDate("");
    setPrintSearch(searchTerm);
    setIsPrintModalOpen(true);
  };

  const handlePrintRegister = async () => {
    setIsGeneratingPrint(true);
    try {
      const targetType = printType === "current" ? activeSubTab : printType;
      let url = `/api/correspondence?type=${targetType}&`;
      if (printSearch.trim() !== "") {
        url += `search=${encodeURIComponent(printSearch.trim())}&`;
      }
      if (printStartDate.trim() !== "") {
        url += `start_date=${encodeURIComponent(printStartDate.trim())}&`;
      }
      if (printEndDate.trim() !== "") {
        url += `end_date=${encodeURIComponent(printEndDate.trim())}&`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch books for print");
      const booksToPrint: Book[] = await res.json();

      if (booksToPrint.length === 0) {
        Swal.fire("ไม่พบข้อมูล", "ไม่พบรายการหนังสือตามเงื่อนไขที่เลือกเพื่อพิมพ์", "info");
        setIsGeneratingPrint(false);
        return;
      }

      // Title determination
      let reportTitle = "สมุดทะเบียนคุมหนังสือรับ - ส่ง";
      let registerColLabel = "รับ / ส่ง";
      if (targetType === "inward") {
        reportTitle = "สมุดทะเบียนคุมหนังสือรับ (Inward Register)";
        registerColLabel = "รับ";
      } else if (targetType === "outward") {
        reportTitle = "สมุดทะเบียนคุมหนังสือส่ง (Outward Register)";
        registerColLabel = "ส่ง";
      } else if (targetType === "archive") {
        reportTitle = "สมุดทะเบียนคุมหนังสือเก็บ (Archive Register)";
        registerColLabel = "เก็บ";
      }

      let dateSubtitle = "ข้อมูลทั้งหมดในระบบ";
      if (printStartDate && printEndDate) {
        dateSubtitle = `ระหว่างวันที่ ${formatThaiDateString(printStartDate)} ถึง ${formatThaiDateString(printEndDate)}`;
      } else if (printStartDate) {
        dateSubtitle = `ตั้งแต่วันที่ ${formatThaiDateString(printStartDate)}`;
      } else if (printEndDate) {
        dateSubtitle = `ถึงวันที่ ${formatThaiDateString(printEndDate)}`;
      }

      const todayStr = new Date().toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const tableRowsHtml = booksToPrint
        .map((b, idx) => {
          const typeBadge =
            b.book_type === "inward"
              ? "หนังสือรับ"
              : b.book_type === "outward"
              ? "หนังสือส่ง"
              : "หนังสือเก็บ";

          return `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td style="text-align: center; font-weight: bold;">${b.register_number || "-"}</td>
              <td style="text-align: center;">${b.book_number || "-"}</td>
              <td style="text-align: center; white-space: nowrap;">${formatThaiDateString(b.date_issued)}</td>
              <td>${b.sender || "-"}</td>
              <td>${b.receiver || "-"}</td>
              <td>
                <div style="font-weight: bold;">${b.title}</div>
                ${targetType === "all" ? `<div style="font-size: 11px; color: #4b5563;">[${typeBadge}]</div>` : ""}
              </td>
              <td>${b.description || "-"}</td>
            </tr>
          `;
        })
        .join("");

      const printHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700;800&family=Sarabun:wght@300;400;600;700;800&family=Noto+Sans+Arabic:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Amiri', 'Cairo', 'Noto Naskh Arabic', 'Noto Sans Arabic', 'Inter', 'Sarabun', 'TH Sarabun New', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      padding: 24px;
      color: #111827;
      background: #fff;
      font-size: 13px;
      line-height: 1.4;
    }
    .print-btn {
      position: fixed;
      top: 16px;
      right: 16px;
      padding: 10px 20px;
      background: #4f46e5;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(79,70,229,0.35);
      z-index: 9999;
    }
    .header-container {
      text-align: center;
      margin-bottom: 18px;
    }
    .header-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .header-subtitle {
      font-size: 14px;
      color: #4b5563;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 12px;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #4b5563;
      padding: 6px 8px;
      vertical-align: top;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 700;
      text-align: center;
    }
    .footer-signature {
      display: flex;
      justify-content: flex-end;
      margin-top: 36px;
      page-break-inside: avoid;
    }
    .signature-box {
      text-align: center;
      width: 280px;
      font-size: 13px;
      line-height: 1.8;
    }
    @media print {
      .print-btn { display: none !important; }
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
  <div class="header-container">
    <div class="header-title">${reportTitle}</div>
    <div class="header-subtitle">${dateSubtitle}</div>
  </div>
  <div class="meta-info">
    <div><strong>จำนวนทั้งหมด:</strong> ${booksToPrint.length} รายการ</div>
    <div><strong>วันที่พิมพ์:</strong> ${todayStr}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 45px;">ลำดับ</th>
        <th style="width: 110px;">เลขทะเบียน${registerColLabel}</th>
        <th style="width: 110px;">เลขที่หนังสือ</th>
        <th style="width: 95px;">ลงวันที่</th>
        <th style="width: 150px;">จาก (ผู้ส่ง)</th>
        <th style="width: 150px;">ถึง (ผู้รับ)</th>
        <th>เรื่อง</th>
        <th style="width: 130px;">หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>
  <div class="footer-signature">
    <div class="signature-box">
      <p>ลงชื่อ.........................................................................</p>
      <p style="margin-top: 2px;">( ${officerName.trim() ? officerName.trim() : "..........................................................."} )</p>
      <p>ตำแหน่ง ${officerPosition.trim() ? officerPosition.trim() : "เจ้าหน้าที่สารบรรณ"}</p>
      <p style="margin-top: 4px;">วันที่ .......... เดือน .................... พ.ศ. ..........</p>
    </div>
  </div>
</body>
</html>`;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
        setIsPrintModalOpen(false);
      } else {
        Swal.fire("แจ้งเตือน", "กรุณายินยอมให้เบราว์เซอร์เปิด Pop-up เพื่อพิมพ์เอกสาร", "warning");
      }
    } catch (err) {
      console.error("Print register error:", err);
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถสร้างรายงานทะเบียนคุมได้", "error");
    } finally {
      setIsGeneratingPrint(false);
    }
  };

  // Sort State
  const [sortColumn, setSortColumn] = useState<keyof Book | "date_registered">("date_registered");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (column: keyof Book | "date_registered") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const renderSortIcon = (column: keyof Book | "date_registered") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 ml-1 inline-block" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400 ml-1 inline-block" />;
    }
    return <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400 ml-1 inline-block" />;
  };

  const sortedBooks = [...books].sort((a, b) => {
    const aRaw = a[sortColumn];
    const bRaw = b[sortColumn];
    const aVal = typeof aRaw === "string" ? aRaw : "";
    const bVal = typeof bRaw === "string" ? bRaw : "";

    return sortDirection === "asc"
      ? aVal.localeCompare(bVal, "th", { numeric: true, sensitivity: "base" })
      : bVal.localeCompare(aVal, "th", { numeric: true, sensitivity: "base" });
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBooksData = useCallback(
    async (type: "inward" | "outward" | "archive", search: string) => {
      try {
        let url = `/api/correspondence?type=${type}&`;
        if (search.trim() !== "") {
          url += `search=${encodeURIComponent(search)}&`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as Book[];
          setBooks(data);
        } else {
          console.error("Failed to fetch correspondence books");
        }
      } catch (error) {
        console.error("Error fetching correspondence books:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchBooks = async () => {
    setLoading(true);
    await loadBooksData(activeSubTab, searchTerm);
  };

  useEffect(() => {
    let cancelled = false;
    let url = `/api/correspondence?type=${activeSubTab}&`;
    if (searchTerm.trim() !== "") {
      url += `search=${encodeURIComponent(searchTerm)}&`;
    }
    fetch(url)
      .then((res) => (res.ok ? (res.json() as Promise<Book[]>) : null))
      .then((data) => {
        if (!cancelled && data) {
          setBooks(data);
        }
      })
      .catch((error) => {
        if (!cancelled) console.error("Error fetching correspondence books:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSubTab, searchTerm]);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedBook(null);
    setBookType(activeSubTab);
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
    setBookNumber(book.book_number || "");
    setRegisterNumber(book.register_number || "");
    setDateIssued(book.date_issued.slice(0, 10));
    setSender(book.sender || "");
    setReceiver(book.receiver || "");
    setTitle(book.title);
    setDescription(book.description || "");
    setSelectedFiles([]);
    setAttachmentsToDelete([]);
    setIsOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => {
        const merged = [...prev];
        newFiles.forEach((f) => {
          const isDuplicate = merged.some(
            (existing) => existing.name === f.name && existing.size === f.size
          );
          if (!isDuplicate) merged.push(f);
        });
        return merged;
      });
      // Reset input so the same file can be selected again if needed
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => {
      const merged = [...prev];
      droppedFiles.forEach((f) => {
        const isDuplicate = merged.some(
          (existing) => existing.name === f.name && existing.size === f.size
        );
        if (!isDuplicate) merged.push(f);
      });
      return merged;
    });
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
    const isArchive = bookType === "archive";
    const hasRequiredFields = isArchive
      ? dateIssued && title.trim()
      : bookNumber.trim() && registerNumber.trim() && dateIssued && sender.trim() && receiver.trim() && title.trim();

    if (!hasRequiredFields) {
      Swal.fire("ข้อผิดพลาด", "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("book_type", bookType);
      formData.append("book_number", isArchive ? "" : bookNumber.trim());
      formData.append("register_number", isArchive ? "" : registerNumber.trim());
      formData.append("date_issued", dateIssued);
      formData.append("sender", isArchive ? "" : sender.trim());
      formData.append("receiver", isArchive ? "" : receiver.trim());
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
      } else if (res.status === 413) {
        Swal.fire(
          "ไฟล์แนบมีขนาดใหญ่เกินไป",
          "ไฟล์แนบทั้งหมดรวมกันต้องมีขนาดไม่เกิน 4 MB ต่อการบันทึกหนึ่งครั้ง กรุณาลดขนาดไฟล์ (เช่น ย่อรูปถ่าย) หรือแนบไฟล์ให้น้อยลงแล้วลองใหม่",
          "error"
        );
      } else {
        let message = `เกิดข้อผิดพลาดในการบันทึกข้อมูล (รหัส ${res.status})`;
        try {
          const errorData = await res.json();
          message = errorData.error || message;
        } catch {
          // Server ตอบกลับไม่ใช่ JSON (เช่น หน้า error ของตัวกลาง/โฮสติ้ง) ใช้ข้อความเริ่มต้นด้านบนแทน
        }
        Swal.fire("ข้อผิดพลาด", message, "error");
      }
    } catch (err: unknown) {
      console.error(err);
      Swal.fire(
        "ไม่สามารถส่งข้อมูลได้",
        "ติดต่อเซิร์ฟเวอร์ไม่สำเร็จ สาเหตุที่พบบ่อยคือไฟล์แนบมีขนาดใหญ่เกินไปหรืออินเทอร์เน็ตไม่เสถียร กรุณาลดขนาด/จำนวนไฟล์แนบ ตรวจสอบการเชื่อมต่อ แล้วลองใหม่อีกครั้ง",
        "error"
      );
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

  const SUB_TAB_OPTIONS: {
    key: "inward" | "outward" | "archive";
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "inward", label: "หนังสือรับ", shortLabel: "รับ", icon: Inbox },
    { key: "outward", label: "หนังสือส่ง", shortLabel: "ส่ง", icon: Send },
    { key: "archive", label: "หนังสือเก็บ", shortLabel: "เก็บ", icon: Archive },
  ];

  const isArchiveTab = activeSubTab === "archive";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 animate-fade-in-up">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BookMarked className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                ระบบงานสารบรรณ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                {sortedBooks.length} รายการ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              ลงทะเบียน ค้นหา และจัดเก็บหนังสือรับ-ส่งภายในหน่วยงาน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenPrintModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-card hover:bg-muted text-foreground border border-border text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>พิมพ์ทะเบียนคุม</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-sm transition-all border-0 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>ลงทะเบียนใหม่</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-2 border border-border overflow-x-auto scrollbar-none shrink-0">
          {SUB_TAB_OPTIONS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (tab.key !== activeSubTab) {
                    setLoading(true);
                    setActiveSubTab(tab.key);
                  }
                }}
                className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-card text-indigo-600 dark:text-indigo-300 border-border shadow-xs"
                    : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative flex-1 md:max-w-xs lg:max-w-sm">
          <Search className="pointer-events-none w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่, ผู้ส่ง, เรื่อง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-subtle-foreground text-xs sm:text-sm font-medium transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="ล้างคำค้นหา"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border-0 bg-transparent cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <span className="w-8 h-8 rounded-full border-3 border-indigo-500/20 border-t-indigo-600 animate-spin" />
          <span className="text-xs font-semibold">กำลังโหลดรายการหนังสือ...</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= md) — Compact, zero horizontal clutter */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-2 text-muted-foreground border-b border-border text-xs">
                <tr>
                  {!isArchiveTab && (
                    <th
                      onClick={() => handleSort("register_number")}
                      className="px-4 py-3.5 font-bold cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                    >
                      ทะเบียน / เลขที่ {renderSortIcon("register_number")}
                    </th>
                  )}
                  <th
                    onClick={() => handleSort("date_issued")}
                    className="px-4 py-3.5 font-bold cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                  >
                    ลงวันที่ {renderSortIcon("date_issued")}
                  </th>
                  <th
                    onClick={() => handleSort("title")}
                    className="px-4 py-3.5 font-bold cursor-pointer hover:text-foreground select-none"
                  >
                    เรื่อง {renderSortIcon("title")}
                  </th>
                  {!isArchiveTab && (
                    <th className="px-4 py-3.5 font-bold select-none whitespace-nowrap">
                      จาก → ถึง
                    </th>
                  )}
                  <th className="px-4 py-3.5 font-bold select-none whitespace-nowrap">
                    ไฟล์แนบ
                  </th>
                  <th className="px-4 py-3.5 font-bold text-right select-none whitespace-nowrap">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {sortedBooks.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-surface-2/60 transition-colors align-top"
                  >
                    {!isArchiveTab && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-extrabold text-foreground text-xs">
                          {book.register_number || "-"}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {book.book_number || "-"}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {formatThaiDateString(book.date_issued)}
                    </td>
                    <td className="px-4 py-3.5 min-w-[200px]">
                      <div className="font-bold text-foreground text-sm leading-snug">
                        {book.title}
                      </div>
                      {book.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {book.description}
                        </div>
                      )}
                    </td>
                    {!isArchiveTab && (
                      <td className="px-4 py-3.5 text-xs min-w-[150px]">
                        <div className="font-semibold text-foreground truncate max-w-[180px]" title={book.sender || ""}>
                          {book.sender || "-"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5" title={book.receiver || ""}>
                          ถึง: {book.receiver || "-"}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      {book.attachments.length === 0 ? (
                        <span className="text-xs text-subtle-foreground">-</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {book.attachments.map((file) => (
                            <a
                              key={file.id}
                              href={`/api/correspondence/download/${file.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline w-fit"
                            >
                              <Paperclip className="w-3 h-3 shrink-0" />
                              <span className="max-w-[135px] truncate" title={file.file_name}>
                                {file.file_name}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(book)}
                          title="แก้ไข"
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 border-0 bg-transparent cursor-pointer transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBook(book.id)}
                          title="ลบ"
                          className="p-1.5 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 border-0 bg-transparent cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedBooks.length === 0 && (
                  <tr>
                    <td
                      colSpan={isArchiveTab ? 4 : 6}
                      className="text-center py-12 text-sm font-semibold text-muted-foreground"
                    >
                      ไม่พบข้อมูลหนังสือในหมวดนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< md) */}
          <div className="md:hidden space-y-3">
            {sortedBooks.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-border text-xs">
                <span className="font-bold text-muted-foreground shrink-0">เรียงตาม:</span>
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {(
                    isArchiveTab
                      ? (["date_issued", "title"] as const)
                      : (["date_issued", "register_number", "book_number", "title"] as const)
                  ).map((col) => {
                    const label =
                      col === "date_issued"
                        ? "วันที่"
                        : col === "register_number"
                        ? "ทะเบียน"
                        : col === "book_number"
                        ? "เลขที่"
                        : "เรื่อง";
                    const isSelected = sortColumn === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleSort(col)}
                        className={`px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isSelected
                            ? "bg-card text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/35"
                            : "bg-transparent text-muted-foreground border-transparent"
                        }`}
                      >
                        {label} {isSelected && (sortDirection === "asc" ? "↑" : "↓")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sortedBooks.map((book) => (
              <article
                key={book.id}
                className="p-4 rounded-2xl border border-border bg-card space-y-3"
              >
                {/* Card Top Meta */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!isArchiveTab && book.register_number && (
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
                        ทะเบียน {book.register_number}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground truncate">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {formatThaiDateString(book.date_issued)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(book)}
                      aria-label="แก้ไขหนังสือ"
                      className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-0 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBook(book.id)}
                      aria-label="ลบหนังสือ"
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="font-extrabold text-foreground text-sm leading-snug">
                    {book.title}
                  </h4>
                  {book.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {book.description}
                    </p>
                  )}
                </div>

                {/* Metadata Grid (Only for Inward / Outward) */}
                {!isArchiveTab && (
                  <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-border/70 text-xs">
                    <div className="col-span-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>เลขที่หนังสือ</span>
                      <span className="font-bold text-foreground">
                        {book.book_number || "-"}
                      </span>
                    </div>
                    <div className="rounded-xl bg-surface-2 px-2.5 py-2">
                      <div className="text-[10px] font-semibold text-subtle-foreground">จาก</div>
                      <div className="font-bold text-foreground truncate mt-0.5">
                        {book.sender || "-"}
                      </div>
                    </div>
                    <div className="rounded-xl bg-surface-2 px-2.5 py-2">
                      <div className="text-[10px] font-semibold text-subtle-foreground">ถึง</div>
                      <div className="font-bold text-foreground truncate mt-0.5">
                        {book.receiver || "-"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {book.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/70">
                    {book.attachments.map((file) => (
                      <a
                        key={file.id}
                        href={`/api/correspondence/download/${file.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-500/20"
                      >
                        <Download className="w-3 h-3 shrink-0" />
                        <span className="max-w-[160px] truncate" title={file.file_name}>
                          {file.file_name}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}

            {sortedBooks.length === 0 && (
              <div className="text-center py-12 text-sm font-semibold text-muted-foreground bg-surface-2/60 border border-dashed border-border rounded-2xl">
                ไม่พบข้อมูลหนังสือในหมวดนี้
              </div>
            )}
          </div>
        </>
      )}

      {/* Register / Edit Modal (via ModalPortal) */}
      {isOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/55 backdrop-blur-xs overflow-y-auto"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-border flex items-center justify-between bg-card shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                    {modalMode === "add" ? "ลงทะเบียนหนังสือใหม่" : "แก้ไขข้อมูลหนังสือ"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    กรอกรายละเอียดเอกสารเพื่อบันทึกเข้าสู่ระบบสารบรรณ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="ปิดหน้าต่าง"
                  className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center border border-border cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {/* Book Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">
                    ประเภทหนังสือ <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["inward", "outward", "archive"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBookType(type)}
                        className={`py-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                          bookType === type
                            ? type === "inward"
                              ? "border-teal-500 bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300"
                              : type === "outward"
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                              : "border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
                            : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {type === "inward" ? "หนังสือรับ" : type === "outward" ? "หนังสือส่ง" : "หนังสือเก็บ"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number and Register ID */}
                {bookType !== "archive" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-muted-foreground">
                        เลขที่หนังสือ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bookNumber}
                        onChange={(e) => setBookNumber(e.target.value)}
                        placeholder="เช่น ศธ 04001/..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-muted-foreground">
                        เลขทะเบียน รับ-ส่ง <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={registerNumber}
                        onChange={(e) => setRegisterNumber(e.target.value)}
                        placeholder="เช่น 125/2568"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Date Issued */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">
                    ลงวันที่ในหนังสือ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dateIssued}
                    onChange={(e) => setDateIssued(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                {/* Sender & Receiver */}
                {bookType !== "archive" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-muted-foreground">
                        ผู้ส่ง (จาก) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sender}
                        onChange={(e) => setSender(e.target.value)}
                        placeholder="หน่วยงานผู้ส่ง"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-muted-foreground">
                        ผู้รับ (ถึง) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="หน่วยงานผู้รับ"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">
                    เรื่อง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="รายละเอียดเรื่องที่รับหรือส่ง"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">
                    รายละเอียด / หมายเหตุ
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                  />
                </div>

                {/* Existing Attachments (Edit Mode) */}
                {modalMode === "edit" && selectedBook && selectedBook.attachments.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground">
                      ไฟล์แนบในระบบ
                    </label>
                    <div className="bg-surface-2 border border-border rounded-xl px-3 divide-y divide-border text-xs">
                      {selectedBook.attachments.map((attach) => {
                        const isDeleted = attachmentsToDelete.includes(attach.id);
                        return (
                          <div key={attach.id} className="py-2.5 flex items-center justify-between gap-2">
                            <div
                              className={`truncate ${
                                isDeleted ? "line-through text-rose-400" : "text-foreground font-medium"
                              }`}
                            >
                              {attach.file_name} ({formatBytes(attach.file_size)})
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleDeleteAttachment(attach.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer shrink-0 ${
                                isDeleted
                                  ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300"
                              }`}
                            >
                              {isDeleted ? "ยกเลิกลบ" : "ลบไฟล์"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload Files */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">
                    {modalMode === "add" ? "อัปโหลดไฟล์แนบ" : "เพิ่มไฟล์แนบใหม่"}
                  </label>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-2xl px-4 py-5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15"
                        : "border-border hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10"
                    } text-indigo-600 dark:text-indigo-400`}
                  >
                    <Upload className="w-6 h-6 pointer-events-none" />
                    <div className="pointer-events-none text-center">
                      <p className="text-xs font-bold">
                        {isDragging ? "ปล่อยไฟล์ที่นี่" : "ลากไฟล์มาวางหรือคลิกเพื่อเลือก"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        รองรับ PDF, Word, Excel, รูปภาพ (เลือกได้หลายไฟล์)
                      </p>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-surface-2 border-b border-border">
                        <span className="text-xs font-bold text-foreground">
                          ไฟล์ที่จะอัปโหลด ({selectedFiles.length} ไฟล์)
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles([]);
                          }}
                          className="text-[11px] text-rose-500 hover:underline font-bold border-0 bg-transparent cursor-pointer"
                        >
                          ล้างทั้งหมด
                        </button>
                      </div>
                      <div className="divide-y divide-border max-h-36 overflow-y-auto">
                        {selectedFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-card">
                            <FileText className="w-4 h-4 shrink-0 text-indigo-500" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-foreground truncate" title={file.name}>
                                {file.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {formatBytes(file.size)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(i);
                              }}
                              aria-label="ลบไฟล์นี้ออก"
                              className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 border-0 bg-transparent cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>

              {/* Footer */}
              <div className="px-5 sm:px-6 py-4 bg-card border-t border-border flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted bg-transparent border-0 cursor-pointer"
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm text-xs sm:text-sm border-0 cursor-pointer inline-flex items-center gap-2 disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังบันทึก...</span>
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
        </ModalPortal>
      )}

      {/* Print Register Modal (via ModalPortal) */}
      {isPrintModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto"
            onClick={() => setIsPrintModalOpen(false)}
          >
            <div
              className="bg-card border border-border rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-border flex justify-between items-center bg-surface-2/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Printer className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">
                      พิมพ์ทะเบียนคุมหนังสือ
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      กำหนดเงื่อนไขรายงานและผู้ลงนามก่อนพิมพ์
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  aria-label="ปิดหน้าต่าง"
                  className="w-8 h-8 rounded-xl bg-card hover:bg-muted text-foreground flex items-center justify-center border border-border cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4 text-sm text-foreground overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    ประเภทหนังสือ
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(
                      [
                        {
                          id: "current",
                          label: `แท็บปัจจุบัน (${
                            activeSubTab === "inward"
                              ? "รับ"
                              : activeSubTab === "outward"
                              ? "ส่ง"
                              : "เก็บ"
                          })`,
                        },
                        { id: "inward", label: "หนังสือรับ" },
                        { id: "outward", label: "หนังสือส่ง" },
                        { id: "archive", label: "หนังสือเก็บ" },
                        { id: "all", label: "ทั้งหมด (รับ-ส่ง)" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPrintType(item.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          printType === item.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-background border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      ตั้งแต่วันที่
                    </label>
                    <input
                      type="date"
                      value={printStartDate}
                      onChange={(e) => setPrintStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      ถึงวันที่
                    </label>
                    <input
                      type="date"
                      value={printEndDate}
                      onChange={(e) => setPrintEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    กรองคำค้นหา (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น เลขที่หนังสือ, ผู้ส่ง, เรื่อง..."
                    value={printSearch}
                    onChange={(e) => setPrintSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="pt-3 border-t border-border space-y-2.5">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    ข้อมูลผู้ลงนามท้ายรายงาน
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        ชื่อ-นามสกุล ผู้จัดทำ
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น นายสมชาย ใจดี"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">ตำแหน่ง</label>
                      <input
                        type="text"
                        placeholder="เจ้าหน้าที่สารบรรณ"
                        value={officerPosition}
                        onChange={(e) => setOfficerPosition(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 sm:px-6 py-4 bg-card border-t border-border flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted bg-transparent border-0 cursor-pointer"
                  disabled={isGeneratingPrint}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handlePrintRegister}
                  disabled={isGeneratingPrint}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm text-xs sm:text-sm border-0 cursor-pointer inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {isGeneratingPrint ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังจัดเตรียม...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>ออกรายงาน / พิมพ์</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
