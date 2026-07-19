import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { JournalRepository } from '../repositories/journal.repository';
import { CreateJournalDto } from '../dto/create-journal.dto';
import { UpdateJournalDto } from '../dto/update-journal.dto';
import { JournalType } from '../enums/journal-type.enum';

@Injectable()
export class JournalService {
  constructor(private readonly repo: JournalRepository) {}

  async create(storeId: number, dto: CreateJournalDto) {
    const codeExists = await this.repo.findByCode(storeId, dto.code);
    if (codeExists) throw new BadRequestException('Journal code already exists.');

    const nameExists = await this.repo.findByName(storeId, dto.name);
    if (nameExists) throw new BadRequestException('Journal name already exists.');

    if (dto.type === JournalType.GENERAL) {
      const generalJournals = await this.repo.findGeneralJournals(storeId);
      if (generalJournals.length > 0) {
        throw new BadRequestException('Only one default General Journal is allowed per store.');
      }
    }

    return this.repo.create(storeId, dto);
  }

  async update(storeId: number, id: number, dto: UpdateJournalDto) {
    const journal = await this.repo.findById(storeId, id);
    if (!journal) throw new NotFoundException('Journal not found.');

    if (dto.name && dto.name !== journal.name) {
      const nameExists = await this.repo.findByName(storeId, dto.name);
      if (nameExists) throw new BadRequestException('Journal name already exists.');
    }

    if (dto.type === JournalType.GENERAL && journal.type !== JournalType.GENERAL) {
      const generalJournals = await this.repo.findGeneralJournals(storeId);
      if (generalJournals.length > 0) {
        throw new BadRequestException('Only one default General Journal is allowed per store.');
      }
    }

    return this.repo.update(id, storeId, dto);
  }

  async activate(storeId: number, id: number) {
    const journal = await this.repo.findById(storeId, id);
    if (!journal) throw new NotFoundException('Journal not found.');
    return this.repo.update(id, storeId, { is_active: true });
  }

  async deactivate(storeId: number, id: number) {
    const journal = await this.repo.findById(storeId, id);
    if (!journal) throw new NotFoundException('Journal not found.');

    if (journal.is_system_generated) {
      throw new BadRequestException('System generated journals cannot be deactivated or deleted.');
    }

    return this.repo.update(id, storeId, { is_active: false });
  }

  async findAll(storeId: number) {
    return this.repo.findAll(storeId);
  }

  async findById(storeId: number, id: number) {
    const journal = await this.repo.findById(storeId, id);
    if (!journal) throw new NotFoundException('Journal not found.');
    return journal;
  }
}
