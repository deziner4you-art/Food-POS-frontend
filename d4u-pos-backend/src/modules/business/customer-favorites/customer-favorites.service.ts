import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class CustomerFavoritesService {
  constructor(private prisma: PrismaService) {}

  async listForCustomer(customer_id: number) {
    const rows = await this.prisma.customerFavorite.findMany({
      where: { customer_id },
      select: { product_id: true },
    });
    return rows.map((r) => r.product_id);
  }

  // Add-if-missing / remove-if-present, single call the website's heart
  // icon can hit without first knowing current state.
  async toggle(customer_id: number, product_id: number) {
    const existing = await this.prisma.customerFavorite.findUnique({
      where: { customer_id_product_id: { customer_id, product_id } },
    });
    if (existing) {
      await this.prisma.customerFavorite.delete({ where: { id: existing.id } });
      return { isFavorite: false };
    }
    await this.prisma.customerFavorite.create({ data: { customer_id, product_id } });
    return { isFavorite: true };
  }
}
