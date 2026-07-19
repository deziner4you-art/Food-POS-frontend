import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateJournalDto } from '../dto/create-journal.dto';

@Injectable()
export class JournalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, dto: CreateJournalDto) {
    return this.prisma.journal.create({
      data: {
        store_id: storeId,
        code: dto.code,
        name: dto.name,
        prefix: dto.prefix,
        type: dto.type,
        is_active: dto.is_active ?? true,
        allow_manual_entries: dto.allow_manual_entries ?? true,
        allow_automatic_entries: dto.allow_automatic_entries ?? true,
        require_approval: dto.require_approval ?? false,
        is_system_generated: dto.is_system_generated ?? false,
        default_currency_id: dto.default_currency_id,
      },
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.journal.findFirst({
      where: { id, store_id: storeId },
    });
  }

  async findByCode(storeId: number, code: string) {
    return this.prisma.journal.findUnique({
      where: { store_id_code: { store_id: storeId, code } },
    });
  }

  async findByName(storeId: number, name: string) {
    return this.prisma.journal.findUnique({
      where: { store_id_name: { store_id: storeId, name } },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.journal.findMany({
      where: { store_id: storeId },
    });
  }

  async findGeneralJournals(storeId: number) {
    return this.prisma.journal.findMany({
      where: { store_id: storeId, type: 'GENERAL' },
    });
  }

  async update(id: number, storeId: number, data: any) {
    return this.prisma.journal.updateMany({
      where: { id, store_id: storeId },
      data,
    });
  }
}
