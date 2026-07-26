# Enterprise Permission Library & Seed Architecture

## 1. Overview
The Enterprise Permission Library serves as the master catalog of all permissions, permission groups, default roles, and seeding strategies across the D4U ERP platform. Every permission strictly follows the standard `module.resource.action` naming convention.

## 2. Permission Groups & Modules

| Module / Group | Description | Primary Resources |
|---|---|---|
| `auth` | Authentication & Identity | `users`, `roles`, `permissions`, `sessions` |
| `workspace` | Multi-tenant Organizational Context | `brands`, `branches`, `settings` |
| `pos` | Point of Sale & Terminal Operations | `orders`, `checkout`, `cash_drawer`, `tables`, `reservations` |
| `inventory` | Stock, Warehouse & Purchasing | `products`, `categories`, `stock`, `transfers`, `suppliers`, `po` |
| `kitchen` | Kitchen Operations & KDS | `tickets`, `stations`, `prep` |
| `recipe` | Production & Recipe Costing | `recipes`, `bom`, `production_orders` |
| `crm` | Customer Relationship Management | `customers`, `segments`, `notes` |
| `marketing` | Growth, Loyalty & Promotions | `campaigns`, `coupons`, `loyalty`, `wallet`, `membership`, `affiliates` |
| `cms` | Online Ordering Website & CMS | `banners`, `pages`, `settings` |
| `finance` | Accounting, Expenses & Payroll | `ledgers`, `journals`, `expenses`, `payroll`, `budgets` |
| `hr` | Human Resources & Attendance | `staff`, `attendance`, `shifts`, `leaves` |
| `delivery` | Delivery Fleet & Rider Management | `riders`, `drivers`, `dispatch`, `tracking` |
| `reports` | Analytics & Business Intelligence | `sales`, `finance`, `inventory`, `audit_logs` |
| `system` | Core System Administration | `subscription`, `notifications`, `api_keys`, `audit_logs` |

---

## 3. Complete Permission Catalogue

### 3.1. Authentication & System Access (`auth`, `system`)
- `auth.users.read`
- `auth.users.create`
- `auth.users.update`
- `auth.users.delete` *(High Risk)*
- `auth.roles.read`
- `auth.roles.create`
- `auth.roles.update`
- `auth.roles.delete` *(High Risk)*
- `auth.roles.assign` *(High Risk)*
- `auth.permissions.read`
- `auth.permissions.manage` *(High Risk)*
- `system.settings.read`
- `system.settings.update` *(High Risk)*
- `system.subscription.read`
- `system.subscription.manage` *(High Risk)*
- `system.audit_logs.read`
- `system.api.manage` *(High Risk)*

### 3.2. Workspace & Multi-Tenant (`workspace`)
- `workspace.brands.read`
- `workspace.brands.create` *(High Risk)*
- `workspace.brands.update`
- `workspace.brands.delete` *(High Risk)*
- `workspace.branches.read`
- `workspace.branches.create` *(High Risk)*
- `workspace.branches.update`
- `workspace.branches.delete` *(High Risk)*

### 3.3. POS & Operational (`pos`)
- `pos.orders.read`
- `pos.orders.create`
- `pos.orders.update`
- `pos.orders.void` *(High Risk / Approval Required)*
- `pos.orders.refund` *(High Risk / Approval Required)*
- `pos.orders.discount` *(Approval Required)*
- `pos.cash_drawer.open` *(Approval Required)*
- `pos.cash_drawer.reconcile`
- `pos.tables.manage`
- `pos.reservations.manage`

### 3.4. Inventory & Purchasing (`inventory`)
- `inventory.categories.read`
- `inventory.categories.manage`
- `inventory.products.read`
- `inventory.products.create`
- `inventory.products.update`
- `inventory.products.delete` *(High Risk)*
- `inventory.stock.read`
- `inventory.stock.adjust` *(Approval Required)*
- `inventory.transfers.create`
- `inventory.transfers.approve` *(Approval Required)*
- `inventory.suppliers.manage`
- `inventory.po.create`
- `inventory.po.approve` *(Approval Required)*

### 3.5. Kitchen & Recipe Costing (`kitchen`, `recipe`)
- `kitchen.tickets.read`
- `kitchen.tickets.bump`
- `kitchen.tickets.recall`
- `recipe.recipes.read`
- `recipe.recipes.manage`
- `recipe.bom.manage`
- `recipe.production.create`
- `recipe.production.approve`

### 3.6. CRM & Marketing (`crm`, `marketing`, `cms`)
- `crm.customers.read`
- `crm.customers.create`
- `crm.customers.update`
- `crm.customers.delete` *(High Risk)*
- `marketing.campaigns.read`
- `marketing.campaigns.publish`
- `marketing.coupons.create`
- `marketing.coupons.manage`
- `marketing.loyalty.adjust_points` *(Approval Required)*
- `marketing.wallet.credit_debit` *(High Risk / Approval Required)*
- `cms.content.edit`
- `cms.content.publish`

### 3.7. Finance & HR (`finance`, `hr`)
- `finance.ledgers.read`
- `finance.journals.create`
- `finance.journals.post` *(Approval Required)*
- `finance.expenses.create`
- `finance.expenses.approve` *(Approval Required)*
- `finance.payroll.read`
- `finance.payroll.approve` *(High Risk / Approval Required)*
- `finance.reports.export` *(High Risk)*
- `hr.staff.read`
- `hr.staff.manage`
- `hr.attendance.read`
- `hr.attendance.update`

### 3.8. Delivery & Fleet (`delivery`)
- `delivery.riders.read`
- `delivery.riders.manage`
- `delivery.dispatch.assign`
- `delivery.tracking.read`

---

## 4. High Risk & Approval Permission Matrix

The following permissions are classified as **High Risk** or **Approval Required** and generate audit log alerts upon execution:

| Permission | Category | Risk Level | Requires Approval |
|---|---|---|---|
| `auth.users.delete` | System | CRITICAL | Yes |
| `auth.roles.assign` | System | CRITICAL | Yes |
| `auth.permissions.manage` | System | CRITICAL | Yes |
| `system.settings.update` | System | HIGH | Yes |
| `workspace.brands.delete` | Workspace | CRITICAL | Yes |
| `workspace.branches.delete` | Workspace | CRITICAL | Yes |
| `pos.orders.void` | POS Operations | HIGH | Yes (Manager PIN/Grant) |
| `pos.orders.refund` | POS Operations | HIGH | Yes (Manager PIN/Grant) |
| `pos.cash_drawer.open` | POS Operations | MEDIUM | Yes (Manager PIN/Grant) |
| `inventory.products.delete` | Inventory | HIGH | No |
| `inventory.stock.adjust` | Inventory | MEDIUM | Yes |
| `inventory.po.approve` | Purchasing | HIGH | Yes |
| `marketing.wallet.credit_debit` | Marketing | HIGH | Yes |
| `finance.payroll.approve` | Finance | CRITICAL | Yes |
| `finance.reports.export` | Finance | HIGH | No |

---

## 5. Default Role Permission Matrix

```
[M] = Full Manage (Create, Read, Update, Delete)
[R] = Read Only
[E] = Execution / Operational
[A] = Approval Privileges
[-] = No Access
```

| Role Name | Auth & System | Workspace | POS Ops | Inventory | Kitchen | CRM/Mktg | Finance/HR |
|---|---|---|---|---|---|---|---|
| **Super Admin** | M | M | M | M | M | M | M |
| **Brand Owner** | R | M | M | M | R | M | M |
| **Regional Manager** | - | R (Scoped) | M | M | R | R | R |
| **Branch Manager** | - | R (Scoped) | M + A | M + A | R | R | R (Expenses) |
| **Assistant Manager** | - | - | M + A | R | R | R | - |
| **Cashier** | - | - | E | - | - | R (Create) | - |
| **Kitchen Manager** | - | - | - | R | M | - | - |
| **Line Chef** | - | - | - | - | E | - | - |
| **Inventory Manager** | - | - | - | M + A | - | - | - |
| **Purchase Manager** | - | - | - | M (PO) | - | - | - |
| **Finance Manager** | - | - | - | - | - | - | M + A |
| **Accountant** | - | - | - | - | - | - | R + E |
| **HR Manager** | - | - | - | - | - | - | M (HR) |
| **Marketing Manager** | - | - | - | - | - | M | - |
| **Customer Support** | - | - | R | - | - | M | - |
| **Dispatcher / Rider**| - | - | - | - | - | - | - (Delivery E)|
| **Auditor / ReadOnly**| - | R | R | R | R | R | R |

---

## 6. Seed Strategy & Migration Execution Plan — ✅ COMPLETED (EWO-R010)

The idempotent seed script (`prisma/seed-rbac.ts`) has been implemented and verified. See [RBAC Seeding Architecture](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/architecture/rbac-seeding.md).

**Verified Statistics (Run 1 & Run 2 identical — confirming idempotency):**
- `PermissionGroup`: 14 seeded
- `Permission`: 84 seeded
- `Role`: 25 seeded
- `RolePermission`: 278 seeded

Run command: `npx ts-node prisma/seed.ts`

---

## 7. Future Expansion Strategy
- **Namespace Isolation**: New third-party modules or microservices must register a unique top-level module prefix (e.g., `wh.inventory.pack` for Warehouse).
- **Extensible Action Dictionary**: Custom actions outside standard CRUD must be documented in the master permission catalog before deployment.
- **Dynamic Feature Flags**: Permissions map 1:1 with tenant feature flags, enabling/disabling modules cleanly per Brand subscription.
