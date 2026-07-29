import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { writeKitchenAudit } from '../../../common/utils/kitchen-audit.util';

/**
 * Chef Authentication — mirrors TerminalService's PIN-pairing pattern
 * exactly (generate -> login -> resume -> heartbeat -> disconnect), scoped
 * to kitchen staff instead of waiters. A ChefSession is not a full User
 * login: no phone/full-JWT-refresh-pair, just a lightweight, longer-lived
 * scoped access token (mintChefToken) — same tradeoff TerminalService makes
 * and for the same reason: there's no User row backing a chef's PIN.
 */
@Injectable()
export class ChefSessionService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private gateway: AppGateway,
  ) {}

  private mintChefToken(session: { id: number; store_id: number; kitchen_station_id: number | null }): string {
    return this.jwtService.sign(
      {
        sub: `chef-session-${session.id}`,
        role: 'Chef',
        store_id: session.store_id,
        active_store_id: session.store_id,
        chef_session_id: session.id,
        kitchen_station_id: session.kitchen_station_id,
      },
      { expiresIn: '12h' },
    );
  }

  async generatePin(store_id: number, chef_name: string, kitchen_station_id?: number) {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const session = await this.prisma.chefSession.create({
      data: { store_id, chef_name, pin, kitchen_station_id: kitchen_station_id ?? null, is_active: true },
    });
    await writeKitchenAudit(this.prisma, {
      action: 'CHEF_SESSION_GENERATED',
      entity: 'ChefSession',
      entity_id: session.id,
      details: { store_id, chef_name, kitchen_station_id },
    });
    return { success: true, pin, session_id: session.id };
  }

  async loginByPin(pin: string, device_id?: string, device_name?: string) {
    const session = await this.prisma.chefSession.findUnique({ where: { pin } });
    if (!session || !session.is_active) {
      return { success: false, message: 'Invalid or expired PIN' };
    }

    const updated = await this.prisma.chefSession.update({
      where: { id: session.id },
      data: {
        device_id: device_id ?? session.device_id,
        device_name: device_name ?? session.device_name,
        connected_at: session.connected_at ?? new Date(),
        last_activity_at: new Date(),
      },
    });

    await writeKitchenAudit(this.prisma, {
      action: 'CHEF_SESSION_STARTED',
      entity: 'ChefSession',
      entity_id: updated.id,
      details: { device_id, device_name },
    });
    this.gateway.broadcast('chef_sessions_updated', { store_id: updated.store_id }, `store_${updated.store_id}`);

    return {
      success: true,
      session_id: updated.id,
      store_id: updated.store_id,
      chef_name: updated.chef_name,
      device_name: updated.device_name,
      kitchen_station_id: updated.kitchen_station_id,
      access_token: this.mintChefToken(updated),
    };
  }

  /** Reload/reconnect without re-entering a PIN — mirrors TerminalService.resumeSession. */
  async resumeSession(session_id: number, device_id: string) {
    const session = await this.prisma.chefSession.findUnique({ where: { id: session_id } });
    if (!session || !session.is_active) {
      return { success: false, message: 'Session has been disconnected' };
    }
    if (session.device_id && session.device_id !== device_id) {
      throw new ForbiddenException('Device does not match this session');
    }

    const updated = await this.prisma.chefSession.update({
      where: { id: session_id },
      data: { last_activity_at: new Date() },
    });

    return {
      success: true,
      session_id: updated.id,
      store_id: updated.store_id,
      chef_name: updated.chef_name,
      device_name: updated.device_name,
      kitchen_station_id: updated.kitchen_station_id,
      access_token: this.mintChefToken(updated),
    };
  }

  async touchActivity(session_id: number) {
    await this.prisma.chefSession.updateMany({
      where: { id: session_id, is_active: true },
      data: { last_activity_at: new Date() },
    });
  }

  /** Connected Chefs list for a kitchen dashboard/manager view. */
  async listSessions(store_id: number) {
    return this.prisma.chefSession.findMany({
      where: { store_id, device_id: { not: null } },
      include: { station: true },
      orderBy: [{ is_active: 'desc' }, { connected_at: 'desc' }],
    });
  }

  async disconnect(session_id: number) {
    const updated = await this.prisma.chefSession.update({
      where: { id: session_id },
      data: { is_active: false, logged_out_at: new Date(), socket_id: null },
    });
    await writeKitchenAudit(this.prisma, { action: 'CHEF_SESSION_DISCONNECTED', entity: 'ChefSession', entity_id: session_id });
    this.gateway.broadcast('chef_sessions_updated', { store_id: updated.store_id }, `store_${updated.store_id}`);
    return { success: true, session: updated };
  }

  async disconnectAll(store_id: number) {
    const sessions = await this.prisma.chefSession.findMany({ where: { store_id, is_active: true } });
    await this.prisma.chefSession.updateMany({
      where: { store_id, is_active: true },
      data: { is_active: false, logged_out_at: new Date(), socket_id: null },
    });
    await writeKitchenAudit(this.prisma, { action: 'CHEF_SESSIONS_DISCONNECTED_ALL', entity: 'ChefSession', details: { store_id, count: sessions.length } });
    this.gateway.broadcast('chef_sessions_updated', { store_id }, `store_${store_id}`);
    return { success: true, count: sessions.length, sessions };
  }

  async reconnect(session_id: number) {
    const updated = await this.prisma.chefSession.update({
      where: { id: session_id },
      data: { is_active: true, logged_out_at: null },
    });
    this.gateway.broadcast('chef_sessions_updated', { store_id: updated.store_id }, `store_${updated.store_id}`);
    return { success: true, session: updated };
  }

  async logout(session_id: number) {
    return this.disconnect(session_id);
  }
}
