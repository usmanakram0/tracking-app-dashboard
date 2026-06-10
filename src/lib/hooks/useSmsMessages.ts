'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  buildIlikePattern,
  buildPaginatedResult,
  getPageRange,
  type PaginatedResult,
} from '@/lib/pagination';
import { useDeleteItems } from '@/lib/hooks/useDeleteItems';
import type { SmsMessage } from '@/lib/types';

type SmsQueryOptions = {
  page?: number;
  search?: string;
};

export function useSmsMessages(
  parentId: string | undefined,
  deviceId: string | null,
  options: SmsQueryOptions = {}
) {
  const page = options.page ?? 1;
  const search = options.search ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sms-messages', parentId, deviceId, page, search],
    queryFn: async (): Promise<PaginatedResult<SmsMessage>> => {
      if (!parentId) {
        return buildPaginatedResult<SmsMessage>([], 0, page);
      }

      const supabase = createClient();
      const { from, to, safePage } = getPageRange(page);
      const pattern = buildIlikePattern(search);

      let q = supabase
        .from('sms_messages')
        .select('*', { count: 'exact' })
        .eq('parent_id', parentId)
        .order('received_at', { ascending: false })
        .range(from, to);

      if (deviceId) q = q.eq('device_id', deviceId);
      if (pattern) {
        q = q.or([`address.ilike.${pattern}`, `body.ilike.${pattern}`].join(','));
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
          queryClient.invalidateQueries({ queryKey: ['sms-messages', parentId] });
          queryClient.invalidateQueries({ queryKey: ['sms-quota', parentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, queryClient]);

  return query;
}

export function useDeleteSmsMessages(parentId: string | undefined) {
  return useDeleteItems(parentId, 'sms', ['sms-messages']);
}
