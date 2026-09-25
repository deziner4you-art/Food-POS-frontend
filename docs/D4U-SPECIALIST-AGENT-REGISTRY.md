# D4U POS — Specialist Agent Registry & Engineering Routing System

**Permanent Engineering Architecture & Routing Specification**  
**Role:** Lead Developer / Engineering Coordinator  
**Last Updated:** 2026-09-24  
**Status:** Canonical & Active

---

## 1. System Overview & Purpose

The D4U Restaurant POS ecosystem (`g:\RESTAURANT_POS_WITH_BACKEND`) is an enterprise monorepo comprising five distinct applications:
- **Backend (`d4u-pos-backend`):** NestJS, Prisma ORM, SQLite/PostgreSQL, Socket.IO, JWT + RBAC.
- **POS Client (`d4u-pos-client`):** Vite, React 19, TailwindCSS, Dexie (IndexedDB), Socket.IO client.
- **Admin Panel (`d4u-admin`):** Vite, React, TailwindCSS, Analytics, Catalog, Branch & Franchise Management.
- **Rider App (`d4u-rider`):** Vite, React, Mobile-optimized PWA, Live GPS, Order dispatch & cash settlement.
- **Website / Portal (`d4u-website`):** Vite, React, TailwindCSS, Online ordering, live tracking & cart drawer.

To eliminate cross-domain regressions, conflicting patterns, and unfocused monolithic modifications, the repository enforces a **Multi-Agent Specialist Engineering System**. General-purpose agents no longer perform uncoordinated changes across the repository. Instead, all tasks are coordinated by the **Lead Developer / Engineering Coordinator**, who classifies issues, bounds task scopes, and delegates execution exclusively to designated specialist domains.

---

## 2. Lead Developer / Engineering Coordinator Role

The Lead Developer acts as the central router and guardian of architectural integrity across all 5 applications.

### Core Coordinator Responsibilities:
1. **Holistic Repository Understanding:** Maintain end-to-end knowledge of data flow from customer website → NestJS backend → POS cash register → Kitchen KDS → TV Display → Rider App → Cashier Settlement.
2. **Triage & Classification:** When a problem or feature is requested, analyze the root cause before touching any code.
3. **Domain Routing:** Assign a **Primary Specialist** and identify any required **Secondary Specialist(s)**.
4. **Scope & Guardrail Definition:** Strictly delineate which files may be edited and explicitly declare out-of-scope boundaries.
5. **Cross-Module Defense:** Prevent specialists from refactoring, modifying, or breaking adjacent business logic.
6. **Domain Lock Enforcement:** Ensure that verified, audited, and locked subsystems are not casually reopened.
7. **Audit & Verification Oversight:** Enforce that no task is closed without passing focused tests, application builds, and independent audit review.

### Mandatory Pre-Task Routing Workflow:
```
PROBLEM RECEIVED
      ↓
[1. CLASSIFY ROOT CAUSE]
      ↓
[2. IDENTIFY PRIMARY SPECIALIST]
      ↓
[3. IDENTIFY SECONDARY SPECIALIST(S)]
      ↓
[4. DEFINE SCOPE & TOUCHED FILES]
      ↓
[5. DECLARE FORBIDDEN / OUT-OF-SCOPE BOUNDARIES]
      ↓
[6. SPECIALIST IMPLEMENTATION]
      ↓
[7. AUTOMATED TESTS & BUILD VALIDATION]
      ↓
[8. CODEX INDEPENDENT AUDIT]
      ↓
[9. AUDIT PASS → LOCK DOMAIN / UPDATE REGISTRY]
```

---

## 3. The 10 Specialist Agent Domains

```
                                  ┌─────────────────────────────────────────┐
                                  │      LEAD DEVELOPER / COORDINATOR       │
                                  └────────────────────┬────────────────────┘
                                                       │
         ┌──────────────────┬──────────────────┬───────┴──────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │                  │                  │
┌────────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│    AGENT 01     │ │    AGENT 02    │ │    AGENT 03    │ │    AGENT 04    │ │    AGENT 05    │ │    AGENT 06    │
│  Architecture   │ │ Security / Auth│ │ Order Lifecycle│ │  KDS / KOT /   │ │    Rider /     │ │   Website /    │
│ & System Design │ │    & RBAC      │ │ & Business St. │ │    Kitchen     │ │    Delivery    │ │Customer/Realtime│
└─────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
         │                  │                  │                  │                  │                  │
         └──────────────────┴──────────────────┼──────────────────┴──────────────────┴──────────────────┘
                                               │
                               ┌───────────────┼───────────────┐
                               │               │               │
                       ┌───────▼────────┐ ┌────▼───────────┐ ┌─▼─────────────┐
                       │    AGENT 07    │ │    AGENT 08    │ │   AGENT 09    │
                       │ Offline /      │ │ Database /     │ │ QA / E2E /    │
                       │ Dexie / Sync   │ │ Prisma / Tx    │ │ Regression    │
                       └────────────────┘ └────────────────┘ └───────────────┘
                                               │
                                       ┌───────▼────────┐
                                       │    AGENT 10    │
                                       │ Deployment /   │
                                       │ Infrastructure │
                                       └────────────────┘
```

---

### AGENT 01 — ARCHITECTURE / SYSTEM DESIGN
* **Domain Mandate:** Overall repository architecture, service and application boundaries, shared infrastructure, preventing architectural drift and unnecessary microservice decomposition.
* **Core Responsibilities:**
  - Defining repository-wide design patterns, monorepo package boundaries, and inter-app communication protocols.
  - Reviewing cross-cutting architectural changes (e.g. state management, API protocols, caching layers).
  - Monitoring technical debt, monolithic code splitting, and shared schema contracts.
  - Defending monolithic simplicity; preventing over-engineering and uncoordinated structural shifts.
* **Forbidden Boundaries / Non-Goals:**
  - Must NOT directly edit specific business logic, state machines, or UI styling without coordinating with the owning specialist.
* **Primary Files & Modules:**
  - Monorepo root configs, `docker-compose.yml`, shared libraries, application boundary entry points (`main.ts`, `main.tsx`).

---

### AGENT 02 — SECURITY / AUTH / RBAC
* **Domain Mandate:** Authentication, session tokens, tenant isolation, role-based access control, cryptographic verification, privilege escalation defense.
* **Core Responsibilities:**
  - JWT token minting, token verification, session expiration, and refresh token rotation (`auth.service.ts`, `session.ts`).
  - Terminal and staff login/logout lifecycle (Cashier, Manager, Chef, Waiter, Rider, Super Admin).
  - RBAC permission guards, route decorators (`@RequirePermissions`), and role hierarchy mapping (`permissions.guard.ts`).
  - Preventing tenant context leakage across branches/brands (`session-context.util.ts`).
  - Secret scanning, credential handling, and secure environment variable protocols.
* **Forbidden Boundaries / Non-Goals:**
  - Must NOT modify business order progression, inventory math, or delivery routing.
* **Primary Files & Modules:**
  - `d4u-pos-backend/src/modules/business/auth/`
  - `d4u-pos-backend/src/common/guards/permissions.guard.ts`
  - `d4u-pos-backend/src/common/guards/jwt-auth.guard.ts`
  - `d4u-pos-backend/prisma/seed-rbac.ts`
  - `d4u-pos-client/src/pos/session.ts`

---

### AGENT 03 — ORDER LIFECYCLE / BUSINESS STATE
* **Domain Mandate:** Authoritative order state machines, order type isolation (WALK_IN, DINE_IN, PICKUP, DELIVERY), order creation, and canonical business progression.
* **Core Responsibilities:**
  - `OnlineOrder` state machine (`CANONICAL_STATES`, `TERMINAL_STATES`, valid forward-only transitions).
  - `Order` (POS) state machine and order source handling (`order_source: 'DELIVERY' | 'WALK_IN' | 'TAKEAWAY' | 'DINE_IN'`).
  - Transition guards preventing illegal status jumps, retroactive cancellation of delivered orders, or type mutation.
  - Converting incoming Online Orders into kitchen tickets upon acceptance.
  - Synchronizing POS order states with linked `OnlineOrder` records atomically.
* **Forbidden Boundaries / Non-Goals:**
  - Must NOT alter Rider GPS mechanics, KDS timer algorithms, or Dexie storage schemas.
* **Primary Files & Modules:**
  - `d4u-pos-backend/src/modules/business/online-orders/`
  - `d4u-pos-backend/src/modules/business/pos-orders/`
  - `d4u-pos-client/src/App.tsx` (order placement and checkout handlers)

---

### AGENT 04 — KDS / KOT / KITCHEN
* **Domain Mandate:** Kitchen Order Tickets (KOT), Kitchen Display Systems, ticket timers, cook station dispatch, chef interactions, TV display boards.
* **Core Responsibilities:**
  - KOT state transitions (`NEW` → `PREPARING` → `READY`). Strict progression enforcement (e.g. no jumping `NEW` → `READY`).
  - Enforcing mandatory KOT store and business-day identity on creation and retrieval.
  - KDS UI ticket rendering, station filtering, chef PIN authorization, and recall capabilities (`StitchKDS.tsx`).
  - Customer-facing TV Board and TV Display queues (`TvBoard.tsx`, `TVDisplay.tsx`).
  - Kitchen rendering gates (`isKotEligible`): strictly suppressing tickets from inactive stores or closed business days.
* **Forbidden Boundaries / Non-Goals:**
  - Must NOT manage delivery rider claims, customer cart checkouts, or general ledger postings.
* **Primary Files & Modules:**
  - `d4u-pos-backend/src/modules/business/kots/`
  - `d4u-pos-backend/src/modules/business/kitchen/`
  - `d4u-pos-client/src/StitchKDS.tsx`
  - `d4u-pos-client/src/pages/TvBoard.tsx`
  - `d4u-pos-client/src/TVDisplay.tsx`
  - `d4u-pos-client/src/utils/kotEligibility.ts`

---

### AGENT 05 — RIDER / DELIVERY
* **Domain Mandate:** Delivery dispatch lifecycle, rider claim concurrency, delivery sequence enforcement, cash on delivery (COD) settlement, live rider GPS telemetry.
* **Core Responsibilities:**
  - Gating delivery claimability strictly on order status === `'READY'`.
  - Atomic rider claim concurrency (preventing two riders claiming the same delivery, and preventing one rider holding multiple active deliveries).
  - Enforcing the strict delivery progression:
    `READY` → `RIDER_ARRIVED` → `PRINT_BILL` → `DISPATCHED` → `OUT_FOR_DELIVERY` → `DELIVERED` → `WAITING_CASH_SETTLEMENT` → `SETTLED`.
  - Real-time GPS coordinate telemetry between Rider PWA, NestJS Gateway (`store_${id}` room), and POS cashier map.
  - Cashier delivery settlement and CashFlow reconciliation (`CashFlow CASH_IN`).
* **Forbidden Boundaries / Non-Goals:**
  - Must NOT modify kitchen prep timers, catalog modifiers, or website customer authentication.
* **Primary Files & Modules:**
  - `d4u-pos-backend/src/modules/business/rider/`
  - `d4u-pos-backend/src/modules/business/pos-orders/pos-orders.service.ts` (delivery flow)
  - `d4u-pos-client/src/pos/DeliveryGoogleMap.tsx`
  - `d4u-rider/src/App.tsx`
  - `d4u-rider/src/components/ActiveRideView.tsx`

---

### AGENT 06 — WEBSITE / CUSTOMER / REALTIME
* **Domain Mandate:** Customer portal, online cart, online checkout, live order tracking, customer-facing Socket.IO events, brand theme rendering.
* **Core Responsibilities:**
  - Customer menu browsing, category navigation, variant selection, and cart persistence (`d4u-website`).
  - Online order submission (`POST /online-orders`) with mandatory delivery address and customer payload.
  - Live customer order status tracking modal and dedicated tracker page (`TrackOrderPage.tsx`).
  - Mapping backend canonical states into customer-friendly progress steps (`orderStatusMapper.ts`).
  - Realtime socket connection, store room subscription, and resilient reconnection telemetry.
* **Forbidden Boundaries / Non-Goals:**
  - Must NOT alter backend database transactions, POS hardware printer drivers, or KDS chef station configs.
* **Primary Files & Modules:**
  - `d4u-website/src/` (all pages, components, and contexts)
  - `d4u-website/src/pages/TrackOrderPage.tsx`
  - `d4u-website/src/context/StoreContext.tsx`
  - `d4u-website/src/utils/orderStatusMapper.ts`

---

### AGENT 07 — OFFLINE / DEXIE / SYNC
* **Domain Mandate:** Client-side IndexedDB persistence, Dexie database lifecycle, offline KOT and transaction queues, sync reconciliation, and identity preservation.
* **Core Responsibilities:**
  - Dexie schema migrations, table versions, and indexes (`db.ts`).
  - Guarding offline KOT creation: enforcing positive integer `store_id` and `businessDayId` before writing to `db.kots`.
  - Rejecting incomplete tickets; strictly preventing fallback fabrication (`|| 1`, `|| 0`, `undefined`).
  - Safe reconciliation of backend KOTs (`syncAndReconcileBackendKots`): cross-tab browser mutexes, deduplicating records by `backendKotId`, and preserving unsynced local offline orders.
  - Validating Admin backup import data prior to destructive clear/add operations.
* **Forbidden Boundaries / Non-Goals:**
  - Must NOT modify server-side database migrations, customer website routing, or rider claims.
* **Primary Files & Modules:**
  - `d4u-pos-client/src/db.ts`
  - `d4u-pos-client/src/utils/backupRestore.ts`
  - `d4u-pos-client/src/utils/offlineKotCreation.test.ts`
  - `d4u-pos-client/src/utils/kotSyncIdentity.test.ts`
  - `d4u-pos-client/src/utils/websiteKotCreation.test.ts`

---

### AGENT 08 — DATABASE / PRISMA / TRANSACTIONS
* **Domain Mandate:** Relational data model, Prisma schema, SQL constraints, foreign keys, database indexes, atomic multi-model transactions, row-level locking.
* **Core Responsibilities:**
  - Prisma schema definitions and migration lifecycle (`prisma/schema.prisma`, `migrations/`).
  - Protecting data integrity via database constraints and transactional boundaries (`prisma.$transaction`).
  - Designing composite indexes for query performance (e.g. `[store_id, status]`, `[business_day_id]`).
  - Eliminating database race conditions and dirty reads via optimistic/pessimistic locking patterns.
  - Ensuring referential integrity across tenants (Brand, Store, User, Order, KOT, Inventory).
* **Forbidden Boundaries / Non-Goals:**
  - Must NOT modify React UI layout, CSS styles, or client-side form validation.
* **Primary Files & Modules:**
  - `d4u-pos-backend/prisma/schema.prisma`
  - `d4u-pos-backend/prisma/migrations/`
  - `d4u-pos-backend/prisma/seed.ts`
  - `d4u-pos-backend/src/common/prisma.service.ts`

---

### AGENT 09 — QA / E2E / REGRESSION
* **Domain Mandate:** Automated behavioral testing, integration suites, end-to-end multi-app simulation, regression detection, and production readiness evidence.
* **Core Responsibilities:**
  - Designing deterministic unit and integration test suites in Vitest (client) and Jest (backend).
  - Executing full-lifecycle verification across apps: Website → POS → KDS → Rider → Settlement.
  - Multi-tab browser testing (verifying cross-tab Dexie mutexes, IndexedDB isolation, Socket.IO sync).
  - Negative testing: testing out-of-order calls, duplicate requests, network disconnections, invalid IDs, and corrupted inputs.
  - Verifying that implementation code behaves as claimed prior to submitting for Codex audit.
* **Forbidden Boundaries / Non-Goals:**
  - Must NOT write "dummy" tests designed solely to pass without asserting business invariants.
* **Primary Files & Modules:**
  - `d4u-pos-backend/src/**/*.spec.ts`
  - `d4u-pos-client/src/utils/*.test.ts`
  - Verification scripts (`e2e-delivery-lifecycle-verify.js`, audit scripts).

---

### AGENT 10 — DEPLOYMENT / INFRASTRUCTURE
* **Domain Mandate:** Build pipelines, GitHub Actions workflows, production VPS environments, PM2 process management, Nginx reverse proxy routing, Cloudflare/SSL configuration.
* **Core Responsibilities:**
  - Production build scripts (`npm run build`) for all 5 applications.
  - Continuous integration workflows (`.github/workflows/`).
  - Multi-process deployment scripts and PM2 ecosystem configurations.
  - Nginx virtual hosts, WebSockets proxying (`/socket.io/`), CORS policies, and static asset caching.
  - Deployment safety protocols: freeze states, zero-downtime reloads, database backup checks prior to deployment.
* **Forbidden Boundaries / Non-Goals:**
  - Must NEVER execute production deployment, git push, or database migration without explicit user approval.
* **Primary Files & Modules:**
  - `.github/workflows/`
  - Root `package.json`, Vite build configs (`vite.config.ts`), PM2 configs, Nginx reverse proxy templates.

---

## 4. Domain Ownership & Shared Files Rules

In a monorepo architecture, **Domain Ownership does NOT mean exclusive file ownership**. Several mission-critical files serve as cross-cutting integration points (e.g. `App.tsx`, `db.ts`, `app.gateway.ts`).

### Rules for Modifying Shared Files:
1. **Declare Purpose Before Editing:** The specialist must state exactly which domain logic is being altered before modifying a shared file.
2. **Strict Boundary Scoping:** The specialist must touch *only* the functions, blocks, or hooks relevant to their assigned domain.
3. **Neighboring Code Inviolability:** Unrelated code in the same file must remain untouched. Do NOT reformat, refactor, or rename variables in neighboring blocks.
4. **No Clashing Invariants:** When touching shared models (such as `OfflineKOT` or `Order`), ensure changes do not break contracts established by another specialist (e.g. AGENT 07 must not remove status fields needed by AGENT 04).
5. **No Native Browser Dialogs:** In frontend files, never use `alert()`, `confirm()`, or `prompt()`. All specialists must use custom UI modals or toast elements.

---

## 5. Decision Matrix & Problem Routing Rules

When a problem or task is introduced, the Lead Developer consults this canonical decision matrix:

| Observed Symptom / Problem | Primary Specialist | Secondary Specialist(s) | Critical Guardrails & Constraints |
|---|---|---|---|
| Chef accepts order on KDS, but it remains visible or reappears in NEW queue | **AGENT 04 (KDS/KOT)** | AGENT 07 (Offline/Sync) | Must not wipe local offline tickets; must verify `backendKotId` dedup. |
| Rider can simultaneously claim two delivery orders | **AGENT 05 (Rider/Delivery)** | AGENT 08 (Database/Prisma) | Must enforce atomic claim transaction with row lock; verify status is `READY`. |
| Old or stale KOT tickets reappear after a sync cycle | **AGENT 07 (Offline/Dexie/Sync)** | AGENT 04 (KDS/KOT) | Strictly enforce store + business-day identity; prune stale synced tickets only. |
| Customer live order tracking screen vanishes or gets stuck | **AGENT 06 (Website/Customer)** | AGENT 03 (Order Lifecycle) | Verify step mapping in `orderStatusMapper.ts` (`OUT_FOR_DELIVERY` is step 5). |
| Cashier or staff receives "Insufficient permissions" 403 on operational button | **AGENT 02 (Security/RBAC)** | AGENT 03 (Order Lifecycle) | Check role mapping in `permissions.guard.ts` & `seed-rbac.ts`; no open bypasses. |
| An OnlineOrder mutates from PICKUP to DELIVERY unexpectedly | **AGENT 03 (Order Lifecycle)** | AGENT 08 (Database/Prisma) | Type immutability must be guaranteed at service and DB schema layers. |
| Database deadlocks or concurrent claim race condition | **AGENT 08 (Database/Prisma)** | AGENT 05 (Rider/Delivery) | Wrap in `prisma.$transaction`; eliminate cross-table race conditions. |
| GitHub Actions deployment fails or PM2 restart crashes | **AGENT 10 (Deployment/Infra)** | AGENT 01 (Architecture) | Check build outputs, env vars, port allocations; do NOT deploy without user approval. |
| Full lifecycle audit (Website order → POS → KDS → Rider → Settle) | **AGENT 09 (QA/E2E)** | AGENT 03, 04, 05, 06 | Must simulate actual WebSocket and HTTP events; assert end-to-end consistency. |
| Corrupt backup imported into POS client destroys terminal tickets | **AGENT 07 (Offline/Dexie/Sync)** | AGENT 02 (Security/RBAC) | Validate every KOT identity before `db.kots.clear()`; reject invalid backups atomically. |
| Cross-store KOT data leakage between Branch 1 and Branch 2 | **AGENT 04 (KDS/KOT)** | AGENT 07 (Offline/Sync) | Apply strict rendering gate `isKotEligible`; reject missing or mismatching `store_id`. |

---

## 6. Current Domain Status & Evidence Registry

Based on repository evidence, recent sprints (Phase 3 and Sprints 29–30), and the permanent knowledge base:

| Domain | Status | Audit Status | Key Evidence / Milestones Completed | Active Limitations / In-Flight Focus |
|---|---|---|---|---|
| **01 Architecture / Design** | **LOCKED** | **PASS** | Monorepo structure stabilized across 5 apps. API boundaries documented in `docs/API_CONTRACT.md`. | Monitor for unnecessary decoupling. |
| **02 Security / Auth / RBAC** | **LOCKED** | **PASS** | Cashier delivery permissions fixed (`seed-rbac.ts`). Manager PIN unlock verified. RBAC permission guards active. | Phased rollout for tenant validation guard (EWO-I001/I002 acknowledged). |
| **03 Order Lifecycle** | **LOCKED** | **PASS** | `OnlineOrder` state machine locked; `CANONICAL_STATES` validated; direct transition `DELIVERED -> SETTLED` enabled; type mutation blocked. | POS-native and Online orders maintain separated lifecycles. |
| **04 KDS / KOT / Kitchen** | **LOCKED** | **PASS** | Strict state sequence (`NEW -> PREPARING -> READY`). Strict backend `store_id` integer validation (`kots.service.ts`). `isKotEligible` rendering gate active. | TV Board & KDS render only verified store & business-day tickets. |
| **05 Rider / Delivery** | **LOCKED** | **PASS** | Claim gated strictly on `READY`. Concurrency locked via `$transaction`. Live GPS socket rooms operational. POS delivery sequence locked. | Preserves active delivery filtering across terminal reloads. |
| **06 Website / Customer** | **LOCKED** | **PASS** | `TrackOrderPage` stabilized. GPS tracking maintained during transit. Step 5 (`OUT_FOR_DELIVERY`) mapping verified. | Live order tracker persists in `StoreContext` and localStorage. |
| **07 Offline / Dexie / Sync** | **ACTIVE** | **PENDING AUDIT** | Phase 3 Hardening Batch complete: OfflineKOT strict identity interface, store-scoped business-day resolution (no generic fallback), store defaults purged (no || 1), deterministic scoped sequence tracking (stale snapshot resurrection defect resolved), cross-store & cross-day synchronization isolation, 104 client tests passing. | Awaiting independent Codex audit for final Phase 3 domain lock. |
| **08 Database / Prisma** | **LOCKED** | **PASS** | Schema migrations up to date. Composite indexes added. Foreign keys protected. Multi-record updates wrapped in `$transaction`. | Database is authoritative source of truth. |
| **09 QA / E2E / Regression** | **ACTIVE** | **PASS (Unit/Int)** | 91 client tests passing across 5 suites. 576 backend tests passing across 73 suites. All 4 apps build cleanly. | Ongoing regression verification as Phase 3 hardening proceeds. |
| **10 Deployment / Infra** | **LOCKED** | **PASS** | Build pipelines verified. PM2 and port specifications documented in permanent knowledge base. | Production deployment freeze active; no git push/commit without explicit user authorization. |

---

## 7. Current Phase 3 Context

Phase 3 is the active operational phase of the project, focusing on **Client-Side Identity Integrity, Dexie Synchronization, and Data Isolation**:
- **Offline Identity Verification:** No KOT may be created or persisted locally unless both `store_id` and `businessDayId` are verified finite positive integers.
- **No Identity Fabrication:** Elimination of all `|| 1`, `|| 0`, and fallback defaults across client and backend sync.
- **Dexie Synchronization:** Cross-tab safe reconciliation between KDS, TV Display, and POS (`db.transaction('rw', db.kots)`).
- **Admin Backup Safety:** Validation of imported backups prior to executing any destructive database clears.
- **Independent Audit Feedback:** Codex independent audit findings in this domain are being tracked and addressed methodically.

---

## 8. Independent Audit Model

To ensure uncompromising software quality, the repository enforces a strict separation between implementation and auditing:

```
[Lead Developer / Antigravity]                [Independent Auditor / Codex]
           │                                                │
 1. Classify & Scope Task                                   │
 2. Implement Domain Fix                                    │
 3. Execute Automated Tests                                 │
 4. Run Frontend / Backend Builds                           │
 5. Submit Implementation Report ─────────────────────────> │
                                                6. Independent Code Review
                                                7. Negative Invariant Testing
                                                8. Verify Root Cause Elimination
           │ <───────────────────────────────── 9. Issue Audit Verdict:
           │                                       [PASS / PARTIAL / FAIL]
           ▼
If PARTIAL / FAIL:
 → Targeted Specialist Remediation
 → Re-test & Re-build
 → Resubmit for Independent Audit
           ▼
If PASS:
 → Final Domain Acceptance
 → Lock Domain in Registry
```

### Critical Audit Invariants:
1. **Separation of Concerns:** Antigravity implements and coordinates; Codex independently audits and probes for edge-case failures.
2. **No Self-Certification:** An implementation is never declared complete based solely on the implementer's report. It requires independent audit verification.
3. **Evidence-Based Acceptance:** All audit verdicts require concrete verification evidence (reproduction checks, assertion outputs, build logs).

---

## 9. Domain Locking Mechanism

The **Domain Lock** prevents regression loops where previously hardened features are broken by subsequent tasks.

### Lock States:
- **`LOCKED`**: Domain is verified, tested, audited, and stable. No agent may modify files in this domain unless an approved unlock condition is met.
- **`ACTIVE`**: Domain is currently undergoing active implementation, hardening, or testing.
- **`BLOCKED`**: Domain work is paused pending resolution of a prerequisite dependency.

### Unlock Protocol:
A `LOCKED` domain may be reopened **ONLY** if:
1. A concrete regression is reported with reproduction steps.
2. An active task in another domain creates an unavoidable, verified interface dependency.
3. Codex identifies a verifiable security, concurrency, or data integrity gap in that domain.
4. The user explicitly directs the Lead Developer to reopen the domain.

---

## 10. Future Problem Routing Protocol

For every new user request or defect report, the Lead Developer must internally formulate and output this routing specification before writing any code:

```markdown
### PROBLEM ROUTING SPECIFICATION
- **Problem Statement:** <Summary of observed defect or requested capability>
- **Primary Specialist:** <AGENT 01 – 10>
- **Secondary Specialist(s):** <AGENT 01 – 10 or None>
- **Affected Modules:** <e.g. d4u-pos-client, d4u-pos-backend>
- **Expected Files to Modify:** <Explicit list of target files>
- **Strictly Out-of-Scope / Forbidden Files:** <Explicit list of prohibited files>
- **Validation & Test Requirements:** <Exact unit / integration / E2E assertions required>
- **Audit Requirement:** <Codex independent audit verification criteria>
```

---

## 11. Documentation & Memory Maintenance Rules

This document is the persistent, living source of truth for engineering routing in the D4U POS project.

1. **Persistent Memory:** Do not rely on conversational context. When resuming work, consult this registry first.
2. **Registry Updates:** The Lead Developer must update this document when:
   - A specialist completes a sprint or task.
   - An independent audit verdict (`PASS` / `PARTIAL` / `FAIL`) is rendered.
   - A domain lock state changes (`ACTIVE` ↔ `LOCKED`).
   - A new cross-domain architectural contract is established.
3. **Change Logging:** Every task completion must simultaneously be documented in:
   - [docs/AI_TEAM_PROGRESS.md](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/AI_TEAM_PROGRESS.md)
   - [docs/CHANGELOG_AI.md](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/CHANGELOG_AI.md)
