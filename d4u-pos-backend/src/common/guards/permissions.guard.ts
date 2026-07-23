import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { SystemRoles } from '../enums/roles.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
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

    if (!user || !user.permissions) {
      throw new ForbiddenException('User lacks the necessary permissions');
    }

    const hasPermission = () => {
      // SuperAdmin has access to everything
      if (user.role === SystemRoles.SUPER_ADMIN || user.role === 'Super Admin') return true;
      
      // POS operational roles get intrinsic access to POS-related endpoints
      const posRoles = ['Cashier', 'Manager', 'Branch Manager', 'BranchManager', 'Business Admin', 'Business Owner', 'Branch Owner'];
      const hasPosModule = user.module_permissions && user.module_permissions.pos === true;
      
      if (posRoles.includes(user.role) || hasPosModule) {
        const posPermissions = [
           'sales.create', 'sales.view', 'sales.update', 'sales.delete',
           'finance.accounting.create', 'finance.accounting.view',
           'catalog.view'
        ];
        if (requiredPermissions.some(p => posPermissions.includes(p))) {
          return true;
        }
      }

      const userPermissions = user.permissions;
      
      // If user permissions is an array of strings
      if (Array.isArray(userPermissions)) {
        return requiredPermissions.some((permission) => userPermissions.includes(permission));
      }
      
      // If it's a JSON object where keys are permissions and values are boolean
      if (typeof userPermissions === 'object') {
        return requiredPermissions.some((permission) => userPermissions[permission] === true);
      }

      return false;
    };

    if (!hasPermission()) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
