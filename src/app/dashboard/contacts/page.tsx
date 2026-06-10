'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Contact, Loader2, Mail, Phone } from 'lucide-react';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { BulkDeleteToolbar } from '@/components/ui/BulkDeleteToolbar';
import { SelectToggle } from '@/components/ui/SelectToggle';
import { useDevices } from '@/lib/hooks/useDevices';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import {
  useDeletePhoneContacts,
  usePhoneContacts,
} from '@/lib/hooks/usePhoneContacts';
import { PAGE_SIZE } from '@/lib/pagination';
import { formatTimestamp } from '@/lib/utils';

export default function ContactsPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
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
    data: contactResult,
    isLoading: contactsLoading,
    isError: contactsError,
  } = usePhoneContacts(parentId, selectedDeviceId, {
    page,
    search: debouncedSearch,
  });
  const deleteContacts = useDeletePhoneContacts(parentId);

  const contacts = contactResult?.items ?? [];
  const totalCount = contactResult?.totalCount ?? 0;
  const totalPages = contactResult?.totalPages ?? 1;
  const currentPage = contactResult?.page ?? 1;

  const childNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.device_id] = d.child_name || d.device_name || 'Device';
    });
    return map;
  }, [devices]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setDeleteMessage(null);
    try {
      const result = await deleteContacts.mutateAsync(ids);
      setSelectedIds(new Set());
      setDeleteMessage(`Deleted ${result.deleted} contact(s).`);
    } catch (err) {
      setDeleteMessage(
        err instanceof Error ? err.message : 'Failed to delete selected contacts'
      );
    }
  };

  const resetSelection = () => setSelectedIds(new Set());

  return (
    <div className="portal-page flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Phone Contacts"
        description="Saved contacts from the child phone contact book. Only contacts added or updated after setup are synced."
      />

      <ChildSelector
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelect={(id) => {
          setSelectedDeviceId(id);
          setPage(1);
          resetSelection();
        }}
        isLoading={devicesLoading}
      />

      <Card>
        <CardHeader
          title="Contact List"
          subtitle={`${totalCount} contacts`}
          icon={<Contact className="h-4 w-4 text-blue-400" />}
          action={
            <BulkDeleteToolbar
              pageItemCount={contacts.length}
              selectedCount={selectedIds.size}
              onToggleSelectAll={toggleSelectAll}
              onDelete={handleDeleteSelected}
              isDeleting={deleteContacts.isPending}
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
              resetSelection();
            }}
            placeholder="Search name, phone, or email..."
          />
        </CardBody>

        {deleteMessage && (
          <CardBody className="border-b border-slate-800/80 py-3">
            <p className="text-xs text-slate-400">{deleteMessage}</p>
          </CardBody>
        )}

        {contactsLoading ? (
          <CardBody className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </CardBody>
        ) : contactsError ? (
          <CardBody className="py-16 text-center text-sm text-red-300">
            Failed to load contacts. Check your connection and try again.
          </CardBody>
        ) : contacts.length === 0 ? (
          <CardBody className="py-16 text-center">
            <Contact className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">No contacts found.</p>
            <p className="mt-1 text-xs text-slate-600">
              Try another search or wait for new contacts from the child phone.
            </p>
          </CardBody>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {contacts.map((contact) => {
              const childName = childNameMap[contact.device_id] || 'Device';
              const isSelected = selectedIds.has(contact.id);

              return (
                <div
                  key={contact.id}
                  className={`flex items-start gap-3 px-4 py-4 transition-colors duration-200 sm:px-6 ${
                    isSelected ? 'bg-emerald-500/5' : 'hover:bg-slate-800/25'
                  }`}
                >
                  <SelectToggle
                    isSelected={isSelected}
                    onClick={() => toggleSelect(contact.id)}
                  />

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-500/25">
                    <Contact className="h-4 w-4 text-blue-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-100">
                        {contact.display_name || 'Unnamed contact'}
                      </p>
                      <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-400/90">
                        {childName}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="break-all">{contact.phone_number}</span>
                    </div>

                    {contact.email && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <span className="break-all">{contact.email}</span>
                      </div>
                    )}

                    <p className="mt-2 text-[11px] text-slate-600">
                      Synced {formatTimestamp(contact.synced_at)}
                      {contact.contact_updated_at
                        ? ` · Updated ${formatTimestamp(contact.contact_updated_at)}`
                        : ''}
                    </p>
                  </div>
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
            resetSelection();
          }}
          isLoading={contactsLoading}
        />
      </Card>
    </div>
  );
}
