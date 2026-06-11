'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Device } from '@/lib/types';

export function useDevices(parentId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
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
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    if (!parentId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`devices-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `parent_id=eq.${parentId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['devices', parentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, queryClient]);

  return query;
}
