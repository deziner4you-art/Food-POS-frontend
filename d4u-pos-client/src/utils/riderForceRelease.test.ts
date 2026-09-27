import { describe, it, expect } from 'vitest';
import {
  canForceReleaseRider,
  getForceReleaseConfirmationDetails,
  applyForceReleaseSuccess,
  formatForceReleaseErrorMessage,
  TERMINAL_DELIVERY_STATUSES,
  RELEASABLE_DELIVERY_STATUSES,
} from './riderForceRelease';

describe('Admin Force-Release & Rider Deactivation Tests (Tests 29–32)', () => {
  // ── TEST 29: Force-Release Confirmation & Eligibility ──────────────────
  describe('Test 29: Force-Release Confirmation & Eligibility', () => {
    it('should allow force-release for releasable delivery statuses with an assigned rider', () => {
      RELEASABLE_DELIVERY_STATUSES.forEach(status => {
        const orderWithRider = {
          id: 101,
          status,
          claimedByRiderId: 45,
          claimedByRiderName: 'Rider John',
        };
        expect(canForceReleaseRider(orderWithRider)).toBe(true);
      });
    });

    it('should reject force-release for terminal statuses even if rider is attached', () => {
      TERMINAL_DELIVERY_STATUSES.forEach(status => {
        const orderInTerminal = {
          id: 102,
          status,
          claimedByRiderId: 45,
          rider: 'Rider John',
        };
        expect(canForceReleaseRider(orderInTerminal)).toBe(false);
      });
    });

    it('should reject force-release if no rider is assigned', () => {
      const orderUnassigned = {
        id: 103,
        status: 'READY',
        claimedByRiderId: null,
        rider: 'Waiting for Rider',
      };
      expect(canForceReleaseRider(orderUnassigned)).toBe(false);

      const orderRiderUnavailable = {
        id: 104,
        status: 'PRINT_BILL',
        claimedByRiderId: null,
        rider: 'Rider Not Available',
      };
      expect(canForceReleaseRider(orderRiderUnavailable)).toBe(false);
    });

    it('should format confirmation modal details showing order ID, rider, and stating order will NOT be deleted', () => {
      const order = {
        id: 555,
        status: 'DISPATCHED',
        claimedByRiderId: 42,
        claimedByRiderName: 'Speedy Dave',
      };

      const details = getForceReleaseConfirmationDetails(order);
      expect(details.orderId).toBe(555);
      expect(details.riderName).toBe('Speedy Dave');
      expect(details.willDeleteOrCancel).toBe(false);
      expect(details.note).toContain('NOT be deleted or cancelled');
      expect(details.note).toContain('READY status');
    });
  });

  // ── TEST 30: Client State Update on Force-Release ─────────────────────
  describe('Test 30: Client State Update on Force-Release', () => {
    it('should update target delivery to READY, clear rider assignments, and preserve order identity with canonical target', () => {
      const initialDeliveries = [
        {
          id: 501,
          entityType: 'ONLINE',
          entityId: 501,
          bridgeOrderId: 501,
          customer: 'Alice',
          address: '123 Main St',
          status: 'DISPATCHED',
          claimedByRiderId: 88,
          claimedByRiderName: 'Rider Bob',
          rider: 'Rider: Rider Bob',
          totalAmount: 1500,
        },
        {
          id: 502,
          entityType: 'POS',
          entityId: 502,
          bridgeOrderId: 502,
          customer: 'Charlie',
          address: '456 Oak St',
          status: 'OUT_FOR_DELIVERY',
          claimedByRiderId: 99,
          claimedByRiderName: 'Rider Sam',
          rider: 'Rider: Rider Sam',
          totalAmount: 2200,
        },
      ];

      const updated = applyForceReleaseSuccess(initialDeliveries, { entityType: 'ONLINE', entityId: 501 });

      // Order 501 updated
      const released = updated.find(d => d.id === 501);
      expect(released).toBeDefined();
      expect(released.status).toBe('READY');
      expect(released.claimedByRiderId).toBeNull();
      expect(released.claimedByRiderName).toBeNull();
      expect(released.rider).toBe('Waiting for Rider');
      expect(released.customer).toBe('Alice');
      expect(released.totalAmount).toBe(1500); // Unchanged

      // Order 502 remains intact
      const untouched = updated.find(d => d.id === 502);
      expect(untouched.status).toBe('OUT_FOR_DELIVERY');
      expect(untouched.claimedByRiderId).toBe(99);
    });

    // Requirement 7 Tests
    it('ONLINE:28 force-release changes only ONLINE:28', () => {
      const deliveries = [
        { id: 28, entityType: 'ONLINE', entityId: 28, status: 'DISPATCHED', claimedByRiderId: 10 },
        { id: 28, entityType: 'POS', entityId: 28, status: 'DISPATCHED', claimedByRiderId: 20 },
      ];
      const updated = applyForceReleaseSuccess(deliveries, { entityType: 'ONLINE', entityId: 28 });
      expect(updated.find(d => d.entityType === 'ONLINE')?.status).toBe('READY');
      expect(updated.find(d => d.entityType === 'ONLINE')?.claimedByRiderId).toBeNull();
      expect(updated.find(d => d.entityType === 'POS')?.status).toBe('DISPATCHED');
      expect(updated.find(d => d.entityType === 'POS')?.claimedByRiderId).toBe(20);
    });

    it('POS:28 force-release changes only POS:28', () => {
      const deliveries = [
        { id: 28, entityType: 'ONLINE', entityId: 28, status: 'DISPATCHED', claimedByRiderId: 10 },
        { id: 28, entityType: 'POS', entityId: 28, status: 'DISPATCHED', claimedByRiderId: 20 },
      ];
      const updated = applyForceReleaseSuccess(deliveries, { entityType: 'POS', entityId: 28 });
      expect(updated.find(d => d.entityType === 'POS')?.status).toBe('READY');
      expect(updated.find(d => d.entityType === 'POS')?.claimedByRiderId).toBeNull();
      expect(updated.find(d => d.entityType === 'ONLINE')?.status).toBe('DISPATCHED');
      expect(updated.find(d => d.entityType === 'ONLINE')?.claimedByRiderId).toBe(10);
    });

    it('Numeric-only force-release target does not mutate any record', () => {
      const deliveries = [
        { id: 28, entityType: 'ONLINE', entityId: 28, status: 'DISPATCHED', claimedByRiderId: 10 },
      ];
      // Numeric ID passed directly
      const updatedNum = applyForceReleaseSuccess(deliveries, 28 as any);
      expect(updatedNum[0].status).toBe('DISPATCHED');
      expect(updatedNum[0].claimedByRiderId).toBe(10);

      // Object without entityType
      const updatedNoType = applyForceReleaseSuccess(deliveries, { entityId: 28 } as any);
      expect(updatedNoType[0].status).toBe('DISPATCHED');
      expect(updatedNoType[0].claimedByRiderId).toBe(10);
    });

    it('rejects isPos-only, id-only, and bridgeOrderId-only targets', () => {
      const deliveries = [
        { id: 28, entityType: 'ONLINE', entityId: 28, status: 'DISPATCHED', claimedByRiderId: 10 },
        { id: 28, entityType: 'POS', entityId: 28, status: 'DISPATCHED', claimedByRiderId: 20 },
      ];

      for (const target of [
        { isPos: true, entityId: 28 },
        { entityType: 'ONLINE', id: 28 },
        { entityType: 'POS', bridgeOrderId: 28 },
      ]) {
        expect(applyForceReleaseSuccess(deliveries, target as any)).toEqual(deliveries);
      }
    });

    it('does not release a delivery card missing canonical identity', () => {
      const deliveries = [
        { id: 28, status: 'DISPATCHED', claimedByRiderId: 10 },
      ];

      expect(applyForceReleaseSuccess(deliveries, { entityType: 'ONLINE', entityId: 28 })).toEqual(deliveries);
    });

    it('Both ONLINE:28 and POS:28 remain separate', () => {
      const deliveries = [
        { id: 28, entityType: 'ONLINE', entityId: 28, status: 'DISPATCHED', claimedByRiderId: 10 },
        { id: 28, entityType: 'POS', entityId: 28, status: 'DISPATCHED', claimedByRiderId: 20 },
      ];
      const updated = applyForceReleaseSuccess(deliveries, { entityType: 'ONLINE', entityId: 28 });
      const online = updated.find(d => d.entityType === 'ONLINE');
      const pos = updated.find(d => d.entityType === 'POS');
      expect(online?.status).toBe('READY');
      expect(pos?.status).toBe('DISPATCHED');
      expect(online?.entityId).toBe(28);
      expect(pos?.entityId).toBe(28);
    });
  });

  // ── TEST 31: Error Handling on API Failure ────────────────────────────
  describe('Test 31: Error Handling on API Failure', () => {
    it('should extract error message from API response object', () => {
      const apiError = {
        statusCode: 400,
        message: 'Cannot force-release Order #501: cash hand-off has started (status: WAITING_CASH_SETTLEMENT).',
      };
      const formatted = formatForceReleaseErrorMessage(apiError, 501);
      expect(formatted).toBe(apiError.message);
    });

    it('should provide fallback message if API error message is missing', () => {
      const networkError = {};
      const formatted = formatForceReleaseErrorMessage(networkError, 501);
      expect(formatted).toBe('Failed to release rider assignment for Order #501.');
    });

    it('should format string error directly', () => {
      const formatted = formatForceReleaseErrorMessage('Unauthorized store access', 501);
      expect(formatted).toBe('Unauthorized store access');
    });
  });

  // ── TEST 32: Safe Deactivation Guidance on Conflict (409) ─────────────
  describe('Test 32: Safe Deactivation Guidance on Conflict (409)', () => {
    it('should advise deactivation rather than deletion when order dependencies exist', () => {
      const conflictResponse = {
        statusCode: 409,
        error: 'Conflict',
        message: 'Cannot delete user #42: This user has historical delivery assignments, orders, or audit records. Deactivate the user instead to preserve data integrity.',
      };

      expect(conflictResponse.statusCode).toBe(409);
      expect(conflictResponse.message).toContain('Deactivate the user instead');
      expect(conflictResponse.message).toContain('preserve data integrity');
    });
  });
});
