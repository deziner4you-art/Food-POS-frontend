import { Controller, Get, Post, Patch, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AppGateway } from './app.gateway';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
    private readonly appGateway: AppGateway,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // POST /rider/gps
  @Post('rider/gps')
  async updateRiderGps(@Body() body: any) {
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
      await this.prismaService.onlineOrder.update({
        where: { id: orderId },
        data: { delivery: deliveryInfo },
      });
      console.log(`[GPS UPDATE] Order #${orderId} -> lat: ${lat}, lng: ${lng}`);
    } catch (error) {
      // Fallback: order might not be in DB or not found. That's fine, we still broadcast the live coordinates
      console.log(`[GPS UPDATE - FALLBACK] Delivery #${orderId} -> lat: ${lat}, lng: ${lng}`);
    }

    this.appGateway.broadcast('gps_update', { orderId, lat, lng });
    return { success: true };
  }

  // GET /rider/gps/:orderId
  @Get('rider/gps/:orderId')
  async getRiderGps(@Param('orderId') orderId: string) {
    const order = await this.prismaService.onlineOrder.findUnique({
      where: { id: Number(orderId) },
    });

    if (order && order.delivery) {
      return order.delivery;
    }
    throw new NotFoundException('Location not found');
  }

  // POST /dispatch-order
  @Post('dispatch-order')
  async dispatchOrder(@Body() body: any) {
    const bridgeId = Number(body.bridgeOrderId);
    let order: any = null;

    try {
      order = await this.prismaService.onlineOrder.findUnique({
        where: { id: bridgeId },
      });
    } catch (e) {}

    if (!order && body.order) {
      try {
        order = await this.prismaService.onlineOrder.create({
          data: {
            id: bridgeId,
            orderId: Number(body.order.id),
            status: 'DISPATCHED',
            kdsStatus: 'DISPATCHED',
            type: 'Delivery',
            source: 'POS',
            customer: body.order.customer || 'Guest',
            customerAddress: body.order.address || 'Address',
            items: body.order.items ? body.order.items.map((i: any) => `${i.qty}x ${i.name}`).join(', ') : '',
            totalAmount: String(body.order.cod || 0),
            riderAssigned: true,
            timePlaced: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          },
        });
      } catch (err) {
        console.error('[DISPATCH CREATE ERROR]', err);
      }
    } else if (order) {
      order = await this.prismaService.onlineOrder.update({
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
      this.appGateway.broadcast('order_updated', order);
      return { success: true, order };
    } else {
      throw new NotFoundException('Order not found in bridge');
    }
  }

  // GET /rider-orders
  @Get('rider-orders')
  async getRiderOrders() {
    return this.prismaService.onlineOrder.findMany({
      where: {
        status: {
          in: ['DISPATCHED', 'RIDER_ACCEPTED', 'PICKED_UP', 'PAID'],
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  // POST /settle-order/:id
  @Post('settle-order/:id')
  async settleOrder(@Param('id') id: string) {
    try {
      const updated = await this.prismaService.onlineOrder.update({
        where: { id: Number(id) },
        data: { status: 'SETTLED', kdsStatus: 'SETTLED' },
      });

      console.log(`[SETTLED] Order #${id} cash collected by POS`);
      this.appGateway.broadcast('order_updated', updated);

      return { success: true, order: updated };
    } catch (error) {
      throw new NotFoundException('Order not found');
    }
  }
}
