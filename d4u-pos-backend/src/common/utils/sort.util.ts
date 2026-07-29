import { BadRequestException } from '@nestjs/common';

/**
 * Shared server-side sorting resolver (Sprint 28.8D) — every Menu Builder
 * list API (Categories, Products, Category Groups, Modifier Groups,
 * Availability Rules, Menu Collections) accepts the same `sort_by`/`sort_dir`
 * query shape. Validates sort_by against an allowlist per endpoint so a typo
 * or arbitrary field name 400s instead of silently sorting wrong (or Prisma
 * throwing an opaque error).
 */
export function resolveOrderBy<T extends string>(
  sortBy: string | undefined,
  sortDir: string | undefined,
  allowedFields: readonly T[],
  defaultField: T,
): Record<string, 'asc' | 'desc'> {
  const field = (sortBy as T) ?? defaultField;
  if (!allowedFields.includes(field)) {
    throw new BadRequestException(`Invalid sort_by "${sortBy}". Expected one of: ${allowedFields.join(', ')}`);
  }
  const dir = (sortDir ?? 'asc').toLowerCase();
  if (dir !== 'asc' && dir !== 'desc') {
    throw new BadRequestException(`Invalid sort_dir "${sortDir}". Expected "asc" or "desc".`);
  }
  return { [field]: dir };
}
