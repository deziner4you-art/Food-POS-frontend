export type PosKotMode = 'PRINT' | 'SCREEN';

/**
 * The KOT workflow is part of the base POS product.  The dedicated KDS
 * screen is an add-on, so its option must be hidden until the active
 * subscription has been verified and explicitly contains the KDS module.
 */
export function subscriptionHasKdsModule(subscription: unknown): boolean {
  if (!subscription || typeof subscription !== 'object') return false;

  const candidate = subscription as {
    status?: unknown;
    package?: { modules?: Array<{ module_key?: unknown }> } | null;
  };

  if (String(candidate.status || '').toUpperCase() !== 'ACTIVE') return false;
  return (candidate.package?.modules || []).some(
    module => String(module?.module_key || '').toUpperCase() === 'KDS',
  );
}

/**
 * The live POS settings gate uses the authenticated, store-scoped capability
 * snapshot. A package row by itself is not sufficient to enable KDS.
 */
export function entitlementSnapshotHasKds(snapshot: unknown): boolean {
  if (!snapshot || typeof snapshot !== 'object') return false;
  const candidate = snapshot as {
    entitlement?: { enabled?: unknown } | null;
    capabilities?: { kds?: unknown } | null;
  };
  return candidate.entitlement?.enabled === true && candidate.capabilities?.kds === true;
}

export function allowedPosKotModes(hasVerifiedKdsModule: boolean): PosKotMode[] {
  return hasVerifiedKdsModule ? ['PRINT', 'SCREEN'] : ['PRINT'];
}

export function normalizePosKotMode(
  mode: unknown,
  hasVerifiedKdsModule: boolean,
): PosKotMode {
  if (hasVerifiedKdsModule && mode === 'SCREEN') return 'SCREEN';
  return 'PRINT';
}
