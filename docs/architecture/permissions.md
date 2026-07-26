# Enterprise Permission Architecture

## 1. Permission Architecture Overview
The Enterprise Permission Architecture defines how access rights are structured, named, inherited, and evaluated across all D4U modules. It completes the Hybrid Context-Aware RBAC model by specifying the exact granularity of control granted to a `Role` within a `UserAssignment`.

### Core Concepts:
- **Permission**: The atomic right to perform a specific action on a specific resource within a module (e.g., `inventory.stock.adjust`).
- **Role**: A collection of Permissions (e.g., "Kitchen Manager").
- **Permission Group / Module**: A logical boundary grouping related permissions (e.g., `inventory`, `crm`).
- **Action**: The verb (CRUD+). Examples: `read`, `create`, `update`, `delete`, `approve`, `export`, `void`.
- **Resource**: The noun (entity). Examples: `customers`, `stock`, `orders`.

## 2. Permission Naming Convention
To ensure consistency across the enterprise, all permissions **must** strictly adhere to the following dotted syntax:
`[module].[resource].[action]`

### Action Dictionary
- `read`: View records or lists.
- `create`: Add new records.
- `update`: Modify existing records.
- `delete`: Soft/Hard delete records.
- `approve`: Workflow approval (e.g., POs, Voids).
- `export`: Download data (CSV, PDF).
- `import`: Bulk upload data.
- `void`: Reverse financial/inventory transactions.
- `publish`: Make CMS/Marketing changes live.

### Example Categories & Permissions
*(For the exhaustive list of all enterprise permissions, see the [Enterprise Permission Library](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/architecture/permission-library.md)).*

- **Inventory**: `inventory.products.read`, `inventory.stock.adjust`, `inventory.transfers.approve`
- **POS**: `pos.orders.create`, `pos.orders.void`, `pos.cash_drawer.open`
- **Marketing**: `marketing.campaigns.publish`, `marketing.coupons.create`
- **HR**: `hr.payroll.export`, `hr.attendance.update`
- **CRM**: `crm.customers.update`, `crm.loyalty.adjust`
- **System**: `system.users.assign_role`, `system.settings.update`

## 3. Permission Inheritance & Conflicts
- **Additive Only (Union)**: Permissions are strictly additive. If a user holds multiple roles (via multiple `UserAssignment` records), their effective permissions are the Union of all permissions across those roles (within the relevant scope).
- **No Explicit Deny**: There is no `deny` permission concept (e.g., `-inventory.stock.adjust`). Managing denies creates extreme complexity in multi-role evaluation. Instead, access is simply not granted unless an explicit `allow` exists in the Role.
- **No Role Inheritance**: Roles do *not* inherit from other roles (e.g., "Manager" does not inherit "Cashier"). Instead, a "Manager" role must explicitly check the boxes for all required permissions, or the user must be assigned both "Manager" and "Cashier" roles. This prevents unintended privilege escalation when a lower role is modified.

## 4. Permission Evaluation Flow
When a user attempts an API action requiring `[module].[resource].[action]` at `[target_scope]`:

1. **Token Unpacking**: Extract the user's `UserAssignments` from the JWT.
2. **Scope Filtering**: Retain only `ACTIVE` assignments matching `target_scope` (Brand/Branch match).
3. **Permission Check**: For the filtered assignments, look up the associated Roles. Does any Role contain the required permission?
4. **Resolution**: 
   - **Match Found** -> `200 OK` (or proceed).
   - **No Match Found** -> `403 Forbidden`.

## 5. Security Strategy
- **Default Deny**: The entire system operates on a Default Deny paradigm. All backend endpoints implicitly reject access unless explicitly decorated with a `@RequirePermissions('...')` guard.
- **Micro-Segmentation**: Permissions are tightly coupled to the scope. Having `hr.payroll.export` at Branch A grants zero access to Branch B's payroll.

## 6. Performance & Caching Strategy
Permissions must be evaluated in milliseconds to avoid POS lag.
- **Strategy: Embedded JWT + Redis Cache Hybrid**
- **JWT**: The JWT contains `user_id` and the `UserAssignment` IDs (not the full permission strings, which would bloat the token beyond HTTP header limits).
- **Redis Cache**: The API Gateway/Middleware fetches the flattened permission array for a specific `UserAssignment` from Redis (e.g., `assignment:102:permissions -> ['pos.orders.create', 'pos.orders.void']`).
- **Invalidation**: When an Admin updates a Role or changes a User's Assignment, the backend fires an event to invalidate the relevant Redis keys, forcing the next API call to rehydrate the cache from PostgreSQL.

## 7. Audit Strategy
Strict audit trails are required for compliance (e.g., SOC2, PCI-DSS).
The following events MUST be logged in the `AuditLog` table:
- **Role Altered**: Any addition/removal of a permission to a Role (Logs `role_id`, `permission`, `updated_by`).
- **Assignment Changed**: When a User is granted, suspended, or revoked a `UserAssignment`.
- **High-Risk Actions**: Any successful action requiring `.void`, `.approve`, or `.export` (e.g., Voiding a POS order logs the `approver_id`).
- **Failed Authorization (403)**: Logged as a potential Privilege Escalation Attempt (Logs `user_id`, `attempted_permission`, `target_scope`).

## 8. Future Compatibility
This architecture is modular and future-proof. Adding a new module (e.g., "Manufacturing") simply requires defining a new namespace (e.g., `manufacturing.bom.create`) and seeding it into the database. No core RBAC engine code needs to change. Advanced rules (like Attribute-Based Access Control - ABAC) can be layered on top later if required.
