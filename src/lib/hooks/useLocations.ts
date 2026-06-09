'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { LocationLog } from '@/lib/types';

export function useLocations(parentId: string | undefined, deviceId: string | null) {
  return useQuery({
    queryKey: ['locations', parentId, deviceId],
    queryFn: async (): Promise<LocationLog[]> => {
      if (!parentId) return [];
      const supabase = createClient();
      let q = supabase
        .from('location_logs')
        .select('*')
        .eq('parent_id', parentId)
        .order('recorded_at', { ascending: false })
        .limit(200);

      if (deviceId) q = q.eq('device_id', deviceId);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!parentId,
  });
}
