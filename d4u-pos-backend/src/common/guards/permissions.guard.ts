import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SystemRoles } from '../enums/roles.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // If no permissions required, access is granted (assuming authentication passed)
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User lacks the necessary permissions');
    }

    // Authorization is resolved server-side, from the database, every time --
    // never from the JWT. AuthService deliberately puts no role/permissions
    // in the token ("Authentication proves WHO. No permissions or roles in
    // the token" -- auth.service.ts buildTokenPayload), so `user.sub` alone
    // was never proof of what the caller may do; a prior version of this
    // guard treated it that way (`if (user.sub) return true`) and that was
    // the entire bypass. One query here, reused for every permission in this
    // request -- see resolveAuthContext.
    const { roleName, permissions, modulePermissions } =
      await this.resolveAuthContext(user);

    if (!roleName) {
      throw new ForbiddenException(
        'Unable to resolve an authorization role for this session',
      );
    }

    // Super Admin bypass: preserved because it's already how the seeded data
    // model defines this role -- seed-rbac.ts grants 'Super Admin' every
    // permission key that exists (`Array.from(permissionMap.keys())`), so
    // this short-circuit is equivalent to (and faster than) the same lookup
    // every other role goes through, not a separate carve-out.
    if (roleName === SystemRoles.SUPER_ADMIN || roleName === 'Super Admin') {
      return true;
    }

    // Pre-existing compatibility shim. A number of routes (pos-orders,
    // accounting) were written against permission codes like 'sales.create'
    // / 'finance.accounting.view' that predate -- and don't match -- the
    // group.resource.action permission library seed-rbac.ts actually seeds
    // (see the remediation report's Phase 7 audit for the full list of
    // mismatches). This whitelist is the existing codebase's own attempt to
    // bridge that gap for POS-operational roles.
    //
    // Task #2R-D: 'finance.accounting.create'/'finance.accounting.view'
    // removed from this list. The #2R-C series (#2R-C1..C4) migrated all
    // 113 real accounting-controller callers of those two legacy strings
    // onto granular finance.* permissions with real RolePermission grants
    // (Accountant, Finance Manager); #2R-C3-D found the access this bridge
    // gave POS-operational roles to those routes was an accidental side
    // effect of this whitelist, not an intended grant (no role
    // documentation, no frontend workflow, for any of the 7 posRoles); and
    // #2R-C4-V queried the live database and confirmed no user depends on
    // this bridge for accounting access beyond that already-resolved
    // population. 7 routes still use these two legacy strings directly (6
    // accounting-rules.controller.ts, 4 POS cash-flow.controller.ts --
    // parked #2R-C3 STOP items with no approved granular mapping yet); this
    // change does remove their POS-role bridge reachability too (same
    // accidental-access finding applies to them), leaving them reachable
    // only by Super Admin until their own #2R-C3-STOP decision is made --
    // a deliberate, accepted consequence, not an oversight. sales.*/
    // catalog.view are untouched -- still genuinely load-bearing for kots
    // print (#2P), online-orders, and the broader catalog.* legacy cluster
    // (#2R-A), unresolved.
    const posRoles = [
      'Cashier',
      'Manager',
      'Branch Manager',
      'BranchManager',
      'Business Admin',
      'Business Owner',
      'Branch Owner',
    ];
    const hasPosModule = modulePermissions && modulePermissions.pos === true;

    if (posRoles.includes(roleName) || hasPosModule) {
      const posPermissions = [
        'sales.create',
        'sales.view',
        'sales.update',
        'sales.delete',
        'catalog.view',
      ];
      if (requiredPermissions.some((p) => posPermissions.includes(p))) {
        return true;
      }
    }

    if (!permissions) {
      throw new ForbiddenException('User role has no permissions configured');
    }

    const hasPermission = () => {
      // Legacy Role.permissions is seeded as a flat JSON map (see
      // seed-rbac.ts): both the group name ('pos': true) and the full
      // 'group.resource.action' key are set to true for anything the role
      // was granted. Array form is supported too in case a caller ever
      // populates it that way.
      if (Array.isArray(permissions)) {
        return requiredPermissions.some((permission) =>
          permissions.includes(permission),
        );
      }
      if (typeof permissions === 'object') {
        return requiredPermissions.some(
          (permission) => permissions[permission] === true,
        );
      }
      return false;
    };

    if (!hasPermission()) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  // ---------------------------------------------------------------
  // Resolves the role name + permission set actually backing this request,
  // in exactly one database query. Two shapes of authenticated `user` reach
  // this guard:
  //
  // 1. Real staff/user login (AuthService): `sub` is the numeric User.id,
  //    no `role` claim at all -- role and permissions must be looked up.
  // 2. Waiter/Chef terminal sessions (TerminalService/ChefSessionService):
  //    `sub` is a synthetic string ('terminal-session-12'), there is no
  //    backing User row, but `role` ('Waiter'/'Chef') IS embedded directly
  //    in the (server-signed) token -- so the lookup is by Role name
  //    instead of by user id.
  //
  // Role scope note: this resolves the user's base `role_id` (User.role_id),
  // not a per-workspace role from `active_assignment_id`. The schema
  // supports per-assignment roles via UserAssignment.role_id, but the rest
  // of the codebase (AuthService's own login response, getOfflineCredentials,
  // etc.) already treats User.role_id as the authoritative role too -- so
  // this matches existing behavior rather than introducing a new one. If a
  // user has switched workspace to an assignment with a different role than
  // their base User.role_id, permission checks here still use the base
  // role; documented as a known limitation in the remediation report rather
  // than resolved here, per this task's scope.
  // ---------------------------------------------------------------
  private async resolveAuthContext(user: any): Promise<{
    roleName: string | null;
    permissions: any;
    modulePermissions: any;
  }> {
    const numericId = Number(user.sub);
    const isSyntheticSession =
      typeof user.role === 'string' && !Number.isFinite(numericId);

    if (isSyntheticSession) {
      const role = await this.prisma.role.findFirst({
        where: { name: user.role },
        select: { name: true, permissions: true },
      });
      // Fall back to the token's own role claim if no matching Role row
      // exists (defensive only -- 'Waiter'/'Chef' are always seeded), so an
      // unresolved lookup doesn't silently masquerade as "no role at all".
      return {
        roleName: role?.name ?? user.role,
        permissions: role?.permissions ?? null,
        modulePermissions: null,
      };
    }

    if (!Number.isFinite(numericId)) {
      return { roleName: null, permissions: null, modulePermissions: null };
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: numericId },
      select: {
        module_permissions: true,
        role: { select: { name: true, permissions: true } },
      },
    });

    return {
      roleName: dbUser?.role?.name ?? null,
      permissions: dbUser?.role?.permissions ?? null,
      modulePermissions: dbUser?.module_permissions ?? null,
    };
  }
}
