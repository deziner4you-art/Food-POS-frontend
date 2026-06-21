# D4U Restaurant POS — Backend Master Plan & Execution Phases
**Last Updated:** June 2026 
**Goal:** Upgrade the backend infrastructure step-by-step from an in-memory bridge to a persistent, real-time tracking system with GPS synchronization.

---

## 🚨 STRICT RULES FOR AI AGENT
1. **Execute Phase by Phase:** Do not jump to the next phase until the current phase is fully built, tested, and confirmed working.
2. **Zero Downtime:** The existing `d4u-website`, `d4u-pos-client`, and `d4u-rider` MUST NOT break during these backend upgrades.
3. **Log Everything:** Write console logs for every new endpoint hit so the developer can monitor data flow in the terminal.

---

## PHASE 1: Persistent Storage (Fixing the In-Memory Data Loss)
**Current Issue:** `order-bridge.cjs` stores orders in RAM. Restarting the server deletes all live orders.
**Action Plan:**
1. Update `order-bridge.cjs` to use Node.js `fs` (File System).
2. Create a local file named `live_orders.json` in the root directory.
3. **Read/Write Logic:** - On every `POST /online-orders` or `PATCH /online-orders/:id`, rewrite the array to `live_orders.json`.
   - On startup, `order-bridge.cjs` must read `live_orders.json` to load existing orders into memory.
4. **Validation:** Ensure read/write operations are synchronous (`fs.writeFileSync`) for now to prevent race conditions during high order volumes.

---

## PHASE 2: Rider App & GPS Synchronization API
**Goal:** Allow the Rider app to send live GPS coordinates, and allow the POS/Website to fetch them.
**Action Plan:**
Update `order-bridge.cjs` to include the following new endpoints:

### 1. `POST /rider/gps`
- **Purpose:** Receives live location from the `d4u-rider` app.
- **Payload:** `{ orderId: 1001, riderId: 'R1', lat: 31.5204, lng: 74.3587, timestamp: '...' }`
- **Action:** Update the specific order in `live_orders.json` with a new `delivery` object containing the current coordinates.

### 2. `GET /rider/gps/:orderId`
- **Purpose:** POS Client and Customer Website will poll this endpoint to show the rider on a map.
- **Response:** `{ lat, lng, lastUpdated }`

### 3. `PATCH /online-orders/:id/dispatch`
- **Purpose:** Cashier clicks "Dispatch" on the POS.
- **Action:** Updates `kdsStatus` to `'DISPATCHED'` and links a `riderId` to the order.

---

## PHASE 3: Real-Time Communication (WebSocket Upgrade)
**Current Issue:** POS and Website poll the bridge every 5 seconds. This is resource-heavy and causes delays.
**Action Plan:**
1. Install `socket.io` in the backend root directory.
2. Upgrade `order-bridge.cjs` (or rename to `server.js`) to run an Express + Socket.io server.
3. **Events to Emit:**
   - `new_order`: Emitted to POS when a website order arrives.
   - `kds_update`: Emitted to Website when Chef accepts/readies the food.
   - `gps_update`: Emitted to Website/POS every time the Rider sends a location update.
4. Update `d4u-pos-client` and `d4u-website` to listen to these sockets instead of `setInterval` polling.

---

## PHASE 4: Database Integration (NestJS / Prisma Restoration)
**Goal:** Move away from local JSON files and successfully boot the broken `d4u-pos-backend` NestJS application.
**Action Plan:**
1. Fix the `UnknownDependenciesException` for `AuthService/PrismaService` in the NestJS backend.
2. Configure a local database (PostgreSQL/MySQL).
3. Generate Prisma client (`npx prisma generate`) and push schema (`npx prisma db push`).
4. Migrate all routes from the temporary Node.js bridge to the NestJS controllers.
5. Create a script to safely transfer any active orders from `live_orders.json` into the new SQL database.
