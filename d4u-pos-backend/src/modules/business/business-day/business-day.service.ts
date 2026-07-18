import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class BusinessDayService {
  constructor(private prisma: PrismaService) {}

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

    console.log(`[DAY START] Store ${store_id} — Day #${day.id} — Float: Rs.${openingFloat} — By: ${day.starter.name}`);
    return { success: true, day };
  }

  // Day Close — کیشئیر نے رات کو بٹن دبایا
  async closeDay(
    store_id: number,
    closed_by: number,
    closingCash: number,
    notes?: string,
  ) {
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
    });

    if (!openDay) throw new NotFoundException('No open business day found');

    // آج کی total sales calculate کریں
    const orders = await this.prisma.order.findMany({
      where: { store_id, business_day_id: openDay.id, status: { not: 'VOIDED' } },
    });

    const totalSales = orders.reduce((s, o) => s + o.total_amount, 0);
    const totalOrders = orders.length;

    // Cash discrepancy چیک کریں
    const expectedCash = (openDay.openingFloat || 0) + totalSales;
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
        notes: notes ?? (discrepancy !== 0 ? `Cash discrepancy: Rs.${discrepancy.toFixed(2)}` : null),
      },
    });

    console.log(`[DAY CLOSE] Store ${store_id} — Day #${day.id} — Sales: Rs.${totalSales} — Cash: Rs.${closingCash} — Diff: Rs.${discrepancy}`);

    return {
      success: true,
      day,
      summary: { totalSales, totalOrders, expectedCash, closingCash, discrepancy },
    };
  }

  // پچھلے دنوں کی تاریخ
  async getDayHistory(store_id: number, limit = 30) {
    return this.prisma.businessDay.findMany({
      where: { store_id },
      include: {
        starter: { select: { id: true, name: true } },
        closer:  { select: { id: true, name: true } },
      },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }
}
