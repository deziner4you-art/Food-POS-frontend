# [PRESERVED — UNCOMMITTED SECOND INVESTIGATION] RIDER_ARRIVED Backend Contract

> **Provenance note:** This file was found uncommitted on disk at
> `docs/verification/rider-arrived-contract.md` during the branch-untangle
> work on 2026-07-31, where it collided with the already-committed version of
> the same filename (commit `2b257c8`, now living at that same path). Content
> differs substantively from the committed version (see below) — it was not
> a re-save of the same text. Likely origin: the same investigation task run
> a second time by the same agent process, on the same prompt, without the
> first run's result ever having been committed — i.e. two independent
> passes over the same question, not one file edited twice.
>
> Verified as of 2026-07-31: comparing this rescued copy against the
> current committed file (byte-identical to the copy present in the
> `G:\D4U_GEMINI` worktree, both tracing to the single commit `2b257c8` /
> `2e5e83e`) shows no further changes since this copy was rescued — this is
> the full, final content of the second pass, not a partial snapshot.
>
> Preserved here for review rather than discarded, per instruction not to
> silently drop investigation output that might contain findings the
> accepted version doesn't cover. It does — see the write-up below and
> `docs/issues/backward-status-transitions.md`.

---

# Rider Arrived Contract Verification

**1. When Rider taps "Arrived", what EXACT HTTP request is sent? (Method, URL, Body)**
- **Method:** `PATCH`
- **URL:** `/online-orders/:id` (Base URL: `http://<backend>:3001/online-orders/:id`)
- **Body:** `{ "status": "RIDER_ARRIVED" }`
*(See `d4u-rider/src/App.tsx:263` in `updateBridgeStatus` and `handleArriveAtRestaurant`)*

**2. What Controller handles this?**
- `OnlineOrdersController.updateOrderStatus`
*(See `d4u-pos-backend/src/modules/business/online-orders/online-orders.controller.ts:121-129`)*

**3. What Service method does it call?**
- `OnlineOrdersService.updateOrderStatus(Number(id), body, user?.store_id)`
*(See `d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:247`)*

**4. How does the State Machine validate it? (Show the exact line/logic)**
```typescript
      // --- STATE MACHINE ENFORCEMENT ---
      const STATE_SEQUENCE = [
        'ONLINE_ORDER_RECEIVED',
        'CONFIRMED',
        'KITCHEN_PREPARING',
        'READY',
        'RIDER_ARRIVED',
        'PRINT_BILL',
        'DISPATCHED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'WAITING_CASH_SETTLEMENT',
        'SETTLED'
      ];

// ... (Legacy status mappings) ...

        const currentIndex = STATE_SEQUENCE.indexOf(existingOrder.status);
        const targetIndex = STATE_SEQUENCE.indexOf(incomingStatus);

        // Strict enforcement: Do not allow skipping states (except falling back or if status not in sequence)
        if (currentIndex !== -1 && targetIndex !== -1) {
          if (targetIndex > currentIndex + 1) {
            throw new Error(`Invalid state transition from ${existingOrder.status} to ${incomingStatus}. States must be sequential.`);
          }
        }
```
*(See `d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:286-319`)*

**5. Will it be accepted or rejected based on the current sequence? (Assuming order is OUT_FOR_DELIVERY)**
- **Accepted.**
- **Reason:** `OUT_FOR_DELIVERY` has a `currentIndex` of `7`. `RIDER_ARRIVED` has a `targetIndex` of `4`. The validation condition checks if `targetIndex > currentIndex + 1` (i.e. if `4 > 8`). Because `4 > 8` is **false**, no error is thrown. The logic explicitly states in comments `except falling back`, meaning the state machine allows backward transitions freely while strictly preventing skipping forward.

**6. If rejected, exactly what error is thrown?**
- If an illegal forward skip is attempted (e.g., `CONFIRMED` to `DISPATCHED`), it throws:
  `throw new Error('Invalid state transition from <oldState> to <newState>. States must be sequential.');`
*(See `d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:315`)*
