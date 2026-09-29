import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  ModuleKey,
  getMissingDependencies,
  normalizeModuleKey,
} from '../../../common/entitlements/module-registry';

export type CapabilitySnapshot = {
  tenant: {
    brandId: number;
    storeId: number;
    brandName: string | null;
    storeName: string | null;
  };
  subscription: {
    status: string | null;
    packageId: number | null;
    packageCode: string | null;
    expiresAt: string | null;
  };
  modules: ModuleKey[];
  capabilities: {
    pos: boolean;
    kotPrint: boolean;
    businessDay: boolean;
    dailyReports: boolean;
    accounting: boolean;
    kds: boolean;
    marketing: boolean;
    website: boolean;
    cms: boolean;
    crm: boolean;
    loyalty: boolean;
    rider: boolean;
    tvBoard: boolean;
    inventory: boolean;
    recipes: boolean;
    vendors: boolean;
    analytics: boolean;
    hrPayroll: boolean;
  };
  entitlement: {
    enabled: boolean;
    reason: string | null;
    missingDependencies: Partial<Record<ModuleKey, ModuleKey[]>>;
  };
};

function positiveInteger(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the tenant from the authenticated workspace, never from a
   * client-supplied package or brand id. Super Admin must still select an
   * explicit store when it has no active workspace.
   */
  async resolveForAuthenticatedUser(
    user: any,
    requestedStoreId?: unknown,
  ): Promise<CapabilitySnapshot> {
    const userId = positiveInteger(user?.sub);
    if (!userId) throw new ForbiddenException('Authenticated user context is invalid.');

    const caller = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        brand_id: true,
        store_id: true,
        role: { select: { name: true } },
      },
    });
    if (!caller) throw new ForbiddenException('Authenticated user was not found.');

    const roleName = caller.role?.name ?? user?.role;
    const isSuperAdmin = roleName === 'Super Admin';
    const activeStoreId = positiveInteger(user?.active_store_id ?? caller.store_id);
    const requested = positiveInteger(requestedStoreId) ?? activeStoreId;
    if (!requested) {
      throw new ForbiddenException('An active store is required to resolve capabilities.');
    }

    if (!isSuperAdmin && (!activeStoreId || requested !== activeStoreId)) {
      throw new ForbiddenException('The requested store is outside the active workspace.');
    }

    const activeBrandId = positiveInteger(user?.active_brand_id ?? caller.brand_id);
    const store = await this.prisma.store.findUnique({
      where: { id: requested },
      include: {
        brand: { select: { id: true, name: true } },
        saas_package: { include: { modules: true } },
      },
    });
    if (!store) throw new ForbiddenException('The requested store was not found.');

    if (!isSuperAdmin && (!activeBrandId || store.brand_id !== activeBrandId)) {
      throw new ForbiddenException('The requested store is outside the active brand.');
    }

    return this.buildSnapshot(store);
  }

  /** Store-scoped resolver for future backend module guards. */
  async resolveForStore(storeId: number): Promise<CapabilitySnapshot> {
    const normalizedStoreId = positiveInteger(storeId);
    if (!normalizedStoreId) throw new BadRequestException('A valid store is required.');

    const store = await this.prisma.store.findUnique({
      where: { id: normalizedStoreId },
      include: {
        brand: { select: { id: true, name: true } },
        saas_package: { include: { modules: true } },
      },
    });
    if (!store) throw new BadRequestException('Store not found.');
    return this.buildSnapshot(store);
  }

  async hasModule(storeId: number, moduleKey: unknown): Promise<boolean> {
    const normalizedKey = normalizeModuleKey(moduleKey);
    if (!normalizedKey) return false;
    const snapshot = await this.resolveForStore(storeId);
    return this.isCapabilityEnabled(snapshot, normalizedKey);
  }

  /**
   * Uses the same derived capability contract exposed to the frontend. This
   * keeps guards from re-implementing special cases such as KOT_PRINT being
   * included by BASE_POS.
   */
  isCapabilityEnabled(snapshot: CapabilitySnapshot, moduleKey: ModuleKey): boolean {
    switch (moduleKey) {
      case 'BASE_POS':
        return snapshot.capabilities.pos;
      case 'KOT_PRINT':
        return snapshot.capabilities.kotPrint;
      case 'ACCOUNTING':
        return snapshot.capabilities.accounting;
      case 'KDS':
        return snapshot.capabilities.kds;
      case 'MARKETING':
        return snapshot.capabilities.marketing;
      case 'ONLINE_WEBSITE':
        return snapshot.capabilities.website;
      case 'CMS':
        return snapshot.capabilities.cms;
      case 'CRM':
        return snapshot.capabilities.crm;
      case 'LOYALTY':
        return snapshot.capabilities.loyalty;
      case 'RIDER':
        return snapshot.capabilities.rider;
      case 'TV_BOARD':
        return snapshot.capabilities.tvBoard;
      case 'INVENTORY':
        return snapshot.capabilities.inventory;
      case 'RECIPES':
        return snapshot.capabilities.recipes;
      case 'VENDORS':
        return snapshot.capabilities.vendors;
      case 'ANALYTICS':
        return snapshot.capabilities.analytics;
      case 'HR_PAYROLL':
        return snapshot.capabilities.hrPayroll;
      default:
        return false;
    }
  }

  private async buildSnapshot(store: any): Promise<CapabilitySnapshot> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { brand_id: store.brand_id },
      include: { package: { include: { modules: true } } },
    });
    const assignedPackage = store.saas_package;
    const now = Date.now();
    const expiresAt = subscription?.expiry_date ? new Date(subscription.expiry_date) : null;
    const subscriptionActive = subscription?.status === 'ACTIVE'
      && !!expiresAt
      && expiresAt.getTime() >= now;
    const packageActive = assignedPackage?.status === 'ACTIVE';
    const packageMatchesSubscription = !!assignedPackage
      && !!subscription
      && assignedPackage.id === subscription.package_id;
    const entitlementEnabled = subscriptionActive && packageActive && packageMatchesSubscription;

    const installed = new Set<ModuleKey>();
    for (const module of assignedPackage?.modules ?? []) {
      const normalized = normalizeModuleKey(module.module_key);
      if (normalized) installed.add(normalized);
    }

    const missingDependencies: Partial<Record<ModuleKey, ModuleKey[]>> = {};
    for (const module of installed) {
      const missing = getMissingDependencies(module, installed);
      if (missing.length) missingDependencies[module] = missing;
    }

    const has = (key: ModuleKey) => entitlementEnabled
      && installed.has(key)
      && !(missingDependencies[key]?.length);
    const pos = has('BASE_POS');
    const kds = has('KDS') && pos;
    const kotPrint = pos || has('KOT_PRINT');
    const accounting = pos || has('ACCOUNTING');

    let reason: string | null = null;
    if (!assignedPackage) reason = 'PACKAGE_NOT_ASSIGNED';
    else if (!subscription) reason = 'SUBSCRIPTION_NOT_FOUND';
    else if (!subscriptionActive) reason = subscription.status === 'ACTIVE' ? 'SUBSCRIPTION_EXPIRED' : `SUBSCRIPTION_${subscription.status}`;
    else if (!packageActive) reason = 'PACKAGE_INACTIVE';
    else if (!packageMatchesSubscription) reason = 'PACKAGE_SUBSCRIPTION_MISMATCH';
    else if (Object.keys(missingDependencies).length) reason = 'MODULE_DEPENDENCY_MISSING';

    return {
      tenant: {
        brandId: store.brand_id,
        storeId: store.id,
        brandName: store.brand?.name ?? null,
        storeName: store.name ?? null,
      },
      subscription: {
        status: subscription?.status ?? null,
        packageId: assignedPackage?.id ?? subscription?.package_id ?? null,
        packageCode: assignedPackage?.code ?? subscription?.package?.code ?? null,
        expiresAt: expiresAt?.toISOString() ?? null,
      },
      modules: entitlementEnabled ? Array.from(installed) : [],
      capabilities: {
        pos,
        kotPrint: entitlementEnabled && kotPrint,
        businessDay: entitlementEnabled && accounting,
        dailyReports: entitlementEnabled && accounting,
        accounting: entitlementEnabled && accounting,
        kds,
        marketing: has('MARKETING'),
        website: has('ONLINE_WEBSITE'),
        cms: has('CMS'),
        crm: has('CRM'),
        loyalty: has('LOYALTY'),
        rider: has('RIDER'),
        tvBoard: has('TV_BOARD'),
        inventory: has('INVENTORY'),
        recipes: has('RECIPES'),
        vendors: has('VENDORS'),
        analytics: has('ANALYTICS'),
        hrPayroll: has('HR_PAYROLL'),
      },
      entitlement: {
        enabled: entitlementEnabled,
        reason,
        missingDependencies,
      },
    };
  }
}
