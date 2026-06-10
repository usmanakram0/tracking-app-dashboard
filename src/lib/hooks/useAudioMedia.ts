'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CHILD_AUDIO_BUCKET } from '@/lib/storage';
import type { AudioMedia } from '@/lib/types';

export function useAudioMedia(
  parentId: string | undefined,
  deviceId: string | null
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['audio-media', parentId, deviceId],
    queryFn: async (): Promise<AudioMedia[]> => {
      if (!parentId) return [];
      const supabase = createClient();
      let q = supabase
        .from('audio_media')
        .select('*')
        .eq('parent_id', parentId)
        .order('captured_at', { ascending: false })
        .limit(200);

      if (deviceId) q = q.eq('device_id', deviceId);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!parentId,
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
          queryClient.invalidateQueries({
            queryKey: ['audio-media', parentId, deviceId],
          });
          queryClient.invalidateQueries({
            queryKey: ['audio-quota', parentId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, deviceId, queryClient]);

  return query;
}

export function useDeleteAudioMedia(parentId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: AudioMedia[]) => {
      if (!parentId || items.length === 0) return;
      const supabase = createClient();

      const storagePaths = items.map((item) => item.storage_path);
      const ids = items.map((item) => item.id);

      const { error: storageError } = await supabase.storage
        .from(CHILD_AUDIO_BUCKET)
        .remove(storagePaths);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('audio_media')
        .delete()
        .in('id', ids)
        .eq('parent_id', parentId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-media', parentId] });
      queryClient.invalidateQueries({ queryKey: ['audio-quota', parentId] });
      queryClient.invalidateQueries({ queryKey: ['devices', parentId] });
    },
  });
}
