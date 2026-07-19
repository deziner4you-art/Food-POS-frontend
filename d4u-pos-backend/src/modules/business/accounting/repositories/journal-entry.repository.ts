import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { JournalEntryStatus } from '../enums/journal-entry-status.enum';

@Injectable()
export class JournalEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: any, lines: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          store_id: storeId,
          ...data,
          lines: {
            create: lines.map(line => ({ ...line, store_id: storeId })),
          },
        },
        include: { lines: true },
      });
      return entry;
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.journalEntry.findFirst({
      where: { id, store_id: storeId },
      include: { lines: true },
    });
  }

  async findByReference(storeId: number, ref: string) {
    return this.prisma.journalEntry.findFirst({
      where: { store_id: storeId, reference_number: ref },
    });
  }

  async updateStatus(id: number, storeId: number, status: JournalEntryStatus) {
    return this.prisma.journalEntry.updateMany({
      where: { id, store_id: storeId },
      data: { status },
    });
  }

  async update(id: number, storeId: number, data: any) {
    return this.prisma.journalEntry.updateMany({
      where: { id, store_id: storeId },
      data,
    });
  }

  async findAll(storeId: number) {
    return this.prisma.journalEntry.findMany({
      where: { store_id: storeId },
      orderBy: { posting_date: 'desc' },
      include: { lines: true },
    });
  }
}
