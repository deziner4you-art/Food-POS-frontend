# D4U Enterprise ERP v3
## ERP Gap Analysis & Feature Roadmap

**Date**: July 2026
**Target Architecture**: Modular Monolith (Multi-Industry Universal SaaS)
**Status**: ANALYSIS COMPLETE

This document compares the current `d4u-pos-backend` implementation against the master `D4U_BUSINESS_DOMAIN_BLUEPRINT.md` and `D4U_BACKEND_MASTER_BLUEPRINT.md` architecture.

---

### SECTION A: Existing Modules

The backend successfully implements the core foundations of the **F&B (Restaurant/Retail)** vertical and basic Multi-Tenancy.

- **Identity & Access**: `core/auth`, `core/users`, `core/terminal`
- **Multi-Tenancy**: `core/stores` (Brands & Stores hierarchy)
- **SaaS Foundation**: `core/subscription`, `core/saas-package`
- **F&B Fulfillment**: `business/pos-orders`, `business/online-orders`, `business/kots`, `business/recipes`
- **Stock Management**: `business/inventory`, `business/vendor` (Purchasing/POs)
- **CRM & Growth**: `business/customers`, `business/marketing`, `business/deal`, `business/cms`
- **Operations**: `business/business-day`, `business/cash-flow`, `business/reports`, `business/rider`

---

### SECTION B: Modules Needing Enhancement (Technical Debt)

These modules exist but do not fully satisfy the Enterprise ERP Blueprint:

1. **Subscription & Licensing (`core/subscription`)**
   - *Gap*: Lacks Offline License Time-to-Live (TTL) tokens (e.g., locking Edge POS after 30 days offline).
   - *Gap*: Lacks pro-rated Upgrade/Downgrade calculations and Device/Terminal MAC binding.
2. **Roles & Permissions (`core/users`)**
   - *Gap*: Permissions are currently a generic JSON object. The blueprint requires a strict dot-notation RBAC (e.g., `inventory.stock.read`) with wildcard inheritance (`*`).
3. **Settings (`business/cms` -> `core/settings`)**
   - *Gap*: Settings are coupled with the CMS. Global and localized configuration overrides must be extracted to a dedicated `core/settings` module.
4. **Reports (`business/reports` -> `core/reports`)**
   - *Gap*: Reports is currently structured as a Business module. It should act as a Core aggregation engine, reading across all domains.
5. **Accounting & Ledgers (`business/cash-flow`)**
   - *Gap*: Currently limited to basic Shift Floats and daily cash ins/outs. Requires double-entry ledgers and rigorous End-of-Day (EOD) financial reconciliations.

---

### SECTION C: Completely Missing Modules

These modules represent the delta between the current POS and the universal Enterprise ERP.

#### Core Engine Gaps
1. **Industry Registry (`core/industry`)**: The vital localization engine that maps generic entities (`Resource`, `Fulfillment`) to industry terminology ("Stylist", "Kitchen").
2. **Module & Feature Registry (`core/features`)**: Micro-capability definitions (e.g., disabling "Stock Transfers" for basic tiers) linked to SaaS packages.
3. **Billing & Proposal (`core/billing`)**: The corporate financial engine (Invoices, Stripe/JazzCash recurring payments, Web Quotes, B2B digital sign-offs).
4. **Audit (`core/audit`)**: Immutable, automated compliance tracking of sensitive mutations (`changed_by`, `reason`).
5. **Notification (`core/notification`)**: A unified Pub/Sub abstraction (via BullMQ) for SMS, Email, and Push Notifications.

#### Business Vertical Gaps
6. **Appointments & Booking (`business/booking`)**: Time-slot scheduling engine necessary to capture the Salon, Spa, and Clinic verticals.
7. **Workshop & Vehicles (`business/workshop`)**: Repair tracking, bay assignments, and parts consumption for automotive clients.
8. **Student Management (`business/education`)**: Curriculums, driving lesson schedules, and instructor dispatch.

---

### SECTION D: Recommended Implementation Order

To safely transition from a Restaurant POS to a Universal ERP, development must follow a strictly layered dependency graph:

1. **Layer 1 (The OS Upgrade)**: Industry Registry + Module & Feature Registry + Dot-Notation RBAC. *(Unlocks generic naming and tiering).*
2. **Layer 2 (The Enterprise Shield)**: Global Audit + Notification queues. *(Required before complex billing).*
3. **Layer 3 (Monetization)**: Billing & Proposal Engine + Offline TTL Licensing. *(Unlocks enterprise revenue).*
4. **Layer 4 (The Second Vertical)**: Appointments & Bookings. *(Safely proves the multi-industry capability without heavy logistics).*
5. **Layer 5 (Deep Verticals)**: Workshop/Vehicles & Education Management.

---

### SECTION E: Estimated Sprint Breakdown

- **Sprint 3 (Platform OS)**
  - Move Settings and Reports to `core`.
  - Implement Industry Registry & Feature Flags.
  - Refactor RBAC to dot-notation.
- **Sprint 4 (Enterprise Compliance)**
  - Global Event-Driven Architecture (EventEmitter2 bindings).
  - Centralized Audit Logs.
  - BullMQ Notification Abstraction.
- **Sprint 5 (Monetization & Licensing)**
  - Billing Engine (Stripe/JazzCash integration).
  - Proposal (Sales) Engine in SuperAdmin.
  - Offline JWT TTL Enforcement.
- **Sprint 6+ (New Industries)**
  - Appointments & Bookings (Salons/Clinics).
  - Workshop Management.

---

### SECTION F: Business Priority

| Module / Feature | Priority | Justification |
| :--- | :--- | :--- |
| **Industry & Feature Registry** | **CRITICAL** | Blocks the transition from F&B POS to Universal ERP. Required for all future verticals. |
| **RBAC Refactor** | **CRITICAL** | Granular SaaS tiering is impossible without strict, hierarchical permissions. |
| **Billing & Proposal Engine** | **HIGH** | Automates revenue collection and B2B sales cycles. Crucial for scale. |
| **Audit & Notifications** | **HIGH** | Enterprise clients will not adopt the platform without strict compliance trails. |
| **Appointments & Booking** | **MEDIUM** | Opens up the second most lucrative market (Salons/Clinics/Spas). |
| **Workshop & Education** | **LOW** | Niche verticals to capture only after the OS and Billing layers are hardened. |
