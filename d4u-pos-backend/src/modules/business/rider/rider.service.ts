import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { formatPosOrderForRider } from '../../../common/utils/rider-order.util';

@Injectable()
export class RiderService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

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

    const formattedPosOrders = posOrders.map(formatPosOrderForRider);

    const allOrders = [...onlineOrders, ...formattedPosOrders].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return allOrders;
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

    try {
      // Try finding it in OnlineOrder first
      const onlineOrder = await this.prisma.onlineOrder.findUnique({ where: { id: orderId } });
      if (onlineOrder) {
        await this.prisma.onlineOrder.update({
          where: { id: orderId },
          data: { delivery: deliveryInfo },
        });
      } else {
        // Otherwise it's a POS Order
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

    if (body.storeId) {
      this.gateway.broadcast('gps_update', { orderId, lat, lng }, `store_${body.storeId}`);
    } else {
      this.gateway.broadcast('gps_update', { orderId, lat, lng });
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
  async claimOrder(id: number, authenticatedUser: any) {
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

    let orderStoreId: number | undefined;
    const existingOnlineForVal = await this.prisma.onlineOrder.findUnique({ where: { id } });
    if (existingOnlineForVal) {
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
      const existingPosForVal = await this.prisma.order.findUnique({ where: { id } });
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
      if (activeOnlineDelivery && activeOnlineDelivery.id !== id) {
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
      if (activePosDelivery && activePosDelivery.id !== id) {
        throw new ConflictException(
          `Finish current delivery first: POS Order #${activePosDelivery.id} is still in progress.`,
        );
      }

      const onlineClaim = await tx.onlineOrder.updateMany({
        where: {
          id,
          claimedByRiderId: null,
          status: 'READY',
          type: { equals: 'DELIVERY', mode: 'insensitive' },
          store_id: riderUser.store_id,
        },
        data: { claimedByRiderId: riderId, claimedByRiderName: riderUser.name || null },
      });
      if (onlineClaim.count > 0) {
        const updated = await tx.onlineOrder.findUniqueOrThrow({ where: { id } });
        return { updatedOrder: updated, isPosOrder: false };
      }

      const existingOnline = await tx.onlineOrder.findUnique({ where: { id } });
      if (existingOnline) {
        throw new ConflictException('Already claimed by another rider.');
      }

      const posClaim = await tx.order.updateMany({
        where: {
          id,
          rider_id: null,
          status: 'READY',
          order_source: { equals: 'DELIVERY', mode: 'insensitive' },
          store_id: riderUser.store_id,
        },
        data: { rider_id: riderId },
      });
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
      this.gateway.broadcast('order_updated', updatedOrder, `store_${updatedOrder.store_id}`);
      return { success: true, order: updatedOrder };
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
  async releaseRiderAssignment(id: number, authenticatedUser: any) {
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

    // ── Try OnlineOrder first ────────────────────────────────────────────
    const onlineOrder = await this.prisma.onlineOrder.findUnique({ where: { id } });
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

      const updated = await this.prisma.onlineOrder.update({
        where: { id },
        data: {
          claimedByRiderId: null,
          claimedByRiderName: null,
          status: 'READY',
        },
      });

      this.gateway.broadcast('order_updated', updated, `store_${updated.store_id}`);
      console.log(`[RIDER RELEASE] Online Order #${id} released by Rider #${riderId} (was ${onlineOrder.status})`);
      return { success: true, orderId: id, orderType: 'ONLINE', previousStatus: onlineOrder.status };
    }

    // ── Fall back to POS Order ───────────────────────────────────────────
    const posOrder = await this.prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } }, rider: true },
    });
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

      await this.prisma.order.update({
        where: { id },
        data: { rider_id: null, status: 'READY' },
      });
      const refreshed = await this.prisma.order.findUniqueOrThrow({
        where: { id },
        include: { customer: true, items: { include: { product: true } }, rider: true },
      });
      const formatted = formatPosOrderForRider(refreshed);
      this.gateway.broadcast('order_updated', formatted, `store_${posOrder.store_id}`);
      console.log(`[RIDER RELEASE] POS Order #${id} released by Rider #${riderId} (was ${posOrder.status})`);
      return { success: true, orderId: id, orderType: 'POS', previousStatus: posOrder.status };
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
  async adminForceReleaseRiderAssignment(id: number, authenticatedUser: any) {
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

    // ── Try OnlineOrder first ────────────────────────────────────────────
    const onlineOrder = await this.prisma.onlineOrder.findUnique({ where: { id } });
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
      const updated = await this.prisma.onlineOrder.update({
        where: { id },
        data: {
          claimedByRiderId: null,
          claimedByRiderName: null,
          riderAssigned: false,
          status: 'READY',
        },
      });

      // Synchronize linked POS order if bridge exists
      if (onlineOrder.posOrderId) {
        await this.prisma.order.updateMany({
          where: { id: onlineOrder.posOrderId },
          data: {
            rider_id: null,
            status: 'READY',
          },
        });
      }

      this.gateway.broadcast('order_updated', updated, `store_${updated.store_id}`);
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
        orderType: 'ONLINE',
        previousStatus: onlineOrder.status,
        releasedRiderId,
      };
    }

    // ── Fall back to POS Order ───────────────────────────────────────────
    const posOrder = await this.prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } }, rider: true },
    });
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
      await this.prisma.order.update({
        where: { id },
        data: { rider_id: null, status: 'READY' },
      });

      // Synchronize linked OnlineOrder twin if exists
      await this.prisma.onlineOrder.updateMany({
        where: { posOrderId: id },
        data: {
          claimedByRiderId: null,
          claimedByRiderName: null,
          riderAssigned: false,
          status: 'READY',
        },
      });

      const refreshed = await this.prisma.order.findUniqueOrThrow({
        where: { id },
        include: { customer: true, items: { include: { product: true } }, rider: true },
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
        const isBusy = !!activeOrder;
        const loc = typeof this.gateway.getRiderLocation === 'function' ? this.gateway.getRiderLocation(r.riderId) : null;
        return {
          riderId: r.riderId,
          name: user?.name || `Rider #${r.riderId}`,
          phone: user?.phone || '',
          isOnline: r.isOnline,
          isBusy,
          activeOrderId: activeOrder?.id || null,
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

  async getRiderGps(orderId: string) {
    const id = Number(orderId);
    const onlineOrder = await this.prisma.onlineOrder.findUnique({
      where: { id },
    });

    if (onlineOrder && onlineOrder.delivery) {
      return onlineOrder.delivery;
    }

    const posOrder = await this.prisma.order.findUnique({
      where: { id }
    });

    if (posOrder && posOrder.delivery_info) {
      return posOrder.delivery_info;
    }

    throw new NotFoundException('Location not found');
  }
}
