import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SystemRoles } from '../enums/roles.enum';
import { SKIP_SUBSCRIPTION_KEY } from '../decorators/skip-subscription.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Capability discovery must be able to report a fail-closed disabled
    // snapshot when a tenant has no subscription. Authentication still runs;
    // this only skips the legacy global subscription-existence gate.
    const skipSubscription = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipSubscription) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super Admin ignores subscription checks
    if (!user || user.role === SystemRoles.SUPER_ADMIN || !user.brand_id) {
      return true;
    }

    const sub = await this.prisma.subscription.findUnique({
      where: { brand_id: user.brand_id }
    });

    if (!sub) {
      throw new ForbiddenException('NO_SUBSCRIPTION');
    }

    if (sub.status === 'SUSPENDED') {
      throw new ForbiddenException({
        message: 'SUBSCRIPTION_SUSPENDED',
        reason: sub.suspend_reason
      });
    }

    return true;
  }
}
