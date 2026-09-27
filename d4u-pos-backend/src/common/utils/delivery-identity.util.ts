export type DeliveryEntityType = 'ONLINE' | 'POS';

export function normalizeDeliveryEntityType(value: unknown): DeliveryEntityType | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  return normalized === 'ONLINE' || normalized === 'POS' ? normalized : undefined;
}

export function deliveryIdentityKey(entityType: DeliveryEntityType, entityId: number): string {
  return `${entityType}:${entityId}`;
}

/** Adds an explicit namespace to an OnlineOrder payload. */
export function formatOnlineOrderForRider(order: any) {
  const businessDayId = order.businessDayId ?? order.business_day_id ?? null;
  return {
    ...order,
    entityType: 'ONLINE' as const,
    entityId: order.id,
    onlineOrderId: order.id,
    posOrderId: order.posOrderId ?? null,
    isPos: false,
    businessDayId,
    business_day_id: businessDayId,
  };
}
