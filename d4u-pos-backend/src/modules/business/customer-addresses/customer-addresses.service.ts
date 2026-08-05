import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class CustomerAddressesService {
  constructor(private prisma: PrismaService) {}

  async listForCustomer(customer_id: number) {
    return this.prisma.customerAddress.findMany({
      where: { customer_id },
      orderBy: [{ is_default: 'desc' }, { id: 'asc' }],
    });
  }

  async create(body: { customer_id: number; label: string; address: string; is_default?: boolean }) {
    if (body.is_default) {
      await this.prisma.customerAddress.updateMany({
        where: { customer_id: body.customer_id, is_default: true },
        data: { is_default: false },
      });
    }
    return this.prisma.customerAddress.create({
      data: {
        customer_id: body.customer_id,
        label: body.label,
        address: body.address,
        is_default: body.is_default ?? false,
      },
    });
  }

  // Ownership check: the caller-supplied customer_id must match the row's
  // own customer_id, otherwise this is treated as "not found" (never
  // reveals whether a given address id belongs to someone else).
  private async assertOwnership(id: number, customer_id: number) {
    const existing = await this.prisma.customerAddress.findUnique({ where: { id } });
    if (!existing || existing.customer_id !== customer_id) {
      throw new NotFoundException('Address not found');
    }
    return existing;
  }

  async update(id: number, body: { customer_id: number; label?: string; address?: string; is_default?: boolean }) {
    await this.assertOwnership(id, body.customer_id);

    if (body.is_default) {
      await this.prisma.customerAddress.updateMany({
        where: { customer_id: body.customer_id, is_default: true, id: { not: id } },
        data: { is_default: false },
      });
    }

    return this.prisma.customerAddress.update({
      where: { id },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.is_default !== undefined && { is_default: body.is_default }),
      },
    });
  }

  async remove(id: number, customer_id: number) {
    await this.assertOwnership(id, customer_id);
    await this.prisma.customerAddress.delete({ where: { id } });
    return { success: true };
  }
}
