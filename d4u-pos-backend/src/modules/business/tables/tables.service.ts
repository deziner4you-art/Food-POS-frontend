import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

const ASSIGNABLE_STATUSES = ['AVAILABLE', 'RESERVED'];

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async listTables(store_id: number) {
    return this.prisma.restaurantTable.findMany({
      where: { store_id },
      orderBy: { label: 'asc' },
    });
  }

  private async findOrCreate(
    store_id: number,
    label: string,
    client: PrismaClientOrTx,
  ) {
    const existing = await client.restaurantTable.findUnique({
      where: { store_id_label: { store_id, label } },
    });
    if (existing) return existing;
    return client.restaurantTable.create({
      data: { store_id, label, status: 'AVAILABLE' },
    });
  }

  /**
   * Assigns an order to a table by label, auto-provisioning the table row the
   * first time a given label is used for a store (tables aren't pre-seeded via
   * an admin screen in this foundation phase). Validates the table isn't
   * already occupied by a different order and that the order doesn't already
   * hold a different table. Safe to call inside an existing Prisma
   * $transaction by passing `tx`.
   */
  async assignTable(
    store_id: number,
    label: string,
    order_id: number,
    client: PrismaClientOrTx = this.prisma,
  ) {
    const table = await this.findOrCreate(store_id, label, client);
    const alreadyHeldByThisOrder = table.current_order_id === order_id;

    if (!alreadyHeldByThisOrder) {
      if (table.status === 'OCCUPIED') {
        throw new ConflictException(
          `Table ${label} is already occupied by order #${table.current_order_id}`,
        );
      }
      if (!ASSIGNABLE_STATUSES.includes(table.status)) {
        throw new ConflictException(
          `Table ${label} is not available for assignment (status: ${table.status})`,
        );
      }
    }

    const conflictingTable = await client.restaurantTable.findFirst({
      where: { store_id, current_order_id: order_id, NOT: { id: table.id } },
    });
    if (conflictingTable) {
      throw new ConflictException(
        `Order #${order_id} is already assigned to table ${conflictingTable.label}`,
      );
    }

    return client.restaurantTable.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED', current_order_id: order_id },
    });
  }

  /** Frees whichever table (if any) currently holds this order — called after settle/void. */
  async releaseTableByOrderId(
    order_id: number,
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.restaurantTable.updateMany({
      where: { current_order_id: order_id },
      data: { status: 'AVAILABLE', current_order_id: null },
    });
  }

  /** Manual release, independent of order status — gated to Manager permission at the controller. */
  async releaseTable(store_id: number, id: number) {
    const table = await this.prisma.restaurantTable.findFirst({
      where: { id, store_id },
    });
    if (!table) throw new NotFoundException(`Table #${id} not found`);

    return this.prisma.restaurantTable.update({
      where: { id },
      data: { status: 'AVAILABLE', current_order_id: null },
    });
  }
}
