import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getPricing() {
    const pricing = await this.prisma.saaSPricing.findMany();
    // Default mock pricing if empty
    if (pricing.length === 0) {
      return [
        {
          module_key: 'BASE_POS',
          module_name: 'Base POS System',
          price_monthly: 50,
          currency: 'USD',
        },
        {
          module_key: 'KDS',
          module_name: 'Kitchen Display System',
          price_monthly: 15,
          currency: 'USD',
        },
        {
          module_key: 'RIDER',
          module_name: 'Delivery Rider App',
          price_monthly: 10,
          currency: 'USD',
        },
        {
          module_key: 'TV_BOARD',
          module_name: 'Customer TV Board',
          price_monthly: 10,
          currency: 'USD',
        },
        {
          module_key: 'ONLINE_WEBSITE',
          module_name: 'Online Ordering Website',
          price_monthly: 25,
          currency: 'USD',
        },
        {
          module_key: 'LOYALTY',
          module_name: 'Loyalty & Rewards',
          price_monthly: 5,
          currency: 'USD',
        },
        {
          module_key: 'ANALYTICS',
          module_name: 'Advanced Analytics (Owner App)',
          price_monthly: 20,
          currency: 'USD',
        },
      ];
    }
    return pricing;
  }

  async onboardClient(body: any) {
    const {
      is_existing_brand,
      existing_brand_id,
      brand_name,
      currency,
      vat_percentage,
      selected_modules,
      total_billing_amount,
      admin_user,
      is_chain_store,
      menu_strategy,
      store_location,
    } = body;

    let brand;
    if (is_existing_brand && existing_brand_id) {
      brand = await this.prisma.brand.findUnique({
        where: { id: Number(existing_brand_id) },
      });
      if (!brand) throw new Error('Brand not found');

      // Update chain store settings if adding a branch makes it a chain
      if (is_chain_store) {
        await this.prisma.brand.update({
          where: { id: brand.id },
          data: { is_chain_store, menu_strategy: menu_strategy || 'UNIFIED' },
        });
      }
    } else {
      // 1. Create the Brand
      brand = await this.prisma.brand.create({
        data: {
          name: brand_name,
          currency: currency || 'PKR',
          vat_percentage: vat_percentage || 0,
          is_chain_store: is_chain_store || false,
          menu_strategy: menu_strategy || 'UNIFIED',
        },
      });

      // Create the Subscription for NEW brands
      await this.prisma.subscription.create({
        data: {
          brand_id: brand.id,
          plan_name: 'CUSTOM_SAAS',
          module_auth_enabled: true, // Always true
          module_analytics_enabled: selected_modules.includes('ANALYTICS'),
          module_kds_enabled: selected_modules.includes('KDS'),
          module_riders_enabled: selected_modules.includes('RIDER'),
          module_tv_board_enabled: selected_modules.includes('TV_BOARD'),
          module_online_website_enabled:
            selected_modules.includes('ONLINE_WEBSITE'),
          module_loyalty_enabled: selected_modules.includes('LOYALTY'),
          billing_amount: total_billing_amount || 0,
          status: 'ACTIVE',
        },
      });
    }

    // 2. Create the store (either first or additional branch)
    const storeName = is_existing_brand
      ? `${brand.name} - Branch`
      : `${brand_name} - HQ`;
    const store = await this.prisma.store.create({
      data: {
        brand_id: brand.id,
        name: storeName,
        location: store_location || 'Main Branch',
      },
    });

    // 4. Create HeadOffice User (if provided and new brand)
    if (!is_existing_brand && admin_user) {
      await this.prisma.user.create({
        data: {
          brand_id: brand.id,
          store_id: store.id,
          role_id: 1, // Assuming 1 is HeadOffice/SuperAdmin
          name: admin_user.name || 'Admin',
          phone: admin_user.phone,
          hashedPin: admin_user.password || '1234',
        },
      });
    }

    return { success: true, brand, store };
  }

  async createOrUpdateSubscription(body: any) {
    const {
      brand_id,
      plan_name,
      modules,
      is_chain_store,
      menu_strategy,
      currency,
      vat_percentage,
    } = body;

    await this.prisma.brand.update({
      where: { id: Number(brand_id) },
      data: {
        is_chain_store: is_chain_store ?? false,
        menu_strategy: menu_strategy || 'UNIFIED',
        ...(currency && { currency }),
        ...(vat_percentage !== undefined && { vat_percentage }),
      },
    });

    const existing = await this.prisma.subscription.findUnique({
      where: { brand_id: Number(brand_id) },
    });

    if (existing) {
      return this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          plan_name,
          ...modules,
        },
      });
    }

    return this.prisma.subscription.create({
      data: {
        brand_id: Number(brand_id),
        plan_name,
        ...modules,
      },
    });
  }

  async getSubscription(brand_id: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { brand_id },
      include: { brand: true },
    });

    if (!sub) {
      return {
        brand_id,
        plan_name: 'Free Trial',
        module_auth_enabled: true,
        module_kds_enabled: false,
        module_riders_enabled: false,
        module_loyalty_enabled: false,
        module_tv_board_enabled: false,
        module_online_website_enabled: false,
        module_analytics_enabled: true,
        billing_amount: 0,
        brand: {
          is_chain_store: false,
          menu_strategy: 'UNIFIED',
          currency: 'PKR',
          vat_percentage: 0,
        },
      };
    }

    return sub;
  }
}
