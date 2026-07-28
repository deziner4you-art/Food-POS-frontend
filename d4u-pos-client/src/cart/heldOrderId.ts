let lastIssuedId = 0;

/**
 * Monotonically increasing id for held orders. Still a plain millisecond-scale
 * number — same type and same value range as the previous Date.now()-based id
 * — so it stays compatible with the existing `heldOrders: 'id'` Dexie schema
 * and every previously-stored held order. Guarantees a strictly higher value
 * than any id issued earlier in this session, closing the same-millisecond
 * collision gap Date.now() had on its own (two holds issued in the same
 * millisecond would otherwise silently overwrite one another via Dexie's
 * put-by-primary-key semantics).
 */
export function generateHeldOrderId(): number {
  const now = Date.now();
  lastIssuedId = now > lastIssuedId ? now : lastIssuedId + 1;
  return lastIssuedId;
}
