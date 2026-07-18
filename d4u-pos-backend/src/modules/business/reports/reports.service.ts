import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // روزانہ کی رپورٹ
  async getDailyReport(store_id: number, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const [orders, voidedOrders, onlineOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          store_id,
          status: { not: 'VOIDED' },
          createdAt: { gte: start, lte: end },
        },
        include: { items: true },
      }),
      this.prisma.order.count({
        where: { store_id, status: 'VOIDED', createdAt: { gte: start, lte: end } },
      }),
      this.prisma.onlineOrder.count({
        where: { status: { in: ['SETTLED', 'DELIVERED'] }, createdAt: { gte: start, lte: end } },
      }),
    ]);

    const totalSales = orders.reduce((s, o) => s + o.total_amount, 0);
    const totalDiscount = orders.reduce((s, o) => s + o.discount, 0);
    const cashOrders = orders.filter((o) => o.payment_method === 'CASH').length;
    const cardOrders = orders.filter((o) => o.payment_method === 'CARD').length;

    return {
      date: targetDate.toISOString().split('T')[0],
      totalSales,
      totalOrders: orders.length,
      totalDiscount,
      voidedOrders,
      onlineOrders,
      cashOrders,
      cardOrders,
      avgOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
    };
  }

  // Branch Analytics (Advanced Filtering)
  async getBranchAnalytics(store_id: number, start_date?: string, end_date?: string, business_day_id?: number, cashier_id?: number) {
    const where: any = {
      store_id,
      status: { not: 'VOIDED' },
    };

    if (start_date && end_date) {
      const start = new Date(start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    } else if (start_date) {
      const start = new Date(start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start_date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    if (business_day_id) {
      where.business_day_id = business_day_id;
    }

    if (cashier_id) {
      where.created_by = cashier_id;
    }

    const [posOrders, onlineOrdersDb, voidedCount] = await Promise.all([
      this.prisma.order.findMany({
        where: { ...where, is_offline: false, order_source: { in: ['WALKIN', 'DINEIN'] } }, // Typical POS sales
        include: { items: true, approver: { select: { name: true } } },
      }),
      this.prisma.order.findMany({
        where: { ...where, order_source: { in: ['ONLINE', 'WHATSAPP', 'CALL'] } }, // Online/Delivery
        include: { items: true },
      }),
      this.prisma.order.count({
        where: { ...where, status: 'VOIDED' },
      }),
    ]);

    const posSales = posOrders.reduce((s, o) => s + o.total_amount, 0);
    const onlineSales = onlineOrdersDb.reduce((s, o) => s + o.total_amount, 0);
    const totalSales = posSales + onlineSales;
    
    const posDiscount = posOrders.reduce((s, o) => s + o.discount, 0);
    const onlineDiscount = onlineOrdersDb.reduce((s, o) => s + o.discount, 0);
    const totalDiscount = posDiscount + onlineDiscount;

    // Cashier Breakdown (for POS orders usually, but we'll include all matching `where`)
    const allOrders = [...posOrders, ...onlineOrdersDb];
    const cashierBreakdownMap = new Map();

    for (const order of allOrders) {
      if (!order.created_by) continue;
      
      let entry = cashierBreakdownMap.get(order.created_by);
      if (!entry) {
        // Fetch user details for the cashier once
        const user = await this.prisma.user.findUnique({ where: { id: order.created_by } });
        entry = {
          cashier_id: order.created_by,
          cashier_name: user?.name || 'Unknown',
          total_orders: 0,
          total_sales: 0,
          total_discount: 0
        };
        cashierBreakdownMap.set(order.created_by, entry);
      }
      
      entry.total_orders += 1;
      entry.total_sales += order.total_amount;
      entry.total_discount += order.discount;
    }

    return {
      overview: {
        posSales,
        onlineSales,
        totalSales,
        totalDiscount,
        posOrders: posOrders.length,
        onlineOrders: onlineOrdersDb.length,
        totalOrders: allOrders.length,
        voidedCount
      },
      cashierBreakdown: Array.from(cashierBreakdownMap.values())
    };
  }

  // Get Shifts (Business Days)
  async getShifts(store_id: number, limit = 10) {
    return this.prisma.businessDay.findMany({
      where: { store_id },
      orderBy: { id: 'desc' },
      take: limit,
      include: {
        starter: { select: { id: true, name: true } },
        closer: { select: { id: true, name: true } }
      }
    });
  }

  // سب سے زیادہ بکنے والی چیزیں
  async getTopProducts(store_id: number, limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['product_id'],
      where: { order: { store_id, status: { not: 'VOIDED' } } },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const products = await Promise.all(
      items.map(async (item) => {
        const product = await this.prisma.product.findUnique({ where: { id: item.product_id } });
        return {
          product,
          total_qty: item._sum.quantity,
          total_orders: item._count.id,
        };
      }),
    );

    return products;
  }

  // Void آرڈرز کی Audit List
  async getVoidedOrders(store_id: number, business_day_id?: number) {
    const where: any = { store_id, status: 'VOIDED' };
    if (business_day_id) where.business_day_id = business_day_id;

    return this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { id: 'desc' },
    });
  }

  // Multi-Store موازنہ (Brand Owner کے لیے)
  async getBrandOverview(brand_id: number) {
    const stores = await this.prisma.store.findMany({ where: { brand_id } });

    const overview = await Promise.all(
      stores.map(async (store) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const orders = await this.prisma.order.findMany({
          where: {
            store_id: store.id,
            status: { not: 'VOIDED' },
            createdAt: { gte: today },
          },
        });

        const totalSales = orders.reduce((s, o) => s + o.total_amount, 0);
        return {
          store_id: store.id,
          store_name: store.name,
          location: store.location,
          today_sales: totalSales,
          today_orders: orders.length,
        };
      }),
    );

    return {
      brand_id,
      stores: overview,
      grand_total: overview.reduce((s, st) => s + st.today_sales, 0),
    };
  }

  // ہفتہ واری Sales Trend
  async getWeeklyTrend(store_id: number) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const orders = await this.prisma.order.findMany({
        where: { store_id, status: { not: 'VOIDED' }, createdAt: { gte: d, lte: end } },
      });

      days.push({
        date: d.toISOString().split('T')[0],
        sales: orders.reduce((s, o) => s + o.total_amount, 0),
        orders: orders.length,
      });
    }
    return days;
  }
}
