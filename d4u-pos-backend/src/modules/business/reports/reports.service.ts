import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { SystemRoles } from '../../../common/enums/roles.enum';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async validateStoreAccess(store_id: number, user?: any) {
    if (!user || !user.brand_id || user.role === SystemRoles.SUPER_ADMIN) return;
    const store = await this.prisma.store.findUnique({ where: { id: store_id } });
    if (!store || store.brand_id !== user.brand_id) {
      throw new ForbiddenException(`Access to store #${store_id} denied`);
    }
    if (user.store_id && user.store_id !== store_id) {
      throw new ForbiddenException(`Access to store #${store_id} denied`);
    }
  }

  private classifyOrder(o: any): 'dineIn' | 'takeAway' | 'delivery' {
    const onlineType = o.onlineOrder?.type
      ? String(o.onlineOrder.type).toUpperCase().trim()
      : null;
    const src = (o.order_source || '').toUpperCase().trim();

    if (
      onlineType === 'DELIVERY' ||
      src === 'DELIVERY' ||
      src === 'ONLINE' ||
      src === 'WHATSAPP' ||
      src === 'CALL' ||
      (o.delivery_address && String(o.delivery_address).trim().length > 0)
    ) {
      if (onlineType === 'PICKUP' || onlineType === 'TAKE_AWAY') return 'takeAway';
      if (onlineType === 'DINE_IN' || onlineType === 'DINEIN') return 'dineIn';
      return 'delivery';
    }

    if (
      onlineType === 'DINE_IN' ||
      onlineType === 'DINEIN' ||
      src === 'DINE IN' ||
      src === 'DINE_IN' ||
      src === 'DINEIN' ||
      src === 'WAITER' ||
      (o.table_no && String(o.table_no).trim().length > 0)
    ) {
      return 'dineIn';
    }

    return 'takeAway';
  }

  private calculateOrderCost(o: any): number {
    const items = Array.isArray(o?.items) ? o.items : [];
    if (items.length === 0) {
      return Math.round((o?.total_amount || 0) * 0.35);
    }
    let cost = 0;
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const variantCost = Number(item.variant?.cost) || 0;
      const productCost = Number(item.product?.cost) || 0;
      const productMargin = Number(item.product?.margin_pct) || 0;

      if (variantCost > 0) {
        cost += variantCost * qty;
      } else if (productCost > 0) {
        cost += productCost * qty;
      } else if (productMargin > 0 && productMargin < 100) {
        cost += (Number(item.price) || 0) * (1 - productMargin / 100) * qty;
      } else {
        // Default 35% food cost (65% gross margin) when product cost is not yet configured
        cost += (Number(item.price) || 0) * 0.35 * qty;
      }
    }
    return Math.round(cost);
  }

  private calculateOrderProfit(o: any): number {
    const sales = Number(o?.total_amount) || 0;
    const cost = this.calculateOrderCost(o);
    return Math.max(0, Math.round(sales - cost));
  }

  private buildBreakdownAndTotals(orders: any[]) {
    const dineInOrders: any[] = [];
    const takeAwayOrders: any[] = [];
    const deliveryOrders: any[] = [];

    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalDiscount = 0;

    for (const o of orders) {
      const amt = Number(o.total_amount) || 0;
      const cost = this.calculateOrderCost(o);
      const profit = Math.max(0, Math.round(amt - cost));

      totalSales += amt;
      totalCost += cost;
      totalProfit += profit;
      totalDiscount += Number(o.discount) || 0;

      const kind = this.classifyOrder(o);
      if (kind === 'dineIn') dineInOrders.push(o);
      else if (kind === 'delivery') deliveryOrders.push(o);
      else takeAwayOrders.push(o);
    }

    const sumSales = (arr: any[]) => arr.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const sumProfit = (arr: any[]) => arr.reduce((s, o) => s + this.calculateOrderProfit(o), 0);

    return {
      totalSales: Math.round(totalSales),
      totalCost: Math.round(totalCost),
      totalProfit: Math.round(totalProfit),
      profitMargin: totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0,
      totalDiscount: Math.round(totalDiscount),
      orderTypeBreakdown: {
        dineIn: {
          orders: dineInOrders.length,
          sales: Math.round(sumSales(dineInOrders)),
          profit: Math.round(sumProfit(dineInOrders)),
        },
        takeAway: {
          orders: takeAwayOrders.length,
          sales: Math.round(sumSales(takeAwayOrders)),
          profit: Math.round(sumProfit(takeAwayOrders)),
        },
        delivery: {
          orders: deliveryOrders.length,
          sales: Math.round(sumSales(deliveryOrders)),
          profit: Math.round(sumProfit(deliveryOrders)),
        },
        total: {
          orders: orders.length,
          sales: Math.round(totalSales),
          profit: Math.round(totalProfit),
        },
      },
    };
  }

  // روزانہ کی رپورٹ
  async getDailyReport(store_id: number, date?: string, user?: any) {
    await this.validateStoreAccess(store_id, user);
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    // Also fetch past 6 days for the 7-day flow comparison when viewing single day
    const sevenDaysStart = new Date(start);
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);

    const [orders, voidedOrders, onlineOrders, weekOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          store_id,
          status: { not: 'VOIDED' },
          createdAt: { gte: start, lte: end },
        },
        include: {
          items: { include: { product: true, variant: true } },
          onlineOrder: { select: { id: true, type: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.order.count({
        where: {
          store_id,
          status: 'VOIDED',
          createdAt: { gte: start, lte: end },
        },
      }),
      this.prisma.onlineOrder.count({
        where: {
          store_id,
          status: { in: ['SETTLED', 'DELIVERED'] },
          createdAt: { gte: start, lte: end },
        },
      }),
      this.prisma.order.findMany({
        where: {
          store_id,
          status: { not: 'VOIDED' },
          createdAt: { gte: sevenDaysStart, lte: end },
        },
        include: {
          items: { include: { product: true, variant: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const cashOrders = orders.filter((o) => o.payment_method === 'CASH').length;
    const cardOrders = orders.filter((o) => o.payment_method === 'CARD').length;
    const summary = this.buildBreakdownAndTotals(orders);

    // Hourly flow buckets for the selected day (3-hour intervals across 24h)
    const hourlyBuckets = [
      { label: '09 AM', startHour: 0, endHour: 10 },
      { label: '12 PM', startHour: 10, endHour: 13 },
      { label: '03 PM', startHour: 13, endHour: 16 },
      { label: '06 PM', startHour: 16, endHour: 19 },
      { label: '09 PM', startHour: 19, endHour: 22 },
      { label: '11 PM', startHour: 22, endHour: 24 },
    ];

    const hourlyTrend = hourlyBuckets.map((b) => {
      const bucketOrders = orders.filter((o) => {
        const h = new Date(o.createdAt).getHours();
        return h >= b.startHour && h < b.endHour;
      });
      const bSales = bucketOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const bProfit = bucketOrders.reduce((s, o) => s + this.calculateOrderProfit(o), 0);
      return {
        label: b.label,
        sales: Math.round(bSales),
        profit: Math.round(bProfit),
        orders: bucketOrders.length,
      };
    });

    // 7-day daily flow series ending on targetDate
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(d.getDate() - i);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      const dayStr = d.toISOString().split('T')[0];
      const shortLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

      const dayOrders = weekOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= d.getTime() && t <= dEnd.getTime();
      });

      const dSales = dayOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const dProfit = dayOrders.reduce((s, o) => s + this.calculateOrderProfit(o), 0);

      dailyTrend.push({
        date: dayStr,
        label: shortLabel,
        sales: Math.round(dSales),
        profit: Math.round(dProfit),
        orders: dayOrders.length,
      });
    }

    return {
      date: targetDate.toISOString().split('T')[0],
      totalSales: summary.totalSales,
      totalCost: summary.totalCost,
      totalProfit: summary.totalProfit,
      profitMargin: summary.profitMargin,
      totalOrders: orders.length,
      totalDiscount: summary.totalDiscount,
      voidedOrders,
      onlineOrders,
      cashOrders,
      cardOrders,
      avgOrderValue: orders.length > 0 ? summary.totalSales / orders.length : 0,
      orderTypeBreakdown: summary.orderTypeBreakdown,
      trendSeries: dailyTrend,
      hourlySeries: hourlyTrend,
    };
  }

  // Branch Analytics (Advanced Filtering)
  async getBranchAnalytics(
    store_id: number,
    start_date?: string,
    end_date?: string,
    business_day_id?: number,
    cashier_id?: number,
    user?: any,
  ) {
    await this.validateStoreAccess(store_id, user);
    const where: any = {
      store_id,
      status: { not: 'VOIDED' },
    };

    let rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - 6);
    rangeStart.setHours(0, 0, 0, 0);
    let rangeEnd = new Date();
    rangeEnd.setHours(23, 59, 59, 999);

    if (start_date && end_date) {
      rangeStart = new Date(start_date);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(end_date);
      rangeEnd.setHours(23, 59, 59, 999);
      where.createdAt = { gte: rangeStart, lte: rangeEnd };
    } else if (start_date) {
      rangeStart = new Date(start_date);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(start_date);
      rangeEnd.setHours(23, 59, 59, 999);
      where.createdAt = { gte: rangeStart, lte: rangeEnd };
    }

    if (business_day_id) {
      where.business_day_id = business_day_id;
    }

    if (cashier_id) {
      where.created_by = cashier_id;
    }

    const [allOrders, voidedCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true, variant: true } },
          approver: { select: { name: true } },
          onlineOrder: { select: { id: true, type: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.order.count({
        where: { ...where, status: 'VOIDED' },
      }),
    ]);

    const onlineOrdersDb = allOrders.filter((o) =>
      ['ONLINE', 'WHATSAPP', 'CALL'].includes((o.order_source || '').toUpperCase().trim()),
    );
    const posOrders = allOrders.filter(
      (o) => !['ONLINE', 'WHATSAPP', 'CALL'].includes((o.order_source || '').toUpperCase().trim()),
    );

    const posSales = posOrders.reduce((s, o) => s + o.total_amount, 0);
    const onlineSales = onlineOrdersDb.reduce((s, o) => s + o.total_amount, 0);
    const summary = this.buildBreakdownAndTotals(allOrders);

    // Cashier Breakdown
    const cashierBreakdownMap = new Map();
    for (const order of allOrders) {
      if (!order.created_by) continue;
      let entry = cashierBreakdownMap.get(order.created_by);
      if (!entry) {
        const cashierUser = await this.prisma.user.findUnique({
          where: { id: order.created_by },
        });
        entry = {
          cashier_id: order.created_by,
          cashier_name: cashierUser?.name || 'Unknown',
          total_orders: 0,
          total_sales: 0,
          total_discount: 0,
        };
        cashierBreakdownMap.set(order.created_by, entry);
      }
      entry.total_orders += 1;
      entry.total_sales += order.total_amount;
      entry.total_discount += order.discount;
    }

    // Build trendSeries across the requested range
    const diffDays = Math.max(
      1,
      Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const trendSeries: { date: string; label: string; sales: number; profit: number; orders: number }[] = [];

    if (diffDays <= 45) {
      const cursor = new Date(rangeStart);
      cursor.setHours(0, 0, 0, 0);
      while (cursor <= rangeEnd) {
        const dayStart = new Date(cursor);
        const dayEnd = new Date(cursor);
        dayEnd.setHours(23, 59, 59, 999);
        const dayStr = dayStart.toISOString().split('T')[0];
        const label = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const dayOrders = allOrders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= dayStart.getTime() && t <= dayEnd.getTime();
        });
        const dSales = dayOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
        const dProfit = dayOrders.reduce((s, o) => s + this.calculateOrderProfit(o), 0);

        trendSeries.push({
          date: dayStr,
          label,
          sales: Math.round(dSales),
          profit: Math.round(dProfit),
          orders: dayOrders.length,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      // Group by month for yearly / long custom ranges
      const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      while (cursor <= rangeEnd) {
        const mStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0);
        const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
        const label = mStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const monthKey = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, '0')}`;

        const monthOrders = allOrders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= mStart.getTime() && t <= mEnd.getTime();
        });
        const mSales = monthOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
        const mProfit = monthOrders.reduce((s, o) => s + this.calculateOrderProfit(o), 0);

        trendSeries.push({
          date: monthKey,
          label,
          sales: Math.round(mSales),
          profit: Math.round(mProfit),
          orders: monthOrders.length,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return {
      overview: {
        posSales,
        onlineSales,
        totalSales: summary.totalSales,
        totalCost: summary.totalCost,
        totalProfit: summary.totalProfit,
        profitMargin: summary.profitMargin,
        totalOrders: allOrders.length,
        totalDiscount: summary.totalDiscount,
        posOrders: posOrders.length,
        onlineOrders: onlineOrdersDb.length,
        voidedCount,
        voidedOrders: voidedCount,
        avgOrderValue: allOrders.length > 0 ? summary.totalSales / allOrders.length : 0,
      },
      totalSales: summary.totalSales,
      totalCost: summary.totalCost,
      totalProfit: summary.totalProfit,
      profitMargin: summary.profitMargin,
      orderTypeBreakdown: summary.orderTypeBreakdown,
      trendSeries,
      cashierBreakdown: Array.from(cashierBreakdownMap.values()),
    };
  }

  // Get Shifts (Business Days)
  async getShifts(store_id: number, limit = 10, user?: any) {
    await this.validateStoreAccess(store_id, user);
    return this.prisma.businessDay.findMany({
      where: { store_id },
      orderBy: { id: 'desc' },
      take: limit,
      include: {
        starter: { select: { id: true, name: true } },
        closer: { select: { id: true, name: true } },
      },
    });
  }

  // سب سے زیادہ بکنے والی چیزیں
  async getTopProducts(store_id: number, limit = 10, user?: any) {
    await this.validateStoreAccess(store_id, user);
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
        const product = await this.prisma.product.findUnique({
          where: { id: item.product_id },
        });
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
  async getVoidedOrders(store_id: number, business_day_id?: number, user?: any) {
    await this.validateStoreAccess(store_id, user);
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
  async getBrandOverview(brand_id: number, user?: any) {
    if (user && user.brand_id && user.role !== SystemRoles.SUPER_ADMIN && user.brand_id !== brand_id) {
      throw new ForbiddenException(`Access to brand #${brand_id} denied`);
    }
    const stores = await this.prisma.store.findMany({
      where: { brand_id, status: { in: ['ACTIVE', 'SUSPENDED', 'MAINTENANCE'] } },
      orderBy: { id: 'asc' },
    });

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
          include: {
            items: { include: { product: true, variant: true } },
          },
        });

        const totalSales = orders.reduce((s, o) => s + o.total_amount, 0);
        const totalProfit = orders.reduce((s, o) => s + this.calculateOrderProfit(o), 0);
        return {
          store_id: store.id,
          store_name: store.name,
          location: store.location,
          today_sales: Math.round(totalSales),
          today_profit: Math.round(totalProfit),
          today_orders: orders.length,
        };
      }),
    );

    return {
      brand_id,
      stores: overview,
      grand_total: overview.reduce((s, st) => s + st.today_sales, 0),
      grand_profit: overview.reduce((s, st) => s + (st.today_profit || 0), 0),
    };
  }

  // ہفتہ واری Sales Trend
  async getWeeklyTrend(store_id: number, user?: any) {
    await this.validateStoreAccess(store_id, user);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const orders = await this.prisma.order.findMany({
        where: {
          store_id,
          status: { not: 'VOIDED' },
          createdAt: { gte: d, lte: end },
        },
        include: {
          items: { include: { product: true, variant: true } },
        },
      });

      days.push({
        date: d.toISOString().split('T')[0],
        sales: Math.round(orders.reduce((s, o) => s + o.total_amount, 0)),
        profit: Math.round(orders.reduce((s, o) => s + this.calculateOrderProfit(o), 0)),
        orders: orders.length,
      });
    }
    return days;
  }
}
