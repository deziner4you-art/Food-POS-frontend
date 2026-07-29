import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * Menu Builder audit trail (Sprint 28.8D) — reuses SystemAuditLog, same
 * generic entity/entity_id/details shape as writeKitchenAudit. Covers bulk
 * category-group assignment, bulk product-category assignment, CSV import,
 * and CSV export.
 */
export async function writeCatalogAudit(
  prisma: PrismaService,
  params: {
    action: string; // e.g. BULK_CATEGORY_GROUP_ASSIGNED, BULK_PRODUCT_CATEGORY_ASSIGNED, PRODUCTS_CSV_IMPORTED, PRODUCTS_CSV_EXPORTED
    entity: string; // e.g. 'Category', 'Product', 'ProductCsv'
    entity_id?: number;
    user_id?: number;
    user_name?: string;
    details?: Record<string, any>;
  },
) {
  await prisma.systemAuditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entity_id: params.entity_id ?? null,
      user_id: params.user_id ?? null,
      user_name: params.user_name ?? null,
      details: params.details ?? undefined,
    },
  });
}
