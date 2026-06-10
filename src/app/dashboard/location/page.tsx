'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { useDevices } from '@/lib/hooks/useDevices';
import { useLocations } from '@/lib/hooks/useLocations';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { PAGE_SIZE } from '@/lib/pagination';
import { formatTimestamp } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { MapPin, Loader2, Navigation } from 'lucide-react';

const LocationMap = dynamic(
  () => import('@/components/dashboard/LocationMap').then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/50 sm:h-[420px]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400/60" />
      </div>
    ),
  }
);

export default function LocationPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
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
  const { data: locationsResult, isLoading: locationsLoading } = useLocations(
    parentId,
    selectedDeviceId,
    { page, search: debouncedSearch }
  );

  const locations = locationsResult?.items ?? [];
  const totalCount = locationsResult?.totalCount ?? 0;
  const totalPages = locationsResult?.totalPages ?? 1;
  const currentPage = locationsResult?.page ?? 1;

  const childNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.device_id] = d.child_name || d.device_name || 'Device';
    });
    return map;
  }, [devices]);

  const listOffset = (currentPage - 1) * PAGE_SIZE;

  return (
    <div className="portal-page flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Location History"
        description="GPS trail and historical coordinates from child devices"
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

      {locationsLoading ? (
        <div className="flex h-[360px] items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/50 sm:h-[420px]">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400/60" />
        </div>
      ) : (
        <LocationMap locations={locations} />
      )}

      <Card>
        <CardHeader
          title="Location Trail"
          subtitle={`${totalCount} recorded points`}
          icon={<MapPin className="h-4 w-4 text-emerald-400" />}
        />

        <CardBody className="border-b border-slate-800/80 py-3">
          <SearchBar
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              setPage(1);
            }}
            placeholder="Search address, provider, or device..."
          />
        </CardBody>

        <div className="custom-scrollbar max-h-80 divide-y divide-slate-800/60 overflow-y-auto">
          {locations.length === 0 && !locationsLoading && (
            <CardBody className="flex flex-col items-center py-12 text-center">
              <Navigation className="mb-3 h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">No location points recorded yet</p>
            </CardBody>
          )}
          {locations.map((loc, index) => (
            <div
              key={loc.id}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 sm:px-6"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
                {totalCount - listOffset - index}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {childNameMap[loc.device_id] || 'Device'}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  {loc.accuracy ? ` · ±${loc.accuracy.toFixed(0)}m` : ''}
                  {loc.address ? ` · ${loc.address}` : ''}
                </p>
              </div>
              <p className="shrink-0 whitespace-nowrap text-[11px] text-slate-600">
                {formatTimestamp(loc.recorded_at)}
              </p>
            </div>
          ))}
        </div>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={locationsLoading}
        />
      </Card>
    </div>
  );
}
