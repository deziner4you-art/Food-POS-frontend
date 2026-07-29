import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { writeKitchenAudit } from '../../../common/utils/kitchen-audit.util';

/**
 * Kitchen ticket actions + dashboard aggregates. Deliberately built ALONGSIDE
 * the existing kots module (src/modules/business/kots/) rather than
 * replacing it — the old /kots endpoints keep working unchanged for any
 * existing caller (backward compatibility). This adds a parallel surface
 * under /kitchen/* using the already-seeded-but-previously-unused
 * kitchen.tickets.* permissions, plus real audit logging and room-scoped
 * realtime events (the old kots.service.ts broadcasts are unscoped —
 * broadcast to every connected client — a pre-existing gap left as-is there
 * to avoid touching working code; the new events below are properly scoped).
 */
@Injectable()
export class KitchenDashboardService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  async getActiveTickets(store_id: number, kitchen_station_id?: number) {
    const tickets = await this.prisma.kOT.findMany({
      where: { store_id, status: { in: ['NEW', 'PREPARING'] } },
      include: { order: true },
      orderBy: { id: 'asc' },
    });
    if (!kitchen_station_id) return tickets;

    // Station-filtered view: an item only carries a station if it was
    // captured with one (see pos-orders.service.ts kotItems enrichment) —
    // tickets with no station-tagged items at all are excluded when a
    // specific station is requested.
    return tickets.filter((t) => {
      const items = Array.isArray(t.items) ? (t.items as any[]) : [];
      return items.some((i) => i.kitchen_station_id === kitchen_station_id);
    });
  }

  async bumpTicket(id: number, user_id?: number) {
    const kot = await this.prisma.kOT.findUnique({ where: { id } });
    if (!kot) throw new BadRequestException('Ticket not found');
    if (kot.status === 'CANCELLED') throw new BadRequestException('Cannot bump a cancelled ticket');

    const updated = await this.prisma.kOT.update({
      where: { id },
      data: { status: 'READY', readyAt: new Date() },
    });
    // Keep Order.status in sync — mirrors kots.service.ts's existing behavior exactly.
    await this.prisma.order.updateMany({ where: { id: kot.order_id }, data: { status: 'READY' } });

    await writeKitchenAudit(this.prisma, { action: 'TICKET_BUMPED', entity: 'KOT', entity_id: id, user_id, details: { order_id: kot.order_id } });
    this.gateway.broadcast('kitchen_ticket_bumped', { kot_id: id, order_id: kot.order_id, status: 'READY' }, `store_${kot.store_id}`);
    return updated;
  }

  /** Recall a bumped ticket back to PREPARING — e.g. it was marked ready by mistake. */
  async recallTicket(id: number, user_id?: number) {
    const kot = await this.prisma.kOT.findUnique({ where: { id } });
    if (!kot) throw new BadRequestException('Ticket not found');
    if (kot.status !== 'READY') throw new BadRequestException('Only a READY ticket can be recalled');

    const updated = await this.prisma.kOT.update({
      where: { id },
      data: { status: 'PREPARING', readyAt: null },
    });
    await this.prisma.order.updateMany({ where: { id: kot.order_id }, data: { status: 'PREPARING' } });

    await writeKitchenAudit(this.prisma, { action: 'TICKET_RECALLED', entity: 'KOT', entity_id: id, user_id, details: { order_id: kot.order_id } });
    this.gateway.broadcast('kitchen_ticket_recalled', { kot_id: id, order_id: kot.order_id, status: 'PREPARING' }, `store_${kot.store_id}`);
    return updated;
  }

  async acceptTicket(id: number, user_id?: number) {
    const kot = await this.prisma.kOT.findUnique({ where: { id } });
    if (!kot) throw new BadRequestException('Ticket not found');

    const updated = await this.prisma.kOT.update({
      where: { id },
      data: { status: 'PREPARING', acceptedAt: kot.acceptedAt ?? new Date() },
    });
    await this.prisma.order.updateMany({ where: { id: kot.order_id }, data: { status: 'PREPARING' } });

    await writeKitchenAudit(this.prisma, { action: 'TICKET_ACCEPTED', entity: 'KOT', entity_id: id, user_id, details: { order_id: kot.order_id } });
    this.gateway.broadcast('kitchen_ticket_accepted', { kot_id: id, order_id: kot.order_id, status: 'PREPARING' }, `store_${kot.store_id}`);
    return updated;
  }

  /** Aggregate KDS dashboard: queue depth, average prep time, per-station breakdown, today's throughput. */
  async getDashboard(store_id: number) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [active, readyToday, completedToday, stations] = await Promise.all([
      this.prisma.kOT.findMany({ where: { store_id, status: { in: ['NEW', 'PREPARING'] } } }),
      this.prisma.kOT.count({ where: { store_id, status: 'READY', readyAt: { gte: startOfDay } } }),
      this.prisma.kOT.findMany({
        where: { store_id, status: 'READY', createdAt: { gte: startOfDay }, readyAt: { not: null } },
        select: { createdAt: true, readyAt: true },
      }),
      this.prisma.kitchenStation.findMany({ where: { store_id, is_active: true }, orderBy: { sort_order: 'asc' } }),
    ]);

    const prepTimesMins = completedToday
      .filter((k) => k.readyAt)
      .map((k) => (k.readyAt!.getTime() - k.createdAt.getTime()) / 60000);
    const avgPrepTimeMins = prepTimesMins.length > 0
      ? parseFloat((prepTimesMins.reduce((a, b) => a + b, 0) / prepTimesMins.length).toFixed(1))
      : 0;

    const newCount = active.filter((k) => k.status === 'NEW').length;
    const preparingCount = active.filter((k) => k.status === 'PREPARING').length;

    // Oldest ticket still waiting — flags a stuck/aging ticket for the dashboard.
    const oldestActive = active.length > 0
      ? active.reduce((oldest, k) => (k.createdAt < oldest.createdAt ? k : oldest))
      : null;

    return {
      store_id,
      queue: { new: newCount, preparing: preparingCount, total_active: active.length },
      readyTodayCount: readyToday,
      avgPrepTimeMins,
      oldestActiveTicket: oldestActive ? { kot_id: oldestActive.id, order_id: oldestActive.order_id, ageMins: Math.round((now.getTime() - oldestActive.createdAt.getTime()) / 60000), status: oldestActive.status } : null,
      stations: stations.map((s) => ({ id: s.id, name: s.name })),
      generatedAt: now,
    };
  }
}
