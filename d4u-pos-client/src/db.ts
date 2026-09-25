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
  store_id: number;
  created_by?: number;
  backendKotId?: number;
  businessDayId: number;
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
    // v12: Index backendKotId so bulkPut can upsert by Dexie ++id without
    // creating duplicates. Without this index, every syncKOTs() call could
    // not efficiently look up existing records by backendKotId, causing
    // phantom duplicate tickets to accumulate in the KDS on each refresh.
    this.version(12).stores({
      users: 'id, phone',
      category_groups: 'id, sort_order',
      categories: 'id, store_id, category_group_id',
      products: 'id, category_id, name',
      transactions: '++id, synced',
      kots: '++id, status, synced, bridgeOrderId, backendKotId',
      inventory: 'id, category',
      staffLogs: '++id, name, clockIn',
      crmCustomers: 'id, phone',
      heldOrders: 'id'
    });
    // v13: Index store_id on kots to support store-isolation and multi-tenant scoping
    this.version(13).stores({
      users: 'id, phone',
      category_groups: 'id, sort_order',
      categories: 'id, store_id, category_group_id',
      products: 'id, category_id, name',
      transactions: '++id, synced',
      kots: '++id, status, synced, bridgeOrderId, backendKotId, store_id',
      inventory: 'id, category',
      staffLogs: '++id, name, clockIn',
      crmCustomers: 'id, phone',
      heldOrders: 'id'
    });
    // v14: Add businessDayId to kots schema for Finding #4 store + business day isolation
    this.version(14).stores({
      users: 'id, phone',
      category_groups: 'id, sort_order',
      categories: 'id, store_id, category_group_id',
      products: 'id, category_id, name',
      transactions: '++id, synced',
      kots: '++id, status, synced, bridgeOrderId, backendKotId, store_id, businessDayId',
      inventory: 'id, category',
      staffLogs: '++id, name, clockIn',
      crmCustomers: 'id, phone',
      heldOrders: 'id'
    });
  }
}

export const db = new D4UDatabase();

/**
 * Task #3C-1 — Strict validator for positive integer identity (store_id and businessDayId).
 * Enforces: typeof === 'number' && Number.isFinite(val) && Number.isInteger(val) && val > 0
 */
export function isValidPosIntegerId(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && Number.isInteger(val) && val > 0;
}

export interface OfflineKotIdentityValidationResult {
  valid: boolean;
  store_id?: number;
  businessDayId?: number;
  error?: string;
}

/**
 * Task #3C-1 — Strictly validates active store and open business day identities.
 *
 * Rejects if either identity is missing, null, undefined, 0, negative, NaN,
 * infinite, fractional, or non-numeric.
 * Never falls back to store 1 or any default.
 */
export function validateOfflineKotIdentity(
  storeId: unknown,
  businessDayId: unknown,
): OfflineKotIdentityValidationResult {
  const isStoreValid = isValidPosIntegerId(storeId);
  const isBdValid = isValidPosIntegerId(businessDayId);

  if (!isStoreValid && !isBdValid) {
    return {
      valid: false,
      error: 'Cannot create KOT: Both Active Store and Open Business Day identities are missing or invalid.',
    };
  }
  if (!isStoreValid) {
    return {
      valid: false,
      error: 'Cannot create KOT: Active Store identity is missing or invalid.',
    };
  }
  if (!isBdValid) {
    return {
      valid: false,
      error: 'Cannot create KOT: Open Business Day identity is missing or invalid. Please open a business day before taking orders.',
    };
  }

  return {
    valid: true,
    store_id: storeId,
    businessDayId: businessDayId,
  };
}

// ─── Scoped Synchronization Sequence Tracking (Task D: Stale Snapshot Protection) ────

const inMemoryIssuedSyncSequences = new Map<string, number>();
const inMemoryAppliedSyncSequences = new Map<string, number>();
// A durable pending marker bridges the IndexedDB sequence store and the
// separate Dexie database.  These two databases cannot commit atomically, so
// the marker makes a post-Dexie/pre-sequence failure recoverable and prevents
// an older snapshot from being accepted while recovery is pending.
const inMemoryPendingSyncSequences = new Map<string, number>();
const inProcessMutexQueues = new Map<string, Promise<any>>();

export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

export function isWebLocksSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.locks && typeof navigator.locks.request === 'function';
}

/**
 * Task 2: Cross-tab atomic mutex.
 * Uses Web Locks API (navigator.locks) when running in browser environments
 * to ensure atomic coordination across separate browser tabs and contexts.
 *
 * Remediation Batch 2 (Finding 2):
 * FAIL CLOSED in browser environments where Web Locks is unavailable.
 * In-process mutex queue is strictly restricted to non-browser (Node / Vitest) test environments.
 */
export async function withCrossTabLock<T>(lockName: string, fn: () => Promise<T> | T): Promise<T> {
  if (isBrowserEnvironment()) {
    if (isWebLocksSupported()) {
      return await navigator.locks.request(lockName, async () => {
        return await fn();
      });
    }
    // Browser environment without Web Locks: fail closed to prevent unsafe cross-tab sequence issuance
    throw new Error(
      `Web Locks API (navigator.locks) is required for cross-tab synchronization in browser environments, but is not supported. Refusing lock '${lockName}' to prevent unsafe sequence allocation.`
    );
  }

  // In-process fallback strictly for non-browser / Node / Vitest single-process test environments
  const currentLock = inProcessMutexQueues.get(lockName) || Promise.resolve();
  let release: () => void;
  const newLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  inProcessMutexQueues.set(lockName, currentLock.then(() => newLock));

  await currentLock;
  try {
    return await fn();
  } finally {
    release!();
    if (inProcessMutexQueues.get(lockName) === newLock) {
      inProcessMutexQueues.delete(lockName);
    }
  }
}

/**
 * Task 1: Scoped key strictly requires BOTH storeId and businessDayId.
 * No 'bd_all' fallback exists. Throws if either ID is missing or non-positive.
 */
export function getSyncScopeKey(storeId: number, businessDayId: number): string {
  if (!isValidPosIntegerId(storeId) || !isValidPosIntegerId(businessDayId)) {
    throw new Error(
      `Cannot get sync scope key: storeId (${storeId}) and businessDayId (${businessDayId}) must both be valid positive integers.`
    );
  }
  return `store_${storeId}_bd_${businessDayId}`;
}

let seqDbPromise: Promise<IDBDatabase> | null = null;

export function closeSeqDb(): void {
  if (seqDbPromise) {
    seqDbPromise.then(db => db.close()).catch(() => {});
    seqDbPromise = null;
  }
}

function getSeqDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined' || !indexedDB) {
    return Promise.reject(new Error('SYNC_STORAGE_UNAVAILABLE: IndexedDB is not supported or unavailable.'));
  }
  if (!seqDbPromise) {
    const p = new Promise<IDBDatabase>((resolve, reject) => {
      let req: IDBOpenDBRequest;
      try {
        req = indexedDB.open('D4U_Sync_Sequences', 1);
      } catch (err) {
        seqDbPromise = null;
        return reject(new Error('SYNC_STORAGE_UNAVAILABLE: ' + (err instanceof Error ? err.message : String(err))));
      }
      req.onupgradeneeded = () => {
        try {
          if (!req.result.objectStoreNames.contains('seq')) {
            req.result.createObjectStore('seq');
          }
        } catch {
          // ignore
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        seqDbPromise = null;
        reject(new Error('SYNC_STORAGE_UNAVAILABLE: ' + (req.error ? req.error.message : 'Failed to open database')));
      };
      req.onblocked = () => {
        seqDbPromise = null;
        reject(new Error('SYNC_STORAGE_UNAVAILABLE: Database open blocked'));
      };
    });
    p.catch(() => {
      if (seqDbPromise === p) {
        seqDbPromise = null;
      }
    });
    seqDbPromise = p;
  }
  return seqDbPromise;
}

async function getIdbSeq(key: string): Promise<number> {
  if (!isBrowserEnvironment()) {
    if (typeof indexedDB === 'undefined' || !indexedDB) return 0;
  }
  const idb = await getSeqDb();
  return await new Promise<number>((resolve, reject) => {
    try {
      const tx = idb.transaction('seq', 'readonly');
      const store = tx.objectStore('seq');
      const req = store.get(key);
      req.onsuccess = () => resolve(typeof req.result === 'number' ? req.result : 0);
      req.onerror = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Read failed: ' + (req.error ? req.error.message : 'unknown')));
      tx.onerror = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Transaction read failed: ' + (tx.error ? tx.error.message : 'unknown')));
    } catch (err) {
      reject(new Error('SYNC_STORAGE_UNAVAILABLE: ' + (err instanceof Error ? err.message : String(err))));
    }
  });
}

async function setIdbSeq(key: string, val: number): Promise<void> {
  if (!isBrowserEnvironment()) {
    if (typeof indexedDB === 'undefined' || !indexedDB) return;
  }
  const idb = await getSeqDb();
  return await new Promise<void>((resolve, reject) => {
    try {
      const tx = idb.transaction('seq', 'readwrite');
      const store = tx.objectStore('seq');
      store.put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Write failed: ' + (tx.error ? tx.error.message : 'unknown')));
      tx.onabort = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Write aborted: ' + (tx.error ? tx.error.message : 'unknown')));
    } catch (err) {
      reject(new Error('SYNC_STORAGE_UNAVAILABLE: ' + (err instanceof Error ? err.message : String(err))));
    }
  });
}

async function getIdbValue<T>(key: string): Promise<T | undefined> {
  const idb = await getSeqDb();
  return await new Promise<T | undefined>((resolve, reject) => {
    try {
      const tx = idb.transaction('seq', 'readonly');
      const req = tx.objectStore('seq').get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Read failed: ' + (req.error ? req.error.message : 'unknown')));
      tx.onerror = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Transaction read failed: ' + (tx.error ? tx.error.message : 'unknown')));
    } catch (err) {
      reject(new Error('SYNC_STORAGE_UNAVAILABLE: ' + (err instanceof Error ? err.message : String(err))));
    }
  });
}

async function setIdbValue(key: string, value: unknown): Promise<void> {
  const idb = await getSeqDb();
  return await new Promise<void>((resolve, reject) => {
    try {
      const tx = idb.transaction('seq', 'readwrite');
      tx.objectStore('seq').put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Write failed: ' + (tx.error ? tx.error.message : 'unknown')));
      tx.onabort = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Write aborted: ' + (tx.error ? tx.error.message : 'unknown')));
    } catch (err) {
      reject(new Error('SYNC_STORAGE_UNAVAILABLE: ' + (err instanceof Error ? err.message : String(err))));
    }
  });
}

async function deleteIdbValue(key: string): Promise<void> {
  const idb = await getSeqDb();
  return await new Promise<void>((resolve, reject) => {
    try {
      const tx = idb.transaction('seq', 'readwrite');
      tx.objectStore('seq').delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Delete failed: ' + (tx.error ? tx.error.message : 'unknown')));
      tx.onabort = () => reject(new Error('SYNC_STORAGE_UNAVAILABLE: Delete aborted: ' + (tx.error ? tx.error.message : 'unknown')));
    } catch (err) {
      reject(new Error('SYNC_STORAGE_UNAVAILABLE: ' + (err instanceof Error ? err.message : String(err))));
    }
  });
}

async function getPendingSyncSequence(scopeKey: string): Promise<number | undefined> {
  if (isBrowserEnvironment()) {
    const value = await getIdbValue<unknown>(`pending_${scopeKey}`);
    return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
  }
  return inMemoryPendingSyncSequences.get(scopeKey);
}

async function setPendingSyncSequence(scopeKey: string, seq: number): Promise<void> {
  if (isBrowserEnvironment()) {
    await setIdbValue(`pending_${scopeKey}`, seq);
    return;
  }
  inMemoryPendingSyncSequences.set(scopeKey, seq);
}

async function clearPendingSyncSequence(scopeKey: string): Promise<void> {
  if (isBrowserEnvironment()) {
    await deleteIdbValue(`pending_${scopeKey}`);
    return;
  }
  inMemoryPendingSyncSequences.delete(scopeKey);
}

export async function clearSyncSequencesIdb(): Promise<void> {
  if (typeof indexedDB === 'undefined' || !indexedDB) return;
  try {
    const idb = await getSeqDb();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction('seq', 'readwrite');
      tx.objectStore('seq').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export function resetSyncSequences(): void {
  inMemoryIssuedSyncSequences.clear();
  inMemoryAppliedSyncSequences.clear();
  inMemoryPendingSyncSequences.clear();
  inProcessMutexQueues.clear();
  if (typeof localStorage !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('d4u_sync_issued_') || key.startsWith('d4u_sync_applied_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
  if (typeof indexedDB !== 'undefined' && indexedDB) {
    clearSyncSequencesIdb().catch(() => {});
  }
}

/**
 * Task 2: Atomically acquires the next monotonic sync sequence token.
 * Protected by Web Locks API and backed by IndexedDB across browser tabs.
 */
export async function acquireSyncSequence(storeId: number, businessDayId: number): Promise<number> {
  if (!isValidPosIntegerId(storeId) || !isValidPosIntegerId(businessDayId)) {
    throw new Error(
      `Cannot acquire sync sequence: storeId (${storeId}) and businessDayId (${businessDayId}) must both be valid positive integers.`
    );
  }
  const scopeKey = getSyncScopeKey(storeId, businessDayId);
  return await withCrossTabLock(`d4u_sync_seq_lock_${scopeKey}`, async () => {
    if (isBrowserEnvironment()) {
      // In browser environments, IndexedDB is mandatory for sequence tracking.
      // If IndexedDB is unavailable or reading/writing fails, throws SYNC_STORAGE_UNAVAILABLE
      // and does NOT allocate a sequence or use in-memory as authority.
      const currentSeq = await getIdbSeq(`issued_${scopeKey}`);
      const nextSeq = currentSeq + 1;
      await setIdbSeq(`issued_${scopeKey}`, nextSeq);
      inMemoryIssuedSyncSequences.set(scopeKey, nextSeq);
      return nextSeq;
    }

    // In-process fallback strictly for non-browser / Node / Vitest single-process test environments
    let currentSeq = inMemoryIssuedSyncSequences.get(scopeKey) ?? 0;
    if (typeof indexedDB !== 'undefined' && indexedDB) {
      try {
        const idbVal = await getIdbSeq(`issued_${scopeKey}`);
        if (idbVal > currentSeq) {
          currentSeq = idbVal;
        }
      } catch {
        // non-browser fallback
      }
    }

    const nextSeq = currentSeq + 1;
    inMemoryIssuedSyncSequences.set(scopeKey, nextSeq);
    if (typeof indexedDB !== 'undefined' && indexedDB) {
      try {
        await setIdbSeq(`issued_${scopeKey}`, nextSeq);
      } catch {
        // non-browser fallback
      }
    }
    return nextSeq;
  });
}

/**
 * Remediation Batch 3 (Finding 2): Single authoritative store for applied sequence.
 * Always reads from IndexedDB in browser environments to avoid stale memory/localStorage.
 */
export async function getLatestAppliedSyncSequence(scopeKey: string): Promise<number> {
  if (isBrowserEnvironment()) {
    const idbVal = await getIdbSeq(`applied_${scopeKey}`);
    inMemoryAppliedSyncSequences.set(scopeKey, idbVal);
    return idbVal;
  }
  let appliedSeq = inMemoryAppliedSyncSequences.get(scopeKey) ?? 0;
  if (typeof indexedDB !== 'undefined' && indexedDB) {
    try {
      const idbVal = await getIdbSeq(`applied_${scopeKey}`);
      if (idbVal > appliedSeq) {
        appliedSeq = idbVal;
        inMemoryAppliedSyncSequences.set(scopeKey, idbVal);
      }
    } catch {
      // non-browser fallback
    }
  }
  return appliedSeq;
}

/**
 * Remediation Batch 3 (Finding 2): Authoritative commit of applied sequence to IndexedDB.
 */
export async function setLatestAppliedSyncSequence(scopeKey: string, seq: number): Promise<void> {
  if (isBrowserEnvironment()) {
    await setIdbSeq(`applied_${scopeKey}`, seq);
    inMemoryAppliedSyncSequences.set(scopeKey, seq);
    return;
  }
  inMemoryAppliedSyncSequences.set(scopeKey, seq);
  if (typeof indexedDB !== 'undefined' && indexedDB) {
    try {
      await setIdbSeq(`applied_${scopeKey}`, seq);
    } catch {
      // non-browser fallback
    }
  }
}

let testHookDuringReconciliation: (() => Promise<void>) | null = null;

/**
 * Test instrumentation hook for controlled barrier testing of TOCTOU race.
 * Non-production only.
 */
export function setTestHookDuringReconciliation(hook: (() => Promise<void>) | null): void {
  testHookDuringReconciliation = hook;
}

export interface SyncReconcileResult {
  applied: boolean;
  reason?: 'INVALID_STORE_IDENTITY' | 'INVALID_BD_IDENTITY' | 'STALE_SNAPSHOT' | 'UNSUPPORTED_BROWSER_LOCKS' | 'SYNC_STORAGE_UNAVAILABLE' | 'SUCCESS';
  scopeKey?: string;
  syncSeq?: number;
  latestAppliedSeq?: number;
  error?: string;
}

/**
 * Task #3B & Remediation Batch 3 (Finding 5): Pure mapping + identity-gate function.
 *
 * Converts an array of raw backend KOT objects into Dexie-ready shapes.
 *
 * Mandatory scope:
 * - activeStoreId and activeBusinessDayId are REQUIRED positive integers.
 * - If either is missing or invalid, returns [] safely without mapping or writing.
 * - Deduplication is keyed strictly by store_id + businessDayId + backendKotId.
 * - No unscoped backendKotId fallback exists.
 *
 * @param incomingBackendKots  Raw backend KOT objects (Prisma shape)
 * @param activeStoreId        MANDATORY current active store ID for cross-store isolation
 * @param activeBusinessDayId  MANDATORY current active business day ID for cross-day isolation
 * @param primaryLocalMap      scopedKey (store_id_businessDayId_backendKotId) → existing local Dexie id (for upsert)
 * @returns Array of Dexie-ready KOT records with COMPLETE identity only
 */
export function mapBackendKotsToDexie(
  incomingBackendKots: any[],
  activeStoreId: number,
  activeBusinessDayId: number,
  primaryLocalMap: Map<string, number> = new Map(),
): any[] {
  if (!isValidPosIntegerId(activeStoreId) || !isValidPosIntegerId(activeBusinessDayId)) {
    return [];
  }
  if (!Array.isArray(incomingBackendKots) || incomingBackendKots.length === 0) {
    return [];
  }

  const mappedRaw = incomingBackendKots.map((k: any) => {
    const kotStoreId: number | undefined = isValidPosIntegerId(k.store_id) ? k.store_id : undefined;
    const kotBusinessDayId: number | undefined = isValidPosIntegerId(k.business_day_id) ? k.business_day_id : undefined;
    const kotId: number | undefined = isValidPosIntegerId(k.id) ? k.id : undefined;

    const isComplete = !!(kotStoreId && kotBusinessDayId && kotId);

    // Finding 4: The ONLY valid key for local upsert mapping is store_id + businessDayId + backendKotId.
    const scopedKey = isComplete
      ? `${kotStoreId}_${kotBusinessDayId}_${kotId}`
      : null;
    const existingRowId = scopedKey ? primaryLocalMap.get(scopedKey) : undefined;

    return {
      id: existingRowId, // update existing row; else Dexie auto-increments
      backendKotId: kotId,
      store_id: kotStoreId,
      businessDayId: kotBusinessDayId,
      _identityComplete: isComplete,
      orderId: k.order_id,
      type: k.order?.order_source === 'ONLINE'
        ? (k.order?.onlineOrder?.type === 'PICKUP' ? 'Pickup' : 'Online')
        : k.order?.order_source?.toUpperCase() === 'DELIVERY'
          ? 'Delivery'
          : (k.order?.order_source?.toUpperCase() === 'TAKE AWAY' || k.order?.order_source?.toUpperCase() === 'PICKUP')
            ? 'Pickup'
            : 'Walk-in',
      customer: k.order?.customer?.name || '',
      customerPhone: k.order?.customer?.phone || '',
      items: k.items ? (typeof k.items === 'string' ? k.items : JSON.stringify(k.items)) : '[]',
      notes: k.notes || '',
      timePlaced: k.createdAt ? new Date(k.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
      prepTimeMinutes: k.prep_time_minutes || 10,
      status: k.status,
      startTime: k.acceptedAt ? new Date(k.acceptedAt).toISOString() : '',
      totalAmount: k.order?.total_amount || 0,
      paymentMethod: k.order?.payment_method || 'CASH',
      printCount: 0,
      synced: true,
    };
  });

  // Identity completeness gate: drop KOTs with missing store_id, missing business_day_id, or missing id
  const identityComplete = mappedRaw.filter((r: any) => r._identityComplete);

  // Strip internal flag, then dedup strictly by scoped key: store_id + businessDayId + backendKotId
  const stripped = identityComplete.map((r: any) => {
    const { _identityComplete, ...rest } = r;
    return rest;
  });

  return Array.from(
    new Map(stripped.map((r: any) => [`${r.store_id}_${r.businessDayId}_${r.backendKotId}`, r])).values()
  );
}

/**
 * Shared, cross-tab safe reconciliation and upsert of backend KOTs.
 * Runs inside a single serialization lock per scope (store_id + businessDayId).
 *
 * Guarantees (Remediation Batch 3):
 * 1. Scope lock eliminates TOCTOU races between sequence check and transaction commit.
 * 2. If sequence N+1 commits, sequence N is guaranteed to be rejected as STALE_SNAPSHOT.
 * 3. Latest applied sequence is updated atomically within the serialization boundary.
 * 4. Legitimate unsynced offline KOTs (synced === false) are strictly preserved (never deleted).
 * 5. Stale synced tickets no longer present on the backend are cleaned up.
 * 6. Deduplication is strictly scoped by store_id + businessDayId + backendKotId.
 */
export async function syncAndReconcileBackendKots(
  incomingBackendKots: any[],
  activeStoreId: number,
  activeBusinessDayId: number,
  syncSeq?: number,
  database: D4UDatabase = db,
): Promise<SyncReconcileResult> {
  // Identity validation (Task 1): BOTH store_id and businessDayId are mandatory positive integers
  if (!isValidPosIntegerId(activeStoreId)) {
    return { applied: false, reason: 'INVALID_STORE_IDENTITY' };
  }
  if (!isValidPosIntegerId(activeBusinessDayId)) {
    return { applied: false, reason: 'INVALID_BD_IDENTITY' };
  }

  // Remediation Batch 2: In browser environments without Web Locks, fail closed safely
  if (isBrowserEnvironment()) {
    if (!isWebLocksSupported()) {
      return { applied: false, reason: 'UNSUPPORTED_BROWSER_LOCKS' };
    }
    if (typeof indexedDB === 'undefined' || !indexedDB) {
      return { applied: false, reason: 'SYNC_STORAGE_UNAVAILABLE' };
    }
  }

  const scopeKey = getSyncScopeKey(activeStoreId, activeBusinessDayId);

  let effectiveSeq: number;
  try {
    effectiveSeq = syncSeq !== undefined ? syncSeq : await acquireSyncSequence(activeStoreId, activeBusinessDayId);
  } catch (err: any) {
    if (err.message && err.message.includes('SYNC_STORAGE_UNAVAILABLE')) {
      return { applied: false, reason: 'SYNC_STORAGE_UNAVAILABLE', scopeKey, error: err.message };
    }
    throw err;
  }

  // Remediation Batch 3 (Finding 1): Single authoritative serialization boundary
  // Scope lock wraps the entire check → transaction → commit → sequence update lifecycle.
  return await withCrossTabLock(`d4u_sync_reconcile_lock_${scopeKey}`, async () => {
    // 1. Authoritative sequence check inside the scope lock
    let latestApplied: number;
    let pendingSequence: number | undefined;
    try {
      latestApplied = await getLatestAppliedSyncSequence(scopeKey);
      pendingSequence = await getPendingSyncSequence(scopeKey);
    } catch (err: any) {
      if (err.message && err.message.includes('SYNC_STORAGE_UNAVAILABLE')) {
        return { applied: false, reason: 'SYNC_STORAGE_UNAVAILABLE', scopeKey, error: err.message };
      }
      throw err;
    }

    const durableLatest = Math.max(latestApplied, pendingSequence ?? 0);
    const isPendingRecovery = pendingSequence === effectiveSeq && effectiveSeq > latestApplied;
    if (effectiveSeq < durableLatest || (effectiveSeq === durableLatest && !isPendingRecovery)) {
      return {
        applied: false,
        reason: 'STALE_SNAPSHOT',
        scopeKey,
        syncSeq: effectiveSeq,
        latestAppliedSeq: latestApplied,
      };
    }

    // IndexedDB and Dexie are separate databases and cannot share one atomic
    // commit.  Record the operation before touching Dexie.  If the final
    // applied-sequence write fails after Dexie commits, this marker remains
    // durable and suppresses older snapshots until this exact sequence is
    // retried and completed.
    try {
      await setPendingSyncSequence(scopeKey, effectiveSeq);
    } catch (err: any) {
      if (err.message && err.message.includes('SYNC_STORAGE_UNAVAILABLE')) {
        return { applied: false, reason: 'SYNC_STORAGE_UNAVAILABLE', scopeKey, error: err.message };
      }
      throw err;
    }

    // Optional test hook for controlled barrier testing of TOCTOU race
    if (testHookDuringReconciliation) {
      await testHookDuringReconciliation();
    }

    let transactionApplied = false;

    try {
      await database.transaction('rw', database.kots, async () => {
        // Inner stale check (Finding 5): verify latestApplied synchronously inside transaction
        // Avoids opening a separate IndexedDB transaction inside Dexie transaction (which causes PrematureCommitError)
        const innerLatest = inMemoryAppliedSyncSequences.get(scopeKey) ?? 0;
        if (effectiveSeq <= innerLatest) {
          return; // reject without any writes
        }

        const allLocalKots = await database.kots.toArray();

        // Separate synced vs offline KOTs. Offline KOTs (synced === false) must NEVER be deleted.
        const localSyncedKots = allLocalKots.filter(k => k.synced === true);

        // Scoped duplicate reconciliation
        const primaryLocalMap = new Map<string, number>();
        const duplicateIdsToPrune: number[] = [];

        const scopedLocalSyncedKots = localSyncedKots.filter(
          k => k.store_id === activeStoreId && k.businessDayId === activeBusinessDayId
        );

        for (const k of scopedLocalSyncedKots) {
          if (k.backendKotId != null && typeof k.id === 'number') {
            const scopedKey = `${k.store_id}_${k.businessDayId}_${k.backendKotId}`;
            const existingId = primaryLocalMap.get(scopedKey);
            if (existingId == null) {
              primaryLocalMap.set(scopedKey, k.id);
            } else {
              if (k.id < existingId) {
                duplicateIdsToPrune.push(existingId);
                primaryLocalMap.set(scopedKey, k.id);
              } else {
                duplicateIdsToPrune.push(k.id);
              }
            }
          }
        }

        const matchingIncomingBackendKots = incomingBackendKots.filter((k: any) => {
          const kotStoreId = isValidPosIntegerId(k.store_id) ? k.store_id : (isValidPosIntegerId(k.storeId) ? k.storeId : undefined);
          const kotDayId = isValidPosIntegerId(k.business_day_id) ? k.business_day_id : (isValidPosIntegerId(k.businessDayId) ? k.businessDayId : undefined);
          const kotId = isValidPosIntegerId(k.id) ? k.id : undefined;
          return kotStoreId === activeStoreId && kotDayId === activeBusinessDayId && kotId !== undefined;
        });

        const incomingBackendIds = new Set(matchingIncomingBackendKots.map((k: any) => k.id));

        const staleIds = scopedLocalSyncedKots
          .filter(k => {
            if (k.backendKotId == null) return true;
            return !incomingBackendIds.has(k.backendKotId);
          })
          .map(k => k.id)
          .filter((id): id is number => typeof id === 'number');

        const idsToDelete = Array.from(new Set([...duplicateIdsToPrune, ...staleIds]));
        if (idsToDelete.length > 0) {
          await database.kots.bulkDelete(idsToDelete);
        }

        // Map and strictly scope incoming backend KOTs
        const deduped = mapBackendKotsToDexie(matchingIncomingBackendKots, activeStoreId, activeBusinessDayId, primaryLocalMap);
        const scopedToPut = deduped.filter(k => k.store_id === activeStoreId && k.businessDayId === activeBusinessDayId);

        if (scopedToPut.length > 0) {
          await database.kots.bulkPut(scopedToPut);
        }

        transactionApplied = true;
      });
    } catch (err) {
      // If Dexie rejects its transaction, the durable pending marker lets a
      // retry recover the same sequence; do not advance the applied sequence.
      throw err;
    }

    if (!transactionApplied) {
      let finalLatest = latestApplied;
      try {
        finalLatest = await getLatestAppliedSyncSequence(scopeKey);
      } catch {
        // ignore
      }
      return {
        applied: false,
        reason: 'STALE_SNAPSHOT',
        scopeKey,
        syncSeq: effectiveSeq,
        latestAppliedSeq: finalLatest,
      };
    }

    // Authoritatively commit latest applied sequence inside the scope lock
    try {
      await setLatestAppliedSyncSequence(scopeKey, effectiveSeq);
    } catch (err: any) {
      if (err.message && err.message.includes('SYNC_STORAGE_UNAVAILABLE')) {
        // Keep the pending marker.  Dexie may already have committed, and the
        // marker is what prevents an older snapshot from being accepted while
        // this exact sequence is retried.
        return { applied: false, reason: 'SYNC_STORAGE_UNAVAILABLE', scopeKey, error: err.message };
      }
      throw err;
    }

    // Applied sequence is now durable.  Cleanup is best-effort: leaving a
    // marker equal to the applied sequence is safe because it cannot admit an
    // older snapshot and does not change the successful result.
    try {
      await clearPendingSyncSequence(scopeKey);
    } catch {
      // The applied sequence is authoritative; retrying marker cleanup later
      // is safe and must not turn a committed reconciliation into a failure.
    }

    return {
      applied: true,
      reason: 'SUCCESS',
      scopeKey,
      syncSeq: effectiveSeq,
      latestAppliedSeq: effectiveSeq,
    };
  });
}

/**
 * Task #3C-1 — Strict Offline KOT Creation Guard.
 *
 * Prevents creation or persistence of any new offline/local KOT unless BOTH
 * store_id and businessDayId are valid finite positive integers.
 *
 * If either identity is missing or invalid:
 * - Throws an Error.
 * - Does NOT write the KOT to Dexie (table.add is NOT called).
 * - Never falls back to store_id = 1, undefined, null, 0, or any default.
 *
 * If both identities are valid:
 * - Writes to Dexie with explicit store_id and businessDayId.
 */
export async function createOfflineKot(
  kotData: any,
  storeIdInput?: unknown,
  businessDayIdInput?: unknown,
  table: { add: (data: any) => Promise<any> } = db.kots,
): Promise<any> {
  const storeId = storeIdInput !== undefined ? storeIdInput : kotData?.store_id;
  const businessDayId = businessDayIdInput !== undefined ? businessDayIdInput : kotData?.businessDayId;

  const validation = validateOfflineKotIdentity(storeId, businessDayId);
  if (!validation.valid || validation.store_id == null || validation.businessDayId == null) {
    throw new Error(validation.error || 'Invalid KOT identity');
  }

  const recordToPersist: OfflineKOT = {
    ...kotData,
    store_id: validation.store_id,
    businessDayId: validation.businessDayId,
    synced: false,
  };

  return await table.add(recordToPersist);
}


