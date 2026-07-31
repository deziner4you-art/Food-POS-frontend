import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { formatPosOrderForRider } from '../../../common/utils/rider-order.util';

@Injectable()
export class KotsService {
  // How long a READY ticket keeps appearing in getActiveKots(includeReady:
  // true) before it ages out of the response. Bounds the endpoint's payload
  // size in the absence of any terminal KOT status beyond READY (see the
  // comment on getActiveKots) -- without a cutoff, every ticket ever marked
  // READY would stay in every KDS/TV Board resync forever. Matches the
  // identical window both frontends already apply client-side for display.
  // Value is a product decision, not an engineering one -- do not change
  // without Product Owner sign-off.
  private static readonly READY_TICKET_WINDOW_MS = 5 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  // KDS اسکرین کے لیے — تمام Active KOTs
  //
  // "Active" has always meant NEW/PREPARING here (still needs kitchen
  // attention) — matches KitchenDashboardService's own separate NEW/PREPARING
  // vs READY query split. That's the correct default and stays unchanged.
  //
  // includeReady is additive and opt-in: KDS/TV Board also need to *display*
  // recently-completed tickets, which this endpoint never provided, so every
  // resync silently wiped the Ready column seconds after a ticket appeared in
  // it. There is no terminal KOT status beyond READY (updateKotStatus only
  // ever accepts PREPARING/READY/CANCELLED) — READY stays READY forever in
  // the DB — so a status-based cutoff isn't available. Bounding by time
  // instead, matching the identical 5-minute window both frontends already
  // apply client-side, keeps the response itself bounded rather than growing
  // unboundedly while relying on the UI to hide the excess.
  async getActiveKots(store_id: number, includeReady: boolean = false) {
    const where: any = includeReady
      ? {
          OR: [
            { status: { in: ['NEW', 'PREPARING'] } },
            { status: 'READY', readyAt: { gte: new Date(Date.now() - KotsService.READY_TICKET_WINDOW_MS) } },
          ],
        }
      : { status: { in: ['NEW', 'PREPARING'] } };
    if (store_id && !isNaN(store_id)) {
      where.store_id = store_id;
    }
    return this.prisma.kOT.findMany({
      where,
      include: { order: true },
      orderBy: { id: 'asc' },
    });
  }

  // ایک KOT کی تفصیل
  async getKot(id: number) {
    const kot = await this.prisma.kOT.findUnique({
      where: { id },
      include: {
        order: { include: { items: { include: { product: true } } } },
      },
    });
    if (!kot) throw new NotFoundException(`KOT #${id} not found`);
    return kot;
  }

  // KOT Status اپڈیٹ (Chef نے دبایا)
  async updateKotStatus(
    id: number,
    status: 'PREPARING' | 'READY' | 'CANCELLED',
  ) {
    const now = new Date();
    const data: any = { status };

    if (status === 'PREPARING') data.acceptedAt = now;
    if (status === 'READY') data.readyAt = now;

    const kot = await this.prisma.kOT.update({
      where: { id },
      data,
      include: { order: true },
    });

    // Order کا status بھی اپڈیٹ کریں
    if (status === 'READY') {
      await this.prisma.order.update({
        where: { id: kot.order_id },
        data: { status: 'READY' },
      });
    } else if (status === 'PREPARING') {
      await this.prisma.order.update({
        where: { id: kot.order_id },
        data: { status: 'PREPARING' },
      });
    }

    console.log(`[KDS] KOT #${id} → ${status}`);

    // POS اور Website کو فوری اطلاع
    this.gateway.broadcast('kds_update', {
      kot_id: id,
      order_id: kot.order_id,
      status,
      store_id: kot.store_id,
    });

    // Sprint 28.9: this was the actual break in "POS -> Kitchen -> Ready ->
    // Rider App" — the Rider App only listens for 'order_updated' (the same
    // event/shape online-orders.service.ts already emits correctly), but
    // this method only ever emitted 'kds_update' (different name, different
    // shape), so a POS-originated delivery order becoming READY never
    // reached any rider, regardless of dispatch/assignment. Only applies to
    // delivery orders — dine-in/takeaway tickets have no rider to notify.
    if (status === 'READY' && kot.order?.order_source?.toUpperCase() === 'DELIVERY') {
      const fullOrder = await this.prisma.order.findUnique({
        where: { id: kot.order_id },
        include: { customer: true, items: { include: { product: true } } },
      });
      if (fullOrder) {
        this.gateway.broadcast('order_updated', formatPosOrderForRider(fullOrder), `store_${kot.store_id}`);
      }
    }

    // Website orders that were given a real kitchen ticket at CONFIRMED
    // time (see OnlineOrdersService.createKitchenTicketForOnlineOrder) —
    // mirror PREPARING/READY back onto the actual OnlineOrder row and
    // broadcast THAT, not formatPosOrderForRider(fullOrder): the latter
    // stamps the POS Order's own id, not the OnlineOrder's, which would
    // silently break TrackOrderPage/Rider App's id-based matching.
    if ((status === 'PREPARING' || status === 'READY') && kot.order?.order_source === 'ONLINE') {
      const linkedOnlineOrder = await this.prisma.onlineOrder.findUnique({
        where: { posOrderId: kot.order_id },
      });
      if (linkedOnlineOrder) {
        const newStatus = status === 'PREPARING' ? 'KITCHEN_PREPARING' : 'READY';
        const updatedOnlineOrder = await this.prisma.onlineOrder.update({
          where: { id: linkedOnlineOrder.id },
          data: { status: newStatus, kdsStatus: status },
        });
        this.gateway.broadcast('order_updated', updatedOnlineOrder, `store_${kot.store_id}`);
      }
    }

    return { success: true, kot };
  }

  // Print Count بڑھائیں (Duplicate print track کریں)
  async incrementPrintCount(id: number) {
    const kot = await this.prisma.kOT.update({
      where: { id },
      data: { printCount: { increment: 1 } },
    });
    console.log(`[PRINT] KOT #${id} — Print #${kot.printCount}`);
    return { success: true, printCount: kot.printCount };
  }

  // آج کے تمام KOTs (history کے لیے)
  async getKotsByDay(store_id: number, business_day_id: number) {
    return this.prisma.kOT.findMany({
      where: { store_id, business_day_id },
      include: { order: true },
      orderBy: { id: 'desc' },
    });
  }
}
