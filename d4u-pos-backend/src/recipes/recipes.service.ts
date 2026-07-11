import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async getRecipeForProduct(product_id: number) {
    return this.prisma.recipeIngredient.findMany({
      where: { product_id },
      include: { inventory: true },
    });
  }

  async addIngredientToRecipe(data: { product_id: number; inventory_id: number; quantity: number; unit: string }) {
    const item = await this.prisma.recipeIngredient.create({
      data,
    });
    await this.recalculateProductCost(data.product_id);
    return item;
  }

  async removeIngredientFromRecipe(id: number) {
    const item = await this.prisma.recipeIngredient.delete({
      where: { id },
    });
    await this.recalculateProductCost(item.product_id);
    return item;
  }

  async saveRecipeBulk(product_id: number, ingredients: { inventory_id: number; quantity: number; unit: string }[]) {
    return this.prisma.$transaction(async (tx) => {
      // Clear old recipe
      await tx.recipeIngredient.deleteMany({
        where: { product_id }
      });
      
      // Insert new ones
      if (ingredients.length > 0) {
        await tx.recipeIngredient.createMany({
          data: ingredients.map(i => ({
            product_id,
            inventory_id: i.inventory_id,
            quantity: i.quantity,
            unit: i.unit
          }))
        });
      }
      return { success: true };
    }).then(async (res) => {
      await this.recalculateProductCost(product_id);
      return res;
    });
  }

  // Dynamic Costing Engine
  async recalculateProductCost(product_id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: product_id },
      include: { recipeItems: { include: { inventory: true } } },
    });

    if (!product) return;

    let totalCost = 0;

    for (const recipeItem of product.recipeItems) {
      // Use the unit_price directly from the inventory item
      const unitPrice = recipeItem.inventory?.unit_price || 0;
      totalCost += (unitPrice * recipeItem.quantity);
    }

    // Update Product Cost and Margin
    const margin_pct = product.price > 0 ? ((product.price - totalCost) / product.price) * 100 : 0;

    await this.prisma.product.update({
      where: { id: product_id },
      data: {
        cost: totalCost,
        margin_pct: margin_pct,
      }
    });

    return { totalCost, margin_pct };
  }
}
