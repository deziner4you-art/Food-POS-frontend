/**
 * deliveryEligibility.ts
 *
 * Authoritative fail-closed eligibility gate for POS Active Deliveries.
 * Ensures active deliveries are strictly isolated by store and verified business day,
 * and satisfy active delivery lifecycle progression rules.
 */
import { isValidPosIntegerId } from '../db';

export interface DeliveryCardIdentity {
  store_id?: number | null;
  storeId?: number | null;
  businessDayId?: number | null;
  business_day_id?: number | null;
  status?: string | null;
  [key: string]: any;
}

export const ACTIVE_DELIVERY_STATUSES = [
  'READY',
  'RIDER_ARRIVED',
  'PRINT_BILL',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'WAITING_CASH_SETTLEMENT',
] as const;

/**
 * Checks whether a status string is an active delivery state.
 * Rejects pre-kitchen (PENDING, CONFIRMED, PREPARING) and terminal (SETTLED, CANCELLED, VOIDED).
 */
export function isDeliveryActiveStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  return (ACTIVE_DELIVERY_STATUSES as readonly string[]).includes(status);
}

/**
 * Fail-closed delivery eligibility gate.
 * Returns true ONLY when:
 * 1. Current store context is valid and non-zero.
 * 2. Active business day context is valid, non-zero, and verified (not null / undefined).
 * 3. Delivery card carries a valid positive integer store_id matching currentStoreId.
 * 4. Delivery card carries a valid positive integer businessDayId matching activeBusinessDayId.
 * 5. Delivery status is in the active lifecycle allowlist (READY through WAITING_CASH_SETTLEMENT).
 */
export function isDeliveryEligible(
  del: DeliveryCardIdentity | null | undefined,
  currentStoreId: number | null | undefined,
  activeBusinessDayId: number | null | undefined,
): boolean {
  if (!del) return false;

  // RULE 1: Context store must be a valid positive integer
  if (!isValidPosIntegerId(currentStoreId)) return false;

  // RULE 2: Context business day must be a valid positive integer (verified, not null)
  if (!isValidPosIntegerId(activeBusinessDayId)) return false;

  // RULE 3: Delivery card must carry valid store_id
  const delStoreId = del.store_id ?? del.storeId;
  if (!isValidPosIntegerId(delStoreId)) return false;

  // RULE 4: Delivery card must carry valid businessDayId
  const delBdId = del.businessDayId ?? del.business_day_id;
  if (!isValidPosIntegerId(delBdId)) return false;

  // RULE 5: Store match
  if (delStoreId !== currentStoreId) return false;

  // RULE 6: Business day match
  if (delBdId !== activeBusinessDayId) return false;

  // RULE 7: Status must be active (READY and beyond, non-terminal)
  if (!isDeliveryActiveStatus(del.status)) return false;

  return true;
}

/**
 * Filter a list of deliveries, returning only those passing the authoritative gate.
 * Always returns an empty array if currentStoreId or activeBusinessDayId is missing/invalid.
 */
export function filterEligibleDeliveries(
  deliveries: any[] | null | undefined,
  currentStoreId: number | null | undefined,
  activeBusinessDayId: number | null | undefined,
): any[] {
  if (!deliveries || !Array.isArray(deliveries)) return [];
  if (!isValidPosIntegerId(currentStoreId) || !isValidPosIntegerId(activeBusinessDayId)) {
    return [];
  }
  return deliveries.filter(d => isDeliveryEligible(d, currentStoreId, activeBusinessDayId));
}

export interface KdsDeliveryUpdateEvent {
  order_id?: number | null;
  status?: string | null;
  store_id?: number | null;
  business_day_id?: number | null;
}

export interface KdsDeliveryUpdateResult {
  deliveries: DeliveryCardIdentity[];
  becameReadyDeliveryId: number | null;
}

/**
 * Applies a KDS socket update to the current delivery collection.
 *
 * This is deliberately fail-closed: a socket event without a verified store,
 * business day, or positive order identity cannot mutate delivery state. A
 * PREPARING event removes an existing card instead of keeping a pre-READY
 * delivery in memory; the card can be reintroduced by the authoritative READY
 * path once the KOT actually reaches READY.
 */
export function applyKdsDeliveryUpdate(
  deliveries: DeliveryCardIdentity[] | null | undefined,
  event: KdsDeliveryUpdateEvent | null | undefined,
  currentStoreId: number | null | undefined,
  activeBusinessDayId: number | null | undefined,
): KdsDeliveryUpdateResult {
  const current = Array.isArray(deliveries) ? deliveries : [];

  if (!event || !isValidPosIntegerId(currentStoreId) || !isValidPosIntegerId(activeBusinessDayId)) {
    return { deliveries: current, becameReadyDeliveryId: null };
  }

  if (!isValidPosIntegerId(event.store_id) || event.store_id !== currentStoreId) {
    return { deliveries: current, becameReadyDeliveryId: null };
  }

  if (!isValidPosIntegerId(event.business_day_id) || event.business_day_id !== activeBusinessDayId) {
    return { deliveries: current, becameReadyDeliveryId: null };
  }

  if (!isValidPosIntegerId(event.order_id) || (event.status !== 'READY' && event.status !== 'PREPARING')) {
    return { deliveries: current, becameReadyDeliveryId: null };
  }

  const index = current.findIndex(d => d.bridgeOrderId === event.order_id || d.id === event.order_id);
  if (index < 0) {
    // Socket updates never create delivery cards. The authoritative READY/KOT
    // path owns insertion and supplies the complete identity-bearing record.
    return { deliveries: current, becameReadyDeliveryId: null };
  }

  const existing = current[index];

  if (event.status === 'PREPARING') {
    // PREPARING is not an active delivery state. Remove any stale card rather
    // than allowing a pre-READY delivery to remain in the collection.
    const identityCandidate = { ...existing, status: 'READY' };
    if (!isDeliveryEligible(identityCandidate, currentStoreId, activeBusinessDayId)) {
      return { deliveries: current, becameReadyDeliveryId: null };
    }
    return {
      deliveries: current.filter((_, itemIndex) => itemIndex !== index),
      becameReadyDeliveryId: null,
    };
  }

  const updated = {
    ...existing,
    status: 'READY',
    rider: existing.claimedByRiderName ? `Rider: ${existing.claimedByRiderName}` : 'Waiting for Rider',
  };

  if (!isDeliveryEligible(updated, currentStoreId, activeBusinessDayId)) {
    return { deliveries: current, becameReadyDeliveryId: null };
  }

  return {
    deliveries: current.map((delivery, itemIndex) => itemIndex === index ? updated : delivery),
    becameReadyDeliveryId: existing.status === 'READY' ? null : (updated.id ?? updated.bridgeOrderId ?? null),
  };
}
