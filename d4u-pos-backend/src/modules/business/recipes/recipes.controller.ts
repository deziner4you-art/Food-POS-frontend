import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // ==========================================
  // Recipe Categories
  // ==========================================
  @RequirePermissions('recipe.recipes.read')
  @Get('categories/:store_id')
  getCategories(@Param('store_id', ParseIntPipe) storeId: number) {
    return this.recipesService.getCategories(storeId);
  }

  @RequirePermissions('recipe.recipes.manage')
  @Post('categories')
  createCategory(@Body() body: { store_id: number; name: string }) {
    return this.recipesService.createCategory(body);
  }

  // ==========================================
  // Recipes
  // ==========================================
  @RequirePermissions('recipe.recipes.read')
  @Get('store/:store_id')
  getRecipes(@Param('store_id', ParseIntPipe) storeId: number) {
    return this.recipesService.getRecipes(storeId);
  }

  @RequirePermissions('recipe.recipes.read')
  @Get(':id')
  getRecipe(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.getRecipe(id);
  }

  @RequirePermissions('recipe.recipes.manage')
  @Post()
  createRecipe(@Body() body: any) {
    return this.recipesService.createRecipe(body);
  }

  @RequirePermissions('recipe.recipes.manage')
  @Patch(':id')
  updateRecipe(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.recipesService.updateRecipe(id, body);
  }

  @RequirePermissions('production.delete')
  @Delete(':id')
  deleteRecipe(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.deleteRecipe(id);
  }

  // ==========================================
  // Recipe Ingredients (Bulk Save)
  // ==========================================
  @RequirePermissions('recipe.recipes.manage')
  @Post(':recipe_id/ingredients')
  saveIngredients(
    @Param('recipe_id', ParseIntPipe) recipeId: number,
    @Body() body: { ingredients: { inventory_id: number; quantity: number; unit: string }[] },
  ) {
    return this.recipesService.saveRecipeIngredients(recipeId, body.ingredients);
  }
}
