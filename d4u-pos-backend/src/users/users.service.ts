import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: { role: true, store: true },
      orderBy: { id: 'asc' }
    });
  }

  async getUsersByStore(store_id: number) {
    return this.prisma.user.findMany({
      where: { store_id },
      include: { role: true, store: true }
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({ orderBy: { id: 'asc' } });
  }

  async createUser(data: {
    name: string;
    phone: string;
    pin: string;
    role_id: number;
    store_id?: number;
    brand_id?: number;
    image_url?: string;
    module_permissions?: Record<string, boolean>;
    rider_details?: any;
  }) {
    if (data.role_id === 0) {
      let riderRole = await this.prisma.role.findFirst({ where: { name: 'Rider' } });
      if (!riderRole) {
        riderRole = await this.prisma.role.create({ data: { id: 11, name: 'Rider', permissions: {} } });
      }
      data.role_id = riderRole.id;
    }

    const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) throw new BadRequestException(`Phone ${data.phone} is already registered`);

    return this.prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        hashedPin: data.pin || '1234',
        role_id: data.role_id,
        store_id: data.store_id || null,
        brand_id: data.brand_id || 1,
        image_url: data.image_url || null,
        module_permissions: data.module_permissions || {},
        rider_details: data.rider_details || null,
      },
      include: { role: true, store: true }
    });
  }

  async updateUser(id: number, data: {
    name?: string;
    phone?: string;
    pin?: string;
    role_id?: number;
    store_id?: number;
    image_url?: string;
    module_permissions?: Record<string, boolean>;
    rider_details?: any;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (data.role_id === 0) {
      let riderRole = await this.prisma.role.findFirst({ where: { name: 'Rider' } });
      if (!riderRole) {
        riderRole = await this.prisma.role.create({ data: { id: 11, name: 'Rider', permissions: {} } });
      }
      data.role_id = riderRole.id;
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.pin !== undefined) updateData.hashedPin = data.pin;
    if (data.role_id !== undefined) updateData.role_id = data.role_id;
    if (data.store_id !== undefined) updateData.store_id = data.store_id || null;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.module_permissions !== undefined) updateData.module_permissions = data.module_permissions;
    if (data.rider_details !== undefined) updateData.rider_details = data.rider_details;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true, store: true }
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return this.prisma.user.delete({ where: { id } });
  }
}
