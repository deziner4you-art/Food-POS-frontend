# Custom UI Popups Only
Never use native browser popups (e.g., `alert()`, `confirm()`, `prompt()`) anywhere in the frontend applications (`d4u-admin`, `d4u-pos-client`, `d4u-rider`, `d4u-website`). Native browser popups can be blocked by the browser. Always use custom UI elements (like Toast notifications or Modal dialogues) for alerts and confirmations.

---

# D4U POS Project — Permanent Knowledge Base

## Project Overview
- **Project Name:** D4U POS (Deziner4You Restaurant POS System)
- **Workspace:** `g:\RESTAURANT_POS_WITH_BACKEND`
- **Architecture:** Multi-app monorepo

## Application Stack

### Backend — `d4u-pos-backend`
- **Framework:** NestJS (Node.js)
- **Database ORM:** Prisma
- **Database:** SQLite (file-based)
- **Auth:** JWT + bcryptjs
- **Real-time:** Socket.IO (WebSockets)
- **Port:** 3001
- **Start Command:** `npm run start:dev` (from `d4u-pos-backend/`)

### Admin Panel — `d4u-admin`
- **Framework:** Vite + React + TypeScript
- **Styling:** TailwindCSS v4
- **Port:** 5300
- **Start Command:** `npm run dev` (from `d4u-admin/`)

### POS Client — `d4u-pos-client`
- **Framework:** Vite + React + TypeScript
- **Styling:** TailwindCSS v4
- **Offline DB:** Dexie (IndexedDB)
- **Real-time:** Socket.IO client
- **Port:** 5173 (default Vite)
- **Start Command:** `npm run dev` (from `d4u-pos-client/`)

### Rider App — `d4u-rider`
- **Framework:** Vite + React + TypeScript
- **Port:** 3000
- **Start Command:** `npm run dev` (from `d4u-rider/`)

### Website / Customer Portal — `d4u-website`
- **Framework:** Vite + React + TypeScript
- **Port:** 5200
- **Start Command:** `npm run dev` (from `d4u-website/`)

## Demo Login Credentials (Seed Data)

| Role | Phone | PIN |
|------|-------|-----|
| Cashier (Branch 1) | 03000000001 | 1234 |
| Manager (Branch 1) | 03000000002 | manager123 |
| Super Admin | 03000000003 | admin |
| Cashier (Branch 2) | 03000000004 | 1234 |
| Manager (Branch 2) | 03000000005 | manager123 |
| Cashier (Branch 3) | 03000000006 | 1234 |

## Branch / Store Mapping
- Branch 1 (store_id: 1) — DHA Branch
- Branch 2 (store_id: 2) — Gulberg Branch
- Branch 3 (store_id: 3) — Johar Town Branch

## Key Business Logic
- **Business Day:** Must be opened before any orders. Use `close-day.js` script if a day is stuck open.
- **Closing a stuck Business Day:** Run `node close-day.js` from `d4u-pos-backend/`
- **KOT Flow:** Cart → KOT → Kitchen Display → Ready → Bill/Pay
- **Online Orders:** Come from website/rider app via WebSocket, accepted in POS Online tab
- **Delivery Flow:** Online Order → Accept & Send to KDS → Dispatch → Rider → Settle Cash
- **Offline Sync:** POS client syncs offline orders to backend every 30 seconds

## Important Files
- `d4u-pos-client/src/App.tsx` — Main POS app (all screens, cart, modals)
- `d4u-pos-backend/prisma/schema.prisma` — Database schema
- `d4u-pos-backend/prisma/seed.ts` — Database seed data
- `d4u-admin/src/App.tsx` — Admin panel app
- `d4u-pos-backend/src/` — All NestJS modules (auth, orders, catalog, etc.)

## How to Run All Apps
Run each in a **separate terminal window**:
```bash
# Terminal 1 — Backend
cd d4u-pos-backend && npm run start:dev

# Terminal 2 — Admin Panel
cd d4u-admin && npm run dev

# Terminal 3 — POS Client
cd d4u-pos-client && npm run dev

# Terminal 4 — Rider App
cd d4u-rider && npm run dev

# Terminal 5 — Website
cd d4u-website && npm run dev
```

## Coding Rules
- Never use `alert()`, `confirm()`, `prompt()` — use Toast or Modal instead
- All frontend apps use custom UI popups only
- Backend URL is auto-detected: `http://<hostname>:3001`
