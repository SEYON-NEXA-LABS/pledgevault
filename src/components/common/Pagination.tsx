'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  loading = false,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      // Always show first, last, and pages around current
      pages.push(0);
      
      let start = Math.max(1, page - 1);
      let end = Math.min(totalPages - 2, page + 1);

      if (page <= 2) end = 3;
      if (page >= totalPages - 3) start = totalPages - 4;

      if (start > 1) pages.push('ellipsis-start');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 2) pages.push('ellipsis-end');

      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing <span>{page * pageSize + 1}</span> to <span>{Math.min((page + 1) * pageSize, total)}</span> of <span>{total}</span> records
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={page === 0 || loading}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="pagination-pages">
          {getPages().map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <div key={`${p}-${idx}`} className="pagination-ellipsis">
                  <MoreHorizontal size={14} />
                </div>
              );
            }

            return (
              <button
                key={p}
                className={`pagination-page-btn ${page === p ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
                disabled={loading}
              >
                {p + 1}
              </button>
            );
          })}
        </div>

        <button
          className="pagination-btn"
          disabled={page >= totalPages - 1 || loading}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
