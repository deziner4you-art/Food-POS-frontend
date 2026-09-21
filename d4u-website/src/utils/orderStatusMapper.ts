import { CheckCircle2, Clock, UtensilsCrossed, PackageCheck, Bike, Truck, MapPin, CheckCheck, type LucideIcon } from 'lucide-react';

export interface TrackingStep {
  index: number;
  key: string;
  label: string;
  sub: string;
  icon: LucideIcon;
}

export const TRACKING_STEPS: TrackingStep[] = [
  { index: 0, key: 'RECEIVED', label: 'Order Placed', sub: 'Received by kitchen', icon: Clock },
  { index: 1, key: 'CONFIRMED', label: 'Confirmed by Restaurant', sub: 'Accepted by cashier', icon: CheckCircle2 },
  { index: 2, key: 'PREPARING', label: 'In Kitchen', sub: 'Chef is cooking your meal', icon: UtensilsCrossed },
  { index: 3, key: 'READY', label: 'Food is Ready', sub: 'Packed & awaiting rider', icon: PackageCheck },
  { index: 4, key: 'RIDER_ASSIGNED', label: 'Rider Assigned', sub: 'Rider arrived at restaurant', icon: Bike },
  { index: 5, key: 'OUT_FOR_DELIVERY', label: 'Out For Delivery', sub: 'Rider on the way to your door', icon: Truck },
  { index: 6, key: 'DELIVERED', label: 'Delivered', sub: 'Order delivered safely', icon: MapPin },
  { index: 7, key: 'COMPLETED', label: 'Order Completed', sub: 'Settled · Thank you!', icon: CheckCheck },
];

export function mapBackendStatusToStep(status?: string): number {
  if (!status) return 0;
  const s = status.toUpperCase().trim();

  switch (s) {
    case 'ONLINE_ORDER_RECEIVED':
    case 'NEW':
    case 'PENDING':
      return 0;

    case 'CONFIRMED':
    case 'PENDING_CHEF':
      return 1;

    case 'KITCHEN_PREPARING':
    case 'PREPARING':
      return 2;

    case 'READY':
      return 3;

    case 'RIDER_ACCEPTED':
    case 'RIDER_ARRIVED':
    case 'PRINT_BILL':
    case 'DISPATCHED':
      return 4;

    case 'PICKED_UP':
    case 'OUT_FOR_DELIVERY':
    case 'ON_WAY':
    case 'ON_THE_WAY':
      return 5;

    case 'DELIVERED':
    case 'WAITING_CASH_SETTLEMENT':
      return 6;

    case 'SETTLED':
    case 'PAID':
    case 'COMPLETED':
      return 7;

    case 'CANCELLED':
    case 'VOIDED':
      return -1;

    default:
      return 0;
  }
}

export function getCustomerStatusLabel(status?: string): string {
  const stepIdx = mapBackendStatusToStep(status);
  if (stepIdx === -1) return 'Cancelled';
  const step = TRACKING_STEPS.find(s => s.index === stepIdx);
  return step ? step.label : 'Order Placed';
}

export function getCustomerStatusDescription(status?: string): string {
  const stepIdx = mapBackendStatusToStep(status);
  if (stepIdx === -1) return 'This order has been cancelled.';
  const step = TRACKING_STEPS.find(s => s.index === stepIdx);
  return step ? step.sub : 'Your order is being processed.';
}

export function isOrderTerminal(status?: string): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  return ['DELIVERED', 'SETTLED', 'PAID', 'COMPLETED', 'CANCELLED', 'VOIDED'].includes(s);
}
