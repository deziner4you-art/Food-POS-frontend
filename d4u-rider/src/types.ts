export interface Coordinate {
  id: string;
  name: string;
  x: number; // grid position x (0 to 100)
  y: number; // grid position y (0 to 100)
  address: string;
  isSurgeZone?: boolean;
}

export type DeliveryStatus =
  | 'OFFLINE'        // Rider is offline
  | 'SEARCHING'      // Online, sitting idle, scanning for orders
  | 'OFFERED'        // New incoming delivery order pop-up (decline or accept)
  | 'ACCEPTED'       // Order accepted, driving to Restaurant
  | 'ARRIVED_REST'   // Arrived at Restaurant to pick up food
  | 'PICKED_UP'      // Food picked up, driving to Customer dropoff
  | 'DELIVERED';     // Delivery successfully ended

export interface Restaurant {
  name: string;
  address: string;
  x: number;
  y: number;
}

export interface Customer {
  name: string;
  address: string;
  x: number;
  y: number;
}

export interface DeliveryOrder {
  id: string;
  source: 'POS' | 'ONLINE_ORDER'; // link channel
  restaurantName: string;
  restaurantAddress: string;
  restaurantX: number;
  restaurantY: number;
  customerName: string;
  customerAddress: string;
  customerX: number;
  customerY: number;
  earnings: number;
  distance: number;
  itemsCount: number;
  itemsList: string[];
  estTimeMins: number;
  paymentMethod: 'COD' | 'ONLINE_PAID' | 'PAY_ON_DELIVERY_REQUESTED';
  paymentStatus: 'PAID' | 'PENDING_CUSTOMER_TAP' | 'UNPAID';
  estimatedReadyAt?: string;
  bridgeStatus?: string;
}

export interface SavedCompletedMission {
  id: string;
  orderId: string;
  restaurant: string;
  customer: string;
  earnings: number;
  itemsCount: number;
  completedAt: string;
  settled?: boolean;
}

export interface RiderStats {
  level: number;
  xp: number;
  nextLevelXp: number;
  streak: number;
  todayEarnings: number;
  battery: number;
}
