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
      return (
        <svg className="w-3 h-3 text-muted-foreground/30 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    if (sortDirection === "asc") {
      return (
        <svg className="w-3 h-3 text-indigo-600 dark:text-indigo-400 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 text-indigo-600 dark:text-indigo-400 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const sortedBooks = [...books].sort((a, b) => {
    let aVal: any = a[sortColumn] ?? "";
    let bVal: any = b[sortColumn] ?? "";

    if (typeof aVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal, "th", { numeric: true, sensitivity: "base" })
        : bVal.localeCompare(aVal, "th", { numeric: true, sensitivity: "base" });
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBooks();
  }, [activeSubTab, searchTerm]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `/api/correspondence?type=${activeSubTab}&`;
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
    } catch (err: any) {
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

  return (
    <div className="p-4 sm:p-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ระบบงานสารบรรณ (หนังสือรับ-ส่ง)</h1>
          <p className="text-sm text-muted-foreground mt-1">จัดการ ลงทะเบียน ค้นหาเอกสารรับและส่งภายในหน่วยงาน</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleOpenPrintModal}
            className="w-full sm:w-auto bg-card hover:bg-muted text-foreground border border-border font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            พิมพ์ทะเบียนคุม
          </button>
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0 text-sm whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
            </svg>
            ลงทะเบียนหนังสือใหม่
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 pb-4 border-b border-border">
        {/* Sub-tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full md:w-auto shrink-0">
          {(["inward", "outward", "archive"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer whitespace-nowrap ${
                activeSubTab === tab
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-md"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {tab === "inward" ? "หนังสือรับ (Inward)" : tab === "outward" ? "หนังสือส่ง (Outward)" : "หนังสือเก็บ (Archive)"}
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
                  <th className="px-6 py-4 font-semibold text-sm select-none">ประเภท</th>
                  <th 
                    onClick={() => handleSort("book_number")}
                    className="px-6 py-4 font-semibold text-sm cursor-pointer hover:bg-muted/80 select-none transition-colors"
                  >
                    เลขที่หนังสือ {renderSortIcon("book_number")}
                  </th>
                  <th 
                    onClick={() => handleSort("register_number")}
                    className="px-6 py-4 font-semibold text-sm cursor-pointer hover:bg-muted/80 select-none transition-colors"
                  >
                    เลขทะเบียนรับ-ส่ง {renderSortIcon("register_number")}
                  </th>
                  <th 
                    onClick={() => handleSort("date_issued")}
                    className="px-6 py-4 font-semibold text-sm cursor-pointer hover:bg-muted/80 select-none transition-colors"
                  >
                    ลงวันที่ {renderSortIcon("date_issued")}
                  </th>
                  <th 
                    onClick={() => handleSort("title")}
                    className="px-6 py-4 font-semibold text-sm cursor-pointer hover:bg-muted/80 select-none transition-colors"
                  >
                    เรื่อง {renderSortIcon("title")}
                  </th>
                  <th className="px-6 py-4 font-semibold text-sm select-none">จาก → ถึง</th>
                  <th className="px-6 py-4 font-semibold text-sm select-none">ไฟล์แนบ</th>
                  <th className="px-6 py-4 font-semibold text-sm text-center select-none">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          book.book_type === "inward"
                            ? "bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50"
                            : book.book_type === "outward"
                            ? "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50"
                            : "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50"
                        }`}
                      >
                        {book.book_type === "inward" ? "หนังสือรับ" : book.book_type === "outward" ? "หนังสือส่ง" : "หนังสือเก็บ"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{book.book_number || "-"}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{book.register_number || "-"}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{formatThaiDateString(book.date_issued)}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{book.title}</div>
                      {book.description && <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{book.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {book.book_type === "archive" ? (
                        <span className="text-xs text-muted-foreground italic">ไม่มีผู้ส่ง-ผู้รับ</span>
                      ) : (
                        <>
                          <div className="font-medium">{book.sender}</div>
                          <div className="text-xs text-muted-foreground">ถึง: {book.receiver}</div>
                        </>
                      )}
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
            {/* Mobile Sort Controls */}
            {books.length > 0 && (
              <div className="flex gap-2 items-center justify-between p-3 rounded-2xl bg-card border border-border text-xs">
                <span className="font-bold text-muted-foreground">จัดเรียงตาม:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {(["date_issued", "register_number", "book_number", "title"] as const).map((col) => {
                    const label = col === "date_issued" ? "วันที่" : col === "register_number" ? "ทะเบียน" : col === "book_number" ? "เลขที่" : "เรื่อง";
                    const isSelected = sortColumn === col;
                    return (
                      <button
                        key={col}
                        onClick={() => handleSort(col)}
                        className={`px-2.5 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200"
                            : "bg-muted text-muted-foreground border-transparent"
                        }`}
                      >
                        {label} {isSelected && (sortDirection === "asc" ? "▲" : "▼")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sortedBooks.map((book) => (
              <div key={book.id} className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                {/* Header: Book Type badge & Date */}
                <div className="flex justify-between items-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      book.book_type === "inward"
                        ? "bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50"
                        : book.book_type === "outward"
                        ? "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50"
                        : "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50"
                    }`}
                  >
                    {book.book_type === "inward" ? "หนังสือรับ" : book.book_type === "outward" ? "หนังสือส่ง" : "หนังสือเก็บ"}
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
                    <div className="text-foreground font-bold mt-0.5">{book.book_number || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-semibold">เลขทะเบียน</div>
                    <div className="text-foreground font-bold mt-0.5">{book.register_number || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-semibold">จาก</div>
                    <div className="text-foreground font-bold mt-0.5 truncate">{book.sender || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-semibold">ถึง</div>
                    <div className="text-foreground font-bold mt-0.5 truncate">{book.receiver || "-"}</div>
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
            {sortedBooks.length === 0 && (
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
                <div className="grid grid-cols-3 gap-2.5">
                  {(["inward", "outward", "archive"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBookType(type)}
                      className={`py-2 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                        bookType === type
                          ? type === "inward"
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-2 ring-teal-400/20"
                            : type === "outward"
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-400/20"
                            : "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400/20"
                          : "border-border bg-muted text-muted-foreground hover:border-border"
                      }`}
                    >
                      {type === "inward" ? "หนังสือรับ" : type === "outward" ? "หนังสือส่ง" : "หนังสือเก็บ"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number and Register ID */}
              {bookType !== "archive" && (
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
              )}

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
              {bookType !== "archive" && (
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
              )}

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
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-2xl px-4 py-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 scale-[1.01]"
                      : "border-indigo-200 hover:border-indigo-400 dark:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10"
                  } text-indigo-600 dark:text-indigo-400`}
                >
                  <svg className="w-8 h-8 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <div className="pointer-events-none text-center">
                    <p className="text-xs font-bold">
                      {isDragging ? "ปล่อยไฟล์ที่นี่" : "ลากไฟล์มาวางหรือคลิกเพื่อเลือก"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">เลือกได้หลายไฟล์พร้อมกัน · PDF, Word, Excel, รูปภาพ ฯลฯ</p>
                  </div>
                </div>

                {/* Selected Files Queue */}
                {selectedFiles.length > 0 && (
                  <div className="border border-indigo-100 dark:border-indigo-500/20 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/60 dark:bg-indigo-500/10 border-b border-indigo-100 dark:border-indigo-500/20">
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        รายการไฟล์ที่จะอัปโหลด ({selectedFiles.length} ไฟล์)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedFiles([]); }}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold border-0 bg-transparent cursor-pointer px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                      >
                        ล้างทั้งหมด
                      </button>
                    </div>
                    <div className="divide-y divide-border max-h-40 overflow-y-auto">
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted/30 transition-colors group">
                          {/* File icon */}
                          <svg className="w-4 h-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate" title={file.name}>{file.name}</div>
                            <div className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(i); }}
                            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border-0 bg-transparent cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                            title="ลบไฟล์นี้ออก"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2 bg-muted/20 border-t border-border">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline border-0 bg-transparent cursor-pointer"
                      >
                        + เพิ่มไฟล์อีก
                      </button>
                    </div>
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

      {/* Print Register Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-8 transform transition-all">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">พิมพ์ทะเบียนคุมหนังสือ</h3>
                  <p className="text-xs text-muted-foreground">กำหนดเงื่อนไขรายงานและแบบฟอร์มลงนามก่อนพิมพ์</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold border-0 bg-transparent cursor-pointer p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-sm text-foreground">
              {/* Option 1: Select Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  ประเภทหนังสือ
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "current", label: `แท็บปัจจุบัน (${activeSubTab === "inward" ? "รับ" : activeSubTab === "outward" ? "ส่ง" : "เก็บ"})` },
                    { id: "inward", label: "หนังสือรับ" },
                    { id: "outward", label: "หนังสือส่ง" },
                    { id: "archive", label: "หนังสือเก็บ" },
                    { id: "all", label: "ทั้งหมด (รับ-ส่ง)" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPrintType(item.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                        printType === item.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-background border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    ตั้งแต่วันที่ (ลงวันที่)
                  </label>
                  <input
                    type="date"
                    value={printStartDate}
                    onChange={(e) => setPrintStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    ถึงวันที่ (ลงวันที่)
                  </label>
                  <input
                    type="date"
                    value={printEndDate}
                    onChange={(e) => setPrintEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Option 3: Search text */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  กรองคำค้นหา (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น เลขที่หนังสือ, ผู้ส่ง, เรื่อง..."
                  value={printSearch}
                  onChange={(e) => setPrintSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Option 4: Signature fields */}
              <div className="pt-2 border-t border-border">
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                  ข้อมูลผู้ลงนามท้ายรายงาน
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">ชื่อ-นามสกุล ผู้จัดทำ</label>
                    <input
                      type="text"
                      placeholder="เช่น นายสมชาย ใจดี"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      placeholder="เจ้าหน้าที่สารบรรณ"
                      value={officerPosition}
                      onChange={(e) => setOfficerPosition(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-card border-t border-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl font-bold text-sm text-foreground hover:bg-muted bg-transparent border-0 cursor-pointer"
                disabled={isGeneratingPrint}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handlePrintRegister}
                disabled={isGeneratingPrint}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md text-sm border-0 cursor-pointer flex items-center gap-2"
              >
                {isGeneratingPrint ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังจัดเตรียม...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    ออกรายงาน / พิมพ์
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
