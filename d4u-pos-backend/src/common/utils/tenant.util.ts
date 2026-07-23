import { ForbiddenException } from '@nestjs/common';
import { SystemRoles } from '../enums/roles.enum';

export function validateTenantAccess(user: any, requestedStoreId?: number, requestedBrandId?: number) {
  if (user.role === SystemRoles.SUPER_ADMIN) {
    return true; // Super Admin can access everything
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
