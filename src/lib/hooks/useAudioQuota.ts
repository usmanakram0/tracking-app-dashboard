'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ParentAudioQuota } from '@/lib/types';

export function useAudioQuota(parentId: string | undefined) {
  return useQuery({
    queryKey: ['audio-quota', parentId],
    queryFn: async (): Promise<ParentAudioQuota | null> => {
      if (!parentId) return null;
      const supabase = createClient();

      const { data, error } = await supabase
        .from('parent_audio_quota')
        .select('*')
        .eq('parent_id', parentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!parentId,
    refetchInterval: 30000,
  });
}
