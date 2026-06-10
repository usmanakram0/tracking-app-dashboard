'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NotificationLog } from '@/lib/types';

const WHATSAPP_PACKAGE = 'com.whatsapp';

export function useWhatsAppMessages(
  parentId: string | undefined,
  deviceId: string | null
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-messages', parentId, deviceId],
    queryFn: async (): Promise<NotificationLog[]> => {
      if (!parentId) return [];
      const supabase = createClient();
      let q = supabase
        .from('notifications_log')
        .select('*')
        .eq('parent_id', parentId)
        .ilike('app_package', `%${WHATSAPP_PACKAGE}%`)
        .order('posted_at', { ascending: false })
        .limit(300);

      if (deviceId) q = q.eq('device_id', deviceId);

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
      .channel(`whatsapp-messages-${parentId}`)
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
          if (!newRow.app_package.includes('whatsapp')) return;
          if (deviceId && newRow.device_id !== deviceId) return;

          queryClient.setQueryData<NotificationLog[]>(
            ['whatsapp-messages', parentId, deviceId],
            (old) => [newRow, ...(old ?? [])].slice(0, 300)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, deviceId, queryClient]);

  return query;
}
