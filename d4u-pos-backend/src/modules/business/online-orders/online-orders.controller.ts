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
import {
  CreateOnlineOrderDto,
  UpdateOnlineOrderStatusDto,
  PostFeedbackDto,
} from './dto';

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
  createOrder(@Body() body: CreateOnlineOrderDto) {
    return this.service.createOrder(body);
  }

  @Patch(':id')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOnlineOrderStatusDto,
  ) {
    return this.service.updateOrderStatus(Number(id), body);
  }

  @Post(':id/feedback')
  postFeedback(@Param('id') id: string, @Body() body: PostFeedbackDto) {
    return this.service.postFeedback(
      Number(id),
      body.rating as any,
      body.comment as any,
    );
  }

  @Delete(':id')
  acceptOnlineOrder(@Param('id') id: string) {
    return this.service.acceptOnlineOrder(Number(id));
  }
}
