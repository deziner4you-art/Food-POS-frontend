import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async getAllBrands() {
    return this.prisma.brand.findMany({
      include: { stores: true },
      orderBy: { id: 'asc' },
    });
  }

  async getAllStores() {
    return this.prisma.store.findMany({
      include: { brand: true, saas_package: true },
      orderBy: { id: 'asc' },
    });
  }

  async getStore(id: number) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { brand: true, saas_package: true },
    });
    if (!store) throw new NotFoundException(`Store #${id} not found`);
    return store;
  }

  async createStore(data: { name: string; brand_id: number; location?: string; is_online?: boolean; saas_package_id?: number }) {
    return this.prisma.store.create({
      data: {
        name: data.name,
        brand_id: data.brand_id,
        location: data.location,
        is_online: data.is_online ?? true,
        saas_package_id: data.saas_package_id,
      },
    });
  }

  async updateStore(id: number, data: { name?: string; location?: string; is_online?: boolean; saas_package_id?: number }) {
    return this.prisma.store.update({
      where: { id },
      data,
    });
  }

  async deleteStore(id: number) {
    // In reality, this should be a soft delete or have cascading checks
    return this.prisma.store.delete({
      where: { id },
    });
  }
}
