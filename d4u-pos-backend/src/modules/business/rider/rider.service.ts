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
        in: ['READY', 'RIDER_ARRIVED', 'PRINT_BILL', 'DISPATCHED', 'RIDER_ACCEPTED', 'PICKED_UP', 'PAID'],
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

    if (body.storeId) {
      this.gateway.broadcast('gps_update', { orderId, lat, lng }, `store_${body.storeId}`);
    } else {
      this.gateway.broadcast('gps_update', { orderId, lat, lng });
    }
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

}
