// Real Browser Multi-Tab Concurrency Test for Agent 07 Sync & Lock Mechanism
// Exercises two real browser contexts/tabs sharing the same origin and storage scope.
// Loads and executes the ACTUAL production implementation from /src/db.ts via Vite.

const path = require('path');
const puppeteer = require('../e2e-demo/node_modules/puppeteer');

const PORT = 51740;
const ORIGIN = `http://localhost:${PORT}`;

async function runTest() {
  console.log('--- STARTING REAL BROWSER MULTI-TAB TEST (EXECUTING PRODUCTION db.ts) ---');

  // Start Vite dev server programmatically to serve the actual production /src/db.ts
  const { createServer } = await import('vite');
  const viteServer = await createServer({
    root: path.resolve(__dirname),
    server: { port: PORT },
    logLevel: 'error'
  });
  await viteServer.listen();
  console.log(`[Vite Server] Serving production codebase on ${ORIGIN}`);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const tab1 = await browser.newPage();
    const tab2 = await browser.newPage();

    tab1.on('console', msg => console.log('[Browser Tab 1]', msg.text()));
    tab2.on('console', msg => console.log('[Browser Tab 2]', msg.text()));

    // Navigate both tabs to the harness page which imports production /src/db.ts
    await tab1.goto(`${ORIGIN}/test-harness.html`, { waitUntil: 'networkidle0' });
    await tab2.goto(`${ORIGIN}/test-harness.html`, { waitUntil: 'networkidle0' });

    // Wait until production /src/db.ts has loaded and initialized in both tabs
    await tab1.waitForFunction(() => window.__D4U_READY__ === true);
    await tab2.waitForFunction(() => window.__D4U_READY__ === true);
    console.log('[Browser] Two tabs loaded and sharing origin ' + ORIGIN);

    // Verify production module presence
    const isSupported = await tab1.evaluate(() => window.D4U_SYNC.isWebLocksSupported());
    console.log(`[Browser] Web Locks API supported in Tab 1: ${isSupported}`);
    if (!isSupported) {
      throw new Error('Web Locks API expected in Chrome but reported false');
    }

    // Reset sequences and Dexie state in production DB
    await tab1.evaluate(async () => {
      window.D4U_SYNC.resetSyncSequences();
      localStorage.clear();
      await window.D4U_SYNC.db.kots.clear();
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Concurrently request sequence numbers from Tab 1 and Tab 2
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 1] Concurrently requesting sequence from Tab 1 and Tab 2 (Store 1, Day 10)...');
    const [seq1, seq2] = await Promise.all([
      tab1.evaluate(() => window.D4U_SYNC.acquireSyncSequence(1, 10)),
      tab2.evaluate(() => window.D4U_SYNC.acquireSyncSequence(1, 10))
    ]);

    console.log(`  -> Tab 1 sequence: ${seq1}`);
    console.log(`  -> Tab 2 sequence: ${seq2}`);

    if (seq1 === seq2) {
      throw new Error(`RACE CONDITION DETECTED! Both tabs received sequence ${seq1}`);
    }
    const setOfTwo = new Set([seq1, seq2]);
    if (!setOfTwo.has(1) || !setOfTwo.has(2)) {
      throw new Error(`Expected sequences 1 and 2, but received: ${seq1}, ${seq2}`);
    }
    console.log('  -> PASS: Two tabs concurrently received distinct monotonic sequences: ' + [seq1, seq2].join(', '));

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Rapid high-concurrency cross-tab burst (10 concurrent requests)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Interleaved concurrent burst: 5 from Tab 1, 5 from Tab 2...');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(tab1.evaluate(() => window.D4U_SYNC.acquireSyncSequence(1, 10)));
      promises.push(tab2.evaluate(() => window.D4U_SYNC.acquireSyncSequence(1, 10)));
    }
    const burstResults = await Promise.all(promises);
    console.log('  -> Burst issued sequences:', burstResults.sort((a, b) => a - b));

    const burstSet = new Set(burstResults);
    if (burstSet.size !== 10) {
      throw new Error(`Burst collision detected! Expected 10 unique sequences, got ${burstSet.size}`);
    }
    for (let expected = 3; expected <= 12; expected++) {
      if (!burstSet.has(expected)) {
        throw new Error(`Missing expected sequence ${expected} in burst results`);
      }
    }
    console.log('  -> PASS: All 10 burst requests received strictly distinct, monotonic sequences (3 through 12)');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Stale response rejection across tabs using production syncAndReconcileBackendKots
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Stale response rejection across tabs using production syncAndReconcileBackendKots...');
    // Tab 2 acquires sequence 13 (newer)
    const seqNew = await tab2.evaluate(() => window.D4U_SYNC.acquireSyncSequence(1, 10)); // 13
    console.log(`  -> Tab 2 acquired newer sequence: ${seqNew}`);

    // Tab 2 applies snapshot with KOT 999
    const resTab2 = await tab2.evaluate(async (seq) => {
      return await window.D4U_SYNC.syncAndReconcileBackendKots(
        [{
          id: 999,
          order_id: 1999,
          store_id: 1,
          business_day_id: 10,
          status: 'PREPARING',
          items: '[]',
          createdAt: new Date().toISOString()
        }],
        1,
        10,
        seq
      );
    }, seqNew);

    console.log('  -> Tab 2 applied result:', resTab2);
    if (!resTab2.applied || resTab2.reason !== 'SUCCESS') {
      throw new Error('Tab 2 newer snapshot failed to apply: ' + JSON.stringify(resTab2));
    }

    // Now Tab 1 attempts to apply an older sequence (e.g. sequence 2, which was issued earlier)
    const seqOld = 2;
    console.log(`  -> Tab 1 attempts to apply older sequence ${seqOld} (latest applied is ${seqNew})...`);

    const resTab1 = await tab1.evaluate(async (seq) => {
      return await window.D4U_SYNC.syncAndReconcileBackendKots(
        [{
          id: 888,
          order_id: 1888,
          store_id: 1,
          business_day_id: 10,
          status: 'PREPARING',
          items: '[]',
          createdAt: new Date().toISOString()
        }],
        1,
        10,
        seq
      );
    }, seqOld);

    console.log('  -> Tab 1 stale result:', resTab1);
    if (resTab1.applied !== false || resTab1.reason !== 'STALE_SNAPSHOT') {
      throw new Error('Tab 1 stale request was NOT rejected! Result: ' + JSON.stringify(resTab1));
    }
    console.log('  -> PASS: Stale snapshot was rejected with applied: false and reason: STALE_SNAPSHOT!');

    // Verify Dexie state: KOT 999 is present, KOT 888 was NOT applied
    const dexieRecords = await tab1.evaluate(async () => {
      return await window.D4U_SYNC.db.kots.toArray();
    });
    console.log('  -> Local Dexie records:', dexieRecords.map(r => ({ id: r.id, backendKotId: r.backendKotId, status: r.status })));
    if (dexieRecords.length !== 1 || dexieRecords[0].backendKotId !== 999) {
      throw new Error('Dexie state corrupted! Expected only KOT 999, got: ' + JSON.stringify(dexieRecords));
    }
    console.log('  -> PASS: Dexie contains only newer KOT 999. Older KOT 888 was never applied.');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Scoped Isolation across stores using production sync
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 4] Cross-store duplicate isolation in real browser...');
    // Seed Store 2 / Day 10 ticket with backendKotId 999
    await tab1.evaluate(async () => {
      await window.D4U_SYNC.db.kots.add({
        id: 500,
        backendKotId: 999,
        store_id: 2, // Store 2!
        businessDayId: 10,
        status: 'READY',
        synced: true,
        orderId: 2500,
        type: 'Walk-in',
        items: '[]',
        notes: '',
        timePlaced: '12:00',
        prepTimeMinutes: 10,
        startTime: '',
        printCount: 0
      });
    });

    // Tab 2 runs sync for Store 1 with backendKotId 999 (newer seq)
    const seqStore1New = await tab2.evaluate(() => window.D4U_SYNC.acquireSyncSequence(1, 10));
    await tab2.evaluate(async (seq) => {
      return await window.D4U_SYNC.syncAndReconcileBackendKots(
        [{
          id: 999,
          order_id: 1999,
          store_id: 1,
          business_day_id: 10,
          status: 'SERVED',
          items: '[]',
          createdAt: new Date().toISOString()
        }],
        1,
        10,
        seq
      );
    }, seqStore1New);

    const allRecords = await tab2.evaluate(async () => {
      return await window.D4U_SYNC.db.kots.toArray();
    });
    console.log('  -> All Dexie records after Store 1 sync:', allRecords.map(r => ({ id: r.id, store_id: r.store_id, backendKotId: r.backendKotId, status: r.status })));

    const store2Record = allRecords.find(r => r.store_id === 2);
    if (!store2Record || store2Record.id !== 500) {
      throw new Error('Store 2 record was erroneously pruned or overwritten by Store 1 sync!');
    }
    console.log('  -> PASS: Store 2 record remained intact and was NOT pruned during Store 1 sync.');

    // ─────────────────────────────────────────────────────────────
    // TEST 5 (Finding 2 / Requirement B): Disabling Web Locks fails closed safely
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 5] Verifying failure/safe abort when Web Locks is disabled in browser...');
    const tab3 = await browser.newPage();
    await tab3.goto(`${ORIGIN}/test-harness.html`, { waitUntil: 'networkidle0' });
    await tab3.waitForFunction(() => window.__D4U_READY__ === true);

    // Disable navigator.locks on tab3
    await tab3.evaluate(() => {
      Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true });
    });

    const isLocksSupportedNow = await tab3.evaluate(() => window.D4U_SYNC.isWebLocksSupported());
    console.log(`  -> Web Locks on Tab 3 after disabling: ${isLocksSupportedNow}`);
    if (isLocksSupportedNow !== false) {
      throw new Error('Failed to disable Web Locks on Tab 3');
    }

    // acquireSyncSequence must fail closed (throw Error)
    const acquireError = await tab3.evaluate(async () => {
      try {
        await window.D4U_SYNC.acquireSyncSequence(1, 10);
        return null;
      } catch (e) {
        return e.message;
      }
    });

    console.log('  -> acquireSyncSequence error with Web Locks disabled:', acquireError);
    if (!acquireError || !acquireError.includes('Web Locks API')) {
      throw new Error('acquireSyncSequence did NOT fail closed when Web Locks was disabled!');
    }

    // syncAndReconcileBackendKots must return UNSUPPORTED_BROWSER_LOCKS
    const syncResWithoutLocks = await tab3.evaluate(async () => {
      return await window.D4U_SYNC.syncAndReconcileBackendKots(
        [{ id: 777, order_id: 1777, store_id: 1, business_day_id: 10, status: 'NEW' }],
        1,
        10,
        1
      );
    });

    console.log('  -> syncAndReconcileBackendKots result with Web Locks disabled:', syncResWithoutLocks);
    if (syncResWithoutLocks.applied !== false || syncResWithoutLocks.reason !== 'UNSUPPORTED_BROWSER_LOCKS') {
      throw new Error('syncAndReconcileBackendKots did NOT safely abort when Web Locks was disabled!');
    }
    console.log('  -> PASS: When Web Locks is disabled, system fails closed safely and refuses unsafe cross-tab operation.');

    await tab3.close();

    // ─────────────────────────────────────────────────────────────
    // TEST 6 (Remediation Batch 3 Tasks 3 & 8): Real Overlapping TOCTOU Race Test
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 6] Real Overlapping TOCTOU Race Test with Deterministic Barrier...');
    // In this test:
    // Tab B has newer sequence 11.
    // Tab A has older sequence 10.
    // We force Tab B into its critical section (holding the reconciliation lock).
    // Tab B has NOT yet recorded latest sequence 11 or committed Dexie.
    // While Tab B is paused at the gate, Tab A attempts reconciliation with sequence 10.
    // Tab A MUST be serialized behind Tab B.
    // When Tab B finishes and commits, Tab A must be rejected with STALE_SNAPSHOT,
    // and Tab A must NOT perform any destructive or stale writes to Dexie.

    const testStoreId = 1;
    const testBdId = 99;

    // 1. Reset sequences and seed Dexie with an initial ticket
    await tab1.evaluate(async (storeId, bdId) => {
      window.D4U_SYNC.resetSyncSequences();
      await window.D4U_SYNC.clearSyncSequencesIdb();
      await window.D4U_SYNC.db.kots.clear();
      await window.D4U_SYNC.db.kots.add({
        id: 100,
        backendKotId: 100,
        store_id: storeId,
        businessDayId: bdId,
        status: 'INITIAL_STATE',
        synced: true,
        orderId: 1100,
        type: 'Walk-in',
        items: '[]',
        notes: '',
        timePlaced: '10:00',
        prepTimeMinutes: 10,
        startTime: '',
        printCount: 0
      });
    }, testStoreId, testBdId);

    await tab2.evaluate(() => {
      window.D4U_SYNC.resetSyncSequences();
    });

    // 2. Set deterministic barrier test hook in Tab B
    await tab2.evaluate(() => {
      window.__TAB_B_IN_CRITICAL_SECTION__ = false;
      window.__RELEASE_TAB_B__ = null;
      window.D4U_SYNC.setTestHookDuringReconciliation(async () => {
        window.__TAB_B_IN_CRITICAL_SECTION__ = true;
        // Deterministic promise gate: Tab B will wait here until explicitly resolved by runner
        await new Promise((resolve) => {
          window.__RELEASE_TAB_B__ = resolve;
        });
      });
    });

    console.log('  -> Tab B test hook configured with deterministic barrier.');

    // 3. Tab B initiates reconciliation with sequence 11 (newer)
    const seqB = 11;
    const tabBPromise = tab2.evaluate(async (storeId, bdId, seq) => {
      return await window.D4U_SYNC.syncAndReconcileBackendKots(
        [{
          id: 100,
          order_id: 1100,
          store_id: storeId,
          business_day_id: bdId,
          status: 'COMMITTED_BY_TAB_B_SEQ_11',
          items: '[]',
          createdAt: new Date().toISOString()
        }],
        storeId,
        bdId,
        seq
      );
    }, testStoreId, testBdId, seqB);

    // 4. Wait for Tab B to enter critical section
    await tab2.waitForFunction(() => window.__TAB_B_IN_CRITICAL_SECTION__ === true);
    console.log('  -> Tab B is confirmed INSIDE critical section (holding reconciliation lock, NOT yet committed).');

    // 5. While Tab B is in critical section, Tab A initiates reconciliation with sequence 10 (stale)
    const seqA = 10;
    console.log(`  -> Tab A initiating reconciliation with older sequence ${seqA} while Tab B is active...`);
    const tabAPromise = tab1.evaluate(async (storeId, bdId, seq) => {
      return await window.D4U_SYNC.syncAndReconcileBackendKots(
        [{
          id: 100,
          order_id: 1100,
          store_id: storeId,
          business_day_id: bdId,
          status: 'STALE_OVERWRITE_FROM_TAB_A_SEQ_10',
          items: '[]',
          createdAt: new Date().toISOString()
        }],
        storeId,
        bdId,
        seq
      );
    }, testStoreId, testBdId, seqA);

    // Verify Tab B's gate is still holding (Tab A cannot rush in and overwrite)
    const interimRecords = await tab1.evaluate(async () => {
      return await window.D4U_SYNC.db.kots.toArray();
    });
    console.log('  -> Interim Dexie state while Tab B is gated:', interimRecords[0].status);
    if (interimRecords[0].status !== 'INITIAL_STATE') {
      throw new Error(`Unexpected interim Dexie write before Tab B released! Status: ${interimRecords[0].status}`);
    }

    // 6. Release Tab B's barrier gate so Tab B can proceed to Dexie transaction and commit
    console.log('  -> Releasing Tab B barrier gate...');
    await tab2.evaluate(() => {
      if (typeof window.__RELEASE_TAB_B__ === 'function') {
        window.__RELEASE_TAB_B__();
      }
    });

    // 7. Await both operations
    const [resB, resA] = await Promise.all([tabBPromise, tabAPromise]);
    console.log('  -> Tab B result:', resB);
    console.log('  -> Tab A result:', resA);

    // Tab B MUST succeed
    if (!resB.applied || resB.reason !== 'SUCCESS' || resB.syncSeq !== 11) {
      throw new Error('Tab B reconciliation failed to apply: ' + JSON.stringify(resB));
    }

    // Tab A MUST be rejected with STALE_SNAPSHOT
    if (resA.applied !== false || resA.reason !== 'STALE_SNAPSHOT') {
      throw new Error('TOCTOU FAILURE! Tab A was NOT rejected! Result: ' + JSON.stringify(resA));
    }
    if (resA.latestAppliedSeq !== 11) {
      throw new Error(`Expected Tab A to see latestAppliedSeq 11, but saw: ${resA.latestAppliedSeq}`);
    }
    console.log('  -> PASS: Tab A was rejected with applied: false and reason: STALE_SNAPSHOT (saw latest sequence 11).');

    // 8. Verify Dexie state contains Tab B's write, NEVER Tab A's stale overwrite
    const finalRecords = await tab1.evaluate(async () => {
      return await window.D4U_SYNC.db.kots.toArray();
    });
    console.log('  -> Final Dexie records:', finalRecords.map(r => ({ id: r.id, status: r.status })));
    if (finalRecords.length !== 1 || finalRecords[0].status !== 'COMMITTED_BY_TAB_B_SEQ_11') {
      throw new Error(`Dexie contains stale data! Expected COMMITTED_BY_TAB_B_SEQ_11, got: ${finalRecords[0]?.status}`);
    }
    console.log('  -> PASS: Dexie contains exclusively Tab B\'s committed write. Tab A was completely prevented from writing.');

    // 9. Clean up test hook
    await tab2.evaluate(() => {
      window.D4U_SYNC.setTestHookDuringReconciliation(null);
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 7: IndexedDB Failure Fails Closed in Real Multi-Tab Browser
    // ─────────────────────────────────────────────────────────────
    console.log('\n[TEST 7] Verifying IndexedDB failure fails closed across two browser tabs...');

    // Simulate IndexedDB unavailable across both tabs
    await tab1.evaluate(() => {
      window.D4U_SYNC.closeSeqDb();
      delete window.indexedDB;
    });
    await tab2.evaluate(() => {
      window.D4U_SYNC.closeSeqDb();
      delete window.indexedDB;
    });

    // 1. Both tabs attempt to acquire sync sequence
    const [tab1SeqResult, tab2SeqResult] = await Promise.all([
      tab1.evaluate(async () => {
        try {
          const s = await window.D4U_SYNC.acquireSyncSequence(1, 200);
          return { success: true, seq: s };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }),
      tab2.evaluate(async () => {
        try {
          const s = await window.D4U_SYNC.acquireSyncSequence(1, 200);
          return { success: true, seq: s };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })
    ]);

    console.log('  -> Tab 1 acquire result:', tab1SeqResult);
    console.log('  -> Tab 2 acquire result:', tab2SeqResult);

    if (tab1SeqResult.success || tab2SeqResult.success) {
      throw new Error('FAIL: Sequence was allocated when storage was unavailable!');
    }
    if (!tab1SeqResult.error.includes('SYNC_STORAGE_UNAVAILABLE') || !tab2SeqResult.error.includes('SYNC_STORAGE_UNAVAILABLE')) {
      throw new Error('FAIL: Error did not contain SYNC_STORAGE_UNAVAILABLE: ' + tab1SeqResult.error);
    }
    console.log('  -> PASS: Both tabs failed closed with SYNC_STORAGE_UNAVAILABLE; zero sequences allocated.');

    // 2. Both tabs attempt reconciliation without storage
    const [tab1Reconcile, tab2Reconcile] = await Promise.all([
      tab1.evaluate(async () => {
        return await window.D4U_SYNC.syncAndReconcileBackendKots(
          [{ id: 9999, order_id: 9999, store_id: 1, business_day_id: 200, status: 'SHOULD_NOT_WRITE', items: '[]' }],
          1,
          200
        );
      }),
      tab2.evaluate(async () => {
        return await window.D4U_SYNC.syncAndReconcileBackendKots(
          [{ id: 8888, order_id: 8888, store_id: 1, business_day_id: 200, status: 'SHOULD_NOT_WRITE', items: '[]' }],
          1,
          200
        );
      })
    ]);

    console.log('  -> Tab 1 reconcile result:', tab1Reconcile);
    console.log('  -> Tab 2 reconcile result:', tab2Reconcile);

    if (tab1Reconcile.applied || tab2Reconcile.applied) {
      throw new Error('FAIL: Reconciliation was applied when storage was unavailable!');
    }
    if (tab1Reconcile.reason !== 'SYNC_STORAGE_UNAVAILABLE' || tab2Reconcile.reason !== 'SYNC_STORAGE_UNAVAILABLE') {
      throw new Error('FAIL: Expected reason SYNC_STORAGE_UNAVAILABLE');
    }
    console.log('  -> PASS: Reconciliation refused with applied: false and reason: SYNC_STORAGE_UNAVAILABLE.');

    // 3. Verify zero Dexie writes occurred
    const dexieRecordsAfterFailure = await tab1.evaluate(async () => {
      const records = await window.D4U_SYNC.db.kots.toArray();
      return records.filter(r => r.businessDayId === 200);
    });
    if (dexieRecordsAfterFailure.length !== 0) {
      throw new Error('FAIL: Dexie contained records written when storage was unavailable!');
    }
    console.log('  -> PASS: Zero Dexie records written. System completely failed closed.');

    console.log('\n=== ALL BROWSER MULTI-TAB TESTS ON PRODUCTION CODE PASSED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
    await viteServer.close();
    console.log('[Browser & Vite Server Closed]');
  }
}

runTest().catch((err) => {
  console.error('\n❌ BROWSER TEST FAILED:', err);
  process.exit(1);
});
