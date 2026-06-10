'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PhoneContact } from '@/lib/types';

export function usePhoneContacts(
  parentId: string | undefined,
  deviceId: string | null
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['phone-contacts', parentId, deviceId],
    queryFn: async (): Promise<PhoneContact[]> => {
      if (!parentId) return [];
      const supabase = createClient();
      let q = supabase
        .from('phone_contacts')
        .select('*')
        .eq('parent_id', parentId)
        .order('display_name', { ascending: true })
        .limit(500);

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
          queryClient.invalidateQueries({
            queryKey: ['phone-contacts', parentId, deviceId],
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
