import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class ModifierService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // Modifier Groups
  // ==========================================
  async getModifierGroups(store_id: number) {
    return this.prisma.modifierGroup.findMany({
      where: { store_id },
      include: { modifiers: true },
      orderBy: { name: 'asc' },
    });
  }

  async getModifierGroup(id: number) {
    const group = await this.prisma.modifierGroup.findUnique({
      where: { id },
      include: { modifiers: true },
    });
    if (!group) throw new NotFoundException('Modifier group not found');
    return group;
  }

  async createModifierGroup(data: {
    store_id: number;
    name: string;
    is_required?: boolean;
    min_selection?: number;
    max_selection?: number;
  }) {
    return this.prisma.modifierGroup.create({
      data: {
        store_id: data.store_id,
        name: data.name,
        is_required: data.is_required ?? false,
        min_selection: data.min_selection ?? 0,
        max_selection: data.max_selection ?? 1,
      },
      include: { modifiers: true },
    });
  }

  async updateModifierGroup(id: number, data: {
    name?: string;
    is_required?: boolean;
    min_selection?: number;
    max_selection?: number;
  }) {
    return this.prisma.modifierGroup.update({
      where: { id },
      data,
      include: { modifiers: true },
    });
  }

  async deleteModifierGroup(id: number) {
    return this.prisma.modifierGroup.delete({ where: { id } });
  }

  // ==========================================
  // Modifiers
  // ==========================================
  async createModifier(data: {
    modifier_group_id: number;
    name: string;
    additional_price?: number;
  }) {
    return this.prisma.modifier.create({
      data: {
        modifier_group_id: data.modifier_group_id,
        name: data.name,
        additional_price: data.additional_price ?? 0,
      },
    });
  }

  async updateModifier(id: number, data: {
    name?: string;
    additional_price?: number;
  }) {
    return this.prisma.modifier.update({ where: { id }, data });
  }

  async deleteModifier(id: number) {
    return this.prisma.modifier.delete({ where: { id } });
  }

  // ==========================================
  // Link / Unlink Modifier Group to Product
  // ==========================================
  async linkGroupToProduct(product_id: number, modifier_group_id: number) {
    return this.prisma.productModifierGroup.create({
      data: { product_id, modifier_group_id },
    });
  }

  async unlinkGroupFromProduct(product_id: number, modifier_group_id: number) {
    return this.prisma.productModifierGroup.delete({
      where: { product_id_modifier_group_id: { product_id, modifier_group_id } },
    });
  }

  async getProductModifiers(product_id: number) {
    return this.prisma.productModifierGroup.findMany({
      where: { product_id },
      include: { modifierGroup: { include: { modifiers: true } } },
    });
  }
}
