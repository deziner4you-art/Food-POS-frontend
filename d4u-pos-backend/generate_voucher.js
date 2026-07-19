const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // DTOs
  'dto/create-voucher.dto.ts': `import { IsInt, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVoucherDto {
  @IsInt()
  @Type(() => Number)
  voucher_type_id: number;

  @IsInt()
  @Type(() => Number)
  fiscal_year_id: number;

  @IsInt()
  @Type(() => Number)
  accounting_period_id: number;

  @IsInt()
  @Type(() => Number)
  journal_id: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  currency_id?: number;

  @IsString()
  voucher_number: string;

  @IsOptional()
  @IsString()
  reference_number?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
`,
  'dto/update-voucher.dto.ts': `import { PartialType } from '@nestjs/mapped-types';
import { CreateVoucherDto } from './create-voucher.dto';

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {}
`,
  'dto/approve-voucher.dto.ts': `import { IsOptional, IsString } from 'class-validator';

export class ApproveVoucherDto {
  @IsOptional()
  @IsString()
  approval_notes?: string;
}
`,
  'dto/cancel-voucher.dto.ts': `import { IsString, IsNotEmpty } from 'class-validator';

export class CancelVoucherDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
`,

  // Repository
  'repositories/voucher.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VoucherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: Prisma.VoucherUncheckedCreateInput) {
    return this.prisma.voucher.create({
      data: { ...data, store_id: storeId },
    });
  }

  async update(id: number, storeId: number, data: Prisma.VoucherUncheckedUpdateInput) {
    return this.prisma.voucher.update({
      where: { id, store_id: storeId },
      data,
    });
  }

  async findById(id: number, storeId: number) {
    return this.prisma.voucher.findFirst({
      where: { id, store_id: storeId },
      include: {
        fiscal_year: true,
        accounting_period: true,
        journal_entry: true,
      },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.voucher.findMany({
      where: { store_id: storeId },
      orderBy: { date: 'desc' },
    });
  }
}
`,

  // Service
  'services/voucher.service.ts': `import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { VoucherRepository } from '../repositories/voucher.repository';
import { CreateVoucherDto } from '../dto/create-voucher.dto';
import { UpdateVoucherDto } from '../dto/update-voucher.dto';
import { VoucherStatus } from '../enums/voucher-status.enum';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Injectable()
export class VoucherService {
  constructor(
    private readonly repo: VoucherRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createVoucher(storeId: number, userId: number, dto: CreateVoucherDto) {
    // Validate period and fiscal year
    const period = await this.prisma.accountingPeriod.findUnique({ where: { id: dto.accounting_period_id } });
    if (!period || period.status !== AccountingPeriodStatus.OPEN) {
      throw new BadRequestException('Accounting Period must be OPEN.');
    }

    const fy = await this.prisma.fiscalYear.findUnique({ where: { id: dto.fiscal_year_id } });
    if (!fy || !fy.is_active || fy.is_closed) {
      throw new BadRequestException('Fiscal Year must be ACTIVE.');
    }

    // Check unique voucher number
    const existing = await this.prisma.voucher.findFirst({
      where: { store_id: storeId, voucher_number: dto.voucher_number },
    });
    if (existing) {
      throw new BadRequestException('Voucher Number must be unique.');
    }

    return this.repo.create(storeId, {
      ...dto,
      status: VoucherStatus.DRAFT,
      created_by: userId,
    });
  }

  async updateVoucher(storeId: number, id: number, userId: number, dto: UpdateVoucherDto) {
    const voucher = await this.repo.findById(id, storeId);
    if (!voucher) throw new NotFoundException('Voucher not found.');

    if (voucher.status !== VoucherStatus.DRAFT) {
      throw new BadRequestException('Cannot edit voucher after submission or approval.');
    }

    return this.repo.update(id, storeId, {
      ...dto,
      updated_by: userId,
    });
  }

  async submitVoucher(storeId: number, id: number, userId: number) {
    const voucher = await this.repo.findById(id, storeId);
    if (!voucher) throw new NotFoundException('Voucher not found.');

    if (voucher.status !== VoucherStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT vouchers can be submitted.');
    }

    return this.repo.update(id, storeId, {
      status: VoucherStatus.PENDING_APPROVAL,
      updated_by: userId,
    });
  }

  async approveVoucher(storeId: number, id: number, userId: number) {
    const voucher = await this.repo.findById(id, storeId);
    if (!voucher) throw new NotFoundException('Voucher not found.');

    if (voucher.status !== VoucherStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Voucher must be in PENDING_APPROVAL status to approve.');
    }

    if (voucher.accounting_period.status !== AccountingPeriodStatus.OPEN) {
      throw new BadRequestException('Accounting Period must be OPEN to approve.');
    }

    // Logic: In a full implementation, approving a voucher generates a Journal Entry.
    // For now, we update status. Journal Entry linkage can be managed by the Posting Engine workflow.
    return this.repo.update(id, storeId, {
      status: VoucherStatus.APPROVED,
      updated_by: userId,
    });
  }

  async cancelVoucher(storeId: number, id: number, userId: number, reason: string) {
    const voucher = await this.repo.findById(id, storeId);
    if (!voucher) throw new NotFoundException('Voucher not found.');

    if (voucher.status === VoucherStatus.APPROVED || voucher.status === VoucherStatus.POSTED) {
      throw new BadRequestException('Cannot cancel an approved/posted voucher. Only reverse is allowed.');
    }

    return this.repo.update(id, storeId, {
      status: VoucherStatus.CANCELLED,
      description: voucher.description ? \`\${voucher.description} (Cancelled: \${reason})\` : \`Cancelled: \${reason}\`,
      updated_by: userId,
    });
  }

  async reverseVoucher(storeId: number, id: number, userId: number) {
    const voucher = await this.repo.findById(id, storeId);
    if (!voucher) throw new NotFoundException('Voucher not found.');

    if (voucher.status !== VoucherStatus.APPROVED && voucher.status !== VoucherStatus.POSTED) {
      throw new BadRequestException('Only Approved or Posted vouchers can be reversed.');
    }

    // Reverse logic: We do not delete. We mark as REVERSED.
    // If there is a Journal Entry, we would trigger a Reversal Journal Entry here.
    return this.repo.update(id, storeId, {
      status: VoucherStatus.REVERSED,
      updated_by: userId,
    });
  }

  async getVoucher(storeId: number, id: number) {
    const voucher = await this.repo.findById(id, storeId);
    if (!voucher) throw new NotFoundException('Voucher not found.');
    return voucher;
  }

  async listVouchers(storeId: number) {
    return this.repo.findAll(storeId);
  }
}
`,

  // Controller
  'controllers/voucher.controller.ts': `import { Controller, Get, Post, Put, Param, Body, Query, ParseIntPipe, Patch } from '@nestjs/common';
import { VoucherService } from '../services/voucher.service';
import { CreateVoucherDto } from '../dto/create-voucher.dto';
import { UpdateVoucherDto } from '../dto/update-voucher.dto';
import { CancelVoucherDto } from '../dto/cancel-voucher.dto';

@Controller('accounting/vouchers')
export class VoucherController {
  constructor(private readonly service: VoucherService) {}

  @Post()
  async createVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateVoucherDto,
  ) {
    const userId = 1; // mock
    return this.service.createVoucher(store_id, userId, dto);
  }

  @Put(':id')
  async updateVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVoucherDto,
  ) {
    const userId = 1; // mock
    return this.service.updateVoucher(store_id, id, userId, dto);
  }

  @Patch(':id/submit')
  async submitVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = 1; // mock
    return this.service.submitVoucher(store_id, id, userId);
  }

  @Patch(':id/approve')
  async approveVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = 1; // mock
    return this.service.approveVoucher(store_id, id, userId);
  }

  @Patch(':id/cancel')
  async cancelVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelVoucherDto,
  ) {
    const userId = 1; // mock
    return this.service.cancelVoucher(store_id, id, userId, dto.reason);
  }

  @Patch(':id/reverse')
  async reverseVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = 1; // mock
    return this.service.reverseVoucher(store_id, id, userId);
  }

  @Get(':id')
  async getVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getVoucher(store_id, id);
  }

  @Get()
  async listVouchers(
    @Query('store_id', ParseIntPipe) store_id: number,
  ) {
    return this.service.listVouchers(store_id);
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
