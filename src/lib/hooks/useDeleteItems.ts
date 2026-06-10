'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteItemsApi } from '@/lib/api/delete-client';
import type { DeleteResource } from '@/lib/api/types';

const QUOTA_KEYS: Partial<Record<DeleteResource, string>> = {
  gallery: 'gallery-quota',
  audio: 'audio-quota',
  sms: 'sms-quota',
};

export function useDeleteItems(
  parentId: string | undefined,
  resource: DeleteResource,
  invalidateKeys: string[]
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: (string | number)[]) => {
      if (!parentId || ids.length === 0) {
        return { deleted: 0 };
      }
      return deleteItemsApi(resource, ids);
    },
    onSuccess: () => {
      if (!parentId) return;

      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key, parentId] });
      });

      const quotaKey = QUOTA_KEYS[resource];
      if (quotaKey) {
        queryClient.invalidateQueries({ queryKey: [quotaKey, parentId] });
      }

      queryClient.invalidateQueries({ queryKey: ['devices', parentId] });
    },
  });
}
