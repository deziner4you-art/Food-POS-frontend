import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';

@Injectable()
export class KotsService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  // KDS اسکرین کے لیے — تمام Active KOTs
  async getActiveKots(store_id: number) {
    const where: any = { status: { in: ['NEW', 'PREPARING'] } };
    if (store_id && !isNaN(store_id)) {
      where.store_id = store_id;
    }
    return this.prisma.kOT.findMany({
      where,
      include: { order: true },
      orderBy: { id: 'asc' },
    });
  }

  // ایک KOT کی تفصیل
  async getKot(id: number) {
    const kot = await this.prisma.kOT.findUnique({
      where: { id },
      include: { order: { include: { items: { include: { product: true } } } } },
    });
    if (!kot) throw new NotFoundException(`KOT #${id} not found`);
    return kot;
  }

  // KOT Status اپڈیٹ (Chef نے دبایا)
  async updateKotStatus(id: number, status: 'PREPARING' | 'READY' | 'CANCELLED') {
    const now = new Date();
    const data: any = { status };

    if (status === 'PREPARING') data.acceptedAt = now;
    if (status === 'READY') data.readyAt = now;

    const kot = await this.prisma.kOT.update({
      where: { id },
      data,
      include: { order: true },
    });

    // Order کا status بھی اپڈیٹ کریں
    if (status === 'READY') {
      await this.prisma.order.update({
        where: { id: kot.order_id },
        data: { status: 'READY' },
      });
    } else if (status === 'PREPARING') {
      await this.prisma.order.update({
        where: { id: kot.order_id },
        data: { status: 'PREPARING' },
      });
    }

    console.log(`[KDS] KOT #${id} → ${status}`);

    // POS اور Website کو فوری اطلاع
    this.gateway.broadcast('kds_update', {
      kot_id: id,
      order_id: kot.order_id,
      status,
      store_id: kot.store_id,
    });

    return { success: true, kot };
  }

  // Print Count بڑھائیں (Duplicate print track کریں)
  async incrementPrintCount(id: number) {
    const kot = await this.prisma.kOT.update({
      where: { id },
      data: { printCount: { increment: 1 } },
    });
    console.log(`[PRINT] KOT #${id} — Print #${kot.printCount}`);
    return { success: true, printCount: kot.printCount };
  }

  // آج کے تمام KOTs (history کے لیے)
  async getKotsByDay(store_id: number, business_day_id: number) {
    return this.prisma.kOT.findMany({
      where: { store_id, business_day_id },
      include: { order: true },
      orderBy: { id: 'desc' },
    });
  }
}
