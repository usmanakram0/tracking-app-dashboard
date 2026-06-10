'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckSquare,
  Loader2,
  Mic,
  Music,
  Square,
  Trash2,
} from 'lucide-react';
import { ChildSelector } from '@/components/dashboard/ChildSelector';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useDevices } from '@/lib/hooks/useDevices';
import { useAudioMedia, useDeleteAudioMedia } from '@/lib/hooks/useAudioMedia';
import { useAudioQuota } from '@/lib/hooks/useAudioQuota';
import {
  CHILD_AUDIO_BUCKET,
  formatBytes,
  getPublicStorageUrl,
} from '@/lib/storage';
import { formatDurationMs, formatTimestamp } from '@/lib/utils';
import type { AudioMedia } from '@/lib/types';

const CATEGORY_LABELS: Record<AudioMedia['audio_category'], string> = {
  music: 'Music',
  voice: 'Voice',
  recording: 'Recording',
  other: 'Audio',
};

const CATEGORY_COLORS: Record<AudioMedia['audio_category'], string> = {
  music: 'bg-purple-500/15 text-purple-300 ring-purple-500/25',
  voice: 'bg-blue-500/15 text-blue-300 ring-blue-500/25',
  recording: 'bg-amber-500/15 text-amber-300 ring-amber-500/25',
  other: 'bg-slate-500/15 text-slate-300 ring-slate-500/25',
};

function getDisplayTitle(item: AudioMedia): string {
  if (item.title) return item.title;
  if (item.original_filename) return item.original_filename;
  return 'Untitled audio';
}

export default function AudioPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);
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
  const { data: audioItems = [], isLoading: audioLoading } = useAudioMedia(
    parentId,
    selectedDeviceId
  );
  const { data: quota } = useAudioQuota(parentId);
  const deleteAudio = useDeleteAudioMedia(parentId);

  const childNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.device_id] = d.child_name || d.device_name || 'Device';
    });
    return map;
  }, [devices]);

  const storageFull = quota?.sync_paused === true;
  const usedBytes = quota?.storage_used_bytes ?? 0;
  const limitBytes = quota?.storage_limit_bytes ?? 536870912;
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
    if (selectedIds.size === audioItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(audioItems.map((item) => item.id)));
    }
  };

  const handleDeleteSelected = async () => {
    const items = audioItems.filter((item) => selectedIds.has(item.id));
    if (items.length === 0) return;

    setDeleteMessage(null);
    try {
      await deleteAudio.mutateAsync(items);
      setSelectedIds(new Set());
      if (playingId && selectedIds.has(playingId)) {
        setPlayingId(null);
      }
      setDeleteMessage(
        `Deleted ${items.length} file(s). Sync may resume if storage was full.`
      );
    } catch (err) {
      setDeleteMessage(
        err instanceof Error ? err.message : 'Failed to delete selected audio'
      );
    }
  };

  return (
    <div className="portal-page flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Audio & Voice"
        description="New music, voice notes, and recordings synced from child devices. Only files added after setup are uploaded."
      />

      {storageFull && (
        <div className="portal-alert-banner flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 ring-1 ring-amber-500/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-200">Audio storage is full</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
              {quota?.pause_reason ||
                'New audio files are not being uploaded. Delete selected items below to free space and resume sync.'}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardBody className="py-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Audio storage usage</span>
            <span>
              {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                usagePercent >= 90 ? 'bg-amber-500' : 'bg-purple-500'
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
          title="Synced Audio"
          subtitle={`${audioItems.length} files`}
          icon={<Music className="h-4 w-4 text-purple-400" />}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                disabled={audioItems.length === 0}
                className="portal-action-btn portal-action-btn-muted flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40"
              >
                {selectedIds.size === audioItems.length && audioItems.length > 0 ? (
                  <CheckSquare className="h-3.5 w-3.5" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
                Select all
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || deleteAudio.isPending}
                className="portal-action-btn portal-action-btn-danger flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-medium text-red-300 ring-1 ring-red-500/25 transition-all duration-200 hover:bg-red-500/25 disabled:opacity-40"
              >
                {deleteAudio.isPending ? (
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

        {audioLoading ? (
          <CardBody className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </CardBody>
        ) : audioItems.length === 0 ? (
          <CardBody className="py-16 text-center">
            <Music className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">No synced audio yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              New MP3, voice notes, and recordings from the child phone will appear here.
            </p>
          </CardBody>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {audioItems.map((item) => {
              const url = getPublicStorageUrl(
                CHILD_AUDIO_BUCKET,
                item.storage_path
              );
              const isSelected = selectedIds.has(item.id);
              const childLabel = childNameMap[item.device_id] || 'Child';
              const displayTitle = getDisplayTitle(item);

              return (
                <div
                  key={item.id}
                  className={`portal-stack-5 flex flex-col gap-3 px-4 py-4 transition-colors duration-200 sm:px-6 ${
                    isSelected ? 'bg-emerald-500/5' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="mt-1 shrink-0 rounded-md p-1 text-slate-400 transition-colors duration-200 hover:text-emerald-300"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 ring-1 ring-purple-500/25">
                      {item.audio_category === 'voice' || item.audio_category === 'recording' ? (
                        <Mic className="h-4 w-4 text-purple-300" />
                      ) : (
                        <Music className="h-4 w-4 text-purple-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {displayTitle}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${CATEGORY_COLORS[item.audio_category]}`}
                        >
                          {CATEGORY_LABELS[item.audio_category]}
                        </span>
                      </div>
                      {item.artist && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {item.artist}
                          {item.album ? ` · ${item.album}` : ''}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-600">
                        {childLabel} · {formatTimestamp(item.captured_at)} ·{' '}
                        {formatBytes(item.file_size_bytes)} ·{' '}
                        {formatDurationMs(item.duration_ms)}
                      </p>
                    </div>
                  </div>

                  <audio
                    controls
                    preload="metadata"
                    className="w-full"
                    src={url}
                    onPlay={() => setPlayingId(item.id)}
                    onPause={() => {
                      if (playingId === item.id) setPlayingId(null);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
