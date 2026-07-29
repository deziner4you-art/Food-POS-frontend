import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { InventoryLockService } from './inventory-lock.service';

export interface ProductAvailability {
  product_id: number;
  product_name: string;
  available: boolean;
  maxUnits: number | null; // null = unlimited (no recipe attached, stock isn't tracked for it)
  limitingIngredient: string | null;
}

/**
 * "Can this be made right now?" — the pre-flight check that never existed
 * before (inventory.service.ts only ever deducted post-hoc/best-effort, see
 * research notes). Locked items (InventoryLock, is_active) count as zero
 * stock regardless of their real InventoryItem.quantity, so a manager 86'ing
 * an ingredient immediately reflects in availability everywhere.
 */
@Injectable()
export class RecipeAvailabilityService {
  constructor(
    private prisma: PrismaService,
    private inventoryLockService: InventoryLockService,
  ) {}

  async checkProduct(product_id: number): Promise<ProductAvailability> {
    const product = await this.prisma.product.findUnique({
      where: { id: product_id },
      include: { recipe: { include: { ingredients: { include: { inventory: true } } } } },
    });
    if (!product) {
      return { product_id, product_name: 'Unknown', available: false, maxUnits: 0, limitingIngredient: 'Product not found' };
    }
    if (!product.recipe || product.recipe.ingredients.length === 0) {
      // No recipe attached — stock isn't tracked for this product, so it's always "available" from a KDS standpoint.
      return { product_id, product_name: product.name, available: true, maxUnits: null, limitingIngredient: null };
    }

    let maxUnits = Infinity;
    let limitingIngredient: string | null = null;

    for (const ingredient of product.recipe.ingredients) {
      const locked = await this.inventoryLockService.isLocked(ingredient.inventory_id);
      const availableQty = locked ? 0 : ingredient.inventory.quantity;
      const possibleUnits = ingredient.quantity > 0 ? Math.floor(availableQty / ingredient.quantity) : Infinity;
      if (possibleUnits < maxUnits) {
        maxUnits = possibleUnits;
        limitingIngredient = locked ? `${ingredient.inventory.name} (locked)` : ingredient.inventory.name;
      }
    }

    const resolvedMax = maxUnits === Infinity ? null : Math.max(0, maxUnits);
    return {
      product_id,
      product_name: product.name,
      available: resolvedMax === null || resolvedMax > 0,
      maxUnits: resolvedMax,
      limitingIngredient: resolvedMax !== null && resolvedMax <= 0 ? limitingIngredient : null,
    };
  }

  /** Every recipe-backed, active product for a store — the "what should we 86 right now" view. */
  async checkStore(store_id: number): Promise<ProductAvailability[]> {
    const products = await this.prisma.product.findMany({
      where: { store_id, is_active: true, recipe_id: { not: null } },
      select: { id: true },
    });
    const results: ProductAvailability[] = [];
    for (const p of products) {
      results.push(await this.checkProduct(p.id));
    }
    return results;
  }

  /** Just the currently-unavailable ones — the practical "auto-86 candidates" list for a kitchen dashboard. */
  async getUnavailableProducts(store_id: number): Promise<ProductAvailability[]> {
    const all = await this.checkStore(store_id);
    return all.filter((p) => !p.available);
  }
}
