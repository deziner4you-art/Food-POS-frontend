import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: { role: true, store: true },
      orderBy: { id: 'asc' },
    });
  }

  async getUsersByStore(store_id: number) {
    return this.prisma.user.findMany({
      where: { store_id },
      include: { role: true, store: true },
    });
  }

  async getUsersByBrand(brand_id: number) {
    return this.prisma.user.findMany({
      where: { brand_id },
      include: { role: true, store: true },
      orderBy: { id: 'asc' },
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
    emp_id?: string;
    email?: string;
    designation?: string;
    status?: string;
    joining_date?: Date;
    notes?: string;
  }) {
    if (data.role_id === 0) {
      let riderRole = await this.prisma.role.findFirst({
        where: { name: 'Rider' },
      });
      if (!riderRole) {
        riderRole = await this.prisma.role.create({
          data: { id: 11, name: 'Rider', permissions: {} },
        });
      }
      data.role_id = riderRole.id;
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existing)
      throw new BadRequestException(
        `Phone ${data.phone} is already registered`,
      );

    const hashedPin = data.pin ? await bcrypt.hash(data.pin, 10) : await bcrypt.hash('1234', 10);

    // Sprint 28.9: brand_id must never silently default to brand #1 — that
    // misassigns any new staff/rider whose form omitted brand_id straight
    // into another tenant. If a store_id is given, the store's own brand is
    // authoritative (also guards against a mismatched brand_id/store_id pair
    // ever being passed together); otherwise an explicit brand_id is required.
    let resolvedBrandId = data.brand_id;
    if (data.store_id) {
      const store = await this.prisma.store.findUnique({ where: { id: data.store_id }, select: { brand_id: true } });
      if (!store) throw new BadRequestException(`Store #${data.store_id} not found.`);
      resolvedBrandId = store.brand_id;
    }
    if (!resolvedBrandId) {
      throw new BadRequestException('brand_id or store_id is required to create a user.');
    }

    return this.prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        hashedPin: hashedPin,
        role_id: data.role_id,
        store_id: data.store_id || null,
        brand_id: resolvedBrandId,
        image_url: data.image_url || null,
        module_permissions: data.module_permissions || {},
        rider_details: data.rider_details || null,
        emp_id: data.emp_id || null,
        email: data.email || null,
        designation: data.designation || null,
        status: data.status || 'ACTIVE',
        joining_date: data.joining_date ? new Date(data.joining_date) : null,
        notes: data.notes || null,
      },
      include: { role: true, store: true },
    });
  }

  async updateUser(
    id: number,
    data: {
      name?: string;
      phone?: string;
      pin?: string;
      role_id?: number;
      store_id?: number;
      image_url?: string;
      module_permissions?: Record<string, boolean>;
      rider_details?: any;
      emp_id?: string;
      email?: string;
      designation?: string;
      status?: string;
      joining_date?: Date;
      notes?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (data.role_id === 0) {
      let riderRole = await this.prisma.role.findFirst({
        where: { name: 'Rider' },
      });
      if (!riderRole) {
        riderRole = await this.prisma.role.create({
          data: { id: 11, name: 'Rider', permissions: {} },
        });
      }
      data.role_id = riderRole.id;
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.pin !== undefined) updateData.hashedPin = await bcrypt.hash(data.pin, 10);
    if (data.role_id !== undefined) updateData.role_id = data.role_id;
    if (data.store_id !== undefined)
      updateData.store_id = data.store_id || null;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.module_permissions !== undefined)
      updateData.module_permissions = data.module_permissions;
    if (data.rider_details !== undefined)
      updateData.rider_details = data.rider_details;
    if (data.emp_id !== undefined) updateData.emp_id = data.emp_id;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.designation !== undefined) updateData.designation = data.designation;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.joining_date !== undefined) updateData.joining_date = data.joining_date ? new Date(data.joining_date) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true, store: true },
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return this.prisma.user.delete({ where: { id } });
  }
}
