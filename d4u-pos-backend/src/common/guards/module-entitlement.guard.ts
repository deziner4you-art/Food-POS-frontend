import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRED_MODULE_KEY } from '../decorators/require-module.decorator';
import { ModuleKey } from '../entitlements/module-registry';
import { EntitlementService } from '../../modules/core/subscription/entitlement.service';

function positiveInteger(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/**
 * Enforces package/module entitlements after authentication and permissions.
 *
 * Store identity is taken from the authenticated workspace unless a route
 * explicitly carries a store_id. EntitlementService remains the authority for
 * tenant ownership, subscription status, package status and dependencies.
 */
@Injectable()
export class ModuleEntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredModule = this.reflector.getAllAndOverride<ModuleKey>(
      REQUIRED_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredModule) return true;

    const request = context.switchToHttp().getRequest<any>();
    const user = request.user;
    if (!user && !isPublic) {
      throw new ForbiddenException('Authentication is required for this module.');
    }

    const requestedStoreId =
      request.query?.store_id ??
      request.params?.store_id ??
      request.body?.store_id ??
      user?.active_store_id;
    let storeId = positiveInteger(requestedStoreId);
    if (!storeId) {
      const requestedBrandId = positiveInteger(
        request.params?.brand_id ??
        request.query?.brand_id ??
        user?.active_brand_id ??
        user?.brand_id
      );
      if (requestedBrandId && typeof this.entitlements.findFirstStoreIdForBrand === 'function') {
        storeId = await this.entitlements.findFirstStoreIdForBrand(requestedBrandId);
      }
    }
    if (!storeId) {
      throw new ForbiddenException({
        message: 'MODULE_NOT_INCLUDED',
        module: requiredModule,
        reason: 'ACTIVE_STORE_REQUIRED',
      });
    }

    const snapshot = user && !isPublic
      ? await this.entitlements.resolveForAuthenticatedUser(user, storeId)
      : await this.entitlements.resolveForStore(storeId);
    const enabled = this.entitlements.isCapabilityEnabled(snapshot, requiredModule);
    if (!enabled) {
      throw new ForbiddenException({
        message: 'MODULE_NOT_INCLUDED',
        module: requiredModule,
        reason: snapshot.entitlement.reason ?? 'MODULE_DISABLED',
      });
    }

    return true;
  }

}
