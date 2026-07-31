# Verification Report: RIDER_ARRIVED State Machine Transition Rules

## Q1. Where are transition RULES defined?
The transition rules are defined in the backend service using a strict sequence index check. If both the current and incoming status are in the sequence, the incoming status index cannot exceed the current status index by more than 1 (meaning you cannot skip forward over states, but you can transition sequentially `+1` or fallback to any earlier state).

**Rule Definition:**
```typescript
        const currentIndex = STATE_SEQUENCE.indexOf(existingOrder.status);
        const targetIndex = STATE_SEQUENCE.indexOf(incomingStatus);

        // Strict enforcement: Do not allow skipping states (except falling back or if status not in sequence)
        if (currentIndex !== -1 && targetIndex !== -1) {
          if (targetIndex > currentIndex + 1) {
            throw new Error(`Invalid state transition from ${existingOrder.status} to ${incomingStatus}. States must be sequential.`);
          }
        }
```
**Citation:** `d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:309-317`

## Q2. Which FROM states are permitted to move to RIDER_ARRIVED?
`RIDER_ARRIVED` is at index 4 in the `STATE_SEQUENCE`. Based on the `targetIndex > currentIndex + 1` rule, `currentIndex` must be `>= 3` (or `-1` if the state is unknown).

**Permitted FROM states:**
- `READY` (index 3, forward transition)
- `RIDER_ARRIVED` (index 4, same state)
- `PRINT_BILL`, `DISPATCHED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `WAITING_CASH_SETTLEMENT`, `SETTLED` (indices 5-10, permitted because fallback transitions are explicitly allowed by the logic)
- Any state not present in the sequence (bypasses validation).

**Is PREPARING allowed?** 
NO. `KITCHEN_PREPARING` is index 2. Target 4 > (2 + 1) evaluates to `true`, which throws an error.

**Is NEW allowed?**
NO. `ONLINE_ORDER_RECEIVED` is index 0. Target 4 > (0 + 1) evaluates to `true`, which throws an error.

## Q3. What EXACTLY does the backend return if the transition is not permitted?
If the transition is invalid, the code throws `new Error(...)` (line 315). This error is caught in the surrounding try-catch block and rethrown as a `NotFoundException` (line 511). In NestJS, a `NotFoundException` automatically returns an **HTTP 404 Not Found** status code with a standard JSON body structure.

**HTTP Status:** 404
**Error Body Shape:**
```json
{
  "statusCode": 404,
  "message": "Order not found or update failed",
  "error": "Not Found"
}
```
**Citation:** `d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:315` (throws Error) and `510-512` (caught and throws `NotFoundException`).

## Q4. What does the rider app do with that response?
Trace of `d4u-rider/src/App.tsx`:
- **Is the HTTP status checked, or only network errors caught?** Both. The HTTP status is explicitly checked via `if (!res.ok)` (line 160). Network errors are handled in a standard `catch` block (line 165).
- **Does a 400/409 (or 404) response reach the catch block, or is it treated as success?** It does not reach the `catch` block (since `fetch` only throws on network failure). It enters the `if (!res.ok)` block, parses the JSON error body, and successfully displays a `toast.error` (lines 161-163).
- **Does local UI state advance regardless?** YES. In `handleArriveAtRestaurant`, the UI state is advanced via `setStatus('ARRIVED_REST')` (line 264) *before* `await updateBridgeStatus('RIDER_ARRIVED')` is called (line 268). There is no logic to revert `status` if `updateBridgeStatus` fails.

**Citations:**
- `updateBridgeStatus`: `d4u-rider/src/App.tsx:149-168`
- `handleArriveAtRestaurant`: `d4u-rider/src/App.tsx:263-269`
