import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface MarketplacePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (newSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const MarketplacePagination: React.FC<MarketplacePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 36, 48],
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageSelect = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div
      id="marketplace-pagination-bar"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-3 sm:px-4 bg-white border border-[#E0E0D5] rounded-2xl shadow-xs transition-all ${className}`}
    >
      {/* Items count summary & Page size selector */}
      <div className="flex items-center gap-3 text-xs text-[#7A7A6A] w-full sm:w-auto justify-between sm:justify-start">
        <span>
          Showing <strong className="text-[#2D2D2A] font-semibold">{startItem}–{endItem}</strong> of{' '}
          <strong className="text-[#2D2D2A] font-semibold">{totalItems}</strong> listings
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 shrink-0 pl-2 sm:border-l sm:border-[#E0E0D5]">
            <span className="hidden sm:inline">Per page:</span>
            <select
              id="pagination-pagesize-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#F5F5F0] border border-[#E0E0D5] text-[#2D2D2A] rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#5A5A40] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <nav aria-label="Marketplace page navigation" className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => handlePageSelect(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-[#E0E0D5] text-[#7A7A6A] hover:bg-[#F5F5F0] hover:text-[#2D2D2A] disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="First Page"
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous */}
        <button
          id="pagination-prev-btn"
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E0E0D5] text-xs font-semibold text-[#2D2D2A] hover:bg-[#F5F5F0] disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageItem, idx) => {
            if (pageItem === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-[#A0A090] select-none font-bold"
                >
                  ...
                </span>
              );
            }

            const pNum = Number(pageItem);
            const isCurrent = pNum === currentPage;

            return (
              <button
                key={`page-${pNum}`}
                onClick={() => handlePageSelect(pNum)}
                className={`min-w-[36px] h-9 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center ${
                  isCurrent
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'text-[#2D2D2A] border border-[#E0E0D5] hover:bg-[#F5F5F0]'
                }`}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${pNum}`}
              >
                {pNum}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          id="pagination-next-btn"
          onClick={() => handlePageSelect(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E0E0D5] text-xs font-semibold text-[#2D2D2A] hover:bg-[#F5F5F0] disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => handlePageSelect(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-[#E0E0D5] text-[#7A7A6A] hover:bg-[#F5F5F0] hover:text-[#2D2D2A] disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Last Page"
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
};
