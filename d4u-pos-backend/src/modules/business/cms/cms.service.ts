import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

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
  async getSettings(store_id: number) {
    let settings = await this.prisma.cmsSettings.findFirst({
      where: { store_id },
      include: { brand: true, store: true }
    });
    
    // Auto-create default settings if they don't exist
    if (!settings) {
      settings = await this.prisma.cmsSettings.create({
        data: { brand_id: 1, store_id, siteTitle: 'D4U Restaurant' },
        include: { brand: true, store: true }
      });
    }
    
    return settings;
  }

  async updateSettings(store_id: number, data: any) {
    const existing = await this.getSettings(store_id);
    return this.prisma.cmsSettings.update({
      where: { id: existing.id },
      data: {
        siteTitle: data.siteTitle,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        address: data.address,
        googleMapUrl: data.googleMapUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        whatsappNumber: data.whatsappNumber,
        twitterUrl: data.twitterUrl,
        youtubeUrl: data.youtubeUrl,
        aboutText: data.aboutText,
        companyText: data.companyText,
        module_auth_enabled: data.module_auth_enabled,
        module_kds_enabled: data.module_kds_enabled,
        module_loyalty_enabled: data.module_loyalty_enabled,
        module_payments_enabled: data.module_payments_enabled,
      }
    });
  }

  async subscribeNewsletter(store_id: number, email: string) {
    try {
      return await this.prisma.newsletterSubscriber.create({
        data: { store_id, email }
      });
    } catch (error) {
      // Ignore if already subscribed (unique constraint)
      return { status: 'already_subscribed' };
    }
  }
}
