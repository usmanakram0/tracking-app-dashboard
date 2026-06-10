'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, MessageSquare } from 'lucide-react';
import { BulkDeleteToolbar } from '@/components/ui/BulkDeleteToolbar';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SelectToggle } from '@/components/ui/SelectToggle';
import { useDeleteConfirmation } from '@/lib/hooks/useDeleteConfirmation';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useDevices } from '@/lib/hooks/useDevices';
import { useDeleteSmsMessages, useSmsMessages } from '@/lib/hooks/useSmsMessages';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { PAGE_SIZE } from '@/lib/pagination';
import { useSmsQuota } from '@/lib/hooks/useSmsQuota';
import { formatBytes } from '@/lib/storage';
import { formatTimestamp } from '@/lib/utils';
import type { SmsMessage } from '@/lib/types';

const TYPE_LABELS: Record<SmsMessage['message_type'], string> = {
  inbox: 'Inbox',
  sent: 'Sent',
  draft: 'Draft',
  other: 'Other',
};

function groupSmsByAddress(
  messages: SmsMessage[],
  childNameMap: Record<string, string>
) {
  const groupMap = new Map<
    string,
    { address: string; deviceId: string; messages: SmsMessage[]; latestAt: string }
  >();

  messages.forEach((message) => {
    const key = `${message.device_id}::${message.address}`;
    const existing = groupMap.get(key);

    if (existing) {
      existing.messages.push(message);
      if (message.received_at > existing.latestAt) {
        existing.latestAt = message.received_at;
      }
      return;
    }

    groupMap.set(key, {
      address: message.address,
      deviceId: message.device_id,
      messages: [message],
      latestAt: message.received_at,
    });
  });

  return Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      childName: childNameMap[group.deviceId] || 'Device',
      messages: group.messages.sort(
        (a, b) =>
          new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
      ),
    }))
    .sort(
      (a, b) =>
        new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
    );
}

export default function SmsPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const parentId = user?.id;
  const { data: devices = [], isLoading: devicesLoading } = useDevices(parentId);
  const {
    data: smsResult,
    isLoading: smsLoading,
    isError: smsError,
  } = useSmsMessages(parentId, selectedDeviceId, {
    page,
    search: debouncedSearch,
  });
  const smsList = smsResult?.items ?? [];
  const totalCount = smsResult?.totalCount ?? 0;
  const totalPages = smsResult?.totalPages ?? 1;
  const currentPage = smsResult?.page ?? 1;
  const { data: quota } = useSmsQuota(parentId);
  const deleteSms = useDeleteSmsMessages(parentId);
  const deleteConfirm = useDeleteConfirmation();

  const childNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.device_id] = d.child_name || d.device_name || 'Device';
    });
    return map;
  }, [devices]);

  const smsGroups = useMemo(
    () => groupSmsByAddress(smsList, childNameMap),
    [smsList, childNameMap]
  );

  const storageFull = quota?.sync_paused === true;
  const usedBytes = quota?.storage_used_bytes ?? 0;
  const limitBytes = quota?.storage_limit_bytes ?? 104857600;
  const usagePercent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === smsList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(smsList.map((item) => item.id)));
    }
  };

  const handleDeleteRequest = () => {
    if (selectedIds.size === 0) return;
    deleteConfirm.open();
  };

  const handleConfirmDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      deleteConfirm.close();
      return;
    }

    setDeleteMessage(null);
    try {
      const result = await deleteSms.mutateAsync(ids);
      setSelectedIds(new Set());
      setDeleteMessage(
        `Deleted ${result.deleted} message(s). Sync may resume if storage was full.`
      );
      deleteConfirm.close();
    } catch (err) {
      setDeleteMessage(
        err instanceof Error ? err.message : 'Failed to delete selected messages'
      );
      deleteConfirm.close();
    }
  };

  return (
    <div className="portal-page flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="SMS Messages"
        description="Carrier SMS from the child phone (not WhatsApp). Only messages received after setup are synced — full text, no truncation."
      />

      {storageFull && (
        <div className="portal-alert-banner flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 ring-1 ring-amber-500/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-200">SMS storage is full</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
              {quota?.pause_reason ||
                'New SMS messages are not being uploaded. Delete selected messages below to free space.'}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardBody className="py-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>SMS storage usage</span>
            <span>
              {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                usagePercent >= 90 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </CardBody>
      </Card>

      <ChildSelector
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelect={(id) => {
          setSelectedDeviceId(id);
          setPage(1);
          setSelectedIds(new Set());
        }}
        isLoading={devicesLoading}
      />

      <Card>
        <CardHeader
          title="SMS by Number"
          subtitle={`${smsGroups.length} numbers · ${totalCount} messages`}
          icon={<MessageSquare className="h-4 w-4 text-blue-400" />}
          action={
            <BulkDeleteToolbar
              pageItemCount={smsList.length}
              selectedCount={selectedIds.size}
              onToggleSelectAll={toggleSelectAll}
              onDelete={handleDeleteRequest}
              isDeleting={deleteSms.isPending}
              selectAllLabel="Select page"
            />
          }
        />

        <CardBody className="border-b border-slate-800/80 py-3">
          <SearchBar
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              setPage(1);
              setSelectedIds(new Set());
            }}
            placeholder="Search phone number or message text..."
          />
        </CardBody>

        {deleteMessage && (
          <CardBody className="border-b border-slate-800/80 py-3">
            <p className="text-xs text-slate-400">{deleteMessage}</p>
          </CardBody>
        )}

        {smsLoading ? (
          <CardBody className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </CardBody>
        ) : smsError ? (
          <CardBody className="py-16 text-center text-sm text-red-300">
            Failed to load SMS messages. Check your connection and try again.
          </CardBody>
        ) : smsGroups.length === 0 ? (
          <CardBody className="py-16 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">No SMS messages yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              New carrier SMS from the child phone will appear here with full text.
            </p>
          </CardBody>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {smsGroups.map((group) => {
              const groupKey = `${group.deviceId}::${group.address}`;
              const isExpanded =
                expandedGroup === groupKey || smsGroups.length <= 10;

              return (
                <div key={groupKey} className="px-4 py-4 sm:px-6">
                  <button
                    onClick={() =>
                      setExpandedGroup(
                        expandedGroup === groupKey ? null : groupKey
                      )
                    }
                    className="flex w-full items-start justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">
                        {group.address}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {group.childName} · {group.messages.length} message
                        {group.messages.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <p className="shrink-0 text-[11px] text-slate-500">
                      {formatTimestamp(group.latestAt)}
                    </p>
                  </button>

                  {isExpanded && (
                    <div className="portal-stack-5 mt-4 flex flex-col gap-3">
                      {group.messages.map((message) => {
                        const isSelected = selectedIds.has(message.id);

                        return (
                          <div
                            key={message.id}
                            className={`rounded-xl border px-4 py-3 ${
                              isSelected
                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                : 'border-slate-800/80 bg-slate-900/40'
                            }`}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <SelectToggle
                                  isSelected={isSelected}
                                  onClick={() => toggleSelect(message.id)}
                                />
                                <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-300 ring-1 ring-blue-500/25">
                                  {TYPE_LABELS[message.message_type]}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-600">
                                {formatTimestamp(message.received_at)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
                              {message.body}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            setSelectedIds(new Set());
          }}
          isLoading={smsLoading}
        />
      </Card>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete SMS messages?"
        description={`Delete ${selectedIds.size} SMS message(s)? This cannot be undone and may free storage quota.`}
        confirmLabel="Delete messages"
        isLoading={deleteSms.isPending}
        onClose={deleteConfirm.close}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
