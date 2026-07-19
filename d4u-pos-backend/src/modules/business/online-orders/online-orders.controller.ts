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
import { RequirePermissions } from '../../../common/decorators';
import { OnlineOrdersService } from './online-orders.service';
import {
  CreateOnlineOrderDto,
  UpdateOnlineOrderStatusDto,
  PostFeedbackDto,
} from './dto';

@Controller('online-orders')
export class OnlineOrdersController {
  constructor(private readonly service: OnlineOrdersService) {}

  @RequirePermissions('sales.view')
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

  @RequirePermissions('sales.view')
  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.service.getOrder(Number(id));
  }

  @RequirePermissions('sales.create')
  @Post()
  createOrder(@Body() body: CreateOnlineOrderDto) {
    return this.service.createOrder(body);
  }

  @RequirePermissions('sales.update')
  @Patch(':id')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOnlineOrderStatusDto,
  ) {
    return this.service.updateOrderStatus(Number(id), body);
  }

  @RequirePermissions('sales.create')
  @Post(':id/feedback')
  postFeedback(@Param('id') id: string, @Body() body: PostFeedbackDto) {
    return this.service.postFeedback(
      Number(id),
      body.rating as any,
      body.comment as any,
    );
  }

  @RequirePermissions('sales.delete')
  @Delete(':id')
  acceptOnlineOrder(@Param('id') id: string) {
    return this.service.acceptOnlineOrder(Number(id));
  }
}
