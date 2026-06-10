'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDeleteItems } from '@/lib/hooks/useDeleteItems';
import {
  buildIlikePattern,
  buildPaginatedResult,
  getPageRange,
  PAGE_SIZE,
  type PaginatedResult,
} from '@/lib/pagination';
import type { NotificationLog } from '@/lib/types';

type NotificationQueryOptions = {
  page?: number;
  search?: string;
};

export function useNotifications(
  parentId: string | undefined,
  deviceId: string | null,
  appFilter: string,
  options: NotificationQueryOptions = {}
) {
  const page = options.page ?? 1;
  const search = options.search ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', parentId, deviceId, appFilter, page, search],
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
        .order('posted_at', { ascending: false })
        .range(from, to);

      if (deviceId) q = q.eq('device_id', deviceId);
      if (appFilter !== 'all') q = q.ilike('app_package', `%${appFilter}%`);
      if (pattern) {
        q = q.or(
          [
            `title.ilike.${pattern}`,
            `message.ilike.${pattern}`,
            `big_text.ilike.${pattern}`,
            `conversation_title.ilike.${pattern}`,
            `app_name.ilike.${pattern}`,
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
      .channel(`notifications-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_log',
          filter: `parent_id=eq.${parentId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', parentId] });
          queryClient.invalidateQueries({ queryKey: ['notifications-count', parentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, queryClient]);

  return query;
}

export function useNotificationsCount(
  parentId: string | undefined,
  deviceId: string | null,
  appFilter: string
) {
  return useQuery({
    queryKey: ['notifications-count', parentId, deviceId, appFilter],
    queryFn: async (): Promise<number> => {
      if (!parentId) return 0;
      const supabase = createClient();

      let q = supabase
        .from('notifications_log')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', parentId);

      if (deviceId) q = q.eq('device_id', deviceId);
      if (appFilter !== 'all') q = q.ilike('app_package', `%${appFilter}%`);

      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!parentId,
    refetchInterval: 60 * 1000,
  });
}

export function useDeleteNotifications(parentId: string | undefined) {
  return useDeleteItems(parentId, 'notifications', [
    'notifications',
    'notifications-count',
    'whatsapp-messages',
  ]);
}

export { PAGE_SIZE };
