"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function usePagination<T>(items: T[], defaultPerPage = 5) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);

  const effectivePerPage = perPage === 0 ? Math.max(items.length, 1) : perPage;
  const totalPages = Math.max(1, Math.ceil(items.length / effectivePerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    if (perPage === 0) return items;
    const start = (safePage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, safePage, perPage]);

  const handlePerPageChange = (nextPerPage: number) => {
    setPerPage(nextPerPage);
    setCurrentPage(1);
  };

  return {
    paginatedItems,
    currentPage: safePage,
    setCurrentPage,
    perPage,
    setPerPage: handlePerPageChange,
    totalPages,
    totalItems: items.length,
    resetPage: () => setCurrentPage(1),
  };
}

interface PaginationBarProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  unitLabel?: string;
}

export default function PaginationBar({
  totalItems,
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
  unitLabel = "รายการ",
}: PaginationBarProps) {
  if (totalItems === 0) return null;

  const isAll = perPage === 0;
  const start = isAll ? 1 : Math.min((currentPage - 1) * perPage + 1, totalItems);
  const end = isAll ? totalItems : Math.min(currentPage * perPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/70">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
        <span>
          แสดง {start}–{end} จาก{" "}
          <strong className="text-foreground tabular-nums">{totalItems.toLocaleString()}</strong>{" "}
          {unitLabel}
        </span>
        <span className="flex items-center gap-1.5 sm:border-l sm:border-border sm:pl-3">
          <span>หน้าละ</span>
          <select
            aria-label="จำนวนรายการต่อหน้า"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="bg-card border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-indigo-500 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
            <option value={0}>ทั้งหมด</option>
          </select>
        </span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            aria-label="หน้าก่อนหน้า"
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-card"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border tabular-nums ${
                      currentPage === pageNum
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-card text-muted-foreground border-transparent hover:border-border hover:bg-muted"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return (
                  <span key={pageNum} className="px-1 text-xs text-subtle-foreground">
                    …
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="หน้าถัดไป"
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-card"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
