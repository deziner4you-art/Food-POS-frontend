import { describe, expect, it } from 'vitest';
import {
  allowedPosKotModes,
  normalizePosKotMode,
  subscriptionHasKdsModule,
} from './posKotMode';

describe('POS KOT/KDS package mode boundary', () => {
  it('allows only POS KOT mode for an active POS-only subscription', () => {
    expect(subscriptionHasKdsModule({
      status: 'ACTIVE',
      package: { modules: [{ module_key: 'BASE_POS' }] },
    })).toBe(false);
    expect(allowedPosKotModes(false)).toEqual(['PRINT']);
    expect(normalizePosKotMode('SCREEN', false)).toBe('PRINT');
  });

  it('shows both modes only for an active package containing KDS', () => {
    const subscription = {
      status: 'ACTIVE',
      package: { modules: [{ module_key: 'BASE_POS' }, { module_key: 'KDS' }] },
    };
    expect(subscriptionHasKdsModule(subscription)).toBe(true);
    expect(allowedPosKotModes(true)).toEqual(['PRINT', 'SCREEN']);
    expect(normalizePosKotMode('SCREEN', true)).toBe('SCREEN');
  });

  it('fails closed for missing, expired, malformed, or differently named subscriptions', () => {
    expect(subscriptionHasKdsModule(null)).toBe(false);
    expect(subscriptionHasKdsModule({ status: 'SUSPENDED', package: { modules: [{ module_key: 'KDS' }] } })).toBe(false);
    expect(subscriptionHasKdsModule({ status: 'ACTIVE', package: null })).toBe(false);
    expect(subscriptionHasKdsModule({ status: 'ACTIVE', package: { modules: [{ module_key: 'KDS_SCREEN' }] } })).toBe(false);
  });
});
