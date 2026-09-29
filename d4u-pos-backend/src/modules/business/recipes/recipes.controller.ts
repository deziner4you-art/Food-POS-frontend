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
import { RequireModule, RequirePermissions, CurrentUser } from '../../../common/decorators';
import { assertTenantStoreAccess } from '../../../common/utils/tenant.util';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { RecipesService } from './recipes.service';

@Controller('recipes')
@RequireModule('RECIPES')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly prisma: PrismaService,
  ) {}

  private async authorizeRecipe(user: any, id: number) {
    const recipe = await this.recipesService.getRecipe(id);
    await assertTenantStoreAccess(this.prisma, user, recipe.store_id);
    return recipe;
  }

  // ==========================================
  // Recipe Categories
  // ==========================================
  @RequirePermissions('recipe.recipes.read')
  @Get('categories/:store_id')
  async getCategories(@CurrentUser() user: any, @Param('store_id', ParseIntPipe) storeId: number) {
    await assertTenantStoreAccess(this.prisma, user, storeId);
    return this.recipesService.getCategories(storeId);
  }

  @RequirePermissions('recipe.recipes.manage')
  @Post('categories')
  async createCategory(@CurrentUser() user: any, @Body() body: { store_id: number; name: string }) {
    await assertTenantStoreAccess(this.prisma, user, body.store_id);
    return this.recipesService.createCategory(body);
  }

  // ==========================================
  // Recipes
  // ==========================================
  @RequirePermissions('recipe.recipes.read')
  @Get('store/:store_id')
  async getRecipes(@CurrentUser() user: any, @Param('store_id', ParseIntPipe) storeId: number) {
    await assertTenantStoreAccess(this.prisma, user, storeId);
    return this.recipesService.getRecipes(storeId);
  }

  @RequirePermissions('recipe.recipes.read')
  @Get(':id')
  getRecipe(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.authorizeRecipe(user, id);
  }

  @RequirePermissions('recipe.recipes.manage')
  @Post()
  async createRecipe(@CurrentUser() user: any, @Body() body: any) {
    await assertTenantStoreAccess(this.prisma, user, body.store_id);
    return this.recipesService.createRecipe(body);
  }

  @RequirePermissions('recipe.recipes.manage')
  @Patch(':id')
  async updateRecipe(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    await this.authorizeRecipe(user, id);
    return this.recipesService.updateRecipe(id, body);
  }

  @RequirePermissions('production.delete')
  @Delete(':id')
  async deleteRecipe(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    await this.authorizeRecipe(user, id);
    return this.recipesService.deleteRecipe(id);
  }

  // ==========================================
  // Recipe Ingredients (Bulk Save)
  // ==========================================
  @RequirePermissions('recipe.recipes.manage')
  @Post(':recipe_id/ingredients')
  saveIngredients(
    @CurrentUser() user: any,
    @Param('recipe_id', ParseIntPipe) recipeId: number,
    @Body() body: { ingredients: { inventory_id: number; quantity: number; unit: string }[] },
  ) {
    return this.authorizeRecipe(user, recipeId).then(() =>
      this.recipesService.saveRecipeIngredients(recipeId, body.ingredients),
    );
  }
}
