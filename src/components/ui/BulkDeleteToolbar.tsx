'use client';

import { CheckSquare, Loader2, Square, Trash2 } from 'lucide-react';

type BulkDeleteToolbarProps = {
  pageItemCount: number;
  selectedCount: number;
  onToggleSelectAll: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  selectAllLabel?: string;
};

export function BulkDeleteToolbar({
  pageItemCount,
  selectedCount,
  onToggleSelectAll,
  onDelete,
  isDeleting,
  selectAllLabel = 'Select all',
}: BulkDeleteToolbarProps) {
  const isAllSelected = selectedCount === pageItemCount && pageItemCount > 0;

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
      <button
        onClick={onToggleSelectAll}
        disabled={pageItemCount === 0}
        className="portal-action-btn portal-action-btn-muted flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40 sm:flex-none"
      >
        {isAllSelected ? (
          <CheckSquare className="h-3.5 w-3.5" />
        ) : (
          <Square className="h-3.5 w-3.5" />
        )}
        <span className="sm:hidden">Select</span>
        <span className="hidden sm:inline">{selectAllLabel}</span>
      </button>
      <button
        onClick={onDelete}
        disabled={selectedCount === 0 || isDeleting}
        className="portal-action-btn portal-action-btn-danger flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-medium text-red-300 ring-1 ring-red-500/25 transition-all duration-200 hover:bg-red-500/25 disabled:opacity-40 sm:flex-none"
      >
        {isDeleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Delete ({selectedCount})
      </button>
    </div>
  );
}
