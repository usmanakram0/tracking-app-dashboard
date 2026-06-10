'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  buildIlikePattern,
  buildPaginatedResult,
  getPageRange,
  type PaginatedResult,
} from '@/lib/pagination';
import { useDeleteItems } from '@/lib/hooks/useDeleteItems';
import type { AudioMedia } from '@/lib/types';

type AudioQueryOptions = {
  page?: number;
  search?: string;
};

export function useAudioMedia(
  parentId: string | undefined,
  deviceId: string | null,
  options: AudioQueryOptions = {}
) {
  const page = options.page ?? 1;
  const search = options.search ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['audio-media', parentId, deviceId, page, search],
    queryFn: async (): Promise<PaginatedResult<AudioMedia>> => {
      if (!parentId) {
        return buildPaginatedResult<AudioMedia>([], 0, page);
      }

      const supabase = createClient();
      const { from, to, safePage } = getPageRange(page);
      const pattern = buildIlikePattern(search);

      let q = supabase
        .from('audio_media')
        .select('*', { count: 'exact' })
        .eq('parent_id', parentId)
        .order('captured_at', { ascending: false })
        .range(from, to);

      if (deviceId) q = q.eq('device_id', deviceId);
      if (pattern) {
        q = q.or(
          [
            `title.ilike.${pattern}`,
            `artist.ilike.${pattern}`,
            `album.ilike.${pattern}`,
            `original_filename.ilike.${pattern}`,
            `audio_category.ilike.${pattern}`,
          ].join(',')
        );
      }

      const { data, error, count } = await q;
      if (error) throw error;

      return buildPaginatedResult(data ?? [], count, safePage);
    },
    enabled: !!parentId,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!parentId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`audio-media-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audio_media',
          filter: `parent_id=eq.${parentId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['audio-media', parentId] });
          queryClient.invalidateQueries({ queryKey: ['audio-quota', parentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, queryClient]);

  return query;
}

export function useDeleteAudioMedia(parentId: string | undefined) {
  return useDeleteItems(parentId, 'audio', ['audio-media']);
}
