# D4U POS — Rider Delivery Recovery Architecture

> **Status:** Implemented & Verified — Sprint 29.2
> **Phase 3 Ordering Hardening:** LOCKED. All Ordering and Delivery Hardening protections remain strictly enforced; no Phase 3 protections were weakened or bypassed.

---

## 1. Problem Statement & Architecture Goals

During delivery fulfillment, riders can encounter vehicle breakdowns, connectivity failures, or operational delays that leave orders stuck at intermediate delivery statuses (such as `RIDER_ACCEPTED`, `RIDER_ARRIVED`, `PRINT_BILL`, `DISPATCHED`, or `OUT_FOR_DELIVERY`).

Without an authorized recovery mechanism:
1. The assigned rider is blocked from claiming any other order because of the active delivery guard.
2. The POS register and kitchen cannot re-dispatch the order to another available rider.
3. If staff attempt to delete a problematic rider account with order history, the database raises an unhandled foreign key constraint error (`P2003`), resulting in a 500 error and potential UI crashes.

### Goals
- **Rider-Owned Voluntary Release:** Rider releases their own assigned order before cash collection starts.
- **Admin/Manager Force-Release:** Authorized staff force-release a stuck rider assignment without cancelling, deleting, or altering order contents.
- **Graceful Delete Handling:** Foreign key conflicts return HTTP 409 Conflict with actionable guidance toward deactivation.
- **Safe Account Lifecycle:** Support Deactivate / Reactivate lifecycle for staff/riders, blocking login while keeping historical audit trails intact.

---

## 2. Recovery Mechanisms Overview

Three complementary, strictly additive mechanisms are in production:

### 2.1 Rider-Initiated Release (`PATCH /rider-orders/:id/release`)
- Initiated by the assigned rider from the Rider Mobile Web App.
- Requires `delivery.dispatch.claim` permission.
- Identity derived strictly from authenticated rider JWT (`sub`).
- Verifies rider store matches order store.
- Rejects terminal states and cash hand-off states.
- Reverts order to `READY` and clears rider assignment.

### 2.2 Admin Force-Release (`PATCH /rider-orders/:id/force-release`)
- Initiated by Manager, Cashier, Dispatcher, or Admin from the POS Client Delivery panel.
- Requires `delivery.dispatch.assign` permission (RBAC enforced).
- Callers with the `Rider` role are explicitly forbidden from force-releasing.
- Store isolation verified: caller's active store scope must match the order's `store_id` (unless Super Admin).
- Supports both `OnlineOrder` and `POS Order` records.
- Bidirectionally clears linked twin orders (`claimedByRiderId = null`, `rider_id = null`, `status = 'READY'`).
- Logs an authoritative record in `SystemAuditLog` (`action: 'FORCE_RELEASE_RIDER'`).
- Broadcasts real-time `order_updated` event to `store_<id>` WebSocket room.

### 2.3 Safe Rider Deactivation & Dependency-Aware Delete (`DELETE /users/:id`, `PATCH /users/:id/deactivate`)
- Attempting to delete a user with historical order, delivery, or audit records intercepts Prisma `P2003` foreign key violations and returns **HTTP 409 Conflict** with an actionable message.
- Admin UI intercepts 409 and prompts to deactivate/suspend the user via a custom modal dialog.
- Deactivating sets `status = 'SUSPENDED'`, immediately preventing login without compromising database foreign key constraints.

---

## 3. Release Lifecycle & Safety Gates

```
Order in Kitchen / Dispatch
         |
         v
Status: READY
         |
         +---> Rider claims order (PATCH /rider-orders/:id/claim)
         |     claimedByRiderId = riderJWT.sub
         |     status -> RIDER_ACCEPTED / RIDER_ARRIVED / DISPATCHED / OUT_FOR_DELIVERY
         |
         +---> Stuck Rider Scenario?
               |
               +---> [Path A] Rider Releases Own Order:
               |     PATCH /rider-orders/:id/release
               |     - JWT identity must match claimed rider
               |     - Store must match
               |
               +---> [Path B] Admin / Manager Force-Releases Order:
                     PATCH /rider-orders/:id/force-release
                     - Caller must have delivery.dispatch.assign permission
                     - Caller must NOT be a Rider
                     - Store isolation verified (callerStore === order.store_id)
                     - Order must currently have an assigned rider
                     - Terminal states strictly rejected (400)
                     
         |     [Either Path Server-Side Processing]
         |     1. OnlineOrder: claimedByRiderId = null, claimedByRiderName = null, riderAssigned = false, status = 'READY'
         |     2. POS Order: rider_id = null, status = 'READY'
         |     3. OnlineOrder <-> POS Order bridge synchronized
         |     4. SystemAuditLog record created (Path B)
         |     5. WebSocket broadcast 'order_updated' to room 'store_<store_id>'
         v
Status reverted to READY (available for re-assignment / re-dispatch)
```

### 3.1 Release State Matrix (Evaluated Lifecycle Statuses)

| Lifecycle Status | Rider Release? | Admin Force-Release? | Target Status | Policy Rationale |
|------------------|----------------|----------------------|---------------|------------------|
| `READY` | **YES** | **YES** | `READY` | Order claimed while READY; clears claim and remains ready for other riders |
| `RIDER_ACCEPTED` | **YES** | **YES** | `READY` | Re-enters available dispatch queue |
| `RIDER_ARRIVED` | **YES** | **YES** | `READY` | Voluntary or manager un-assign at kitchen; re-enters dispatch queue |
| `PRINT_BILL` | **YES** | **YES** | `READY` | Kitchen bill printed; un-assigns rider before physical handoff |
| `DISPATCHED` | **YES** | **YES** | `READY` | Dispatched at counter; rider un-assigned before departure |
| `OUT_FOR_DELIVERY` | **YES** | **YES** | `READY` | Rider en route experiences breakdown; recovered to READY for re-dispatch |
| `DELIVERED` | **NO (400)** | **NO (400)** | *Unchanged* | Customer has food; cash collection / settlement workflow active |
| `WAITING_CASH_SETTLEMENT` | **NO (400)** | **NO (400)** | *Unchanged* | Rider has collected cash and is returning to till; cannot un-assign |
| `SETTLED` | **NO (400)** | **NO (400)** | *Unchanged* | Terminal accounting ledger state; closed |
| `CANCELLED` | **NO (400)** | **NO (400)** | *Unchanged* | Terminal cancellation; cannot revert |
| `VOIDED` | **NO (400)** | **NO (400)** | *Unchanged* | Terminal voided state; cannot revert |
| `COMPLETED` | **NO (400)** | **NO (400)** | *Unchanged* | Terminal completed state; cannot revert |

---

## 4. UI Implementation (Custom Modals — No Native Popups)

In compliance with D4U UI rules, native browser dialogs (`window.alert`, `window.confirm`, `window.prompt`) are strictly prohibited.

### 4.1 POS Client UI (`d4u-pos-client/src/App.tsx`)
- **Card Action:** Active delivery cards in non-terminal states with assigned riders display an amber "Release Rider" action button.
- **Confirmation Modal:** Clicking displays a custom dark-themed confirmation modal containing:
  - Exact Order Identifier (`#<id>`)
  - Assigned Rider Name and ID
  - Explicit reassurance note: *"The order will NOT be deleted or cancelled. It will be returned to READY status so another rider can accept it."*
  - Cancel & Confirm action buttons with pending state handling.
- **Optimistic State Update & Toast:** On success, immediately updates local `activeDeliveries` and `backendOnlineOrders` state, displays a success toast, and listens for the room-scoped socket broadcast.

### 4.2 Admin Panel UI (`d4u-admin/src/pages/StaffPermissions.tsx`)
- Intercepts HTTP 409 responses from `DELETE /users/:id`.
- Displays actionable message: *"Cannot delete user #<id>: This user has historical delivery assignments, orders, or audit records."*
- Prompts admin via `customConfirm()` to suspend the account via `PATCH /users/:id/deactivate`.

---

## 5. API Reference

### 5.1 PATCH `/rider-orders/:id/force-release` (and alias `/rider-orders/:id/admin-force-release`)

| Field | Value |
|-------|-------|
| Auth | Bearer admin/manager/cashier JWT |
| Permission | `delivery.dispatch.assign` |
| Identity Gate | JWT `sub` verified against DB; caller role must NOT be `Rider` |
| Store Isolation | `caller.active_store_id || caller.store_id === order.store_id` (Super Admin exempt) |
| Success Response (200) | `{ success: true, orderId: number, orderType: 'ONLINE'|'POS', previousStatus: string, releasedRiderId: number }` |
| 400 — Unauthenticated | `"A valid authenticated admin identity is required."` |
| 403 — Unauthorized Role | `"Riders are not authorized to perform admin force-release."` |
| 403 — Store Mismatch | `"You do not have access to this store"` |
| 400 — No Assigned Rider | `"Order #N does not have an assigned rider."` |
| 400 — Terminal / Cash State | Rejection with specific guidance on cash hand-off or terminal status |
| 404 — Order Not Found | `"Order not found."` |

### 5.2 DELETE `/users/:id`

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| User has no dependencies | 200 OK | `{ success: true, message: "User deleted successfully" }` |
| User has orders/history | 409 Conflict | `{ statusCode: 409, error: "Conflict", message: "Cannot delete user #N: This user has historical delivery assignments, orders, or audit records. Deactivate the user instead to preserve data integrity." }` |

### 5.3 PATCH `/users/:id/deactivate` & PATCH `/users/:id/reactivate`

| Endpoint | Action | Result |
|----------|--------|--------|
| `PATCH /users/:id/deactivate` | Sets `status = 'SUSPENDED'` | Login blocked with `"Account is suspended. Please contact administrator."` (401) |
| `PATCH /users/:id/reactivate` | Sets `status = 'ACTIVE'` | Access restored |

---

## 6. Security & Architecture Notes

### Future JWT Revocation Note
- When an account is deactivated via `PATCH /users/:id/deactivate`, future login attempts are immediately blocked.
- However, pre-existing issued JWTs remain valid until their expiration timestamp (1 hour).
- Immediate, real-time revocation of in-flight tokens will be addressed in a future platform security sprint via a token blocklist / session store (e.g., Redis or database-backed session table).

---

## 7. Verification & Automated Test Coverage

### Test Suites Executed

1. **Backend Admin Force-Release (`rider-admin-release.service.spec.ts`):**
   - 21 unit test cases covering own-store OnlineOrder release, POS order release, unauthorized rider role rejection, store mismatch rejection, unauthenticated rejection, unassigned rejection, 6 terminal states rejection, status preservation, claim clearing, bridge synchronization, audit logging, broadcast, and post-release re-claimability.
   - **Result: 21 / 21 PASSED.**

2. **Backend Safe User Management (`users.service.spec.ts`):**
   - 7 unit test cases covering Prisma P2003 FK catch -> 409 Conflict, actionable error message, non-dependent user delete, deactivate, reactivate, and suspended/terminated login block.
   - **Result: 7 / 7 PASSED.**

3. **Backend Full Regression Suite:**
   - **Result: 76 / 76 test suites PASSED (634 / 634 tests).**
   - PostgreSQL concurrency integration tests: **2 / 2 PASSED.**

4. **POS Client UI Tests (`riderForceRelease.test.ts`):**
   - 9 unit tests covering confirmation modal details, eligibility checks, state updates, API error formatting, and conflict handling.
   - **Result: 10 / 10 test files PASSED (192 / 192 tests).**

5. **Cross-Tab Real Browser Web Locks Test (`test-multitab-browser.cjs`):**
   - **Result: 7 / 7 PASSED with zero regressions.**

---

*Document maintained by: D4U AI Team | Sprint 29.2 | 2026-09-26*
