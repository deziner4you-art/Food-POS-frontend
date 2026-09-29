import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreatePackageDto, OnboardClientDto } from './dto';
import { SystemRoles } from '../../../common/enums/roles.enum';
import { ModuleKey, getMissingDependencies, normalizeModuleKey } from '../../../common/entitlements/module-registry';
import * as bcrypt from 'bcryptjs';

const DEFAULT_PRICING = [
  ['VENDORS', 'Vendor Management'],
  ['LOYALTY', 'Loyalty & Rewards'],
  ['BASE_POS', 'Base POS System'],
  ['KOT_PRINT', 'KOT Printing'],
  ['ACCOUNTING', 'Accounting & Cash Flow'],
  ['ANALYTICS', 'Advanced Analytics (Owner App)'],
  ['CMS', 'Website CMS Builder'],
  ['HR_PAYROLL', 'Staff HR & Payroll'],
  ['INVENTORY', 'Advanced Inventory'],
  ['KDS', 'Kitchen Display System'],
  ['MARKETING', 'Marketing Hub & Campaigns'],
  ['ONLINE_WEBSITE', 'Online Ordering Website'],
  ['RECIPES', 'Recipe Costing & Production'],
  ['RIDER', 'Delivery Rider App'],
  ['TV_BOARD', 'Customer TV Board'],
] as const;

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
    const modules = this.validatePackageModules(data.modules);
    const total_value = modules.reduce((sum, mod) => sum + mod.price, 0);
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
          create: modules.map(m => ({ module_key: m.module_key, price: m.price }))
        }
      },
      include: { modules: true }
    });
  }

  async updatePackage(id: number, data: CreatePackageDto) {
    const modules = this.validatePackageModules(data.modules);
    const total_value = modules.reduce((sum, mod) => sum + mod.price, 0);
    const discount_pct = total_value > 0 ? ((total_value - data.monthly_rental) / total_value) * 100 : 0;

    const update = async (tx: any) => {
      // Delete and recreate the module set in one transaction. A failed
      // package update must never leave the package with zero modules.
      await tx.packageModule.deleteMany({ where: { package_id: id } });
      return tx.package.update({
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
            create: modules.map(m => ({ module_key: m.module_key, price: m.price }))
          }
        },
        include: { modules: true }
      });
    };
    return typeof this.prisma.$transaction === 'function'
      ? this.prisma.$transaction(update)
      : update(this.prisma);
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
    try {
      const prices = await this.prisma.saaSPricing.findMany({ where: { currency } });
      if (prices.length > 0) return prices.map((price) => ({ ...price, persisted: true }));
    } catch (error) {
      // A missing/drifted SaaSPricing table must not make the package editor
      // render zero modules. The fallback is read-only; it never mutates DB.
      console.error('SaaSPricing unavailable; using registry defaults.', error);
    }

    return DEFAULT_PRICING.map(([module_key, module_name], index) => ({
      id: null,
      module_key,
      module_name,
      currency,
      price_monthly: 0,
      price_yearly: 0,
      persisted: false,
      fallback_id: `default-${index + 1}`,
    }));
  }

  async updatePricing(id: number, data: { price_monthly: number }) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('A valid pricing record is required.');
    }
    const price = Number(data?.price_monthly);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('price_monthly must be a non-negative number.');
    }
    return this.prisma.saaSPricing.update({
      where: { id },
      data: { price_monthly: price },
    });
  }

  private validatePackageModules(
    input: { module_key: string; price: number }[] | undefined,
  ): { module_key: ModuleKey; price: number }[] {
    if (!Array.isArray(input) || input.length === 0) {
      throw new BadRequestException('A package must include at least BASE_POS.');
    }

    const seen = new Set<ModuleKey>();
    const modules = input.map((module) => {
      const key = normalizeModuleKey(module?.module_key);
      if (!key) throw new BadRequestException(`Unknown package module: ${module?.module_key || 'empty'}.`);
      if (seen.has(key)) throw new BadRequestException(`Duplicate package module: ${key}.`);
      const price = Number(module?.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException(`Invalid price for package module ${key}.`);
      }
      seen.add(key);
      return { module_key: key, price };
    });

    if (!seen.has('BASE_POS')) {
      throw new BadRequestException('Every package must include BASE_POS.');
    }

    for (const key of seen) {
      const missing = getMissingDependencies(key, seen);
      if (missing.length) {
        throw new BadRequestException(
          `Package module ${key} requires: ${missing.join(', ')}.`,
        );
      }
    }
    return modules;
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

    if (!Number.isInteger(store_id) || store_id <= 0) return disabled;

    const store = await this.prisma.store.findUnique({
      where: { id: store_id },
      include: { saas_package: { include: { modules: true } } },
    });
    const pkg = store?.saas_package;
    const subscription = store
      ? await this.prisma.subscription.findUnique({ where: { brand_id: store.brand_id } })
      : null;
    const expiry = subscription?.expiry_date ? new Date(subscription.expiry_date) : null;
    const activeSubscription = subscription?.status === 'ACTIVE'
      && !!expiry
      && Number.isFinite(expiry.getTime())
      && expiry.getTime() >= Date.now();
    const packageMatchesSubscription = !!pkg
      && !!subscription
      && pkg.id === subscription.package_id;
    const marketingModule = pkg?.modules.find((m) => normalizeModuleKey(m.module_key) === 'MARKETING');

    // Marketing is a paid capability. Missing package, missing MARKETING
    // module, inactive package, missing/expired subscription, and package
    // mismatch must all fail closed. Never re-enable campaigns just because
    // old data exists or setup was incomplete.
    if (!pkg || pkg.status !== 'ACTIVE' || !marketingModule || !activeSubscription || !packageMatchesSubscription) {
      return disabled;
    }

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
