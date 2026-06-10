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
}: NotificationFeedProps) {
  return (
    <Card className="portal-feed flex h-full min-h-[480px] flex-col">
      <CardHeader
        title="Live Activity Feed"
        subtitle={`${totalCount} notifications`}
        icon={<Bell className="h-4 w-4 text-emerald-400" />}
        action={
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
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
        <div className="portal-filter-row flex flex-wrap gap-2">
          {APP_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onAppFilterChange(filter.id)}
              className={`portal-filter-pill rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
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

              return (
                <div
                  key={n.id}
                  className="grid grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-4 transition-colors duration-200 hover:bg-slate-800/25 sm:gap-4 sm:px-6"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-slate-900 sm:h-11 sm:w-11 ${getAppIconColor(n.app_package)}`}
                  >
                    {appLabel.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-slate-200">
                        {appLabel}
                      </span>
                      <span className="hidden text-slate-600 sm:inline">·</span>
                      <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-400/90">
                        {childName}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-slate-300">
                      {sender}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-400">
                      {fullText || 'No message text'}
                    </p>
                  </div>

                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="whitespace-nowrap text-[11px] text-slate-500">
                      {formatTimestamp(n.posted_at)}
                    </p>
                  </div>

                  <p className="col-span-3 text-[11px] text-slate-600 sm:hidden">
                    {formatTimestamp(n.posted_at)}
                  </p>
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
