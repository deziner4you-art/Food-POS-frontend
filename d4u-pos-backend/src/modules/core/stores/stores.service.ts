import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { SystemRoles } from '../../../common/enums/roles.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async getAllBrands(tenantBrandId?: number) {
    const whereClause = {
      status: 'ACTIVE',
      ...(tenantBrandId ? { id: tenantBrandId } : {}),
    };
    return this.prisma.brand.findMany({
      where: whereClause,
      include: { stores: { where: { status: { in: ['ACTIVE', 'SUSPENDED', 'MAINTENANCE'] } } }, subscription: { include: { package: true } } },
      orderBy: { id: 'asc' },
    });
  }

  async getAllStores(user?: any) {
    const whereClause: any = { status: { in: ['ACTIVE', 'SUSPENDED', 'MAINTENANCE'] } };
    if (user && user.brand_id && user.role !== SystemRoles.SUPER_ADMIN) {
      whereClause.brand_id = user.brand_id;
    }
    if (user && user.store_id) {
      whereClause.id = user.store_id;
    }
    return this.prisma.store.findMany({
      where: whereClause,
      include: { brand: true, saas_package: { include: { modules: true } } },
      orderBy: { id: 'asc' },
    });
  }

  async getDeletedStores() {
    return this.prisma.store.findMany({
      where: { status: 'RECYCLED' },
      include: { brand: true },
      orderBy: { deleted_at: 'desc' },
    });
  }

  async getDeletedBrands() {
    return this.prisma.brand.findMany({
      where: { status: 'RECYCLED' },
      include: { stores: { where: { status: 'RECYCLED' } } },
      orderBy: { deleted_at: 'desc' },
    });
  }

  async getStore(id: number, user?: any) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { brand: true },
    });
    if (!store) throw new NotFoundException(`Store #${id} not found`);
    if (user && user.brand_id && user.role !== SystemRoles.SUPER_ADMIN && store.brand_id !== user.brand_id) {
      throw new ForbiddenException(`Access to Store #${id} denied.`);
    }
    return store;
  }

  async createStore(data: {
    name: string;
    brand_id: number;
    location?: string;
    is_online?: boolean;
    saas_package_id?: number | null;
  }) {
    return this.prisma.store.create({
      data: {
        name: data.name,
        brand_id: data.brand_id,
        location: data.location,
        is_online: data.is_online ?? true,
        saas_package_id: data.saas_package_id || null,
      },
      include: { saas_package: true },
    });
  }

  async updateStore(
    id: number,
    data: {
      name?: string;
      location?: string;
      is_online?: boolean;
      status?: string;
      saas_package_id?: number | null;
    },
  ) {
    return this.prisma.store.update({
      where: { id },
      data: {
        ...data,
        saas_package_id: data.saas_package_id === 0 ? null : data.saas_package_id,
      },
      include: { saas_package: true },
    });
  }

  async updateStoreLifecycle(
    id: number,
    data: {
      status: 'ACTIVE' | 'SUSPENDED' | 'MAINTENANCE' | 'RECYCLED';
      reason?: string;
      resume_at?: Date;
      changed_by?: string;
    },
  ) {
    const isOnline = data.status === 'ACTIVE';
    return this.prisma.store.update({
      where: { id },
      data: {
        status: data.status,
        is_online: isOnline,
        status_reason: data.reason ?? null,
        status_changed_by: data.changed_by ?? 'Super Admin',
        status_changed_at: new Date(),
        resume_at: data.resume_at ?? null,
      },
      include: { brand: true, saas_package: true },
    });
  }

  async bulkDeleteStoresWithPassword(storeIds: number[], userId: number, passwordInput: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    let isMatch = false;
    if (user.hashedPin.startsWith('$2')) {
      isMatch = await bcrypt.compare(passwordInput, user.hashedPin);
    } else {
      isMatch = user.hashedPin === passwordInput;
    }

    if (!isMatch) throw new UnauthorizedException('Incorrect password');

    return this.prisma.$transaction(async (tx) => {
      await tx.store.updateMany({
        where: { id: { in: storeIds } },
        data: {
          status: 'RECYCLED',
          deleted_at: new Date(),
          deleted_by: user.name || 'Admin',
          deleted_reason: reason,
        },
      });
      return { success: true };
    });
  }

  async restoreStores(storeIds: number[], masterKey: string) {
    if (masterKey !== 'MASTER_2026') {
      throw new UnauthorizedException('Invalid Master Key');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.store.updateMany({
        where: { id: { in: storeIds } },
        data: { 
          status: 'ACTIVE',
          restored_at: new Date(),
          restored_by: 'Master'
        },
      });
      return { success: true };
    });
  }

  async bulkDeleteBrandsWithPassword(brandIds: number[], userId: number, password: string, reason: string) {
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

    return this.prisma.$transaction(async (tx) => {
      await tx.brand.updateMany({
        where: { id: { in: brandIds } },
        data: { 
          status: 'RECYCLED',
          deleted_at: new Date(),
          deleted_by: user.name || 'Super Admin',
          deleted_reason: reason,
        },
      });

      // Soft delete ONLY the active stores to prevent overwriting originally deleted stores
      await tx.store.updateMany({
        where: { brand_id: { in: brandIds }, status: 'ACTIVE' },
        data: { 
          status: 'RECYCLED',
          deleted_at: new Date(),
          deleted_by: user.name || 'Super Admin',
          deleted_reason: 'CASCADE_DELETE',
        },
      });

      return { success: true, count: brandIds.length };
    });
  }

  async restoreBrands(brandIds: number[], masterKey: string) {
    if (masterKey !== 'MASTER_2026') {
      throw new UnauthorizedException('Invalid Master Key');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.brand.updateMany({
        where: { id: { in: brandIds } },
        data: { 
          status: 'ACTIVE',
          restored_at: new Date(),
          restored_by: 'Master'
        },
      });

      // Restore ONLY the stores that were soft-deleted by the brand cascade
      await tx.store.updateMany({
        where: { brand_id: { in: brandIds }, status: 'RECYCLED', deleted_reason: 'CASCADE_DELETE' },
        data: { 
          status: 'ACTIVE',
          restored_at: new Date(),
          restored_by: 'Master',
          deleted_reason: null
        },
      });

      return { success: true, count: brandIds.length };
    });
  }

  async deleteStore(id: number) {
    return this.prisma.store.update({
      where: { id },
      data: { status: 'RECYCLED', deleted_at: new Date() },
    });
  }
}
