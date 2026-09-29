import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Optional } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { formatPosOrderForRider } from '../../../common/utils/rider-order.util';
import { TablesService } from '../tables/tables.service';
import {
  DeliveryEntityType,
  formatOnlineOrderForRider,
  normalizeDeliveryEntityType,
} from '../../../common/utils/delivery-identity.util';

@Injectable()
export class RiderService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    @Optional() private tablesService?: TablesService,
  ) {}

  /**
   * OnlineOrder keeps the business-day identity on its linked POS twin.
   * Enrich only linked online records before broadcasting; unlinked records
   * remain unchanged and fail closed in POS until an authoritative identity
   * exists.
   */
  private async enrichOnlineOrderEvent(order: any) {
    if (!order?.posOrderId) return order;
    const posOrder = await this.prisma.order.findUnique({
      where: { id: order.posOrderId },
      select: { business_day_id: true },
    });
    return posOrder ? { ...order, posOrder } : order;
  }

  /**
   * Resolve the table namespace before touching a delivery row. A numeric id
   * is not globally unique because OnlineOrder and Order have independent
   * sequences. Legacy callers may omit entityType only while the id exists
   * in exactly one table; ambiguous ids are rejected closed.
   */
  private async resolveDeliveryEntityType(
    id: number,
    requestedType?: unknown,
  ): Promise<DeliveryEntityType> {
    const explicitType = normalizeDeliveryEntityType(requestedType);
    if (requestedType !== undefined && !explicitType) {
      throw new BadRequestException('entityType must be ONLINE or POS.');
    }
    if (explicitType) return explicitType;

    const [online, pos] = await Promise.all([
      this.prisma.onlineOrder.findUnique({ where: { id } }),
      this.prisma.order.findUnique({ where: { id } }),
    ]);
    if (online && pos) {
      throw new BadRequestException(
        `Order #${id} exists in both ONLINE and POS namespaces. entityType is required.`,
      );
    }
    if (online) return 'ONLINE';
    if (pos) return 'POS';
    throw new NotFoundException('Order not found.');
  }

  private runInTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    if (typeof this.prisma.$transaction === 'function') {
      return this.prisma.$transaction(callback);
    }
    return callback(this.prisma);
  }

  async getRiderOrders(storeId?: string) {
    // Sprint 28.9: store_id must never be optional here — omitting it used
    // to silently return every store's delivery orders (cross-tenant leak).
    if (!storeId) {
      throw new BadRequestException('store_id is required.');
    }

    // Fix 2: PAID and SETTLED are terminal delivery statuses — the order is
    // fully complete and cash has been reconciled.  Including them caused
    // every past delivery to accumulate in the rider queue forever, blocking
    // the "Finish Current Delivery First" guard for every new available order.
    // Rider history (if needed) should use a dedicated history endpoint, not
    // the active-delivery queue.
    const validStatuses = [
      'READY', 'RIDER_ARRIVED', 'PRINT_BILL', 'DISPATCHED',
      'RIDER_ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY',
      'DELIVERED', 'WAITING_CASH_SETTLEMENT',
    ];

    const onlineWhere: any = {
      status: { in: validStatuses },
      type: { equals: 'DELIVERY', mode: 'insensitive' },
      store_id: Number(storeId),
      // Fix 3: A DISPATCHED order with no rider claim is permanently orphaned —
      // the cashier pressed "Dispatch Order" on the POS before any rider
      // accepted the delivery.  These orders must not appear in the rider queue
      // because:
      //   1. They look like "Available Orders" (claimedByRiderId is null) so
      //      the Accept button is shown, but the delivery was already marked
      //      DISPATCHED and cannot be properly re-started from that state.
      //   2. A rider who claims such an order will find it stuck at an
      //      intermediate status with no clear path to settlement.
      // Guard: exclude DISPATCHED rows where claimedByRiderId is still null.
      // Legitimately claimed DISPATCHED orders (rider accepted, cashier
      // dispatched after the fact) continue to appear normally.
      NOT: {
        AND: [
          { status: 'DISPATCHED' },
          { claimedByRiderId: null },
        ],
      },
    };
    const posWhere: any = {
      status: { in: validStatuses },
      // Sprint 28.9: the POS UI's order-type dropdown saves order_source as
      // "Delivery" (mixed case) — this filter previously compared against
      // the exact string "DELIVERY" and never matched a single POS order.
      order_source: { equals: 'DELIVERY', mode: 'insensitive' },
      store_id: Number(storeId),
      // Fix: A DISPATCHED order with no rider claim is permanently orphaned
      NOT: {
        AND: [
          { status: 'DISPATCHED' },
          { rider_id: null },
        ],
      },
    };

    const onlineOrders = await this.prisma.onlineOrder.findMany({
      where: onlineWhere,
      orderBy: { id: 'desc' },
    });

    const posOrders = await this.prisma.order.findMany({
      where: posWhere,
      orderBy: { id: 'desc' },
      include: {
        customer: true,
        items: { include: { product: true } },
        rider: true,
      }
    });

    const formattedOnlineOrders = onlineOrders.map(formatOnlineOrderForRider);
    const formattedPosOrders = posOrders.map(formatPosOrderForRider);

    const allOrders = [...formattedOnlineOrders, ...formattedPosOrders].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return allOrders;
  }

  /**
   * Returns the authenticated rider's historical delivery activity for a
   * bounded time window. This is deliberately separate from getRiderOrders:
   * the latter is an active-queue endpoint and intentionally excludes terminal
   * rows. Reports must read both delivery namespaces and must never trust a
   * riderId supplied by the client.
   */
  async getRiderActivity(
    storeIdStr: string,
    authenticatedUser: any,
    fromStr?: string,
    toStr?: string,
  ) {
    const storeId = Number(storeIdStr);
    const riderId = Number(authenticatedUser?.sub);
    if (!Number.isInteger(storeId) || storeId <= 0) {
      throw new BadRequestException('A valid store_id is required.');
    }
    if (!Number.isInteger(riderId) || riderId <= 0) {
      throw new ForbiddenException('Authenticated rider identity is required.');
    }

    const rider = await this.prisma.user.findUnique({
      where: { id: riderId },
      include: { role: true },
    });
    if (!rider || rider.role?.name !== 'Rider') {
      throw new ForbiddenException('Only an authenticated rider may view rider activity.');
    }

    const tokenStoreId = Number(
      authenticatedUser?.active_store_id ?? authenticatedUser?.store_id,
    );
    if (Number(rider.store_id) !== storeId || (tokenStoreId > 0 && tokenStoreId !== storeId)) {
      throw new ForbiddenException('Cross-store rider activity access denied.');
    }

    const from = fromStr ? new Date(fromStr) : new Date(0);
    const to = toStr ? new Date(toStr) : new Date();
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      throw new BadRequestException('from/to must be valid ISO dates with from before to.');
    }
    const createdAt = { gte: from, lt: to };

    const [onlineOrders, posOrders] = await Promise.all([
      this.prisma.onlineOrder.findMany({
        where: {
          store_id: storeId,
          type: { equals: 'DELIVERY', mode: 'insensitive' },
          claimedByRiderId: riderId,
          createdAt,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.findMany({
        where: {
          store_id: storeId,
          order_source: { equals: 'DELIVERY', mode: 'insensitive' },
          rider_id: riderId,
          createdAt,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          items: { include: { product: true } },
          rider: true,
          onlineOrder: { select: { id: true } },
        },
      }),
    ]);

    const onlineById = new Map(onlineOrders.map((order: any) => [order.id, order]));
    const linkedPosIds = new Set(
      onlineOrders
        .map((order: any) => order.posOrderId)
        .filter((id: unknown): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0),
    );

    const onlineRecords = onlineOrders.map((order: any) => ({
      ...formatOnlineOrderForRider(order),
      activityAt: order.createdAt,
      activityStatus: order.status,
      totalAmount: String(order.totalAmount ?? '0'),
      logicalDeliveryKey: order.posOrderId
        ? `ONLINE:${order.id}:POS:${order.posOrderId}`
        : `ONLINE:${order.id}`,
    }));

    const posRecords = posOrders
      // A linked POS twin is represented by its OnlineOrder record when both
      // rows are present in this window. This prevents one rider trip from
      // being counted twice while preserving explicit twin ids in the record.
      .filter((order: any) => !linkedPosIds.has(order.id))
      .map((order: any) => {
        const formatted = formatPosOrderForRider(order);
        const linkedOnlineId = order.onlineOrder?.id ?? null;
        const linkedOnline = linkedOnlineId ? onlineById.get(linkedOnlineId) : null;
        return {
          ...formatted,
          activityAt: order.createdAt,
          activityStatus: order.status,
          totalAmount: String(order.total_amount ?? '0'),
          onlineOrderId: linkedOnlineId,
          logicalDeliveryKey: linkedOnline
            ? `ONLINE:${linkedOnline.id}:POS:${order.id}`
            : `POS:${order.id}`,
        };
      });

    const records = [...onlineRecords, ...posRecords].sort(
      (a: any, b: any) => new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime(),
    );

    return { from: from.toISOString(), to: to.toISOString(), records };
  }

  // Task #2K: the rider identity recorded here used to come from
  // `body.riderId`, defaulting to the hardcoded literal 'R1' whenever it was
  // absent -- and the real rider app (d4u-rider/src/App.tsx) never actually
  // sends riderId on this call at all, so in practice every GPS ping was
  // already being recorded as 'R1' for every rider, always. The identity is
  // now taken exclusively from the verified JWT (`authenticatedUser.sub`),
  // matching the same trusted-identity pattern used by claimOrder (Task
  // #2J). No hardcoded fallback identity remains: a missing/invalid
  // authenticated identity is rejected instead of defaulting to anything.
  async updateRiderGps(body: any, authenticatedUser: any) {
    const riderId = Number(authenticatedUser?.sub);
    if (!authenticatedUser || !Number.isFinite(riderId) || riderId <= 0) {
      throw new BadRequestException('A valid authenticated rider identity is required.');
    }

    const riderUser = await this.prisma.user.findUnique({
      where: { id: riderId },
      include: { role: true },
    });

    if (!riderUser) {
      throw new BadRequestException('Rider does not exist.');
    }

    if (riderUser.role?.name !== 'Rider') {
      throw new BadRequestException('Authenticated user is not a rider.');
    }

    const orderId = Number(body.orderId);
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    const deliveryInfo = {
      riderId,
      lat,
      lng,
      lastUpdated: new Date().toISOString(),
    };

    const entityType = await this.resolveDeliveryEntityType(orderId, body.entityType);
    const selectedOrder = entityType === 'ONLINE'
      ? await this.prisma.onlineOrder.findUnique({ where: { id: orderId } })
      : await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!selectedOrder) throw new NotFoundException('Delivery not found.');
    if (Number(selectedOrder.store_id) !== Number(riderUser.store_id)) {
      throw new BadRequestException('Rider store mismatch.');
    }
    try {
      if (entityType === 'ONLINE') {
        const onlineOrder = await this.prisma.onlineOrder.findUnique({ where: { id: orderId } });
        if (!onlineOrder) throw new NotFoundException('Online delivery not found.');
        await this.prisma.onlineOrder.update({
          where: { id: orderId },
          data: { delivery: deliveryInfo },
        });
      } else {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { delivery_info: deliveryInfo },
        });
      }
      console.log(`[GPS UPDATE] Order #${orderId} -> lat: ${lat}, lng: ${lng}`);
    } catch (error) {
      console.log(
        `[GPS UPDATE - FALLBACK] Delivery #${orderId} -> lat: ${lat}, lng: ${lng}`,
      );
    }

    const storeId = Number(selectedOrder.store_id);
    if (storeId > 0) {
      this.gateway.broadcast('gps_update', {
        orderId,
        entityType,
        entityId: orderId,
        lat,
        lng,
      }, `store_${storeId}`);
    } else {
      this.gateway.broadcast('gps_update', {
        orderId,
        entityType,
        entityId: orderId,
        lat,
        lng,
      });
    }
    return { success: true };
  }

  // Atomic claim lock: whichever rider's request lands first wins. Every
  // other rider's identical request then matches 0 rows in the conditional
  // updateMany (WHERE claimedByRiderId/rider_id IS NULL) and gets a 409 —
  // this is what makes "any online rider can grab any order" safe instead
  // of a client-side race. Mirrors the existing "try OnlineOrder first, fall
  // back to Order" pattern already used by updateRiderGps/getRiderGps above.
  // Order.rider_id (pre-existing) is reused for POS-native delivery orders
  // instead of adding a duplicate column there.
  //
  // Task #2J: `riderId` used to come straight from the request body (client-
  // controlled) — any authenticated caller could claim an order "as" any
  // other rider by just naming a different id in ClaimOrderDto. The claiming
  // identity is now taken exclusively from the verified JWT (`authenticatedUser.sub`,
  // set by JwtAuthGuard). There's no separate Rider profile table in this
  // schema — User.id *is* the rider identity — so this only had to stop
  // trusting the body, not resolve through a different model.
  async claimOrder(id: number, authenticatedUser: any, requestedEntityType?: unknown) {
    const riderId = Number(authenticatedUser?.sub);
    if (!authenticatedUser || !Number.isFinite(riderId) || riderId <= 0) {
      throw new BadRequestException('A valid authenticated rider identity is required.');
    }

    const riderUser = await this.prisma.user.findUnique({
      where: { id: riderId },
      include: { role: true },
    });

    if (!riderUser) {
      throw new BadRequestException('Rider does not exist.');
    }

    if (riderUser.role?.name !== 'Rider') {
      throw new BadRequestException('Authenticated user is not a rider.');
    }

    const entityType = normalizeDeliveryEntityType(requestedEntityType);
    if (requestedEntityType !== undefined && !entityType) {
      throw new BadRequestException('entityType must be ONLINE or POS.');
    }

    let orderStoreId: number | undefined;
    const existingOnlineForVal = entityType === 'POS'
      ? null
      : await this.prisma.onlineOrder.findUnique({ where: { id } });
    const existingPosForVal = entityType === 'ONLINE'
      ? null
      : await this.prisma.order.findUnique({ where: { id } });

    if (existingOnlineForVal && existingPosForVal && !entityType) {
      throw new BadRequestException(
        `Order #${id} exists in both ONLINE and POS namespaces. entityType is required.`,
      );
    }

    const resolvedEntityType: DeliveryEntityType = entityType || (existingOnlineForVal ? 'ONLINE' : 'POS');
    if (existingOnlineForVal && resolvedEntityType === 'ONLINE') {
      // Authoritative Delivery Gate: Only orders in READY state can be claimed
      // by a rider. Pre-kitchen states (PENDING, CONFIRMED, KITCHEN_PREPARING)
      // and terminal states cannot be claimed.
      if (existingOnlineForVal.status !== 'READY') {
        throw new BadRequestException(
          `Cannot claim Order #${id}: only READY orders can be claimed by a rider (current status: ${existingOnlineForVal.status}).`,
        );
      }
      if (existingOnlineForVal.type?.toUpperCase() !== 'DELIVERY') {
        throw new BadRequestException(
          `Cannot claim Order #${id}: only DELIVERY orders can be claimed by a rider (current type: ${existingOnlineForVal.type}).`,
        );
      }
      orderStoreId = existingOnlineForVal.store_id;
    } else {
      if (existingPosForVal) {
        if (existingPosForVal.status !== 'READY') {
          throw new BadRequestException(
            `Cannot claim POS Order #${id}: only READY orders can be claimed by a rider (current status: ${existingPosForVal.status}).`,
          );
        }
        if (existingPosForVal.order_source?.toUpperCase() !== 'DELIVERY') {
          throw new BadRequestException(
            `Cannot claim POS Order #${id}: only DELIVERY orders can be claimed by a rider (current order_source: ${existingPosForVal.order_source}).`,
          );
        }
        orderStoreId = existingPosForVal.store_id;
      }
    }

    if (!orderStoreId) {
      throw new NotFoundException('Order not found.');
    }

    if (riderUser.store_id !== orderStoreId) {
      throw new BadRequestException('Rider store mismatch.');
    }

    // Backend Claim Protection (Findings #5, #6, & #7):
    // A rider cannot claim two active delivery orders concurrently.
    // Wrap active delivery check + claim in an atomic transaction.
    const txRunner = typeof this.prisma.$transaction === 'function'
      ? (cb: (tx: any) => Promise<any>) => this.prisma.$transaction(cb)
      : (cb: (tx: any) => Promise<any>) => cb(this.prisma);

    const { updatedOrder, isPosOrder } = await txRunner(async (tx: any) => {
      // Database-level concurrency lock (Approach B):
      // Acquire an exclusive row lock on the rider's User record.
      // Under PostgreSQL, SELECT ... FOR UPDATE serializes concurrent claim transactions
      // for the SAME rider at the database level, preventing race conditions where two
      // concurrent transactions both observe zero active deliveries before claiming.
      // Different riders lock different User rows, allowing simultaneous claims without contention.
      if (typeof tx.$queryRaw === 'function') {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${riderId} FOR UPDATE`;
      } else if (typeof tx.$executeRaw === 'function') {
        await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${riderId} FOR UPDATE`;
      }

      const terminalStatuses = ['SETTLED', 'CANCELLED'];
      const activeOnlineDelivery = await tx.onlineOrder.findFirst({
        where: {
          claimedByRiderId: riderId,
          status: { notIn: terminalStatuses },
        },
      });
      const linkedOnlineId = resolvedEntityType === 'POS' && existingPosForVal?.order_source?.toUpperCase() === 'ONLINE'
        ? (await tx.onlineOrder.findUnique({ where: { posOrderId: id }, select: { id: true } }))?.id
        : undefined;
      const linkedPosId = resolvedEntityType === 'ONLINE' ? existingOnlineForVal?.posOrderId : undefined;

      if (activeOnlineDelivery && activeOnlineDelivery.id !== id && activeOnlineDelivery.id !== linkedOnlineId) {
        throw new ConflictException(
          `Finish current delivery first: Order #${activeOnlineDelivery.id} is still in progress (${activeOnlineDelivery.status}).`,
        );
      }

      const activePosDelivery = await tx.order.findFirst({
        where: {
          rider_id: riderId,
          status: { notIn: terminalStatuses },
          order_source: { equals: 'DELIVERY', mode: 'insensitive' },
        },
      });
      if (activePosDelivery && activePosDelivery.id !== id && activePosDelivery.id !== linkedPosId) {
        throw new ConflictException(
          `Finish current delivery first: POS Order #${activePosDelivery.id} is still in progress.`,
        );
      }

      const onlineClaim = resolvedEntityType === 'ONLINE'
        ? await tx.onlineOrder.updateMany({
        where: {
          id,
          claimedByRiderId: null,
          status: 'READY',
          type: { equals: 'DELIVERY', mode: 'insensitive' },
          store_id: riderUser.store_id,
        },
        data: { claimedByRiderId: riderId, claimedByRiderName: riderUser.name || null },
      })
        : { count: 0 };
      if (onlineClaim.count > 0) {
        const onlineForTwin = await tx.onlineOrder.findUniqueOrThrow({ where: { id } });
        if (onlineForTwin.posOrderId) {
          await tx.order.updateMany({
            where: { id: onlineForTwin.posOrderId, order_source: { equals: 'ONLINE', mode: 'insensitive' } },
            data: { rider_id: riderId, status: onlineForTwin.status },
          });
        }
        const updated = await tx.onlineOrder.findUniqueOrThrow({
          where: { id },
          include: { posOrder: { select: { business_day_id: true } } },
        });
        return { updatedOrder: updated, isPosOrder: false };
      }

      const existingOnline = resolvedEntityType === 'ONLINE'
        ? await tx.onlineOrder.findUnique({ where: { id } })
        : null;
      if (existingOnline) {
        throw new ConflictException('Already claimed by another rider.');
      }

      const posClaim = resolvedEntityType === 'POS'
        ? await tx.order.updateMany({
        where: {
          id,
          rider_id: null,
          status: 'READY',
          order_source: { equals: 'DELIVERY', mode: 'insensitive' },
          store_id: riderUser.store_id,
        },
        data: { rider_id: riderId },
      })
        : { count: 0 };
      if (posClaim.count > 0) {
        const updated = await tx.order.findUniqueOrThrow({
          where: { id },
          include: { customer: true, items: { include: { product: true } }, rider: true },
        });
        // Task 6A: if this POS Order is the internal twin of a Website OnlineOrder,
        // reverse the claim (rollback rider_id) and reject — the Rider must use the
        // OnlineOrder id so that Website tracking, TV Board, and Rider history all
        // remain under the same customer-facing identity. A successful claim here
        // would create a second accepted delivery record under the wrong id.
        if (updated.order_source === 'ONLINE') {
          const linkedOnline = await tx.onlineOrder.findUnique({
            where: { posOrderId: id },
            select: { id: true },
          });
          if (linkedOnline) {
            // Roll back the rider_id we just wrote — the claim must not stand
            await tx.order.update({
              where: { id },
              data: { rider_id: null },
            });
            throw new BadRequestException(
              `This is an internal kitchen order linked to Website Order #${linkedOnline.id}. ` +
              `Please accept order #${linkedOnline.id} instead.`,
            );
          }
        }
        return { updatedOrder: updated, isPosOrder: true };
      }

      const existingPos = await tx.order.findUnique({ where: { id } });
      if (existingPos) {
        throw new ConflictException('Already claimed by another rider.');
      }

      throw new NotFoundException('Order not found.');
    });

    if (isPosOrder) {
      const formatted = formatPosOrderForRider(updatedOrder);
      this.gateway.broadcast('order_updated', formatted, `store_${updatedOrder.store_id}`);
      return { success: true, order: formatted };
    } else {
      const formatted = formatOnlineOrderForRider(updatedOrder);
      this.gateway.broadcast('order_updated', formatted, `store_${updatedOrder.store_id}`);
      return { success: true, order: formatted };
    }
  }

  // Rider Release / Decline Flow (Delivery Recovery):
  // Allows a rider to voluntarily release (un-claim) an order they already
  // accepted, making it available again for the next available rider.
  //
  // Safety gates:
  //   1. JWT identity   — derived from authenticated JWT sub only; never from request body.
  //   2. Rider existence + role — authenticated sub must resolve to a real User with
  //      role = 'Rider' (mirrors claimOrder guard at line ~215).
  //   3. Store ownership — riderUser.store_id must equal the order's store_id
  //      (Blocker #1 fix: mirrors claimOrder store mismatch check at line ~230).
  //   4. Claim ownership — the authenticated rider must be the one who claimed
  //      the order (claimedByRiderId / rider_id matches riderId).
  //   5. Status gate — release is blocked once cash hand-off is imminent OR the
  //      order has reached a terminal state that must never revert to READY:
  //        Non-releasable: DELIVERED, WAITING_CASH_SETTLEMENT, SETTLED, CANCELLED,
  //                        VOIDED (Blocker #2 fix), COMPLETED (Blocker #2 fix).
  //        Releasable: READY, RIDER_ACCEPTED, RIDER_ARRIVED, PRINT_BILL,
  //                    DISPATCHED, OUT_FOR_DELIVERY.
  //
  // On success: clears claimedByRiderId / rider_id and resets the order
  // status to READY so another rider can claim it normally. A real-time
  // order_updated broadcast fires so the POS, KDS, and any other rider
  // app all see the order become available again immediately.
  async releaseRiderAssignment(id: number, authenticatedUser: any, requestedEntityType?: unknown) {
    const riderId = Number(authenticatedUser?.sub);
    if (!authenticatedUser || !Number.isFinite(riderId) || riderId <= 0) {
      throw new BadRequestException('A valid authenticated rider identity is required.');
    }

    // Blocker #1 fix: load the authoritative rider User record from the database.
    // This mirrors the pattern used in claimOrder (see ~line 215) and is required
    // to: (a) confirm the JWT sub maps to a real, existing user; (b) confirm the
    // user's role is Rider; (c) obtain riderUser.store_id for the store mismatch
    // check below. Trusting only claimedByRiderId is insufficient — an attacker
    // with a valid JWT for a different store could otherwise skip the store gate.
    const riderUser = await this.prisma.user.findUnique({
      where: { id: riderId },
      include: { role: true },
    });
    if (!riderUser) {
      throw new BadRequestException('Rider does not exist.');
    }
    if (riderUser.role?.name !== 'Rider') {
      throw new BadRequestException('Authenticated user is not a rider.');
    }

    // Blocker #2 fix: VOIDED and COMPLETED are added as non-releasable terminal
    // statuses. Without this guard, an order in either terminal state that still
    // held a claimedByRiderId (edge case) would be silently reset to READY —
    // an invalid backward lifecycle transition.
    //
    // Non-releasable statuses (ordered by lifecycle position):
    //   DELIVERED             — food handed to customer; cash hand-off imminent
    //   WAITING_CASH_SETTLEMENT — COD cash is in transit back to cashier
    //   SETTLED               — cashier accepted the cash; fully closed
    //   CANCELLED             — order was cancelled (terminal)
    //   VOIDED                — order was voided (terminal; Blocker #2)
    //   COMPLETED             — order lifecycle complete (terminal; Blocker #2)
    const nonReleasableStatuses = [
      'DELIVERED',
      'WAITING_CASH_SETTLEMENT',
      'SETTLED',
      'CANCELLED',
      'VOIDED',     // Blocker #2: terminal — must never revert to READY
      'COMPLETED',  // Blocker #2: terminal — must never revert to READY
    ];

    const entityType = await this.resolveDeliveryEntityType(id, requestedEntityType);

    // ── Resolve the explicitly selected namespace ───────────────────────
    const onlineOrder = entityType === 'ONLINE'
      ? await this.prisma.onlineOrder.findUnique({ where: { id } })
      : null;
    if (onlineOrder) {
      if (onlineOrder.claimedByRiderId !== riderId) {
        throw new BadRequestException(
          `Cannot release Order #${id}: it is not assigned to you.`,
        );
      }
      // Blocker #1 fix: store mismatch check — mirrors claimOrder line ~230.
      // Prevents a rider from a different store from releasing an order even
      // if they somehow know the order ID.
      if (!riderUser.store_id || riderUser.store_id !== onlineOrder.store_id) {
        throw new BadRequestException('Rider store mismatch.');
      }
      if (nonReleasableStatuses.includes(onlineOrder.status)) {
        // Provide a status-specific message: cash hand-off vs. terminal void/complete.
        const isCashState = ['DELIVERED', 'WAITING_CASH_SETTLEMENT', 'SETTLED'].includes(onlineOrder.status);
        throw new BadRequestException(
          isCashState
            ? `Cannot release Order #${id}: cash hand-off has started (status: ${onlineOrder.status}). Contact your cashier to resolve this order.`
            : `Cannot release Order #${id}: this order is in a terminal state (status: ${onlineOrder.status}) and cannot be released.`,
        );
      }

      const updated = await this.runInTransaction(async (tx: any) => {
        const next = await tx.onlineOrder.update({
          where: { id },
          data: {
            claimedByRiderId: null,
            claimedByRiderName: null,
            status: 'READY',
          },
        });
        if (onlineOrder.posOrderId) {
          await tx.order.updateMany({
            where: { id: onlineOrder.posOrderId, order_source: { equals: 'ONLINE', mode: 'insensitive' } },
            data: { rider_id: null, status: 'READY' },
          });
        }
        return next;
      });

      const formatted = formatOnlineOrderForRider(await this.enrichOnlineOrderEvent(updated));
      this.gateway.broadcast('order_updated', formatted, `store_${updated.store_id}`);
      console.log(`[RIDER RELEASE] Online Order #${id} released by Rider #${riderId} (was ${onlineOrder.status})`);
      return { success: true, orderId: id, entityType: 'ONLINE', orderType: 'ONLINE', previousStatus: onlineOrder.status };
    }

    // ── Fall back to POS Order ───────────────────────────────────────────
    const posOrder = entityType === 'POS' ? await this.prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } }, rider: true },
    }) : null;
    if (posOrder) {
      if (posOrder.rider_id !== riderId) {
        throw new BadRequestException(
          `Cannot release POS Order #${id}: it is not assigned to you.`,
        );
      }
      // Blocker #1 fix: store mismatch check — mirrors claimOrder line ~230.
      if (!riderUser.store_id || riderUser.store_id !== posOrder.store_id) {
        throw new BadRequestException('Rider store mismatch.');
      }
      if (nonReleasableStatuses.includes(posOrder.status)) {
        const isCashState = ['DELIVERED', 'WAITING_CASH_SETTLEMENT', 'SETTLED'].includes(posOrder.status);
        throw new BadRequestException(
          isCashState
            ? `Cannot release POS Order #${id}: cash hand-off has started (status: ${posOrder.status}). Contact your cashier to resolve this order.`
            : `Cannot release POS Order #${id}: this order is in a terminal state (status: ${posOrder.status}) and cannot be released.`,
        );
      }

      const refreshed = await this.runInTransaction(async (tx: any) => {
        await tx.order.update({
          where: { id },
          data: { rider_id: null, status: 'READY' },
        });
        await tx.onlineOrder.updateMany({
          where: { posOrderId: id },
          data: { claimedByRiderId: null, claimedByRiderName: null, riderAssigned: false, status: 'READY' },
        });
        return tx.order.findUniqueOrThrow({
          where: { id },
          include: { customer: true, items: { include: { product: true } }, rider: true },
        });
      });
      const formatted = formatPosOrderForRider(refreshed);
      this.gateway.broadcast('order_updated', formatted, `store_${posOrder.store_id}`);
      console.log(`[RIDER RELEASE] POS Order #${id} released by Rider #${riderId} (was ${posOrder.status})`);
      return { success: true, orderId: id, entityType: 'POS', orderType: 'POS', previousStatus: posOrder.status };
    }

    throw new NotFoundException('Order not found.');
  }

  // Admin / Manager Force-Release Flow (Delivery Recovery):
  // Allows an authorized administrator or store manager (with delivery.dispatch.assign)
  // to voluntarily release a stuck rider assignment from an order, making it available
  // again for other riders.
  //
  // Safety gates:
  //   1. Authenticated identity — derived from JWT sub.
  //   2. Admin user existence & authorization — must be an active User whose role is not 'Rider'.
  //   3. Store isolation — order must belong to the caller's permitted store scope.
  //   4. Rider assignment existence — order must currently have an assigned rider to be force-released.
  //   5. Status gate — terminal states (DELIVERED, WAITING_CASH_SETTLEMENT, SETTLED,
  //      CANCELLED, VOIDED, COMPLETED) can NEVER be force-released back to READY.
  //
  // On success: clears rider assignment, preserves order identity / store / business day,
  // resets status to READY, synchronizes OnlineOrder <-> POS twin, logs audit record,
  // and broadcasts store-scoped order_updated real-time event.
  async adminForceReleaseRiderAssignment(id: number, authenticatedUser: any, requestedEntityType?: unknown) {
    const adminId = Number(authenticatedUser?.sub);
    if (!authenticatedUser || !Number.isFinite(adminId) || adminId <= 0) {
      throw new BadRequestException('A valid authenticated admin identity is required.');
    }

    const adminUser = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: { role: true },
    });
    if (!adminUser) {
      throw new BadRequestException('Admin user does not exist.');
    }
    if (adminUser.role?.name === 'Rider') {
      throw new ForbiddenException('Riders are not authorized to perform admin force-release.');
    }

    const nonReleasableStatuses = [
      'DELIVERED',
      'WAITING_CASH_SETTLEMENT',
      'SETTLED',
      'CANCELLED',
      'VOIDED',
      'COMPLETED',
    ];

    const entityType = await this.resolveDeliveryEntityType(id, requestedEntityType);

    // ── Resolve the explicitly selected namespace ───────────────────────
    const onlineOrder = entityType === 'ONLINE'
      ? await this.prisma.onlineOrder.findUnique({ where: { id } })
      : null;
    if (onlineOrder) {
      // Store isolation check
      const callerStoreId = Number(authenticatedUser.active_store_id) || adminUser.store_id;
      if (adminUser.role?.name !== 'Super Admin' && callerStoreId && callerStoreId !== onlineOrder.store_id) {
        throw new ForbiddenException('You do not have access to this store');
      }

      if (!onlineOrder.claimedByRiderId) {
        throw new BadRequestException(`Order #${id} does not have an assigned rider.`);
      }

      if (nonReleasableStatuses.includes(onlineOrder.status)) {
        const isCashState = ['DELIVERED', 'WAITING_CASH_SETTLEMENT', 'SETTLED'].includes(onlineOrder.status);
        throw new BadRequestException(
          isCashState
            ? `Cannot force-release Order #${id}: cash hand-off has started (status: ${onlineOrder.status}). Contact your cashier to resolve this order.`
            : `Cannot force-release Order #${id}: this order is in a terminal state (status: ${onlineOrder.status}) and cannot be released.`,
        );
      }

      const releasedRiderId = onlineOrder.claimedByRiderId;
      const updated = await this.runInTransaction(async (tx: any) => {
        const next = await tx.onlineOrder.update({
          where: { id },
          data: {
            claimedByRiderId: null,
            claimedByRiderName: null,
            riderAssigned: false,
            status: 'READY',
          },
        });
        if (onlineOrder.posOrderId) {
          await tx.order.updateMany({
            where: { id: onlineOrder.posOrderId, order_source: { equals: 'ONLINE', mode: 'insensitive' } },
            data: { rider_id: null, status: 'READY' },
          });
        }
        return next;
      });

      const formatted = formatOnlineOrderForRider(await this.enrichOnlineOrderEvent(updated));
      this.gateway.broadcast('order_updated', formatted, `store_${updated.store_id}`);
      console.log(`[ADMIN FORCE-RELEASE] Online Order #${id} rider #${releasedRiderId} released by Admin #${adminId} (was ${onlineOrder.status})`);

      if (this.prisma.systemAuditLog) {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'FORCE_RELEASE_RIDER',
            entity: 'OnlineOrder',
            entity_id: id,
            user_id: adminId,
            user_name: adminUser.name,
            details: {
              storeId: onlineOrder.store_id,
              releasedRiderId,
              previousStatus: onlineOrder.status,
              releasedBy: adminUser.name,
            },
          },
        }).catch(() => {});
      }

      return {
        success: true,
        orderId: id,
        entityType: 'ONLINE',
        orderType: 'ONLINE',
        previousStatus: onlineOrder.status,
        releasedRiderId,
      };
    }

    // ── Fall back to POS Order ───────────────────────────────────────────
    const posOrder = entityType === 'POS' ? await this.prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } }, rider: true },
    }) : null;
    if (posOrder) {
      // Store isolation check
      const callerStoreId = Number(authenticatedUser.active_store_id) || adminUser.store_id;
      if (adminUser.role?.name !== 'Super Admin' && callerStoreId && callerStoreId !== posOrder.store_id) {
        throw new ForbiddenException('You do not have access to this store');
      }

      if (!posOrder.rider_id) {
        throw new BadRequestException(`POS Order #${id} does not have an assigned rider.`);
      }

      if (nonReleasableStatuses.includes(posOrder.status)) {
        const isCashState = ['DELIVERED', 'WAITING_CASH_SETTLEMENT', 'SETTLED'].includes(posOrder.status);
        throw new BadRequestException(
          isCashState
            ? `Cannot force-release POS Order #${id}: cash hand-off has started (status: ${posOrder.status}). Contact your cashier to resolve this order.`
            : `Cannot force-release POS Order #${id}: this order is in a terminal state (status: ${posOrder.status}) and cannot be released.`,
        );
      }

      const releasedRiderId = posOrder.rider_id;
      const refreshed = await this.runInTransaction(async (tx: any) => {
        await tx.order.update({
          where: { id },
          data: { rider_id: null, status: 'READY' },
        });
        await tx.onlineOrder.updateMany({
          where: { posOrderId: id },
          data: {
            claimedByRiderId: null,
            claimedByRiderName: null,
            riderAssigned: false,
            status: 'READY',
          },
        });
        return tx.order.findUniqueOrThrow({
          where: { id },
          include: { customer: true, items: { include: { product: true } }, rider: true },
        });
      });
      const formatted = formatPosOrderForRider(refreshed);
      this.gateway.broadcast('order_updated', formatted, `store_${posOrder.store_id}`);
      console.log(`[ADMIN FORCE-RELEASE] POS Order #${id} rider #${releasedRiderId} released by Admin #${adminId} (was ${posOrder.status})`);

      if (this.prisma.systemAuditLog) {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'FORCE_RELEASE_RIDER',
            entity: 'Order',
            entity_id: id,
            user_id: adminId,
            user_name: adminUser.name,
            details: {
              storeId: posOrder.store_id,
              releasedRiderId,
              previousStatus: posOrder.status,
              releasedBy: adminUser.name,
            },
          },
        }).catch(() => {});
      }

      return {
        success: true,
        orderId: id,
        entityType: 'POS',
        orderType: 'POS',
        previousStatus: posOrder.status,
        releasedRiderId,
      };
    }

    throw new NotFoundException('Order not found.');
  }

  async getRiderAvailability(storeIdStr: string) {
    const storeId = Number(storeIdStr);
    if (!storeId) throw new BadRequestException('store_id is required.');

    const onlineRiders = this.gateway.getActiveRidersList(storeId);
    const terminalStatuses = ['SETTLED', 'CANCELLED'];

    const results = await Promise.all(
      onlineRiders.map(async (r) => {
        const activeOnline = await this.prisma.onlineOrder.findFirst({
          where: {
            claimedByRiderId: r.riderId,
            status: { notIn: terminalStatuses },
          },
          select: { id: true, status: true },
        });
        const activePos = await this.prisma.order.findFirst({
          where: {
            rider_id: r.riderId,
            status: { notIn: terminalStatuses },
            order_source: { equals: 'DELIVERY', mode: 'insensitive' },
          },
          select: { id: true, status: true },
        });
        const user = await this.prisma.user.findUnique({
          where: { id: r.riderId },
          select: { id: true, name: true, phone: true },
        });

        const activeOrder = activeOnline || activePos;
        const activeEntityType = activeOnline ? 'ONLINE' : activePos ? 'POS' : null;
        const isBusy = !!activeOrder;
        const loc = typeof this.gateway.getRiderLocation === 'function' ? this.gateway.getRiderLocation(r.riderId) : null;
        return {
          riderId: r.riderId,
          name: user?.name || `Rider #${r.riderId}`,
          phone: user?.phone || '',
          isOnline: r.isOnline,
          isBusy,
          activeOrderId: activeOrder?.id || null,
          activeEntityType,
          activeEntityId: activeOrder?.id || null,
          activeOrderStatus: activeOrder?.status || null,
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
          accuracy: loc?.accuracy ?? null,
          lastSeen: loc?.timestamp ?? r.lastSeen,
        };
      }),
    );

    const availableCount = results.filter((r) => r.isOnline && !r.isBusy).length;
    const busyCount = results.filter((r) => r.isOnline && r.isBusy).length;

    return {
      storeId,
      totalOnline: results.length,
      availableCount,
      busyCount,
      riders: results,
    };
  }

  async getRiderGps(orderId: string, requestedEntityType?: unknown) {
    const id = Number(orderId);
    const entityType = await this.resolveDeliveryEntityType(id, requestedEntityType);
    if (entityType === 'ONLINE') {
      const onlineOrder = await this.prisma.onlineOrder.findUnique({ where: { id } });
      if (onlineOrder?.delivery) return onlineOrder.delivery;
    } else {
      const posOrder = await this.prisma.order.findUnique({ where: { id } });
      if (posOrder?.delivery_info) return posOrder.delivery_info;
    }

    throw new NotFoundException('Location not found');
  }

  // =====================================================================
  // Sprint 29.3 / 29.3A — Admin Delivery Exception Recovery
  // =====================================================================
  // Exception states that qualify for admin recovery:
  //   DISPATCHED + no rider — orphaned dispatch (Sprint 29.3)
  //   PRINT_BILL + no rider — billed order never dispatched (Sprint 29.3A)
  // Both are reset to READY so a rider can claim them normally.
  // =====================================================================

  private static readonly EXCEPTION_STATUSES = ['DISPATCHED', 'PRINT_BILL'] as const;
  private static readonly TERMINAL_STATUSES = [
    'SETTLED', 'DELIVERED', 'CANCELLED',
  ] as const;

  /**
   * Returns OnlineOrders and POS Orders that are in an exception state
   * (DISPATCHED or PRINT_BILL) with no rider assigned, for the given store.
   * Only managers / admins of that store (or Super Admin) may call this.
   */
  async getDeliveryExceptions(storeIdStr: string, callerJwt: any) {
    const storeId = Number(storeIdStr);
    if (!storeId) throw new BadRequestException('store_id is required.');

    // Resolve authoritative caller from DB
    const caller = await this.prisma.user.findUnique({
      where: { id: callerJwt.sub },
      include: { role: true },
    });
    if (!caller) throw new ForbiddenException('Caller not found.');

    const isSuperAdmin = caller.role?.name === 'Super Admin' || callerJwt.role === 'Super Admin';
    if (!isSuperAdmin && Number(caller.store_id) !== storeId) {
      throw new ForbiddenException('Cross-store access denied.');
    }

    // 1. Online orders: either orphaned (PRINT_BILL/DISPATCHED without rider)
    // or active/stale delivery orders that are un-settled
    const onlineExceptions = await this.prisma.onlineOrder.findMany({
      where: {
        store_id: storeId,
        type: { equals: 'DELIVERY', mode: 'insensitive' },
        status: { notIn: ['SETTLED', 'CANCELLED'] },
        OR: [
          { status: { in: [...RiderService.EXCEPTION_STATUSES] }, claimedByRiderId: null },
          { claimedByRiderId: { not: null } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. POS delivery orders: either orphaned or active/stale
    const posExceptions = await this.prisma.order.findMany({
      where: {
        store_id: storeId,
        order_source: { equals: 'DELIVERY', mode: 'insensitive' },
        status: { notIn: ['SETTLED', 'CANCELLED'] },
        OR: [
          { status: { in: [...RiderService.EXCEPTION_STATUSES] }, rider_id: null },
          { rider_id: { not: null } },
        ],
      },
      include: {
        customer: true,
        rider: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const onlineMapped = onlineExceptions.map((o) => ({
      id: o.id,
      entityType: 'ONLINE' as const,
      entityId: o.id,
      onlineOrderId: o.id,
      posOrderId: o.posOrderId ?? null,
      isPos: false,
      status: o.status,
      customer_name: o.customer ?? null,
      customerAddress: o.customerAddress ?? null,
      created_at: o.createdAt,
      riderName: o.claimedByRiderName || (o.claimedByRiderId ? `Rider #${o.claimedByRiderId}` : null),
      isOrphan: o.claimedByRiderId == null,
      exceptionType: o.claimedByRiderId == null 
        ? (o.status === 'DISPATCHED' ? 'DISPATCHED_NO_RIDER' : o.status === 'PRINT_BILL' ? 'PRINT_BILL_NO_RIDER' : `${o.status}_NO_RIDER`)
        : `ACTIVE_DELIVERY (${o.status})`,
    }));

    const posMapped = posExceptions.map((o) => ({
      id: o.id,
      entityType: 'POS' as const,
      entityId: o.id,
      onlineOrderId: null,
      posOrderId: o.id,
      isPos: true,
      status: o.status,
      customer_name: o.customer?.name ?? 'Walk-in',
      customerAddress: o.delivery_address ?? null,
      created_at: o.createdAt,
      riderName: o.rider?.name || (o.rider_id ? `Rider #${o.rider_id}` : null),
      isOrphan: o.rider_id == null,
      exceptionType: o.rider_id == null
        ? (o.status === 'DISPATCHED' ? 'DISPATCHED_NO_RIDER' : o.status === 'PRINT_BILL' ? 'PRINT_BILL_NO_RIDER' : `${o.status}_NO_RIDER`)
        : `ACTIVE_DELIVERY (${o.status})`,
    }));

    // Waiter/table exceptions are intentionally shown in this same clearance
    // queue. Only stale/orphaned table holders are included; a genuinely
    // active current-day waiter order remains a normal occupied table.
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id: storeId, status: 'OPEN' },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const occupiedTables = await this.prisma.restaurantTable.findMany({
      where: { store_id: storeId, status: 'OCCUPIED', current_order_id: { not: null } },
      select: { id: true, label: true, current_order_id: true },
    });
    const occupiedOrderIds = occupiedTables
      .map((table) => table.current_order_id)
      .filter((id): id is number => typeof id === 'number');
    const occupiedOrders = occupiedOrderIds.length === 0
      ? []
      : await this.prisma.order.findMany({
          where: {
            id: { in: occupiedOrderIds },
            store_id: storeId,
            OR: [
              { order_source: { equals: 'WAITER', mode: 'insensitive' } },
              { terminal_session_id: { not: null } },
            ],
          },
          include: { customer: true },
        });
    const occupiedTableByOrder = new Map(
      occupiedTables
        .filter((table) => typeof table.current_order_id === 'number')
        .map((table) => [table.current_order_id as number, table]),
    );
    const waiterMapped = occupiedOrders
      .filter((order) => {
        const oldBusinessDay = Boolean(openDay && order.business_day_id !== openDay.id);
        const oldByAge = new Date(order.createdAt).getTime() < Date.now() - 24 * 60 * 60 * 1000;
        const terminal = ['SETTLED', 'VOIDED', 'CANCELLED', 'COMPLETED'].includes(String(order.status).toUpperCase());
        return oldBusinessDay || oldByAge || terminal;
      })
      .map((order) => {
        const table = occupiedTableByOrder.get(order.id);
        return {
          id: order.id,
          entityType: 'POS' as const,
          entityId: order.id,
          onlineOrderId: null,
          posOrderId: order.id,
          isPos: true,
          source: 'WAITER',
          order_source: order.order_source,
          table_no: table?.label ?? order.table_no ?? null,
          status: order.status,
          customer_name: order.customer?.name ?? 'Walk-in',
          customerAddress: null,
          created_at: order.createdAt,
          riderName: null,
          isOrphan: true,
          clearAction: 'WAITER_CLEAR',
          exceptionType: 'WAITER_TABLE_STALE',
        };
      });

    return [...onlineMapped, ...posMapped, ...waiterMapped].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  /**
   * Permanently settles/completes a delivery order from Admin Delivery Exceptions.
   * Can be used on orphaned or stale in-progress orders (e.g. past days' orders
   * that are blocking riders or no longer active on POS).
   */
  async adminForceSettleDeliveryException(orderId: number, callerJwt: any, reason: string, requestedEntityType?: unknown) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is required for force settling.');
    }

    const caller = await this.prisma.user.findUnique({
      where: { id: callerJwt.sub },
      include: { role: true },
    });
    if (!caller) throw new ForbiddenException('Caller not found.');

    if (caller.role?.name === 'Rider') {
      throw new ForbiddenException('Riders may not force settle delivery exceptions.');
    }

    const entityType = await this.resolveDeliveryEntityType(orderId, requestedEntityType);
    let isPos = entityType === 'POS';
    let order: any = isPos
      ? await this.prisma.order.findUnique({ where: { id: orderId } })
      : await this.prisma.onlineOrder.findUnique({ where: { id: orderId } });

    if (!order) throw new NotFoundException(`Order #${orderId} not found.`);

    const isSuperAdmin = caller.role?.name === 'Super Admin' || callerJwt.role === 'Super Admin';
    if (!isSuperAdmin && Number(caller.store_id) !== Number(order.store_id)) {
      throw new ForbiddenException('Cross-store settlement denied.');
    }

    if (order.status === 'SETTLED' || order.status === 'CANCELLED') {
      throw new BadRequestException(`Order #${orderId} is already ${order.status}.`);
    }

    const previousStatus = order.status;
    const previousRiderId = isPos ? order.rider_id : order.claimedByRiderId;

    await this.runInTransaction(async (tx: any) => {
      if (isPos) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'SETTLED', payment_status: 'PAID' },
        });
        await tx.onlineOrder.updateMany({
          where: { posOrderId: orderId },
          data: { status: 'SETTLED', kdsStatus: 'READY' },
        });
      } else {
        await tx.onlineOrder.update({
          where: { id: orderId },
          data: { status: 'SETTLED', kdsStatus: 'READY' },
        });
        if (order.posOrderId) {
          await tx.order.updateMany({
            where: { id: order.posOrderId, order_source: { equals: 'ONLINE', mode: 'insensitive' } },
            data: { status: 'SETTLED', payment_status: 'PAID' },
          });
        }
      }
    });

    const updatedOrder = isPos
      ? await this.prisma.order.findUnique({ where: { id: orderId } })
      : await this.prisma.onlineOrder.findUnique({ where: { id: orderId } });

    if (this.prisma.systemAuditLog) {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'DELIVERY_EXCEPTION_FORCE_SETTLE',
          entity: isPos ? 'Order' : 'OnlineOrder',
          entity_id: Number(orderId),
          user_id: Number(caller.id),
          user_name: caller.name,
          details: {
            previousStatus,
            newStatus: 'SETTLED',
            previousRiderId,
            reason: reason.trim(),
            settledBy: caller.name || caller.id,
          },
        },
      }).catch(() => {});
    }

    const room = `store_${order.store_id}`;
    const eventOrder = isPos ? updatedOrder : await this.enrichOnlineOrderEvent(updatedOrder);
    this.gateway.broadcast(
      'order_updated',
      isPos ? formatPosOrderForRider(updatedOrder) : formatOnlineOrderForRider(eventOrder),
      room,
    );

    return {
      success: true,
      orderId,
      entityType,
      previousStatus,
      newStatus: 'SETTLED',
      message: `Order #${orderId} has been successfully settled and cleared.`,
    };
  }

  /**
   * Resets a DISPATCHED or PRINT_BILL order (with no assigned rider) back to READY.
   *
   * Safety guarantees:
   * - Server always fetches the current order from DB (never trusts client state).
   * - Checks store scope against the caller's authoritative store_id from DB.
   * - Rejects if a rider is now assigned (concurrent claim).
   * - Rejects terminal states (SETTLED / DELIVERED / CANCELLED).
   * - Uses a WHERE-scoped updateMany as an atomic CAS; fails if the order
   *   changed state between the fetch and the update (optimistic concurrency).
   * - Writes a SystemAuditLog entry and broadcasts order_updated.
   * - POS twin order is synchronized when posOrderId is set.
   */
  async adminRecoverDeliveryException(orderId: number, callerJwt: any, reason: string, requestedEntityType?: unknown) {
    // 1. Validate mandatory reason
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is required for recovery.');
    }

    // 2. Resolve authoritative caller from DB
    const caller = await this.prisma.user.findUnique({
      where: { id: callerJwt.sub },
      include: { role: true },
    });
    if (!caller) throw new ForbiddenException('Caller not found.');

    // 3. Riders may not perform this action
    if (caller.role?.name === 'Rider') {
      throw new ForbiddenException('Riders may not recover delivery exceptions.');
    }

    // 4. Resolve the selected namespace before loading or mutating a row.
    const entityType = await this.resolveDeliveryEntityType(orderId, requestedEntityType);
    const isPos = entityType === 'POS';
    const order: any = isPos
      ? await this.prisma.order.findUnique({ where: { id: orderId } })
      : await this.prisma.onlineOrder.findUnique({ where: { id: orderId } });

    if (!order) throw new NotFoundException(`Order #${orderId} not found.`);

    // 6. Store scope check (Super Admin bypasses)
    const isSuperAdmin = caller.role?.name === 'Super Admin' || callerJwt.role === 'Super Admin';
    if (!isSuperAdmin && Number(caller.store_id) !== Number(order.store_id)) {
      throw new ForbiddenException('Cross-store recovery denied.');
    }

    // 7. Terminal state guard
    if ((RiderService.TERMINAL_STATUSES as readonly string[]).includes(order.status)) {
      throw new BadRequestException(
        `Order #${orderId} is in terminal state '${order.status}' and cannot be recovered.`,
      );
    }

    // 8. Must be an eligible exception state
    if (!(RiderService.EXCEPTION_STATUSES as readonly string[]).includes(order.status)) {
      throw new BadRequestException(
        `Order #${orderId} is in status '${order.status}' which is not an eligible exception state. ` +
        `Eligible states: ${RiderService.EXCEPTION_STATUSES.join(', ')}.`,
      );
    }

    // 9. Rider must still be unassigned
    const riderId = isPos ? order.rider_id : order.claimedByRiderId;
    if (riderId != null) {
      throw new BadRequestException(
        `Order #${orderId} now has a rider assigned. Recovery is no longer needed.`,
      );
    }

    const previousStatus = order.status;

    // 10. Atomic CAS update scoped to the current status + no rider
    //     If another process changed the order between our fetch and this update,
    //     updateMany returns { count: 0 } and we fail safely.
    const updateResult = await this.runInTransaction(async (tx: any) => {
      const result: { count: number } = isPos
        ? await tx.order.updateMany({
          where: { id: orderId, status: previousStatus, rider_id: null },
          data: { status: 'READY' },
        })
        : await tx.onlineOrder.updateMany({
          where: { id: orderId, status: previousStatus, claimedByRiderId: null },
          data: { status: 'READY' },
        });
      if (result.count === 0) return result;

      if (isPos) {
        await tx.onlineOrder.updateMany({
          where: { posOrderId: orderId },
          data: { status: 'READY' },
        });
      } else if (order.posOrderId) {
        await tx.order.updateMany({
          where: { id: order.posOrderId, order_source: { equals: 'ONLINE', mode: 'insensitive' } },
          data: { status: 'READY' },
        });
      }
      return result;
    });

    if (updateResult.count === 0) {
      throw new BadRequestException(
        `Order #${orderId} was modified by another process before recovery could complete. ` +
        `Please refresh and try again.`,
      );
    }

    // 12. Fetch updated order for broadcast
    const updatedOrder = isPos
      ? await this.prisma.order.findUnique({ where: { id: orderId } })
      : await this.prisma.onlineOrder.findUnique({ where: { id: orderId } });

    // 13. SystemAuditLog
    if (this.prisma.systemAuditLog) {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'DELIVERY_EXCEPTION_RESET',
          entity: isPos ? 'Order' : 'OnlineOrder',
          entity_id: Number(orderId),
          user_id: Number(caller.id),
          user_name: caller.name,
          details: {
            previousStatus,
            newStatus: 'READY',
            previousRider: null,
            newRider: null,
            reason: reason.trim(),
            recoveredBy: caller.name || caller.id,
          },
        },
      }).catch(() => {});
    }

    // 14. Real-time broadcast
    const room = `store_${order.store_id}`;
    const eventOrder = isPos ? updatedOrder : await this.enrichOnlineOrderEvent(updatedOrder);
    this.gateway.broadcast(
      'order_updated',
      isPos ? formatPosOrderForRider(updatedOrder) : formatOnlineOrderForRider(eventOrder),
      room,
    );

    return {
      success: true,
      orderId,
      entityType,
      previousStatus,
      newStatus: 'READY',
      isPos,
    };
  }

  /**
   * Clears a stale waiter-terminal order and releases its table. This is kept
   * separate from delivery recovery because a waiter order must never be
   * reset to READY or entered into the rider lifecycle.
   */
  async adminClearWaiterOrder(orderId: number, callerJwt: any, reason: string) {
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new BadRequestException('A valid POS order id is required.');
    }
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is required to clear a waiter order.');
    }

    const caller = await this.prisma.user.findUnique({
      where: { id: callerJwt?.sub },
      include: { role: true },
    });
    if (!caller) throw new ForbiddenException('Caller not found.');
    if (caller.role?.name === 'Rider') {
      throw new ForbiddenException('Riders may not clear waiter orders.');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        store_id: true,
        status: true,
        order_source: true,
        terminal_session_id: true,
        table_no: true,
        business_day_id: true,
        createdAt: true,
      },
    });
    if (!order) throw new NotFoundException(`Order #${orderId} not found.`);

    const isWaiterOrder = String(order.order_source || '').toUpperCase() === 'WAITER'
      || order.terminal_session_id != null;
    if (!isWaiterOrder) {
      throw new BadRequestException(`Order #${orderId} is not a waiter-terminal order.`);
    }

    const isSuperAdmin = caller.role?.name === 'Super Admin' || callerJwt?.role === 'Super Admin';
    if (!isSuperAdmin && Number(caller.store_id) !== Number(order.store_id)) {
      throw new ForbiddenException('Cross-store order clearance denied.');
    }

    const previousStatus = order.status;
    const terminalStatuses = new Set(['SETTLED', 'VOIDED', 'CANCELLED', 'COMPLETED']);
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id: order.store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const staleByBusinessDay = Boolean(openDay && order.business_day_id !== openDay.id);
    const staleByAge = new Date(order.createdAt).getTime() < Date.now() - 24 * 60 * 60 * 1000;
    const terminal = terminalStatuses.has(String(previousStatus).toUpperCase());
    if (!staleByBusinessDay && !staleByAge && !terminal) {
      throw new BadRequestException(
        `Order #${orderId} is an active current-day waiter order and cannot be cleared from this queue.`,
      );
    }

    let tableReleased = 0;
    const result = await this.runInTransaction(async (tx: any) => {
      let updatedOrder = order;
      if (!terminal) {
        const updated = await tx.order.updateMany({
          where: { id: orderId, status: previousStatus },
          data: {
            status: 'VOIDED',
            void_reason: reason.trim(),
            void_approved_by: Number(caller.id),
          },
        });
        if (updated.count === 0) {
          throw new BadRequestException(
            `Order #${orderId} changed before it could be cleared. Please refresh and try again.`,
          );
        }
        updatedOrder = { ...order, status: 'VOIDED' };
        if (tx.kOT?.updateMany) {
          await tx.kOT.updateMany({
            where: { order_id: orderId, status: { not: 'CANCELLED' } },
            data: { status: 'CANCELLED' },
          });
        }
      }

      const released = this.tablesService
        ? await this.tablesService.releaseTableByOrderId(orderId, tx)
        : await tx.restaurantTable.updateMany({
            where: { current_order_id: orderId },
            data: { status: 'AVAILABLE', current_order_id: null },
          });
      tableReleased = released.count ?? 0;
      return updatedOrder;
    });

    if (this.prisma.systemAuditLog) {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'ORDER_CLEARANCE_WAITER_ORDER',
          entity: 'Order',
          entity_id: orderId,
          user_id: Number(caller.id),
          user_name: caller.name,
          details: {
            previousStatus,
            newStatus: result.status,
            tableNo: order.table_no,
            tableReleased,
            reason: reason.trim(),
          },
        },
      }).catch(() => {});
    }

    this.gateway.broadcast(
      'order_voided',
      {
        order_id: orderId,
        entityType: 'POS',
        entityId: orderId,
        order_source: order.order_source,
        status: result.status,
        table_no: order.table_no,
        tableReleased: tableReleased > 0,
      },
      `store_${order.store_id}`,
    );

    return {
      success: true,
      orderId,
      entityType: 'POS' as const,
      previousStatus,
      newStatus: result.status,
      tableReleased: tableReleased > 0,
      message: `Waiter order #${orderId} was cleared and its table was released.`,
    };
  }
}
