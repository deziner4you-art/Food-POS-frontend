# D4U Multi-Store Enterprise POS & Management System
**System Architecture Context - Master Blueprint**

**Project Name:** Multi-Store Fast-Food POS & Order Management System  
**Agency:** Designer For You (D4U)  
**Version:** 2.0 (Production-Ready)  
**Target Architecture:** Multi-tenant (40+ Stores), Hybrid Cloud-Edge, Offline-First  
**Target AI:** Optimized for Claude / Gemini / Cursor within IDE environments to generate production-grade schemas and APIs.

## 1. Project Overview
یہ سسٹم پاکستان کی فاسٹ فوڈ چین (40+ برانچز) کے لیے ایک مکمل Enterprise POS اور Management Solution ہے۔ یہ **سنگل کوڈ بیس** پر چلے گا اور تمام برانچز کو ایک مرکزی کلاؤڈ سے کنٹرول کرے گا۔

**پاکستانی مارکیٹ کی گراؤنڈ ریئلٹیز:**
- بار بار بجلی اور انٹرنیٹ کی بندش (Offline resilience is mandatory)
- زیادہ تر کیش اور COD آرڈرز (Cash management accuracy)
- اندرونی چوری اور mismanagement کا خطرہ (Strict audit trails)
- کچن سٹاف کے لیے آسانی (Urdu UI support + Voice Alerts)
- لیٹ نائٹ آپریشنز (Logical Business Dates bridging midnight)

**Core Modules**
- **Backend Admin Panel:** Web-based central portal for Super Admin & Investors.
- **Local POS:** Offline-first Desktop/Web App for branch cashiers.
- **Customer App:** Flutter-based (Delivery, Takeaway, Dine-in) with real-time tracking.
- **Rider App:** Flutter-based delivery & fleet management.
- **Digital KDS:** Kitchen Display System with Voice & Touch interaction.

## 2. Core Architecture Principles
- **Multi-Tenant Design:** `store_id` is mandatory in all transactional tables.
- **Modular SaaS Feature Toggling:** The system is strictly modular. The Super Admin has global switches to turn modules ON/OFF per client/brand (e.g., POS Only, POS + Online Ordering, POS + Vendor PO, Marketing Engine). The codebase and UI must dynamically adapt to these feature flags without breaking.
- **Offline-First:** Local SQLite/IndexedDB syncing with Cloud PostgreSQL upon network restoration.
- **Single Codebase:** Centralized feature management.
- **Event-Driven Sync:** Edge-to-Cloud synchronization must handle conflict resolution gracefully.

## 3. Technology Stack Recommendation
- **Backend Core:** Node.js (NestJS) OR PHP (Laravel 11) for robust REST/GraphQL APIs.
- **Database:** PostgreSQL (Central) + Redis (Real-time Queues/Caching).
- **Local POS:** Electron / Tauri / React PWA + Local SQLite.
- **Mobile Ecosystem:** Flutter (Single codebase for iOS & Android apps).
- **Real-time Comms:** Socket.io / WebSockets (KDS & Order Tracking).
- **Background Jobs:** BullMQ / Redis Queues (Inventory deductions & Async tasks).

## 4. Database Schema Principles (Strict Enforcement)
- **Multi-tenant Isolation:** Scoped by `store_id` at the database query level.
- **Synchronization Logic:** - **CRITICAL:** DO NOT use "Last Write Wins" for inventory/finance. Use **Event Sourcing (Append-only Transaction Logs)** to ensure accurate ledger balancing upon sync (`+10`, `-5` operations).
- **Audit Trails:** `created_by`, `updated_by`, `changed_by`, `reason`, `approved_by` on all sensitive tables.
- **Local Credential Caching:** Hashed auth data cached locally to allow shift changes during internet outages.

## 5. Key Business Engines

### A. Inventory & Recipe Engine
- **Raw Material Tracking:** Managed at the ingredient level (e.g., 20g Mayo, 1 Box).
- **Automated Deduction:** Recipe-based background job triggers on order completion.
- **Negative Inventory (Soft Block):** POS allows sales even if stock is zero to prevent operation halts, triggering a "Red Alert" for manager reconciliation.
- **Cost Security:** Recipe cost edits restricted strictly to Super Admin (requires password + reason).

### B. Promotions & Dynamic Deal Engine
- **Margin-Based Discounts:** Discounts calculated against profit margins, preventing loss-making sales.
- **Margin Protection Trigger:** Auto-pauses deals if raw material cost updates push margins below the safety threshold.
- **Slot-Based Combos:** JSON-driven architecture for custom meal building.

### C. Offline & Shift Management
- **Logical Business Date:** Operations explicitly bound to a "Day Start" and "Day Close" state, ignoring OS midnight rollovers.
- **Deferred Rider Cash:** System allows shift closing with pending rider cash; flags it as an un-dismissible popup for the next morning's shift.

### D. KOT & Kitchen Operations
- **Triple Print Routing:** Customer receipt, Cashier copy, Kitchen KOT.
- **Resilience:** Auto-fallback to thermal printers if Digital KDS screen drops offline.
- **Urdu Voice Alerts:** TTS integration for special instructions in the kitchen.

### E. Marketing & Growth Engine (D4U Model)
- **Digital Marketing SLA:** Auto-tracks `Baseline_Target`. Calculates Retainer + Bonus Commission for targets met, or applies Penalties for shortfalls (Skin in the game).
- **Affiliate Ecosystem (4-Tiers):**
  - **Influencers:** Unique Deep-Links, `Online_Only` codes, `MAX_USES_PER_USER=1`.
  - **Rider Promoters:** Acquisition bonus for app downloads via Rider QR.
  - **Refer-a-Friend:** Viral loop discounts.
  - **B2B / Corporate:** Standee QR codes for office/gym cross-promotions.

## 6. Role-Based Access Control (RBAC)
- **Level 1 (Global):** Super Admin (System core), Brand Owner / Investor App (Read-only live P&L).
- **Level 2 (Regional):** Head Office Admin, Marketing Admin.
- **Level 3 (Branch):** Branch Manager, Accounts.
- **Level 4 (Operational):** Cashier, Rider, Kitchen Staff.

## 7. AI Development & Prompt Instructions
When generating backend logic, API routes, or database migrations based on this context:
1. **Always apply `store_id` scoping:** Implement middleware to extract `store_id` from JWT and automatically scope database queries.
2. **Concurrency Safety:** Use atomic database transactions (`BEGIN; UPDATE... COMMIT;`) for all inventory and wallet balance updates.
3. **Offline Sync Handling:** Generate sync endpoints that process batch arrays of offline actions safely using the Append-Only ledger logic.
4. **Validation:** Ensure all sensitive endpoints (voids, overrides) mandate `manager_pin` and `reason` payloads.
5. **Urdu Data Handling:** Ensure database character sets support UTF-8 (`utf8mb4` for MySQL/PostgreSQL) to store Urdu strings and instructions perfectly.

## 8. Kitchen Display System (KOT Architecture)
- **Standalone Dedicated Display:** The Kitchen Display is decoupled from the Cashier POS layout, operating as a distinct UI/route (/kitchen).
- **Special Instructions Handling:** Order payloads will now include a 
otes string to capture custom instructions (e.g. 'Extra Cheese') directly from the Cashier cart or online payload.
- **Offline-First Synchronization Flow:** React components (App.tsx and KitchenDisplay.tsx) are bound to Dexie's kots table via useLiveQuery. This ensures offline-resilient, instant cross-tab communication for 'PREPARING' and 'READY' status transitions.
- **Cashier KOT Monitoring:** The POS `App.tsx` embeds the `KitchenView` component with a `readOnly={true}` property in its KOT tab. This enables the cashier to monitor real-time kitchen order cards exactly as the chef sees them, without allowing them to accidentally trigger "MARK READY" or other interactive buttons.


### 9. Phase 9: Settings & Print Formats Architecture
**Client-Side Local Storage for Hardware Settings:**
- `posSettings` object is saved in browser `localStorage`. This is intentional because printers and till logic are device-specific and shouldn't be overridden by cloud profiles.
- **Till Lock Workflow**: Utilizes a full-screen React overlay with high z-index to block all POS events if `isTillLocked` is false.
- **Duplicate KOT Overrides**: Added `printCount` to Dexie `kots` table. The React state manages a `modalType === 'MANAGER_AUTH'` barrier before invoking the `triggerKotPrint` method for KOTs with `printCount > 0`.
- **Printing**: Utilizes hidden React components (`PrintBill` and `PrintKOT`) styled with `@media print`. `window.print()` is triggered safely inside a setTimeout.

---

## 10. Frontend Implementation — Current Codebase State
*Last Updated: June 2026 — reflects all changes implemented in the live local dev build.*

### Tech Stack (Actual Running)
- **Frontend:** React + Vite 8 (Rolldown bundler — Rust-based, strict `import type` enforcement)
- **Local DB:** Dexie.js (IndexedDB) — tables: `kots`, `products`, `categories`, `transactions`, `users`
- **Ports:** Frontend → `localhost:5173` | Backend (NestJS) → `localhost:3000`
- **Primary file:** `d4u-pos-client/src/App.tsx` (~1,480 lines, single-file POS)

### CRITICAL: Vite 8 / Rolldown Breaking Change
Vite 8 switched from Rollup to Rolldown (Rust-based bundler). Rolldown is **strict** about TypeScript exports:
- TypeScript `interface` and `type` exports MUST use `import type { ... }` syntax
- Regular `import { SomeInterface }` for type-only imports causes `MISSING_EXPORT` build errors (white screen at runtime)
- **Fixed in:** `StitchKDS.tsx`, `kds/components/KitchenView.tsx`, `NewOrderOverlay.tsx`, `SettingsView.tsx`, `DashboardView.tsx`, `OrdersView.tsx`, `Sidebar.tsx`, `InventoryView.tsx`
- **Rule for future AI:** Any file importing from `./kds/types` or other type-only files MUST use `import type`

### App.tsx — Component Architecture (4-screen flow)
```
App()  [export default wrapper]
  ├── <LoginScreen onLogin={setLoggedInUser} />         ← if no user
  ├── <DayStartPage currentUser onDayStart={...} />     ← if no dayStartTime
  ├── <CashInPage currentUser onCashIn={...} />         ← if not cashed in
  └── <POSApp currentUser dayStartTime />               ← full POS
```

### 30. Login Screen
- **File:** `d4u-pos-client/src/App.tsx` — `LoginScreen` component
- **USERS array** (hardcoded, top of App.tsx): Cashier (`cashier@d4u.com` / `1234`), Manager (`manager@d4u.com` / `manager123`), Admin (`admin@d4u.com` / `admin`)
- **UI:** Dark full-screen, email + password fields, loading state, error on wrong credentials
- **Future:** Replace with Dexie `db.users` table + bcrypt hash comparison + role-based feature flags

### 31. Day Start Page & Business Day Workflow
- **File:** `d4u-pos-client/src/App.tsx` — `DayStartPage` component + `DayRecord` type
- **Trigger:** Renders after successful login, before POSApp is accessible
- **Left Panel:** Logged-in user name + last session closed time + green **Day Start** button
- **Right Panel:** History table — ID | Day Start | Day Close | action button
- **Storage:** `localStorage` key `d4u_day_history` — array of `{id, dayStart, dayClose}` ISO strings. Demo rows shown if localStorage is empty.
- **On Day Start:** Saves new record, passes `new Date()` up as `dayStartTime` → POSApp renders
- **POS Header shows:** `dayStartTime.toLocaleDateString() | dayStartTime.toLocaleTimeString()` — the logical business day anchor, NOT a live clock
- **Future:** Move to Dexie `db.businessDays` table; cloud sync on Day Close; link Day Close button to close current open record

### POS to KDS to Rider E2E Workflow

- **Online Order Creation**: Bridge (`order-bridge.cjs`) accepts `POST /online-orders`.
- **POS Polling**: POS App fetches `GET /online-orders` every 5 seconds.
- **Cashier Acceptance**: 
  - Cashier clicks "Accept & Send to KDS".
  - Bridge is patched (`PATCH /online-orders/:id`) with `kdsStatus: 'NEW_KOT'`.
  - Order populates in local IndexedDB `kots` table with `status: 'NEW'`.
  - Order items are queried against local `db.products` to resolve their exact unit prices in the POS Cart.
- **KDS Acceptance**: 
  - Kitchen Staff accepts KOT (`status: 'PREPARING'`).
  - POS local `useEffect` detects the status change and automatically patches bridge `kdsStatus: 'ACCEPTED'` along with `estimatedReadyAt`.
  - POS automatically calls `POST /dispatch-order` on the Bridge to assign it to the Rider.
  - POS Online Tab shows a green "Accepted by Chef (Dispatched)" with a live countdown timer tracking `estimatedReadyAt` and a button to print the final Bill slip.
- **Rider App Journey**:
  - Rider App polls `GET /rider-orders` to find dispatched orders.
  - App displays `estimatedReadyAt` timer so Rider knows when to pick up.
  - Rider App continuously posts its GPS coordinates (`POST /rider-location/:id`) while driving.
  - POS App polls `GET /rider-location/:id` and updates the Map marker for live tracking.
- **Cash Settlement**:
  - Rider completes delivery, triggering COD settlement screen in their App.
  - POS Cashier hits "Settle Cash" in the Delivery Tab, sending `POST /settle-order/:id`.
  - Bridge updates `kdsStatus: 'SETTLED'`.
  - Rider App polls the settlement and instantly replaces the "Pending Settle at POS" box with a green "Settled by Cashier" badge.

### 31.1 Cash In Page & Cash Out Workflow
- **File:** `d4u-pos-client/src/App.tsx` — `CashInPage` component
- **Trigger:** Renders immediately after `DayStartPage` before `POSApp` is accessible.
- **Left Panel:** User name, "Cash in amount" input, "Comment" input, and a green **Cash in** button.
- **Right Panel:** Cash in/out History table — ID | Cashin at | Cash in amount | Cashout date | Cashout amount | Action.
- **Storage:** `localStorage` key `d4u_cashin_history`
- **Cash Out Flow:** Triggered from POS Header. Prompts for amount, logs cash out in history, and automatically generates a thermal print receipt using `PrintBill`.

### 32. POS Sidebar — Current Navigation Order
```
Home        (POS selling)       — Home icon
KOT         (kitchen tickets)   — ChefHat icon
Online      (online orders)     — Globe icon
Delivery    (rider mgmt)        — Truck icon
CRM         (loyalty/customers) — Users icon
WhatsApp    (WA orders)         — MessageCircle icon
Dashboard   (analytics)         — bar chart SVG
Settings    (device settings)   — Settings icon
Garage      (internal tools)    — car SVG  [bottom]
```
> "More" popup button removed. Settings and Garage are direct sidebar items.

### 33. Header Bar — Button Order (Left → Right)
1. Store info + Day Start timestamp
2. **Cash In / Out** → `setModalType('CASH_OUT')`
3. **Day Close** → `setModalType('DAY_CLOSE')`
4. **Global Search** input (220px)

> Previously Cash In/Out and Day Close were hidden inside a "More" dropdown. Now always visible.

### 34. CRM View — Card Grid Layout
- 3-column responsive card grid
- Each card: Patron ID, name, phone, points badge, last visit date, **ATTACH TICKET** button
- **NEW CUSTOMER** floating modal for adding patrons
- Old design (phone-number search lookup) replaced with browsable grid

### 35. Garage View
- New sidebar page for internal/dev tools and admin utilities
- Renders when `activeMenu === 'Garage'`
- Not visible or accessible to regular cashiers in production (future: RBAC gate)
