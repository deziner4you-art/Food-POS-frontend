import { Controller, Get, Post, Body, Param, Query, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { RequirePermissions, Public } from '../../../common/decorators';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto, CreateSaaSPricingDto, UpdateSaaSPricingDto } from './dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Public()
  @Get('pricing')
  getPricing(@Query('currency') currency?: string) {
    return this.subscriptionService.getPricing(currency);
  }

  @RequirePermissions('system.view')
  @Get('pricing/all')
  getAllPricingRows() {
    return this.subscriptionService.getAllPricingRows();
  }

  @RequirePermissions('system.create')
  @Post('pricing')
  createPricing(@Body() body: CreateSaaSPricingDto) {
    return this.subscriptionService.createPricing(body);
  }

  @RequirePermissions('system.update')
  @Patch('pricing/:id')
  updatePricing(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateSaaSPricingDto) {
    return this.subscriptionService.updatePricing(id, body);
  }

  @RequirePermissions('system.delete')
  @Delete('pricing/:id')
  deletePricing(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.deletePricing(id);
  }

  @Public()
  @Post('onboarding')
  async onboardClient(@Body() body: CreateSubscriptionDto) {
    try {
      return await this.subscriptionService.onboardClient(body);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: 'An account with this phone number already exists.',
        };
      }
      return {
        success: false,
        message: error.message || 'Server error during setup.',
      };
    }
  }

  @RequirePermissions('system.view')
  @Get(':brand_id')
  getSubscription(@Param('brand_id') brand_id: string) {
    return this.subscriptionService.getSubscription(Number(brand_id));
  }

  @RequirePermissions('system.create')
  @Post()
  updateSubscription(@Body() body: UpdateSubscriptionDto) {
    return this.subscriptionService.createOrUpdateSubscription(body);
  }
}
