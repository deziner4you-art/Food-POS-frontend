import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { writeKitchenAudit } from '../../../common/utils/kitchen-audit.util';
import { verifyManagerPin } from '../../../common/utils/manager-auth.util';

@Injectable()
export class InventoryLockService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  async listActiveLocks(store_id: number) {
    return this.prisma.inventoryLock.findMany({
      where: { store_id, is_active: true },
      include: { inventory: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** True if this inventory item currently has an active lock — Recipe Availability treats it as 0 stock while locked. */
  async isLocked(inventory_id: number): Promise<boolean> {
    const lock = await this.prisma.inventoryLock.findFirst({ where: { inventory_id, is_active: true } });
    return !!lock;
  }

  async lockItem(store_id: number, inventory_id: number, reason?: string, kot_id?: number, locked_by?: number) {
    const existing = await this.prisma.inventoryLock.findFirst({ where: { inventory_id, is_active: true } });
    if (existing) throw new BadRequestException('This inventory item is already locked.');

    const lock = await this.prisma.inventoryLock.create({
      data: { store_id, inventory_id, kot_id: kot_id ?? null, reason: reason ?? null, locked_by: locked_by ?? null },
    });
    await writeKitchenAudit(this.prisma, {
      action: 'INVENTORY_LOCKED',
      entity: 'InventoryLock',
      entity_id: lock.id,
      user_id: locked_by,
      details: { inventory_id, reason, kot_id },
    });
    this.gateway.broadcast('inventory_lock_updated', { store_id, inventory_id, locked: true }, `store_${store_id}`);
    return lock;
  }

  /**
   * Manager Unlock — mirrors PosOrdersService.voidOrder's manager-PIN
   * pattern exactly: the caller names WHICH manager is authorizing
   * (approved_by), the PIN is re-verified server-side against that
   * manager's own hashedPin, never trusted from the client.
   */
  async unlockItem(lock_id: number, manager_pin: string, approved_by: number) {
    await verifyManagerPin(this.prisma, approved_by, manager_pin);

    const lock = await this.prisma.inventoryLock.findUnique({ where: { id: lock_id } });
    if (!lock || !lock.is_active) throw new BadRequestException('Lock not found or already released.');

    const updated = await this.prisma.inventoryLock.update({
      where: { id: lock_id },
      data: { is_active: false, releasedAt: new Date(), released_by: approved_by },
    });
    await writeKitchenAudit(this.prisma, {
      action: 'INVENTORY_UNLOCKED',
      entity: 'InventoryLock',
      entity_id: lock_id,
      user_id: approved_by,
      details: { inventory_id: lock.inventory_id },
    });
    this.gateway.broadcast('inventory_lock_updated', { store_id: lock.store_id, inventory_id: lock.inventory_id, locked: false }, `store_${lock.store_id}`);
    return updated;
  }
}
