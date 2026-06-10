'use client';

import { Bell, Loader2 } from 'lucide-react';
import type { NotificationLog } from '@/lib/types';
import {
  formatTimestamp,
  getAppIconColor,
  getNotificationFullText,
  APP_FILTERS,
} from '@/lib/utils';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { BulkDeleteToolbar } from '@/components/ui/BulkDeleteToolbar';
import { SelectToggle } from '@/components/ui/SelectToggle';

type NotificationFeedProps = {
  notifications: NotificationLog[];
  totalCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
  appFilter: string;
  onAppFilterChange: (filter: string) => void;
  childNameMap: Record<string, string>;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
  isDeleting: boolean;
  deleteMessage: string | null;
};

export function NotificationFeed({
  notifications,
  totalCount,
  page,
  totalPages,
  pageSize,
  search,
  onSearchChange,
  onPageChange,
  isLoading,
  isError,
  appFilter,
  onAppFilterChange,
  childNameMap,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDeleteSelected,
  isDeleting,
  deleteMessage,
}: NotificationFeedProps) {
  return (
    <Card className="portal-feed flex h-full min-h-0 flex-col lg:min-h-[480px]">
      <CardHeader
        title="Live Activity Feed"
        subtitle={`${totalCount} notifications`}
        icon={<Bell className="h-4 w-4 text-emerald-400" />}
        action={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <BulkDeleteToolbar
              pageItemCount={notifications.length}
              selectedCount={selectedIds.size}
              onToggleSelectAll={onToggleSelectAll}
              onDelete={onDeleteSelected}
              isDeleting={isDeleting}
              selectAllLabel="Select page"
            />
            <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20 sm:w-auto sm:justify-start sm:py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
        }
      />

      <CardBody className="border-b border-slate-800/80 py-3">
        <div className="portal-stack-5 mb-3 flex flex-col gap-3">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder="Search app, sender, or message..."
          />
        </div>
        <div className="portal-filter-row -mx-1 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {APP_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onAppFilterChange(filter.id)}
              className={`portal-filter-pill shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                appFilter === filter.id
                  ? 'portal-filter-pill-active bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/40'
                  : 'portal-filter-pill-inactive bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </CardBody>

      {deleteMessage && (
        <CardBody className="border-b border-slate-800/80 py-3">
          <p className="text-xs text-slate-400">{deleteMessage}</p>
        </CardBody>
      )}

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400/60" />
            <span className="text-sm">Loading notifications...</span>
          </div>
        )}

        {isError && (
          <div className="px-6 py-16 text-center text-sm text-red-300">
            Failed to load notifications. Check your connection and try again.
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <Bell className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No notifications found</p>
            <p className="mt-1 max-w-xs text-xs text-slate-600">
              Try another search or wait for new activity from the child phone.
            </p>
          </div>
        )}

        {!isLoading && !isError && notifications.length > 0 && (
          <div className="divide-y divide-slate-800/60">
            {notifications.map((n) => {
              const childName = childNameMap[n.device_id] || 'Device';
              const fullText = getNotificationFullText(n);
              const sender = n.title || n.conversation_title || 'Unknown';
              const appLabel = n.app_name || n.app_package;
              const isSelected = selectedIds.has(n.id);

              return (
                <div
                  key={n.id}
                  className={`portal-list-row flex items-start gap-2.5 px-4 py-3.5 transition-colors duration-200 sm:gap-3 sm:px-6 sm:py-4 ${
                    isSelected ? 'bg-emerald-500/5' : 'hover:bg-slate-800/25'
                  }`}
                >
                  <SelectToggle
                    isSelected={isSelected}
                    onClick={() => onToggleSelect(n.id)}
                  />

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-slate-900 sm:h-11 sm:w-11 ${getAppIconColor(n.app_package)}`}
                  >
                    {appLabel.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-slate-200">
                        {appLabel}
                      </span>
                      <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-400/90">
                        {childName}
                      </span>
                    </div>
                    <p className="mt-1 break-words text-sm font-medium text-slate-300">
                      {sender}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-400">
                      {fullText || 'No message text'}
                    </p>
                    <p className="mt-1.5 text-[11px] text-slate-600">
                      {formatTimestamp(n.posted_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        isLoading={isLoading}
      />
    </Card>
  );
}
