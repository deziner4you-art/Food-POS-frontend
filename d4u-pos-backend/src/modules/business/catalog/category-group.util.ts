import { PrismaService } from '../../../database/prisma/prisma.service';

/**
 * A brand-new category (or category group) previously had nowhere to attach
 * if its brand hadn't had a Menu set up yet. Shared by CatalogService (CSV
 * import, category create) and CategoryGroupService (create) so both fall
 * back to the same "Main Menu" per brand instead of duplicating the lookup.
 */
export async function getOrCreateDefaultMenuId(prisma: PrismaService, store_id: number): Promise<number | null> {
  const store = await prisma.store.findUnique({ where: { id: store_id }, select: { brand_id: true } });
  if (!store) return null;
  let menu = await prisma.menu.findFirst({ where: { brand_id: store.brand_id } });
  if (!menu) {
    menu = await prisma.menu.create({
      data: { brand_id: store.brand_id, name: 'Main Menu', stores: { connect: [{ id: store_id }] } },
    });
  }
  return menu.id;
}

export interface ChannelVisibilityInput {
  pos?: boolean;
  website?: boolean;
  waiter?: boolean;
  qr?: boolean;
  kiosk?: boolean;
  delivery?: boolean;
  takeaway?: boolean;
}

/** channel_visibility.{pos,website,waiter,qr,kiosk,delivery,takeaway} -> flat visible_* columns (the admin UI's exact nested shape). */
export function channelVisibilityToColumns(cv: ChannelVisibilityInput | undefined) {
  if (!cv) return {};
  const out: Record<string, boolean> = {};
  if (cv.pos !== undefined) out.visible_pos = cv.pos;
  if (cv.website !== undefined) out.visible_website = cv.website;
  if (cv.waiter !== undefined) out.visible_waiter = cv.waiter;
  if (cv.qr !== undefined) out.visible_qr_menu = cv.qr;
  if (cv.kiosk !== undefined) out.visible_kiosk = cv.kiosk;
  if (cv.delivery !== undefined) out.visible_delivery = cv.delivery;
  if (cv.takeaway !== undefined) out.visible_takeaway = cv.takeaway;
  return out;
}

/** Flat visible_* columns -> channel_visibility.{...} nested object, for API responses the admin UI reads directly. */
export function columnsToChannelVisibility(group: {
  visible_pos: boolean;
  visible_website: boolean;
  visible_waiter: boolean;
  visible_qr_menu: boolean;
  visible_kiosk: boolean;
  visible_delivery: boolean;
  visible_takeaway: boolean;
}) {
  return {
    pos: group.visible_pos,
    website: group.visible_website,
    waiter: group.visible_waiter,
    qr: group.visible_qr_menu,
    kiosk: group.visible_kiosk,
    delivery: group.visible_delivery,
    takeaway: group.visible_takeaway,
  };
}

/** Shapes a CategoryGroup row for the admin UI: adds channel_visibility (nested) and store_ids (plain array) alongside the existing flat/relation fields. */
export function shapeCategoryGroupResponse<T extends { assigned_stores?: { id: number }[] }>(group: T) {
  return {
    ...group,
    channel_visibility: columnsToChannelVisibility(group as any),
    store_ids: (group.assigned_stores || []).map((s) => s.id),
  };
}
