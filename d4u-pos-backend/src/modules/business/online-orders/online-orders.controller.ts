import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { OnlineOrdersService } from './online-orders.service';

@Controller('online-orders')
export class OnlineOrdersController {
  constructor(private readonly service: OnlineOrdersService) {}

  @Get()
  getOrders(
    @Query('phone') phone?: string,
    @Query('store_id') store_id?: string,
  ) {
    if (phone) {
      return this.service.getOrdersByPhone(phone);
    }
    return this.service.getAllOnlineOrders(
      store_id ? Number(store_id) : undefined,
    );
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.service.getOrder(Number(id));
  }

  @Post()
  createOrder(@Body() body: any) {
    return this.service.createOrder(body);
  }

  @Patch(':id')
  updateOrderStatus(@Param('id') id: string, @Body() body: any) {
    return this.service.updateOrderStatus(Number(id), body);
  }

  @Post(':id/feedback')
  postFeedback(@Param('id') id: string, @Body() body: any) {
    return this.service.postFeedback(Number(id), body.rating, body.comment);
  }

  @Delete(':id')
  acceptOnlineOrder(@Param('id') id: string) {
    return this.service.acceptOnlineOrder(Number(id));
  }
}
