import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get('product/:product_id')
  getRecipe(@Param('product_id', ParseIntPipe) productId: number) {
    return this.recipesService.getRecipeForProduct(productId);
  }

  @Post()
  addIngredient(@Body() body: { product_id: number; inventory_id: number; quantity: number; unit: string }) {
    return this.recipesService.addIngredientToRecipe(body);
  }

  @Post('bulk/:product_id')
  saveBulk(
    @Param('product_id', ParseIntPipe) productId: number,
    @Body() body: { ingredients: { inventory_id: number; quantity: number; unit: string }[] }
  ) {
    return this.recipesService.saveRecipeBulk(productId, body.ingredients);
  }

  @Delete(':id')
  removeIngredient(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.removeIngredientFromRecipe(id);
  }

  @Post('recalculate/:product_id')
  recalculateCost(@Param('product_id', ParseIntPipe) productId: number) {
    return this.recipesService.recalculateProductCost(productId);
  }
}
