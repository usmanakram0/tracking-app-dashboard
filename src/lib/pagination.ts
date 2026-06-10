export const PAGE_SIZE = 50;

export type PaginatedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function getPageRange(page: number, pageSize = PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to, safePage };
}

export function buildPaginatedResult<T>(
  items: T[],
  totalCount: number | null,
  page: number,
  pageSize = PAGE_SIZE
): PaginatedResult<T> {
  const count = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return {
    items,
    totalCount: count,
    page,
    pageSize,
    totalPages,
  };
}

export function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

export function buildIlikePattern(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return `%${escapeIlike(trimmed)}%`;
}
