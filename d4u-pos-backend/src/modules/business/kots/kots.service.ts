import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  // Task #3B FIX — STRICT IDENTITY GATE:
  //
  // Active KOT query now requires EXPLICIT business_day_id on every returned KOT.
  //
  // Previous behaviour (removed):
  //   • An OR-branch `{ business_day_id: null, createdAt >= openDay.dayStart }` was
  //     returning KOTs with NO business_day_id as "active".  This fabricated day
  //     identity on the client side because the KOT carried no authoritative value.
  //   • A second 18-hour rolling fallback (used when no BusinessDay was open) also
  //     returned identity-less KOTs, violating RULE 3.
  //
  // New behaviour:
  //   1. If an OPEN BusinessDay exists  → only KOTs whose business_day_id = openDay.id
  //      are returned.  KOTs with NULL business_day_id are NOT returned.
  //   2. If NO OPEN BusinessDay exists  → the active list is always empty.  There is
  //      no rolling-window fallback.  An empty kitchen display is the correct and
  //      safe behaviour in that state.
  //
  // The 18-hour staleness cap for READY-ticket display is still kept for the case
  // where a BD has been open for an unusually long time (operator forgot to close it).
  private static readonly KOT_ACTIVE_WINDOW_MS = 18 * 60 * 60 * 1000; // 18 h — staleness cap only

  async getActiveKots(store_id: number, includeReady: boolean = false) {
    // Task #3B-2: Strict store_id Integer Validation.
    // A valid store_id must be a finite positive integer (Prisma Int identifier).
    // Rejects null, undefined, 0, negative numbers, NaN, Infinity, -Infinity,
    // floats (e.g. 2.5, 1.1), strings, booleans, objects, arrays.
    if (typeof store_id !== 'number' || !Number.isInteger(store_id) || store_id <= 0) {
      throw new BadRequestException('A valid store_id is required to fetch active KOTs');
    }

    // RC1: Scope to the current OPEN business day only.
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
      select: { id: true, dayStart: true },
    });

    // Task #3B-1 (GAP 3): Remove the -1 sentinel.
    // If NO open BusinessDay exists, return zero active KOTs immediately.
    // Do NOT query recent KOTs, do NOT invent a business-day ID, and do NOT use a sentinel value.
    if (!openDay) {
      return [];
    }

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

    const dayBoundaryFilter = {
      AND: [
        // Strict BD membership — null is explicitly excluded
        { business_day_id: openDay.id },
        // Staleness guard
        { createdAt: { gte: stalenessBoundary } },
      ],
    };

    const where: any = {
      store_id,
      ...(statusFilter.OR
        ? { AND: [{ OR: statusFilter.OR }, dayBoundaryFilter] }
        : { ...statusFilter, ...dayBoundaryFilter }),
    };

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
    const existing = await this.prisma.kOT.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`KOT #${id} not found`);

    // Authoritative KOT State-Machine Transition Guard (Codex Finding #1):
    // Authoritative lifecycle: NEW -> PREPARING (accept) -> READY (bump)
    // Direct bypass from NEW -> READY is strictly rejected.
    if (status === 'PREPARING' && existing.status !== 'NEW') {
      throw new BadRequestException(
        `Invalid KOT status transition from ${existing.status} to PREPARING. Only NEW tickets can be accepted into PREPARING.`,
      );
    }
    if (status === 'READY' && existing.status !== 'PREPARING') {
      throw new BadRequestException(
        `Invalid KOT status transition from ${existing.status} to READY. A ticket must be in PREPARING before it can be marked READY.`,
      );
    }
    if (status === 'CANCELLED' && existing.status === 'READY') {
      throw new BadRequestException(
        `Cannot cancel KOT #${id}: ticket is already marked READY.`,
      );
    }

    // Atomically update KOT, POS Order, and linked OnlineOrder within a single transaction (Finding #7)
    const { kot, broadcastEvents } = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const data: any = { status };

      if (status === 'PREPARING') data.acceptedAt = now;
      if (status === 'READY') data.readyAt = now;

      const updatedKot = await tx.kOT.update({
        where: { id },
        data,
        include: { order: true },
      });

      // Update Order status
      if (status === 'READY') {
        await tx.order.update({
          where: { id: updatedKot.order_id },
          data: { status: 'READY' },
        });
      } else if (status === 'PREPARING') {
        await tx.order.update({
          where: { id: updatedKot.order_id },
          data: { status: 'PREPARING' },
        });
      }

      const events: Array<{ event: string; payload: any; room?: string }> = [];

      // KDS realtime notification
      events.push({
        event: 'kds_update',
        payload: {
          kot_id: id,
          order_id: updatedKot.order_id,
          status,
          store_id: updatedKot.store_id,
          business_day_id: updatedKot.business_day_id,
        },
      });

      // Task 6A — POS-native delivery orders only (order_source = 'DELIVERY'):
      // Emit the Rider-facing offer using the POS Order's own identity.
      // MUST NOT fire for Website-origin orders (order_source = 'ONLINE') —
      // those are handled by block 2 below using the authoritative OnlineOrder identity.
      if ((status === 'PREPARING' || status === 'READY') && updatedKot.order?.order_source?.toUpperCase() === 'DELIVERY') {
        const linkedOnlineCheck = await tx.onlineOrder.findUnique({
          where: { posOrderId: updatedKot.order_id },
          select: { id: true },
        });
        if (!linkedOnlineCheck) {
          const fullOrder = await tx.order.findUnique({
            where: { id: updatedKot.order_id },
            include: { customer: true, items: { include: { product: true } }, rider: true },
          });
          if (fullOrder) {
            events.push({
              event: 'order_updated',
              payload: formatPosOrderForRider(fullOrder),
              room: `store_${updatedKot.store_id}`,
            });
          }
        }
      }

      // Website orders that were given a real kitchen ticket at CONFIRMED
      // time: mirror PREPARING/READY back onto the actual OnlineOrder row
      if ((status === 'PREPARING' || status === 'READY') && updatedKot.order?.order_source === 'ONLINE') {
        const linkedOnlineOrder = await tx.onlineOrder.findUnique({
          where: { posOrderId: updatedKot.order_id },
        });
        if (linkedOnlineOrder) {
          const newStatus = status === 'PREPARING' ? 'KITCHEN_PREPARING' : 'READY';
          const updatedOnlineOrder = await tx.onlineOrder.update({
            where: { id: linkedOnlineOrder.id },
            data: { status: newStatus, kdsStatus: status },
          });
          events.push({
            event: 'order_updated',
            payload: updatedOnlineOrder,
            room: `store_${updatedKot.store_id}`,
          });
        }
      }

      return { kot: updatedKot, broadcastEvents: events };
    });

    console.log(`[KDS] KOT #${id} → ${status}`);

    // Emit all realtime events ONLY after transaction commits successfully
    for (const evt of broadcastEvents) {
      if (evt.room) {
        this.gateway.broadcast(evt.event, evt.payload, evt.room);
      } else {
        this.gateway.broadcast(evt.event, evt.payload);
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
