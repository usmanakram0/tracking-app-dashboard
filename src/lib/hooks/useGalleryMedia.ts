'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CHILD_GALLERY_BUCKET } from '@/lib/storage';
import {
  buildIlikePattern,
  buildPaginatedResult,
  getPageRange,
  type PaginatedResult,
} from '@/lib/pagination';
import type { GalleryMedia } from '@/lib/types';

type GalleryQueryOptions = {
  page?: number;
  search?: string;
};

export function useGalleryMedia(
  parentId: string | undefined,
  deviceId: string | null,
  options: GalleryQueryOptions = {}
) {
  const page = options.page ?? 1;
  const search = options.search ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['gallery-media', parentId, deviceId, page, search],
    queryFn: async (): Promise<PaginatedResult<GalleryMedia>> => {
      if (!parentId) {
        return buildPaginatedResult<GalleryMedia>([], 0, page);
      }

      const supabase = createClient();
      const { from, to, safePage } = getPageRange(page);
      const pattern = buildIlikePattern(search);

      let q = supabase
        .from('gallery_media')
        .select('*', { count: 'exact' })
        .eq('parent_id', parentId)
        .order('captured_at', { ascending: false })
        .range(from, to);

      if (deviceId) q = q.eq('device_id', deviceId);
      if (pattern) {
        q = q.or(
          [
            `original_filename.ilike.${pattern}`,
            `mime_type.ilike.${pattern}`,
            `media_type.ilike.${pattern}`,
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
      .channel(`gallery-media-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gallery_media',
          filter: `parent_id=eq.${parentId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['gallery-media', parentId] });
          queryClient.invalidateQueries({ queryKey: ['gallery-quota', parentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, queryClient]);

  return query;
}

export function useDeleteGalleryMedia(parentId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: GalleryMedia[]) => {
      if (!parentId || items.length === 0) return;
      const supabase = createClient();

      const storagePaths = items.map((item) => item.storage_path);
      const ids = items.map((item) => item.id);

      const { error: storageError } = await supabase.storage
        .from(CHILD_GALLERY_BUCKET)
        .remove(storagePaths);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('gallery_media')
        .delete()
        .in('id', ids)
        .eq('parent_id', parentId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-media', parentId] });
      queryClient.invalidateQueries({ queryKey: ['gallery-quota', parentId] });
      queryClient.invalidateQueries({ queryKey: ['devices', parentId] });
    },
  });
}
