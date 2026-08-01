# Tracked issue: online order state machine does not block backward transitions

**Status:** open, undecided severity pending a product call — see "Severity" below.
**Discovered:** surfaced by comparing two uncommitted/committed copies of an
agent-generated investigation doc (see
`docs/verification/rider-arrived-contract.uncommitted-v2.md`), then
independently re-verified line-by-line against the current codebase on
2026-07-31 (not taken on the doc's word — every citation below was re-read
directly).
**Scope of this doc:** documentation only. No source file is modified as
part of filing this issue.

## The verified finding

`OnlineOrdersService.updateOrderStatus` guards only against skipping too far
**forward**. It does not guard against a status moving **backward** at all.

```typescript
// d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:309-315
const currentIndex = STATE_SEQUENCE.indexOf(existingOrder.status);
const targetIndex = STATE_SEQUENCE.indexOf(incomingStatus);

if (currentIndex !== -1 && targetIndex !== -1) {
  if (targetIndex > currentIndex + 1) {
    throw new Error(`Invalid state transition from ${existingOrder.status} to ${incomingStatus}. States must be sequential.`);
  }
}
```
*(`online-orders.service.ts:314`)*

`targetIndex > currentIndex + 1` is the only condition that throws. Any
`targetIndex <= currentIndex` — i.e. moving to the current status again, or
to any earlier status in the sequence — satisfies the condition as `false`
and is silently accepted, updates the DB row, writes an event-log entry, and
broadcasts `order_updated` over the socket exactly as a legitimate forward
transition would (`online-orders.service.ts:322-339`).

## Full sequence, and which transitions are unprotected

```typescript
// online-orders.service.ts:287-299
const STATE_SEQUENCE = [
  'ONLINE_ORDER_RECEIVED',   // 0
  'CONFIRMED',               // 1
  'KITCHEN_PREPARING',       // 2
  'READY',                   // 3
  'RIDER_ARRIVED',           // 4
  'PRINT_BILL',              // 5
  'DISPATCHED',              // 6
  'OUT_FOR_DELIVERY',        // 7
  'DELIVERED',                // 8
  'WAITING_CASH_SETTLEMENT', // 9
  'SETTLED',                 // 10
];
```

Protected: any request where `targetIndex > currentIndex + 1` (e.g.
`CONFIRMED` → `DISPATCHED`, skipping 4 states) — rejected with a thrown
`Error`.

Unprotected: any request where `targetIndex <= currentIndex` — e.g. an
order at `OUT_FOR_DELIVERY` (7) can be PATCHed back to `RIDER_ARRIVED` (4),
`CONFIRMED` (1), or even `ONLINE_ORDER_RECEIVED` (0), and the backend
applies it without complaint. Re-verified directly by reading
`online-orders.service.ts:287,309,310,313,314` — matches the stray doc's
claim exactly, not stale.

## THE DECIDING QUESTION — can any current UI path trigger this today?

Checked all four surfaces named in the task:

**POS client** (`d4u-pos-client/src/App.tsx`) — every PATCH to
`/online-orders/:id` is a hardcoded literal status tied to one specific
button, and every one of those buttons is itself gated by the delivery
card's *current* status:
```tsx
// App.tsx:2366
{['READY', 'RIDER_ARRIVED', 'PRINT_BILL', 'WAITING_CASH_SETTLEMENT'].includes(del.status) && (
  ...
  {del.status === 'READY' && ( /* button sends RIDER_ARRIVED */ )}
```
Buttons for `RIDER_ARRIVED` (2377), `PRINT_BILL` (2401), `DISPATCHED`
(2423), `SETTLED` (2451, 2499) each only render for one specific prior
`del.status`, and each sends exactly one forward literal. There is no
free-form status dropdown or override control anywhere in this file. No
combination of clicks available today reaches a backward call. Grep for a
manual/admin status override across `d4u-admin/src` found nothing that
touches `online-orders` or `updateOrderStatus` at all — d4u-admin has no
code path to this endpoint.

**Rider app** (`d4u-rider/src/App.tsx`) — `updateBridgeStatus` is called
exactly 4 times, each with a hardcoded forward literal in call order:
`RIDER_ARRIVED` (was line 268 in the pre-fix version, now goes through
`handleArriveAtRestaurant`), `OUT_FOR_DELIVERY` (278), `DELIVERED` (286),
`WAITING_CASH_SETTLEMENT` (287). No back/undo control exists in the rider
UI. A double-tap on an already-fired button would resend the *same* status
(`targetIndex === currentIndex`, also technically unprotected — see below
— but not a *regression*, just a harmless duplicate broadcast), not an
earlier one, because each screen only exposes the one button for the
rider's current step.

**Website / customer side** — no code path found anywhere in
`d4u-website/src` that issues a `PATCH` to `online-orders`. Customers have
no status-setting capability at all.

**Answer: NO** — no UI path in any of the four apps can reach a backward
transition today. Every caller that exists sends a single hardcoded forward
literal, gated by the caller's own current-status check.

**Severity: HIGH — hardening, not urgent**, per the task's own rule (no
live UI path today → HIGH, not BLOCKER). This does **not** change the
deploy decision for the four branches currently staged — none of them
touch `online-orders.service.ts`, and none of the four apps' current
button set is capable of firing this. The gap is real but latent: the
danger is a *future* caller (a new admin override screen, an API
integration, a retried/replayed request from an unreliable rider network
connection carrying a stale intent) landing on this endpoint with no state
machine defense at all, plus the one path documented below that already
somewhat matters.

## Second question — is rider ownership checked on PATCH?

**Answer: NO — not checked at all, and the one check that exists on this
endpoint doesn't actually run.** This is a broader finding than the
backward-transition question asked for, surfaced while tracing the
authorization path to answer it; recorded here rather than silently
dropped.

1. **No rider-assignment check exists anywhere in `updateOrderStatus`.**
   The method takes `id`, `data`, and `userStoreId` — nothing that compares
   `existingOrder`'s assigned rider against the caller's identity. Any
   authenticated caller with access to this endpoint can PATCH any order at
   any store to any non-forward-skipping status, whether or not they are
   the rider (or even a rider at all) assigned to it.

2. **The store-scoping check that *does* exist never fires for a normal
   token.** The only authorization check present is:
   ```typescript
   // online-orders.service.ts:282-284
   if (userStoreId && existingOrder.store_id !== userStoreId) {
     throw new Error('Unauthorized: Cannot modify orders belonging to another branch.');
   }
   ```
   `userStoreId` is `user?.store_id` from the controller
   (`online-orders.controller.ts:128`). But the JWT payload built at login
   (`AuthService.buildTokenPayload`,
   `d4u-pos-backend/src/modules/core/auth/auth.service.ts:40-49`) never
   sets a `store_id` field — only `active_store_id`:
   ```typescript
   // auth.service.ts:40-49
   return {
     sub: user.id,
     name: user.name,
     assignment_ids: assignmentIds,
     active_assignment_id: activeAssignment?.id ?? null,
     active_brand_id: activeAssignment?.brand_id ?? user.brand_id,
     active_store_id: activeAssignment?.store_id ?? user.store_id,
     workspace_selection_required: assignmentIds.length > 1 && !activeAssignment?.id,
   };
   ```
   `JwtAuthGuard` assigns this decoded payload directly to `request.user`
   with no remapping (`jwt-auth.guard.ts:36`: `(request as any).user =
   payload;`). So `user?.store_id` is `undefined` for every token issued by
   the standard login flow, making `if (userStoreId && ...)` false before
   the comparison even runs — the branch-scoping check is dead code in
   practice for this endpoint, not just missing rider-level ownership.
   Confirmed the rider app uses this exact standard login, not a separate
   session type: `d4u-rider/src/components/LoginView.tsx:22` calls
   `${BACKEND_URL}/auth/login`, the same endpoint POS/admin staff use.

3. **The permission check above that is separately compounding this:**
   `PermissionsGuard.canActivate` (`permissions.guard.ts:38-40`) returns
   `true` for *any* token containing a `sub` claim, before it ever inspects
   `requiredPermissions`:
   ```typescript
   // permissions.guard.ts:36-40
   // In current phase (EWO-I001 completed, EWO-I002 PermissionsGuard pending),
   // JWT contains sub and assignment_ids. Allow authenticated users.
   if (user.sub) {
     return true;
   }
   ```
   Every token from `buildTokenPayload` has `sub: user.id`
   (`auth.service.ts:41`), so the `@RequirePermissions('sales.update')`
   guard on this PATCH endpoint (`online-orders.controller.ts:121`) is
   currently a no-op for any authenticated user, regardless of role. The
   comment marks this as a known, intentional interim state ("EWO-I002
   PermissionsGuard pending"), not something introduced by this
   investigation — noted here because it directly compounds the ownership
   answer: the *only* thing standing between "authenticated" and "can PATCH
   this order to any non-forward-skip status" today is possession of any
   valid token.

## Proposed fix sketch (NOT implemented — documentation only)

Two independent gaps, two independent fixes, neither should block the
other:

- **Backward transitions:** add a second guard alongside the existing
  forward-skip check — e.g. reject `targetIndex < currentIndex` unless the
  target is an explicitly allow-listed exception (a real "SETTLED refund
  reopen" flow, if one is ever wanted, would need an explicit escape
  hatch, not silent permission by omission). Needs a product decision on
  whether *any* legitimate backward case exists today before writing the
  guard, since none of the current UI callers need one.
- **Ownership / store scoping:** fix `online-orders.controller.ts:128` to
  read `user?.active_store_id` (the field that actually exists) instead of
  `user?.store_id`, which makes the existing store-scoping check start
  actually running. Rider-level ownership (this specific rider vs. the
  order's assigned rider) would need a new check entirely — no field to
  compare against exists in `updateOrderStatus` today, so this is new
  logic, not a one-line fix.
- **Permission bypass:** out of scope for this doc entirely — it's a
  platform-wide, already-flagged-in-code interim state (EWO-I002), not
  specific to online orders.

None of the above is implemented here. This file only documents current
behavior and cites where a future fix would go.
