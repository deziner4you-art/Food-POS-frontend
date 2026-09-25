import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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
