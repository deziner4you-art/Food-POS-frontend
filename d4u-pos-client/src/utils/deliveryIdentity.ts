export type DeliveryEntityType = 'ONLINE' | 'POS';

export interface CanonicalDeliveryIdentity {
  entityType: DeliveryEntityType;
  entityId: number;
}

export function normalizeDeliveryEntityType(value: unknown): DeliveryEntityType | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  return normalized === 'ONLINE' || normalized === 'POS' ? normalized : undefined;
}

/**
 * Validates only the canonical delivery identity fields.
 * Legacy fields such as isPos, id, and bridgeOrderId are deliberately not
 * considered here because they cannot establish an unambiguous namespace.
 */
export function getCanonicalDeliveryIdentity(value: unknown): CanonicalDeliveryIdentity | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  const entityType = candidate.entityType;
  const entityId = candidate.entityId;

  if (entityType !== 'ONLINE' && entityType !== 'POS') return null;
  if (typeof entityId !== 'number' || !Number.isFinite(entityId) || !Number.isInteger(entityId) || entityId <= 0) {
    return null;
  }

  return { entityType, entityId };
}

export function getCanonicalDeliveryIdentityKey(value: unknown): string | null {
  const identity = getCanonicalDeliveryIdentity(value);
  return identity ? `${identity.entityType}:${identity.entityId}` : null;
}

export function getDeliveryEntityType(value: unknown): DeliveryEntityType | undefined {
  const identity = getCanonicalDeliveryIdentity(value);
  return identity?.entityType;
}

export function getDeliveryEntityId(value: unknown): number | null {
  const identity = getCanonicalDeliveryIdentity(value);
  return identity?.entityId ?? null;
}

export function getDeliveryIdentityKey(value: any): string | null {
  return getCanonicalDeliveryIdentityKey(value);
}
