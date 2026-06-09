'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { useDevices } from '@/lib/hooks/useDevices';
import { useLocations } from '@/lib/hooks/useLocations';
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
  const { data: locations = [], isLoading: locationsLoading } = useLocations(
    parentId,
    selectedDeviceId
  );

  const childNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.device_id] = d.child_name || d.device_name || 'Device';
    });
    return map;
  }, [devices]);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Location History"
        description="GPS trail and historical coordinates from child devices"
      />

      <ChildSelector
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelect={setSelectedDeviceId}
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
          subtitle={`${locations.length} recorded points`}
          icon={<MapPin className="h-4 w-4 text-emerald-400" />}
        />
        <div className="custom-scrollbar max-h-80 divide-y divide-slate-800/60 overflow-y-auto">
          {locations.length === 0 && (
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
                {locations.length - index}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {childNameMap[loc.device_id] || 'Device'}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  {loc.accuracy ? ` · ±${loc.accuracy.toFixed(0)}m` : ''}
                </p>
              </div>
              <p className="shrink-0 whitespace-nowrap text-[11px] text-slate-600">
                {formatTimestamp(loc.recorded_at)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
