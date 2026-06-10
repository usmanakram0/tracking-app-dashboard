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
import type { PhoneContact } from '@/lib/types';

type ContactQueryOptions = {
  page?: number;
  search?: string;
};

export function usePhoneContacts(
  parentId: string | undefined,
  deviceId: string | null,
  options: ContactQueryOptions = {}
) {
  const page = options.page ?? 1;
  const search = options.search ?? '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['phone-contacts', parentId, deviceId, page, search],
    queryFn: async (): Promise<PaginatedResult<PhoneContact>> => {
      if (!parentId) {
        return buildPaginatedResult<PhoneContact>([], 0, page);
      }

      const supabase = createClient();
      const { from, to, safePage } = getPageRange(page);
      const pattern = buildIlikePattern(search);

      let q = supabase
        .from('phone_contacts')
        .select('*', { count: 'exact' })
        .eq('parent_id', parentId)
        .order('display_name', { ascending: true })
        .range(from, to);

      if (deviceId) q = q.eq('device_id', deviceId);
      if (pattern) {
        q = q.or(
          [
            `display_name.ilike.${pattern}`,
            `phone_number.ilike.${pattern}`,
            `email.ilike.${pattern}`,
          ].join(',')
        );
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
      .channel(`phone-contacts-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phone_contacts',
          filter: `parent_id=eq.${parentId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['phone-contacts', parentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, queryClient]);

  return query;
}
