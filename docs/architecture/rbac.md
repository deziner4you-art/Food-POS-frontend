# Enterprise Identity & RBAC Architecture Review

## 1. Recommended RBAC Model: Hybrid Context-Aware RBAC
For an Enterprise ERP scaling across Restaurants, Retail, Manufacturing, and Franchises, a pure Role-Based Access Control (RBAC) model is insufficient. A **Hybrid Context-Aware RBAC (Role + Permission + Scope)** is mandatory.

### Why Hybrid?
- **Pure RBAC** maps a user to a role (e.g., "Manager") and assumes global access. 
- **Hybrid Context-Aware RBAC** maps a user to a Role, which grants granular Permissions, but limits execution to a strict **Scope** (Global, Brand, or Branch). 
- *Example:* John is a "Store Manager" (Role) with `inventory.adjust` (Permission), but strictly limited to `store_id = 5` (Scope). He cannot adjust stock at `store_id = 6` despite having the Manager role. A Franchise Owner might have `brand_id = 2` scope, granting them access to all branches under Brand 2, but completely isolated from Brand 1.

## 2. Identity Model & User Assignments
Identities are structured hierarchically based on their authorized scope and blast radius. 
As defined in the [Enterprise Identity Architecture](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/architecture/identity.md), the system uses a `UserAssignment` relational table to bind a single `User` to multiple Roles and Scopes, allowing a single employee to hold different responsibilities across different branches.

### Level 0: Platform Scope (SaaS / Global)
- **Super Admin**: Unrestricted system-wide access. Manages SaaS subscriptions, global features, and platform health.
- **System Auditor**: Read-only access across all brands for compliance and logging.

### Level 1: Enterprise Scope (Multi-Brand / HQ)
- **Brand Owner / Franchisee**: Full control over their assigned `brand_id` and all constituent branches.
- **Regional Manager**: Oversees a cluster of branches within a brand.
- **Finance / Accounting Manager**: Access to global ledgers, P&L, and cross-branch analytics.

### Level 2: Department Scope (HQ / Backoffice)
- **Warehouse Manager**: Manages central commissary, B2B transfers, and bulk purchasing.
- **Production / Manufacturing Manager**: Controls recipes, BOMs (Bill of Materials), and manufacturing workflows.
- **Marketing Manager**: Controls CRM, Loyalty, global coupons, and SMS campaigns.
- **HR / Payroll Manager**: Manages staff identities, wages, and shift attendance globally.

### Level 3: Operational Scope (Branch / Store Level)
- **Store / Branch Manager**: Full operational control isolated to a specific `store_id`.
- **Kitchen Manager / Head Chef**: Manages KDS routing, prep stations, and local kitchen inventory.
- **Delivery Dispatcher**: Manages rider assignment, fleet tracking, and order dispatch.
- **Customer Support / Call Center**: Scoped to view CRM and Order History to process refunds across branches.

### Level 4: Execution Scope (Terminal / Floor Level)
- **Cashier / POS Operator**: Restricted to POS terminal operations (Checkout, shift open/close).
- **Kitchen Staff / Line Cook**: Restricted to bumping tickets on the KDS.
- **Rider**: Restricted to the Rider App for delivery fulfillment.

### Level 5: Custom & External
- **Custom Role**: Dynamically composed roles (e.g., "Junior Accountant") constructed from granular permissions.
- **Supplier / Vendor**: External portal access restricted to viewing Purchase Orders and updating catalogs.

## 3. Permission Architecture (Categories)
As fully defined in the [Enterprise Permission Architecture](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/architecture/permissions.md), permissions follow a standardized semantic syntax: `[module].[resource].[action]`.
The architecture strictly enforces a Default Deny, additive-only (Union) evaluation model without Role inheritance.

| Module | Resources | Actions (CRUD+) |
|--------|-----------|-----------------|
| **Auth** | `users`, `roles` | `view`, `create`, `edit`, `delete`, `assign_scope` |
| **POS** | `orders`, `cash_drawer` | `checkout`, `void`, `discount`, `open_drawer`, `close_shift` |
| **Inventory**| `stock`, `transfers`, `po`| `view`, `adjust`, `approve_transfer`, `receive_po` |
| **Kitchen** | `kds_tickets`, `prep` | `view`, `bump`, `recall` |
| **CRM** | `customers`, `loyalty` | `view`, `create`, `edit`, `adjust_points` |
| **Marketing**| `campaigns`, `coupons` | `create`, `launch`, `disable` |
| **Finance** | `ledgers`, `payroll` | `view`, `export`, `approve` |
| **CMS** | `banners`, `settings` | `edit`, `publish` |

## 4. Security Considerations
- **Scope Verification Middleware**: The backend must enforce a mandatory security guard that intercepts every API call and verifies if the user's token possesses authorization for the target `brand_id` or `store_id`. (e.g., If a Cashier from Store A attempts to query `/orders?store_id=B`, the request must inherently fail with `403 Forbidden`).
- **Implicit Deny**: All endpoints must default to `Deny`. Permissions must be explicitly granted via the `@RequirePermissions` decorator.
- **Void & Refund Auditing**: High-risk actions (e.g., `pos.orders.void`) must not only require the permission but also force an `Audit Log` entry recording the exact identity of the approver.

## 5. Future Compatibility
This Hybrid architecture natively supports future pivots into **Cloud Kitchens** (virtual brands sharing a single physical kitchen via overlapping scopes), **Multi-Brand Franchising** (one owner managing multiple `brand_ids`), and **Manufacturing** (Warehouse roles decoupled from POS roles). 

## 6. Database Foundation & Permission Seed
The relational tables enforcing this architecture (`PermissionGroup`, `Permission`, `RolePermission`, `UserAssignment`, `RoleInheritance`) are documented in the [Enterprise RBAC Database Architecture](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/architecture/database-rbac.md).
The full master permission catalogue and role matrix are defined in the [Enterprise Permission Library](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/architecture/permission-library.md).

## 7. Authorization Flow & Middleware
The complete lifecycle of how requests are intercepted, validated against the JWT, cached via Redis, and audited is fully documented in the [Enterprise Authorization Architecture](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/architecture/authorization.md).
