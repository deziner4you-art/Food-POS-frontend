import { describe, it, expect } from 'vitest';
import {
  isDeliveryEligible,
  isDeliveryActiveStatus,
  filterEligibleDeliveries,
  ACTIVE_DELIVERY_STATUSES,
} from './deliveryEligibility';

describe('POS Active Delivery Business-Day Fail-Closed Gate (deliveryEligibility)', () => {
  const STORE_ID = 1;
  const CURRENT_BD_ID = 10;

  describe('1. Active Delivery Statuses Allowlist', () => {
    it('accepts all active post-KDS lifecycle statuses', () => {
      ACTIVE_DELIVERY_STATUSES.forEach(status => {
        expect(isDeliveryActiveStatus(status)).toBe(true);
      });
    });

    it('rejects pre-READY statuses (defense-in-depth against pre-kitchen entry)', () => {
      expect(isDeliveryActiveStatus('PENDING')).toBe(false);
      expect(isDeliveryActiveStatus('CONFIRMED')).toBe(false);
      expect(isDeliveryActiveStatus('KITCHEN_PREPARING')).toBe(false);
      expect(isDeliveryActiveStatus('PREPARING')).toBe(false);
      expect(isDeliveryActiveStatus('NEW')).toBe(false);
    });

    it('rejects terminal and voided statuses', () => {
      expect(isDeliveryActiveStatus('SETTLED')).toBe(false);
      expect(isDeliveryActiveStatus('CANCELLED')).toBe(false);
      expect(isDeliveryActiveStatus('VOIDED')).toBe(false);
      expect(isDeliveryActiveStatus('COMPLETED')).toBe(false);
      expect(isDeliveryActiveStatus(null)).toBe(false);
      expect(isDeliveryActiveStatus(undefined)).toBe(false);
      expect(isDeliveryActiveStatus('')).toBe(false);
    });
  });

  describe('2. Fail-Closed Delivery Gate: Store and Business-Day Isolation', () => {
    it('current store + current business day delivery with READY status is visible/eligible', () => {
      const del = {
        id: 101,
        store_id: STORE_ID,
        businessDayId: CURRENT_BD_ID,
        status: 'READY',
      };
      expect(isDeliveryEligible(del, STORE_ID, CURRENT_BD_ID)).toBe(true);
    });

    it('downstream active statuses (DISPATCHED, OUT_FOR_DELIVERY, WAITING_CASH_SETTLEMENT) are visible/eligible', () => {
      ['RIDER_ARRIVED', 'PRINT_BILL', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'WAITING_CASH_SETTLEMENT'].forEach(status => {
        const del = {
          id: 102,
          store_id: STORE_ID,
          businessDayId: CURRENT_BD_ID,
          status,
        };
        expect(isDeliveryEligible(del, STORE_ID, CURRENT_BD_ID)).toBe(true);
      });
    });

    it('old business day delivery is strictly hidden/rejected', () => {
      const yesterdayDel = {
        id: 103,
        store_id: STORE_ID,
        businessDayId: 9, // Old business day
        status: 'READY',
      };
      expect(isDeliveryEligible(yesterdayDel, STORE_ID, CURRENT_BD_ID)).toBe(false);

      const pastDelOutForDelivery = {
        id: 104,
        store_id: STORE_ID,
        businessDayId: 8,
        status: 'OUT_FOR_DELIVERY',
      };
      expect(isDeliveryEligible(pastDelOutForDelivery, STORE_ID, CURRENT_BD_ID)).toBe(false);
    });

    it('missing/null/undefined active business day rejects all deliveries', () => {
      const validDel = {
        id: 105,
        store_id: STORE_ID,
        businessDayId: CURRENT_BD_ID,
        status: 'READY',
      };

      expect(isDeliveryEligible(validDel, STORE_ID, null)).toBe(false);
      expect(isDeliveryEligible(validDel, STORE_ID, undefined)).toBe(false);
      expect(isDeliveryEligible(validDel, STORE_ID, 0)).toBe(false);
      expect(isDeliveryEligible(validDel, STORE_ID, NaN)).toBe(false);
      expect(isDeliveryEligible(validDel, STORE_ID, -1)).toBe(false);
    });

    it('missing/null/undefined current store rejects all deliveries', () => {
      const validDel = {
        id: 106,
        store_id: STORE_ID,
        businessDayId: CURRENT_BD_ID,
        status: 'READY',
      };

      expect(isDeliveryEligible(validDel, null, CURRENT_BD_ID)).toBe(false);
      expect(isDeliveryEligible(validDel, undefined, CURRENT_BD_ID)).toBe(false);
      expect(isDeliveryEligible(validDel, 0, CURRENT_BD_ID)).toBe(false);
    });

    it('foreign store delivery is strictly hidden/rejected', () => {
      const foreignDel = {
        id: 107,
        store_id: 2, // Different branch
        businessDayId: CURRENT_BD_ID,
        status: 'READY',
      };
      expect(isDeliveryEligible(foreignDel, STORE_ID, CURRENT_BD_ID)).toBe(false);
    });

    it('delivery card lacking businessDayId is rejected (fail-closed against untagged cards)', () => {
      const untaggedDel = {
        id: 108,
        store_id: STORE_ID,
        status: 'READY',
      };
      expect(isDeliveryEligible(untaggedDel, STORE_ID, CURRENT_BD_ID)).toBe(false);

      const nullBdDel = {
        id: 109,
        store_id: STORE_ID,
        businessDayId: null,
        status: 'READY',
      };
      expect(isDeliveryEligible(nullBdDel, STORE_ID, CURRENT_BD_ID)).toBe(false);
    });

    it('delivery card lacking store_id is rejected', () => {
      const noStoreDel = {
        id: 110,
        businessDayId: CURRENT_BD_ID,
        status: 'READY',
      };
      expect(isDeliveryEligible(noStoreDel, STORE_ID, CURRENT_BD_ID)).toBe(false);
    });

    it('pre-READY delivery is rejected even with matching store and business day', () => {
      const preReady = {
        id: 111,
        store_id: STORE_ID,
        businessDayId: CURRENT_BD_ID,
        status: 'PREPARING',
      };
      expect(isDeliveryEligible(preReady, STORE_ID, CURRENT_BD_ID)).toBe(false);
    });

    it('terminal/settled delivery is rejected even with matching store and business day', () => {
      const settled = {
        id: 112,
        store_id: STORE_ID,
        businessDayId: CURRENT_BD_ID,
        status: 'SETTLED',
      };
      expect(isDeliveryEligible(settled, STORE_ID, CURRENT_BD_ID)).toBe(false);
    });
  });

  describe('3. filterEligibleDeliveries Collection Filtering', () => {
    it('returns empty array when activeBusinessDayId is null or invalid', () => {
      const list = [
        { id: 1, store_id: 1, businessDayId: 10, status: 'READY' },
        { id: 2, store_id: 1, businessDayId: 10, status: 'OUT_FOR_DELIVERY' },
      ];
      expect(filterEligibleDeliveries(list, 1, null)).toEqual([]);
      expect(filterEligibleDeliveries(list, 1, undefined)).toEqual([]);
      expect(filterEligibleDeliveries(list, 1, 0)).toEqual([]);
    });

    it('filters out old business day, foreign store, and pre-READY cards while preserving valid active cards', () => {
      const list = [
        { id: 1, store_id: 1, businessDayId: 10, status: 'READY' },               // VALID
        { id: 2, store_id: 1, businessDayId: 9,  status: 'READY' },               // OLD BD
        { id: 3, store_id: 2, businessDayId: 10, status: 'READY' },               // WRONG STORE
        { id: 4, store_id: 1, businessDayId: 10, status: 'PREPARING' },           // PRE-READY
        { id: 5, store_id: 1, businessDayId: 10, status: 'OUT_FOR_DELIVERY' },   // VALID
        { id: 6, store_id: 1, businessDayId: 10, status: 'SETTLED' },            // TERMINAL
      ];

      const result = filterEligibleDeliveries(list, 1, 10);
      expect(result).toHaveLength(2);
      expect(result.map(d => d.id)).toEqual([1, 5]);
    });
  });
});
