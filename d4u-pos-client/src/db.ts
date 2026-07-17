import Dexie, { type Table } from 'dexie';

export interface OfflineCategory {
  id: number;
  store_id: number;
  name: string;
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
  source?: string;
  bridgeOrderId?: number;
  paymentMethod?: string;
  itemsData?: string;
  synced?: boolean;
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

export class D4UDatabase extends Dexie {
  users!: Table<any, number>;
  categories!: Table<OfflineCategory, number>;
  products!: Table<OfflineProduct, number>;
  transactions!: Table<QueuedTransaction, number>;
  kots!: Table<OfflineKOT, number>;
  inventory!: Table<OfflineIngredient, string>;
  staffLogs!: Table<OfflineStaffLog, number>;
  crmCustomers!: Table<OfflineCustomer, string>;

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
  }
}

export const db = new D4UDatabase();
