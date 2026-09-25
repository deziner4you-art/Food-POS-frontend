# D4U Phase 3 Ordering Identity & Delivery Lifecycle — Architecture Lock

> **FROZEN / LOCKED ARCHITECTURAL BASELINE**
>
> "Phase 3 locked behavior must not be modified, bypassed, weakened, or refactored unless a separately approved task specifically addresses a verified regression, defect, or required enhancement."

---

## 1. Phase 3 Purpose & Scope
The Phase 3 Ordering Identity & Delivery Lifecycle hardening establishes authoritative identity isolation, race-free local-first data synchronization, fail-closed state machines, and end-to-end delivery guarantees across all D4U POS interfaces (POS Client, KDS, TV Board, Rider App, Customer Portal).

### Scope Boundary
- **Included**:
  - Ordering, KOT lifecycle, KDS display & actions, POS Online intake, Delivery queue & dispatch, Rider assignment & settlement, offline Dexie synchronization, and authoritative business-day verification.
- **Explicit SaaS Testing Boundary**:
  - Unrelated SaaS modules (Payments gateway integrations, Inventory raw recipe conversions, CRM marketing, Campaigns, Accounting ledger postings, SuperAdmin subscriptions) are outside the Phase 3 Ordering scope and remain subject to their respective engineering baselines.

---

## 2. Protected Architectural Invariants

### A. Store & Business-Day Identity Rules
1. **No Defaults or Fallbacks**:
   - `store_id` and `businessDayId` must strictly be valid, finite positive integers (`typeof id === 'number' && Number.isInteger(id) && id > 0`).
   - Zero, negative numbers, `NaN`, `null`, `undefined`, strings, booleans, objects, and arrays fail closed immediately.
   - Hardcoded store or day defaults (e.g. `|| 1` or `|| activeStoreId`) are strictly prohibited in data mapping and persistence layers.
2. **Authoritative Backend Verification**:
   - `activeBusinessDayId` is initialized as `null` (unverified). No cached localStorage value can authorize rendering or KOT creation on its own.
   - Authoritative day is resolved strictly via `GET /business-day/current?store_id=${storeId}` with bearer authorization.
   - If the endpoint returns 404, network error, malformed payload, or no open business day, `activeBusinessDayId` resets to `null`, per-store cache is cleared, and all order/KOT rendering fails closed.

### B. Offline KOT Creation & Backup Restore
1. **Offline KOT Creation**:
   - Both POS checkout and embedded Website checkout route through `createOfflineKot()` and `validateOfflineKotIdentity()`.
   - If `store_id` or `businessDayId` is missing/invalid, creation aborts with a user-facing custom modal/toast; no record is persisted to Dexie.
2. **Admin Backup Restore**:
   - `validateBackupKots()` validates all imported KOT records prior to any table write.
   - If any KOT record lacks a valid positive integer `store_id` or `businessDayId`, the restore transaction aborts atomically without clearing or corrupting existing Dexie state.

### C. Multi-Tab Sequence Ordering & Stale Sync Protection
1. **Monotonic Sequence Allocation**:
   - Cross-tab sequence allocation is serialized via Web Locks API (`navigator.locks.request`) keyed by `d4u_sync_seq_lock_${scopeKey}`.
   - Sequence state is persisted authoritatively in IndexedDB database `D4U_Sync_Sequences` under `issued_sequences` and `applied_sequences`.
2. **Sync Scope Key**:
   - All synchronization and locks are strictly scoped by `store_${store_id}_bd_${businessDayId}`. Generic or unscoped keys (e.g. `bd_all`) are forbidden.
3. **Stale Snapshot Rejection**:
   - Incoming snapshots with `syncSeq < latestAppliedSeq` are rejected immediately before entering Dexie transactions (`applied: false, reason: 'STALE_SNAPSHOT'`).
4. **Durable Recovery Protocol**:
   - Prior to touching Dexie, a durable recovery marker `pending_<scopeKey>` is committed with the incoming sequence.
   - Dexie reconciliation runs inside a scoped mutex lock (`d4u_sync_reconcile_lock_${scopeKey}`).
   - Upon successful transaction, applied sequence is updated and the pending marker cleared.
   - If a failure occurs before sequence commit, the pending marker persists, rejecting older snapshots while allowing exact-sequence retries.
5. **Browser Fail-Closed Behavior**:
   - If `navigator.locks` or IndexedDB is unavailable/unsupported, synchronization fails closed safely with `UNSUPPORTED_BROWSER_LOCKS` or `SYNC_STORAGE_UNAVAILABLE`; zero records are written to Dexie.
6. **Unsynced Local KOT Protection**:
   - Local KOTs with `synced: false` are never pruned or overwritten by backend reconciliation.

### D. Rendering & Eligibility Gates (POS, KDS, TV, Delivery)
1. **KDS & TV Identity Gate**:
   - KDS (`StitchKDS.tsx`), TV Board (`TvBoard.tsx`), TV Display (`TVDisplay.tsx`), and legacy `KitchenDisplay.tsx` filter all rendered tickets through `isKotEligible(k, activeStoreId, activeBusinessDayId)`.
   - Tickets from different stores or different business days are never rendered.
2. **Delivery Eligibility Gate**:
   - `isDeliveryEligible(del, currentStoreId, activeBusinessDayId)` strictly enforces store match, business-day match, and lifecycle allowlist:
     `['READY', 'RIDER_ARRIVED', 'PRINT_BILL', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'WAITING_CASH_SETTLEMENT']`.
   - Pre-READY statuses (`PENDING`, `CONFIRMED`, `PREPARING`) and terminal statuses (`SETTLED`, `CANCELLED`, `VOIDED`) fail closed and cannot enter `activeDeliveries`.
   - `visibleActiveDeliveries` returns `[]` when `activeBusinessDayId` is null/unverified, keeping the sidebar badge, active counters, cards list, and `DeliveryGoogleMap` strictly empty.
3. **KDS Socket Delivery Reducer**:
   - `applyKdsDeliveryUpdate` only mutates existing delivery cards if the socket event carries matching `store_id` and matching `business_day_id`.
   - A `PREPARING` socket update actively evicts any matching delivery card from memory so pre-READY orders never linger in the delivery queue.
   - Socket updates never synthesize new cards from scratch; card creation is owned by the authoritative READY/KOT path.

### E. Rider Lifecycle & Settlement
1. **Rider Queue Isolation**:
   - `getRiderOrders` filters online orders strictly to `type: 'DELIVERY'` and non-terminal active statuses. Non-delivery orders (`PICKUP`, `DINE_IN`) are excluded.
   - Rider claims are protected by single-active-delivery concurrency checks in an atomic transaction.
2. **Settlement Eviction**:
   - When an order reaches `SETTLED`, it is immediately evicted from `activeDeliveries` and rider active lists.
   - Terminal orders are excluded by `activeOnly=true` backend queries and cannot return upon page refresh.

---

## 3. Approved Test Baseline

| Suite | Component | Scope | Test Count | Result |
| :--- | :--- | :--- | :---: | :---: |
| **Frontend Vitest** | `d4u-pos-client` | KOT eligibility, KDS/TV verification, offline creation, delivery eligibility, identity sync, backup restore, identity bypass, stale sync, website creation | 183 tests (9 files) | **PASS** |
| **Frontend Typecheck** | `d4u-pos-client` | Full TypeScript strict verification (`npx tsc --noEmit`) | Entire client AST | **0 errors** |
| **Multi-Tab Browser** | `d4u-pos-client` | Real multi-tab Puppeteer test executing production `db.ts` with Web Locks & IndexedDB | 7 tests | **PASS (7/7)** |
| **Backend Jest** | `d4u-pos-backend` | Online orders, KOTs, POS orders, Rider claims, RBAC, Business day, Catalog | 581 tests (73 suites) | **PASS** |
| **Client Production Build**| `d4u-pos-client` | `vite build` | 2746 modules | **PASS** |
| **Backend Production Build**| `d4u-pos-backend` | `nest build` | Full backend | **PASS** |

---

## 4. Deployment Baseline
- **Repository Branch**: `final-project-after-ahmed-suggestion-security-checks-and-improvements`
- **Deployment Mechanism**: GitHub Actions workflow (`.github/workflows/deploy-pos.yml`)
- **Automated Steps**:
  1. Backend build & Jest tests (`npm run test`, `npm run build`)
  2. POS client build (`npm run build`)
  3. VPS artifact sync via SSH / SCP
  4. Database migration deployment (`npx prisma migrate deploy` — verified zero new migrations for Phase 3)
  5. Idempotent RBAC permissions seeding (`ts-node prisma/seed-rbac.ts`)
  6. PM2 reload of `d4u-pos-backend`
  7. Automated health check (`GET http://127.0.0.1:3001/system/ping`)
- **Live Verification Endpoints**:
  - POS: `https://pos.deziner4you.com/`
  - Backend Ping: `https://pos-api.deziner4you.com/system/ping`
