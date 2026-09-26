/**
 * riderForceRelease.ts
 *
 * Helpers for Admin / Manager Force-Release of stuck rider assignments.
 * Enforces business rules in the POS Client UI:
 * - Eligible only for non-terminal delivery states with an assigned rider.
 * - Order is never deleted, cancelled, or voided.
 * - State reverts to READY with rider assignment cleared.
 */

export const TERMINAL_DELIVERY_STATUSES = [
  'DELIVERED',
  'WAITING_CASH_SETTLEMENT',
  'SETTLED',
  'CANCELLED',
  'VOIDED',
  'COMPLETED',
] as const;

export const RELEASABLE_DELIVERY_STATUSES = [
  'READY',
  'RIDER_ACCEPTED',
  'RIDER_ARRIVED',
  'PRINT_BILL',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
] as const;

/**
 * Checks whether an order in the POS delivery list is eligible for admin force-release.
 */
export function canForceReleaseRider(order: any): boolean {
  if (!order) return false;

  // Terminal states can NEVER be force-released
  if (TERMINAL_DELIVERY_STATUSES.includes(order.status)) {
    return false;
  }

  // Must have an assigned rider
  const hasAssignedRider = Boolean(
    order.claimedByRiderId ||
    order.rider_id ||
    (order.rider && !['Waiting for Rider', 'Rider Not Available', 'Rider Not Assigned', 'Chef Preparing'].includes(order.rider))
  );

  return hasAssignedRider;
}

/**
 * Returns user-facing confirmation details for the force-release modal.
 */
export function getForceReleaseConfirmationDetails(order: any) {
  if (!order) {
    return {
      orderId: 'Unknown',
      riderName: 'None',
      willDeleteOrCancel: false,
      note: 'The order will NOT be deleted or cancelled. It will return to READY status so another rider can accept it.',
    };
  }

  const orderId = order.id || order.bridgeOrderId || 'Unknown';
  const riderName =
    order.claimedByRiderName ||
    (order.claimedByRiderId ? `Rider #${order.claimedByRiderId}` : (order.rider || 'Assigned Rider'));

  return {
    orderId,
    riderName,
    willDeleteOrCancel: false,
    note: 'The order will NOT be deleted or cancelled. It will return to READY status so another rider can accept it.',
  };
}

/**
 * Applies the force-release update to a list of active deliveries.
 */
export function applyForceReleaseSuccess(deliveries: any[], targetOrderId: number | string): any[] {
  if (!Array.isArray(deliveries)) return [];

  return deliveries.map(d => {
    if (d.bridgeOrderId === targetOrderId || d.id === targetOrderId) {
      return {
        ...d,
        status: 'READY',
        claimedByRiderId: null,
        claimedByRiderName: null,
        rider_id: null,
        rider: 'Waiting for Rider',
      };
    }
    return d;
  });
}

/**
 * Formats an API error or exception into a clear, user-facing error message.
 */
export function formatForceReleaseErrorMessage(error: any, orderId: number | string): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return `Failed to release rider assignment for Order #${orderId}.`;
}
