const fs = require('fs');
const path = require('path');

const commonPath = path.join(__dirname, 'src/common');

const files = {
  // Decorators
  'decorators/public.decorator.ts': `import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
`,

  'decorators/permissions.decorator.ts': `import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
`,

  'decorators/current-user.decorator.ts': `import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
`,

  'decorators/index.ts': `export * from './public.decorator';
export * from './permissions.decorator';
export * from './current-user.decorator';
`,

  // Guards
  'guards/jwt-auth.guard.ts': `import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      // In AuthModule we set a global secret, here we verify it.
      // We assume the secret is 'D4U_SUPER_SECRET_KEY' or loaded via process.env
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'D4U_SUPER_SECRET_KEY'
      });
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
`,

  'guards/permissions.guard.ts': `import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

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
      if (user.role === 'SuperAdmin') return true;
      
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
`,

  'guards/index.ts': `export * from './jwt-auth.guard';
export * from './permissions.guard';
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(commonPath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
