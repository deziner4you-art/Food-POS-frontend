import { describe, expect, it } from 'vitest';
import { getCanonicalDeliveryIdentity, getDeliveryEntityType, getDeliveryIdentityKey } from './deliveryIdentity';

describe('canonical delivery identity', () => {
  it('keeps ONLINE:28 and POS:28 distinct', () => {
    expect(getDeliveryIdentityKey({ entityType: 'ONLINE', entityId: 28 })).toBe('ONLINE:28');
    expect(getDeliveryIdentityKey({ entityType: 'POS', entityId: 28 })).toBe('POS:28');
  });

  it('rejects numeric-only identity instead of inferring a namespace', () => {
    expect(getDeliveryEntityType({ id: 28 })).toBeUndefined();
    expect(getDeliveryIdentityKey({ id: 28 })).toBeNull();
    expect(getCanonicalDeliveryIdentity({ id: 28 })).toBeNull();
  });

  it('rejects legacy namespace and identifier fallbacks', () => {
    expect(getCanonicalDeliveryIdentity({ isPos: true, entityId: 28 })).toBeNull();
    expect(getCanonicalDeliveryIdentity({ entityType: 'ONLINE', id: 28 })).toBeNull();
    expect(getCanonicalDeliveryIdentity({ entityType: 'POS', bridgeOrderId: 28 })).toBeNull();
  });

  it('rejects invalid canonical ids', () => {
    expect(getDeliveryIdentityKey({ entityType: 'POS', entityId: 0 })).toBeNull();
    expect(getDeliveryIdentityKey({ entityType: 'ONLINE', entityId: 'not-a-number' })).toBeNull();
  });
});
