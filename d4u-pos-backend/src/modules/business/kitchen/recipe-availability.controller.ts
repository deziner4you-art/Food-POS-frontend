import { Controller, Get, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { RecipeAvailabilityService } from './recipe-availability.service';

@Controller('kitchen/availability')
export class RecipeAvailabilityController {
  constructor(private readonly service: RecipeAvailabilityService) {}

  @RequirePermissions('recipe.recipes.read')
  @Get('product/:id')
  checkProduct(@Param('id') id: string) {
    return this.service.checkProduct(Number(id));
  }

  @RequirePermissions('recipe.recipes.read')
  @Get('store')
  checkStore(@Query('store_id') store_id: string) {
    return this.service.checkStore(Number(store_id));
  }

  @RequirePermissions('recipe.recipes.read')
  @Get('unavailable')
  unavailable(@Query('store_id') store_id: string) {
    return this.service.getUnavailableProducts(Number(store_id));
  }
}
