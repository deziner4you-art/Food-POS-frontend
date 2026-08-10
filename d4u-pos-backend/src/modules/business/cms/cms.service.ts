import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { LOYALTY_POINT_VALUE } from '../customers/loyalty.constants';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  // --- Banners ---
  // store_id scoping mirrors CampaignResolverService.getCoreActiveCampaigns
  // exactly: empty target_stores = brand-wide (shows on every branch of the
  // brand), non-empty = only those specific branches. Was previously
  // filtered by brand_id alone, so every banner leaked across every branch
  // of the same brand -- and with no brand check at all when store_id
  // wasn't passed, across brands too.
  async getBanners(brand_id: number = 1, store_id?: number) {
    const where: any = { brand_id };
    if (store_id) {
      // Resolve the real brand from store_id rather than trusting the
      // separately-passed brand_id -- callers that only know their own
      // store_id (the public website) should never be able to end up
      // reading a different brand's banners via a mismatched/stale
      // brand_id, same defense-in-depth the campaign resolver applies.
      const store = await this.prisma.store.findUnique({ where: { id: store_id }, select: { brand_id: true } });
      if (!store) return [];
      where.brand_id = store.brand_id;
      where.OR = [
        { target_stores: { none: {} } },
        { target_stores: { some: { id: store_id } } },
      ];
    }
    return this.prisma.cmsBanner.findMany({
      where,
      include: { target_stores: { select: { id: true, name: true } } },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createBanner(data: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    buttonText?: string;
    isActive?: boolean;
    displayOrder?: number;
    brand_id?: number;
    target_store_ids?: number[];
  }) {
    // Same brand_id resolution as MarketingService.createCampaign: a bare
    // `|| 1` default here silently tagged every banner to brand 1 regardless
    // of which real brand's branches it targeted, the exact same bug found
    // in campaign creation -- infer from the first targeted store when no
    // explicit brand_id is given, rather than ever falling back to 1.
    let brandId = data.brand_id;
    if (!brandId && data.target_store_ids?.length) {
      const store = await this.prisma.store.findUnique({ where: { id: data.target_store_ids[0] }, select: { brand_id: true } });
      brandId = store?.brand_id;
    }
    if (!brandId) {
      throw new BadRequestException('brand_id is required (select at least one branch, or specify a brand) to create a banner.');
    }
    return this.prisma.cmsBanner.create({
      data: {
        brand_id: brandId,
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        buttonText: data.buttonText,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder || 0,
        target_stores: data.target_store_ids?.length
          ? { connect: data.target_store_ids.map((id) => ({ id: Number(id) })) }
          : undefined,
      },
      include: { target_stores: { select: { id: true, name: true } } },
    });
  }

  async updateBanner(
    id: number,
    data: Partial<{
      title: string;
      subtitle: string;
      imageUrl: string;
      linkUrl: string;
      buttonText: string;
      isActive: boolean;
      displayOrder: number;
      target_store_ids: number[];
    }>,
  ) {
    const { target_store_ids, ...rest } = data;
    return this.prisma.cmsBanner.update({
      where: { id },
      data: {
        ...rest,
        // undefined (key omitted) leaves existing targeting unchanged;
        // an explicit array (including []) replaces it -- matches how
        // MarketingCampaign's own update handles target_store_ids.
        ...(target_store_ids !== undefined
          ? { target_stores: { set: target_store_ids.map((id) => ({ id: Number(id) })) } }
          : {}),
      },
      include: { target_stores: { select: { id: true, name: true } } },
    });
  }

  async deleteBanner(id: number) {
    return this.prisma.cmsBanner.delete({
      where: { id },
    });
  }

  // --- Settings ---
  async getSettings(store_id: number) {
    let settings = await this.prisma.cmsSettings.findFirst({
      where: { store_id },
      include: { brand: true, store: true },
    });

    // Auto-create default settings if they don't exist
    if (!settings) {
      const store = await this.prisma.store.findUnique({ where: { id: store_id } });
      if (!store) throw new Error('Store not found for CMS settings creation');
      
      settings = await this.prisma.cmsSettings.create({
        // tax_percentage seeded at 10, not the column's bare 0 default --
        // matches the universal hardcoded rate every client displayed before
        // this field existed, so a brand-new branch doesn't silently start
        // at 0% tax until someone happens to open its settings.
        data: { brand_id: store.brand_id, store_id, siteTitle: 'D4U Restaurant', tax_percentage: 10 },
        include: { brand: true, store: true },
      });
    }

    // Echoes the single backend source of truth for the loyalty conversion
    // rate so the POS client never has to hardcode it (reuses this existing
    // settings response instead of adding a new endpoint/UI).
    // inventoryUnlockPinHash is never sent to any client, public or admin —
    // only whether one is currently set.
    const { inventoryUnlockPinHash, ...safeSettings } = settings as any;
    return {
      ...safeSettings,
      hasInventoryUnlockPin: !!inventoryUnlockPinHash,
      loyalty_point_value: LOYALTY_POINT_VALUE,
    };
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
        tax_percentage: data.tax_percentage,
        delivery_fee: data.delivery_fee,
        delivery_radius_km: data.delivery_radius_km,
        min_order_free_delivery: data.min_order_free_delivery,
        // Blank/omitted = leave the existing PIN unchanged (password-field
        // semantics) — undefined tells Prisma to skip this field entirely,
        // never to null it out.
        inventoryUnlockPinHash: data.inventoryUnlockPin
          ? await bcrypt.hash(data.inventoryUnlockPin, 10)
          : undefined,
      },
    });
  }

  /** Verifies a KDS Inventory Unlock PIN for a branch — never returns the hash or PIN itself. */
  async verifyInventoryPin(store_id: number, pin: string): Promise<boolean> {
    const settings = await this.prisma.cmsSettings.findFirst({ where: { store_id } });
    if (!settings?.inventoryUnlockPinHash) return false;
    return bcrypt.compare(pin, settings.inventoryUnlockPinHash);
  }

  async subscribeNewsletter(store_id: number, email: string) {
    try {
      return await this.prisma.newsletterSubscriber.create({
        data: { store_id, email },
      });
    } catch (error) {
      // Ignore if already subscribed (unique constraint)
      return { status: 'already_subscribed' };
    }
  }
}
