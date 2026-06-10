import type { DeleteItemsResponse, DeleteResource } from '@/lib/api/types';

export async function deleteItemsApi(
  resource: DeleteResource,
  ids: (string | number)[]
): Promise<DeleteItemsResponse> {
  const response = await fetch(`/api/delete/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.error === 'string' ? payload.error : 'Failed to delete items';
    throw new Error(message);
  }

  return payload as DeleteItemsResponse;
}
