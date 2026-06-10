'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ParentSmsQuota } from '@/lib/types';

export function useSmsQuota(parentId: string | undefined) {
  return useQuery({
    queryKey: ['sms-quota', parentId],
    queryFn: async (): Promise<ParentSmsQuota | null> => {
      if (!parentId) return null;
      const supabase = createClient();

      const { data, error } = await supabase
        .from('parent_sms_quota')
        .select('*')
        .eq('parent_id', parentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!parentId,
    refetchInterval: 30000,
  });
}
