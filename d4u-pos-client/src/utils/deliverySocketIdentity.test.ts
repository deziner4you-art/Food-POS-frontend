import { describe, expect, it } from 'vitest';
import { applyKdsDeliveryUpdate } from './deliveryEligibility';

describe('delivery socket canonical identity (applyKdsDeliveryUpdate)', () => {
  const deliveries = [
    { id: 28, entityType: 'ONLINE', entityId: 28, store_id: 1, businessDayId: 9, status: 'PREPARING' },
    { id: 28, entityType: 'POS', entityId: 28, store_id: 1, businessDayId: 9, status: 'PREPARING' },
  ];

  // A. ONLINE:28 event updates only ONLINE:28
  it('A: ONLINE:28 event updates only ONLINE:28', () => {
    const result = applyKdsDeliveryUpdate(deliveries, {
      order_id: 28,
      entityType: 'ONLINE',
      entityId: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    }, 1, 9);

    expect(result.deliveries.find(d => d.entityType === 'ONLINE')?.status).toBe('READY');
    expect(result.deliveries.find(d => d.entityType === 'POS')?.status).toBe('PREPARING');
  });

  // B. POS:28 event updates only POS:28
  it('B: POS:28 event updates only POS:28', () => {
    const result = applyKdsDeliveryUpdate(deliveries, {
      order_id: 28,
      entityType: 'POS',
      entityId: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    }, 1, 9);

    expect(result.deliveries.find(d => d.entityType === 'POS')?.status).toBe('READY');
    expect(result.deliveries.find(d => d.entityType === 'ONLINE')?.status).toBe('PREPARING');
  });

  // C. Numeric-only event is ignored even when only ONLINE:28 is in memory
  it('C: Numeric-only event is ignored even when only ONLINE:28 is in memory', () => {
    const onlineOnly = [
      { id: 28, entityType: 'ONLINE', entityId: 28, store_id: 1, businessDayId: 9, status: 'PREPARING' },
    ];
    const result = applyKdsDeliveryUpdate(onlineOnly, {
      order_id: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    }, 1, 9);

    expect(result.deliveries[0].status).toBe('PREPARING');
    expect(result.becameReadyDeliveryId).toBeNull();
  });

  // D. Numeric-only event is ignored even when only POS:28 is in memory
  it('D: Numeric-only event is ignored even when only POS:28 is in memory', () => {
    const posOnly = [
      { id: 28, entityType: 'POS', entityId: 28, store_id: 1, businessDayId: 9, status: 'PREPARING' },
    ];
    const result = applyKdsDeliveryUpdate(posOnly, {
      order_id: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    }, 1, 9);

    expect(result.deliveries[0].status).toBe('PREPARING');
    expect(result.becameReadyDeliveryId).toBeNull();
  });

  // E. Missing entityType is ignored
  it('E: Missing entityType is ignored', () => {
    const result = applyKdsDeliveryUpdate(deliveries, {
      order_id: 28,
      entityId: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    }, 1, 9);

    expect(result.deliveries).toEqual(deliveries);
    expect(result.becameReadyDeliveryId).toBeNull();
  });

  // F. Missing entityId is ignored
  it('F: Missing entityId is ignored', () => {
    const result = applyKdsDeliveryUpdate(deliveries, {
      entityType: 'ONLINE',
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    } as any, 1, 9);

    expect(result.deliveries).toEqual(deliveries);
    expect(result.becameReadyDeliveryId).toBeNull();
  });

  it('rejects legacy id fields even when entityType is present', () => {
    const legacyId = applyKdsDeliveryUpdate(deliveries, {
      order_id: 28,
      entityType: 'ONLINE',
      id: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    } as any, 1, 9);
    const legacyBridgeId = applyKdsDeliveryUpdate(deliveries, {
      order_id: 28,
      entityType: 'ONLINE',
      bridgeOrderId: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    } as any, 1, 9);

    expect(legacyId.deliveries).toEqual(deliveries);
    expect(legacyBridgeId.deliveries).toEqual(deliveries);
  });

  it('does not match an identity-less delivery card to a canonical event', () => {
    const identityLess = [
      { id: 28, store_id: 1, businessDayId: 9, status: 'PREPARING' },
    ];
    const result = applyKdsDeliveryUpdate(identityLess, {
      order_id: 28,
      entityType: 'ONLINE',
      entityId: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    }, 1, 9);

    expect(result.deliveries).toEqual(identityLess);
    expect(result.becameReadyDeliveryId).toBeNull();
  });

  // G. Wrong entityType cannot update the other namespace
  it('G: Wrong entityType cannot update the other namespace', () => {
    const posOnly = [
      { id: 28, entityType: 'POS', entityId: 28, store_id: 1, businessDayId: 9, status: 'PREPARING' },
    ];
    const result = applyKdsDeliveryUpdate(posOnly, {
      order_id: 28,
      entityType: 'ONLINE',
      entityId: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 9,
    }, 1, 9);

    expect(result.deliveries[0].status).toBe('PREPARING');
    expect(result.becameReadyDeliveryId).toBeNull();
  });

  // H. Wrong store/business-day events remain ignored
  it('H: Wrong store/business-day events remain ignored', () => {
    // Wrong store
    const resultWrongStore = applyKdsDeliveryUpdate(deliveries, {
      order_id: 28,
      entityType: 'ONLINE',
      entityId: 28,
      status: 'READY',
      store_id: 999, // Mismatched store
      business_day_id: 9,
    }, 1, 9);
    expect(resultWrongStore.deliveries).toEqual(deliveries);

    // Wrong business day
    const resultWrongDay = applyKdsDeliveryUpdate(deliveries, {
      order_id: 28,
      entityType: 'ONLINE',
      entityId: 28,
      status: 'READY',
      store_id: 1,
      business_day_id: 999, // Mismatched business day
    }, 1, 9);
    expect(resultWrongDay.deliveries).toEqual(deliveries);
  });
});
