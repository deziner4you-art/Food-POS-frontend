# Title: D4U Database Master Blueprint
**Version:** 3.0
**Last Updated:** July 2026
**Purpose:** The official, definitive database architecture standard for the D4U platform.
**Dependencies:** None
**Related Documents:** D4U_MASTER_ARCHITECTURE_BLUEPRINT.md
**Author:** AI Database Architect
**Status:** FINAL

---

## 1. Database Philosophy
**Purpose:** To establish a database foundation that guarantees data integrity, operational speed, and flawless offline resilience for the entire D4U ecosystem.
**Relationships:** All core tables must enforce strict referential integrity (Foreign Keys).
**Dependencies:** Built exclusively for PostgreSQL, utilizing its native JSONB capabilities and ACID compliance.
**Future Growth:** Designed to scale vertically on single nodes initially, and horizontally (via partitioning or tenant-level sharding) as the platform exceeds hundreds of brands.
**Migration Safety:** Schema changes must follow the "Expand and Contract" methodology—add new columns/tables first, migrate data seamlessly, and drop old columns only when no active clients rely on them.

---

## 2. Database Naming Standards
**Purpose:** To make the database schema self-documenting, predictable, and uniform across all AI and human development cycles.
**Relationships:** Applies to all tables, columns, constraints, and indexes.
**Dependencies:** Adheres to standard PostgreSQL conventions.
**Future Growth:** Consistent conventions drastically reduce cognitive load for onboarding new developers or generating code via AI.
**Migration Safety:** Standardized naming prevents namespace collisions and unintended overrides during complex migrations.
*(Rules: `snake_case` for everything, plural table names, `_id` suffix for foreign keys, `_at` suffix for timestamps).*

---

## 3. Multi-Tenant Strategy
**Purpose:** To ensure absolute, impenetrable data isolation between different clients (Brands) sharing the same cloud database.
**Relationships:** `brand_id` and `store_id` serve as the universal tenant identifiers across all transactional and operational tables.
**Dependencies:** Requires application-level middleware to automatically inject and validate tenant IDs in every single query.
**Future Growth:** If a brand grows massively, their specific `brand_id` can be sharded onto a dedicated database cluster without rewriting the application logic.
**Migration Safety:** Retrofitting tenant IDs to global tables is dangerous; therefore, all new tables must include tenant identifiers from Day 1.

---

## 4. Brand Structure
**Purpose:** To represent the overarching corporate entity (HQ) or the Parent Company.
**Relationships:** A Brand owns multiple `Stores`, overarching `Menus`, centralized `Customers`, and the global `Subscription`.
**Dependencies:** Acts as the root node for the multi-tenant architecture.
**Future Growth:** Will evolve to support complex franchise models (e.g., Parent Brand -> Master Franchisee -> Local Franchisee).
**Migration Safety:** As the foundational anchor, this table must rarely undergo destructive changes.

---

## 5. Store Structure
**Purpose:** To represent the physical or logical fulfillment branch where operations occur.
**Relationships:** Belongs to a `Brand`. Directly owns `Inventory`, `Orders`, `Staff/Users`, and `TerminalSessions`.
**Dependencies:** Inherits configurations from the parent `Brand`.
**Future Growth:** Can abstract into virtual locations (e.g., a "Cloud Kitchen", a "Central Warehouse", or a "Mobile Food Truck").
**Migration Safety:** Expanding properties (like adding distinct time zones per store) is additive and safe.

---

## 6. User Structure
**Purpose:** Identity mapping for HQ admins, branch managers, cashiers, riders, and chefs.
**Relationships:** Belongs to a `Brand` and optionally pinned to a specific `Store`. Links to the `Role` table for authorization.
**Dependencies:** Relies on RBAC (Role-Based Access Control) for operational limits.
**Future Growth:** Will expand to integrate with external identity providers (OAuth, SSO for corporate clients).
**Migration Safety:** Personally Identifiable Information (PII) must be handled carefully. Schema changes here must not disrupt active user sessions.

---

## 7. Authentication Tables
**Purpose:** Secure credential storage and session lifecycle management.
**Relationships:** References `User` and `TerminalSession`.
**Dependencies:** Cryptographic hashing (Bcrypt).
**Future Growth:** Will support MFA (Multi-Factor Authentication) tokens, biometric device keys, and magic links.
**Migration Safety:** Passwords and tokens must never be exposed or altered during migrations. Migrating hashing algorithms requires progressive hashing techniques.

---

## 8. RBAC Tables
**Purpose:** Fine-grained, policy-based access control replacing legacy hardcoded JSON permissions.
**Relationships:** Intersects `Roles` and `Permissions` via a many-to-many junction.
**Dependencies:** Tied deeply into API middleware guards.
**Future Growth:** Transitioning from static roles ("Manager") to dynamic capabilities ("Can Void Orders", "Can Edit Recipes").
**Migration Safety:** Legacy JSON permission blobs must be carefully parsed and seeded into the new relational tables via a dedicated, safe migration script.

---

## 9. Product Architecture
**Purpose:** To define the core sellable entities (the Catalog).
**Relationships:** Belongs to `Brand`/`Store`. Possesses `Categories`, `Variants` (e.g., Sizes), `Modifiers` (e.g., Add-ons), and `RecipeIngredients`.
**Dependencies:** Core building block for Orders and Inventory.
**Future Growth:** Abstracting "Product" to mean anything sellable—a Burger, a Haircut, an Oil Change, or a Consultation Hour.
**Migration Safety:** Modifying pricing logic or inheritance (variants) must preserve the historical cost of past orders.

---

## 10. Inventory Architecture
**Purpose:** Tracking physical goods, raw materials, and ledger balances.
**Relationships:** Belongs to `Store`. Linked to final `Products` via `Recipes`.
**Dependencies:** Triggered by Order completion (deductions) and Purchase Orders (additions).
**Future Growth:** Expanding into multi-warehouse transfers, FIFO (First-In-First-Out) cost valuation, and supplier integrations.
**Migration Safety:** This is a highly sensitive financial ledger. We must utilize Event Sourcing (append-only +/- logs) rather than destructive "Last Write Wins" updates to prevent accounting disasters.

---

## 11. Order Architecture
**Purpose:** The central transactional lifeblood of the entire platform.
**Relationships:** Belongs to a `Store`, processed by a `User` (Cashier), and optionally linked to a `Customer`. Contains `OrderItems`.
**Dependencies:** Relies on Products for pricing and SaaS rules to ensure the store is authorized to sell.
**Future Growth:** Separating the concept of "Payment" from "Fulfillment" (e.g., Pre-paid online bookings or partial down-payments).
**Migration Safety:** Order records are immutable. Soft deletes only. Schema modifications here must never alter the historical total or tax calculations of closed business days.

---

## 12. Kitchen Architecture
**Purpose:** Tracking the real-time fulfillment state of an Order.
**Relationships:** `KOT` (Kitchen Order Ticket) or `FulfillmentTicket` belongs to an `Order`.
**Dependencies:** Relies on Orders being successfully persisted.
**Future Growth:** Renaming internal paradigms from "Kitchen" to a generic "Fulfillment Station" so a Salon can use the same logic for assigning a stylist.
**Migration Safety:** Highly decoupled from financial data. Changes here affect operational flow, not ledgers.

---

## 13. Rider Architecture
**Purpose:** Last-mile logistics and fleet tracking.
**Relationships:** Belongs to an `Order`, a `Store`, and assigned to a `User` (Rider).
**Dependencies:** Geolocation services and mobile socket connections.
**Future Growth:** Expanding into 3PL (Third-Party Logistics) API integrations (e.g., handing orders off to Careem or Bykea).
**Migration Safety:** Spatial data types (Lat/Lng) must be standardized. Migration is generally low-risk for historical data.

---

## 14. CRM Architecture
**Purpose:** Customer profiling, loyalty tracking, and retention.
**Relationships:** A `Customer` belongs to a `Brand` (roaming across stores). Owns `Orders` and `LoyaltyWalletTransactions`.
**Dependencies:** Fed continuously by incoming Orders.
**Future Growth:** Evolving into a full digital wallet system supporting prepaid balances and cross-brand coalitions.
**Migration Safety:** Deduplication of customer records (merging profiles) must be handled carefully to avoid orphaning historical orders.

---

## 15. Marketing Architecture
**Purpose:** Driving sales via promotional campaigns, tracking affiliate commissions, and dynamic discounts.
**Relationships:** Maps `Customers` to `Campaigns`, `PromoCodes`, and `AffiliateLinks`.
**Dependencies:** Tightly integrated with the CRM and Order pricing engines.
**Future Growth:** Multi-tier influencer and B2B affiliate tracking.
**Migration Safety:** Campaign rules must be immutable once executed. Altering a campaign must generate a new version, preserving historical attribution.

---

## 16. SaaS Architecture
**Purpose:** The commercial monetization engine for the D4U HQ.
- **Module Registry:** The master list of all system capabilities (POS, KDS, Rider App). Replaces hardcoded booleans.
- **Packages:** Bundles of modules (e.g., "Enterprise Package") mapped to specific tiers.
- **Pricing:** Dynamic engine calculating flat fees + per-module fees + optional metered usage.
- **Subscription:** Links a `Brand` to a specific Package/Pricing structure.
- **License:** Issue encrypted tokens per `Store` or hardware device to prevent piracy.
- **Proposal:** Engine to draft quotations for potential clients directly from the admin panel.
- **Billing:** Ledger for generating automated monthly/yearly SaaS Invoices.
- **Coupons:** Admin-level promotional codes to offer discounts on SaaS onboarding.
- **Trial:** Time-bound, fully-featured system access that gracefully degrades or locks upon expiry.
**Relationships:** `Brand` -> `Subscription` -> `License` -> `ModuleRegistry`.
**Migration Safety:** Crucial migration of existing hardcoded subscription booleans to the new relational Module Registry. Must be executed with zero downtime via seed mapping.

---

## 17. Reports
**Purpose:** Fast, pre-aggregated analytical data for dashboards.
**Relationships:** Often materialized views or rolled-up tables derived from `Orders`, `Inventory`, and `CashFlow`.
**Dependencies:** Requires scheduled background jobs (CRON) or event triggers to build the data.
**Future Growth:** Streaming data to external Data Warehouses (Snowflake, BigQuery).
**Migration Safety:** Extremely safe. Analytical tables can be dropped and rebuilt from the core transactional ledgers at any time.

---

## 18. Audit Logs
**Purpose:** Strict accountability and historical tracking for sensitive platform actions.
**Relationships:** References the actor (`User`), the location (`Store`), and the target entity (e.g., `Order_ID`).
**Dependencies:** Driven by application-level middleware or database triggers.
**Future Growth:** Offloading historical logs to cheaper cold-storage solutions to keep the active database small.
**Migration Safety:** Append-only and immutable. Never to be updated or migrated destructively.

---

## 19. Notifications
**Purpose:** System alerts, KDS pings, and Rider updates.
**Relationships:** Targeted at `Users` or `Stores`.
**Dependencies:** Tied to WebSocket gateways and Push Notification services.
**Future Growth:** Multi-channel routing (in-app, SMS, WhatsApp, Email).
**Migration Safety:** Highly volatile data. Can be truncated or pruned safely during major migrations.

---

## 20. Sync Queue
**Purpose:** Reconciling Edge (offline) data with the Cloud securely.
**Relationships:** Store-level ledgers of offline events.
**Dependencies:** Edge client internet connectivity and Dexie.
**Future Growth:** Sophisticated conflict resolution matrices ensuring financial accuracy when multiple clients edit data simultaneously while offline.
**Migration Safety:** High risk. The Sync Queue must be completely drained (synced) before deploying any major database schema changes to production.

---

## 21. Offline Data
**Purpose:** Mirroring critical cloud data down to the Edge (IndexedDB/Dexie) so operations never halt.
**Relationships:** A localized, scaled-down subset of core tables (Products, Categories, Users).
**Dependencies:** Web APIs pulling data on initialization.
**Future Growth:** Implementing differential sync (downloading only what changed, rather than pulling the entire catalog).
**Migration Safety:** Dexie database versions must be carefully incremented in the frontend code alongside Backend schema changes to trigger local database upgrades seamlessly.

---

## 22. Future Expansion
The database architecture is designed with **Retail Agnosticism** in mind.
- **Retail:** Replacing "Menu" with "Catalog".
- **Salon / Clinic:** "Product" becomes a time-bound "Service". "Chef" becomes a "Specialist/Doctor".
- **Workshop / Automobile:** "Table" becomes "Bay". "KOT" becomes "Work Order".
- **Driving School:** "Delivery" becomes "Instructor Dispatch".
**Dependencies:** Requires the core schema to use generic terminologies internally (e.g., `sellable_item` instead of `food_dish`).
**Future Growth:** The architecture can support infinite verticals without requiring a database rewrite.
**Migration Safety:** Abstracting names early prevents massive, dangerous table renames later.

***End of Document.***
