import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(phone: string, pin: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { role: true, store: true, brand: true },
    });

    // Validating against the seeded dummy hash (In production: bcrypt.compare)
    if (!user || user.hashedPin !== pin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Embedding multi-tenant logic and RBAC directly into the JWT token
    const payload = {
      sub: user.id,
      store_id: user.store_id,
      brand_id: user.brand_id,
      role: user.role.name,
      permissions: user.role.permissions
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        role: user.role.name,
        store_id: user.store_id
      }
    };
  }

  async getOfflineCredentials(store_id: number) {
    // D4U Core Requirement: Used by Local POS to securely cache credentials for offline handover
    const users = await this.prisma.user.findMany({
      where: { store_id },
      select: {
        id: true,
        phone: true,
        hashedPin: true, // Synced to secure local IndexedDB
        role: {
          select: { name: true, permissions: true }
        }
      }
    });
    return users;
  }
}
