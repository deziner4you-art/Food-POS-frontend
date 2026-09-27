import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class CashFlowService {
  constructor(private prisma: PrismaService) {}

  // Cash In — شفٹ شروع میں یا دن میں
  async cashIn(body: {
    store_id: any;
    user_id: any;
    amount: any;
    comment?: string;
    is_opening_float?: boolean;
  }) {
    const store_id = Number(body.store_id);
    const user_id = Number(body.user_id);
    const amount = Number(body.amount);
    if (!Number.isInteger(store_id) || store_id <= 0) {
      throw new BadRequestException('A valid store_id is required.');
    }
    if (!Number.isInteger(user_id) || user_id <= 0) {
      throw new BadRequestException('A valid user_id is required.');
    }
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('A valid non-negative cash-in amount is required.');
    }

    // Active Business Day تلاش کریں
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
    });

    if (!openDay)
      throw new NotFoundException(
        'No open business day. Please start the day first.',
      );

    const record = await this.prisma.cashFlow.create({
      data: {
        store_id,
        business_day_id: openDay.id,
        user_id,
        type: body.is_opening_float ? 'OPENING_FLOAT' : 'CASH_IN',
        amount,
        comment: body.comment ?? (body.is_opening_float ? 'Opening Float' : 'Cash In'),
      },
      include: { user: { select: { id: true, name: true } } },
    });

    console.log(
      `[CASH IN] Rs.${amount} — Store: ${store_id} — Day: ${openDay.id}`,
    );
    return { success: true, record };
  }

  // Cash Out — کیش نکالنا
  async cashOut(body: {
    store_id: any;
    user_id: any;
    amount: any;
    comment?: string;
  }) {
    const store_id = Number(body.store_id);
    const user_id = Number(body.user_id);
    const amount = Number(body.amount);
    if (!Number.isInteger(store_id) || store_id <= 0) {
      throw new BadRequestException('A valid store_id is required.');
    }
    if (!Number.isInteger(user_id) || user_id <= 0) {
      throw new BadRequestException('A valid user_id is required.');
    }
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('A valid non-negative cash-out amount is required.');
    }

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

    console.log(
      `[CASH OUT] Rs.${amount} — Store: ${store_id} — Day: ${openDay.id}`,
    );
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

    const cashIn = flows
      .filter((f) => f.type === 'CASH_IN' || f.type === 'OPENING_FLOAT')
      .reduce((s, f) => s + f.amount, 0);
    const cashOut = flows
      .filter((f) => f.type === 'CASH_OUT')
      .reduce((s, f) => s + f.amount, 0);

    return {
      business_day_id: openDay.id,
      cashIn,
      cashOut,
      netCash: cashIn - cashOut,
    };
  }
}
