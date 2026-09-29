import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SystemRoles } from '../enums/roles.enum';

export function validateTenantAccess(user: any, requestedStoreId?: number, requestedBrandId?: number) {
  if (!user) return true;
  if (!user.role || user.role === SystemRoles.SUPER_ADMIN || user.role === 'Super Admin' || user.sub) {
    return true; // Super Admin or authenticated session has multi-workspace access
  }

  if (user.role === SystemRoles.HEAD_OFFICE) {
    if (requestedBrandId && user.brand_id !== requestedBrandId) {
      throw new ForbiddenException('You do not have access to this brand');
    }
    return true; // Head Office can access all stores within their brand
  }

  // Branch Manager, Cashier, Rider, etc.
  if (requestedStoreId && user.store_id !== requestedStoreId) {
    throw new ForbiddenException('You do not have access to this store');
  }

  if (requestedBrandId && user.brand_id !== requestedBrandId) {
    throw new ForbiddenException('You do not have access to this brand');
  }

  return true;
}

/** Authorize a requested store against the authenticated workspace. */
export async function assertTenantStoreAccess(
  prisma: PrismaService,
  user: any,
  requestedStoreId?: number,
): Promise<void> {
  if (!user) throw new ForbiddenException('Authenticated user context is required.');

  const storeId = Number(requestedStoreId);
  if (!Number.isInteger(storeId) || storeId <= 0) {
    throw new ForbiddenException('A valid store is required.');
  }

  const userId = Number(user.sub);
  const isNumericUser = Number.isInteger(userId) && userId > 0;
  if (!isNumericUser && typeof user.role !== 'string') {
    throw new ForbiddenException('Unable to resolve the authenticated user.');
  }

  const [store, dbUser] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId }, select: { id: true, brand_id: true } }),
    isNumericUser
      ? prisma.user.findUnique({ where: { id: userId }, select: { role: { select: { name: true } } } })
      : Promise.resolve(null),
  ]);

  const roleName = dbUser?.role?.name ?? (isNumericUser ? null : user.role);
  if (!store?.brand_id || !roleName) {
    throw new ForbiddenException('The requested tenant is not available.');
  }

  if (roleName === SystemRoles.SUPER_ADMIN || roleName === 'Super Admin') return;

  const activeBrandId = Number(user.active_brand_id);
  if (!Number.isInteger(activeBrandId) || activeBrandId <= 0 || store.brand_id !== activeBrandId) {
    throw new ForbiddenException('You do not have access to this brand.');
  }

  if (roleName === SystemRoles.HEAD_OFFICE || roleName === 'Head Office') return;

  const activeStoreId = Number(user.active_store_id);
  if (!Number.isInteger(activeStoreId) || activeStoreId <= 0 || store.id !== activeStoreId) {
    throw new ForbiddenException('You do not have access to this store.');
  }
}

/** Authorize a brand-scoped report against the authenticated workspace. */
export async function assertTenantBrandAccess(
  prisma: PrismaService,
  user: any,
  requestedBrandId?: number,
): Promise<void> {
  if (!user) throw new ForbiddenException('Authenticated user context is required.');
  const brandId = Number(requestedBrandId);
  if (!Number.isInteger(brandId) || brandId <= 0) {
    throw new ForbiddenException('A valid brand is required.');
  }

  const userId = Number(user.sub);
  const isNumericUser = Number.isInteger(userId) && userId > 0;
  if (!isNumericUser && typeof user.role !== 'string') {
    throw new ForbiddenException('Unable to resolve the authenticated user.');
  }

  const [brand, dbUser] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } }),
    isNumericUser
      ? prisma.user.findUnique({ where: { id: userId }, select: { role: { select: { name: true } } } })
      : Promise.resolve(null),
  ]);
  const roleName = dbUser?.role?.name ?? (isNumericUser ? null : user.role);
  if (!brand || !roleName) throw new ForbiddenException('The requested tenant is not available.');
  if (roleName === SystemRoles.SUPER_ADMIN || roleName === 'Super Admin') return;

  const activeBrandId = Number(user.active_brand_id);
  if (!Number.isInteger(activeBrandId) || activeBrandId <= 0 || activeBrandId !== brand.id) {
    throw new ForbiddenException('You do not have access to this brand.');
  }
}

// Task #2R-G1a: strict active-workspace/store authorization, introduced for
// pos-orders/tables specifically because #2R-G1-D found the real JWT payload
// (AuthService.buildTokenPayload) never carries `role` or bare `store_id` --
// only `active_store_id`/`active_brand_id` -- and validateTenantAccess above
// reads the wrong fields (plus has an unconditional `user.sub` bypass), making
// it a no-op for every real staff session. This helper deliberately does NOT
// invent a Super Admin carve-out or any role-based branch: #2R-G1-D's fresh
// frontend trace found d4u-pos-client always sends the session's own
// active_store_id for every pos-orders/tables call, with zero evidence of a
// legitimate cross-store workflow for Cashier/Manager/Branch Manager -- so
// the correct rule here is a plain equality check, nothing more. Does not
// replace validateTenantAccess itself, which other controllers still use and
// whose own replacement design remains undecided (#2R-G1-D, STOP items).
export function assertOwnStore(user: any, requestedStoreId?: number): void {
  if (!user) {
    throw new ForbiddenException('Authenticated user context is required.');
  }

  const activeStoreId = Number(user.active_store_id);
  if (!Number.isFinite(activeStoreId) || activeStoreId <= 0) {
    throw new ForbiddenException('Unable to resolve an active store for this session.');
  }

  const requested = Number(requestedStoreId);
  if (!Number.isFinite(requested) || requested <= 0) {
    throw new ForbiddenException('A valid store is required.');
  }

  if (requested !== activeStoreId) {
    throw new ForbiddenException('You do not have access to this store');
  }
}
