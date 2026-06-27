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

  // GET /online-orders
  @Get('online-orders')
  async getOnlineOrders(@Query('phone') phone?: string) {
    if (phone) {
      return this.prismaService.onlineOrder.findMany({
        where: { customerPhone: phone },
        orderBy: { id: 'desc' },
      });
    } else {
      return this.prismaService.onlineOrder.findMany({
        where: { status: 'PENDING' },
        orderBy: { id: 'desc' },
      });
    }
  }

  // POST /online-orders (Website submits order here)
  @Post('online-orders')
  async createOnlineOrder(@Body() body: any) {
    const order = await this.prismaService.onlineOrder.create({
      data: {
        customer: body.customer || 'Online Guest',
        customerPhone: body.customerPhone || '',
        customerAddress: body.customerAddress || 'No Address Provided',
        items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
        totalAmount: String(body.totalAmount || '0.00'),
        source: body.source || 'Website',
        notes: body.notes || '',
        status: 'PENDING',
        kdsStatus: 'PENDING',
        type: 'Online',
        timePlaced: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
    });

    // Update orderId to equal the generated id (as expected by frontend tracker)
    const updatedOrder = await this.prismaService.onlineOrder.update({
      where: { id: order.id },
      data: { orderId: order.id },
    });

    console.log(`[NEW ORDER] #${updatedOrder.id} — ${updatedOrder.items}`);
    this.appGateway.broadcast('new_order', updatedOrder);

    return { success: true, order: updatedOrder };
  }

  // GET /online-orders/:id
  @Get('online-orders/:id')
  async getOnlineOrder(@Param('id') id: string) {
    const order = await this.prismaService.onlineOrder.findUnique({
      where: { id: Number(id) },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  // PATCH /online-orders/:id
  @Patch('online-orders/:id')
  async updateOnlineOrder(@Param('id') id: string, @Body() body: any) {
    // Sanitise incoming body to only keys that exist in model or handle dynamic properties
    const data: any = {};
    const allowedKeys = [
      'orderId',
      'status',
      'kdsStatus',
      'type',
      'source',
      'customer',
      'customerPhone',
      'customerAddress',
      'items',
      'totalAmount',
      'notes',
      'prepTimeMinutes',
      'estimatedReadyAt',
      'timePlaced',
      'riderAssigned',
      'feedback',
      'delivery',
    ];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        data[key] = body[key];
      }
    }

    try {
      const updated = await this.prismaService.onlineOrder.update({
        where: { id: Number(id) },
        data,
      });

      console.log(`[STATUS UPDATE] Order #${id} → kdsStatus: ${updated.kdsStatus}`);
      this.appGateway.broadcast('order_updated', updated);

      return { success: true, order: updated };
    } catch (error) {
      throw new NotFoundException('Order not found or update failed');
    }
  }

  // POST /online-orders/:id/feedback
  @Post('online-orders/:id/feedback')
  async submitFeedback(@Param('id') id: string, @Body() body: any) {
    try {
      const updated = await this.prismaService.onlineOrder.update({
        where: { id: Number(id) },
        data: {
          feedback: {
            rating: body.rating || 5,
            comment: body.comment || '',
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.log(`[FEEDBACK] Order #${id} — Rating: ${body.rating}`);
      return { success: true, order: updated };
    } catch (error) {
      throw new NotFoundException('Order not found');
    }
  }

  // DELETE /online-orders/:id (POS accepts order)
  @Delete('online-orders/:id')
  async acceptOnlineOrder(@Param('id') id: string) {
    try {
      const updated = await this.prismaService.onlineOrder.update({
        where: { id: Number(id) },
        data: { status: 'ACCEPTED', kdsStatus: 'ACCEPTED' },
      });

      console.log(`[ACCEPTED] Order #${id}`);
      this.appGateway.broadcast('order_updated', updated);

      return { success: true };
    } catch (error) {
      throw new NotFoundException('Order not found');
    }
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
