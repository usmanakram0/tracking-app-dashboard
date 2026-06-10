'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageCircle } from 'lucide-react';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useDevices } from '@/lib/hooks/useDevices';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useWhatsAppMessages } from '@/lib/hooks/useWhatsAppMessages';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { PAGE_SIZE } from '@/lib/pagination';
import {
  formatTimestamp,
  getNotificationContactName,
  getNotificationFullText,
} from '@/lib/utils';
import type { NotificationLog } from '@/lib/types';

type ContactGroup = {
  contactKey: string;
  contactName: string;
  deviceId: string;
  messages: NotificationLog[];
  latestAt: string;
};

function buildContactGroups(messages: NotificationLog[]): ContactGroup[] {
  const groupMap = new Map<string, ContactGroup>();

  messages.forEach((message) => {
    const contactName = getNotificationContactName(message);
    const contactKey = `${message.device_id}::${contactName}`;

    const existing = groupMap.get(contactKey);
    if (existing) {
      existing.messages.push(message);
      if (message.posted_at > existing.latestAt) {
        existing.latestAt = message.posted_at;
      }
      return;
    }

    groupMap.set(contactKey, {
      contactKey,
      contactName,
      deviceId: message.device_id,
      messages: [message],
      latestAt: message.posted_at,
    });
  });

  return Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      messages: group.messages.sort(
        (a, b) =>
          new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
      ),
    }))
    .sort(
      (a, b) =>
        new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
    );
}

export default function MessagesPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
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
    data: messageResult,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useWhatsAppMessages(parentId, selectedDeviceId, {
    page,
    search: debouncedSearch,
  });

  const messages = messageResult?.items ?? [];
  const totalCount = messageResult?.totalCount ?? 0;
  const totalPages = messageResult?.totalPages ?? 1;
  const currentPage = messageResult?.page ?? 1;

  const childNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.device_id] = d.child_name || d.device_name || 'Device';
    });
    return map;
  }, [devices]);

  const contactGroups = useMemo(
    () => buildContactGroups(messages),
    [messages]
  );

  return (
    <div className="portal-page flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="WhatsApp Messages"
        description="Full message text from WhatsApp notifications. Only messages received after setup are captured — not old chat history."
      />

      <ChildSelector
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelect={(id) => {
          setSelectedDeviceId(id);
          setPage(1);
        }}
        isLoading={devicesLoading}
      />

      <Card>
        <CardHeader
          title="Messages by Contact"
          subtitle={`${contactGroups.length} contacts on page · ${totalCount} messages total`}
          icon={<MessageCircle className="h-4 w-4 text-emerald-400" />}
        />

        <CardBody className="border-b border-slate-800/80 py-3">
          <SearchBar
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              setPage(1);
            }}
            placeholder="Search contact name or message text..."
          />
        </CardBody>

        {messagesLoading ? (
          <CardBody className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </CardBody>
        ) : messagesError ? (
          <CardBody className="py-16 text-center text-sm text-red-300">
            Failed to load WhatsApp messages. Check your connection and try again.
          </CardBody>
        ) : contactGroups.length === 0 ? (
          <CardBody className="py-16 text-center">
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">No WhatsApp messages yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              New incoming WhatsApp notifications will appear here with full text.
            </p>
          </CardBody>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {contactGroups.map((group) => {
              const childName = childNameMap[group.deviceId] || 'Device';
              const isExpanded =
                expandedContact === group.contactKey || contactGroups.length <= 8;

              return (
                <div key={group.contactKey} className="px-4 py-4 sm:px-6">
                  <button
                    onClick={() =>
                      setExpandedContact(
                        expandedContact === group.contactKey
                          ? null
                          : group.contactKey
                      )
                    }
                    className="flex w-full items-start justify-between gap-3 text-left transition-colors duration-200 hover:text-slate-200"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">
                        {group.contactName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {childName} · {group.messages.length} message
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
                        const fullText = getNotificationFullText(message);
                        const senderLabel =
                          message.title || message.conversation_title || 'Unknown';

                        return (
                          <div
                            key={message.id}
                            className="rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-3"
                          >
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-medium text-emerald-400/90">
                                {senderLabel}
                              </span>
                              <span className="text-[11px] text-slate-600">
                                {formatTimestamp(message.posted_at)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
                              {fullText || 'No message text in notification'}
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
          onPageChange={setPage}
          isLoading={messagesLoading}
        />
      </Card>
    </div>
  );
}
