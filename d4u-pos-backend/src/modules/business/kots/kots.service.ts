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
  //
  // RC1 FIX: Only KOTs from the current OPEN business day are returned.
  // Stale NEW/PREPARING KOTs from previous (closed) business days were leaking
  // through because there was no day boundary in the query. We now:
  //   1. Look up the currently OPEN BusinessDay for this store.
  //   2. Filter by business_day_id = that day's id.
  //   3. Fall back to a calendar-day createdAt boundary (today midnight) for any
  //      KOT that was created without a business_day_id (e.g. online orders that
  //      arrived outside a POS business day) so they still appear during today's
  //      service without requiring a schema migration.
  // Maximum age of a NEW/PREPARING KOT that will still appear on the KDS.
  // An OPEN BusinessDay may span multiple calendar days if the operator forgets
  // to close it — a kitchen ticket that is 19 hours old is genuinely stuck, not
  // an active preparation job.  18 hours matches a typical double-shift service
  // window and is well above any realistic maximum cook time.
  // READY tickets are NOT subject to this cap — their own 5-minute display
  // window (READY_TICKET_WINDOW_MS) already constrains them tightly.
  private static readonly KOT_ACTIVE_WINDOW_MS = 18 * 60 * 60 * 1000; // 18 h

  async getActiveKots(store_id: number, includeReady: boolean = false) {
    // Rolling 18-hour staleness boundary shared by both code paths below.
    // Computed once so the timestamp is identical for every clause in the query.
    const stalenessBoundary = new Date(Date.now() - KotsService.KOT_ACTIVE_WINDOW_MS);

    const statusFilter: any = includeReady
      ? {
          OR: [
            { status: { in: ['NEW', 'PREPARING'] } },
            { status: 'READY', readyAt: { gte: new Date(Date.now() - KotsService.READY_TICKET_WINDOW_MS) } },
          ],
        }
      : { status: { in: ['NEW', 'PREPARING'] } };

    const where: any = { ...statusFilter };

    if (store_id && !isNaN(store_id)) {
      where.store_id = store_id;

      // RC1: Scope to the current OPEN business day only.
      const openDay = await this.prisma.businessDay.findFirst({
        where: { store_id, status: 'OPEN' },
        orderBy: { id: 'desc' },
        select: { id: true, dayStart: true },
      });

      if (openDay) {
        // An open business day exists.
        //
        // RC1 FIX (original): filter by business_day_id = openDay.id so KOTs
        // from *closed* business days never appear on the active KDS.
        //
        // FIX 1 SUPPLEMENT: also require createdAt >= now - 18h so a KOT that
        // is genuinely stuck/abandoned (e.g. from a BD that has been OPEN for
        // multiple days because the operator forgot to close it) cannot block
        // the kitchen view.  This is an AND condition on top of the BD filter:
        // a KOT must be *both* in the correct BD *and* recent.
        //
        // READY KOTs: the existing 5-minute readyAt window is tighter than 18h,
        // so the staleness boundary is only meaningful for NEW/PREPARING here.
        const dayBoundaryFilter = {
          AND: [
            {
              // BD membership: belongs directly to the open BD, or belongs to
              // no BD but was created after the BD opened (some online paths).
              OR: [
                { business_day_id: openDay.id },
                { business_day_id: null, createdAt: { gte: openDay.dayStart } },
              ],
            },
            // Staleness guard: KOT must be less than 18 hours old.
            // Applied to all tickets including READY (though READY has its own
            // tighter window via statusFilter above, the extra AND is harmless).
            { createdAt: { gte: stalenessBoundary } },
          ],
        };

        // Merge status filter with day+staleness boundary using AND
        delete where.OR; // avoid accidental merge
        if (statusFilter.OR) {
          // includeReady path: wrap status alternatives inside AND
          where.AND = [{ OR: statusFilter.OR }, dayBoundaryFilter];
        } else {
          // Simple status filter: merge directly
          Object.assign(where, dayBoundaryFilter);
        }
      } else {
        // No open business day: fall back to an 18-hour rolling window.
        // Using 18h instead of calendar midnight so a restaurant open past
        // midnight never loses KOTs created before midnight when the date rolls.
        const dayBoundaryFilter = { createdAt: { gte: stalenessBoundary } };
        if (statusFilter.OR) {
          where.AND = [{ OR: statusFilter.OR }, dayBoundaryFilter];
        } else {
          Object.assign(where, dayBoundaryFilter);
        }
      }
    }

    return this.prisma.kOT.findMany({
      where,
      // onlineOrder: the linked OnlineOrder row (if this KOT's Order came
      // from the website/app) -- carries .type (DELIVERY/PICKUP/DINE_IN),
      // which is how the frontend tells Walk-in apart from Pickup/Online.
      include: { order: { include: { onlineOrder: true } } },
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

    // Task 6A — POS-native delivery orders only (order_source = 'DELIVERY'):
    // Emit the Rider-facing offer using the POS Order's own identity.
    // MUST NOT fire for Website-origin orders (order_source = 'ONLINE') —
    // those are handled by block 2 below using the authoritative OnlineOrder
    // identity. Emitting formatPosOrderForRider for an ONLINE-sourced POS
    // Order would create a competing Rider offer under the internal POS
    // Order id instead of the customer-facing OnlineOrder id, which breaks
    // claim URL routing, Rider history, and Website order tracking.
    //
    // Guard: order_source is 'DELIVERY' (mixed case) for POS-native orders
    // and 'ONLINE' for Website orders — these are mutually exclusive. The
    // additional posOrderId=null check below makes the exclusion explicit
    // for safety: if this POS Order is the linked twin of an OnlineOrder
    // (posOrderId would point back to it via the unique reverse relation),
    // skip the POS broadcast entirely — block 2 owns that identity.
    if ((status === 'PREPARING' || status === 'READY') && kot.order?.order_source?.toUpperCase() === 'DELIVERY') {
      // Confirm this is NOT a Website-linked POS Order before broadcasting
      const linkedOnlineCheck = await this.prisma.onlineOrder.findUnique({
        where: { posOrderId: kot.order_id },
        select: { id: true },
      });
      if (!linkedOnlineCheck) {
        // Genuine POS-native delivery — use POS Order identity
        const fullOrder = await this.prisma.order.findUnique({
          where: { id: kot.order_id },
          include: { customer: true, items: { include: { product: true } } },
        });
        if (fullOrder) {
          this.gateway.broadcast('order_updated', formatPosOrderForRider(fullOrder), `store_${kot.store_id}`);
        }
      }
      // If linkedOnlineCheck is non-null this order is ONLINE-origin — block 2
      // below will broadcast the authoritative OnlineOrder representation.
    }

    // Website orders that were given a real kitchen ticket at CONFIRMED
    // time (see OnlineOrdersService.createKitchenTicketForOnlineOrder) —
    // mirror PREPARING/READY back onto the actual OnlineOrder row and
    // broadcast THAT, not formatPosOrderForRider(fullOrder): the latter
    // stamps the POS Order's own id, not the OnlineOrder's, which would
    // silently break TrackOrderPage/Rider App's id-based matching.
    // Task 6A: this is the ONE and ONLY Rider-facing broadcast for
    // Website-origin orders — block 1 above is explicitly suppressed when
    // a linked OnlineOrder exists, ensuring exactly one identity (OnlineOrder.id)
    // reaches the Rider App.
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

  // Task #2P-G: thin, status-locked wrappers around updateKotStatus, so each
  // has its own callable identity for the split /accept, /bump, /cancel
  // routes without duplicating any of the transition/broadcast logic above.
  // The status passed is always the literal for this operation -- never
  // client-supplied -- so a caller of acceptKOT can never produce READY or
  // CANCELLED behavior, and so on for the other two.
  async acceptKOT(id: number) {
    return this.updateKotStatus(id, 'PREPARING');
  }

  async bumpKOT(id: number) {
    return this.updateKotStatus(id, 'READY');
  }

  async cancelKOT(id: number) {
    return this.updateKotStatus(id, 'CANCELLED');
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
      include: { order: { include: { onlineOrder: true } } },
      orderBy: { id: 'desc' },
    });
  }
}
