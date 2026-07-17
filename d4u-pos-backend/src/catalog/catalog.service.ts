import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // POS SYNC (STORE-SPECIFIC)
  // -------------------------------------------------------------
  async syncCatalogForPos(store_id: number) {
    // A store should see categories that are:
    // 1. Explicitly assigned to this store OR
    // 2. Belong to a Menu assigned to this store OR
    // 3. Created by this store (store_id)
    const categories = await this.prisma.category.findMany({
      where: {
        OR: [
          { store_id },
          { assigned_stores: { some: { id: store_id } } },
          { menu: { stores: { some: { id: store_id } } } }
        ]
      }
    });

    // A store should see products that are:
    // 1. Created by this store OR
    // 2. Explicitly assigned to this store OR
    // 3. Belong to a category that is explicitly assigned OR
    // 4. Belong to a category whose Menu is assigned
    const products = await this.prisma.product.findMany({
      where: {
        is_active: true,
        status: 'APPROVED',
        OR: [
          { store_id },
          { assigned_stores: { some: { id: store_id } } },
          { categories: { some: { assigned_stores: { some: { id: store_id } } } } },
          { categories: { some: { menu: { stores: { some: { id: store_id } } } } } }
        ]
      },
      include: { categories: true, variants: true },
      orderBy: { id: 'asc' },
    });

    return { categories, products, synced_at: new Date().toISOString() };
  }

  // -------------------------------------------------------------
  // ADMIN PANEL: MENUS
  // -------------------------------------------------------------
  async getMenus() {
    return this.prisma.menu.findMany({
      include: { stores: true, categories: true }
    });
  }

  async createMenu(data: { name: string; brand_id?: number; store_ids?: number[] }) {
    return this.prisma.menu.create({
      data: {
        name: data.name,
        brand_id: data.brand_id || 1,
        stores: {
          connect: (data.store_ids || []).map(id => ({ id }))
        }
      },
      include: { stores: true }
    });
  }

  async updateMenu(id: number, data: { name?: string; store_ids?: number[] }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.store_ids !== undefined) {
      updateData.stores = { set: data.store_ids.map(sid => ({ id: sid })) };
    }

    return this.prisma.menu.update({
      where: { id },
      data: updateData,
      include: { stores: true }
    });
  }

  async duplicateMenu(id: number) {
    // Fetch the original menu with categories and products
    const original = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        categories: {
          include: { products: true }
        }
      }
    });

    if (!original) throw new NotFoundException('Menu not found');

    // Create the new menu
    const newMenu = await this.prisma.menu.create({
      data: {
        name: `${original.name} (Copy)`,
        brand_id: original.brand_id,
        isActive: original.isActive,
      }
    });

    // Clone categories and products
    for (const category of original.categories) {
      const newCategory = await this.prisma.category.create({
        data: {
          name: category.name,
          store_id: category.store_id,
          menu_id: newMenu.id
        }
      });

      for (const product of category.products) {
        await this.prisma.product.create({
          data: {
            name: product.name,
            price: product.price,
            cost: product.cost,
            margin_pct: product.margin_pct,
            is_active: product.is_active,
            sku: product.sku,
            image_url: product.image_url,
            status: product.status,
            store_id: product.store_id,
            categories: { connect: [{ id: newCategory.id }] }
          }
        });
      }
    }

    return newMenu;
  }

  async deleteMenu(id: number) {
    // Find all categories for this menu
    const categories = await this.prisma.category.findMany({
      where: { menu_id: id },
      include: { products: true }
    });

    const categoryIds = categories.map(c => c.id);
    const productIdsToDelete = new Set<number>();

    for (const category of categories) {
      for (const product of category.products) {
        productIdsToDelete.add(product.id);
      }
    }

    // Delete products associated with these categories
    if (productIdsToDelete.size > 0) {
      await this.prisma.product.deleteMany({
        where: { id: { in: Array.from(productIdsToDelete) } }
      });
    }

    // Delete categories
    if (categoryIds.length > 0) {
      await this.prisma.category.deleteMany({
        where: { id: { in: categoryIds } }
      });
    }

    // Delete the menu itself
    return this.prisma.menu.delete({ where: { id } });
  }

  // -------------------------------------------------------------
  // ADMIN PANEL: CATEGORIES
  // -------------------------------------------------------------
  async getCategories(store_id: number) {
    // Admin needs to see all categories. We can just return all for now.
    return this.prisma.category.findMany({
      include: { menu: true, assigned_stores: true }
    });
  }

  async createCategory(store_id: number, name: string, menu_id?: number, store_ids?: number[]) {
    return this.prisma.category.create({
      data: {
        store_id,
        name,
        menu_id,
        assigned_stores: {
          connect: (store_ids || []).map(id => ({ id }))
        }
      },
      include: { menu: true, assigned_stores: true }
    });
  }

  async updateCategory(id: number, data: { name?: string; menu_id?: number; store_ids?: number[] }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.menu_id !== undefined) updateData.menu_id = data.menu_id;
    if (data.store_ids !== undefined) {
      updateData.assigned_stores = { set: data.store_ids.map(sid => ({ id: sid })) };
    }
    return this.prisma.category.update({
      where: { id },
      data: updateData,
      include: { menu: true, assigned_stores: true }
    });
  }

  async deleteCategory(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }

  // -------------------------------------------------------------
  // ADMIN PANEL: PRODUCTS
  // -------------------------------------------------------------
  async getProducts(store_id: number) {
    // Admin needs to see all products
    return this.prisma.product.findMany({
      where: { is_active: true },
      include: { categories: true, assigned_stores: true, variants: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProduct(data: {
    store_id: number;
    category_ids: number[];
    name: string;
    price: number;
    cost: number;
    margin_pct: number;
    sku?: string;
    image_url?: string;
    status?: string;
    assigned_store_ids?: number[];
    variants?: { name: string; price: number }[];
  }) {
    const { assigned_store_ids, category_ids, variants, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        status: data.status || 'APPROVED',
        categories: {
          connect: (category_ids || []).map(id => ({ id }))
        },
        assigned_stores: {
          connect: (assigned_store_ids || []).map(id => ({ id }))
        },
        variants: variants && variants.length > 0 ? {
          create: variants.map(v => ({ name: v.name, price: v.price }))
        } : undefined
      },
      include: { assigned_stores: true, categories: true, variants: true }
    });
  }

  async updateProduct(
    id: number,
    data: { name?: string; price?: number; cost?: number; margin_pct?: number; is_active?: boolean; sku?: string; image_url?: string; status?: string; assigned_store_ids?: number[]; category_ids?: number[]; variants?: { name: string; price: number }[] },
  ) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product #${id} not found`);

    const { assigned_store_ids, category_ids, variants, ...updateData } = data;
    const updatePayload: any = { ...updateData };

    if (assigned_store_ids !== undefined) {
      updatePayload.assigned_stores = { set: assigned_store_ids.map(sid => ({ id: sid })) };
    }

    if (category_ids !== undefined) {
      updatePayload.categories = { set: category_ids.map(cid => ({ id: cid })) };
    }

    if (variants !== undefined) {
      // For updates, we delete existing variants and create new ones (simplest approach)
      await this.prisma.productVariant.deleteMany({ where: { product_id: id } });
      if (variants.length > 0) {
        updatePayload.variants = {
          create: variants.map(v => ({ name: v.name, price: v.price }))
        };
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updatePayload,
      include: { assigned_stores: true, categories: true, variants: true }
    });
  }

  async approveProduct(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { status: 'APPROVED' }
    });
  }

  async deleteProduct(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { is_active: false },
    });
  }
}
