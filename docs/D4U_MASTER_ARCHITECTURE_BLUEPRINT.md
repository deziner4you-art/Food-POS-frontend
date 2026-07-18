# Title: D4U Master Architecture Blueprint
**Version:** 3.0
**Last Updated:** July 2026
**Purpose:** The official technical constitution of the D4U platform.
**Dependencies:** None
**Related Documents:** 01_D4U_ENTERPRISE_ARCHITECTURE.md
**Author:** AI Chief Software Architect
**Status:** FINAL

---

## 1. Executive Summary

The D4U platform is an enterprise-grade SaaS ecosystem designed to handle complex multi-tenant, multi-store retail and service operations. Originally forged in the demanding environment of the restaurant industry—where internet outages, power failures, and high-speed transaction volumes are the norm—D4U has evolved into a robust, offline-capable platform. 

This architecture exists to provide centralized cloud control (HQ) while ensuring decentralized operational resilience (Edge). The goal of this blueprint is to standardize the evolution of the platform. We are not rebuilding; we are evolving intelligently. This document serves as the absolute constitution governing all technical decisions, ensuring the system remains stable, profitable, and infinitely scalable across diverse industries.

---

## 2. Architecture Philosophy

Every technical decision must be weighed against these core principles:

- **Simple:** Avoid over-engineering. Choose the most direct, readable, and native solution available.
- **Maintainable:** Code is read far more than it is written. Adhere strictly to the defined project structures and naming conventions.
- **Scalable:** The system must gracefully scale from 1 store to 1,000 stores without structural rewrites.
- **Migration Safe:** Data is the most valuable asset. Schema and structural changes must never destroy or orphan historical data.
- **Offline First:** Operational edges (POS) must never halt due to network loss. Walk-in business must flow continuously.
- **Real-Time First:** State changes (orders, dispatch, KOTs) must be broadcasted instantly to relevant connected clients.
- **Backward Compatible:** New APIs and database columns must not break existing, deployed legacy clients.
- **Production Safe:** All features must be toggleable and released safely without risking the stability of the live business.

---

## 3. High Level Architecture

The D4U platform is a hybrid Cloud-Edge ecosystem comprising the following pillars:

- **Admin (HQ Portal):** A web application for Super Admins and Brand Owners to manage global pricing, reporting, SaaS billing, and module toggling.
- **Backend (API Core):** A NestJS Modular Monolith serving REST APIs for standard CRUD operations and bridging real-time states.
- **POS (Edge Client):** The offline-first operational client used by cashiers, utilizing local IndexedDB for continuous operation.
- **Website (Customer UI):** The consumer-facing storefront for e-commerce, online ordering, and loyalty management.
- **Rider (Fleet UI):** A mobile-optimized web application for delivery tracking, GPS broadcast, and cash settlement.
- **Kitchen (KDS):** Embedded logic within the POS client to act as the digital Kitchen Display System, communicating locally and globally via WebSockets.
- **Database:** PostgreSQL acts as the single source of absolute truth for the cloud.
- **Socket Server:** Integrated within the NestJS backend, managing bidirectional real-time communication.
- **Offline Engine:** Local browser storage (Dexie/IndexedDB) acting as the resilient edge ledger.

---

## 4. Project Structure

The project structure must remain intuitive, promoting code reuse without forcing a complex microservices sprawl.

- `apps/`
  - `admin/` (React HQ Portal)
  - `pos/` (React Point of Sale & KDS)
  - `website/` (React Customer Storefront)
  - `rider/` (React Delivery App)
- `backend/`
  - `src/` (NestJS API Core)
- `packages/` (Future extraction target)
  - `shared-types/` (Shared DTOs and Interfaces)
  - `shared-ui/` (Reusable React components)
  - `shared-utils/` (Currency formatting, date logic)

*Rule: Do not over-abstract until a piece of logic is actually utilized by more than one application.*

---

## 5. Backend Architecture

The backend will strictly remain a **NestJS Modular Monolith**. We will NOT split the system into network-bound microservices.

- **Recommended Module Structure:** Group by business domain (e.g., `SaasModule`, `OrdersModule`, `InventoryModule`, `AuthModule`).
- **Module Responsibilities:** Each module is fully responsible for its own domain logic, validating its own inputs, and managing its specific database entities.
- **Communication Between Modules:** Modules communicate via internal Service injection (e.g., `OrdersService` injecting `InventoryService`), keeping communication within the same memory space to avoid network latency.
- **Dependency Rules:** Avoid circular dependencies. Core modules (like Auth or DB) sit at the bottom, while feature modules sit on top.

---

## 6. Frontend Architecture

Frontend applications (React + Vite) must transition away from single-file monoliths.

- **Components:** Dumb, presentation-only UI elements (Buttons, Cards, Inputs).
- **Hooks:** Custom React hooks (`useOrderSync`, `useCart`) containing purely state and lifecycle logic.
- **Services:** API wrappers abstracting network calls and Socket.io event emissions.
- **Stores:** Global state management (Context/Zustand) for user sessions, cart, and offline status.
- **Pages:** Top-level route components that wire together Hooks, Stores, and Components.
- **Layouts:** Wrapper components dictating the macro UI structure (Sidebar, Header, Content Area).
- **Utilities:** Pure functions for localized logic (e.g., calculating tax percentages).

---

## 7. Database Philosophy

- **Current Database:** PostgreSQL managed via Prisma ORM.
- **Future Growth:** Partitioning large transactional tables (like `Orders` and `CashFlow`) by time/date when row counts exceed performance thresholds.
- **Migration Strategy:** "Expand and Contract". Add new columns/tables first (Expand). Migrate data. Then, and only then, drop the old columns (Contract) in a future, safe release.
- **Naming Conventions:** `snake_case` for database tables and columns.
- **Indexes:** Always index Foreign Keys. Use compound indexes for frequently paired lookups (e.g., `store_id` + `createdAt`).
- **Relations:** Enforce strict foreign key constraints. Never rely purely on application-level logic for relational integrity.
- **Audit Philosophy:** Critical tables must include `created_by`, `updated_by`, and `deleted_at`.
- **Soft Delete:** Never `DELETE` records in production. Always update the `deleted_at` timestamp to preserve historical financial integrity.

---

## 8. SaaS Architecture

The SaaS engine must evolve from hardcoded booleans to a dynamic, data-driven ecosystem.

- **Module Registry:** A definitive table mapping all available system capabilities (e.g., POS, KDS, Accounts).
- **Packages:** Logical bundles of Registry Modules (e.g., "Pro Tier", "Basic Tier").
- **Pricing:** Dynamic engine calculating base cost + module cost + usage cost.
- **Subscription:** The overarching tenant agreement linking a Brand to their licensed capabilities.
- **Licensing:** Device or Store-level authorization tokens to enforce SaaS compliance.
- **Billing:** Automated ledger tracking recurring payments and generating invoices.
- **Proposal:** System capability to generate customizable quotes for new clients.
- **Coupons:** Marketing engine applying discounts to SaaS onboarding or recurring fees.
- **Trial:** Time-bound, fully-featured onboarding access that automatically gracefully degrades upon expiry.
- **Future Industry Support:** Core entities must be named generically (e.g., "Store", "Product", "Service", "Order") rather than industry-specific jargon ("Restaurant", "Dish").

---

## 9. Offline Architecture

Resilience is the defining feature of D4U.

- **Dexie:** Acts as the primary operational database for the Edge POS client. Read/Write happens here first.
- **Sync Queue:** Every offline mutation is pushed to an outbound queue array.
- **Conflict Resolution:** Utilizing **Event Sourcing** logic (e.g., "Add 5 to stock", not "Set stock to 10") to prevent Last-Write-Wins data corruption.
- **Retry & Recovery:** Exponential backoff mechanism. If the cloud is unreachable, the queue pauses and retries sequentially upon network restoration.

---

## 10. Real-Time Architecture

- **Engine:** Socket.io.
- **Events:** Must use standardized, uppercase screaming snake case (e.g., `ORDER_CREATED`, `KOT_ACCEPTED`).
- **Namespaces & Rooms:** Global namespace, tightly scoped into Rooms based on `store_id` (e.g., `store_14`). A client should never receive another tenant's real-time events.
- **Reconnect Strategy:** Upon socket reconnection, the client must query the REST API to fetch any states missed during the disconnection window before resuming pure Socket listening.

---

## 11. Security Architecture

- **Authentication:** Standard JWT methodology. Local caching of hashed credentials for offline shift handovers.
- **Authorization:** Enforced via backend middleware and guards before any controller logic executes.
- **RBAC (Role-Based Access Control):** Granular matrix of Roles mapped to distinct Permissions.
- **Audit Logs:** Immutable tracking for sensitive actions (Voids, Stock Overrides, Discount Approvals).
- **Rate Limiting:** Protect public endpoints (Website, Login) against brute force and DDoS.
- **Password Policy:** Enforce Bcrypt hashing, minimum length, and complexity requirements.

---

## 12. Performance Strategy

- **Caching Strategy:** Utilize in-memory caching (Redis) for heavy, infrequent read operations (e.g., loading the master menu configuration).
- **Database Optimization:** Prisma queries must use `select` to fetch only required columns. Avoid querying massive JSON blobs if only one field is needed.
- **Lazy Loading:** Frontend routes and massive libraries must be asynchronously loaded via React Suspense to keep the initial bundle lightweight.
- **Pagination:** Implement Cursor-based or Offset-based pagination on all list endpoints. Never return unpaginated datasets.
- **Optimization Rules:** Identify and eliminate N+1 query problems in Prisma utilizing proper `include` relation joins.

---

## 13. Development Standards

- **Folder Standards:** Group files by Domain/Feature, not by technical type. (e.g., `/features/orders/` instead of `/components/orders/`).
- **Naming Standards:** 
  - `PascalCase` for React Components, Classes, and Interfaces.
  - `camelCase` for functions, variables, and instances.
  - `snake_case` for database columns and API JSON payloads.
- **Coding Standards:** Strict TypeScript mode enabled. `any` type is strictly prohibited in new code. Vite 8 requires `import type` for all TypeScript interfaces.
- **Documentation Standards:** Adhere strictly to the D4U Naming Convention for markdown files. Update documentation concurrently with architecture changes.

---

## 14. Migration Philosophy

- **How future changes must happen:** Iteratively. Breaking a large feature down into small, independently deployable PRs.
- **How production data must be protected:** Database backups are mandatory prior to any schema push. Schema alters must be non-destructive.
- **Rollback principles:** Every deployment must have a clear reversal path. If a new column causes a crash, the application code rolls back, but the database schema change remains inert until fixed.

---

## 15. Future Expansion

The D4U platform is designed for **Retail Agnosticism**. 
It will effortlessly expand to:
- Quick Service Restaurants
- Retail Shops & Supermarkets
- Salons & Spas
- Clinics & Pharmacies
- Workshops & Automobile Services

**How the architecture supports this:** 
By maintaining abstract core primitives. An `Order` is a transaction. A `Product` is a sellable entity. A `Resource` (Chef, Stylist, Mechanic) fulfills the order. A `Terminal` is where the sale occurs. We do not hardcode "Kitchen" into the database; we utilize a "Fulfillment Station" concept, allowing the core backend to serve a Salon just as effectively as a Burger Joint without altering the engine.

---

## 16. Final Principles

Every developer, architect, or AI agent contributing to the D4U platform is bound by these non-negotiable rules:

1. **NEVER break production.** If a feature risks stability, it does not ship.
2. **DO NOT over-engineer.** Solve the problem in front of you. If it doesn't need Kubernetes or Microservices, do not add them.
3. **PRESERVE the offline experience.** The system must survive the harshest network environments.
4. **NO code duplication.** If you write it twice, extract it.
5. **RESPECT the branding.** This is the D4U Platform. All code, docs, and assets must reflect this standard.

***End of Document.***
