import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { writeKitchenAudit } from '../../../common/utils/kitchen-audit.util';

/**
 * Kitchen requests more of an ingredient from inventory/management.
 * Deliberately a read-model + status workflow only — approving/fulfilling a
 * request does NOT itself move stock (that stays a manual InventoryItem
 * adjustment via the existing inventory.service.ts, so there's exactly one
 * place stock quantities actually change, avoiding a second, competing
 * mutation path).
 */
@Injectable()
export class StockRequestService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  async create(params: {
    store_id: number;
    inventory_id: number;
    requested_qty: number;
    unit: string;
    kitchen_station_id?: number;
    chef_session_id?: number;
    requested_by_name?: string;
    reason?: string;
  }) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: params.inventory_id } });
    if (!item) throw new BadRequestException('Inventory item not found');

    const request = await this.prisma.stockRequest.create({
      data: {
        store_id: params.store_id,
        inventory_id: params.inventory_id,
        requested_qty: params.requested_qty,
        unit: params.unit,
        kitchen_station_id: params.kitchen_station_id ?? null,
        chef_session_id: params.chef_session_id ?? null,
        requested_by_name: params.requested_by_name ?? null,
        reason: params.reason ?? null,
        status: 'PENDING',
      },
    });

    await writeKitchenAudit(this.prisma, {
      action: 'STOCK_REQUESTED',
      entity: 'StockRequest',
      entity_id: request.id,
      details: { inventory_id: params.inventory_id, requested_qty: params.requested_qty, requested_by_name: params.requested_by_name },
    });
    this.gateway.broadcast('stock_request_created', { store_id: params.store_id, request }, `store_${params.store_id}`);
    return request;
  }

  async list(store_id: number, status?: string) {
    return this.prisma.stockRequest.findMany({
      where: { store_id, status: status ?? undefined },
      include: { inventory: true, station: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(id: number, status: 'APPROVED' | 'FULFILLED' | 'REJECTED', approved_by: number, fulfilled_qty?: number) {
    const existing = await this.prisma.stockRequest.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Stock request not found');
    if (existing.status === 'FULFILLED' || existing.status === 'REJECTED') {
      throw new BadRequestException(`Request already ${existing.status.toLowerCase()}.`);
    }

    const updated = await this.prisma.stockRequest.update({
      where: { id },
      data: {
        status,
        approved_by,
        fulfilled_qty: status === 'FULFILLED' ? (fulfilled_qty ?? existing.requested_qty) : fulfilled_qty ?? null,
        resolvedAt: status === 'FULFILLED' || status === 'REJECTED' ? new Date() : null,
      },
    });

    await writeKitchenAudit(this.prisma, {
      action: `STOCK_REQUEST_${status}`,
      entity: 'StockRequest',
      entity_id: id,
      user_id: approved_by,
      details: { fulfilled_qty },
    });
    this.gateway.broadcast('stock_request_updated', { store_id: existing.store_id, request: updated }, `store_${existing.store_id}`);
    return updated;
  }
}
