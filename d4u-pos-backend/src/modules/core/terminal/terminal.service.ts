import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class TerminalService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * A waiter terminal session is PIN-paired, not a real User login — there's
   * no User row to tie a refresh token to (see AuthService.issueTokenPair).
   * So this mints a standalone, longer-lived access token (no refresh pair)
   * scoped to this session/store, re-minted on every resume — that's what
   * lets /pos-orders (and any other JWT-gated endpoint) accept requests from
   * the waiter tablet at all; without this, every such call 401s.
   */
  private mintTerminalToken(session: { id: number; store_id: number }): string {
    return this.jwtService.sign(
      {
        sub: `terminal-session-${session.id}`,
        role: 'Waiter',
        store_id: session.store_id,
        active_store_id: session.store_id,
        terminal_session_id: session.id,
      },
      { expiresIn: '12h' },
    );
  }

  async getStoreIdForSession(session_id: number): Promise<number | null> {
    const session = await this.prisma.terminalSession.findUnique({ where: { id: session_id } });
    return session?.store_id ?? null;
  }

  async generatePin(store_id: number, waiter_name: string) {
    const pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const session = await this.prisma.terminalSession.create({
      data: { store_id, waiter_name, pin, is_active: true },
    });
    return { success: true, pin, session_id: session.id };
  }

  /** First-time pairing: validates the PIN and attaches this device to the session going forward. */
  async loginByPin(pin: string, device_id?: string, device_name?: string) {
    const session = await this.prisma.terminalSession.findUnique({ where: { pin } });
    if (!session || !session.is_active) {
      return { success: false, message: 'Invalid or expired PIN' };
    }

    const updated = await this.prisma.terminalSession.update({
      where: { id: session.id },
      data: {
        device_id: device_id ?? session.device_id,
        device_name: device_name ?? session.device_name,
        connected_at: session.connected_at ?? new Date(),
        last_activity_at: new Date(),
      },
    });

    return {
      success: true,
      session_id: updated.id,
      store_id: updated.store_id,
      waiter_name: updated.waiter_name,
      device_name: updated.device_name,
      access_token: this.mintTerminalToken(updated),
    };
  }

  /**
   * Used when a waiter's browser reloads: the client already holds
   * {session_id, device_id} in localStorage and skips PIN re-entry entirely,
   * as long as the session hasn't been disconnected by the cashier/waiter.
   */
  async resumeSession(session_id: number, device_id: string) {
    const session = await this.prisma.terminalSession.findUnique({ where: { id: session_id } });
    if (!session || !session.is_active) {
      return { success: false, message: 'Session has been disconnected' };
    }
    if (session.device_id && session.device_id !== device_id) {
      throw new ForbiddenException('Device does not match this session');
    }

    const updated = await this.prisma.terminalSession.update({
      where: { id: session_id },
      data: { last_activity_at: new Date() },
    });

    return {
      success: true,
      session_id: updated.id,
      store_id: updated.store_id,
      waiter_name: updated.waiter_name,
      device_name: updated.device_name,
      access_token: this.mintTerminalToken(updated),
    };
  }

  async touchActivity(session_id: number) {
    await this.prisma.terminalSession.updateMany({
      where: { id: session_id, is_active: true },
      data: { last_activity_at: new Date() },
    });
  }

  async setSocketId(session_id: number, socket_id: string | null) {
    await this.prisma.terminalSession.updateMany({
      where: { id: session_id },
      data: { socket_id, ...(socket_id ? { last_activity_at: new Date() } : {}) },
    });
  }

  async setTable(session_id: number, table_no: string | null) {
    return this.prisma.terminalSession.update({ where: { id: session_id }, data: { table_no } });
  }

  /**
   * The "Connected Waiters" list for the cashier's Terminal tab. Includes
   * disconnected-but-remembered devices too (is_active: false) so the cashier
   * can Reconnect them without regenerating a PIN — only sessions that were
   * never actually paired (no device_id yet) are left out.
   */
  async listSessions(store_id: number) {
    return this.prisma.terminalSession.findMany({
      where: { store_id, device_id: { not: null } },
      orderBy: [{ is_active: 'desc' }, { connected_at: 'desc' }],
    });
  }

  /** Cashier disconnects a single waiter device. Returns the session so the caller can also kick its live socket. */
  async disconnect(session_id: number) {
    const updated = await this.prisma.terminalSession.update({
      where: { id: session_id },
      data: { is_active: false, logged_out_at: new Date(), socket_id: null },
    });
    return { success: true, session: updated };
  }

  /** Cashier disconnects every connected waiter for the store. Returns the affected sessions for the socket kick. */
  async disconnectAll(store_id: number) {
    const sessions = await this.prisma.terminalSession.findMany({ where: { store_id, is_active: true } });
    await this.prisma.terminalSession.updateMany({
      where: { store_id, is_active: true },
      data: { is_active: false, logged_out_at: new Date(), socket_id: null },
    });
    return { success: true, count: sessions.length, sessions };
  }

  /**
   * Re-activates a previously-disconnected but "remembered" device (same
   * device_id) so its next resume_waiter_session call succeeds without a new PIN.
   */
  async reconnect(session_id: number) {
    const updated = await this.prisma.terminalSession.update({
      where: { id: session_id },
      data: { is_active: true, logged_out_at: null },
    });
    return { success: true, session: updated };
  }

  /** Waiter explicitly logs out from their own device. */
  async logout(session_id: number) {
    return this.disconnect(session_id);
  }

  /** Legacy PIN-keyed disconnect, kept for backward compatibility with the old DELETE /terminal/:pin route. */
  async disconnectByPin(pin: string) {
    const session = await this.prisma.terminalSession.findUnique({ where: { pin } });
    if (session) await this.disconnect(session.id);
    return { success: true };
  }
}
