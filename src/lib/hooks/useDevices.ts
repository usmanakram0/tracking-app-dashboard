'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Device } from '@/lib/types';

export function useDevices(parentId: string | undefined) {
  return useQuery({
    queryKey: ['devices', parentId],
    queryFn: async (): Promise<Device[]> => {
      if (!parentId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('parent_id', parentId)
        .order('child_name', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!parentId,
  });
}
