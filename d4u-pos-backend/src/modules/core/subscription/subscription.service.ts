import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getPricing(currency: string = 'USD') {
    const pricing = await this.prisma.saaSPricing.findMany({
      where: { currency },
    });
    // Default mock pricing if empty
    if (pricing.length === 0) {
      return [
        {
          module_key: 'BASE_POS',
          module_name: 'Base POS System',
          price_monthly: currency === 'PKR' ? 14000 : currency === 'AED' ? 180 : currency === 'GBP' ? 40 : currency === 'SAR' ? 185 : 50,
          currency: currency,
        },
        {
          module_key: 'INVENTORY',
          module_name: 'Advanced Inventory',
          price_monthly: currency === 'PKR' ? 5600 : currency === 'AED' ? 75 : currency === 'GBP' ? 16 : currency === 'SAR' ? 75 : 20,
          currency: currency,
        },
        {
          module_key: 'RECIPES',
          module_name: 'Recipe Costing & Production',
          price_monthly: currency === 'PKR' ? 4200 : currency === 'AED' ? 55 : currency === 'GBP' ? 12 : currency === 'SAR' ? 55 : 15,
          currency: currency,
        },
        {
          module_key: 'ACCOUNTING',
          module_name: 'Accounting & Cash Flow',
          price_monthly: currency === 'PKR' ? 7000 : currency === 'AED' ? 90 : currency === 'GBP' ? 20 : currency === 'SAR' ? 95 : 25,
          currency: currency,
        },
        {
          module_key: 'MARKETING',
          module_name: 'Marketing Hub & Campaigns',
          price_monthly: currency === 'PKR' ? 4200 : currency === 'AED' ? 55 : currency === 'GBP' ? 12 : currency === 'SAR' ? 55 : 15,
          currency: currency,
        },
        {
          module_key: 'CMS',
          module_name: 'Website CMS Builder',
          price_monthly: currency === 'PKR' ? 2800 : currency === 'AED' ? 35 : currency === 'GBP' ? 8 : currency === 'SAR' ? 35 : 10,
          currency: currency,
        },
        {
          module_key: 'VENDORS',
          module_name: 'Vendor Management',
          price_monthly: currency === 'PKR' ? 2800 : currency === 'AED' ? 35 : currency === 'GBP' ? 8 : currency === 'SAR' ? 35 : 10,
          currency: currency,
        },
        {
          module_key: 'HR_PAYROLL',
          module_name: 'Staff HR & Payroll',
          price_monthly: currency === 'PKR' ? 5600 : currency === 'AED' ? 75 : currency === 'GBP' ? 16 : currency === 'SAR' ? 75 : 20,
          currency: currency,
        },
        {
          module_key: 'KDS',
          module_name: 'Kitchen Display System',
          price_monthly: currency === 'PKR' ? 4200 : currency === 'AED' ? 55 : currency === 'GBP' ? 12 : currency === 'SAR' ? 55 : 15,
          currency: currency,
        },
        {
          module_key: 'RIDER',
          module_name: 'Delivery Rider App',
          price_monthly: currency === 'PKR' ? 2800 : currency === 'AED' ? 35 : currency === 'GBP' ? 8 : currency === 'SAR' ? 35 : 10,
          currency: currency,
        },
        {
          module_key: 'TV_BOARD',
          module_name: 'Customer TV Board',
          price_monthly: currency === 'PKR' ? 2800 : currency === 'AED' ? 35 : currency === 'GBP' ? 8 : currency === 'SAR' ? 35 : 10,
          currency: currency,
        },
        {
          module_key: 'ONLINE_WEBSITE',
          module_name: 'Online Ordering Website',
          price_monthly: currency === 'PKR' ? 7000 : currency === 'AED' ? 90 : currency === 'GBP' ? 20 : currency === 'SAR' ? 95 : 25,
          currency: currency,
        },
        {
          module_key: 'LOYALTY',
          module_name: 'Loyalty & Rewards',
          price_monthly: currency === 'PKR' ? 1400 : currency === 'AED' ? 20 : currency === 'GBP' ? 4 : currency === 'SAR' ? 20 : 5,
          currency: currency,
        },
        {
          module_key: 'ANALYTICS',
          module_name: 'Advanced Analytics (Owner App)',
          price_monthly: currency === 'PKR' ? 5600 : currency === 'AED' ? 75 : currency === 'GBP' ? 16 : currency === 'SAR' ? 75 : 20,
          currency: currency,
        }
      ];
    }
    return pricing;
  }

  async getAllPricingRows() {
    return this.prisma.saaSPricing.findMany({
      orderBy: { module_key: 'asc' }
    });
  }

  async createPricing(data: any) {
    return this.prisma.saaSPricing.create({
      data: {
        module_key: data.module_key,
        module_name: data.module_name,
        price_monthly: Number(data.price_monthly),
        currency: data.currency || 'USD'
      }
    });
  }

  async updatePricing(id: number, data: any) {
    return this.prisma.saaSPricing.update({
      where: { id },
      data: {
        ...(data.module_name && { module_name: data.module_name }),
        ...(data.price_monthly !== undefined && { price_monthly: Number(data.price_monthly) })
      }
    });
  }

  async deletePricing(id: number) {
    return this.prisma.saaSPricing.delete({
      where: { id }
    });
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
      owner_name,
      owner_phone,
      owner_email,
      address,
      map_pin,
      website,
      email,
      landline,
      whatsapp,
      order_no_prefix,
    } = body;

    let brand;
    if (is_existing_brand && existing_brand_id) {
      const parsedBrandId = Number(existing_brand_id);
      if (isNaN(parsedBrandId)) throw new Error('Invalid Brand ID provided');
      
      brand = await this.prisma.brand.findUnique({
        where: { id: parsedBrandId },
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
          vat_percentage: Number(vat_percentage) || 0,
          is_chain_store: is_chain_store || false,
          menu_strategy: menu_strategy || 'UNIFIED',
        },
      });
    }

    // 2. Create the store (either first or additional branch)
    const storeName = is_existing_brand
      ? (store_location || `${brand.name} - Branch`)
      : (store_location || `${brand_name} - HQ`);
    const store = await this.prisma.store.create({
      data: {
        brand_id: brand.id,
        name: storeName,
        location: store_location || 'Main Branch',
        owner_name,
        owner_phone,
        owner_email,
        address,
        map_pin,
        website,
        email,
        landline,
        whatsapp,
        order_no_prefix,
        vat_percentage: Number(vat_percentage) || 0,
      },
    });

    // 3. Create the Subscription for the store
    await this.prisma.subscription.create({
      data: {
        store_id: store.id,
        plan_name: 'CUSTOM_SAAS',
        module_auth_enabled: true, // Always true
        module_analytics_enabled: selected_modules?.includes('ANALYTICS') || false,
        module_kds_enabled: selected_modules?.includes('KDS') || false,
        module_riders_enabled: selected_modules?.includes('RIDER') || false,
        module_tv_board_enabled: selected_modules?.includes('TV_BOARD') || false,
        module_online_website_enabled:
          selected_modules?.includes('ONLINE_WEBSITE') || false,
        module_loyalty_enabled: selected_modules?.includes('LOYALTY') || false,
        billing_amount: total_billing_amount || 0,
        status: 'ACTIVE',
      },
    });

    // 4. Create HeadOffice User (if provided and new brand)
    if (!is_existing_brand && admin_user) {
      await this.prisma.user.create({
        data: {
          brand_id: brand.id,
          store_id: store.id,
          role_id: 3, // 3 is Super Admin
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

    const stores = await this.prisma.store.findMany({
      where: { brand_id: Number(brand_id) }
    });

    for (const st of stores) {
      const existing = await this.prisma.subscription.findUnique({
        where: { store_id: st.id }
      });

      if (existing) {
        await this.prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan_name,
            ...modules,
          },
        });
      } else {
        await this.prisma.subscription.create({
          data: {
            store_id: st.id,
            plan_name,
            ...modules,
          },
        });
      }
    }
    return { success: true };
  }

  async getSubscription(brand_id: number) {
    const store = await this.prisma.store.findFirst({
      where: { brand_id },
      include: { subscription: true, brand: true },
      orderBy: { id: 'asc' }
    });

    const sub = store?.subscription;
    const brand = store?.brand;

    if (!sub || !brand) {
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

    return { ...sub, brand };
  }
}
