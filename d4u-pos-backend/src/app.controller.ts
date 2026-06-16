import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';

// In-memory online order queue (persists while backend is running)
const onlineOrderQueue: any[] = [];
let nextOrderId = 1001;

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Website submits order here
  @Post('online-orders')
  createOnlineOrder(@Body() body: any) {
    const order = {
      id: nextOrderId++,
      orderId: nextOrderId,
      customer: body.customer || 'Guest',
      items: body.items || '',
      totalAmount: body.totalAmount || 0,
      source: body.source || 'Website',
      type: 'Online',
      status: 'PENDING',
      timePlaced: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      notes: body.notes || '',
    };
    onlineOrderQueue.push(order);
    return { success: true, order };
  }

  // POS polls this to get pending online orders
  @Get('online-orders')
  getOnlineOrders() {
    return onlineOrderQueue.filter(o => o.status === 'PENDING');
  }

  // POS accepts an order (removes from queue)
  @Delete('online-orders/:id')
  acceptOnlineOrder(@Param('id') id: string) {
    const idx = onlineOrderQueue.findIndex(o => o.id === Number(id));
    if (idx > -1) onlineOrderQueue[idx].status = 'ACCEPTED';
    return { success: true };
  }
}
