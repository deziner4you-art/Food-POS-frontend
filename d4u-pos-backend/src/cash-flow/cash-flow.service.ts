import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashFlowService {
  constructor(private prisma: PrismaService) {}

  // Cash In — شفٹ شروع میں یا دن میں
  async cashIn(body: {
    store_id: any;
    user_id: any;
    amount: any;
    comment?: string;
  }) {
    const store_id = Number(body.store_id) || 1;
    const user_id = Number(body.user_id) || 1;
    const amount = parseFloat(body.amount) || 0;

    // Active Business Day تلاش کریں
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
    });

    if (!openDay) throw new NotFoundException('No open business day. Please start the day first.');

    const record = await this.prisma.cashFlow.create({
      data: {
        store_id,
        business_day_id: openDay.id,
        user_id,
        type: 'CASH_IN',
        amount,
        comment: body.comment ?? 'Opening Float',
      },
      include: { user: { select: { id: true, name: true } } },
    });

    console.log(`[CASH IN] Rs.${amount} — Store: ${store_id} — Day: ${openDay.id}`);
    return { success: true, record };
  }

  // Cash Out — کیش نکالنا
  async cashOut(body: {
    store_id: any;
    user_id: any;
    amount: any;
    comment?: string;
  }) {
    const store_id = Number(body.store_id) || 1;
    const user_id = Number(body.user_id) || 1;
    const amount = parseFloat(body.amount) || 0;

    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
    });

    if (!openDay) throw new NotFoundException('No open business day.');

    const record = await this.prisma.cashFlow.create({
      data: {
        store_id,
        business_day_id: openDay.id,
        user_id,
        type: 'CASH_OUT',
        amount,
        comment: body.comment ?? 'Cash withdrawal',
      },
      include: { user: { select: { id: true, name: true } } },
    });

    console.log(`[CASH OUT] Rs.${amount} — Store: ${store_id} — Day: ${openDay.id}`);
    return { success: true, record };
  }

  // اس دن کی تمام Cash Movements
  async getCashFlowByDay(store_id: number, business_day_id?: number) {
    let dayId = business_day_id;

    if (!dayId) {
      const openDay = await this.prisma.businessDay.findFirst({
        where: { store_id, status: 'OPEN' },
        orderBy: { id: 'desc' },
      });
      dayId = openDay?.id;
    }

    if (!dayId) return [];

    return this.prisma.cashFlow.findMany({
      where: { store_id, business_day_id: dayId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { id: 'asc' },
    });
  }

  // Cash Balance Summary
  async getCashSummary(store_id: number) {
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
    });

    if (!openDay) return { cashIn: 0, cashOut: 0, netCash: 0 };

    const flows = await this.prisma.cashFlow.findMany({
      where: { store_id, business_day_id: openDay.id },
    });

    const cashIn = flows.filter((f) => f.type === 'CASH_IN').reduce((s, f) => s + f.amount, 0);
    const cashOut = flows.filter((f) => f.type === 'CASH_OUT').reduce((s, f) => s + f.amount, 0);

    return {
      business_day_id: openDay.id,
      cashIn,
      cashOut,
      netCash: cashIn - cashOut,
    };
  }
}
