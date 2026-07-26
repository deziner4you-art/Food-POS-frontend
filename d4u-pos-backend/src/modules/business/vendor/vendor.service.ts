import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // VENDOR CRUD
  // ============================================================

  async getVendors(store_id: number) {
    return this.prisma.vendor.findMany({
      where: { store_id, status: { not: 'DELETED' } },
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVendorById(id: number) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { vendor: true },
        },
        ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!vendor) throw new NotFoundException(`Vendor #${id} not found`);
    return vendor;
  }

  async createVendor(body: {
    store_id: number;
    name: string;
    phone?: string;
    email?: string;
    contact_person?: string;
    address?: string;
    tax_number?: string;
    payment_terms?: string;
    credit_limit?: number;
    notes?: string;
  }) {
    return this.prisma.vendor.create({ data: body });
  }

  async updateVendor(id: number, body: Partial<{
    name: string;
    phone: string;
    email: string;
    contact_person: string;
    address: string;
    tax_number: string;
    payment_terms: string;
    credit_limit: number;
    notes: string;
    status: string;
  }>) {
    await this.getVendorById(id);
    return this.prisma.vendor.update({ where: { id }, data: body });
  }

  async deleteVendor(id: number) {
    await this.getVendorById(id);
    return this.prisma.vendor.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  async getVendorLedger(vendor_id: number) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendor_id } });
    if (!vendor) throw new NotFoundException(`Vendor #${vendor_id} not found`);
    const entries = await this.prisma.vendorLedgerEntry.findMany({
      where: { vendor_id },
      orderBy: { createdAt: 'desc' },
    });
    return { vendor, entries, balance: vendor.ledger_balance };
  }

  // ============================================================
  // PURCHASE ORDER LIFECYCLE
  // ============================================================

  async getPurchaseOrders(store_id: number, filters?: {
    status?: string;
    vendor_id?: number;
    from?: string;
    to?: string;
  }) {
    const where: any = { store_id };
    if (filters?.status) where.status = filters.status;
    if (filters?.vendor_id) where.vendor_id = Number(filters.vendor_id);
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: true,
        items: { include: { inventoryItem: true } },
        goodsReceipts: { select: { id: true, receipt_number: true, receivedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPurchaseOrderById(id: number) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: { include: { inventoryItem: true } },
        goodsReceipts: {
          include: { items: { include: { inventoryItem: true } } },
        },
      },
    });
    if (!po) throw new NotFoundException(`Purchase Order #${id} not found`);
    return po;
  }

  async createPO(body: {
    store_id: number;
    vendor_id: number;
    created_by: number;
    notes?: string;
    items: {
      inventory_id: number;
      ordered_qty: number;
      unit: string;
      unit_cost: number;
      discount?: number;
      tax?: number;
    }[];
  }) {
    // Validate vendor
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: body.vendor_id, store_id: body.store_id },
    });
    if (!vendor) throw new NotFoundException('Vendor not found for this store');

    // Generate unique PO number
    const count = await this.prisma.purchaseOrder.count({ where: { store_id: body.store_id } });
    const po_number = `PO-${body.store_id}-${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const itemsWithTotals = body.items.map((item) => {
      const discount = item.discount ?? 0;
      const tax = item.tax ?? 0;
      const line_total = item.ordered_qty * item.unit_cost * (1 - discount / 100) * (1 + tax / 100);
      subtotal += line_total;
      return {
        inventory_id: item.inventory_id,
        ordered_qty: item.ordered_qty,
        remaining_qty: item.ordered_qty,
        unit: item.unit,
        unit_cost: item.unit_cost,
        price_unit: item.unit_cost,
        discount,
        tax,
        line_total,
      };
    });

    return this.prisma.purchaseOrder.create({
      data: {
        store_id: body.store_id,
        vendor_id: body.vendor_id,
        po_number,
        status: 'DRAFT',
        created_by: body.created_by ?? 1,
        notes: body.notes,
        subtotal,
        grand_total: subtotal,
        total_amount: subtotal,
        items: { create: itemsWithTotals },
      },
      include: { vendor: true, items: { include: { inventoryItem: true } } },
    });
  }

  async updatePO(id: number, body: Partial<{
    notes: string;
    items: {
      inventory_id: number;
      ordered_qty: number;
      unit: string;
      unit_cost: number;
      discount: number;
      tax: number;
    }[];
  }>) {
    const po = await this.getPurchaseOrderById(id);
    if (!['DRAFT'].includes(po.status)) {
      throw new BadRequestException('Only DRAFT orders can be edited');
    }

    const updates: any = {};
    if (body.notes !== undefined) updates.notes = body.notes;

    if (body.items) {
      // Delete old items and re-create
      await this.prisma.purchaseOrderItem.deleteMany({ where: { po_id: id } });
      let subtotal = 0;
      const newItems = body.items.map((item) => {
        const discount = item.discount ?? 0;
        const tax = item.tax ?? 0;
        const line_total = item.ordered_qty * item.unit_cost * (1 - discount / 100) * (1 + tax / 100);
        subtotal += line_total;
        return { po_id: id, inventory_id: item.inventory_id, ordered_qty: item.ordered_qty, remaining_qty: item.ordered_qty, unit: item.unit, unit_cost: item.unit_cost, price_unit: item.unit_cost, discount, tax, line_total };
      });
      await this.prisma.purchaseOrderItem.createMany({ data: newItems });
      updates.subtotal = subtotal;
      updates.grand_total = subtotal;
      updates.total_amount = subtotal;
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updates,
      include: { vendor: true, items: { include: { inventoryItem: true } } },
    });
  }

  async submitPO(id: number) {
    const po = await this.getPurchaseOrderById(id);
    if (po.status !== 'DRAFT') throw new BadRequestException('Only DRAFT orders can be submitted');
    if (po.items.length === 0) throw new BadRequestException('Cannot submit empty PO');
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: 'PENDING' } });
  }

  async approvePO(id: number, approved_by: number) {
    const po = await this.getPurchaseOrderById(id);
    if (po.status !== 'PENDING') throw new BadRequestException('Only PENDING orders can be approved');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED', approved_by, approvedAt: new Date() },
    });
  }

  async cancelPO(id: number, reason?: string) {
    const po = await this.getPurchaseOrderById(id);
    if (['COMPLETED', 'CANCELLED'].includes(po.status)) {
      throw new BadRequestException('Cannot cancel a completed or already cancelled order');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason ? `CANCELLED: ${reason}` : po.notes },
    });
  }

  // ============================================================
  // GOODS RECEIVING NOTE (GRN) — WITH WAC RECALCULATION
  // ============================================================

  async getGRNs(store_id: number, po_id?: number) {
    const where: any = { store_id };
    if (po_id) where.po_id = Number(po_id);
    return this.prisma.goodsReceipt.findMany({
      where,
      include: {
        purchaseOrder: { include: { vendor: true } },
        items: { include: { inventoryItem: true } },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async getGRNById(id: number) {
    const grn = await this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        purchaseOrder: { include: { vendor: true } },
        items: { include: { inventoryItem: true, poItem: true } },
      },
    });
    if (!grn) throw new NotFoundException(`GRN #${id} not found`);
    return grn;
  }

  async createGRN(body: {
    store_id: number;
    po_id: number;
    received_by: number;
    invoice_number?: string;
    notes?: string;
    items: {
      po_item_id: number;
      inventory_id: number;
      received_qty: number;
      rejected_qty?: number;
      damaged_qty?: number;
      unit_cost: number;
      expiry_date?: string;
      batch_number?: string;
    }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate PO
      const po = await tx.purchaseOrder.findUnique({
        where: { id: body.po_id },
        include: { items: true, vendor: true },
      });
      if (!po) throw new NotFoundException('Purchase Order not found');
      if (po.store_id !== body.store_id) throw new BadRequestException('PO does not belong to this store');
      if (po.status === 'CANCELLED') throw new BadRequestException('Cannot receive against a cancelled PO');
      if (po.status === 'COMPLETED') throw new BadRequestException('PO is already fully received');
      if (!['APPROVED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
        throw new BadRequestException('PO must be APPROVED before receiving');
      }

      // 2. Validate line items against PO
      for (const item of body.items) {
        const poItem = po.items.find((i) => i.id === item.po_item_id);
        if (!poItem) throw new BadRequestException(`PO item #${item.po_item_id} not found in PO`);
        if (item.received_qty <= 0) throw new BadRequestException('received_qty must be greater than 0');
        const maxReceivable = poItem.remaining_qty;
        if (item.received_qty > maxReceivable) {
          throw new BadRequestException(
            `Received qty (${item.received_qty}) exceeds remaining qty (${maxReceivable}) for item #${item.po_item_id}`,
          );
        }
      }

      // 3. Generate GRN number
      const grnCount = await tx.goodsReceipt.count({ where: { store_id: body.store_id } });
      const receipt_number = `GRN-${body.store_id}-${String(grnCount + 1).padStart(5, '0')}`;

      // 4. Create GRN header
      const grn = await tx.goodsReceipt.create({
        data: {
          store_id: body.store_id,
          po_id: body.po_id,
          receipt_number,
          invoice_number: body.invoice_number,
          received_by: body.received_by,
          notes: body.notes,
        },
      });

      // 5. Process each line item: WAC recalculation + inventory update
      let totalGRNValue = 0;

      for (const item of body.items) {
        // Create GRN item
        await tx.goodsReceiptItem.create({
          data: {
            grn_id: grn.id,
            po_item_id: item.po_item_id,
            inventory_id: item.inventory_id,
            received_qty: item.received_qty,
            rejected_qty: item.rejected_qty ?? 0,
            damaged_qty: item.damaged_qty ?? 0,
            unit_cost: item.unit_cost,
            expiry_date: item.expiry_date ? new Date(item.expiry_date) : undefined,
            batch_number: item.batch_number,
          },
        });

        // WAC Recalculation
        // New WAC = ((Current Qty × Current WAC) + (Received Qty × Unit Cost)) / (Current Qty + Received Qty)
        const invItem = await tx.inventoryItem.findUnique({ where: { id: item.inventory_id } });
        if (!invItem) throw new NotFoundException(`Inventory item #${item.inventory_id} not found`);

        const currentQty = invItem.quantity;
        const currentWAC = invItem.unit_price;
        const receivedQty = item.received_qty;
        const unitCost = item.unit_cost;

        let newWAC: number;
        const newTotalQty = currentQty + receivedQty;
        if (newTotalQty === 0) {
          newWAC = unitCost;
        } else {
          newWAC = (currentQty * currentWAC + receivedQty * unitCost) / newTotalQty;
        }

        // Update inventory quantity and WAC
        await tx.inventoryItem.update({
          where: { id: item.inventory_id },
          data: {
            quantity: { increment: receivedQty },
            unit_price: newWAC,
          },
        });

        // Log inventory transaction
        await tx.inventoryTransactionLog.create({
          data: {
            inventory_id: item.inventory_id,
            operation: 'ADD',
            amount: receivedQty,
            reason: `GRN: ${receipt_number} | PO: ${po.po_number}`,
            changed_by: body.received_by,
          },
        });

        // Update PO item: received_qty and remaining_qty
        const poItem = po.items.find((i) => i.id === item.po_item_id)!;
        const newReceivedQty = poItem.received_qty + receivedQty;
        const newRemainingQty = poItem.ordered_qty - newReceivedQty;
        await tx.purchaseOrderItem.update({
          where: { id: item.po_item_id },
          data: {
            received_qty: newReceivedQty,
            remaining_qty: Math.max(0, newRemainingQty),
          },
        });

        totalGRNValue += receivedQty * unitCost;
      }

      // 6. Determine new PO status (PARTIALLY_RECEIVED or COMPLETED)
      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { po_id: body.po_id } });
      const allFullyReceived = updatedItems.every((i) => i.remaining_qty <= 0);
      const newPOStatus = allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED';

      await tx.purchaseOrder.update({
        where: { id: body.po_id },
        data: { status: newPOStatus },
      });

      // 7. Vendor Ledger — debit entry (we now owe the vendor)
      const currentVendor = await tx.vendor.findUnique({ where: { id: po.vendor_id } });
      const newBalance = (currentVendor?.ledger_balance ?? 0) - totalGRNValue;
      await tx.vendor.update({
        where: { id: po.vendor_id },
        data: { ledger_balance: newBalance },
      });
      await tx.vendorLedgerEntry.create({
        data: {
          vendor_id: po.vendor_id,
          type: 'INVOICE',
          reference: receipt_number,
          amount: totalGRNValue,
          balance_after: newBalance,
        },
      });

      return { grn, poStatus: newPOStatus, totalGRNValue };
    });
  }

  // ============================================================
  // PURCHASE DASHBOARD STATS
  // ============================================================

  async getDashboardStats(store_id: number) {
    const [activePOs, pendingGRNs, totalPOsThisMonth, vendors] = await Promise.all([
      this.prisma.purchaseOrder.count({
        where: { store_id, status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] } },
      }),
      this.prisma.purchaseOrder.count({
        where: { store_id, status: 'APPROVED' },
      }),
      this.prisma.purchaseOrder.findMany({
        where: {
          store_id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        select: { grand_total: true },
      }),
      this.prisma.vendor.findMany({
        where: { store_id, status: 'ACTIVE' },
        select: { ledger_balance: true },
      }),
    ]);

    const totalMonthlyPurchases = totalPOsThisMonth.reduce((sum, po) => sum + po.grand_total, 0);
    const totalLiabilities = vendors.reduce((sum, v) => sum + Math.abs(Math.min(v.ledger_balance, 0)), 0);

    const recentOrders = await this.prisma.purchaseOrder.findMany({
      where: { store_id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { vendor: { select: { name: true } } },
    });

    return {
      activePOs,
      pendingGRNs,
      totalMonthlyPurchases,
      totalLiabilities,
      recentOrders,
    };
  }
}
