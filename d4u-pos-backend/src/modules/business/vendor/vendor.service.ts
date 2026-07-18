import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  // Get all Vendors
  async getVendors(store_id: number) {
    return this.prisma.vendor.findMany({ where: { store_id } });
  }

  // Create a Purchase Order
  async createPO(body: {
    store_id: number;
    vendor_id: number;
    items: { inventory_id: number; ordered_qty: number; price_unit: number }[];
  }) {
    const total_amount = body.items.reduce((sum, item) => sum + (item.ordered_qty * item.price_unit), 0);

    return this.prisma.purchaseOrder.create({
      data: {
        store_id: body.store_id,
        vendor_id: body.vendor_id,
        total_amount,
        items: {
          create: body.items.map(i => ({
            inventory_id: i.inventory_id,
            ordered_qty: i.ordered_qty,
            price_unit: i.price_unit
          }))
        }
      },
      include: { items: true }
    });
  }

  // Receive a Purchase Order and calculate Transit Loss
  async receivePO(poId: number, body: {
    received_items: { po_item_id: number; received_qty: number }[];
    payment_status: string; // PAID, UNPAID, PARTIAL
  }) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true }
      });

      if (!po) throw new NotFoundException('Purchase Order not found');

      let totalLossAmount = 0;

      for (const rx of body.received_items) {
        const item = po.items.find(i => i.id === rx.po_item_id);
        if (!item) continue;

        // 1. Update received quantity
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { received_qty: rx.received_qty }
        });

        // 2. Increment Inventory by ACTUAL received quantity
        await tx.inventoryItem.update({
          where: { id: item.inventory_id },
          data: { quantity: { increment: rx.received_qty } }
        });

        // 3. Calculate Transit Loss
        if (item.ordered_qty > rx.received_qty) {
          const lostQty = item.ordered_qty - rx.received_qty;
          await tx.transitLoss.create({
            data: {
              po_item_id: item.id,
              inventory_id: item.inventory_id,
              lost_qty: lostQty,
              reason: 'System Auto Transit Loss'
            }
          });
        }
      }

      // Update PO Status
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: 'DELIVERED',
          payment_status: body.payment_status,
          deliveredAt: new Date()
        }
      });

      // Update Vendor Ledger if UNPAID
      if (body.payment_status === 'UNPAID') {
        await tx.vendor.update({
          where: { id: po.vendor_id },
          data: { ledger_balance: { decrement: po.total_amount } } // Owe them money
        });
      }

      return updatedPO;
    });
  }
}
