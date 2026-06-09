'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NotificationLog } from '@/lib/types';

export function useNotifications(
  parentId: string | undefined,
  deviceId: string | null,
  appFilter: string
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', parentId, deviceId, appFilter],
    queryFn: async (): Promise<NotificationLog[]> => {
      if (!parentId) return [];
      const supabase = createClient();
      let q = supabase
        .from('notifications_log')
        .select('*')
        .eq('parent_id', parentId)
        .order('posted_at', { ascending: false })
        .limit(100);

      if (deviceId) q = q.eq('device_id', deviceId);
      if (appFilter !== 'all') q = q.ilike('app_package', `%${appFilter}%`);

      const { data, error } = await q;
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
      .channel(`notifications-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_log',
          filter: `parent_id=eq.${parentId}`,
        },
        (payload) => {
          const newRow = payload.new as NotificationLog;
          if (deviceId && newRow.device_id !== deviceId) return;
          if (appFilter !== 'all' && !newRow.app_package.includes(appFilter)) return;

          queryClient.setQueryData<NotificationLog[]>(
            ['notifications', parentId, deviceId, appFilter],
            (old) => [newRow, ...(old ?? [])].slice(0, 100)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, deviceId, appFilter, queryClient]);

  return query;
}
