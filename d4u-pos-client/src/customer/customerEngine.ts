import type { CustomerMode } from '../pos/types';

/** GUEST/EXISTING is derived from whether a phone lookup matched a record — no separate mode toggle in the UI. */
export function resolveCustomerMode(liveCustomer: unknown): CustomerMode {
  return liveCustomer ? 'EXISTING' : 'GUEST';
}

export interface DeliveryValidationResult {
  valid: boolean;
  message?: string;
}

/** Single source of truth for delivery-order customer-info validation (previously duplicated at two call sites). */
export function validateDeliveryCustomerInfo(
  orderType: string,
  customerName: string,
  customerAddress: string,
  customerPhone: string,
): DeliveryValidationResult {
  if (orderType !== 'Delivery') return { valid: true };

  if (!customerName.trim() || !customerAddress.trim() || !customerPhone.trim()) {
    return { valid: false, message: 'Please fill Customer Name, Phone, and Address for Delivery' };
  }
  return { valid: true };
}

/**
 * Converts redeemed loyalty points into the equivalent manual-discount
 * percentage, reusing the same discountPercent pipeline the cart already
 * uses — mirrors the exact math from the previous inline "Redeem All"
 * handler. `pointValue` (Rs. per point) must come from the backend-sourced
 * settings, never a hardcoded literal.
 */
export function calculateLoyaltyDiscountPercent(
  points: number,
  pointValue: number,
  subTotal: number,
): number {
  if (points <= 0 || subTotal <= 0) return 0;
  const discountVal = points * pointValue;
  const maxDiscountPct = (discountVal / subTotal) * 100;
  return Math.min(100, Math.floor(maxDiscountPct));
}
