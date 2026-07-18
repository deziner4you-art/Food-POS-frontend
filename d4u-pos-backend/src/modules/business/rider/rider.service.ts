import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';

@Injectable()
export class RiderService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  async getRiderOrders(storeId?: string) {
    const whereClause: any = {
      status: {
        in: ['DISPATCHED', 'RIDER_ACCEPTED', 'PICKED_UP', 'PAID'],
      },
    };
    if (storeId) {
      whereClause.store_id = Number(storeId);
    }

    return this.prisma.onlineOrder.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
    });
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
      await this.prisma.onlineOrder.update({
        where: { id: orderId },
        data: { delivery: deliveryInfo },
      });
      console.log(`[GPS UPDATE] Order #${orderId} -> lat: ${lat}, lng: ${lng}`);
    } catch (error) {
      console.log(
        `[GPS UPDATE - FALLBACK] Delivery #${orderId} -> lat: ${lat}, lng: ${lng}`,
      );
    }

    this.gateway.broadcast('gps_update', { orderId, lat, lng });
    return { success: true };
  }

  async getRiderGps(orderId: string) {
    const order = await this.prisma.onlineOrder.findUnique({
      where: { id: Number(orderId) },
    });

    if (order && order.delivery) {
      return order.delivery;
    }
    throw new NotFoundException('Location not found');
  }

  async dispatchOrder(body: any) {
    const bridgeId = Number(body.bridgeOrderId);
    let order: any = null;

    try {
      order = await this.prisma.onlineOrder.findUnique({
        where: { id: bridgeId },
      });
    } catch (e) {}

    if (!order && body.order) {
      try {
        order = await this.prisma.onlineOrder.create({
          data: {
            id: bridgeId,
            orderId: Number(body.order.id),
            status: 'DISPATCHED',
            kdsStatus: 'DISPATCHED',
            type: 'Delivery',
            source: 'POS',
            customer: body.order.customer || 'Guest',
            customerAddress: body.order.address || 'Address',
            items: body.order.items
              ? body.order.items
                  .map((i: any) => `${i.qty}x ${i.name}`)
                  .join(', ')
              : '',
            totalAmount: String(body.order.cod || 0),
            riderAssigned: true,
            timePlaced: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        });
      } catch (err) {
        console.error('[DISPATCH CREATE ERROR]', err);
      }
    } else if (order) {
      order = await this.prisma.onlineOrder.update({
        where: { id: bridgeId },
        data: {
          status: 'DISPATCHED',
          kdsStatus: 'DISPATCHED',
          riderAssigned: true,
        },
      });
    }

    if (order) {
      console.log(`[DISPATCHED] Order #${order.id} sent to Rider`);
      this.gateway.broadcast('order_updated', order);
      return { success: true, order };
    } else {
      throw new NotFoundException('Order not found in bridge');
    }
  }

  async settleOrder(id: string) {
    try {
      const updated = await this.prisma.onlineOrder.update({
        where: { id: Number(id) },
        data: { status: 'SETTLED', kdsStatus: 'SETTLED' },
      });

      console.log(`[SETTLED] Order #${id} cash collected by POS`);
      this.gateway.broadcast('order_updated', updated);

      return { success: true, order: updated };
    } catch (error) {
      throw new NotFoundException('Order not found');
    }
  }
}
