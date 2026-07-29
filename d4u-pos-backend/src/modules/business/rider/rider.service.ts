import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    const validStatuses = ['READY', 'RIDER_ARRIVED', 'PRINT_BILL', 'DISPATCHED', 'RIDER_ACCEPTED', 'PICKED_UP', 'PAID', 'SETTLED'];

    const onlineWhere: any = {
      status: { in: validStatuses },
      store_id: Number(storeId),
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
        items: { include: { product: true } }
      }
    });

    const formattedPosOrders = posOrders.map(formatPosOrderForRider);

    const allOrders = [...onlineOrders, ...formattedPosOrders].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return allOrders;
  }

  async updateRiderGps(body: any) {
    const orderId = Number(body.orderId);
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    const deliveryInfo = {
      riderId: body.riderId || 'R1',
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
