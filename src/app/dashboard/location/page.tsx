'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { useDevices } from '@/lib/hooks/useDevices';
import { useDeleteLocations, useLocations } from '@/lib/hooks/useLocations';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { BulkDeleteToolbar } from '@/components/ui/BulkDeleteToolbar';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SelectToggle } from '@/components/ui/SelectToggle';
import { useDeleteConfirmation } from '@/lib/hooks/useDeleteConfirmation';
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
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
  const { data: locationsResult, isLoading: locationsLoading } = useLocations(
    parentId,
    selectedDeviceId,
    { page, search: debouncedSearch }
  );
  const deleteLocations = useDeleteLocations(parentId);
  const deleteConfirm = useDeleteConfirmation();

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

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === locations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(locations.map((loc) => loc.id)));
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
      const result = await deleteLocations.mutateAsync(ids);
      setSelectedIds(new Set());
      setDeleteMessage(`Deleted ${result.deleted} location point(s).`);
      deleteConfirm.close();
    } catch (err) {
      setDeleteMessage(
        err instanceof Error ? err.message : 'Failed to delete selected locations'
      );
      deleteConfirm.close();
    }
  };

  const resetSelection = () => setSelectedIds(new Set());

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
          resetSelection();
        }}
        isLoading={devicesLoading}
      />

      {locationsLoading ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/50 sm:h-[360px] lg:h-[420px]">
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
          action={
            <BulkDeleteToolbar
              pageItemCount={locations.length}
              selectedCount={selectedIds.size}
              onToggleSelectAll={toggleSelectAll}
              onDelete={handleDeleteRequest}
              isDeleting={deleteLocations.isPending}
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
            placeholder="Search address, provider, or device..."
          />
        </CardBody>

        {deleteMessage && (
          <CardBody className="border-b border-slate-800/80 py-3">
            <p className="text-xs text-slate-400">{deleteMessage}</p>
          </CardBody>
        )}

        <div className="custom-scrollbar max-h-80 divide-y divide-slate-800/60 overflow-y-auto">
          {locations.length === 0 && !locationsLoading && (
            <CardBody className="flex flex-col items-center py-12 text-center">
              <Navigation className="mb-3 h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">No location points recorded yet</p>
            </CardBody>
          )}
          {locations.map((loc, index) => {
            const isSelected = selectedIds.has(loc.id);

            return (
              <div
                key={loc.id}
                className={`portal-list-row flex items-start gap-2.5 px-4 py-3.5 transition-colors duration-200 sm:items-center sm:gap-3 sm:px-6 ${
                  isSelected ? 'bg-emerald-500/5' : 'hover:bg-slate-800/25'
                }`}
              >
                <SelectToggle
                  isSelected={isSelected}
                  onClick={() => toggleSelect(loc.id)}
                />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
                  {totalCount - listOffset - index}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200">
                    {childNameMap[loc.device_id] || 'Device'}
                  </p>
                  <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-500">
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    {loc.accuracy ? ` · ±${loc.accuracy.toFixed(0)}m` : ''}
                    {loc.address ? ` · ${loc.address}` : ''}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600 sm:hidden">
                    {formatTimestamp(loc.recorded_at)}
                  </p>
                </div>
                <p className="hidden shrink-0 whitespace-nowrap text-[11px] text-slate-600 sm:block">
                  {formatTimestamp(loc.recorded_at)}
                </p>
              </div>
            );
          })}
        </div>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            resetSelection();
          }}
          isLoading={locationsLoading}
        />
      </Card>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete location points?"
        description={`Delete ${selectedIds.size} GPS point(s) from the trail? This cannot be undone.`}
        confirmLabel="Delete locations"
        isLoading={deleteLocations.isPending}
        onClose={deleteConfirm.close}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
