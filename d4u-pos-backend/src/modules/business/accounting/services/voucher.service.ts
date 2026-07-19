import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    if (!fy || fy.is_closed) {
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
      description: voucher.description ? `${voucher.description} (Cancelled: ${reason})` : `Cancelled: ${reason}`,
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
