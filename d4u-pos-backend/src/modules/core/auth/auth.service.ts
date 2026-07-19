import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      store_id: user.store_id,
      brand_id: user.brand_id,
      role: user.role.name,
      permissions: user.role.permissions,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    return { access_token, refresh_token };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async login(phone: string, pin: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { role: true, store: true, brand: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Lazy Migration for Plaintext Passwords
    let isMatch = false;
    // Check if it's already a bcrypt hash (bcrypt hashes usually start with $2a$, $2b$ etc.)
    if (user.hashedPin.startsWith('$2')) {
      isMatch = await bcrypt.compare(pin, user.hashedPin);
    } else {
      // It's a plaintext PIN
      if (user.hashedPin === pin) {
        isMatch = true;
        // Lazy migrate to bcrypt
        const hashedPin = await bcrypt.hash(pin, 10);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { hashedPin },
        });
      }
    }

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        role: user.role.name,
        role_id: user.role_id,
        store_id: user.store_id,
        store: { name: user.store?.name },
        module_permissions: user.module_permissions,
      },
    };
  }

  async logout(userId: number) {
    await this.prisma.user.updateMany({
      where: { id: userId, refreshTokenHash: { not: null } },
      data: { refreshTokenHash: null },
    });
    return { success: true };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, store: true, brand: true },
    });

    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async getOfflineCredentials(store_id: number) {
    // D4U Core Requirement: Used by Local POS to securely cache credentials for offline handover
    const users = await this.prisma.user.findMany({
      where: { store_id },
      select: {
        id: true,
        phone: true,
        hashedPin: true, // Synced to secure local IndexedDB (Will now sync bcrypt hashes after migration)
        role: {
          select: { name: true, permissions: true },
        },
      },
    });
    return users;
  }
}
