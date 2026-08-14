/**
 * Strips everything but digits so the same real phone number always matches
 * itself regardless of how a cashier or customer happened to type it
 * (dashes, spaces, a leading +) -- website and POS both capture phone via a
 * free-text input with no enforced format, and Customer.phone lookups are a
 * plain exact-string match, so "0313-4403460" and "03134403460" used to
 * resolve to two different customers instead of one synchronized identity.
 * Apply at every Customer.phone/OnlineOrder.customerPhone write and lookup.
 */
export function normalizePhone(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}
