import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // Recipe Categories
  // ==========================================
  async getCategories(store_id: number) {
    return this.prisma.recipeCategory.findMany({
      where: { store_id },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: { store_id: number; name: string }) {
    return this.prisma.recipeCategory.create({
      data,
    });
  }

  // ==========================================
  // Recipes
  // ==========================================
  async getRecipes(store_id: number) {
    return this.prisma.recipe.findMany({
      where: { store_id },
      include: {
        category: true,
        ingredients: {
          include: {
            inventory: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRecipe(id: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        category: true,
        ingredients: {
          include: {
            inventory: true,
          },
        },
      },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async createRecipe(data: any) {
    return this.prisma.recipe.create({
      data: {
        store_id: data.store_id,
        category_id: data.category_id || null,
        name: data.name,
        yield: data.yield || 1,
        portion_size: data.portion_size,
        waste_percentage: data.waste_percentage || 0,
        prep_time_mins: data.prep_time_mins || 0,
        instructions: data.instructions,
      },
    });
  }

  async updateRecipe(id: number, data: any) {
    return this.prisma.recipe.update({
      where: { id },
      data: {
        category_id: data.category_id,
        name: data.name,
        yield: data.yield,
        portion_size: data.portion_size,
        waste_percentage: data.waste_percentage,
        prep_time_mins: data.prep_time_mins,
        instructions: data.instructions,
      },
    });
  }

  async deleteRecipe(id: number) {
    return this.prisma.recipe.delete({
      where: { id },
    });
  }

  // ==========================================
  // Recipe Ingredients (Bulk Save)
  // ==========================================
  async saveRecipeIngredients(
    recipe_id: number,
    ingredients: { inventory_id: number; quantity: number; unit: string }[],
  ) {
    return this.prisma
      .$transaction(async (tx) => {
        // Clear old ingredients
        await tx.recipeIngredient.deleteMany({
          where: { recipe_id },
        });

        // Insert new ones
        if (ingredients.length > 0) {
          await tx.recipeIngredient.createMany({
            data: ingredients.map((i) => ({
              recipe_id,
              inventory_id: i.inventory_id,
              quantity: i.quantity,
              unit: i.unit,
            })),
          });
        }
        return { success: true };
      })
      .then(async (res) => {
        await this.recalculateDependentProducts(recipe_id);
        return res;
      });
  }

  // ==========================================
  // Dynamic Costing Engine
  // ==========================================
  async recalculateDependentProducts(recipe_id: number) {
    // 1. Calculate the total cost of the recipe
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipe_id },
      include: { ingredients: { include: { inventory: true } } },
    });

    if (!recipe) return;

    let totalRecipeCost = 0;
    for (const item of recipe.ingredients) {
      const unitPrice = item.inventory?.unit_price || 0;
      totalRecipeCost += unitPrice * item.quantity;
    }
    
    // Adjust for waste and yield if necessary
    // Example: Actual Cost = (Total Ingredient Cost / Yield) * (1 + Waste%)
    // Keeping it simple for now, as standard cost is usually just sum of ingredients.
    const effectiveCost = totalRecipeCost; // can be enhanced based on rules

    // 2. Find all products that use this recipe
    const products = await this.prisma.product.findMany({
      where: { recipe_id: recipe_id },
    });

    // 3. Update all these products
    for (const product of products) {
      const margin_pct = product.price > 0
          ? ((product.price - effectiveCost) / product.price) * 100
          : 0;

      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          cost: effectiveCost,
          margin_pct: margin_pct,
        },
      });
    }

    return { totalRecipeCost, updatedProductsCount: products.length };
  }
}
