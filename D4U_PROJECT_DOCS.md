# D4U Restaurant POS — Complete System Documentation
**Last Updated:** June 2026  
**Author:** AI-assisted development session

---

## System Architecture

```
Customer Browser (localhost:5200)
    d4u-website [React + Vite 6]
         │
         │  HTTP (CORS enabled)
         ▼
order-bridge.cjs (localhost:3001)
    Node.js built-in http — NO npm deps
         │
         │  HTTP polling (every 5s)
         ▼
POS Browser (localhost:5173)
    d4u-pos-client [React + Vite 8 + Dexie]
         │
         │  Dexie IndexedDB
         ▼
    /kitchen route → StitchKDS.tsx
```

---

## How to Start Everything

```powershell
# Terminal 1 — Order Bridge (MUST start first)
cd g:\RESTAURANT_POS
node order-bridge.cjs

# Terminal 2 — POS System
cd g:\RESTAURANT_POS\d4u-pos-client
npm run dev

# Terminal 3 — Website
cd g:\RESTAURANT_POS\d4u-website
npm run dev
```

**Ports:**
- POS: http://localhost:5173
- Website: http://localhost:5200
- Bridge: http://localhost:3001
- KDS (Kitchen): http://localhost:5173/kitchen

---

## Complete Online Order Lifecycle

```
1. Customer opens website (localhost:5200)
2. Adds items to cart
3. Clicks "PLACE RESERVATION ORDER"
   → POST http://localhost:3001/online-orders
   ← Returns order.id (e.g. 1001)
4. Website shows Order ID + live tracking begins (polls every 4s)
5. Header shows pulsing "● Order #1001" button (guest)
   OR "My Orders" panel auto-refreshes (logged-in)

6. POS Online tab polls bridge every 5s
   → Cashier sees new order
7. Cashier clicks "Accept & Send to KDS"
   → db.kots.add({ ...order, status: 'NEW', bridgeOrderId: 1001 })
   → PATCH /online-orders/1001 { kdsStatus: 'ACCEPTED' }
   → KOT print triggered
   → Cart populated for billing

8. KDS (/kitchen) shows order
9. Chef clicks "Accept" + enters prep time (e.g. 10 min)
   → Dexie: status → PREPARING
   → PATCH /online-orders/1001 { kdsStatus: 'PREPARING', prepTimeMinutes: 10, estimatedReadyAt: '...' }
   → Website shows: "In Kitchen — ~10 mins · Ready by 10:30 AM"

10. Chef clicks "Mark Ready"
    → Dexie: status → READY
    → PATCH /online-orders/1001 { kdsStatus: 'READY' }
    → Website shows: "Order Ready for Pickup!"
    → Polling stops automatically
```

---

## order-bridge.cjs — API Reference

**File:** `g:\RESTAURANT_POS\order-bridge.cjs`  
**Run:** `node order-bridge.cjs`  
**No install needed** — uses Node.js built-in `http` module only

| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| POST | `/online-orders` | `{ customer, customerPhone, items, totalAmount, notes, source }` | `{ success, order }` |
| GET | `/online-orders` | — | Array of PENDING orders (for POS polling) |
| GET | `/online-orders?phone=03xxx` | phone query param | All orders for that phone number |
| GET | `/online-orders/:id` | — | Single order object |
| PATCH | `/online-orders/:id` | `{ kdsStatus, prepTimeMinutes?, estimatedReadyAt? }` | `{ success }` |
| DELETE | `/online-orders/:id` | — | Sets status=ACCEPTED (legacy) |

**kdsStatus lifecycle:** `PENDING → ACCEPTED → PREPARING → READY`

---

## d4u-pos-client — Key Files

### db.ts — OfflineKOT Interface
```typescript
interface OfflineKOT {
  id?: number;
  orderId: number | string;
  type: string;
  items: string;
  notes: string;
  timePlaced: string;
  prepTimeMinutes: number;
  status: 'PENDING' | 'NEW' | 'PREPARING' | 'READY';
  startTime: string;
  printCount: number;
  totalAmount?: number;
  customer?: string;
  source?: string;
  bridgeOrderId?: number;    // Links to bridge order for status sync
}
```

### App.tsx — Online Orders Section
- `backendOnlineOrders` state — array of bridge orders (PENDING)
- Polls `GET http://localhost:3001/online-orders` every 5 seconds via `useEffect`
- `handleAcceptOnlineOrder(order)` — creates Dexie KOT + PATCHes bridge + triggers print

### StitchKDS.tsx — Kitchen Display
- After chef sets prep time → PATCHes bridge with `kdsStatus: 'PREPARING'`
- After "Mark Ready" → PATCHes bridge with `kdsStatus: 'READY'`
- Only sends PATCH if `kot.bridgeOrderId` exists (online orders only)

---

## d4u-website — Features Implemented

**File:** `g:\RESTAURANT_POS\d4u-website\src\components\LandingMode.tsx`

### Customer Login (localStorage)
- Click User icon → Login modal (Name + Phone)
- Stored in `localStorage` key: `d4u_customer` as `{ name, phone }`
- Logged-in users see initials button in header → My Orders panel
- Orders placed while logged in include `customerPhone`

### Guest Order Tracking
- After order → Order ID shown prominently in confirmation modal
- Header shows `● Order #1001` pulsing green button
- Click → Track Order modal (pre-filled ID, optional phone verification)
- Live 4-step timeline: Placed → Confirmed → In Kitchen → Ready

### My Orders Panel (Logged-in)
- Polls `GET /online-orders?phone=xxx` every 5 seconds when open
- Shows all orders with status + mini progress bar
- Logout button inside panel

### Header Layout
```
[DineDash] [Menu] [Deals] [Rewards] [Support]    [Search] [Track Order / Order#badge / Initials] [Cart]
                                                           └── Guest: Track Order button
                                                               Guest w/ active order: ● Order #1001
                                                               Logged in: Initials → My Orders
```

---

## d4u-website — Features Implemented (Completed)

### Tablet Mode (KioskMode.tsx)
**Source:** `C:\Users\dezin\Downloads\web_tab_app\src\components\KioskMode.tsx`
**Target:** `g:\RESTAURANT_POS\d4u-website\src\components\KioskMode.tsx`
✓ DONE — Implemented with Bridge order submission, polling tracker, and header tracking badge.

### Mobile Mode (MobileMode.tsx)
**Source:** `C:\Users\dezin\Downloads\web_tab_app\src\components\MobileMode.tsx`
**Target:** `g:\RESTAURANT_POS\d4u-website\src\components\MobileMode.tsx`
✓ DONE — Implemented with Bridge order submission, tracking state, pulsing tracking header badge, and Track Order Modal.

### Device Detection in App.tsx
✓ DONE — `App.tsx` dynamically sets `viewMode` via window resize listener (`mobile` <= 640px, `kiosk` <= 1024px, `landing` > 1024px). Cart states are successfully passed down to all three modes.

---

## Important Rules

### Vite 8 in d4u-pos-client
```typescript
// ALWAYS use import type for interfaces
import type { OfflineKOT } from './db';    // ✓ correct
import { OfflineKOT } from './db';          // ✗ will break build
```

### Vite 6 in d4u-website
No `verbatimModuleSyntax` but still use `import type` for safety.

### NestJS Backend (d4u-pos-backend)
**DO NOT TOUCH** — has `UnknownDependenciesException` for AuthService/PrismaService.  
Cannot start without a connected database. Bridge (order-bridge.cjs) replaces it for online orders.

### bridge orders are now persistent (Phase 1 Complete)
`order-bridge.cjs` stores orders in a local `live_orders.json` file.
Restarting the bridge will automatically load existing orders from disk, preventing data loss.

### Rider App & GPS Synchronization API (Phase 2 Complete)
`order-bridge.cjs` now includes:
- `POST /rider/gps` — Accepts live GPS data from the Rider App.
- `GET /rider/gps/:orderId` — Polls live Rider GPS data for the POS Client.
- Fixed a major bug where manual POS delivery orders wouldn't dispatch. Now, `POST /dispatch-order` dynamically generates a bridge order for manual deliveries, guaranteeing they reach the Rider App.

This fulfills Phase 2 of the Backend Master Plan.

---

## Folder Structure Summary

```
g:\RESTAURANT_POS\
├── d4u-pos-client\          POS system (Vite 8, port 5173)
│   └── src\
│       ├── App.tsx          Main POS — 1500 lines
│       ├── db.ts            Dexie schema
│       └── StitchKDS.tsx    Kitchen Display
├── d4u-website\             Customer website (Vite 6, port 5200)
│   └── src\
│       ├── App.tsx          Cart state + device detection (TBD)
│       ├── types.ts         FoodItem, CartItem
│       └── components\
│           ├── LandingMode.tsx    ✓ DONE — Desktop website
│           ├── KioskMode.tsx      ✓ DONE — Tablet UI
│           └── MobileMode.tsx     ✓ DONE — Mobile UI
├── d4u-rider\               Rider App (Vite 6, port 3000)
│   └── src\
│       ├── App.tsx          Mobile-first routing frame
│       └── components\      WelcomeView, ActiveRideView, HistoryView, SettleCashView
├── order-bridge.cjs         HTTP bridge (port 3001, no npm deps)
└── D4U_PROJECT_DOCS.md      This file
```
