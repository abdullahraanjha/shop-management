import type { Request } from 'express';
import type { PaginationMeta } from './ApiResponse.js';

export interface QueryOptions {
  page: number;
  limit: number;
  skip: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Parse common list query params (?page, ?limit, ?search, ?sortBy, ?sortOrder)
 * once, so every list endpoint handles pagination/sorting/search identically.
 */
export function getQueryOptions(req: Request, defaultSortBy = 'createdAt'): QueryOptions {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10));
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search: String(req.query.search ?? '').trim(),
    sortBy: String(req.query.sortBy ?? defaultSortBy),
    sortOrder,
  };
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
