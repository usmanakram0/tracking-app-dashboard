'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SmsMessage } from '@/lib/types';

export function useSmsMessages(
  parentId: string | undefined,
  deviceId: string | null
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sms-messages', parentId, deviceId],
    queryFn: async (): Promise<SmsMessage[]> => {
      if (!parentId) return [];
      const supabase = createClient();
      let q = supabase
        .from('sms_messages')
        .select('*')
        .eq('parent_id', parentId)
        .order('received_at', { ascending: false })
        .limit(300);

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
      .channel(`sms-messages-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sms_messages',
          filter: `parent_id=eq.${parentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['sms-messages', parentId, deviceId],
          });
          queryClient.invalidateQueries({
            queryKey: ['sms-quota', parentId],
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

export function useDeleteSmsMessages(parentId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: SmsMessage[]) => {
      if (!parentId || items.length === 0) return;
      const supabase = createClient();
      const ids = items.map((item) => item.id);

      const { error } = await supabase
        .from('sms_messages')
        .delete()
        .in('id', ids)
        .eq('parent_id', parentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-messages', parentId] });
      queryClient.invalidateQueries({ queryKey: ['sms-quota', parentId] });
      queryClient.invalidateQueries({ queryKey: ['devices', parentId] });
    },
  });
}
