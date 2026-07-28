import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { join } from 'path';
import { parse as parseCsv } from 'csv-parse/sync';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import { generateThumbnail, deleteUploadedFile } from '../../../common/utils/image-upload.util';

const MENU_PRODUCTS_DIR = join(process.cwd(), 'uploads', 'menu-products');

const PRODUCT_CSV_COLUMNS = [
  'name', 'price', 'cost', 'margin_pct', 'sku', 'barcode', 'category',
  'description', 'tax_rate', 'kitchen_station', 'printer_group', 'kds_group',
  'is_active', 'image_url',
] as const;

interface ProductCsvRow {
  row: number;
  name?: string;
  price?: string;
  cost?: string;
  margin_pct?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  description?: string;
  tax_rate?: string;
  kitchen_station?: string;
  printer_group?: string;
  kds_group?: string;
  is_active?: string;
  image_url?: string;
}

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
          { menu: { stores: { some: { id: store_id } } } },
        ],
      },
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
          {
            categories: {
              some: { assigned_stores: { some: { id: store_id } } },
            },
          },
          {
            categories: {
              some: { menu: { stores: { some: { id: store_id } } } },
            },
          },
        ],
      },
      include: {
        categories: true,
        variants: { include: { recipe: true } },
        recipe: { include: { ingredients: { include: { inventory: true } } } },
        availabilityRule: true,
        modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
      },
      orderBy: { id: 'asc' },
    });

    return { categories, products, synced_at: new Date().toISOString() };
  }

  // -------------------------------------------------------------
  // ADMIN PANEL: MENUS
  // -------------------------------------------------------------
  async getMenus() {
    return this.prisma.menu.findMany({
      include: { stores: true, categories: true },
    });
  }

  async createMenu(data: {
    name: string;
    brand_id?: number;
    store_ids?: number[];
  }) {
    return this.prisma.menu.create({
      data: {
        name: data.name,
        brand_id: data.brand_id || 1,
        stores: {
          connect: (data.store_ids || []).map((id) => ({ id })),
        },
      },
      include: { stores: true },
    });
  }

  async updateMenu(id: number, data: { name?: string; store_ids?: number[] }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.store_ids !== undefined) {
      updateData.stores = { set: data.store_ids.map((sid) => ({ id: sid })) };
    }

    return this.prisma.menu.update({
      where: { id },
      data: updateData,
      include: { stores: true },
    });
  }

  async duplicateMenu(id: number) {
    // Fetch the original menu with categories and products
    const original = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        categories: {
          include: { products: true },
        },
      },
    });

    if (!original) throw new NotFoundException('Menu not found');

    // Create the new menu
    const newMenu = await this.prisma.menu.create({
      data: {
        name: `${original.name} (Copy)`,
        brand_id: original.brand_id,
        isActive: original.isActive,
      },
    });

    // Clone categories and products
    for (const category of original.categories) {
      const newCategory = await this.prisma.category.create({
        data: {
          name: category.name,
          store_id: category.store_id,
          menu_id: newMenu.id,
        },
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
            categories: { connect: [{ id: newCategory.id }] },
          },
        });
      }
    }

    return newMenu;
  }

  async deleteMenu(id: number) {
    // Find all categories for this menu
    const categories = await this.prisma.category.findMany({
      where: { menu_id: id },
      include: { products: true },
    });

    const categoryIds = categories.map((c) => c.id);
    const productIdsToDelete = new Set<number>();

    for (const category of categories) {
      for (const product of category.products) {
        productIdsToDelete.add(product.id);
      }
    }

    // Delete products associated with these categories
    if (productIdsToDelete.size > 0) {
      await this.prisma.product.deleteMany({
        where: { id: { in: Array.from(productIdsToDelete) } },
      });
    }

    // Delete categories
    if (categoryIds.length > 0) {
      await this.prisma.category.deleteMany({
        where: { id: { in: categoryIds } },
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
      include: { menu: true, assigned_stores: true },
    });
  }

  async createCategory(
    store_id: number,
    name: string,
    menu_id?: number,
    store_ids?: number[],
    is_active?: boolean,
    sort_order?: number,
    image_url?: string,
  ) {
    return this.prisma.category.create({
      data: {
        store_id,
        name,
        menu_id,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
        image_url,
        assigned_stores: {
          connect: (store_ids || []).map((id) => ({ id })),
        },
      },
      include: { menu: true, assigned_stores: true },
    });
  }

  async updateCategory(
    id: number,
    data: {
      name?: string;
      menu_id?: number;
      store_ids?: number[];
      is_active?: boolean;
      sort_order?: number;
      image_url?: string;
    },
  ) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.menu_id !== undefined) updateData.menu_id = data.menu_id;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.store_ids !== undefined) {
      updateData.assigned_stores = {
        set: data.store_ids.map((sid) => ({ id: sid })),
      };
    }
    return this.prisma.category.update({
      where: { id },
      data: updateData,
      include: { menu: true, assigned_stores: true },
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
      include: {
        categories: true,
        assigned_stores: true,
        variants: { include: { recipe: true } },
        recipe: true,
        availabilityRule: true,
        modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
      },
      orderBy: { createdAt: 'desc' },
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
    barcode?: string;
    image_url?: string;
    description?: string;
    status?: string;
    is_active?: boolean;
    assigned_store_ids?: number[];
    variants?: { name: string; price: number; cost?: number; sku?: string; barcode?: string; recipe_id?: number }[];
    recipe_id?: number;
    tax_rate?: number;
    kitchen_station?: string;
    printer_group?: string;
    kds_group?: string;
    availability_rule_id?: number;
    modifier_group_ids?: number[];
  }) {
    const { assigned_store_ids, category_ids, variants, modifier_group_ids, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        status: data.status || 'APPROVED',
        categories: {
          connect: (category_ids || []).map((id) => ({ id })),
        },
        assigned_stores: {
          connect: (assigned_store_ids || []).map((id) => ({ id })),
        },
        variants:
          variants && variants.length > 0
            ? {
                create: variants.map((v) => ({
                  name: v.name,
                  price: v.price,
                  cost: v.cost || 0,
                  sku: v.sku,
                  barcode: v.barcode,
                  recipe_id: v.recipe_id,
                })),
              }
            : undefined,
        modifierGroups:
          modifier_group_ids && modifier_group_ids.length > 0
            ? {
                create: modifier_group_ids.map((mgId) => ({
                  modifier_group_id: mgId,
                })),
              }
            : undefined,
      },
      include: {
        assigned_stores: true,
        categories: true,
        variants: { include: { recipe: true } },
        recipe: true,
        availabilityRule: true,
        modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
      },
    });
  }

  async updateProduct(
    id: number,
    data: {
      name?: string;
      price?: number;
      cost?: number;
      margin_pct?: number;
      is_active?: boolean;
      sku?: string;
      barcode?: string;
      image_url?: string;
      description?: string;
      status?: string;
      assigned_store_ids?: number[];
      category_ids?: number[];
      variants?: { name: string; price: number; cost?: number; sku?: string; barcode?: string; recipe_id?: number }[];
      recipe_id?: number;
      tax_rate?: number;
      kitchen_station?: string;
      printer_group?: string;
      kds_group?: string;
      availability_rule_id?: number;
      modifier_group_ids?: number[];
    },
  ) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product #${id} not found`);

    const { assigned_store_ids, category_ids, variants, modifier_group_ids, ...updateData } = data;
    const updatePayload: any = { ...updateData };

    if (assigned_store_ids !== undefined) {
      updatePayload.assigned_stores = {
        set: assigned_store_ids.map((sid) => ({ id: sid })),
      };
    }

    if (category_ids !== undefined) {
      updatePayload.categories = {
        set: category_ids.map((cid) => ({ id: cid })),
      };
    }

    if (variants !== undefined) {
      await this.prisma.productVariant.deleteMany({
        where: { product_id: id },
      });
      if (variants.length > 0) {
        updatePayload.variants = {
          create: variants.map((v) => ({
            name: v.name,
            price: v.price,
            cost: v.cost || 0,
            sku: v.sku,
            barcode: v.barcode,
            recipe_id: v.recipe_id,
          })),
        };
      }
    }

    if (modifier_group_ids !== undefined) {
      await this.prisma.productModifierGroup.deleteMany({
        where: { product_id: id },
      });
      if (modifier_group_ids.length > 0) {
        updatePayload.modifierGroups = {
          create: modifier_group_ids.map((mgId) => ({
            modifier_group_id: mgId,
          })),
        };
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updatePayload,
      include: {
        assigned_stores: true,
        categories: true,
        variants: { include: { recipe: true } },
        recipe: true,
        availabilityRule: true,
        modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
      },
    });
  }

  async approveProduct(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async deleteProduct(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // -------------------------------------------------------------
  // PRODUCT IMAGE (one image per product; replacing removes the old files)
  // -------------------------------------------------------------
  async setProductImage(id: number, file: Express.Multer.File) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product #${id} not found`);

    // Remove the previous image + thumbnail before writing the new ones.
    await deleteUploadedFile(MENU_PRODUCTS_DIR, product.image_url);
    await deleteUploadedFile(MENU_PRODUCTS_DIR, product.thumbnail_url);

    const thumbnailFilename = `thumb-${file.filename}`;
    await generateThumbnail(file.path, MENU_PRODUCTS_DIR, thumbnailFilename);

    return this.prisma.product.update({
      where: { id },
      data: {
        image_url: `/uploads/menu-products/${file.filename}`,
        thumbnail_url: `/uploads/menu-products/${thumbnailFilename}`,
        mime_type: file.mimetype,
        file_size: file.size,
      },
    });
  }

  async removeProductImage(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product #${id} not found`);

    await deleteUploadedFile(MENU_PRODUCTS_DIR, product.image_url);
    await deleteUploadedFile(MENU_PRODUCTS_DIR, product.thumbnail_url);

    return this.prisma.product.update({
      where: { id },
      data: {
        image_url: null,
        thumbnail_url: null,
        mime_type: null,
        file_size: null,
      },
    });
  }

  // -------------------------------------------------------------
  // PRODUCT CSV IMPORT / EXPORT (Menu Builder bulk editing)
  // -------------------------------------------------------------
  async exportProductsCsv(): Promise<string> {
    // Mirrors getProducts() exactly so the export always matches what the Products tab shows.
    const products = await this.prisma.product.findMany({
      where: { is_active: true },
      include: { categories: true },
      orderBy: { createdAt: 'desc' },
    });

    const rows = products.map((p) => ({
      name: p.name,
      price: p.price,
      cost: p.cost,
      margin_pct: p.margin_pct,
      sku: p.sku ?? '',
      barcode: p.barcode ?? '',
      category: p.categories.map((c) => c.name).join(';'),
      description: p.description ?? '',
      tax_rate: p.tax_rate,
      kitchen_station: p.kitchen_station ?? '',
      printer_group: p.printer_group ?? '',
      kds_group: p.kds_group ?? '',
      is_active: p.is_active,
      image_url: p.image_url ?? '',
    }));

    return stringifyCsv(rows, { header: true, columns: [...PRODUCT_CSV_COLUMNS] });
  }

  /**
   * A brand-new category created here previously got menu_id: null forever
   * (no UI ever offers to fix it after the fact) whenever its brand hadn't
   * had a Menu set up yet — CSV-imported categories would then show
   * "Unassigned" in Menu Manager even though same-named categories elsewhere
   * were correctly grouped under "Main Menu". Ensuring a default Menu exists
   * per brand (reusing one if it does) fixes that at creation time.
   */
  private async getOrCreateDefaultMenuId(store_id: number): Promise<number | null> {
    const store = await this.prisma.store.findUnique({ where: { id: store_id }, select: { brand_id: true } });
    if (!store) return null;
    let menu = await this.prisma.menu.findFirst({ where: { brand_id: store.brand_id } });
    if (!menu) {
      menu = await this.prisma.menu.create({
        data: { brand_id: store.brand_id, name: 'Main Menu', stores: { connect: [{ id: store_id }] } },
      });
    }
    return menu.id;
  }

  private async resolveCategoryIds(store_id: number, categoryCell?: string): Promise<number[]> {
    const names = (categoryCell || '')
      .split(';')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return [];

    const ids: number[] = [];
    for (const name of names) {
      let category = await this.prisma.category.findFirst({ where: { store_id, name } });
      if (!category) {
        const menu_id = await this.getOrCreateDefaultMenuId(store_id);
        category = await this.prisma.category.create({ data: { store_id, name, menu_id } });
      }
      ids.push(category.id);
    }
    return ids;
  }

  async importProductsCsv(store_id: number, fileBuffer: Buffer) {
    let records: ProductCsvRow[];
    try {
      records = parseCsv(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (e) {
      throw new BadRequestException(`Could not parse CSV file: ${(e as Error).message}`);
    }

    const results: { row: number; name: string; action: 'created' | 'updated' | 'error'; error?: string }[] = [];
    let created = 0;
    let updated = 0;

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      const rowNum = i + 2; // +1 for header row, +1 for 1-indexing
      const name = raw.name?.trim();

      if (!name) {
        results.push({ row: rowNum, name: raw.name || '(blank)', action: 'error', error: 'Missing product name' });
        continue;
      }

      try {
        const category_ids = await this.resolveCategoryIds(store_id, raw.category);
        const payload = {
          store_id,
          category_ids,
          name,
          price: parseFloat(raw.price || '0') || 0,
          cost: parseFloat(raw.cost || '0') || 0,
          margin_pct: parseFloat(raw.margin_pct || '0') || 0,
          sku: raw.sku || undefined,
          barcode: raw.barcode || undefined,
          description: raw.description || undefined,
          tax_rate: raw.tax_rate ? parseFloat(raw.tax_rate) || 0 : undefined,
          kitchen_station: raw.kitchen_station || undefined,
          printer_group: raw.printer_group || undefined,
          kds_group: raw.kds_group || undefined,
          image_url: raw.image_url || undefined,
        };

        // Match an existing product by SKU first, falling back to exact name — both scoped to this store.
        const existing = raw.sku?.trim()
          ? await this.prisma.product.findFirst({ where: { store_id, sku: raw.sku.trim() } })
          : await this.prisma.product.findFirst({ where: { store_id, name } });

        if (existing) {
          await this.updateProduct(existing.id, {
            ...payload,
            is_active: raw.is_active !== undefined ? ['true', '1', 'yes'].includes(raw.is_active.toLowerCase()) : undefined,
          });
          updated++;
          results.push({ row: rowNum, name, action: 'updated' });
        } else {
          await this.createProduct(payload);
          created++;
          results.push({ row: rowNum, name, action: 'created' });
        }
      } catch (e) {
        results.push({ row: rowNum, name, action: 'error', error: (e as Error).message });
      }
    }

    return {
      total: records.length,
      created,
      updated,
      errors: results.filter((r) => r.action === 'error').length,
      results,
    };
  }
}
