import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../app.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class PosOrdersService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    private inventoryService: InventoryService,
    private customersService: CustomersService,
  ) {}

  // تمام آرڈرز — آج کی Business Day کے
  async getOrders(store_id: number, business_day_id?: number) {
    const where: any = { store_id };
    if (business_day_id) where.business_day_id = business_day_id;
    else {
      // اگر business_day_id نہ دیا تو آج کے open day کے آرڈرز
      const openDay = await this.prisma.businessDay.findFirst({
        where: { store_id, status: 'OPEN' },
        orderBy: { id: 'desc' },
      });
      if (openDay) where.business_day_id = openDay.id;
    }

    return this.prisma.order.findMany({
      where,
      include: { items: { include: { product: true } }, customer: true },
      orderBy: { id: 'desc' },
    });
  }

  // ایک آرڈر کی تفصیل
  async getOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: true, kot: true },
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  // نیا Walk-in آرڈر بنائیں
  async createOrder(body: {
    store_id: number;
    created_by: number;
    customer_id?: number;
    items: { product_id: number; quantity: number; price: number; special_inst?: string }[];
    discount?: number;
    payment_method?: string;
    order_source?: string;
    table_no?: string;
    is_offline?: boolean;
    delivery_address?: string;
    notes?: string;
  }) {
    // Active Business Day تلاش کریں
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id: body.store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
    });

    const total_amount =
      body.items.reduce((sum, i) => sum + i.price * i.quantity, 0) -
      (body.discount || 0);

    // Order + Items + KOT ایک ہی transaction میں
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          store_id: body.store_id,
          business_day_id: openDay?.id ?? null,
          customer_id: body.customer_id ?? null,
          created_by: body.created_by,
          business_date: new Date(),
          total_amount,
          discount: body.discount ?? 0,
          status: 'PENDING',
          order_source: body.order_source ?? 'WALKIN',
          payment_method: body.payment_method ?? 'CASH',
          payment_status: 'PAID',
          table_no: body.table_no ?? null,
          is_offline: body.is_offline ?? false,
          delivery_address: body.delivery_address ?? null,
          items: {
            create: body.items.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
              price: i.price,
              special_inst: i.special_inst ?? null,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // KOT خودکار بنائیں
      const kotItems = order.items.map((i) => ({
        name: i.product.name,
        qty: i.quantity,
        price: i.price,
        specialInst: i.special_inst ?? '',
      }));

      await tx.kOT.create({
        data: {
          store_id: body.store_id,
          order_id: order.id,
          business_day_id: openDay?.id ?? null,
          items: kotItems,
          status: 'NEW',
        },
      });

      // Customer کا آرڈر count بڑھائیں
      if (body.customer_id) {
        await tx.customer.update({
          where: { id: body.customer_id },
          data: { total_orders: { increment: 1 } },
        });
      }

      return order;
    });

    console.log(`[NEW POS ORDER] #${result.id} | Total: Rs.${total_amount} | Store: ${body.store_id}`);

    // Socket event — KDS اسکرین کو بتائیں
    this.gateway.broadcast('new_kot', {
      order_id: result.id,
      store_id: body.store_id,
      items: result.items,
    });

    // Auto-deduct inventory
    this.inventoryService.deductForOrder(result.id).catch(err => 
      console.error(`[PosOrders] Failed to deduct inventory for #${result.id}:`, err)
    );

    // Auto-credit Loyalty Points
    if (body.customer_id) {
      this.customersService.earnPoints(body.customer_id, result.id, total_amount).catch(err => 
        console.error(`[PosOrders] Failed to credit loyalty points for #${result.id}:`, err)
      );
    }

    return { success: true, order: result };
  }

  // آرڈر VOID کریں (مینیجر PIN لازمی)
  async voidOrder(id: number, body: { void_reason: string; manager_pin: string; approved_by: number }) {
    // مینیجر PIN چیک کریں
    const manager = await this.prisma.user.findUnique({
      where: { id: body.approved_by },
      include: { role: true },
    });

    if (!manager || manager.hashedPin !== body.manager_pin) {
      throw new ForbiddenException('Invalid manager PIN');
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'VOIDED',
        void_reason: body.void_reason,
        void_approved_by: body.approved_by,
      },
    });

    // KOT بھی CANCELLED کریں
    await this.prisma.kOT.updateMany({
      where: { order_id: id },
      data: { status: 'CANCELLED' },
    });

    console.log(`[VOID] Order #${id} — Reason: ${body.void_reason} — By Manager: ${manager.name}`);
    this.gateway.broadcast('order_voided', { order_id: id });

    return { success: true, order };
  }

  // آرڈر SETTLE کریں (پیمنٹ وصول)
  async settleOrder(id: number, body: { payment_method: string; amount_received?: number }) {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'SETTLED',
        payment_method: body.payment_method,
        payment_status: 'PAID',
      },
    });

    console.log(`[SETTLED] POS Order #${id} | Method: ${body.payment_method}`);
    this.gateway.broadcast('order_settled', { order_id: id });

    return { success: true, order };
  }

  // آج کی Sales Summary
  async getSalesSummary(store_id: number, business_day_id?: number) {
    const openDay = business_day_id
      ? { id: business_day_id }
      : await this.prisma.businessDay.findFirst({
          where: { store_id, status: 'OPEN' },
          orderBy: { id: 'desc' },
        });

    if (!openDay) return { total: 0, orders: 0, voids: 0 };

    const orders = await this.prisma.order.findMany({
      where: { store_id, business_day_id: openDay.id, status: { not: 'VOIDED' } },
    });

    const voids = await this.prisma.order.count({
      where: { store_id, business_day_id: openDay.id, status: 'VOIDED' },
    });

    const total = orders.reduce((s, o) => s + o.total_amount, 0);
    return { total, orders: orders.length, voids, business_day_id: openDay.id };
  }

  // Sync locally stored Dexie offline orders
  async syncOfflineOrders(orders: any[]) {
    // We will use a transaction to insert all orders safely
    return this.prisma.$transaction(async (tx) => {
      let syncedCount = 0;
      for (const order of orders) {
        // Parse itemsData if available, otherwise fallback to empty array
        let items: any[] = [];
        try {
          if (order.itemsData) items = JSON.parse(order.itemsData);
        } catch (e) {
          console.error('Failed to parse offline itemsData', e);
        }

        const newOrder = await tx.order.create({
          data: {
            store_id: 1, // Fallback, could be extracted from app context
            business_day_id: 1, // Will map to active day normally
            business_date: new Date(),
            customer_id: null,
            order_source: 'OFFLINE_SYNC',
            status: order.status === 'READY' ? 'DELIVERED' : 'PAID', // Map POS final status
            total_amount: order.totalAmount || 0,
            payment_status: 'PAID',
            payment_method: order.paymentMethod || 'CASH',
            is_offline: true,
            created_by: 1, // System fallback
            items: {
              create: items.map((i: any) => ({
                product_id: i.id || 1, // Extract product_id from structured local cart
                quantity: i.qty || 1,
                price: i.price || 0,
              }))
            }
          }
        });
        syncedCount++;
      }
      return { success: true, syncedCount };
    });
  }
}
