export type Tab = 'kitchen' | 'dashboard' | 'orders' | 'inventory' | 'settings';
// FORCE VITE RELOAD

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  id: string; // e.g., "2415" or Primary Key
  displayId?: string; // Visible ID e.g. "2484"
  tableName: string; // e.g., "Table 12", "Takeaway", "UberEats"
  items: OrderItem[];
  instructions: string; // e.g., "EXTRA CHEESE, EXTRA MAYONNAISE"
  status: OrderStatus; // 'pending' | 'preparing' | 'ready' | 'completed'
  timerTotalSeconds: number; // Selected prep time in seconds (e.g., 600)
  timerElapsedSeconds: number; // Cooking seconds elapsed
  isUrgent: boolean;
  createdAt: string; // ISO date string
  completedAt?: string; // ISO date string
  selectedPrepMinutes?: number; // Minutes chosen on accept (e.g. 5, 10, 15, 20)
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  maxStock: number;
  unit: string;
  warningThreshold: number;
  deductPerItem: Record<string, number>;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  type: 'order_received' | 'order_preparing' | 'order_completed' | 'inventory_low' | 'inventory_restock' | 'emergency_stop' | 'emergency_resume';
  message: string;
}

export interface StationSettings {
  stationName: string;
  specialtyName: string;
  chefAvatar: string;
  silentAlert: boolean;
  autoSimulate: boolean;
  simulateIntervalSeconds: number;
  alarmSoundEnabled: boolean;
  volume: number;
  standardBurgerPrepSeconds: number;
  standardSidesPrepSeconds: number;
}
