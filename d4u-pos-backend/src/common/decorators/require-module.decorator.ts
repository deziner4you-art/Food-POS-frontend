import { SetMetadata } from '@nestjs/common';
import { ModuleKey } from '../entitlements/module-registry';

/**
 * Marks a route as requiring a tenant module entitlement.
 *
 * The metadata is intentionally separate from permission metadata: a role may
 * have a permission while the tenant's subscribed package does not include
 * the feature. The global ModuleEntitlementGuard enforces this boundary.
 */
export const REQUIRED_MODULE_KEY = 'required_module';
export const RequireModule = (moduleKey: ModuleKey) =>
  SetMetadata(REQUIRED_MODULE_KEY, moduleKey);
