# Title: D4U Backend Master Blueprint
**Version:** 3.0
**Last Updated:** July 2026
**Purpose:** The definitive architectural guide for the D4U NestJS Backend.
**Dependencies:** D4U_MASTER_ARCHITECTURE_BLUEPRINT.md
**Related Documents:** D4U_DATABASE_MASTER_BLUEPRINT.md
**Author:** AI Chief Backend Architect
**Status:** FINAL

---

## 1. Backend Vision

### The Modular Monolith
The D4U backend is strictly designed as a **Modular Monolith**. All domain logic, APIs, and real-time gateways live within a single deployable codebase (NestJS).

### Why Not Microservices?
Microservices introduce severe operational overhead: distributed tracing, network latency, complex Saga transaction rollbacks, and difficult local development setups. For a multi-tenant ERP/POS system where an `Order` heavily relies on `Inventory`, `Loyalty`, and `Billing`, splitting these into network-bound services is a catastrophic over-engineering trap.

### Future Scalability
The Modular Monolith scales infinitely better than perceived. To scale, we scale the infrastructure horizontally (running 50 instances of the monolith behind a load balancer) and scale the database vertically/sharded, rather than splitting the code itself.

---

## 2. Folder Structure
To maintain a codebase of hundreds of modules without chaos, the `src/` directory is strictly governed:

```text
src/
├── config/           # Environment validation and global config
├── common/           # Cross-cutting concerns (Guards, Interceptors, Filters)
├── database/         # Prisma client injection and seeders
├── shared/           # Types, Enums, Constants, and pure utility functions
├── events/           # Global Event definitions (Pub/Sub constants)
├── jobs/             # BullMQ Processor configurations
├── gateways/         # Global Socket.io namespaces
└── modules/          # Encapsulated Business and Core Modules
    ├── core/         # Fundamental system modules (Auth, Tenant, Billing)
    └── business/     # Industry modules (Orders, Inventory, Appointments)
```

---

## 3. Core Modules
Core modules provide the foundational plumbing of the SaaS platform. They are generic and industry-agnostic.

- **Auth:** Manages JWT generation, validation, and session caching.
- **Users:** Manages identities, hashing, and profiles.
- **Roles & Permissions:** RBAC matrix resolution.
- **Brands & Stores:** Tenant identification and hierarchy.
- **Settings:** Global and localized configuration overrides.
- **Industry:** The dictionary that maps UI terminology based on the tenant's vertical.
- **Module & Feature Registry:** Defines what a tenant is legally allowed to access.
- **Package Engine:** Wraps features into sellable bundles.
- **Subscription & Licensing:** Checks validity of tenant access on every API hit.
- **Billing & Proposal:** Financial engine for D4U corporate revenue.
- **Audit:** Immutable tracking of `changed_by` and `reason`.
- **Notification:** Abstraction for Emails, SMS, and Push.
- **Reports:** Aggregation engine for analytical endpoints.

---

## 4. Business Modules
Business modules provide the actual operational value to the tenants.

- **Restaurant & Kitchen:** F&B specific overrides and KOT tracking.
- **Inventory:** Stock ledgers, adjustments, and recipe deductions.
- **Orders:** The universal checkout and cart processing engine.
- **CRM & Marketing:** Customer profiles, loyalty wallets, and promotional campaigns.
- **Purchasing:** Vendor POs and receiving logs.
- **Accounting:** Cash flow, shift management, and End-of-Day reconciliation.
- **Delivery:** Rider dispatch and GPS tracking.
- **Appointments & Booking:** Scheduling engine for Salons/Clinics.
- **Workshop & Vehicles:** Repair tracking and bay assignments.
- **Students:** Educational tracking for driving schools.
- **Future Modules:** Sandboxed domains waiting to be plugged in.

---

## 5. Module Responsibilities
*Every module must be self-contained.*

- **Purpose:** What business problem does this solve? (e.g., `InventoryModule` ensures stock levels are accurate).
- **Responsibilities:** Define the limits. `InventoryModule` deducts stock. It does *not* calculate order pricing.
- **Dependencies:** What other modules does it need? (e.g., `OrdersModule` imports `InventoryService`).
- **Rules:** A module must never access another module's database tables directly. It must call the other module's Service.

---

## 6. Internal Communication
How the monolith breathes and interacts internally:

- **Service Injection:** Synchronous dependencies. If `Orders` needs to check `Inventory` before checkout, it injects `InventoryService`.
- **Events (EventEmitter2):** Asynchronous decoupling. When an order completes, `OrdersService` emits `ORDER_COMPLETED`. The `LoyaltyService` listens to this and awards points asynchronously without slowing down the checkout response.
- **Transactions:** Complex operations spanning multiple modules use Prisma Interactive Transactions, passed down through service methods to ensure ACID compliance.
- **Shared Services:** Globally injected utilities (e.g., `LoggerService`) available everywhere.

---

## 7. Shared Layer
The `/shared` folder prevents code duplication and circular dependencies.

- **Shared DTOs:** Base pagination, tenant ID injections.
- **Shared Interfaces:** TypeScript contracts.
- **Shared Enums:** Database enums mapped to TS (e.g., `OrderStatus`).
- **Shared Constants:** Error codes, tax rates.
- **Shared Validators:** Custom class-validator decorators (e.g., `IsValidPhone`).
- **Shared Utilities:** Pure functions (e.g., `calculateMargin()`).

---

## 8. Common Layer
The `/common` folder houses NestJS specific cross-cutting logic.

- **Guards:** `JwtAuthGuard`, `PermissionsGuard`, `TenantActiveGuard`.
- **Decorators:** `@CurrentUser()`, `@CurrentTenant()`, `@RequirePermissions()`.
- **Filters:** `GlobalExceptionFilter` (Catch-all), `PrismaExceptionFilter` (Maps DB errors to HTTP codes).
- **Interceptors:** `TransformResponseInterceptor` (Standardizes `{ success, data, message }` wrappers).
- **Pipes:** `ValidationPipe` (Strips malicious payload fields).
- **Exceptions:** Domain-specific errors (`InsufficientStockException`).

---

## 9. Configuration Layer
- **Environment:** Validated strictly on startup using Joi or Class-Validator. If `DATABASE_URL` is missing, the server crashes immediately.
- **Secrets:** API keys and JWT secrets stored in `.env`, never in code.
- **Feature Flags:** Pulled dynamically from the database to enable/disable experimental APIs.
- **Multi-Tenant Config:** Extracted from the JWT or Headers on every request and injected into the Prisma query context.
- **Industry Config:** Dynamic rulesets injected into business modules based on the active Brand's industry.

---

## 10. Background Jobs
Heavy lifting is offloaded to Redis-backed queues (BullMQ).

- **Cron Jobs:** Scheduled tasks (e.g., midnight End-of-Day auto-closures).
- **Billing Jobs:** Processing recurring Stripe/JazzCash SaaS subscriptions.
- **Sync Jobs:** Safely processing the offline Dexie queue arrays pushed by the POS clients via Event Sourcing.
- **Cleanup Jobs:** Archiving soft-deleted records older than 5 years.
- **Notification Jobs:** Batching and firing SMS/Emails asynchronously.

---

## 11. Realtime Layer
Socket.io is used for state synchronization, not data fetching.

- **Gateway Philosophy:** Sockets broadcast *state changes*. Clients use REST to fetch initial data, and Sockets to keep it fresh.
- **Namespaces:** Logical separation (e.g., `/kitchen`, `/pos`).
- **Rooms:** Mandatory isolation. Clients MUST join a room labeled `store_{id}`. Global broadcasts do not exist.
- **Authentication:** Handshake validation using the exact same JWT logic as REST APIs.
- **Event Flow:** Controllers handle the REST `POST /order`. The Service saves to DB, then calls the Gateway to `emit('NEW_ORDER', payload)`.

---

## 12. Security Layer
- **JWT:** Short-lived Access Tokens (15m) and long-lived HTTP-Only Refresh Tokens (7d).
- **RBAC:** Every controller route must be decorated with required permissions.
- **Tenant Isolation:** Prisma queries must append `where: { store_id: req.tenantId }`. Missing this is a critical security failure.
- **Rate Limiting:** Global Throttler to prevent DDoS, with stricter limits on `/auth/login`.
- **Audit:** Any POST/PATCH/DELETE to sensitive financial or inventory routes triggers an automatic Audit Log write.

---

## 13. Logging Strategy
- **Application Logs:** NestJS Logger. `INFO` for boots, `DEBUG` for job traces.
- **Audit Logs:** Stored in the Database for Admin compliance.
- **Error Logs:** Captured by the `GlobalExceptionFilter` and shipped to Sentry/Datadog.
- **Performance Logs:** Middleware capturing API routes taking > 500ms to resolve.

---

## 14. Error Handling Strategy
- **Global Exception Handling:** Never return raw Node.js/Prisma errors to the frontend.
- **Validation:** 400 Bad Request generated automatically by `ValidationPipe` for invalid DTOs.
- **Business Errors:** 422 Unprocessable Entity for logic failures (e.g., "Cannot void a settled order").
- **Auth Errors:** 401 Unauthorized (Bad Token) or 403 Forbidden (Missing Permission).

---

## 15. Backend Development Standards
- **Folder Standards:** Modules are self-contained (`/orders/controllers/`, `/orders/services/`, `/orders/dtos/`).
- **Naming Standards:** `orders.controller.ts`, `UpdateOrderDto`.
- **Dependency Rules:** Do not use `forwardRef()` to fix circular dependencies. If you have a circular dependency, your domain boundary is wrong. Extract the shared logic to a third module.
- **Import Rules:** Use absolute paths configured in `tsconfig.json` (`@modules/orders/...`), avoid `../../../../`.
- **Module Rules:** Everything must be exported via standard NestJS `exports` arrays.

---

## 16. Future Growth
How the identical Monolithic codebase handles hyper-growth:
- **100 Stores:** Runs on a single beefy DigitalOcean droplet or AWS EC2 instance. Single PostgreSQL DB.
- **1,000 Stores:** Monolith runs on 5 Load-Balanced instances. Redis handles Socket.io pub/sub across instances. DB upgraded to managed RDS.
- **10,000 Stores:** Same codebase. We shard the PostgreSQL database (e.g., Brands 1-5000 on DB_A, Brands 5001-10000 on DB_B). The Monolith connects to a proxy (PgBouncer/Citus) that routes the query.

---

## 17. Final Backend Principles
1. **Never break production APIs:** If an API must change, version it (`/v2/orders`).
2. **Protect the Tenant:** Any query missing a `store_id` or `brand_id` is a catastrophic data breach.
3. **No Random Scripts:** Do not write random `.js` scripts to fix data. Write proper NestJS CLI commands (`npm run console fix-roles`).
4. **Resist Microservices:** Splitting this monolith is strictly forbidden until the organization has 50+ dedicated backend developers and the DevOps maturity to handle distributed tracing.

***End of Document.***
