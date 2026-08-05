import Dexie, { type Table } from 'dexie';

export interface OfflineCategoryGroup {
  id: number;
  name: string;
  sort_order: number;
  icon?: string;
  color?: string;
  description?: string;
  is_active: boolean;
  store_ids?: number[];
  channel_visibility?: any;
}

export interface OfflineCategory {
  id: number;
  store_id: number;
  name: string;
  category_group_id?: number;
}

export interface OfflineProduct {
  id: number;
  category_id: number;
  name: string;
  price: number;
  img?: string;
  stock?: number;
  desc?: string;
  isApproved?: boolean;
  itemCode?: string;
  variants?: any[];
  modifierGroups?: any[];
  categories?: any[];
}

export interface QueuedTransaction {
  id?: number;
  inventory_id: number;
  operation: 'ADD' | 'SUBTRACT';
  amount: number;
  reason: string;
  changed_by: number;
  synced: boolean;
  createdAt: string;
}

export interface OfflineKOT {
  id?: number;
  orderId: number | string;
  type: string;
  items: string;
  notes: string;
  timePlaced: string;
  prepTimeMinutes: number;
  status: 'PENDING' | 'NEW' | 'PREPARING' | 'READY';
  startTime: string; // ISO string format
  printCount: number;
  totalAmount?: number;
  customer?: string;
  customerPhone?: string;
  customerAddress?: string;
  customer_id?: number | null;
  source?: string;
  bridgeOrderId?: number;
  paymentMethod?: string;
  itemsData?: string;
  synced?: boolean;
  readyAt?: number;
}

export interface OfflineIngredient {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  maxStock: number;
  unit: string;
  warningThreshold: number;
  deductPerItem: Record<string, number>;
}

export interface OfflineStaffLog {
  id?: number;
  name: string;
  pin: string;
  role: 'CASHIER' | 'CHEF' | 'RIDER' | 'MANAGER';
  clockIn: string; // ISO String
  clockOut?: string; // ISO String
}

export interface OfflineCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  points: number;
}

export interface OfflineHeldOrder {
  id: number;
  cart: any[];
  orderType: string;
  time: Date;
}

export class D4UDatabase extends Dexie {
  users!: Table<any, number>;
  category_groups!: Table<OfflineCategoryGroup, number>;
  categories!: Table<OfflineCategory, number>;
  products!: Table<OfflineProduct, number>;
  transactions!: Table<QueuedTransaction, number>;
  kots!: Table<OfflineKOT, number>;
  inventory!: Table<OfflineIngredient, string>;
  staffLogs!: Table<OfflineStaffLog, number>;
  crmCustomers!: Table<OfflineCustomer, string>;
  heldOrders!: Table<OfflineHeldOrder, number>;

  constructor() {
    super('D4U_POS_OfflineDB');
    this.version(7).stores({
      users: 'id, phone',
      categories: 'id, store_id',
      products: 'id, category_id, name',
      transactions: '++id, synced',
      kots: '++id, status',
      inventory: 'id, category',
      staffLogs: '++id, name, clockIn',
      crmCustomers: 'id, phone'
    });
    this.version(8).stores({
      users: 'id, phone',
      categories: 'id, store_id',
      products: 'id, category_id, name',
      transactions: '++id, synced',
      kots: '++id, status, synced',
      inventory: 'id, category',
      staffLogs: '++id, name, clockIn',
      crmCustomers: 'id, phone'
    });
    this.version(9).stores({
      users: 'id, phone',
      categories: 'id, store_id',
      products: 'id, category_id, name',
      transactions: '++id, synced',
      kots: '++id, status, synced',
      inventory: 'id, category',
      staffLogs: '++id, name, clockIn',
      crmCustomers: 'id, phone',
      heldOrders: 'id'
    });
    this.version(10).stores({
      users: 'id, phone',
      categories: 'id, store_id',
      products: 'id, category_id, name',
      transactions: '++id, synced',
      kots: '++id, status, synced, bridgeOrderId',
      inventory: 'id, category',
      staffLogs: '++id, name, clockIn',
      crmCustomers: 'id, phone',
      heldOrders: 'id'
    });
    this.version(11).stores({
      users: 'id, phone',
      category_groups: 'id, sort_order',
      categories: 'id, store_id, category_group_id',
      products: 'id, category_id, name',
      transactions: '++id, synced',
      kots: '++id, status, synced, bridgeOrderId',
      inventory: 'id, category',
      staffLogs: '++id, name, clockIn',
      crmCustomers: 'id, phone',
      heldOrders: 'id'
    });
  }
}

export const db = new D4UDatabase();
