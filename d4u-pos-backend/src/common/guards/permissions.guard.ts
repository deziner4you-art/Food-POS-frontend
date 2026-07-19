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
      if (user.role === SystemRoles.SUPER_ADMIN) return true;
      
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
