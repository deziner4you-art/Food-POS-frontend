import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { join } from 'path';
import { parse as parseCsv } from 'csv-parse/sync';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import { generateThumbnail, deleteUploadedFile } from '../../../common/utils/image-upload.util';
import { getOrCreateDefaultMenuId } from './category-group.util';
import { writeCatalogAudit } from '../../../common/utils/catalog-audit.util';
import { resolveOrderBy } from '../../../common/utils/sort.util';
import type { BulkAssignCategoryGroupDto, BulkAssignProductCategoryDto } from './dto';

const PRODUCT_SORT_FIELDS = ['name', 'price', 'cost', 'margin_pct', 'status', 'sku', 'createdAt', 'updatedAt'] as const;
const CATEGORY_SORT_FIELDS = ['name', 'sort_order', 'is_active', 'id'] as const;
const MENU_SORT_FIELDS = ['name', 'createdAt', 'id'] as const;

const MENU_PRODUCTS_DIR = join(process.cwd(), 'uploads', 'menu-products');

// Sprint 28.8D — full Product hierarchy export. Column order matches the
// sprint spec exactly. Import accepts these headers AND the legacy pre-28.8D
// headers (see CSV_HEADER_ALIASES below) so older exported files still import.
const PRODUCT_CSV_COLUMNS = [
  'product_name', 'sku', 'barcode', 'menu_collection', 'category_group', 'category',
  'modifier_groups', 'recipe', 'kitchen_station', 'printer_group', 'kds_group',
  'availability_rule', 'price', 'cost', 'margin', 'tax', 'status', 'description', 'image_url',
] as const;

// old_header -> new_header, so a CSV exported before Sprint 28.8D still imports unchanged.
// is_active/status are NOT aliased to each other — different semantics (boolean toggle vs PENDING/APPROVED
// enum) — both are read independently below wherever present.
const CSV_HEADER_ALIASES: Record<string, string> = {
  name: 'product_name',
  margin_pct: 'margin',
  tax_rate: 'tax',
};

interface ProductCsvRow {
  row: number;
  product_name?: string;
  name?: string; // legacy header
  sku?: string;
  barcode?: string;
  menu_collection?: string;
  category_group?: string;
  category?: string;
  modifier_groups?: string;
  recipe?: string;
  kitchen_station?: string;
  printer_group?: string;
  kds_group?: string;
  availability_rule?: string;
  price?: string;
  cost?: string;
  margin?: string;
  margin_pct?: string; // legacy header
  tax?: string;
  tax_rate?: string; // legacy header
  status?: string;
  is_active?: string; // legacy header
  description?: string;
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
  async getMenus(params: { sort_by?: string; sort_dir?: string } = {}) {
    const orderBy = resolveOrderBy(params.sort_by, params.sort_dir, MENU_SORT_FIELDS, 'name');
    return this.prisma.menu.findMany({
      include: { stores: true, categories: true },
      orderBy,
    });
  }

  async createMenu(data: {
    name: string;
    brand_id?: number;
    store_ids?: number[];
  }) {
    // Sprint 28.9: brand_id must never silently default to brand #1 — derive
    // it from the first assigned store when possible (a Menu's brand must
    // match its stores' own brand anyway), otherwise require it explicitly.
    let resolvedBrandId = data.brand_id;
    if (!resolvedBrandId && data.store_ids && data.store_ids.length > 0) {
      const store = await this.prisma.store.findUnique({ where: { id: data.store_ids[0] }, select: { brand_id: true } });
      resolvedBrandId = store?.brand_id;
    }
    if (!resolvedBrandId) {
      throw new BadRequestException('brand_id or store_ids is required to create a menu.');
    }

    return this.prisma.menu.create({
      data: {
        name: data.name,
        brand_id: resolvedBrandId,
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
    // Fetch the original menu with its Category Group -> Category -> Product hierarchy
    const original = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        categoryGroups: {
          where: { deleted_at: null },
          include: { categories: { include: { products: true } } },
        },
      },
    });

    if (!original) throw new NotFoundException('Menu not found');

    // Category Groups are optional — a menu commonly has categories with no
    // group at all, which the categoryGroups-nested include above never
    // reaches. Fetch those separately so duplicating a menu never silently
    // drops them.
    const ungroupedCategories = await this.prisma.category.findMany({
      where: { menu_id: id, category_group_id: null },
      include: { products: true },
    });

    // Create the new menu
    const newMenu = await this.prisma.menu.create({
      data: {
        name: `${original.name} (Copy)`,
        brand_id: original.brand_id,
        isActive: original.isActive,
      },
    });

    const cloneCategory = async (category: (typeof original.categoryGroups)[number]['categories'][number], newGroupId: number | null) => {
      const newCategory = await this.prisma.category.create({
        data: {
          name: category.name,
          store_id: category.store_id,
          menu_id: newMenu.id,
          category_group_id: newGroupId,
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
    };

    // Clone Category Groups (preserving hierarchy), then their categories/products
    for (const group of original.categoryGroups) {
      const newGroup = await this.prisma.categoryGroup.create({
        data: {
          menu_id: newMenu.id,
          name: group.name,
          description: group.description,
          sort_order: group.sort_order,
          icon: group.icon,
          color: group.color,
          image_url: group.image_url,
          is_active: group.is_active,
          visible_pos: group.visible_pos,
          visible_website: group.visible_website,
          visible_waiter: group.visible_waiter,
          visible_qr_menu: group.visible_qr_menu,
          visible_kiosk: group.visible_kiosk,
          visible_delivery: group.visible_delivery,
          visible_takeaway: group.visible_takeaway,
        },
      });

      for (const category of group.categories) {
        await cloneCategory(category, newGroup.id);
      }
    }

    // Clone ungrouped categories as-is (still ungrouped in the copy)
    for (const category of ungroupedCategories) {
      await cloneCategory(category, null);
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

    // Delete Category Groups for this menu (must happen after categories —
    // Category.category_group_id is a required FK with ON DELETE RESTRICT)
    await this.prisma.categoryGroup.deleteMany({ where: { menu_id: id } });

    // Delete the menu itself
    return this.prisma.menu.delete({ where: { id } });
  }

  // -------------------------------------------------------------
  // ADMIN PANEL: CATEGORIES
  // -------------------------------------------------------------
  /**
   * Category List API (Sprint 28.8D): Category + Category Group + Menu
   * Collection + Product Count + Status, sortable. `store_id` stays optional
   * (existing callers that always pass it keep working identically) so an
   * enterprise/HQ view can list categories across every branch at once.
   * `_count` computes product_count in the same query — no N+1.
   */
  async getCategories(params: { store_id?: number; menu_id?: number; category_group_id?: number; sort_by?: string; sort_dir?: string } = {}) {
    const where: Prisma.CategoryWhereInput = {};
    if (params.store_id) where.store_id = params.store_id;
    if (params.menu_id) where.menu_id = params.menu_id;
    if (params.category_group_id) where.category_group_id = params.category_group_id;

    const orderBy = resolveOrderBy(params.sort_by, params.sort_dir, CATEGORY_SORT_FIELDS, 'name');

    const categories = await this.prisma.category.findMany({
      where,
      orderBy,
      include: {
        menu: true,
        assigned_stores: true,
        categoryGroup: true,
        _count: { select: { products: true } },
      },
    });

    return categories.map((c) => ({
      ...c,
      product_count: c._count.products,
    }));
  }

  async createCategory(
    store_id: number,
    name: string,
    menu_id?: number,
    store_ids?: number[],
    is_active?: boolean,
    sort_order?: number,
    image_url?: string,
    category_group_id?: number,
  ) {
    // Category Groups are OPTIONAL (business requirement change — see
    // Hotfix: Remove Runtime Migration Default Groups). category_group_id is
    // passed through as-is (null when not supplied); no group is ever
    // auto-created. Menu still defaults per-brand, same as before.
    let resolvedMenuId = menu_id;
    if (!resolvedMenuId) resolvedMenuId = (await this.getOrCreateDefaultMenuId(store_id)) ?? undefined;

    return this.prisma.category.create({
      data: {
        store_id,
        name,
        menu_id: resolvedMenuId,
        category_group_id: category_group_id ?? null,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
        image_url,
        assigned_stores: {
          connect: (store_ids || []).map((id) => ({ id })),
        },
      },
      include: { menu: true, assigned_stores: true, categoryGroup: true },
    });
  }

  async updateCategory(
    id: number,
    data: {
      name?: string;
      menu_id?: number;
      category_group_id?: number;
      store_ids?: number[];
      is_active?: boolean;
      sort_order?: number;
      image_url?: string;
    },
  ) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.menu_id !== undefined) updateData.menu_id = data.menu_id;
    if (data.category_group_id !== undefined) updateData.category_group_id = data.category_group_id;
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
      include: { menu: true, assigned_stores: true, categoryGroup: true },
    });
  }

  async deleteCategory(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }

  // -------------------------------------------------------------
  // ADMIN PANEL: PRODUCTS
  // -------------------------------------------------------------
  /**
   * Product List API (Sprint 28.8D). `store_id` stays optional — every
   * existing caller that always passes it keeps behaving identically (was
   * previously accepted but silently ignored; now it actually filters,
   * which only narrows results for those callers, never breaks them).
   * Omitting it lists across every branch, matching "Branch" being one of
   * several optional Filters rather than a mandatory scope.
   * Single query with nested includes — no per-row follow-up queries.
   */
  async getProducts(
    params: {
      store_id?: number;
      category_id?: number;
      category_group_id?: number;
      menu_id?: number;
      status?: string;
      search?: string;
      sort_by?: string;
      sort_dir?: string;
    } = {},
  ) {
    const where: Prisma.ProductWhereInput = { is_active: true };
    if (params.store_id) where.store_id = params.store_id;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.category_id || params.category_group_id || params.menu_id) {
      where.categories = {
        some: {
          ...(params.category_id ? { id: params.category_id } : {}),
          ...(params.category_group_id ? { category_group_id: params.category_group_id } : {}),
          ...(params.menu_id ? { menu_id: params.menu_id } : {}),
        },
      };
    }

    const orderBy = resolveOrderBy(params.sort_by, params.sort_dir, PRODUCT_SORT_FIELDS, 'createdAt');

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      include: {
        categories: { include: { menu: true, categoryGroup: true } },
        assigned_stores: true,
        variants: { include: { recipe: true } },
        recipe: true,
        availabilityRule: true,
        kitchenStation: true,
        modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
      },
    });

    return products.map((p) => this.shapeProductRow(p));
  }

  /**
   * Flattens the Product-List-required single-value columns (Category,
   * Category Group, Menu Collection, Kitchen Station name, Recipe name,
   * Modifier Group names) from a Product's already-loaded relations — pure
   * in-memory mapping, no extra queries. A product's primary category is
   * its first linked Category (a Product can have several; the flat table
   * columns show the first — the full `categories[]` array is still
   * returned unchanged for anything that needs all of them).
   */
  private shapeProductRow(p: any) {
    const primaryCategory = p.categories?.[0] ?? null;
    return {
      ...p,
      category_id: primaryCategory?.id ?? null,
      category_name: primaryCategory?.name ?? null,
      category_group_id: primaryCategory?.categoryGroup?.id ?? null,
      category_group_name: primaryCategory?.categoryGroup?.name ?? null,
      menu_collection_id: primaryCategory?.menu?.id ?? null,
      menu_collection_name: primaryCategory?.menu?.name ?? null,
      modifier_group_names: (p.modifierGroups || []).map((mg: any) => mg.modifierGroup?.name).filter(Boolean),
      recipe_name: p.recipe?.name ?? null,
      // kitchen_station_id (relation) takes priority over the legacy free-text column, matching the KDS routing convention established in Sprint 28.
      kitchen_station_name: p.kitchenStation?.name ?? p.kitchen_station ?? null,
      availability_rule_name: p.availabilityRule?.name ?? null,
    };
  }

  // -------------------------------------------------------------
  // BULK ASSIGNMENT (Sprint 28.8D)
  // -------------------------------------------------------------
  /**
   * Assign many Categories to one Category Group in a single transaction.
   * `category_group_id: null` bulk-unassigns (Category Groups are optional
   * — see the Hotfix removing runtime Default Group recreation). Validates
   * the group and every category id exist before writing anything; a single
   * `updateMany` performs the actual reassignment (one statement, not N).
   */
  async bulkAssignCategoryGroup(dto: BulkAssignCategoryGroupDto) {
    const categoryGroupId = dto.category_group_id ?? null;

    return this.prisma.$transaction(async (tx) => {
      if (categoryGroupId !== null) {
        const group = await tx.categoryGroup.findUnique({ where: { id: categoryGroupId } });
        if (!group) throw new BadRequestException(`Category Group #${categoryGroupId} not found.`);
      }

      const existing = await tx.category.findMany({ where: { id: { in: dto.category_ids } }, select: { id: true } });
      const foundIds = new Set(existing.map((c) => c.id));
      const missing = dto.category_ids.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(`Categories not found: ${missing.join(', ')}`);
      }

      const result = await tx.category.updateMany({
        where: { id: { in: dto.category_ids } },
        data: { category_group_id: categoryGroupId },
      });

      await tx.systemAuditLog.create({
        data: {
          action: 'BULK_CATEGORY_GROUP_ASSIGNED',
          entity: 'CategoryGroup',
          entity_id: categoryGroupId,
          user_id: dto.updated_by ?? null,
          details: { category_ids: dto.category_ids, category_group_id: categoryGroupId, updated_count: result.count },
        },
      });

      return { success: true, updated: result.count, category_group_id: categoryGroupId };
    });
  }

  /**
   * Assign many Products to one Category in a single transaction. This
   * ADDS the category to each product (connects) — it does not replace a
   * product's existing categories, matching the "bulk tag" semantics of an
   * enterprise catalog tool. A single bulk INSERT ... ON CONFLICT DO NOTHING
   * into the Product<->Category join table does this in one round trip
   * instead of N individual `connect` calls.
   */
  async bulkAssignProductCategory(dto: BulkAssignProductCategoryDto) {
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({ where: { id: dto.category_id } });
      if (!category) throw new BadRequestException(`Category #${dto.category_id} not found.`);

      const existing = await tx.product.findMany({ where: { id: { in: dto.product_ids } }, select: { id: true } });
      const foundIds = new Set(existing.map((p) => p.id));
      const missing = dto.product_ids.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(`Products not found: ${missing.join(', ')}`);
      }

      const rows = dto.product_ids.map((productId) => Prisma.sql`(${dto.category_id}, ${productId})`);
      await tx.$executeRaw`INSERT INTO "_ProductCategories" ("A", "B") VALUES ${Prisma.join(rows)} ON CONFLICT ("A", "B") DO NOTHING`;

      await tx.systemAuditLog.create({
        data: {
          action: 'BULK_PRODUCT_CATEGORY_ASSIGNED',
          entity: 'Category',
          entity_id: dto.category_id,
          user_id: dto.updated_by ?? null,
          details: { product_ids: dto.product_ids, category_id: dto.category_id },
        },
      });

      return { success: true, category_id: dto.category_id, assigned_count: dto.product_ids.length };
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
    kitchen_station_id?: number;
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
      kitchen_station_id?: number;
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
  // PRODUCT CSV IMPORT / EXPORT (Menu Builder bulk editing, Sprint 28.8D)
  // -------------------------------------------------------------
  /** Exports the complete Product hierarchy — same shape getProducts()/shapeProductRow() already compute, no separate query logic to keep in sync. */
  async exportProductsCsv(store_id?: number): Promise<string> {
    const products = await this.getProducts({ store_id });

    const rows = products.map((p: any) => ({
      product_name: p.name,
      sku: p.sku ?? '',
      barcode: p.barcode ?? '',
      menu_collection: p.menu_collection_name ?? '',
      category_group: p.category_group_name ?? '',
      category: p.categories.map((c: any) => c.name).join(';'),
      modifier_groups: p.modifier_group_names.join(';'),
      recipe: p.recipe_name ?? '',
      kitchen_station: p.kitchen_station_name ?? '',
      printer_group: p.printer_group ?? '',
      kds_group: p.kds_group ?? '',
      availability_rule: p.availability_rule_name ?? '',
      price: p.price,
      cost: p.cost,
      margin: p.margin_pct,
      tax: p.tax_rate,
      status: p.status,
      description: p.description ?? '',
      image_url: p.image_url ?? '',
    }));

    await writeCatalogAudit(this.prisma, {
      action: 'PRODUCTS_CSV_EXPORTED',
      entity: 'ProductCsv',
      details: { store_id: store_id ?? null, row_count: rows.length },
    });

    return stringifyCsv(rows, { header: true, columns: [...PRODUCT_CSV_COLUMNS] });
  }

  private async getOrCreateDefaultMenuId(store_id: number): Promise<number | null> {
    return getOrCreateDefaultMenuId(this.prisma, store_id);
  }

  /** Normalizes a raw csv-parse row so both the pre-28.8D and current headers resolve to the same keys. */
  private normalizeCsvRow(raw: ProductCsvRow): ProductCsvRow {
    const normalized: any = { ...raw };
    for (const [oldKey, newKey] of Object.entries(CSV_HEADER_ALIASES)) {
      if (normalized[newKey] === undefined && normalized[oldKey] !== undefined) {
        normalized[newKey] = normalized[oldKey];
      }
    }
    return normalized;
  }

  /**
   * Strict existence lookup for a named master-data row scoped to a store —
   * shared by Modifier Group / Availability Rule / Recipe / Kitchen Station
   * resolution below. Never creates anything: an empty cell is skipped
   * (undefined), a non-empty cell that doesn't match an existing row is a
   * validation error for that CSV row. This is the "Never auto-create
   * master data" rule from the sprint spec, applied uniformly.
   */
  private async resolveMasterDataId(
    model: 'modifierGroup' | 'availabilityRule' | 'recipe' | 'kitchenStation',
    store_id: number,
    label: string,
    rawValue: string | undefined,
  ): Promise<number | undefined> {
    const name = rawValue?.trim();
    if (!name) return undefined;
    const record = await (this.prisma[model] as any).findFirst({ where: { store_id, name } });
    if (!record) {
      throw new BadRequestException(`${label} "${name}" not found for this store. It must already exist — CSV import never auto-creates master data.`);
    }
    return record.id;
  }

  /**
   * Category (+ optional Category Group cross-check) resolution for CSV
   * import. Every named Category must already exist for this store — never
   * auto-created (this replaces the pre-28.8D behavior, which silently
   * created a missing category; see CHANGELOG_AI.md). If a Category Group
   * name is also given, every resolved category must actually belong to it.
   */
  private async resolveCategoryIdsStrict(store_id: number, categoryCell: string | undefined, categoryGroupCell: string | undefined): Promise<number[]> {
    const names = (categoryCell || '')
      .split(';')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return [];

    let expectedGroupId: number | undefined;
    const groupName = categoryGroupCell?.trim();
    if (groupName) {
      const group = await this.prisma.categoryGroup.findFirst({
        where: { name: groupName, deleted_at: null, menu: { stores: { some: { id: store_id } } } },
      });
      if (!group) {
        throw new BadRequestException(`Category Group "${groupName}" not found for this store. It must already exist — CSV import never auto-creates master data.`);
      }
      expectedGroupId = group.id;
    }

    const ids: number[] = [];
    for (const name of names) {
      const category = await this.prisma.category.findFirst({ where: { store_id, name } });
      if (!category) {
        throw new BadRequestException(`Category "${name}" not found for this store. It must already exist — CSV import never auto-creates master data.`);
      }
      if (expectedGroupId !== undefined && category.category_group_id !== expectedGroupId) {
        throw new BadRequestException(`Category "${name}" does not belong to Category Group "${groupName}".`);
      }
      ids.push(category.id);
    }
    return ids;
  }

  async importProductsCsv(store_id: number, fileBuffer: Buffer) {
    let rawRecords: ProductCsvRow[];
    try {
      rawRecords = parseCsv(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (e) {
      throw new BadRequestException(`Could not parse CSV file: ${(e as Error).message}`);
    }

    const records = rawRecords.map((r) => this.normalizeCsvRow(r));
    const results: { row: number; name: string; action: 'created' | 'updated' | 'error'; error?: string }[] = [];
    let created = 0;
    let updated = 0;

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      const rowNum = i + 2; // +1 for header row, +1 for 1-indexing
      const name = raw.product_name?.trim();

      if (!name) {
        results.push({ row: rowNum, name: raw.product_name || '(blank)', action: 'error', error: 'Missing product name' });
        continue;
      }

      try {
        const category_ids = await this.resolveCategoryIdsStrict(store_id, raw.category, raw.category_group);
        const modifier_group_ids: number[] = [];
        for (const mgName of (raw.modifier_groups || '').split(';').map((n) => n.trim()).filter(Boolean)) {
          const id = await this.resolveMasterDataId('modifierGroup', store_id, 'Modifier Group', mgName);
          if (id) modifier_group_ids.push(id);
        }
        const availability_rule_id = await this.resolveMasterDataId('availabilityRule', store_id, 'Availability Rule', raw.availability_rule);
        const recipe_id = await this.resolveMasterDataId('recipe', store_id, 'Recipe', raw.recipe);
        const kitchen_station_id = await this.resolveMasterDataId('kitchenStation', store_id, 'Kitchen Station', raw.kitchen_station);

        const payload = {
          store_id,
          category_ids,
          modifier_group_ids: modifier_group_ids.length > 0 ? modifier_group_ids : undefined,
          availability_rule_id,
          recipe_id,
          kitchen_station_id,
          name,
          price: parseFloat(raw.price || '0') || 0,
          cost: parseFloat(raw.cost || '0') || 0,
          margin_pct: parseFloat(raw.margin || '0') || 0,
          sku: raw.sku || undefined,
          barcode: raw.barcode || undefined,
          description: raw.description || undefined,
          tax_rate: raw.tax ? parseFloat(raw.tax) || 0 : undefined,
          // Printer Group / KDS Group have no master-data table (free-text labels) — passed through as-is, no existence check possible or required.
          printer_group: raw.printer_group || undefined,
          kds_group: raw.kds_group || undefined,
          image_url: raw.image_url || undefined,
          status: raw.status && ['PENDING', 'APPROVED'].includes(raw.status.toUpperCase()) ? raw.status.toUpperCase() : undefined,
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

    await writeCatalogAudit(this.prisma, {
      action: 'PRODUCTS_CSV_IMPORTED',
      entity: 'ProductCsv',
      details: { store_id, total: records.length, created, updated, errors: results.filter((r) => r.action === 'error').length },
    });

    return {
      total: records.length,
      created,
      updated,
      errors: results.filter((r) => r.action === 'error').length,
      results,
    };
  }
}
