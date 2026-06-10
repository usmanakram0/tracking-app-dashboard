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
import type { NotificationLog } from '@/lib/types';

const WHATSAPP_PACKAGE = 'com.whatsapp';

type MessageQueryOptions = {
  page?: number;
  search?: string;
};

export function useWhatsAppMessages(
  parentId: string | undefined,
  deviceId: string | null,
  options: MessageQueryOptions = {}
) {
  const page = options.page ?? 1;
  const search = options.search ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-messages', parentId, deviceId, page, search],
    queryFn: async (): Promise<PaginatedResult<NotificationLog>> => {
      if (!parentId) {
        return buildPaginatedResult<NotificationLog>([], 0, page);
      }

      const supabase = createClient();
      const { from, to, safePage } = getPageRange(page);
      const pattern = buildIlikePattern(search);

      let q = supabase
        .from('notifications_log')
        .select('*', { count: 'exact' })
        .eq('parent_id', parentId)
        .ilike('app_package', `%${WHATSAPP_PACKAGE}%`)
        .order('posted_at', { ascending: false })
        .range(from, to);

      if (deviceId) q = q.eq('device_id', deviceId);
      if (pattern) {
        q = q.or(
          [
            `title.ilike.${pattern}`,
            `message.ilike.${pattern}`,
            `big_text.ilike.${pattern}`,
            `conversation_title.ilike.${pattern}`,
          ].join(',')
        );
      }

      const { data, error, count } = await q;
      if (error) throw error;

      return buildPaginatedResult(data ?? [], count, safePage);
    },
    enabled: !!parentId,
    refetchInterval: 60 * 1000,
    placeholderData: (prev) => prev,
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
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', parentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, queryClient]);

  return query;
}
