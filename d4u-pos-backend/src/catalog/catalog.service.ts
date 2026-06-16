import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  // --- Admin Endpoints (SuperAdmin Web Dashboard) ---
  async createCategory(store_id: number, name: string) {
    return this.prisma.category.create({ data: { store_id, name } });
  }

  async createProduct(data: { store_id: number, category_id: number, name: string, price: number, cost: number, margin_pct: number }) {
    return this.prisma.product.create({ data });
  }

  // --- POS Sync Endpoints (Branch/Offline POS) ---
  // Returns the entire catalog for a specific branch so the local POS can cache it in IndexedDB
  async syncCatalogForPos(store_id: number) {
    const categories = await this.prisma.category.findMany({ where: { store_id } });
    const products = await this.prisma.product.findMany({ where: { store_id } });
    return { categories, products };
  }
}
