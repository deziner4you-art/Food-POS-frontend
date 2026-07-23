# Antigravity Task: D4U Enterprise SaaS Gap Remediation

## Mission

Review and improve the complete D4U Restaurant POS project so it follows the enterprise multi-tenant SaaS architecture described in the project documentation.

The goal is to remove the current security, tenant-isolation, data-integrity, real-time, and legacy-architecture gaps without breaking the existing working POS, KDS, website, rider, admin, and SaaS flows.

Do not perform a visual redesign unless it is required to support the fixes below.

## Required first step

Before changing code, read every project Markdown document outside `node_modules`, `dist`, and `.git`, including:

- `D4U_BACKEND_MASTER_PLAN.md`
- `D4U_POS_Architecture_Model_Context.md`
- `D4U_POS_Model_Understanding_Urdu.md`
- `D4U_PROJECT_DOCS.md`
- `NIGHT_SHIFT_REPORT.md`
- `RIDER_SHIFT_REPORT.md`
- Each module README

Then inspect the current source code and database schema. The current code is the source of truth where documentation conflicts with implementation, but update the canonical documentation after the implementation is verified.

## Canonical local architecture

- Backend: `d4u-pos-backend` — NestJS + Prisma + PostgreSQL — port `3001`
- Admin/SaaS portal: `d4u-admin` — port `5300`
- POS/KDS/TV Board: `d4u-pos-client` — port `5173`
- Customer website: `d4u-website` — port `5200`
- Rider app: `d4u-rider` — port `3000`
- KDS route: `http://localhost:5173/kitchen`
- TV Board route: `http://localhost:5173/tv-board`

Use the NestJS backend and PostgreSQL as the final source of truth. Do not introduce a second architecture.

## Non-negotiable engineering rules

1. Preserve all existing working user flows.
2. Do not silently delete data, database tables, migration history, or legacy files.
3. Do not remove `order-bridge.cjs` until parity is proven and the migration is documented.
4. Do not trust `brand_id`, `store_id`, `user_id`, role, or permissions supplied by the browser.
5. Tenant and role authorization must be enforced on the backend, not only hidden in the UI.
6. Do not use `store_id: 1`, `brand_id: 1`, or `business_day_id: 1` as production fallbacks.
7. All sensitive actions must preserve an audit trail.
8. Inventory, cash, settlement, and wallet mutations must be atomic and idempotent.
9. Keep the existing branch-specific socket-room model, but make all clients use it correctly.
10. Complete one phase, test it, and document the result before starting the next phase.

## Phase 0 — Baseline and source-of-truth audit

Create a short baseline report before implementation:

- Which endpoints are protected and unprotected.
- Which frontend files still contain hardcoded tenant IDs or demo users.
- Which modules still use polling.
- Which paths still use `order-bridge.cjs` or `live_orders.json`.
- Which database models lack required tenant or audit relationships.
- Which existing tests/builds pass or fail.

Do not change behavior during the baseline audit.

## Phase 1 — Authentication and backend authorization

Implement production-safe authentication:

- Use bcrypt or an equivalent secure hash comparison for user PINs/passwords.
- Keep JWT login, but add a proper JWT strategy/guard.
- Protect all admin, POS, inventory, cash, order, rider, CMS, marketing, subscription, and reporting endpoints appropriately.
- Add role/permission checks for Super Admin, Head Office, Brand Owner, Branch Manager, Accounts, Cashier, Rider, and Kitchen Staff.
- Protect the offline credential sync endpoint. It must not expose credentials to anonymous callers.
- Ensure unauthorized users cannot access another store or brand by changing a query parameter.
- Never log passwords, PINs, JWTs, or sensitive credential data.

## Phase 2 — Complete multi-tenant isolation

Make tenant scope server-owned:

- Derive the authenticated user's `brand_id`, `store_id`, role, and permissions from the JWT/session.
- Validate every requested store and brand against the authenticated user's scope.
- Apply tenant filtering to all catalog, products, categories, inventory, recipes, orders, KOTs, business days, cash flows, customers, vendors, reports, CMS, marketing, and rider queries.
- Remove hardcoded production values such as `store_id: 1`, `brand_id: 1`, and `business_day_id: 1`.
- Customer website branch selection may choose a store, but the backend must validate that the store is online and belongs to the correct brand.
- Ensure online orders cannot be created for arbitrary stores by modifying the request body.
- Add tests proving Store A cannot read or mutate Store B data.

## Phase 3 — Financial, inventory, and audit integrity

Implement safe transactional behavior:

- Inventory deduction and its append-only transaction log must be created in the same database transaction.
- Settlement must be idempotent. Repeating the same settlement request must not deduct inventory or create duplicate sales.
- Void, discount, override, refund, cash-out, and settlement actions must require the required manager/authorized approval and reason.
- Store `changed_by`, `reason`, `approved_by`, timestamps, and relevant before/after values for sensitive mutations.
- Keep negative inventory as a controlled soft-block, but create a reliable manager red alert and audit record.
- Prevent duplicate KOTs, duplicate POS orders, and duplicate offline-sync submissions.
- Ensure business-day totals, cash flow, and order totals remain consistent after offline synchronization.

## Phase 4 — Real-time synchronization

Standardize Socket.io behavior:

- Use consistent event names for `new_order`, `order_updated`, `gps_update`, `new_kot`, `negative_inventory_alert`, and settlement updates.
- POS must join its authenticated store room.
- KDS must join its authenticated store room.
- Website must join the selected branch's store room after branch selection.
- Rider must receive only the orders assigned to that rider/store.
- GPS updates must be emitted to the correct store/order room.
- Remove polling where Socket.io is the intended source of real-time updates. If polling is retained as a temporary offline fallback, document and test it clearly.
- Clean up socket listeners on unmount and prevent duplicate connections.

## Phase 5 — Legacy bridge migration

Complete the migration from `order-bridge.cjs` to NestJS:

- Inventory all bridge endpoints and map each one to a NestJS controller/service.
- Confirm online orders, dispatch, rider tracking, settlement, KOT updates, and status transitions work through NestJS.
- Safely migrate any required active data from `live_orders.json` into PostgreSQL.
- Add parity tests for the old and new flows before retirement.
- Do not delete the bridge or JSON data until the migration is verified and documented.
- After verification, mark the bridge as archived/deprecated and remove active frontend dependencies on it.

## Phase 6 — SaaS module enforcement

Make subscription modules functional, not only visible in the UI:

- Enforce subscription flags in backend guards/services.
- Enforce them in the admin portal, POS, website, KDS, rider, TV Board, loyalty, analytics, and marketing flows.
- A disabled module must not be usable by calling its API directly.
- Make setup, subscription updates, branch creation, and staff creation tenant-aware.
- Replace mock staff data in the admin portal with backend data.
- Ensure the owner/investor view is read-only.

## Phase 7 — Testing and documentation

Add and run:

- Backend unit tests for auth, tenant isolation, inventory, cash, settlement, and subscription flags.
- API tests for unauthorized cross-store access.
- End-to-end flow: website order → POS → KDS → rider dispatch → GPS → delivery → cash settlement.
- Offline sync tests including duplicate submissions and reconnect behavior.
- Build and lint checks for all frontend modules and the backend.
- Update the canonical documentation to match the verified implementation.
- Correct the Urdu documentation encoding so it renders as readable UTF-8 Urdu.
- Clearly document any remaining limitations instead of marking unfinished work as complete.

## Acceptance criteria

The task is complete only when all of the following are true:

- A user from Store A cannot read or modify Store B data through any API.
- Anonymous users cannot call protected admin/POS/financial APIs.
- Password/PIN verification uses secure hashing.
- No production flow depends on hardcoded `store_id: 1`, `brand_id: 1`, or `business_day_id: 1`.
- Inventory and financial mutations are atomic and auditable.
- Duplicate settlement and duplicate offline sync do not create duplicate financial results.
- Website, POS, KDS, and rider receive only their correct store/order events.
- Subscription module switches are enforced server-side.
- The NestJS backend is the verified source of truth.
- All existing major flows still work.
- Builds, lint, unit tests, API tests, and the main E2E flow pass.
- Documentation matches the actual code and runtime ports.

## Required final report from Antigravity

At the end, provide:

1. Files changed.
2. Database/schema changes.
3. APIs added or changed.
4. Security and tenant-isolation results.
5. Tests and commands run with results.
6. Any remaining known gaps.
7. Any migration or deployment steps required.

Do not report the task as complete if any acceptance criterion is still failing.
