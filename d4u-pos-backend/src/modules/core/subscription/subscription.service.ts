import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreatePackageDto, OnboardClientDto } from './dto';
import { SystemRoles } from '../../../common/enums/roles.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PACKAGES
  // -------------------------------------------------------------
  async getPackages() {
    return this.prisma.package.findMany({
      include: { modules: true },
      orderBy: { created_at: 'desc' }
    });
  }

  async createPackage(data: CreatePackageDto) {
    const total_value = data.modules.reduce((sum, mod) => sum + mod.price, 0);
    const discount_pct = total_value > 0 ? ((total_value - data.monthly_rental) / total_value) * 100 : 0;

    return this.prisma.package.create({
      data: {
        code: `PKG-${Date.now()}`,
        name: data.name,
        description: data.description,
        currency: data.currency,
        monthly_rental: data.monthly_rental,
        billing_cycle: data.billing_cycle,
        total_value,
        discount_pct,
        modules: {
          create: data.modules.map(m => ({ module_key: m.module_key, price: m.price }))
        }
      },
      include: { modules: true }
    });
  }

  async updatePackage(id: number, data: CreatePackageDto) {
    const total_value = data.modules.reduce((sum, mod) => sum + mod.price, 0);
    const discount_pct = total_value > 0 ? ((total_value - data.monthly_rental) / total_value) * 100 : 0;

    // Delete old modules
    await this.prisma.packageModule.deleteMany({ where: { package_id: id } });

    return this.prisma.package.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        currency: data.currency,
        monthly_rental: data.monthly_rental,
        billing_cycle: data.billing_cycle,
        total_value,
        discount_pct,
        modules: {
          create: data.modules.map(m => ({ module_key: m.module_key, price: m.price }))
        }
      },
      include: { modules: true }
    });
  }

  async archivePackage(id: number) {
    const subs = await this.prisma.subscription.count({ where: { package_id: id, status: 'ACTIVE' } });
    if (subs > 0) throw new BadRequestException('Cannot archive package assigned to active subscriptions');

    return this.prisma.package.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
  }

  // -------------------------------------------------------------
  // SAAS PRICING (A LA CARTE)
  // -------------------------------------------------------------
  async getPricing(currency: string) {
    const prices = await this.prisma.saaSPricing.findMany({
      where: { currency }
    });
    if (prices.length > 0) return prices;

    const defaultModules = [
      { name: 'Vendor Management', key: 'VENDORS' },
      { name: 'Loyalty & Rewards', key: 'LOYALTY' },
      { name: 'Base POS System', key: 'BASE_POS' },
      { name: 'Accounting & Cash Flow', key: 'ACCOUNTING' },
      { name: 'Advanced Analytics (Owner App)', key: 'ANALYTICS' },
      { name: 'Website CMS Builder', key: 'CMS' },
      { name: 'Staff HR & Payroll', key: 'HR_PAYROLL' },
      { name: 'Advanced Inventory', key: 'INVENTORY' },
      { name: 'Kitchen Display System', key: 'KDS' },
      { name: 'Marketing Hub & Campaigns', key: 'MARKETING' },
      { name: 'Online Ordering Website', key: 'ONLINE_WEBSITE' },
      { name: 'Recipe Costing & Production', key: 'RECIPES' },
      { name: 'Delivery Rider App', key: 'RIDER' },
      { name: 'Customer TV Board', key: 'TV_BOARD' }
    ];

    await this.prisma.saaSPricing.createMany({
      data: defaultModules.map(m => ({
        module_key: m.key,
        module_name: m.name,
        currency: currency,
        price_monthly: 0,
        price_yearly: 0
      }))
    });

    return this.prisma.saaSPricing.findMany({
      where: { currency }
    });
  }

  // -------------------------------------------------------------
  // ONBOARDING
  // -------------------------------------------------------------
  async onboardClient(data: OnboardClientDto) {
    try {
      if (data.admin_user?.phone) {
        const existingUser = await this.prisma.user.findUnique({
          where: { phone: data.admin_user.phone }
        });
        if (existingUser) {
          throw new BadRequestException('An account with this phone number already exists. Please use a different phone number.');
        }
      }

      if (data.is_existing_brand) {
      if (!data.existing_brand_id) throw new BadRequestException('Brand ID required');
      const store = await this.prisma.store.create({
        data: {
          brand_id: data.existing_brand_id,
          name: data.store_location,
          location: data.store_location,
          owner_name: data.owner_name,
          owner_phone: data.owner_phone,
          owner_email: data.owner_email,
          address: data.address,
        }
      });
      return { success: true, store_id: store.id, brand_id: store.brand_id };
    }

    if (!data.package_id) throw new BadRequestException('Package selection is required for a new brand');

    const pkg = await this.prisma.package.findUnique({ where: { id: data.package_id } });
    if (!pkg) throw new BadRequestException('Package not found');

    // 1. Create Brand
    const brand = await this.prisma.brand.create({
      data: {
        name: data.brand_name,
        is_chain_store: data.is_chain_store || false,
        menu_strategy: data.menu_strategy || 'UNIFIED',
        currency: pkg.currency,
        vat_percentage: data.vat_percentage || 0,
      }
    });

    // 2. Create Store
    const store = await this.prisma.store.create({
      data: {
        brand_id: brand.id,
        name: data.store_location,
        location: data.store_location,
        owner_name: data.owner_name,
        owner_phone: data.owner_phone,
        owner_email: data.owner_email,
        address: data.address,
        saas_package_id: pkg.id,
      }
    });

    // 3. Create Subscription
    const start_date = new Date();
    const expiry_date = new Date();
    if (pkg.billing_cycle === 'YEARLY') expiry_date.setFullYear(expiry_date.getFullYear() + 1);
    else if (pkg.billing_cycle === 'QUARTERLY') expiry_date.setMonth(expiry_date.getMonth() + 3);
    else expiry_date.setMonth(expiry_date.getMonth() + 1);

    await this.prisma.subscription.create({
      data: {
        brand_id: brand.id,
        package_id: pkg.id,
        rental_amount: pkg.monthly_rental,
        currency: pkg.currency,
        billing_cycle: pkg.billing_cycle,
        start_date,
        next_billing_date: expiry_date,
        expiry_date,
        grace_period_days: 5,
        status: 'ACTIVE'
      }
    });

    // 4. Create Admin User
    if (data.admin_user?.password) {
      const hashedPassword = await bcrypt.hash(data.admin_user.password, 10);
      await this.prisma.user.create({
        data: {
          brand_id: brand.id,
          store_id: store.id,
          name: data.admin_user.name,
          phone: data.admin_user.phone,
          hashedPin: hashedPassword,
          role_id: 2 // Business Owner (assuming 2)
        }
      });
    }

    return { success: true, store_id: store.id, brand_id: brand.id };
    } catch (e: any) {
      console.error("ONBOARDING CRASH:", e);
      throw new BadRequestException(e.message || "Failed to onboard");
    }
  }

  // -------------------------------------------------------------
  // SUBSCRIPTION MANAGEMENT
  // -------------------------------------------------------------
  async getSubscription(brand_id: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { brand_id },
      include: { package: { include: { modules: true } }, brand: true }
    });
    return sub;
  }

  async renewSubscription(id: number, data: { amount_paid: number; payment_method: string; reference_number?: string; remarks?: string; recorded_by: number }) {
    const sub = await this.prisma.subscription.findUnique({ where: { id }, include: { package: true } });
    if (!sub) throw new BadRequestException('Subscription not found');

    // Calculate new expiry date based on billing cycle
    const expiry_date = new Date(sub.expiry_date);
    if (expiry_date < new Date()) {
      // If expired, start from today
      expiry_date.setTime(Date.now());
    }

    if (sub.package.billing_cycle === 'YEARLY') expiry_date.setFullYear(expiry_date.getFullYear() + 1);
    else if (sub.package.billing_cycle === 'QUARTERLY') expiry_date.setMonth(expiry_date.getMonth() + 3);
    else expiry_date.setMonth(expiry_date.getMonth() + 1);

    await this.prisma.$transaction([
      this.prisma.subscriptionPayment.create({
        data: {
          subscription_id: id,
          amount_paid: data.amount_paid,
          payment_method: data.payment_method,
          reference_number: data.reference_number,
          recorded_by: data.recorded_by,
          remarks: data.remarks
        }
      }),
      this.prisma.billingHistory.create({
        data: {
          subscription_id: id,
          event_type: 'RENEWED',
          description: `Subscription renewed via ${data.payment_method}. Amount: ${data.amount_paid}`
        }
      }),
      this.prisma.subscription.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          expiry_date,
          next_billing_date: expiry_date,
          suspend_reason: null
        }
      })
    ]);

    return { success: true, new_expiry_date: expiry_date };
  }

  // -------------------------------------------------------------
  // MARKETING-002: SaaS feature gating for the Marketing Hub / Promotion Engine
  // -------------------------------------------------------------
  async getMarketingCapabilities(store_id: number) {
    const disabled = { enabled: false, allowedCampaignTypes: [] as string[], socialPublishing: false, tvBoard: false, analytics: false };

    const store = await this.prisma.store.findUnique({
      where: { id: store_id },
      include: { saas_package: { include: { modules: true } } },
    });
    const pkg = store?.saas_package;
    const marketingModule = pkg?.modules.find((m) => m.module_key === 'MARKETING');
    if (!pkg || !marketingModule) return disabled;

    const cfg = (marketingModule.config as any) || null;
    if (cfg?.allowedCampaignTypes) {
      return {
        enabled: true,
        allowedCampaignTypes: cfg.allowedCampaignTypes,
        socialPublishing: !!cfg.socialPublishing,
        tvBoard: !!cfg.tvBoard,
        analytics: cfg.analytics !== false,
      };
    }

    // No explicit config on this package's MARKETING module yet — fall back to a
    // sensible tier inferred from the package name/code, so pre-existing packages
    // keep working until an admin configures `config` explicitly (additive, non-breaking).
    const label = `${pkg.code} ${pkg.name}`.toUpperCase();
    if (label.includes('ENTERPRISE')) {
      return {
        enabled: true,
        allowedCampaignTypes: ['PERCENTAGE', 'FLAT', 'BOGO', 'BUY_X_GET_Y', 'BUNDLE', 'COMBO', 'FREE_GIFT', 'HAPPY_HOUR'],
        socialPublishing: true,
        tvBoard: true,
        analytics: true,
      };
    }
    if (label.includes('PROFESSIONAL')) {
      return { enabled: true, allowedCampaignTypes: ['PERCENTAGE', 'FLAT'], socialPublishing: false, tvBoard: true, analytics: true };
    }
    if (label.includes('STANDARD')) {
      return { enabled: true, allowedCampaignTypes: ['FLAT'], socialPublishing: false, tvBoard: false, analytics: false };
    }
    // BASIC, or an unrecognized package that still purchased MARKETING a-la-carte.
    return { enabled: true, allowedCampaignTypes: ['FLAT'], socialPublishing: false, tvBoard: false, analytics: false };
  }

  async suspendSubscription(id: number, data: { reason: string }) {
    await this.prisma.$transaction([
      this.prisma.billingHistory.create({
        data: {
          subscription_id: id,
          event_type: 'SUSPENDED',
          description: `Subscription suspended. Reason: ${data.reason}`
        }
      }),
      this.prisma.subscription.update({
        where: { id },
        data: {
          status: 'SUSPENDED',
          suspend_reason: data.reason
        }
      })
    ]);
    return { success: true };
  }
}
