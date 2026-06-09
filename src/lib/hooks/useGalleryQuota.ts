'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ParentGalleryQuota } from '@/lib/types';

export function useGalleryQuota(parentId: string | undefined) {
  return useQuery({
    queryKey: ['gallery-quota', parentId],
    queryFn: async (): Promise<ParentGalleryQuota | null> => {
      if (!parentId) return null;
      const supabase = createClient();

      const { data, error } = await supabase
        .from('parent_gallery_quota')
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
