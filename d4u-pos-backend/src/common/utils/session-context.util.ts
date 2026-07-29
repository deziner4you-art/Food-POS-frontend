import { BadRequestException } from '@nestjs/common';

/**
 * JWT payload (see AuthService.buildTokenPayload) carries `active_store_id`
 * and `sub`, NOT `store_id`/`id` — several accounting controllers were
 * reading the wrong property names (`req.user?.store_id`, `req.user?.id`),
 * which are always undefined, silently tripping a hardcoded `|| 1` fallback
 * on every request regardless of the caller's real tenant (Sprint 28.9).
 * These helpers read the correct claims and fail loudly instead of
 * defaulting to a hardcoded branch when the session is missing context.
 */
export function getSessionStoreId(user: any): number {
  const storeId = user?.active_store_id;
  if (!storeId) {
    throw new BadRequestException('No active store in session — select a workspace/branch and try again.');
  }
  return storeId;
}

export function getSessionUserId(user: any): number {
  const userId = user?.sub;
  if (!userId) {
    throw new BadRequestException('No authenticated user in session.');
  }
  return userId;
}
