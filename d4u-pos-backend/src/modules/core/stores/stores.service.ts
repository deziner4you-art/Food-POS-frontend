import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async getAllBrands(tenantBrandId?: number) {
    const whereClause = {
      is_deleted: false,
      ...(tenantBrandId ? { id: tenantBrandId } : {}),
    };
    return this.prisma.brand.findMany({
      where: whereClause,
      include: { stores: { where: { is_deleted: false } } },
      orderBy: { id: 'asc' },
    });
  }

  async getAllStores() {
    return this.prisma.store.findMany({
      where: { is_deleted: false },
      include: { brand: true, saas_package: true },
      orderBy: { id: 'asc' },
    });
  }

  async getDeletedStores() {
    return this.prisma.store.findMany({
      where: { is_deleted: true },
      include: { brand: true, saas_package: true },
      orderBy: { deletedAt: 'desc' },
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

  async createStore(data: {
    name: string;
    brand_id: number;
    location?: string;
    is_online?: boolean;
    saas_package_id?: number;
  }) {
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

  async updateStore(
    id: number,
    data: {
      name?: string;
      location?: string;
      is_online?: boolean;
      saas_package_id?: number;
    },
  ) {
    return this.prisma.store.update({
      where: { id },
      data,
    });
  }

  async bulkDeleteStoresWithPassword(storeIds: number[], userId: number, passwordInput: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    const isMatch = await bcrypt.compare(passwordInput, user.hashedPin);
    if (!isMatch) throw new UnauthorizedException('Incorrect password');

    return this.prisma.store.updateMany({
      where: { id: { in: storeIds } },
      data: {
        is_deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restoreStores(storeIds: number[]) {
    await this.prisma.store.updateMany({
      where: { id: { in: storeIds } },
      data: { is_deleted: false },
    });
    return { success: true };
  }

  async bulkDeleteBrandsWithPassword(brandIds: number[], userId: number, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role_id !== 3) {
      throw new ForbiddenException('Only Super Admin can delete brands');
    }

    let isMatch = false;
    if (user.hashedPin.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.hashedPin);
    } else {
      isMatch = user.hashedPin === password;
    }

    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    await this.prisma.brand.updateMany({
      where: { id: { in: brandIds } },
      data: { is_deleted: true },
    });

    // Also delete all stores under these brands
    await this.prisma.store.updateMany({
      where: { brand_id: { in: brandIds } },
      data: { is_deleted: true },
    });

    return { success: true, count: brandIds.length };
  }

  async deleteStore(id: number) {
    return this.prisma.store.update({
      where: { id },
      data: { is_deleted: true, deletedAt: new Date() },
    });
  }
}
