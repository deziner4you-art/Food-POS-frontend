import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  // --- Banners ---
  async getBanners(brand_id: number = 1) {
    return this.prisma.cmsBanner.findMany({
      where: { brand_id },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createBanner(data: { title: string; subtitle?: string; imageUrl: string; linkUrl?: string; buttonText?: string; isActive?: boolean; displayOrder?: number; brand_id?: number }) {
    return this.prisma.cmsBanner.create({
      data: {
        brand_id: data.brand_id || 1,
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        buttonText: data.buttonText,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder || 0,
      }
    });
  }

  async updateBanner(id: number, data: Partial<{ title: string; subtitle: string; imageUrl: string; linkUrl: string; buttonText: string; isActive: boolean; displayOrder: number }>) {
    return this.prisma.cmsBanner.update({
      where: { id },
      data,
    });
  }

  async deleteBanner(id: number) {
    return this.prisma.cmsBanner.delete({
      where: { id }
    });
  }

  // --- Settings ---
  async getSettings(brand_id: number = 1) {
    let settings = await this.prisma.cmsSettings.findFirst({
      where: { brand_id },
      include: { brand: true }
    });
    
    // Auto-create default settings if they don't exist
    if (!settings) {
      settings = await this.prisma.cmsSettings.create({
        data: { brand_id, siteTitle: 'D4U Restaurant' },
        include: { brand: true }
      });
    }
    
    return settings;
  }

  async updateSettings(brand_id: number, data: Partial<{ 
    siteTitle: string; contactPhone: string; contactEmail: string; address: string; facebookUrl: string; instagramUrl: string; whatsappNumber: string;
    module_auth_enabled: boolean; module_kds_enabled: boolean; module_loyalty_enabled: boolean; module_payments_enabled: boolean;
  }>) {
    const settings = await this.getSettings(brand_id);
    return this.prisma.cmsSettings.update({
      where: { id: settings.id },
      data,
    });
  }
}
