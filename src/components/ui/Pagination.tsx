'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  if (totalCount === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-800/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
      <p className="text-center text-xs text-slate-500 sm:text-left">
        Showing {from}–{to} of {totalCount}
      </p>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev || isLoading}
          className="portal-action-btn portal-action-btn-muted inline-flex min-w-[4.5rem] items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>

        <span className="min-w-[5rem] text-center text-xs font-medium text-slate-400">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext || isLoading}
          className="portal-action-btn portal-action-btn-muted inline-flex min-w-[4.5rem] items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
