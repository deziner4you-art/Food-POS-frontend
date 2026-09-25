import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  syncAndReconcileBackendKots,
  acquireSyncSequence,
  resetSyncSequences,
  getSyncScopeKey,
  getLatestAppliedSyncSequence,
  setLatestAppliedSyncSequence,
  withCrossTabLock,
  mapBackendKotsToDexie,
  OfflineKOT,
  closeSeqDb,
} from '../db';

describe('Task D & Remediation Batch 1: Stale Snapshot Protection & Scope Scoping', () => {
  let mockDb: any;
  let records: any[];

  function createMockDb(initial: any[] = []) {
    records = JSON.parse(JSON.stringify(initial));
    const toArraySpy = vi.fn().mockImplementation(async () => [...records]);
    const bulkDeleteSpy = vi.fn().mockImplementation(async (ids: number[]) => {
      const idSet = new Set(ids);
      records = records.filter(r => !idSet.has(r.id));
    });
    const bulkPutSpy = vi.fn().mockImplementation(async (items: any[]) => {
      for (const item of items) {
        if (item.id != null) {
          const idx = records.findIndex(r => r.id === item.id);
          if (idx >= 0) records[idx] = { ...records[idx], ...item };
          else records.push({ ...item });
        } else {
          const maxId = records.reduce((m, r) => (r.id != null && r.id > m ? r.id : m), 0);
          records.push({ ...item, id: maxId + 1 });
        }
      }
    });
    const transactionSpy = vi.fn().mockImplementation(async (_mode: string, _table: any, callback: () => Promise<void>) => {
      return await callback();
    });

    return {
      kots: {
        toArray: toArraySpy,
        bulkDelete: bulkDeleteSpy,
        bulkPut: bulkPutSpy,
      },
      transaction: transactionSpy,
      get records() { return records; },
    };
  }

  function makeBackendKot(id: number, storeId = 1, bdId = 10, status = 'PREPARING') {
    return {
      id,
      order_id: 1000 + id,
      store_id: storeId,
      business_day_id: bdId,
      status,
      items: `[{"name":"Item ${id}","qty":1}]`,
      notes: '',
      createdAt: new Date().toISOString(),
      order: {
        order_source: 'WALKIN',
        total_amount: 100,
        payment_method: 'CASH',
      },
    };
  }

  beforeEach(() => {
    resetSyncSequences();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    mockDb = createMockDb();
  });

  // ─── TEST 1: S1 starts -> S2 starts -> S2 completes first -> S1 completes later ───
  it('TEST 1: S1 starts, S2 starts, S2 completes first, S1 completes later -> S1 cannot overwrite S2', async () => {
    const storeId = 1;
    const bdId = 10;

    // S1 starts and acquires sequence
    const seqS1 = await acquireSyncSequence(storeId, bdId);
    expect(seqS1).toBe(1);

    // S2 starts later and acquires sequence
    const seqS2 = await acquireSyncSequence(storeId, bdId);
    expect(seqS2).toBe(2);

    // S2 completes first with newer state (KOT 201 PREPARING)
    const dataS2 = [makeBackendKot(201, storeId, bdId, 'PREPARING')];
    const resS2 = await syncAndReconcileBackendKots(dataS2, storeId, bdId, seqS2, mockDb);
    expect(resS2.applied).toBe(true);
    expect(mockDb.records).toHaveLength(1);
    expect(mockDb.records[0].backendKotId).toBe(201);

    // Reset spies to strictly inspect S1 invocation
    mockDb.transaction.mockClear();
    mockDb.kots.bulkDelete.mockClear();
    mockDb.kots.bulkPut.mockClear();

    // S1 completes later with older state (KOT 101 PREPARING, does not have 201)
    const dataS1 = [makeBackendKot(101, storeId, bdId, 'PREPARING')];
    const resS1 = await syncAndReconcileBackendKots(dataS1, storeId, bdId, seqS1, mockDb);

    // S1 MUST be rejected as STALE_SNAPSHOT
    expect(resS1.applied).toBe(false);
    expect(resS1.reason).toBe('STALE_SNAPSHOT');
    expect(resS1.syncSeq).toBe(1);
    expect(resS1.latestAppliedSeq).toBe(2);

    // State in Dexie must remain S2's state (KOT 201), NOT overwritten by S1
    expect(mockDb.records).toHaveLength(1);
    expect(mockDb.records[0].backendKotId).toBe(201);
  });

  // ─── TEST 2: S1 completes first -> S2 completes later ───
  it('TEST 2: S1 completes first, S2 completes later -> both execute correctly and final state reflects S2', async () => {
    const storeId = 1;
    const bdId = 10;

    const seqS1 = await acquireSyncSequence(storeId, bdId); // 1
    const seqS2 = await acquireSyncSequence(storeId, bdId); // 2

    // S1 completes first
    const dataS1 = [makeBackendKot(101, storeId, bdId, 'PREPARING')];
    const resS1 = await syncAndReconcileBackendKots(dataS1, storeId, bdId, seqS1, mockDb);
    expect(resS1.applied).toBe(true);
    expect(mockDb.records).toHaveLength(1);
    expect(mockDb.records[0].backendKotId).toBe(101);

    // S2 completes later
    const dataS2 = [makeBackendKot(101, storeId, bdId, 'READY'), makeBackendKot(102, storeId, bdId, 'PREPARING')];
    const resS2 = await syncAndReconcileBackendKots(dataS2, storeId, bdId, seqS2, mockDb);
    expect(resS2.applied).toBe(true);
    expect(mockDb.records).toHaveLength(2);

    const kot101 = mockDb.records.find((r: any) => r.backendKotId === 101);
    const kot102 = mockDb.records.find((r: any) => r.backendKotId === 102);
    expect(kot101.status).toBe('READY');
    expect(kot102.status).toBe('PREPARING');
  });

  // ─── TEST 3: Same store + same business day: older response is rejected ───
  it('TEST 3: Same store + same business day -> older response is rejected', async () => {
    const storeId = 2;
    const bdId = 5;

    const seq1 = await acquireSyncSequence(storeId, bdId); // 1
    const seq2 = await acquireSyncSequence(storeId, bdId); // 2
    const seq3 = await acquireSyncSequence(storeId, bdId); // 3

    // Apply seq3 first
    await syncAndReconcileBackendKots([makeBackendKot(301, storeId, bdId)], storeId, bdId, seq3, mockDb);

    // Attempt to apply seq1 and seq2 (older)
    const res1 = await syncAndReconcileBackendKots([makeBackendKot(101, storeId, bdId)], storeId, bdId, seq1, mockDb);
    const res2 = await syncAndReconcileBackendKots([makeBackendKot(201, storeId, bdId)], storeId, bdId, seq2, mockDb);

    expect(res1.applied).toBe(false);
    expect(res1.reason).toBe('STALE_SNAPSHOT');
    expect(res2.applied).toBe(false);
    expect(res2.reason).toBe('STALE_SNAPSHOT');

    // Only 301 is present
    expect(mockDb.records.map((r: any) => r.backendKotId)).toEqual([301]);
  });

  // ─── TEST 4: Different store: Store 1 sequence does not suppress Store 2 sequence ───
  it('TEST 4: Different store -> Store 1 sequence does not suppress Store 2 sequence', async () => {
    const store1 = 1;
    const store2 = 2;
    const bdId = 10;

    // Issue sequence 1, 2, 3 for Store 1 and apply up to 3
    await acquireSyncSequence(store1, bdId);
    await acquireSyncSequence(store1, bdId);
    const seqStore1 = await acquireSyncSequence(store1, bdId); // 3
    await syncAndReconcileBackendKots([makeBackendKot(101, store1, bdId)], store1, bdId, seqStore1, mockDb);

    expect(await getLatestAppliedSyncSequence(getSyncScopeKey(store1, bdId))).toBe(3);
    expect(await getLatestAppliedSyncSequence(getSyncScopeKey(store2, bdId))).toBe(0);

    // Issue sequence 1 for Store 2
    const seqStore2 = await acquireSyncSequence(store2, bdId); // 1
    expect(seqStore2).toBe(1);

    // Store 2 sequence 1 must NOT be suppressed by Store 1 sequence 3!
    const resStore2 = await syncAndReconcileBackendKots([makeBackendKot(201, store2, bdId)], store2, bdId, seqStore2, mockDb);
    expect(resStore2.applied).toBe(true);
    expect(resStore2.syncSeq).toBe(1);

    // Both records exist in isolated stores
    const store1Records = mockDb.records.filter((r: any) => r.store_id === store1);
    const store2Records = mockDb.records.filter((r: any) => r.store_id === store2);
    expect(store1Records).toHaveLength(1);
    expect(store2Records).toHaveLength(1);
  });

  // ─── TEST 5: Different business day: Day 1 sequence does not suppress Day 2 sequence ───
  it('TEST 5: Different business day -> Business Day 1 sequence does not suppress Business Day 2 sequence', async () => {
    const storeId = 1;
    const bd1 = 10;
    const bd2 = 11;

    // Fast-forward Day 1 sequence to 5
    for (let i = 0; i < 4; i++) await acquireSyncSequence(storeId, bd1);
    const seqBd1 = await acquireSyncSequence(storeId, bd1); // 5
    await syncAndReconcileBackendKots([makeBackendKot(101, storeId, bd1)], storeId, bd1, seqBd1, mockDb);

    expect(await getLatestAppliedSyncSequence(getSyncScopeKey(storeId, bd1))).toBe(5);
    expect(await getLatestAppliedSyncSequence(getSyncScopeKey(storeId, bd2))).toBe(0);

    // Issue sequence 1 for Day 2
    const seqBd2 = await acquireSyncSequence(storeId, bd2); // 1
    expect(seqBd2).toBe(1);

    // Day 2 sequence 1 must NOT be suppressed by Day 1 sequence 5!
    const resBd2 = await syncAndReconcileBackendKots([makeBackendKot(201, storeId, bd2)], storeId, bd2, seqBd2, mockDb);
    expect(resBd2.applied).toBe(true);
    expect(resBd2.syncSeq).toBe(1);

    // Day 1 ticket is preserved because sync was scoped to bd2
    expect(mockDb.records).toHaveLength(2);
    expect(mockDb.records.find((r: any) => r.businessDayId === bd1)).toBeDefined();
    expect(mockDb.records.find((r: any) => r.businessDayId === bd2)).toBeDefined();
  });

  // ─── TEST 6: Newer snapshot removes/completes a KOT, older snapshot attempts resurrection ───
  it('TEST 6: Newer snapshot removes a KOT, older snapshot attempts resurrection -> KOT does NOT return', async () => {
    const storeId = 1;
    const bdId = 10;

    // Snapshot 1 starts (has KOT 50)
    const seq1 = await acquireSyncSequence(storeId, bdId); // 1
    const snapshot1 = [makeBackendKot(50, storeId, bdId, 'PREPARING')];

    // Snapshot 2 starts later (KOT 50 is finished/removed from active tickets)
    const seq2 = await acquireSyncSequence(storeId, bdId); // 2
    const snapshot2: any[] = []; // empty: KOT 50 completed and removed

    // Snapshot 2 completes first
    const res2 = await syncAndReconcileBackendKots(snapshot2, storeId, bdId, seq2, mockDb);
    expect(res2.applied).toBe(true);
    expect(mockDb.records.filter((r: any) => r.backendKotId === 50)).toHaveLength(0);

    // Snapshot 1 completes later and attempts to reintroduce KOT 50
    const res1 = await syncAndReconcileBackendKots(snapshot1, storeId, bdId, seq1, mockDb);
    expect(res1.applied).toBe(false);
    expect(res1.reason).toBe('STALE_SNAPSHOT');

    // CRITICAL: KOT 50 does NOT return!
    expect(mockDb.records.filter((r: any) => r.backendKotId === 50)).toHaveLength(0);
  });

  // ─── TEST 7: Duplicate backendKotId reconciliation remains correct ───
  it('TEST 7: Duplicate backendKotId reconciliation remains correct (lower Dexie ID kept, higher pruned)', async () => {
    const storeId = 1;
    const bdId = 10;

    // Pre-populate Dexie with duplicate local rows sharing backendKotId 777 in the same store and day
    const initialDuplicates: OfflineKOT[] = [
      {
        id: 5, // Lower id -> canonical
        orderId: 1005,
        type: 'Walk-in',
        items: '[]',
        notes: '',
        timePlaced: '12:00',
        prepTimeMinutes: 10,
        status: 'PREPARING',
        startTime: '',
        printCount: 0,
        synced: true,
        store_id: storeId,
        businessDayId: bdId,
        backendKotId: 777,
      },
      {
        id: 12, // Higher id -> duplicate to prune
        orderId: 1005,
        type: 'Walk-in',
        items: '[]',
        notes: '',
        timePlaced: '12:00',
        prepTimeMinutes: 10,
        status: 'PREPARING',
        startTime: '',
        printCount: 0,
        synced: true,
        store_id: storeId,
        businessDayId: bdId,
        backendKotId: 777,
      },
    ];

    mockDb = createMockDb(initialDuplicates);

    const incoming = [makeBackendKot(777, storeId, bdId, 'READY')];
    const res = await syncAndReconcileBackendKots(incoming, storeId, bdId, 1, mockDb);
    expect(res.applied).toBe(true);

    // Verify Dexie state: only 1 record with id 5 exists, id 12 was deleted
    expect(mockDb.records).toHaveLength(1);
    expect(mockDb.records[0].id).toBe(5);
    expect(mockDb.records[0].backendKotId).toBe(777);
    expect(mockDb.records[0].status).toBe('READY');
    expect(mockDb.kots.bulkDelete).toHaveBeenCalledWith(expect.arrayContaining([12]));
  });

  // ─── TEST 8: Unsynced local KOTs remain protected ───
  it('TEST 8: Unsynced local KOTs (synced === false) remain protected during reconciliation', async () => {
    const storeId = 1;
    const bdId = 10;

    // Pre-populate Dexie with an offline/unsynced local KOT
    const offlineKot: OfflineKOT = {
      id: 99,
      orderId: 'OFFLINE-99',
      type: 'Walk-in',
      items: '2x Offline Burger',
      notes: 'Customer waiting offline',
      timePlaced: '12:30',
      prepTimeMinutes: 15,
      status: 'NEW',
      startTime: '',
      printCount: 0,
      synced: false, // UNSYNCED LOCAL KOT
      store_id: storeId,
      businessDayId: bdId,
    };

    mockDb = createMockDb([offlineKot]);

    // Backend sync completes with only online tickets (does not have OFFLINE-99)
    const incoming = [makeBackendKot(301, storeId, bdId, 'PREPARING')];
    const res = await syncAndReconcileBackendKots(incoming, storeId, bdId, 1, mockDb);
    expect(res.applied).toBe(true);

    // Verify offline KOT was NOT deleted and is still in Dexie!
    const preserved = mockDb.records.find((r: any) => r.id === 99);
    expect(preserved).toBeDefined();
    expect(preserved.synced).toBe(false);
    expect(preserved.orderId).toBe('OFFLINE-99');

    // bulkDelete was NEVER called with id 99
    expect(mockDb.kots.bulkDelete).not.toHaveBeenCalledWith(expect.arrayContaining([99]));
  });

  // ─── CRITICAL REQUIREMENT: Stale sync is rejected BEFORE destructive reconciliation ───
  it('CRITICAL: Stale synchronization is rejected BEFORE transaction, bulkDelete, or bulkPut are called', async () => {
    const storeId = 1;
    const bdId = 10;

    const seq1 = await acquireSyncSequence(storeId, bdId); // 1
    const seq2 = await acquireSyncSequence(storeId, bdId); // 2

    // Apply seq2
    await syncAndReconcileBackendKots([makeBackendKot(201, storeId, bdId)], storeId, bdId, seq2, mockDb);

    // Clear all spies
    mockDb.transaction.mockClear();
    mockDb.kots.toArray.mockClear();
    mockDb.kots.bulkDelete.mockClear();
    mockDb.kots.bulkPut.mockClear();

    // Now attempt to run stale sync seq1
    const res = await syncAndReconcileBackendKots([makeBackendKot(101, storeId, bdId)], storeId, bdId, seq1, mockDb);

    // Verification of rejection
    expect(res.applied).toBe(false);
    expect(res.reason).toBe('STALE_SNAPSHOT');

    // PROOF: ZERO calls to transaction, toArray, bulkDelete, or bulkPut!
    expect(mockDb.transaction).toHaveBeenCalledTimes(0);
    expect(mockDb.kots.toArray).toHaveBeenCalledTimes(0);
    expect(mockDb.kots.bulkDelete).toHaveBeenCalledTimes(0);
    expect(mockDb.kots.bulkPut).toHaveBeenCalledTimes(0);
  });

  // ─── Task 1 Remediation: Mandatory businessDayId Tests ───
  describe('Task 1: Mandatory businessDayId in sync and scope', () => {
    it('Task 1-D: Missing businessDayId (undefined) -> sync aborts safely with INVALID_BD_IDENTITY and zero writes', async () => {
      mockDb.transaction.mockClear();
      mockDb.kots.bulkDelete.mockClear();
      mockDb.kots.bulkPut.mockClear();

      const res = await syncAndReconcileBackendKots([makeBackendKot(101, 1, 10)], 1, undefined as any, 1, mockDb);
      expect(res.applied).toBe(false);
      expect(res.reason).toBe('INVALID_BD_IDENTITY');

      expect(mockDb.transaction).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkDelete).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkPut).toHaveBeenCalledTimes(0);
    });

    it('Task 1-E: Invalid businessDayId (null, 0, negative, NaN, string, float) -> sync aborts safely', async () => {
      const invalidIds = [null, 0, -1, NaN, '10', 2.5, Infinity];
      for (const invalidBd of invalidIds) {
        mockDb.transaction.mockClear();
        const res = await syncAndReconcileBackendKots([makeBackendKot(101, 1, 10)], 1, invalidBd as any, 1, mockDb);
        expect(res.applied).toBe(false);
        expect(res.reason).toBe('INVALID_BD_IDENTITY');
        expect(mockDb.transaction).toHaveBeenCalledTimes(0);
      }
    });

    it('Task 1-F: Missing or invalid store_id -> sync aborts safely with INVALID_STORE_IDENTITY and zero writes', async () => {
      const invalidStoreIds = [undefined, null, 0, -5, NaN, '1'];
      for (const invalidStore of invalidStoreIds) {
        mockDb.transaction.mockClear();
        const res = await syncAndReconcileBackendKots([makeBackendKot(101, 1, 10)], invalidStore as any, 10, 1, mockDb);
        expect(res.applied).toBe(false);
        expect(res.reason).toBe('INVALID_STORE_IDENTITY');
        expect(mockDb.transaction).toHaveBeenCalledTimes(0);
      }
    });

    it('Task 1-G: Missing business day MUST NOT create or use bd_all fallback (throws error)', () => {
      expect(() => getSyncScopeKey(1, undefined as any)).toThrow(/positive integers/);
      expect(() => getSyncScopeKey(1, null as any)).toThrow(/positive integers/);
      expect(() => getSyncScopeKey(1, 0)).toThrow(/positive integers/);
      expect(() => getSyncScopeKey(undefined as any, 10)).toThrow(/positive integers/);
    });

    it('Task 1-G2: acquireSyncSequence throws if either identity is missing or non-positive', async () => {
      await expect(acquireSyncSequence(1, undefined as any)).rejects.toThrow(/positive integers/);
      await expect(acquireSyncSequence(undefined as any, 10)).rejects.toThrow(/positive integers/);
      await expect(acquireSyncSequence(1, 0)).rejects.toThrow(/positive integers/);
    });
  });

  // ─── Task 4 Remediation: Duplicate Reconciliation Scoped by store_id + businessDayId + backendKotId ───
  describe('Task 4: Scoped Duplicate Reconciliation', () => {
    it('Task 4-A: Same backendKotId + same store + same business day -> duplicate reconciliation is allowed', async () => {
      const storeId = 1;
      const bdId = 10;

      const dupRow1: OfflineKOT = {
        id: 10,
        orderId: 1010,
        type: 'Walk-in',
        items: '[]',
        notes: '',
        timePlaced: '12:00',
        prepTimeMinutes: 10,
        status: 'NEW',
        startTime: '',
        printCount: 0,
        synced: true,
        store_id: storeId,
        businessDayId: bdId,
        backendKotId: 888,
      };
      const dupRow2: OfflineKOT = {
        id: 25,
        orderId: 1010,
        type: 'Walk-in',
        items: '[]',
        notes: '',
        timePlaced: '12:00',
        prepTimeMinutes: 10,
        status: 'NEW',
        startTime: '',
        printCount: 0,
        synced: true,
        store_id: storeId,
        businessDayId: bdId,
        backendKotId: 888,
      };

      mockDb = createMockDb([dupRow1, dupRow2]);

      const res = await syncAndReconcileBackendKots([makeBackendKot(888, storeId, bdId, 'READY')], storeId, bdId, 1, mockDb);
      expect(res.applied).toBe(true);

      // Higher id 25 must be pruned, lower id 10 kept
      expect(mockDb.records).toHaveLength(1);
      expect(mockDb.records[0].id).toBe(10);
      expect(mockDb.records[0].backendKotId).toBe(888);
      expect(mockDb.kots.bulkDelete).toHaveBeenCalledWith(expect.arrayContaining([25]));
    });

    it('Task 4-B: Same backendKotId + DIFFERENT store -> NOT treated as duplicate (NEVER pruned)', async () => {
      const storeA = 1;
      const storeB = 2;
      const bdId = 10;

      // Local Dexie has a ticket from Store B with backendKotId 888
      const storeBRow: OfflineKOT = {
        id: 50,
        orderId: 2050,
        type: 'Walk-in',
        items: '[]',
        notes: '',
        timePlaced: '12:00',
        prepTimeMinutes: 10,
        status: 'PREPARING',
        startTime: '',
        printCount: 0,
        synced: true,
        store_id: storeB, // Foreign store!
        businessDayId: bdId,
        backendKotId: 888,
      };

      mockDb = createMockDb([storeBRow]);

      // Sync runs for Store A with ticket 888
      const res = await syncAndReconcileBackendKots([makeBackendKot(888, storeA, bdId, 'READY')], storeA, bdId, 1, mockDb);
      expect(res.applied).toBe(true);

      // Store B's ticket (id 50) must NOT be pruned or treated as a duplicate!
      const storeBRecord = mockDb.records.find((r: any) => r.id === 50);
      expect(storeBRecord).toBeDefined();
      expect(storeBRecord.store_id).toBe(storeB);
      expect(storeBRecord.backendKotId).toBe(888);

      // Store A's ticket was added as its own record
      const storeARecord = mockDb.records.find((r: any) => r.store_id === storeA);
      expect(storeARecord).toBeDefined();
      expect(storeARecord.backendKotId).toBe(888);

      // bulkDelete was NEVER called with id 50
      expect(mockDb.kots.bulkDelete).not.toHaveBeenCalledWith(expect.arrayContaining([50]));
    });

    it('Task 4-C: Same backendKotId + same store + DIFFERENT business day -> NOT treated as duplicate', async () => {
      const storeId = 1;
      const bdYesterday = 9;
      const bdToday = 10;

      // Local Dexie has yesterday's ticket with backendKotId 888
      const yesterdayRow: OfflineKOT = {
        id: 70,
        orderId: 1070,
        type: 'Walk-in',
        items: '[]',
        notes: '',
        timePlaced: '12:00',
        prepTimeMinutes: 10,
        status: 'READY',
        startTime: '',
        printCount: 0,
        synced: true,
        store_id: storeId,
        businessDayId: bdYesterday, // Yesterday's business day!
        backendKotId: 888,
      };

      mockDb = createMockDb([yesterdayRow]);

      // Today's sync runs with ticket 888 for bdToday
      const res = await syncAndReconcileBackendKots([makeBackendKot(888, storeId, bdToday, 'PREPARING')], storeId, bdToday, 1, mockDb);
      expect(res.applied).toBe(true);

      // Yesterday's ticket (id 70) must NOT be pruned or treated as a duplicate!
      const yesterdayRecord = mockDb.records.find((r: any) => r.id === 70);
      expect(yesterdayRecord).toBeDefined();
      expect(yesterdayRecord.businessDayId).toBe(bdYesterday);

      // Today's ticket was added as its own record
      const todayRecord = mockDb.records.find((r: any) => r.businessDayId === bdToday);
      expect(todayRecord).toBeDefined();
      expect(todayRecord.backendKotId).toBe(888);

      // bulkDelete was NEVER called with id 70
      expect(mockDb.kots.bulkDelete).not.toHaveBeenCalledWith(expect.arrayContaining([70]));
    });
  });

  // ─── Task 2 Remediation: Concurrent Sequence Issuance ───
  describe('Task 2: Concurrent Sequence Issuance Atomic Mutex', () => {
    it('Task 2-A: Concurrent sequence requests within process yield strictly distinct monotonic numbers', async () => {
      const storeId = 1;
      const bdId = 10;

      // Launch 10 concurrent requests simultaneously
      const promises = Array.from({ length: 10 }, () => acquireSyncSequence(storeId, bdId));
      const results = await Promise.all(promises);

      // Must be 10 unique numbers from 1 to 10
      const unique = new Set(results);
      expect(unique.size).toBe(10);
      expect(Math.min(...results)).toBe(1);
      expect(Math.max(...results)).toBe(10);
    });

    it('Task 2-B: Concurrent sequence requests for different stores do not block each other', async () => {
      const p1 = acquireSyncSequence(1, 10);
      const p2 = acquireSyncSequence(2, 10);

      const [seqStore1, seqStore2] = await Promise.all([p1, p2]);
      expect(seqStore1).toBe(1);
      expect(seqStore2).toBe(1);
    });
  });

  // ─── Remediation Batch 2: Codex Findings (Findings 2, 3, 4, 5) ───
  describe('Remediation Batch 2: Codex Findings (Findings 2, 3, 4, 5)', () => {
    // Finding 2 / Test D: Unsupported browser does not silently use an unsafe cross-tab fallback
    it('Finding 2 / Test D: Browser without Web Locks fails closed safely and refuses unsafe cross-tab lock', async () => {
      // Mock window and document to simulate a browser environment
      const origWinDesc = Object.getOwnPropertyDescriptor(globalThis, 'window');
      const origNavDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
      try {
        Object.defineProperty(globalThis, 'window', {
          value: { document: {} },
          configurable: true,
          writable: true,
        });
        Object.defineProperty(globalThis, 'navigator', {
          value: { locks: undefined }, // Web Locks NOT supported
          configurable: true,
          writable: true,
        });

        // withCrossTabLock must throw and refuse lock
        await expect(withCrossTabLock('test_lock', () => 'data')).rejects.toThrow(
          /Web Locks API.*is required for cross-tab synchronization in browser environments/
        );

        // acquireSyncSequence must fail closed
        await expect(acquireSyncSequence(1, 10)).rejects.toThrow(
          /Web Locks API.*is required for cross-tab synchronization/
        );

        // syncAndReconcileBackendKots safely returns UNSUPPORTED_BROWSER_LOCKS without executing writes
        const res = await syncAndReconcileBackendKots([makeBackendKot(101, 1, 10)], 1, 10, 1, mockDb);
        expect(res.applied).toBe(false);
        expect(res.reason).toBe('UNSUPPORTED_BROWSER_LOCKS');
        expect(mockDb.transaction).toHaveBeenCalledTimes(0);
      } finally {
        if (origWinDesc) Object.defineProperty(globalThis, 'window', origWinDesc);
        else delete (globalThis as any).window;

        if (origNavDesc) Object.defineProperty(globalThis, 'navigator', origNavDesc);
        else delete (globalThis as any).navigator;
      }
    });

    // Finding 4 / Test H: Same backendKotId across different stores is NEVER mapped together
    it('Finding 4 / Test H: Same backendKotId across different stores is never mapped together (no unscoped alias)', () => {
      // Pre-populate map with Store 1, Day 10, backendKotId 100 pointing to Dexie row 55
      const primaryLocalMap = new Map<string, number>([
        ['1_10_100', 55]
      ]);

      // Incoming KOT has same backendKotId 100, but belongs to Store 2, Day 10
      const store2Kot = makeBackendKot(100, 2, 10);
      const mapped = mapBackendKotsToDexie([store2Kot], 2, 10, primaryLocalMap);

      // Must NOT reuse Store 1's local row id (55)
      expect(mapped).toHaveLength(1);
      expect(mapped[0].id).toBeUndefined(); // Gets undefined for Dexie auto-increment, NOT 55!
      expect(mapped[0].store_id).toBe(2);
      expect(mapped[0].backendKotId).toBe(100);
    });

    // Finding 4 / Test I: Same backendKotId across different business days is NEVER mapped together
    it('Finding 4 / Test I: Same backendKotId across different business days is never mapped together', () => {
      // Pre-populate map with Store 1, Day 10, backendKotId 100 pointing to Dexie row 55
      const primaryLocalMap = new Map<string, number>([
        ['1_10_100', 55]
      ]);

      // Incoming KOT has same backendKotId 100, but belongs to Store 1, Day 11 (different day!)
      const day11Kot = makeBackendKot(100, 1, 11);
      const mapped = mapBackendKotsToDexie([day11Kot], 1, 11, primaryLocalMap);

      // Must NOT reuse Day 10's local row id (55)
      expect(mapped).toHaveLength(1);
      expect(mapped[0].id).toBeUndefined();
      expect(mapped[0].businessDayId).toBe(11);
      expect(mapped[0].backendKotId).toBe(100);
    });

    // Finding 5 / Test J: Inner stale transaction rejection returns applied: false with STALE_SNAPSHOT
    it('Finding 5 / Test J: Inner stale transaction detection returns applied: false with STALE_SNAPSHOT', async () => {
      const storeId = 1;
      const bdId = 10;
      const scopeKey = getSyncScopeKey(storeId, bdId);

      // Simulate: caller acquires sequence 2
      const seq2 = 2;

      // Mock database transaction to simulate a concurrent tab applying sequence 5 right after
      // the initial check passed, before the transaction ran
      const customMockDb = {
        kots: {
          toArray: vi.fn().mockResolvedValue([]),
          bulkDelete: vi.fn().mockResolvedValue(undefined),
          bulkPut: vi.fn().mockResolvedValue(undefined),
        },
        transaction: vi.fn().mockImplementation(async (_mode: string, _table: any, callback: () => Promise<void>) => {
          // Tab 2 finishes and applies sequence 5 right before Tab 1's transaction executes
          await setLatestAppliedSyncSequence(scopeKey, 5);
          return await callback();
        }),
      };

      const incoming = [makeBackendKot(999, storeId, bdId)];
      const res = await syncAndReconcileBackendKots(incoming, storeId, bdId, seq2, customMockDb as any);

      // CRITICAL (Finding 5): Must return applied: false, NOT applied: true!
      expect(res.applied).toBe(false);
      expect(res.reason).toBe('STALE_SNAPSHOT');
      expect(res.syncSeq).toBe(2);
      expect(res.latestAppliedSeq).toBe(5);

      // Verify ZERO bulkDelete and ZERO bulkPut inside the stale transaction
      expect(customMockDb.kots.bulkDelete).toHaveBeenCalledTimes(0);
      expect(customMockDb.kots.bulkPut).toHaveBeenCalledTimes(0);
    });

    // Finding 3 / Tests E, F, G: Safe abort on business-day failure / unverified identity
    it('Finding 3 / Tests E, F, G: syncAndReconcileBackendKots safely refuses sync when businessDayId is null or missing', async () => {
      mockDb.transaction.mockClear();
      mockDb.kots.bulkDelete.mockClear();
      mockDb.kots.bulkPut.mockClear();

      // If businessDayId cannot be authoritatively resolved (e.g. backend error, 404, or null)
      const res = await syncAndReconcileBackendKots([makeBackendKot(101, 1, 10)], 1, null as any, 1, mockDb);
      expect(res.applied).toBe(false);
      expect(res.reason).toBe('INVALID_BD_IDENTITY');

      // No destructive operations
      expect(mockDb.transaction).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkDelete).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkPut).toHaveBeenCalledTimes(0);
    });
  });

  // ─── Remediation Batch 4: IndexedDB Failure Must Fail Closed ───
  describe('Remediation Batch 4: IndexedDB Failure Must Fail Closed', () => {
    let origWinDesc: PropertyDescriptor | undefined;
    let origNavDesc: PropertyDescriptor | undefined;
    let origIdbDesc: PropertyDescriptor | undefined;

    beforeEach(() => {
      closeSeqDb();
      resetSyncSequences();
      origWinDesc = Object.getOwnPropertyDescriptor(globalThis, 'window');
      origNavDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
      origIdbDesc = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
    });

    afterEach(() => {
      closeSeqDb();
      resetSyncSequences();
      if (origWinDesc) Object.defineProperty(globalThis, 'window', origWinDesc);
      else delete (globalThis as any).window;

      if (origNavDesc) Object.defineProperty(globalThis, 'navigator', origNavDesc);
      else delete (globalThis as any).navigator;

      if (origIdbDesc) Object.defineProperty(globalThis, 'indexedDB', origIdbDesc);
      else delete (globalThis as any).indexedDB;
    });

    function setupBrowserEnvironment(mockIndexedDb: any) {
      Object.defineProperty(globalThis, 'window', {
        value: { document: {} },
        configurable: true,
        writable: true,
      });
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          locks: {
            request: async (_name: string, fn: () => Promise<any>) => await fn(),
          },
        },
        configurable: true,
        writable: true,
      });
      Object.defineProperty(globalThis, 'indexedDB', {
        value: mockIndexedDb,
        configurable: true,
        writable: true,
      });
    }

    it('Issue 1-A: Browser environment with IndexedDB unavailable fails closed with SYNC_STORAGE_UNAVAILABLE', async () => {
      // IndexedDB is undefined in browser environment
      setupBrowserEnvironment(undefined);

      // 1. acquireSyncSequence must fail with SYNC_STORAGE_UNAVAILABLE
      await expect(acquireSyncSequence(1, 10)).rejects.toThrow(/SYNC_STORAGE_UNAVAILABLE/);

      // 2. getLatestAppliedSyncSequence must fail with SYNC_STORAGE_UNAVAILABLE
      await expect(getLatestAppliedSyncSequence('store_1_bd_10')).rejects.toThrow(/SYNC_STORAGE_UNAVAILABLE/);

      // 3. syncAndReconcileBackendKots must return applied: false with SYNC_STORAGE_UNAVAILABLE
      mockDb.transaction.mockClear();
      mockDb.kots.bulkDelete.mockClear();
      mockDb.kots.bulkPut.mockClear();

      const res = await syncAndReconcileBackendKots([makeBackendKot(101, 1, 10)], 1, 10, undefined, mockDb);
      expect(res.applied).toBe(false);
      expect(res.reason).toBe('SYNC_STORAGE_UNAVAILABLE');

      // 4. Verify ZERO Dexie transaction, bulkDelete, or bulkPut occurred
      expect(mockDb.transaction).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkDelete).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkPut).toHaveBeenCalledTimes(0);
    });

    it('Issue 1-B: Browser environment with IndexedDB read failure fails closed with SYNC_STORAGE_UNAVAILABLE', async () => {
      const failingReadIdb = {
        open: () => {
          const req: any = {};
          setTimeout(() => {
            req.result = {
              transaction: () => {
                const tx: any = {
                  objectStore: () => ({
                    get: () => {
                      const getReq: any = {};
                      setTimeout(() => {
                        getReq.error = new Error('Disk IO read failure');
                        getReq.onerror?.(new Event('error'));
                      }, 0);
                      return getReq;
                    },
                    put: () => ({}),
                  }),
                  onerror: null,
                };
                return tx;
              },
              close: () => {},
            };
            req.onsuccess?.(new Event('success'));
          }, 0);
          return req;
        },
      };

      setupBrowserEnvironment(failingReadIdb);

      // 1. acquireSyncSequence must reject with SYNC_STORAGE_UNAVAILABLE on read failure
      await expect(acquireSyncSequence(1, 10)).rejects.toThrow(/SYNC_STORAGE_UNAVAILABLE/);

      // 2. syncAndReconcileBackendKots must return applied: false with SYNC_STORAGE_UNAVAILABLE
      mockDb.transaction.mockClear();
      mockDb.kots.bulkDelete.mockClear();
      mockDb.kots.bulkPut.mockClear();

      const res = await syncAndReconcileBackendKots([makeBackendKot(101, 1, 10)], 1, 10, undefined, mockDb);
      expect(res.applied).toBe(false);
      expect(res.reason).toBe('SYNC_STORAGE_UNAVAILABLE');

      // 3. Verify ZERO Dexie mutations
      expect(mockDb.transaction).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkDelete).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkPut).toHaveBeenCalledTimes(0);
    });

    it('Issue 1-C: Browser environment with IndexedDB write failure fails closed with SYNC_STORAGE_UNAVAILABLE', async () => {
      const failingWriteIdb = {
        open: () => {
          const req: any = {};
          setTimeout(() => {
            req.result = {
              transaction: () => {
                const tx: any = {
                  objectStore: () => ({
                    get: () => {
                      const getReq: any = { result: 0 };
                      setTimeout(() => {
                        getReq.onsuccess?.(new Event('success'));
                      }, 0);
                      return getReq;
                    },
                    put: () => {
                      setTimeout(() => {
                        tx.error = new Error('Storage quota exceeded');
                        tx.onerror?.(new Event('error'));
                      }, 0);
                    },
                  }),
                  onerror: null,
                  oncomplete: null,
                  onabort: null,
                };
                return tx;
              },
              close: () => {},
            };
            req.onsuccess?.(new Event('success'));
          }, 0);
          return req;
        },
      };

      setupBrowserEnvironment(failingWriteIdb);

      // 1. acquireSyncSequence must reject with SYNC_STORAGE_UNAVAILABLE on write failure
      await expect(acquireSyncSequence(1, 10)).rejects.toThrow(/SYNC_STORAGE_UNAVAILABLE/);

      // 2. syncAndReconcileBackendKots must return applied: false with SYNC_STORAGE_UNAVAILABLE
      mockDb.transaction.mockClear();
      mockDb.kots.bulkDelete.mockClear();
      mockDb.kots.bulkPut.mockClear();

      const res = await syncAndReconcileBackendKots([makeBackendKot(101, 1, 10)], 1, 10, undefined, mockDb);
      expect(res.applied).toBe(false);
      expect(res.reason).toBe('SYNC_STORAGE_UNAVAILABLE');

      // 3. Verify ZERO Dexie mutations
      expect(mockDb.transaction).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkDelete).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkPut).toHaveBeenCalledTimes(0);
    });

    it('Issue 1-D: Multiple browser tabs cannot receive duplicate sequences when storage is unavailable', async () => {
      // Simulate storage unavailable across tabs
      setupBrowserEnvironment(undefined);

      const tab1Promise = acquireSyncSequence(1, 10);
      const tab2Promise = acquireSyncSequence(1, 10);

      // Both must reject with SYNC_STORAGE_UNAVAILABLE
      await expect(tab1Promise).rejects.toThrow(/SYNC_STORAGE_UNAVAILABLE/);
      await expect(tab2Promise).rejects.toThrow(/SYNC_STORAGE_UNAVAILABLE/);

      // Neither tab received a sequence, preventing duplicate sequence issuance
      mockDb.transaction.mockClear();
      mockDb.kots.bulkDelete.mockClear();
      mockDb.kots.bulkPut.mockClear();

      const resTab1 = await syncAndReconcileBackendKots([makeBackendKot(101, 1, 10)], 1, 10, undefined, mockDb);
      const resTab2 = await syncAndReconcileBackendKots([makeBackendKot(102, 1, 10)], 1, 10, undefined, mockDb);

      expect(resTab1.applied).toBe(false);
      expect(resTab1.reason).toBe('SYNC_STORAGE_UNAVAILABLE');
      expect(resTab2.applied).toBe(false);
      expect(resTab2.reason).toBe('SYNC_STORAGE_UNAVAILABLE');

      expect(mockDb.transaction).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkDelete).toHaveBeenCalledTimes(0);
      expect(mockDb.kots.bulkPut).toHaveBeenCalledTimes(0);
    });

    it('Issue 1-E: Post-Dexie sequence failure leaves a durable recovery marker and blocks older snapshots', async () => {
      const values = new Map<string, unknown>();
      let failAppliedWrite = true;

      const recoveryIdb = {
        open: () => {
          const req: any = {};
          setTimeout(() => {
            req.result = {
              objectStoreNames: { contains: () => true },
              createObjectStore: () => {},
              transaction: (_name: string, mode: string) => {
                const tx: any = {
                  error: null,
                  oncomplete: null,
                  onerror: null,
                  onabort: null,
                };
                const store = {
                  get: (key: string) => {
                    const getReq: any = { result: values.get(key) };
                    setTimeout(() => getReq.onsuccess?.(new Event('success')), 0);
                    return getReq;
                  },
                  put: (value: unknown, key: string) => {
                    if (mode === 'readwrite' && key === 'applied_store_1_bd_10' && failAppliedWrite) {
                      failAppliedWrite = false;
                      setTimeout(() => {
                        tx.error = new Error('Injected post-commit applied-sequence failure');
                        tx.onerror?.(new Event('error'));
                      }, 0);
                      return;
                    }
                    values.set(key, value);
                    setTimeout(() => tx.oncomplete?.(new Event('complete')), 0);
                  },
                  delete: (key: string) => {
                    values.delete(key);
                    setTimeout(() => tx.oncomplete?.(new Event('complete')), 0);
                  },
                };
                tx.objectStore = () => store;
                return tx;
              },
              close: () => {},
            };
            req.onsuccess?.(new Event('success'));
          }, 0);
          return req;
        },
      };

      setupBrowserEnvironment(recoveryIdb);

      const incoming = [makeBackendKot(701, 1, 10, 'PREPARING')];
      const firstResult = await syncAndReconcileBackendKots(incoming, 1, 10, 1, mockDb);

      // Dexie committed before the injected applied-sequence write failed.
      expect(firstResult.applied).toBe(false);
      expect(firstResult.reason).toBe('SYNC_STORAGE_UNAVAILABLE');
      expect(mockDb.records.map(r => r.backendKotId)).toEqual([701]);
      expect(await getLatestAppliedSyncSequence('store_1_bd_10')).toBe(0);

      // The durable pending marker rejects an older snapshot even though the
      // applied sequence write was not yet completed.
      const olderResult = await syncAndReconcileBackendKots(
        [makeBackendKot(700, 1, 10, 'PREPARING')],
        1,
        10,
        0,
        mockDb,
      );
      expect(olderResult.applied).toBe(false);
      expect(olderResult.reason).toBe('STALE_SNAPSHOT');
      expect(mockDb.records.map(r => r.backendKotId)).toEqual([701]);

      // Retrying the exact pending sequence completes the durable commit.
      const retryResult = await syncAndReconcileBackendKots(incoming, 1, 10, 1, mockDb);
      expect(retryResult.applied).toBe(true);
      expect(await getLatestAppliedSyncSequence('store_1_bd_10')).toBe(1);
      expect(mockDb.records.map(r => r.backendKotId)).toEqual([701]);
    });
  });
});
