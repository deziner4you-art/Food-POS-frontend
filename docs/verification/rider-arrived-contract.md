# Verification Report: RIDER_ARRIVED Backend Contract

## Q1. Where does updateBridgeStatus send its request?
- **Method:** PATCH
- **Path:** /online-orders/:id (resolved as ${BACKEND_URL}/online-orders/)
- **Headers:** Content-Type: application/json and Authorization: Bearer <token>
- **Body:** { status: bridgeStatus } (e.g., { status: 'RIDER_ARRIVED' })
- **Citation:** d4u-rider/src/App.tsx:149-160

## Q2. Does the backend accept 'RIDER_ARRIVED'?
**ACCEPTED**
The status is explicitly listed in STATE_SEQUENCE and validated by the backend during sequential state transition checks.
- **Citation:** d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:287-299 (array definition) and d4u-pos-backend/src/modules/business/online-orders/online-orders.controller.ts:122-129 (PATCH endpoint handler).

## Q3. What happens on the backend when it arrives?
- Updates the order status in the database (	his.prisma.onlineOrder.update).
- Logs the transition to the event log (	his.prisma.orderEventLog.create).
- Emits a WebSocket broadcast (	his.gateway.broadcast('order_updated', ...)).
- *Note:* It does not trigger stock deductions or new POS tickets (those are reserved for other states).
- **Citation:** d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:322-339 and 501-508.

## Q4. Does anything downstream consume RIDER_ARRIVED?
**YES**
The POS client specifically consumes and displays this status in its active deliveries UI. 
- **Citation:** d4u-pos-client/src/App.tsx:2366, 2377, 2391

## Q5. Is the call awaited and are errors surfaced?
- **Awaited:** Yes, wait updateBridgeStatus('RIDER_ARRIVED') is properly awaited in handleArriveAtRestaurant.
- **Errors Surfaced:** Yes, non-OK responses and network errors are caught and surfaced via 	oast.error().
- **Caveat:** The UI advances locally to ARRIVED_REST unconditionally *before* the API call completes, meaning if the API call rejects, the rider still visually sees the success state alongside the error toast.
- **Citation:** d4u-rider/src/App.tsx:263 (awaited call and UI advancement) and 157-165 (error handling).

## Q6. Full list of bridge status values the rider app sends anywhere
| status | sent from file:line | backend accepts? | citation |
|---|---|---|---|
| RIDER_ARRIVED | d4u-rider/src/App.tsx:268 | ACCEPTED | d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:292 |
| OUT_FOR_DELIVERY | d4u-rider/src/App.tsx:282 | ACCEPTED | d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:295 |
| DELIVERED | d4u-rider/src/App.tsx:290 | ACCEPTED | d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:296 |
| WAITING_CASH_SETTLEMENT | d4u-rider/src/App.tsx:291 | ACCEPTED | d4u-pos-backend/src/modules/business/online-orders/online-orders.service.ts:297 |
