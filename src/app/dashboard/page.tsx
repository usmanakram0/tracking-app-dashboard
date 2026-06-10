'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { DeviceManagementCard } from '@/components/dashboard/DeviceManagementCard';
import { NotificationFeed } from '@/components/dashboard/NotificationFeed';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { useDevices } from '@/lib/hooks/useDevices';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useNotifications, useNotificationsCount } from '@/lib/hooks/useNotifications';
import { PAGE_SIZE } from '@/lib/pagination';

export default function DashboardPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [appFilter, setAppFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [highlightGps, setHighlightGps] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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
    data: notificationResult,
    isLoading: notificationsLoading,
    isError: notificationsError,
  } = useNotifications(parentId, selectedDeviceId, appFilter, {
    page,
    search: debouncedSearch,
  });
  const { data: notificationTotal = 0 } = useNotificationsCount(
    parentId,
    selectedDeviceId,
    appFilter
  );

  const notifications = notificationResult?.items ?? [];
  const notificationPage = notificationResult?.page ?? 1;
  const notificationTotalPages = notificationResult?.totalPages ?? 1;
  const notificationResultCount = notificationResult?.totalCount ?? 0;

  const activeDeviceId = selectedDeviceId ?? devices[0]?.device_id ?? null;

  const selectedDevice = useMemo(
    () => devices.find((d) => d.device_id === activeDeviceId) ?? null,
    [devices, activeDeviceId]
  );

  const childNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.device_id] = d.child_name || d.device_name || 'Device';
    });
    return map;
  }, [devices]);

  return (
    <div className="portal-page flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Dashboard"
        description="Monitor notifications and device status in real time"
      />

      <StatsRow devices={devices} notificationCount={notificationTotal} />

      <ChildSelector
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelect={(id) => {
          setSelectedDeviceId(id);
          setPage(1);
        }}
        isLoading={devicesLoading}
      />

      <div className="portal-split-grid grid items-start gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="portal-split-side lg:col-span-4 lg:sticky lg:top-6">
          <DeviceManagementCard
            device={selectedDevice}
            parentId={parentId}
            onGpsSuccess={(lat, lng) => setHighlightGps({ lat, lng })}
          />
          {highlightGps && (
            <div className="mt-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300 ring-1 ring-emerald-500/20">
              <span className="font-medium">Latest GPS:</span>{' '}
              {highlightGps.lat.toFixed(5)}, {highlightGps.lng.toFixed(5)}
              <Link
                href="/dashboard/location"
                className="ml-2 font-medium underline underline-offset-2 hover:text-emerald-200"
              >
                View on map
              </Link>
            </div>
          )}
        </div>

        <div className="portal-split-main lg:col-span-8">
          <NotificationFeed
            notifications={notifications}
            totalCount={notificationResultCount}
            page={notificationPage}
            totalPages={notificationTotalPages}
            pageSize={PAGE_SIZE}
            search={searchInput}
            onSearchChange={(value) => {
              setSearchInput(value);
              setPage(1);
            }}
            onPageChange={setPage}
            isLoading={notificationsLoading}
            isError={notificationsError}
            appFilter={appFilter}
            onAppFilterChange={(filter) => {
              setAppFilter(filter);
              setPage(1);
            }}
            childNameMap={childNameMap}
          />
        </div>
      </div>
    </div>
  );
}
