# Title: D4U Business Domain & SaaS Engine Blueprint
**Version:** 3.0
**Last Updated:** July 2026
**Purpose:** Defining the universal Business Engine to support multi-industry SaaS scaling from a single core architecture.
**Dependencies:** D4U_MASTER_ARCHITECTURE_BLUEPRINT.md, D4U_DATABASE_MASTER_BLUEPRINT.md
**Related Documents:** None
**Author:** AI Product Architect
**Status:** FINAL

---

## 1. Vision

### Multi-Industry Platform Justification
At their core, 90% of service and retail businesses follow the identical transactional flow: *A customer requests a good/service -> A resource fulfills it -> Inventory is consumed -> Payment is collected.* By abstracting the terminology, D4U will transcend the Restaurant niche and become a universal ERP/POS ecosystem competing with Odoo, SAP, and Shopify.

### The Concept
- **One Core Platform:** A single backend monolith and a single database schema. We do not spin up separate servers or databases for different industries.
- **Multiple Industries:** The platform dynamically adapts its behavior based on the tenant's registered industry.
- **No Code Duplication:** We do not fork the code to create a "Salon Version" and a "Restaurant Version". There is only the "D4U Version".
- **Configuration Driven System:** The UI layer renders "Chef" for a restaurant and "Stylist" for a salon simply by reading a configuration dictionary mapped to the `industry_id`.

---

## 2. Industry Registry

### Purpose
A high-level metadata layer attached to the `Brand` entity that dictates the operational terminology, default workflows, and applicable modules for that specific tenant.

### Examples
Restaurant, Retail, Super Market, Pharmacy, Clinic, Salon, Spa, Workshop, Automobile, Driving School, Education, Warehouse, Future Industries.

### Industry Identification
When a Brand is onboarded, it is tagged with an Industry ID. This ID feeds into the UI localization engine. For example, `entity_station` renders as "Kitchen" for a Restaurant, but "Repair Bay" for an Automobile Workshop.

### Industry Isolation
The database schema remains completely agnostic. A "Burger" and an "Oil Filter" are both just records in the `Products` table. The business logic (e.g., a Clinic doesn't need physical delivery riders, but it needs appointment scheduling) is isolated by toggling modules on or off based on the Industry context.

### Future Expansion
To add a new industry (e.g., "Gym"), developers only need to add a new enum to the Industry Registry, create a translation dictionary for the frontend, and toggle on the "Membership/Subscriptions" module. Zero core code changes required.

---

## 3. Module Registry

### Purpose
Modules are the macro building blocks of the D4U SaaS offering. They are the overarching domains that clients can purchase or subscribe to.

### Examples
POS, Kitchen (Fulfillment), Inventory, CRM, Accounts, Marketing, Purchasing, HR, Payroll, Loyalty, Delivery, Appointments, Workshop, Student Management, Vehicle Management, Booking.

### Relationships
Packages are constructed by grouping Modules. A Module contains many granular Features.

### Dependencies
Core modules (like `Identity/Auth` and `CRM`) act as foundations. `Loyalty` cannot be activated without `CRM`. `Kitchen` cannot be activated without `POS` or `Booking`.

### Future Growth
The platform acts as an OS (Operating System). New modules (e.g., `Student Management`) can be developed as isolated domains within the NestJS Monolith and added to the Registry without impacting the `Inventory` module.

---

## 4. Feature Registry

### Feature Registry Philosophy
While Modules define the macro capability, Features define the micro actions. This allows for hyper-granular SaaS tiering (e.g., the "Basic" tier gets Inventory, but the "Pro" tier gets Inventory + Stock Transfers).

### Example Breakdown
`Inventory Module`
  ↓ `Stock Management (Feature)`
  ↓ `Stock Transfer (Feature)`
  ↓ `Stock Adjustment (Feature)`
  ↓ `Stock Count (Audits) (Feature)`
  ↓ `Advanced Stock Reports (Feature)`

Features map directly to UI components and API endpoints. If a feature flag is false, the UI hides the button, and the API rejects the request.

---

## 5. Permission Registry

### Naming Standards
Strict dot-notation format: `[domain].[resource].[action]`
Example: `inventory.stock.read`, `inventory.stock.create`, `inventory.stock.update`, `inventory.stock.delete`, `inventory.stock.approve`.

### Permission Inheritance (Wildcards)
A Super Admin or Branch Manager role can be assigned `inventory.stock.*` to grant full CRUD capabilities automatically, reducing payload size and database complexity.

### Role Inheritance
Roles are composable. A "Store Manager" role does not redefine cashier permissions; it inherits the "Cashier" role and layers additional permissions (e.g., `orders.discount.approve`) on top.

---

## 6. Package Engine

### Design
Packages are commercial wrappers around Modules and Features, designed for frictionless sales.
- **Starter:** Base POS + Simple CRM.
- **Basic:** Starter + Basic Inventory.
- **Standard:** Basic + KDS + Loyalty.
- **Professional:** Standard + Advanced Inventory + Accounting.
- **Enterprise:** All Modules + Custom API Access.
- **Custom Packages:** Dynamically built by the sales team for bespoke clients.

### How Packages are Built
A Package is simply a relational blueprint linking a Package ID to an array of Module IDs and Feature flags. When a Brand subscribes to a Package, those flags are copied or referenced into their active Tenant configuration.

---

## 7. Subscription Engine

### Lifecycle Design
- **Subscription:** The active commercial agreement.
- **Renewal:** Automated cycle (monthly/yearly) triggered by the Billing Engine.
- **Upgrade:** Immediate activation of new modules; charges are pro-rated for the remaining billing cycle.
- **Downgrade:** Processed at the *end* of the current billing cycle to prevent mid-month data loss.
- **Suspension:** Triggered by failed payments. Access is blocked, but data is preserved.
- **Expiry:** Hard stop for fixed-term contracts without auto-renewal.
- **Grace Period:** A 3 to 7-day soft-stop allowing operations to continue while alerting the client of billing failures.
- **Cancellation:** Manual termination by the client.
- **Reactivation:** Seamless restoration of a suspended or cancelled account upon successful payment.

---

## 8. Licensing Engine

### Design
To prevent piracy and enforce multi-store pricing, subscriptions are enforced via cryptographic licenses.
- **Cloud License:** Grants the Brand HQ access to the central Admin portal.
- **Store License:** Activates a specific physical branch.
- **Terminal License:** Caps the number of simultaneous POS registers operating in a Store.
- **Device License:** Binds to specific MAC addresses for fixed hardware (e.g., KDS screens, Receipt Printers).
- **Offline License (Time-to-Live):** A JWT-style token stored in the local Edge POS. It guarantees the POS can operate offline for up to 30 days. If the POS does not sync and refresh the token within 30 days, the offline app locks down.

---

## 9. Billing Engine

### Design
The financial engine for D4U HQ (not the tenant's restaurant sales, but D4U's corporate revenue).
- **Invoices:** Auto-generated PDFs upon subscription renewal.
- **Payments:** Reconciled via Stripe, JazzCash, or direct bank transfer.
- **Recurring Billing:** BullMQ cron jobs checking for renewals every night at midnight.
- **Coupons:** Flat rate ($50 off) or percentage (10% off for 6 months).
- **Discounts:** Lifetime or structural pricing overrides for VIP enterprise clients.
- **Taxes:** Dynamic calculation based on the client's HQ jurisdiction (e.g., 18% SaaS tax).
- **Currency:** Multi-currency support at the foundation so D4U can sell licenses in USD, PKR, or AED natively.
- **Future Payment Gateways:** Abstracted behind an Adapter Pattern interface so new gateways can be added without rewriting the billing logic.

---

## 10. Proposal Engine

### The Sales Process Design
Built directly into the SuperAdmin portal to streamline B2B SaaS sales.
- **Lead:** A potential client inquiry captured in D4U Admin.
- **Proposal:** The sales agent selects a Custom Package, applies onboarding fees, and generates a responsive Web Quote or PDF.
- **Negotiation:** Client reviews and requests changes (tracked via versioning).
- **Approval:** Client digital signature or deposit payment.
- **Subscription:** Automatically generated from the approved Proposal.
- **Deployment:** Store environments and initial logins are automatically provisioned and emailed to the client.

---

## 11. Business Entity Lifecycle

Entities must follow strict state machines. No hard deletions.
- **Order:** Draft -> Pending -> Accepted -> Preparing -> Ready -> Dispatched -> Completed / Voided.
- **Purchase (PO):** Draft -> Sent -> Partially Received -> Fully Received -> Closed.
- **Inventory:** Ordered -> In Transit -> Received -> Consumed / Spoiled.
- **Customer:** Lead -> Active -> VIP -> At-Risk -> Churned.
- **Invoice:** Draft -> Issued -> Overdue -> Paid / Written-Off.
- **Subscription:** Trial -> Active -> Past Due -> Suspended -> Cancelled.
- **Proposal:** Draft -> Sent -> Viewed -> Accepted / Rejected.
- **License:** Issued -> Active -> Expired / Revoked.
- **Coupon:** Active -> Depleted -> Expired.

---

## 12. Event Catalog Philosophy

### Event Architecture
D4U relies on a decoupled, pub/sub Event-Driven Architecture within the monolith to prevent spaghetti code. If the `OrderModule` finishes a sale, it does not directly call the `LoyaltyModule` and the `InventoryModule`. It simply broadcasts an event.

### Standard Event Naming
Format: `[DOMAIN]_[ENTITY]_[ACTION]` (Screaming Snake Case).
Examples:
- `ORDER_CREATED`, `ORDER_COMPLETED`, `ORDER_VOIDED`
- `INVOICE_PAID`, `INVOICE_OVERDUE`
- `SUBSCRIPTION_RENEWED`, `SUBSCRIPTION_SUSPENDED`
- `LICENSE_ACTIVATED`, `LICENSE_REVOKED`
- `STOCK_DEDUCTED`, `STOCK_RECEIVED`

*Why?* This ensures that when a new Module (e.g., `Marketing`) is added 2 years from now, it can simply listen to `ORDER_COMPLETED` to trigger a "Thank You" SMS without modifying the core Order logic.

---

## 13. Future Industry Strategy

### How the same architecture supports multiple industries:
The core platform manages generic transactional entities: `Product` (Item/Service), `Resource` (Staff/Space), `Fulfillment` (Creation/Delivery), and `Transaction` (Payment).

- **Restaurant:** Product = Pizza. Resource = Table. Fulfillment = Kitchen (KDS).
- **Salon / Spa:** Product = Haircut. Resource = Stylist / Chair. Fulfillment = Appointment Queue.
- **Clinic:** Product = Consultation. Resource = Doctor. Fulfillment = Waiting Room Display.
- **Workshop / Automobile:** Product = Oil Change. Resource = Mechanic / Bay. Fulfillment = Work Order Screen.
- **Driving School:** Product = Lesson. Resource = Instructor / Car. Fulfillment = Dispatch/Calendar.
- **Retail:** Product = Shirt. Resource = Cashier. Fulfillment = Handover at counter.

By keeping the database agnostic and utilizing the Industry Registry for UI localization, D4U serves all these verticals from the exact same codebase and database instance.

---

## 14. Final Business Principles

These are the non-negotiable rules for the D4U Business Domain:

1. **Configuration over Customization:** Never write bespoke, custom code for a single client. If a client needs a feature, build it globally and toggle it on via Configuration for that specific tenant.
2. **No Duplicate Modules:** There is only one CRM. There is only one Inventory. If a Clinic needs specific CRM features, add them to the core CRM and feature-flag them, rather than building a "Clinic CRM".
3. **Generic Naming:** At the database and backend level, entities must maintain generic, industry-agnostic names (`Product` not `Dish`, `Fulfillment` not `KOT`).
4. **Scalable Architecture:** Build for vertical scaling (beefy servers) first, but design the data (tenant IDs) so horizontal scaling (database sharding) is possible later.
5. **Migration Safety:** No feature release is allowed to destroy or orphan historical transactional data.
6. **Production Safety:** All new features must be wrapped in Feature Flags so they can be merged into production silently and turned on gradually.

***End of Document.***
