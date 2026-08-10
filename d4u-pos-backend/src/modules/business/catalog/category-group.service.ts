import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { PricingService } from '../pos-orders/pricing.service';
import {
  getOrCreateDefaultMenuId,
  channelVisibilityToColumns,
  shapeCategoryGroupResponse,
} from './category-group.util';
import {
  CreateCategoryGroupDto,
  UpdateCategoryGroupDto,
  ReorderCategoryGroupsDto,
  AssignCategoryGroupBranchesDto,
  AssignCategoryGroupChannelsDto,
} from './dto';
import { resolveOrderBy } from '../../../common/utils/sort.util';

const INCLUDE_DEFAULT = { assigned_stores: true, menu: true } as const;
const CATEGORY_GROUP_SORT_FIELDS = ['name', 'sort_order', 'createdAt', 'updatedAt'] as const;

const CHANNEL_FIELD: Record<string, string> = {
  pos: 'visible_pos',
  website: 'visible_website',
  waiter: 'visible_waiter',
  qr: 'visible_qr_menu',
  qr_menu: 'visible_qr_menu',
  kiosk: 'visible_kiosk',
  delivery: 'visible_delivery',
  takeaway: 'visible_takeaway',
};

// Sprint 28.8A — fixed system navigation tabs. Never persisted as
// CategoryGroup rows, never user-editable, always exactly these two, always
// first in the navigation contract's ordering (System Tabs -> Category
// Groups -> Categories -> Products). "All Groups" is deliberately NOT one of
// these — it's a client-side-only "no filter selected" UI state (see
// d4u-pos-client/src/App.tsx), never a value the backend returns as data.
const SYSTEM_TABS = [
  { key: 'all_items', label: 'All Items' },
  { key: 'discounted', label: 'Discounted' },
] as const;

@Injectable()
export class CategoryGroupService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) {}

  private async logAudit(action: string, entity_id: number, params: { user_id?: number; user_name?: string; details?: Record<string, any> } = {}) {
    await this.prisma.systemAuditLog.create({
      data: {
        action,
        entity: 'CategoryGroup',
        entity_id,
        user_id: params.user_id ?? null,
        user_name: params.user_name ?? null,
        details: params.details ?? undefined,
      },
    });
  }

  /** Every group must belong to a Menu. The admin UI doesn't expose a Menu picker — it sends store_id (branch) instead. */
  private async resolveMenuId(menu_id: number | undefined, store_id: number | undefined, fallbackStoreIds: number[] | undefined): Promise<number> {
    if (menu_id) return menu_id;
    const anchorStoreId = store_id ?? fallbackStoreIds?.[0];
    if (!anchorStoreId) throw new BadRequestException('menu_id or store_id is required to resolve which Menu Collection this group belongs to.');
    const resolved = await getOrCreateDefaultMenuId(this.prisma, anchorStoreId);
    if (!resolved) throw new BadRequestException(`Could not resolve a Menu — store #${anchorStoreId} not found.`);
    return resolved;
  }

  // -------------------------------------------------------------
  // LIST / DETAILS
  // -------------------------------------------------------------
  async list(params: { menu_id?: number; store_id?: number; include_deleted?: boolean; sort_by?: string; sort_dir?: string }) {
    const where: any = {};
    if (params.menu_id) where.menu_id = params.menu_id;
    if (params.store_id) {
      where.OR = [{ assigned_stores: { some: { id: params.store_id } } }, { menu: { stores: { some: { id: params.store_id } } } }];
    }
    if (!params.include_deleted) where.deleted_at = null;

    const orderBy = resolveOrderBy(params.sort_by, params.sort_dir, CATEGORY_GROUP_SORT_FIELDS, 'sort_order');

    const groups = await this.prisma.categoryGroup.findMany({
      where,
      include: { ...INCLUDE_DEFAULT, categories: true },
      orderBy,
    });
    return groups.map(shapeCategoryGroupResponse);
  }

  async details(id: number) {
    const group = await this.prisma.categoryGroup.findUnique({
      where: { id },
      include: { ...INCLUDE_DEFAULT, categories: { include: { products: true } } },
    });
    if (!group) throw new NotFoundException(`Category Group #${id} not found`);
    return shapeCategoryGroupResponse(group);
  }

  // -------------------------------------------------------------
  // CREATE / UPDATE
  // -------------------------------------------------------------
  async create(dto: CreateCategoryGroupDto) {
    const menu_id = await this.resolveMenuId(dto.menu_id, dto.store_id, dto.store_ids);

    const channelColumns = {
      visible_pos: dto.visible_pos ?? true,
      visible_website: dto.visible_website ?? true,
      visible_waiter: dto.visible_waiter ?? true,
      visible_qr_menu: dto.visible_qr_menu ?? true,
      visible_kiosk: dto.visible_kiosk ?? true,
      visible_delivery: dto.visible_delivery ?? true,
      visible_takeaway: dto.visible_takeaway ?? true,
      ...channelVisibilityToColumns(dto.channel_visibility), // nested shape wins if both sent
    };

    const group = await this.prisma.categoryGroup.create({
      data: {
        menu_id,
        name: dto.name,
        description: dto.description,
        sort_order: dto.sort_order ?? 0,
        icon: dto.icon,
        color: dto.color,
        image_url: dto.image_url,
        is_active: dto.is_active ?? true,
        ...channelColumns,
        created_by: dto.created_by,
        updated_by: dto.created_by,
        assigned_stores: { connect: (dto.store_ids || (dto.store_id ? [dto.store_id] : [])).map((id) => ({ id })) },
      },
      include: INCLUDE_DEFAULT,
    });

    await this.logAudit('CATEGORY_GROUP_CREATED', group.id, { user_id: dto.created_by, details: { name: group.name, menu_id: group.menu_id } });
    return shapeCategoryGroupResponse(group);
  }

  async update(id: number, dto: UpdateCategoryGroupDto) {
    const existing = await this.prisma.categoryGroup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Category Group #${id} not found`);

    const { store_ids, store_id, updated_by, channel_visibility, ...fields } = dto;
    const data: any = { ...fields, updated_by, ...channelVisibilityToColumns(channel_visibility) };
    if (store_ids !== undefined) {
      data.assigned_stores = { set: store_ids.map((sid) => ({ id: sid })) };
    }

    const group = await this.prisma.categoryGroup.update({ where: { id }, data, include: INCLUDE_DEFAULT });
    await this.logAudit('CATEGORY_GROUP_UPDATED', id, { user_id: updated_by, details: { fields: Object.keys(fields) } });
    return shapeCategoryGroupResponse(group);
  }

  // -------------------------------------------------------------
  // SOFT DELETE / RESTORE
  // -------------------------------------------------------------
  /**
   * Category Groups are OPTIONAL (Hotfix: Remove Runtime Migration Default
   * Groups). Deleting a group never deletes or blocks on its categories —
   * they simply become ungrouped (category_group_id: null), same as any
   * category that was never assigned to a group in the first place. No
   * fallback/default group is ever created to hold them. Matches the admin
   * UI's own delete-confirmation copy: "Categories inside will NOT be
   * deleted, but unassigned."
   */
  async softDelete(id: number, deleted_by?: number) {
    const existing = await this.prisma.categoryGroup.findUnique({ where: { id }, include: { ...INCLUDE_DEFAULT, categories: true } });
    if (!existing) throw new NotFoundException(`Category Group #${id} not found`);
    if (existing.deleted_at) return shapeCategoryGroupResponse(existing); // already deleted, idempotent

    if (existing.categories.length > 0) {
      await this.prisma.category.updateMany({
        where: { id: { in: existing.categories.map((c) => c.id) } },
        data: { category_group_id: null },
      });
    }

    const group = await this.prisma.categoryGroup.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false, updated_by: deleted_by },
      include: INCLUDE_DEFAULT,
    });
    await this.logAudit('CATEGORY_GROUP_DELETED', id, { user_id: deleted_by, details: { categories_ungrouped: existing.categories.length } });
    return shapeCategoryGroupResponse(group);
  }

  async restore(id: number, restored_by?: number) {
    const existing = await this.prisma.categoryGroup.findUnique({ where: { id }, include: INCLUDE_DEFAULT });
    if (!existing) throw new NotFoundException(`Category Group #${id} not found`);
    if (!existing.deleted_at) return shapeCategoryGroupResponse(existing); // not deleted, idempotent

    const group = await this.prisma.categoryGroup.update({
      where: { id },
      data: { deleted_at: null, is_active: true, updated_by: restored_by },
      include: INCLUDE_DEFAULT,
    });
    await this.logAudit('CATEGORY_GROUP_RESTORED', id, { user_id: restored_by });
    return shapeCategoryGroupResponse(group);
  }

  // -------------------------------------------------------------
  // REORDER
  // -------------------------------------------------------------
  async reorder(dto: ReorderCategoryGroupsDto) {
    const results = await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.categoryGroup.update({
          where: { id: item.id },
          data: { sort_order: item.sort_order, updated_by: dto.updated_by },
          include: INCLUDE_DEFAULT,
        }),
      ),
    );
    await this.logAudit('CATEGORY_GROUP_REORDERED', dto.items[0]?.id ?? 0, {
      user_id: dto.updated_by,
      details: { order: dto.items.map((i) => ({ id: i.id, sort_order: i.sort_order })) },
    });
    return results.map(shapeCategoryGroupResponse);
  }

  // -------------------------------------------------------------
  // BRANCH / CHANNEL ASSIGNMENT
  // -------------------------------------------------------------
  async assignBranches(id: number, dto: AssignCategoryGroupBranchesDto) {
    const existing = await this.prisma.categoryGroup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Category Group #${id} not found`);

    const group = await this.prisma.categoryGroup.update({
      where: { id },
      data: { assigned_stores: { set: dto.store_ids.map((sid) => ({ id: sid })) }, updated_by: dto.updated_by },
      include: INCLUDE_DEFAULT,
    });
    await this.logAudit('CATEGORY_GROUP_BRANCHES_ASSIGNED', id, { user_id: dto.updated_by, details: { store_ids: dto.store_ids } });
    return shapeCategoryGroupResponse(group);
  }

  async assignChannels(id: number, dto: AssignCategoryGroupChannelsDto) {
    const existing = await this.prisma.categoryGroup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Category Group #${id} not found`);

    const { updated_by, ...channels } = dto;
    const group = await this.prisma.categoryGroup.update({
      where: { id },
      data: { ...channels, updated_by },
      include: INCLUDE_DEFAULT,
    });
    await this.logAudit('CATEGORY_GROUP_CHANNELS_ASSIGNED', id, { user_id: updated_by, details: channels });
    return shapeCategoryGroupResponse(group);
  }

  // -------------------------------------------------------------
  // NESTED HIERARCHY — Menu Collection -> Category Group -> Category -> Product
  // -------------------------------------------------------------
  async getMenuHierarchy(menu_id: number) {
    const menu = await this.prisma.menu.findUnique({
      where: { id: menu_id },
      include: {
        categoryGroups: {
          where: { deleted_at: null },
          orderBy: { sort_order: 'asc' },
          include: {
            categories: {
              orderBy: { sort_order: 'asc' },
              include: { products: { where: { is_active: true }, orderBy: { name: 'asc' } } },
            },
          },
        },
      },
    });
    if (!menu) throw new NotFoundException(`Menu #${menu_id} not found`);
    return menu;
  }

/**
   * Navigation contract for POS/Website/Waiter/QR/Kiosk (Sprint 28.8A;
   * groups made optional in the Hotfix: Remove Runtime Migration Default
   * Groups): System Tabs -> Category Groups -> Categories -> Products.
   *
   * - `category_groups` lists only real, user-created groups.
   * - Categories with no group at all (`category_group_id: null` — the
   *   normal state for a restaurant that doesn't use groups, or a category
   *   whose group was deleted) surface as flat, top-level `categories`
   *   instead — never backed by an auto-created group of any kind. This is
   *   what makes "If no Category Groups exist: System Tabs -> Categories ->
   *   Products" the default, expected shape, not a fallback edge case.
   * - `tab=all_items` returns every category (grouped + ungrouped) flattened.
   * - `tab=discounted` returns discounted products across all categories,
   *   using the same active-campaign logic as POS pricing (PricingService).
   * - `category_group_id=X` returns only that group's categories.
   */
  async getStoreHierarchy(store_id: number, options: { channel?: string; tab?: string; category_group_id?: number } = {}) {
    const { channel, tab, category_group_id } = options;
    const store = await this.prisma.store.findUnique({ where: { id: store_id }, select: { brand_id: true } });
    if (!store) throw new NotFoundException(`Store #${store_id} not found`);

    const channelField = channel ? CHANNEL_FIELD[channel] : undefined;
    if (channel && !channelField) throw new BadRequestException(`Unknown channel "${channel}". Expected one of: ${Object.keys(CHANNEL_FIELD).join(', ')}`);

    if (tab && tab !== 'all_items' && tab !== 'discounted') {
      throw new BadRequestException(`Unknown tab "${tab}". Expected one of: all_items, discounted`);
    }

    const categoryWhere = {
      is_active: true,
      OR: [{ assigned_stores: { some: { id: store_id } } }, { assigned_stores: { none: {} } }],
    };
    const productInclude = {
      products: {
        where: {
          is_active: true,
          status: 'APPROVED',
          OR: [{ store_id }, { assigned_stores: { some: { id: store_id } } }, { assigned_stores: { none: {} } }],
        },
        orderBy: { name: 'asc' as const },
        // Previously omitted entirely, so POS/website never received a
        // product's sizes or extra-topping groups even though both already
        // have (POS) or expect (website) UI to select them -- every
        // variant-priced product just silently showed its base price
        // (often 0, since the real price lives on each variant) with no
        // way to choose a size at all.
        include: {
          variants: true,
          modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
          // Previously omitted, so POS/website's "belongs to an Add-ons
          // category" checks (p.categories?.some(...)) always saw undefined
          // and treated every product as category-less, regardless of what
          // was actually assigned in Admin.
          categories: { select: { id: true, name: true } },
        },
      },
    };

    const menus = await this.prisma.menu.findMany({
      where: { brand_id: store.brand_id, isActive: true, stores: { some: { id: store_id } } },
      include: {
        categoryGroups: {
          where: {
            deleted_at: null,
            is_active: true,
            is_system_default: false, // defensive: no group is ever created with this flag true anymore (runtime auto-creation removed), but guards against any stray historical row
            OR: [{ assigned_stores: { some: { id: store_id } } }, { assigned_stores: { none: {} } }],
            ...(channelField ? { [channelField]: true } : {}),
          },
          orderBy: { sort_order: 'asc' },
          include: { categories: { where: categoryWhere, orderBy: { sort_order: 'asc' }, include: productInclude } },
        },
      },
    });

    const realGroups = menus.flatMap((m) => m.categoryGroups);

    // Flat fallback pool — categories with no group at all (category_group_id:
    // null). Category Groups are optional (Hotfix: Remove Runtime Migration
    // Default Groups), so this is the normal, expected state for a
    // restaurant that doesn't use groups — never backed by an auto-created
    // "Default Group" row.
    const menuIds = menus.map((m) => m.id);
    const ungroupedCategories =
      menuIds.length === 0
        ? []
        : await this.prisma.category.findMany({
            where: { menu_id: { in: menuIds }, category_group_id: null, ...categoryWhere },
            orderBy: { sort_order: 'asc' },
            include: productInclude,
          });

    // category_group_id filter — return only that group's categories (bypasses the is_system_default exclusion if directly requested by id)
    if (category_group_id) {
      const requested =
        realGroups.find((g) => g.id === category_group_id) ??
        (await this.prisma.categoryGroup.findFirst({
          where: { id: category_group_id, menu_id: { in: menuIds } },
          include: { categories: { where: categoryWhere, orderBy: { sort_order: 'asc' }, include: productInclude } },
        }));
      if (!requested) throw new NotFoundException(`Category Group #${category_group_id} not found or not visible to store #${store_id}`);
      return {
        store_id,
        channel: channel ?? null,
        system_tabs: SYSTEM_TABS,
        category_group_id,
        category_group: { id: requested.id, name: requested.name, icon: requested.icon, color: requested.color },
        categories: requested.categories,
        synced_at: new Date().toISOString(),
      };
    }

    // tab=all_items — every category, flattened, groups collapsed
    if (tab === 'all_items') {
      const categories = [...realGroups.flatMap((g) => g.categories), ...ungroupedCategories];
      return { store_id, channel: channel ?? null, system_tabs: SYSTEM_TABS, tab, categories, synced_at: new Date().toISOString() };
    }

    // tab=discounted — discounted products across all categories, deduped
    if (tab === 'discounted') {
      const allProducts = [...realGroups.flatMap((g) => g.categories.flatMap((c) => c.products)), ...ungroupedCategories.flatMap((c) => c.products)];
      const uniqueProducts = Array.from(new Map(allProducts.map((p) => [p.id, p])).values());
      const promotionMap = await this.pricingService.hasActivePromotion(store_id, uniqueProducts.map((p) => p.id));
      const products = uniqueProducts.filter((p) => promotionMap[p.id]);
      return { store_id, channel: channel ?? null, system_tabs: SYSTEM_TABS, tab, products, synced_at: new Date().toISOString() };
    }

    // Default — full nested navigation contract
    return {
      store_id,
      channel: channel ?? null,
      system_tabs: SYSTEM_TABS,
      category_groups: realGroups,
      categories: ungroupedCategories, // flat fallback — non-empty whenever categories aren't (yet) in a real group
      synced_at: new Date().toISOString(),
    };
  }
}
