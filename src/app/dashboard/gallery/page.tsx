'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckSquare,
  Film,
  ImageIcon,
  Loader2,
  Square,
  Trash2,
} from 'lucide-react';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useDevices } from '@/lib/hooks/useDevices';
import {
  useDeleteGalleryMedia,
  useGalleryMedia,
} from '@/lib/hooks/useGalleryMedia';
import { useGalleryQuota } from '@/lib/hooks/useGalleryQuota';
import {
  CHILD_GALLERY_BUCKET,
  formatBytes,
  getPublicStorageUrl,
} from '@/lib/storage';
import { formatTimestamp } from '@/lib/utils';
import type { GalleryMedia } from '@/lib/types';

export default function GalleryPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<GalleryMedia | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

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
  const { data: media = [], isLoading: mediaLoading } = useGalleryMedia(
    parentId,
    selectedDeviceId
  );
  const { data: quota } = useGalleryQuota(parentId);
  const deleteMedia = useDeleteGalleryMedia(parentId);

  const childNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.device_id] = d.child_name || d.device_name || 'Device';
    });
    return map;
  }, [devices]);

  const storageFull = quota?.sync_paused === true;
  const usedBytes = quota?.storage_used_bytes ?? 0;
  const limitBytes = quota?.storage_limit_bytes ?? 1073741824;
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
    if (selectedIds.size === media.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(media.map((m) => m.id)));
    }
  };

  const handleDeleteSelected = async () => {
    const items = media.filter((m) => selectedIds.has(m.id));
    if (items.length === 0) return;

    setDeleteMessage(null);
    try {
      await deleteMedia.mutateAsync(items);
      setSelectedIds(new Set());
      if (previewItem && selectedIds.has(previewItem.id)) {
        setPreviewItem(null);
      }
      setDeleteMessage(`Deleted ${items.length} item(s). Sync may resume if storage was full.`);
    } catch (err) {
      setDeleteMessage(
        err instanceof Error ? err.message : 'Failed to delete selected media'
      );
    }
  };

  const previewUrl = previewItem
    ? getPublicStorageUrl(CHILD_GALLERY_BUCKET, previewItem.storage_path)
    : null;

  return (
    <div className="portal-page flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Gallery"
        description="New photos and videos synced from child devices. Only media captured after setup is uploaded."
      />

      {storageFull && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 ring-1 ring-amber-500/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-200">Supabase storage is full</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
              {quota?.pause_reason ||
                'New images and videos are not being uploaded. Delete selected items below to free space and resume sync.'}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardBody className="py-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Storage usage</span>
            <span>
              {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                usagePercent >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </CardBody>
      </Card>

      <ChildSelector
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelect={setSelectedDeviceId}
        isLoading={devicesLoading}
      />

      <Card>
        <CardHeader
          title="Synced Media"
          subtitle={`${media.length} items`}
          icon={<ImageIcon className="h-4 w-4 text-emerald-400" />}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                disabled={media.length === 0}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40"
              >
                {selectedIds.size === media.length && media.length > 0 ? (
                  <CheckSquare className="h-3.5 w-3.5" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
                Select all
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || deleteMedia.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-medium text-red-300 ring-1 ring-red-500/25 transition-all duration-200 hover:bg-red-500/25 disabled:opacity-40"
              >
                {deleteMedia.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete ({selectedIds.size})
              </button>
            </div>
          }
        />

        {deleteMessage && (
          <CardBody className="border-b border-slate-800/80 py-3">
            <p className="text-xs text-slate-400">{deleteMessage}</p>
          </CardBody>
        )}

        {mediaLoading ? (
          <CardBody className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </CardBody>
        ) : media.length === 0 ? (
          <CardBody className="py-16 text-center">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">No synced media yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              New photos and videos from the child phone will appear here automatically.
            </p>
          </CardBody>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-4 lg:p-6">
            {media.map((item) => {
              const url = getPublicStorageUrl(
                CHILD_GALLERY_BUCKET,
                item.storage_path
              );
              const isSelected = selectedIds.has(item.id);
              const childLabel = childNameMap[item.device_id] || 'Child';

              return (
                <div
                  key={item.id}
                  className={`group relative overflow-hidden rounded-xl border bg-slate-900 transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500/50 ring-2 ring-emerald-500/30'
                      : 'border-slate-800 ring-1 ring-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="absolute left-2 top-2 z-10 rounded-md bg-slate-950/80 p-1 text-slate-300 backdrop-blur-sm transition-colors duration-200 hover:text-emerald-300"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    onClick={() => setPreviewItem(item)}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-square w-full bg-slate-800">
                      {item.media_type === 'image' ? (
                        <Image
                          src={url}
                          alt={item.original_filename || 'Gallery image'}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900">
                          <Film className="h-10 w-10 text-slate-600" />
                        </div>
                      )}
                      {item.media_type === 'video' && (
                        <span className="absolute bottom-2 right-2 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                          VIDEO
                        </span>
                      )}
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="truncate text-[11px] font-medium text-slate-300">
                        {childLabel}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {formatTimestamp(item.captured_at)} · {formatBytes(item.file_size_bytes)}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {previewItem && previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {childNameMap[previewItem.device_id]} · {previewItem.media_type}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTimestamp(previewItem.captured_at)} · {formatBytes(previewItem.file_size_bytes)}
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <div className="flex max-h-[75vh] items-center justify-center bg-black p-2">
              {previewItem.media_type === 'image' ? (
                <Image
                  src={previewUrl}
                  alt={previewItem.original_filename || 'Preview'}
                  width={previewItem.width ?? 1280}
                  height={previewItem.height ?? 720}
                  className="max-h-[70vh] w-auto object-contain"
                  unoptimized
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-[70vh] w-full"
                  preload="metadata"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
