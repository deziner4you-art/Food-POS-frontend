import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class BusinessDayService {
  constructor(private prisma: PrismaService) {}

  private async calculateDayAccounting(day: any) {
    const [orders, voidedOrders, flows] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          store_id: day.store_id,
          business_day_id: day.id,
          status: { not: 'VOIDED' },
        },
        select: {
          total_amount: true,
          payment_method: true,
          payment_status: true,
          status: true,
          order_source: true,
        },
      }),
      this.prisma.order.count({
        where: { store_id: day.store_id, business_day_id: day.id, status: 'VOIDED' },
      }),
      this.prisma.cashFlow.findMany({
        where: { store_id: day.store_id, business_day_id: day.id },
        select: { type: true, amount: true, comment: true },
      }),
    ]);

    const realizedOrders = orders.filter(order => {
      const status = String(order.status || '').toUpperCase();
      const paymentStatus = String(order.payment_status || '').toUpperCase();
      return !['CANCELLED', 'VOIDED'].includes(status) &&
        (['SETTLED', 'COMPLETED', 'PAID'].includes(status) || paymentStatus === 'PAID');
    });
    const reportableOrders = orders.filter(order => !['CANCELLED', 'VOIDED'].includes(String(order.status || '').toUpperCase()));
    const totalSales = realizedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const cashSales = realizedOrders
      .filter(order => {
        const method = String(order.payment_method || '').toUpperCase();
        return (method === 'CASH' || method === 'COD') &&
          ['SETTLED', 'COMPLETED', 'PAID'].includes(String(order.status || '').toUpperCase());
      })
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const cardSales = realizedOrders
      .filter(order => ['CARD', 'WALLET'].includes(String(order.payment_method || '').toUpperCase()))
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const onlineSales = realizedOrders
      .filter(order => ['ONLINE', 'WHATSAPP', 'CALL'].includes(String((order as any).order_source || '').toUpperCase()))
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const cashIn = flows
      .filter(flow => flow.type === 'CASH_IN' || flow.type === 'OPENING_FLOAT')
      .reduce((sum, flow) => sum + Number(flow.amount || 0), 0);
    const openingCashIn = flows
      .filter(flow => flow.type === 'OPENING_FLOAT' || (flow.type === 'CASH_IN' && flow.comment === 'Opening Float'))
      .reduce((sum, flow) => sum + Number(flow.amount || 0), 0);
    const cashOut = flows
      .filter(flow => flow.type === 'CASH_OUT')
      .reduce((sum, flow) => sum + Number(flow.amount || 0), 0);

    // A legacy/API-created day may already carry openingFloat while the POS
    // cashier also records the same opening cash as OPENING_FLOAT. Prefer the
    // authoritative cash-flow opening entry in that case, so the drawer is
    // never credited twice.
    const openingCash = openingCashIn > 0 ? openingCashIn : Number(day.openingFloat || 0);
    const nonOpeningCashIn = cashIn - openingCashIn;

    return {
      totalSales,
      totalOrders: reportableOrders.length,
      settledOrders: realizedOrders.length,
      voidedOrders,
      cashSales,
      cardSales,
      onlineSales,
      cashIn,
      openingCashIn,
      cashOut,
      netCashMovements: cashIn - cashOut,
      expectedCash: openingCash + nonOpeningCashIn - cashOut,
    };
  }

  // موجودہ Open Day چیک کریں
  async getCurrentDay(store_id: number) {
    const day = await this.prisma.businessDay.findFirst({
      where: { store_id, status: 'OPEN' },
      include: {
        starter: { select: { id: true, name: true, role: true } },
      },
      orderBy: { id: 'desc' },
    });
    return day;
  }

  // Day Start — صبح کیشئیر نے بٹن دبایا
  async startDay(store_id: number, started_by: number, openingFloat: number) {
    if (!Number.isInteger(store_id) || store_id <= 0 || !Number.isInteger(started_by) || started_by <= 0) {
      throw new BadRequestException('A valid store and starter identity are required.');
    }
    if (!Number.isFinite(Number(openingFloat)) || Number(openingFloat) < 0) {
      throw new BadRequestException('A valid non-negative opening float is required.');
    }
    // چیک کریں کوئی پرانا Open Day تو نہیں
    const existing = await this.prisma.businessDay.findFirst({
      where: { store_id, status: 'OPEN' },
    });

    if (existing) {
      throw new BadRequestException(
        `Day already open! Previous Day ID: ${existing.id}. Please close it first.`,
      );
    }

    const day = await this.prisma.businessDay.create({
      data: {
        store_id,
        started_by,
        dayStart: new Date(),
        openingFloat,
        status: 'OPEN',
      },
      include: {
        starter: { select: { id: true, name: true } },
      },
    });

    console.log(
      `[DAY START] Store ${store_id} — Day #${day.id} — Float: Rs.${openingFloat} — By: ${day.starter.name}`,
    );
    return { success: true, day };
  }

  // Day Close — کیشئیر نے رات کو بٹن دبایا
  async closeDay(
    store_id: number,
    closed_by: number,
    closingCash: number,
    notes?: string,
  ) {
    if (!Number.isInteger(store_id) || store_id <= 0 || !Number.isInteger(closed_by) || closed_by <= 0) {
      throw new BadRequestException('A valid store and closer identity are required.');
    }
    if (!Number.isFinite(Number(closingCash)) || Number(closingCash) < 0) {
      throw new BadRequestException('A valid non-negative closing cash amount is required.');
    }
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
    });

    if (!openDay) throw new NotFoundException('No open business day found');

    const accounting = await this.calculateDayAccounting(openDay);
    const { totalSales, totalOrders } = accounting;

    // Cash discrepancy چیک کریں
    const expectedCash = accounting.expectedCash;
    const discrepancy = closingCash - expectedCash;

    const day = await this.prisma.businessDay.update({
      where: { id: openDay.id },
      data: {
        closed_by,
        dayClose: new Date(),
        closingCash,
        totalSales,
        totalOrders,
        status: 'CLOSED',
        notes:
          notes ??
          (discrepancy !== 0
            ? `Cash discrepancy: Rs.${discrepancy.toFixed(2)}`
            : null),
      },
    });

    console.log(
      `[DAY CLOSE] Store ${store_id} — Day #${day.id} — Sales: Rs.${totalSales} — Cash: Rs.${closingCash} — Diff: Rs.${discrepancy}`,
    );

    return {
      success: true,
      day,
        summary: {
          totalSales,
          totalOrders,
          expectedCash,
          closingCash,
          discrepancy,
          cashSales: accounting.cashSales,
          cardSales: accounting.cardSales,
          cashIn: accounting.cashIn,
          openingCashIn: accounting.openingCashIn,
          cashOut: accounting.cashOut,
        },
    };
  }

  // پچھلے دنوں کی تاریخ
  async getDayHistory(store_id: number, limit = 30) {
    const days = await this.prisma.businessDay.findMany({
      where: { store_id },
      include: {
        starter: { select: { id: true, name: true } },
        closer: { select: { id: true, name: true } },
      },
      orderBy: { id: 'desc' },
      take: limit,
    });
    return Promise.all(days.map(async (day) => ({
      ...day,
      ...(await this.calculateDayAccounting(day)),
    })));
  }

  async getDayReport(store_id: number, business_day_id?: number) {
    const day = business_day_id
      ? await this.prisma.businessDay.findFirst({
          where: { id: business_day_id, store_id },
          include: { starter: { select: { id: true, name: true } }, closer: { select: { id: true, name: true } } },
        })
      : await this.prisma.businessDay.findFirst({
          where: { store_id, status: 'OPEN' },
          include: { starter: { select: { id: true, name: true } }, closer: { select: { id: true, name: true } } },
          orderBy: { id: 'desc' },
        });

    if (!day) return null;
    return { ...day, ...(await this.calculateDayAccounting(day)) };
  }
}
