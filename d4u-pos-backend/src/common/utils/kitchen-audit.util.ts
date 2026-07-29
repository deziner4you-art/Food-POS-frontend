import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * KDS audit trail — reuses SystemAuditLog (schema.prisma), which already
 * existed but had zero writers anywhere in the codebase before this. Mirrors
 * MarketingService's writeAudit -> CampaignAuditLog pattern, generalized to
 * SystemAuditLog's generic entity/entity_id shape so every kitchen entity
 * (ticket, station, stock request, inventory lock, chef session) can share
 * one audit table instead of each needing its own.
 */
export async function writeKitchenAudit(
  prisma: PrismaService,
  params: {
    action: string; // e.g. TICKET_BUMPED, TICKET_RECALLED, STATION_CREATED, STOCK_REQUESTED, INVENTORY_LOCKED, INVENTORY_UNLOCKED, CHEF_SESSION_STARTED
    entity: string; // e.g. 'KOT', 'KitchenStation', 'StockRequest', 'InventoryLock', 'ChefSession'
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
