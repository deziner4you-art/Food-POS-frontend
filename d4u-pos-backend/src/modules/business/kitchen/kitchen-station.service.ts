import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { writeKitchenAudit } from '../../../common/utils/kitchen-audit.util';

@Injectable()
export class KitchenStationService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  async listStations(store_id: number) {
    return this.prisma.kitchenStation.findMany({
      where: { store_id },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });
  }

  async createStation(store_id: number, name: string, sort_order?: number, user_id?: number) {
    const existing = await this.prisma.kitchenStation.findFirst({ where: { store_id, name } });
    if (existing) throw new BadRequestException(`A station named "${name}" already exists for this store.`);

    const station = await this.prisma.kitchenStation.create({
      data: { store_id, name, sort_order: sort_order ?? 0 },
    });
    await writeKitchenAudit(this.prisma, { action: 'STATION_CREATED', entity: 'KitchenStation', entity_id: station.id, user_id, details: { name } });
    this.gateway.broadcast('kitchen_stations_updated', { store_id }, `store_${store_id}`);
    return station;
  }

  async updateStation(id: number, data: { name?: string; is_active?: boolean; sort_order?: number }, user_id?: number) {
    const station = await this.prisma.kitchenStation.update({ where: { id }, data });
    await writeKitchenAudit(this.prisma, { action: 'STATION_UPDATED', entity: 'KitchenStation', entity_id: id, user_id, details: data });
    this.gateway.broadcast('kitchen_stations_updated', { store_id: station.store_id }, `store_${station.store_id}`);
    return station;
  }

  /** Never hard-deletes a station that already has products/history attached to it — deactivates instead. */
  async deleteStation(id: number, user_id?: number) {
    const productCount = await this.prisma.product.count({ where: { kitchen_station_id: id } });
    if (productCount > 0) {
      const station = await this.prisma.kitchenStation.update({ where: { id }, data: { is_active: false } });
      await writeKitchenAudit(this.prisma, { action: 'STATION_DEACTIVATED', entity: 'KitchenStation', entity_id: id, user_id, details: { reason: `${productCount} product(s) still assigned` } });
      this.gateway.broadcast('kitchen_stations_updated', { store_id: station.store_id }, `store_${station.store_id}`);
      return { success: true, deactivated: true, station };
    }
    const station = await this.prisma.kitchenStation.delete({ where: { id } });
    await writeKitchenAudit(this.prisma, { action: 'STATION_DELETED', entity: 'KitchenStation', entity_id: id, user_id });
    this.gateway.broadcast('kitchen_stations_updated', { store_id: station.store_id }, `store_${station.store_id}`);
    return { success: true, deactivated: false, station };
  }

  /** Assign (or unassign, when kitchen_station_id is null/undefined) a product to a station. */
  async assignProduct(product_id: number, kitchen_station_id: number | null, user_id?: number) {
    const product = await this.prisma.product.update({
      where: { id: product_id },
      data: { kitchen_station_id },
    });
    await writeKitchenAudit(this.prisma, {
      action: kitchen_station_id ? 'PRODUCT_ASSIGNED_TO_STATION' : 'PRODUCT_UNASSIGNED_FROM_STATION',
      entity: 'Product',
      entity_id: product_id,
      user_id,
      details: { kitchen_station_id },
    });
    return product;
  }

  async getStationProducts(station_id: number) {
    return this.prisma.product.findMany({ where: { kitchen_station_id: station_id, is_active: true } });
  }
}
