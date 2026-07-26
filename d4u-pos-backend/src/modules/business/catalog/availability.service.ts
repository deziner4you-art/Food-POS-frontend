import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getAvailabilityRules(store_id: number) {
    return this.prisma.availabilityRule.findMany({
      where: { store_id },
      include: { products: true },
      orderBy: { name: 'asc' },
    });
  }

  async getAvailabilityRule(id: number) {
    const rule = await this.prisma.availabilityRule.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!rule) throw new NotFoundException('Availability rule not found');
    return rule;
  }

  async createAvailabilityRule(data: {
    store_id: number;
    name: string;
    type?: string;
    start_time?: string;
    end_time?: string;
    days?: string;
  }) {
    return this.prisma.availabilityRule.create({
      data: {
        store_id: data.store_id,
        name: data.name,
        type: data.type || 'ALWAYS',
        start_time: data.start_time,
        end_time: data.end_time,
        days: data.days,
      },
    });
  }

  async updateAvailabilityRule(id: number, data: {
    name?: string;
    type?: string;
    start_time?: string;
    end_time?: string;
    days?: string;
  }) {
    return this.prisma.availabilityRule.update({
      where: { id },
      data,
    });
  }

  async deleteAvailabilityRule(id: number) {
    return this.prisma.availabilityRule.delete({ where: { id } });
  }
}
