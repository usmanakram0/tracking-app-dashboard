'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Contact, Loader2, Mail, Phone } from 'lucide-react';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useDevices } from '@/lib/hooks/useDevices';
import { usePhoneContacts } from '@/lib/hooks/usePhoneContacts';
import { formatTimestamp } from '@/lib/utils';

export default function ContactsPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    data: contacts = [],
    isLoading: contactsLoading,
    isError: contactsError,
  } = usePhoneContacts(parentId, selectedDeviceId);

  const childNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.device_id] = d.child_name || d.device_name || 'Device';
    });
    return map;
  }, [devices]);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contacts;

    return contacts.filter((contact) => {
      const name = contact.display_name?.toLowerCase() || '';
      const phone = contact.phone_number.toLowerCase();
      const email = contact.email?.toLowerCase() || '';
      return name.includes(query) || phone.includes(query) || email.includes(query);
    });
  }, [contacts, searchQuery]);

  return (
    <div className="portal-page flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Phone Contacts"
        description="Saved contacts from the child phone contact book. Only contacts added or updated after setup are synced."
      />

      <ChildSelector
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelect={setSelectedDeviceId}
        isLoading={devicesLoading}
      />

      <Card>
        <CardHeader
          title="Contact List"
          subtitle={`${filteredContacts.length} contacts`}
          icon={<Contact className="h-4 w-4 text-blue-400" />}
        />

        <CardBody className="border-b border-slate-800/80 py-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, or email..."
            className="portal-input w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
          />
        </CardBody>

        {contactsLoading ? (
          <CardBody className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </CardBody>
        ) : contactsError ? (
          <CardBody className="py-16 text-center text-sm text-red-300">
            Failed to load contacts. Check your connection and try again.
          </CardBody>
        ) : filteredContacts.length === 0 ? (
          <CardBody className="py-16 text-center">
            <Contact className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">No contacts synced yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              New or updated contacts from the child phone will appear here.
            </p>
          </CardBody>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredContacts.map((contact) => {
              const childName = childNameMap[contact.device_id] || 'Device';

              return (
                <div
                  key={contact.id}
                  className="flex items-start gap-3 px-4 py-4 transition-colors duration-200 hover:bg-slate-800/25 sm:px-6"
                >
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
      </Card>
    </div>
  );
}
