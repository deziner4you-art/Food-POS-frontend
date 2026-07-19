const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // DTOs
  'dto/create-journal.dto.ts': `import { IsString, IsInt, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { JournalType } from '../enums/journal-type.enum';

export class CreateJournalDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  prefix: string;

  @IsEnum(JournalType)
  type: JournalType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_manual_entries?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_automatic_entries?: boolean;

  @IsOptional()
  @IsBoolean()
  require_approval?: boolean;

  @IsOptional()
  @IsBoolean()
  is_system_generated?: boolean;

  @IsOptional()
  @IsInt()
  default_currency_id?: number;
}
`,
  'dto/update-journal.dto.ts': `import { IsString, IsInt, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { JournalType } from '../enums/journal-type.enum';

export class UpdateJournalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsEnum(JournalType)
  type?: JournalType;

  @IsOptional()
  @IsBoolean()
  allow_manual_entries?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_automatic_entries?: boolean;

  @IsOptional()
  @IsBoolean()
  require_approval?: boolean;

  @IsOptional()
  @IsInt()
  default_currency_id?: number;
}
`,

  // Repository
  'repositories/journal.repository.ts': `import { Injectable } from '@nestjs/common';
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
`,

  // Service
  'services/journal.service.ts': `import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
`,

  // Controller
  'controllers/journal.controller.ts': `import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { JournalService } from '../services/journal.service';
import { CreateJournalDto } from '../dto/create-journal.dto';
import { UpdateJournalDto } from '../dto/update-journal.dto';

@Controller('accounting/journals')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  async findAll(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.journalService.findAll(store_id);
  }

  @Get(':id')
  async findById(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.journalService.findById(store_id, id);
  }

  @Post()
  async create(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateJournalDto,
  ) {
    return this.journalService.create(store_id, dto);
  }

  @Patch(':id')
  async update(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJournalDto,
  ) {
    return this.journalService.update(store_id, id, dto);
  }

  @Patch(':id/activate')
  async activate(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.journalService.activate(store_id, id);
  }

  @Patch(':id/deactivate')
  async deactivate(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.journalService.deactivate(store_id, id);
  }
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
