# Enterprise Recovery: EWO-R001
**Title:** Workspace Recovery & Global Context Restoration
**Date:** 2026-07-25
**Priority:** CRITICAL

## Purpose
The purpose of this recovery operation was to restore the Enterprise Workspace System (Global Workspace Bar) exactly as it existed before recent regressions, ensuring the global layout is persistent and does not cause application reload, route breakage, or sidebar state loss. 

## Architecture & Components
The `GlobalHeader` component, located in `src/components/workspace/GlobalHeader.tsx`, encapsulates the workspace switching and status logic (`WorkspaceSwitcher`, `WorkspaceContextPanel`, `WorkspaceStatus`). 

This component was reintegrated into the primary `AdminLayout` wrapper in `App.tsx`. 

**Implementation Strategy:**
- The `GlobalHeader` is mounted as a persistent top bar within the `flex-1` main content area of `AdminLayout`.
- Because it is placed within the `AdminLayout` (which is inside the `AdminProvider`), any changes to the active Brand or Branch via the header instantly update the React Context.
- This cascade updates all child modules (Overview, Staff, Inventory, Marketing, CRM, etc.) synchronously and seamlessly without full page reloads, satisfying the constraint of not losing the Single Page Application (SPA) state.

## Modified Files
- `d4u-admin/src/App.tsx` (Injected `GlobalHeader`)

## Data Flow
1. User selects Brand -> `pendingBrandId` is updated locally in `WorkspaceSwitcher`.
2. User selects Branch -> `pendingBranchId` is updated locally.
3. User clicks "Enter" -> `activeBrandId` and `selectedBranchId` are updated in the global `AdminContext`.
4. React Context triggers a re-render of the active module (e.g., `MarketingHub`), which then fetches branch-specific data automatically.

## Regression Verification
- **Login/Logout**: Unchanged and functional.
- **Sidebar**: Unchanged, remains persistent.
- **Routes**: No routing logic was altered; modules load successfully.
- **Existing Functionality**: Unchanged, the injection of the layout does not interfere with inner module states.
- **TypeScript**: Verified via `tsc --noEmit`.

## Business Logic & Future Extension Points
No business logic (Inventory, Marketing, CRM, Subscriptions, Permissions) was touched during this structural layout recovery, strictly adhering to the Module Freeze Policy.
Future modules can simply be registered as routes under `AdminLayout`, and they will automatically inherit the Global Workspace Bar and Context.

---

# Enterprise Recovery: EWO-R002
**Title:** Workspace Integration Audit
**Date:** 2026-07-25
**Priority:** CRITICAL

## Purpose
To verify that every Admin module is properly consuming the Global Workspace Context introduced in EWO-R001. No logic changes were performed during this audit.

## Modules Audited & Audit Matrix

| Module | Workspace Ready | Uses Context | Local Brand Selector | Local Branch Selector | Refreshes on Change | Needs Page Refresh | Broken Bindings |
|--------|-----------------|--------------|----------------------|-----------------------|---------------------|--------------------|-----------------|
| Overview | **YES** | YES | NO | NO | YES | NO | None |
| Staff | **YES** | YES | NO | NO | YES | NO | None |
| Inventory | **YES** | YES | NO | NO | YES | NO | None |
| Recipe Costing | **YES** | YES | NO | NO | YES | NO | None |
| Marketing | **YES** | YES | NO | NO | YES | NO | None |
| CRM | **NO** | NO | NO | NO | NO | NO | Hardcoded `brandId = 1`, does not respect `selectedBranchId`. |
| Website CMS | **PARTIAL** | YES | NO | YES | YES | NO | Still contains its own local branch `<select>` dropdown. |
| SaaS | **YES** | N/A | NO | NO | N/A | NO | None (Global Scope) |
| Branches | **YES** | YES | NO | NO | YES | NO | None |
| Reports | **N/A** | N/A | N/A | N/A | N/A | N/A | Module does not exist yet (Placeholder). |

## Findings
1. **Fully Compatible Modules**: Overview, Staff, Inventory, Recipe Costing, Marketing, SaaS, Branches.
2. **Modules Requiring Recovery**: 
   - **CRM**: Fails to use Global Context.
   - **Website CMS**: Fails strict integration due to redundant local UI.

## Recommended Recovery Order
1. **CRM**: Highest priority. It currently ignores context and fetches hardcoded brand data, posing a severe cross-tenant data leak risk.
2. **Website CMS**: Medium priority. Needs local `<select>` removed to enforce strict reliance on the Global Workspace Header.

---

# Enterprise Recovery: EWO-R003
**Title:** CRM Foundation Recovery
**Date:** 2026-07-25
**Priority:** CRITICAL

## Purpose
To recover the CRM module (`CustomersManager.tsx`) so it fully complies with the Global Workspace Context, resolving the critical cross-tenant data leak where the context was statically hardcoded to `brandId = 1`. 

## Root Cause
- The `CustomersManager.tsx` UI completely bypassed `useAdminContext()` and did not watch for global context changes.
- The `CustomersService` and `CustomersController` backend lacked branch-level scoping, accepting only `brand_id`.

## Architecture & API Changes
- **Frontend**: The CRM module now dynamically tracks `activeBrandId` and `selectedBranchId` natively from the layout context wrapper, appending them to the `/customers` fetch request.
- **Backend API**: The `/customers` GET endpoint contract was updated to accept an optional `store_id` parameter.
- **Relational Filtering**: If `store_id` is supplied, the backend utilizes a Prisma relational `some` filter against the `Order` entity. This accurately binds the global Customer entity to the active branch by returning only customers who have transacted at that specific branch.

## Files Modified
- `d4u-admin/src/pages/CustomersManager.tsx`
- `d4u-pos-backend/src/modules/business/customers/customers.controller.ts`
- `d4u-pos-backend/src/modules/business/customers/customers.service.ts`

## Regression Results
- **CRM**: PASS. Fully tracks branch state.
- **Overview**: PASS.
- **Workspace**: PASS.
- **Inventory, Marketing, CMS, Staff, Auth**: PASS (No impact).

## Future CRM Roadmap
- Loyalty Redesign
- Referral System
- Digital Wallet
- Coupon and Discount Engine

---

# Enterprise Recovery: EWO-R005
**Title:** Staff Foundation Recovery
**Date:** 2026-07-25
**Priority:** CRITICAL

## Purpose
To recover the Staff module and fortify the `User` entity, bridging the gap between a basic POS login ledger and a fully-fledged Enterprise HR/Identity foundation, preparing the system for the upcoming Hybrid Context-Aware RBAC integration.

## Architecture & API Changes
- **Database Refactor**: Upgraded the `User` Prisma model to support core HR and Identity fields (`emp_id`, `email`, `designation`, `status`, `joining_date`, `notes`).
- **Workspace Integration**: Eradicated the client-side array filtering anti-pattern. The frontend now natively passes `activeBrandId` and `selectedBranchId` via API query parameters to `users.controller.ts`, which proxies to relational Prisma queries.
- **RBAC Readiness**: Documented in `docs/architecture/staff.md`. The current entity binds `role_id` and `store_id` directly to the `User`. To support true Enterprise RBAC, this must be refactored into a `UserAssignment` relational table in a future Work Order.

## Files Modified
- `prisma/schema.prisma`
- `d4u-admin/src/pages/StaffPermissions.tsx`
- `d4u-pos-backend/src/modules/core/users/users.controller.ts`
- `d4u-pos-backend/src/modules/core/users/users.service.ts`

## Regression Results
- **Staff**: PASS. (Context-aware fetching, form supports new fields).
- **Workspace**: PASS.
- **CRM, Inventory, Marketing, CMS, Auth**: PASS (No impact).
