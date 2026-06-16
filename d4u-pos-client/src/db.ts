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
  source?: string;
  bridgeOrderId?: number;
}

export class D4UDatabase extends Dexie {
  users!: Table<any, number>;
  categories!: Table<OfflineCategory, number>;
  products!: Table<OfflineProduct, number>;
  transactions!: Table<QueuedTransaction, number>;
  kots!: Table<OfflineKOT, number>;

  constructor() {
    super('D4U_POS_OfflineDB');
    this.version(4).stores({
      users: 'id, phone',
      categories: 'id, store_id',
      products: 'id, category_id, name',
      transactions: '++id, synced',
      kots: '++id, status'
    });
  }
}

export const db = new D4UDatabase();
