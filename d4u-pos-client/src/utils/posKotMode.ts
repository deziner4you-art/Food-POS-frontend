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
