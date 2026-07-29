import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ---------------------------------------------------------------
  // PRIVATE: Build JWT payload from user + active assignment
  // Authentication proves WHO. No permissions or roles in the token.
  // ---------------------------------------------------------------
  private async buildTokenPayload(user: any, activeAssignmentId?: number) {
    const assignments = await this.prisma.userAssignment.findMany({
      where: { user_id: user.id, status: 'ACTIVE' },
      select: { id: true, brand_id: true, store_id: true, role_id: true },
    });

    const assignmentIds = assignments.map((a) => a.id);

    // Resolve active assignment: param -> primary -> first
    let activeAssignment = assignments.find((a) => a.id === activeAssignmentId);
    if (!activeAssignment) {
      // Try to find a primary assignment (is_primary = true via direct query)
      const primaryAssignment = await this.prisma.userAssignment.findFirst({
        where: { user_id: user.id, status: 'ACTIVE', is_primary: true },
      });
      activeAssignment = primaryAssignment ?? assignments[0];
    }

    return {
      sub: user.id,
      name: user.name,
      assignment_ids: assignmentIds,
      active_assignment_id: activeAssignment?.id ?? null,
      active_brand_id: activeAssignment?.brand_id ?? user.brand_id,
      active_store_id: activeAssignment?.store_id ?? user.store_id,
      // Workspace selection required if multiple assignments and none is primary
      workspace_selection_required: assignmentIds.length > 1 && !activeAssignment?.id,
    };
  }

  // ---------------------------------------------------------------
  // PRIVATE: Issue access token + refresh token pair
  // ---------------------------------------------------------------
  private async issueTokenPair(
    payload: Record<string, any>,
    deviceId: string,
    userId: number,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const sessionId = uuidv4();
    const fullPayload = { ...payload, session_id: sessionId, device_id: deviceId };

    const access_token = await this.jwtService.signAsync(fullPayload, {
      expiresIn: '1h',
    });
    const refresh_token = await this.jwtService.signAsync(
      { sub: userId, session_id: sessionId, device_id: deviceId },
      { expiresIn: '7d' },
    );

    const tokenHash = await bcrypt.hash(refresh_token, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Upsert: one refresh token per device per user
    await this.prisma.refreshToken.upsert({
      where: {
        token_hash: tokenHash,
      },
      update: {},
      create: {
        user_id: userId,
        token_hash: tokenHash,
        device_id: deviceId,
        session_id: sessionId,
        is_revoked: false,
        expires_at: expiresAt,
      },
    });

    return { access_token, refresh_token };
  }

  // ---------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------
  async login(phone: string, pin: string, deviceId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { role: true, store: true, brand: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pin, user.hashedPin);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended or terminated.');
    }

    // Legacy workspace check (backward compatibility for non-SuperAdmin)
    if (
      user.role_id !== 3 &&
      (user.brand?.status === 'RECYCLED' || user.store?.status === 'RECYCLED')
    ) {
      throw new UnauthorizedException('Your workspace is currently inactive or recycled.');
    }

    if (user.must_change_password) {
      return {
        require_password_change: true,
        user_id: user.id,
        phone: user.phone,
        message: 'You must change your password before continuing.',
      };
    }

    const resolvedDeviceId = deviceId ?? uuidv4();
    const payload = await this.buildTokenPayload(user);
    const tokens = await this.issueTokenPair(payload, resolvedDeviceId, user.id);

    // Determine workspace_selection_required
    const assignmentCount = await this.prisma.userAssignment.count({
      where: { user_id: user.id, status: 'ACTIVE' },
    });
    const primaryExists = await this.prisma.userAssignment.count({
      where: { user_id: user.id, status: 'ACTIVE', is_primary: true },
    });

    // Sprint 28.9: the response never included the ACTIVE workspace's branch
    // name — only the raw brand_id/store_id numbers. Every consumer that
    // wants to display "which branch am I in" (Rider App included) had
    // nothing to read, so it either showed blank or fell back to a
    // hardcoded placeholder. Resolve by the same active_store_id/
    // active_brand_id the token itself carries (not user.store/user.brand,
    // which reflect the user's raw columns and can differ once a
    // multi-assignment user switches workspace).
    const [activeStore, activeBrand] = await Promise.all([
      payload.active_store_id
        ? this.prisma.store.findUnique({ where: { id: payload.active_store_id }, select: { id: true, name: true } })
        : null,
      payload.active_brand_id
        ? this.prisma.brand.findUnique({ where: { id: payload.active_brand_id }, select: { id: true, name: true } })
        : null,
    ]);

    return {
      ...tokens,
      device_id: resolvedDeviceId,
      workspace_selection_required: assignmentCount > 1 && primaryExists === 0,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        // Legacy fields preserved for backward compatibility
        role: user.role.name,
        role_id: user.role_id,
        brand_id: payload.active_brand_id,
        store_id: payload.active_store_id,
        store: activeStore,
        brand: activeBrand,
        module_permissions: user.module_permissions,
      },
    };
  }

  // ---------------------------------------------------------------
  // SELECT WORKSPACE (Runtime workspace switch without re-login)
  // ---------------------------------------------------------------
  async selectWorkspace(userId: number, assignmentId: number, deviceId: string) {
    const assignment = await this.prisma.userAssignment.findFirst({
      where: { id: assignmentId, user_id: userId, status: 'ACTIVE' },
    });

    if (!assignment) {
      throw new ForbiddenException('Assignment not found or inactive.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const payload = await this.buildTokenPayload(user, assignmentId);
    return this.issueTokenPair(payload, deviceId, userId);
  }

  // ---------------------------------------------------------------
  // REFRESH TOKEN ROTATION
  // ---------------------------------------------------------------
  async refreshTokens(refreshToken: string, deviceId: string) {
    // Decode without verify first to get sub
    let decoded: any;
    try {
      decoded = this.jwtService.decode(refreshToken);
    } catch {
      throw new ForbiddenException('Access Denied');
    }

    if (!decoded?.sub) throw new ForbiddenException('Access Denied');

    // Find all non-revoked tokens for this user+device
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { user_id: decoded.sub, device_id: deviceId, is_revoked: false },
      orderBy: { createdAt: 'desc' },
    });

    // Attempt to match against stored hashes
    let matchedToken: (typeof storedTokens)[0] | null = null;
    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, stored.token_hash);
      if (isMatch) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      // Check if this token was already revoked — possible token theft
      const revokedTokens = await this.prisma.refreshToken.findMany({
        where: { user_id: decoded.sub, is_revoked: true },
      });
      let wasRevoked = false;
      for (const stored of revokedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, stored.token_hash);
        if (isMatch) {
          wasRevoked = true;
          break;
        }
      }

      if (wasRevoked) {
        // Token theft detected — revoke ALL sessions for this user
        await this.prisma.refreshToken.updateMany({
          where: { user_id: decoded.sub },
          data: { is_revoked: true },
        });
        throw new ForbiddenException(
          'Security Alert: Refresh token reuse detected. All sessions revoked.',
        );
      }

      throw new ForbiddenException('Access Denied');
    }

    if (new Date() > matchedToken.expires_at) {
      await this.prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { is_revoked: true },
      });
      throw new ForbiddenException('Refresh token expired. Please log in again.');
    }

    // Rotate: revoke the used token
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { is_revoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { role: true, store: true, brand: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is inactive.');
    }

    const payload = await this.buildTokenPayload(user);
    return this.issueTokenPair(payload, deviceId, user.id);
  }

  // ---------------------------------------------------------------
  // LOGOUT (Revoke tokens for this device)
  // ---------------------------------------------------------------
  async logout(userId: number, deviceId?: string) {
    const where: any = { user_id: userId };
    if (deviceId) where.device_id = deviceId;

    await this.prisma.refreshToken.updateMany({
      where,
      data: { is_revoked: true },
    });

    return { success: true };
  }

  // ---------------------------------------------------------------
  // REVOKE ALL SESSIONS (Admin forced logout)
  // ---------------------------------------------------------------
  async revokeAllSessions(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data: { is_revoked: true },
    });
    return { success: true };
  }

  // ---------------------------------------------------------------
  // OFFLINE CREDENTIALS (Local POS PIN Sync)
  // No auth changes — endpoint remains for POS backward compatibility
  // ---------------------------------------------------------------
  async getOfflineCredentials(store_id: number) {
    const users = await this.prisma.user.findMany({
      where: { store_id },
      select: {
        id: true,
        phone: true,
        hashedPin: true,
        role: {
          select: { name: true, permissions: true },
        },
      },
    });
    return users;
  }
}
