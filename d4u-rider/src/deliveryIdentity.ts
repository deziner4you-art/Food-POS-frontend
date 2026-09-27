export type DeliveryEntityType = 'ONLINE' | 'POS';

export function getDeliveryEntityType(value: any): DeliveryEntityType {
  return value?.entityType === 'POS' || value?.isPos === true ? 'POS' : 'ONLINE';
}

export function getDeliveryEntityId(value: any): number | null {
  const raw = value?.entityId ?? value?.id;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function getDeliveryIdentityKey(value: any): string | null {
  const entityId = getDeliveryEntityId(value);
  return entityId == null ? null : `${getDeliveryEntityType(value)}:${entityId}`;
}
