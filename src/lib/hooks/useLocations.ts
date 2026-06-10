'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  buildIlikePattern,
  buildPaginatedResult,
  getPageRange,
  type PaginatedResult,
} from '@/lib/pagination';
import { useDeleteItems } from '@/lib/hooks/useDeleteItems';
import type { LocationLog } from '@/lib/types';

type LocationQueryOptions = {
  page?: number;
  search?: string;
};

export function useLocations(
  parentId: string | undefined,
  deviceId: string | null,
  options: LocationQueryOptions = {}
) {
  const page = options.page ?? 1;
  const search = options.search ?? '';

  return useQuery({
    queryKey: ['locations', parentId, deviceId, page, search],
    queryFn: async (): Promise<PaginatedResult<LocationLog>> => {
      if (!parentId) {
        return buildPaginatedResult<LocationLog>([], 0, page);
      }

      const supabase = createClient();
      const { from, to, safePage } = getPageRange(page);
      const pattern = buildIlikePattern(search);

      let q = supabase
        .from('location_logs')
        .select('*', { count: 'exact' })
        .eq('parent_id', parentId)
        .order('recorded_at', { ascending: false })
        .range(from, to);

      if (deviceId) q = q.eq('device_id', deviceId);
      if (pattern) {
        q = q.or(
          [
            `address.ilike.${pattern}`,
            `provider.ilike.${pattern}`,
            `device_id.ilike.${pattern}`,
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
}

export function useDeleteLocations(parentId: string | undefined) {
  return useDeleteItems(parentId, 'locations', ['locations']);
}
