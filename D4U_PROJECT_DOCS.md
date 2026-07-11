# D4U Restaurant POS — Complete System Documentation
**Last Updated:** July 2026  
**Author:** AI-assisted development session

---

## System Architecture (Updated)

```text
Customer Browser / Mobile (LAN or localhost)
    d4u-website [React + Vite] (Port 5200)
         │
         │  Socket.io & HTTP (CORS enabled)
         ▼
NestJS Backend (Port 3001)
    d4u-pos-backend [NestJS + Socket.io + PostgreSQL/Prisma]
         │
         │  Socket.io & HTTP
         ▼
POS Browser / Mobile (LAN or localhost)
    d4u-pos-client [React + Vite] (Port 5173)
         │
         │  Dexie IndexedDB (Local Data)
         ▼
    /kitchen route → StitchKDS.tsx (KDS System)
```

---

## How to Start Everything

All frontend applications are configured with `--host=0.0.0.0` to allow access from other devices on the same local network (LAN) like mobile phones or tablets.

```powershell
# Terminal 1 — NestJS Backend & Database (MUST start first)
cd g:\RESTAURANT_POS\d4u-pos-backend
npm run start:dev

# Terminal 2 — POS System
cd g:\RESTAURANT_POS\d4u-pos-client
npm run dev

# Terminal 3 — Website
cd g:\RESTAURANT_POS\d4u-website
npm run dev

# Terminal 4 — Rider App
cd g:\RESTAURANT_POS\d4u-rider
npm run dev
```

**Access Ports (Localhost & LAN IP):**
- **Backend API & WebSockets:** `http://localhost:3001`
- **POS Client:** `http://localhost:5173`
- **Customer Website:** `http://localhost:5200`
- **Rider App:** `http://localhost:3000`
- **Kitchen Display System (KDS):** `http://localhost:5173/kitchen`

---

## Technical Stack & Recent Migrations

### 1. Backend Migration (NestJS + PostgreSQL)
- The legacy `order-bridge.cjs` file has been **DEPRECATED**.
- The entire system now uses `d4u-pos-backend`, built with **NestJS**, **Prisma ORM**, and **PostgreSQL 16**.
- The database schema handles unified Online Orders, POS KOTs, and Rider Dispatch management.

### 2. Real-Time Communication (Socket.io)
- **HTTP Polling is removed**. 
- The system now relies on **Socket.io** for instant real-time synchronization.
- **d4u-website**, **d4u-pos-client**, and **StitchKDS** are connected to Socket.io rooms.
- When an order changes state (e.g., Chef clicks "Accept" in KDS), a Socket event `orderUpdated` is broadcasted. The Website auto-updates the customer UI instantly without refreshing the page.

### 3. Local Area Network (LAN) & Mobile Testing
- All Vite instances (`package.json`) use the `--host=0.0.0.0` flag.
- The `BACKEND_URL` in all frontend apps dynamically resolves the IP address (`window.location.hostname`) to ensure mobile devices on the same Wi-Fi connect to the correct backend IP, not their own localhost.

---

## Complete Online Order Lifecycle (Socket.io Flow)

```text
1. Customer opens website
2. Adds items to cart
3. Clicks "PLACE RESERVATION ORDER"
   → POST http://[IP]:3001/online-orders
   ← Returns order (e.g. ID: 1001)

4. Backend emits Socket.io event: `newOrder`
   → POS (d4u-pos-client) listens to `newOrder` and auto-adds to the "Online" tab instantly.

5. Cashier clicks "Accept & Send to KDS"
   → PATCH /online-orders/1001 { status: 'ACCEPTED' }
   → Backend emits `orderUpdated`
   → KDS (/kitchen) UI updates instantly.

6. Chef clicks "Accept" in KDS
   → PATCH /online-orders/1001 { status: 'PREPARING' }
   → Backend emits `orderUpdated`
   → Website (Customer UI) live-updates to "In Kitchen".

7. Chef clicks "Mark Ready"
   → PATCH /online-orders/1001 { status: 'READY' }
   → Backend emits `orderUpdated`
   → Website (Customer UI) live-updates to "Order Ready for Pickup!".
```

---

## Application Structure Summary

```text
g:\RESTAURANT_POS\
├── d4u-pos-backend\         NestJS API (Port 3001)
│   ├── src\
│   │   ├── app.gateway.ts   Socket.io Gateway (Real-time events)
│   │   ├── prisma\          PostgreSQL Database schema
│   │   └── ...
├── d4u-pos-client\          POS & KDS System (Vite 8, Port 5173)
│   ├── src\
│   │   ├── App.tsx          Main POS & Socket listener
│   │   ├── db.ts            Dexie schema (Offline backup)
│   │   └── StitchKDS.tsx    Kitchen Display (Socket listener)
├── d4u-website\             Customer website (Vite 6, Port 5200)
│   ├── src\
│   │   ├── App.tsx          Socket listener & Device detection
│   │   └── components\
│   │       ├── LandingMode.tsx
│   │       ├── KioskMode.tsx
│   │       └── MobileMode.tsx
├── d4u-rider\               Rider App (Vite 6, Port 3000)
│   └── src\
│       ├── App.tsx          Rider GPS & Dispatch UI
└── D4U_PROJECT_DOCS.md      This file
```
