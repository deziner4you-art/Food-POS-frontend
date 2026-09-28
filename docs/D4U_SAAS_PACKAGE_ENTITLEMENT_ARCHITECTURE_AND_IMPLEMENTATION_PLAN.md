# D4U POS SaaS Package, Add-on and Multi-Tenant Architecture Plan

**Document status:** Architecture and implementation plan  
**Date:** 2026-09-27  
**Scope:** D4U POS multi-tenant SaaS, monthly rental packages, add-ons, POS ordering, KOT printing, KDS, Marketing Hub, Website/CMS, CRM, Rider, TV Board and accounting  
**Current engineering process:** Codex implements; Antigravity performs read-only audit; deployment happens only after an independent PASS and explicit approval.

## 1. Executive decision

D4U POS must use one central entitlement system. A restaurant may purchase a base package and optional add-ons, and the backend must enable only the capabilities included in the active subscription/package for the authenticated brand and store.

The current repository already contains substantial foundations:

- Brand and Store tenant hierarchy.
- Store package assignment.
- Brand subscription and monthly/quarterly/yearly billing records.
- Package modules and a-la-carte pricing records.
- POS ordering, KOT creation/printing foundation, Business Day, Cash In/Out and daily reporting.
- KDS, Rider, Website, CMS, CRM/Loyalty and Marketing Hub modules.
- Shared campaign pricing used by POS and Website orders.

However, package selection is not yet a universal security boundary. Several modules still rely on permissions or CMS toggles without a strict backend package entitlement check. The implementation plan below closes that gap in small, independently testable batches.

## 2. Product model

### 2.1 Base POS rental

The minimum POS rental must include:

- POS order entry.
- KOT ticket creation and printing.
- Business Day Start and Close.
- Cash In and Cash Out.
- Daily sales and cashier/session reporting.
- Basic order, void, refund and settlement workflows.

KOT printing is not KDS. A POS-only client must be able to print kitchen tickets without receiving a Kitchen Display screen.

### 2.2 Optional add-ons

| Capability | Suggested module key | Business meaning |
|---|---|---|
| Base POS | `BASE_POS` | POS operation and core ordering |
| KOT printing | `KOT_PRINT` or included in `BASE_POS` | Printed kitchen tickets without KDS |
| POS accounting/day-close reports | `ACCOUNTING_POS` or included in `BASE_POS` | Cash flow, daily totals and cashier reconciliation |
| Kitchen Display | `KDS` | Chef/KDS screens and kitchen workflow |
| Marketing Hub | `MARKETING` | Campaigns, offers, promotions and promotion analytics |
| Online ordering | `ONLINE_WEBSITE` | Customer-facing online ordering |
| Website CMS | `CMS` | Banners, pages, SEO and website branding |
| CRM | `CRM` | Customer records, history and CRM reporting |
| Loyalty | `LOYALTY` | Points earning, redemption and loyalty ledger |
| Rider app | `RIDER` | Delivery rider portal and delivery lifecycle |
| Customer TV Board | `TV_BOARD` | Customer-facing order/status display |
| Inventory | `INVENTORY` | Stock, purchases and inventory controls |
| Recipes | `RECIPES` | Recipe costing and production |
| Vendors | `VENDORS` | Vendor management and purchasing support |
| Analytics | `ANALYTICS` | Advanced analytics and owner dashboards |
| HR/Payroll | `HR_PAYROLL` | Staff HR and payroll features |

The final naming must be centralised in one registry. Frontends, backend guards, pricing and Admin menus must not invent different spellings for the same module.

## 3. Current repository inventory

### 3.1 Existing foundations — PASS at source-architecture level

The repository contains:

- `Brand`, `Store`, `Package`, `PackageModule`, `Subscription`, `SubscriptionPayment` and `BillingHistory` models.
- `Store.saas_package_id` for branch package assignment.
- Package CRUD and pricing UI in `d4u-admin/src/pages/SuperAdmin.tsx`.
- Branch/package assignment in `d4u-admin/src/pages/StoreManager.tsx`.
- New-client package selection in `d4u-admin/src/pages/SetupWizard.tsx`.
- Subscription service in `d4u-pos-backend/src/modules/core/subscription/subscription.service.ts`.
- A global `SubscriptionGuard` in `d4u-pos-backend/src/common/guards/subscription.guard.ts`.
- POS core, KOT, Business Day, Cash Flow, reports, Marketing, CMS, CRM, KDS and Rider modules.

This is source inspection status, not a claim that every workflow has been runtime verified.

### 3.2 Existing Marketing Hub foundations — PARTIAL

The Marketing Hub already contains a substantial engine:

- Percentage and flat discounts.
- BOGO and Buy-X-Get-Y.
- Bundle and Combo pricing.
- Free gifts.
- Happy-hour/scheduled campaigns.
- Campaign priority and stacking rules.
- Product, category, store and brand-wide targeting.
- Approval, pause, resume, rollback, archive and history.
- Campaign audit log and analytics structures.
- POS and Website publication flags.
- Shared `PricingService`/`CampaignResolverService` path.
- Promotion attribution fields on POS orders.

The remaining entitlement and accounting work is listed in the priority plan below.

### 3.3 Existing CMS and Website foundations — PARTIAL

The repository contains:

- Separate `d4u-website` frontend.
- Embedded website components under `d4u-pos-client/src/website`.
- CMS banners and settings.
- Branch/brand campaign and banner targeting.
- Online order creation and tracking.

Website/CMS access is not yet consistently controlled by package capability at both frontend and backend boundaries.

### 3.4 Existing Admin menu — PARTIAL

The Admin application currently exposes branch menus such as:

- Staff & Permissions.
- Menu Builder.
- Inventory.
- Recipes.
- Purchase.
- Marketing Hub.
- CRM & Loyalty.
- Website CMS.
- Delivery Exceptions.

Marketing Hub has a partial capability-based hide/show path. Most other menu entries are not centrally derived from the assigned package. No authoritative `menu_level`/`menuLevel` entitlement field was found. The Menu Builder hierarchy itself is detailed (`Menu Collection -> Category Group -> Category -> Product`), but this is different from package-based Admin menu visibility.

## 4. Non-negotiable architecture rules

1. **Backend is authoritative.** Hiding a menu or route is not security.
2. **Fail closed.** Missing package, missing module, invalid tenant context, expired subscription or capability lookup failure must not enable a paid feature.
3. **No hardcoded tenant defaults.** No `|| 1`, default brand/store IDs or client-supplied tenant identity may decide access.
4. **JWT context is authoritative for ordinary users.** Requested `store_id` and `brand_id` must be checked against the authenticated active workspace.
5. **Super Admin is the only intentional cross-tenant operator.** Every other role must be limited to its authorized brand/store scope.
6. **One module registry.** Module keys, display labels, dependencies and route/API ownership must come from one shared contract.
7. **UI and API use the same capability snapshot.** UI state is for presentation; API guards make the final decision.
8. **POS-only never implies KDS.** KOT printing and KDS are separate capabilities.
9. **Marketing discounts are one pricing decision.** POS, Website and future channels must use the same pricing engine and preserve the decision into order/report/accounting records.
10. **Every paid capability is auditable.** Package assignment, upgrade, downgrade, suspension, expiry and override actions must be recorded.
11. **Existing ordering protections must remain intact.** Business-day identity, KOT identity, delivery READY gate, canonical ONLINE/POS delivery identity, rider ownership and stale-sync protection are regression boundaries.

## 5. Target entitlement architecture

### 5.1 Central module registry

Create one backend-owned registry containing, for each module:

- `module_key`.
- Display name.
- Description.
- Required dependencies.
- Whether it is included in Base POS.
- Frontend surfaces.
- Backend route/controller groups.
- Permission namespace.
- Whether it can be sold as an add-on.

Example dependency rules:

```text
KOT_PRINT        -> BASE_POS
ACCOUNTING_POS   -> BASE_POS
KDS              -> BASE_POS + KOT_PRINT
MARKETING        -> BASE_POS
ONLINE_WEBSITE   -> BASE_POS
CMS              -> ONLINE_WEBSITE (unless sold independently by policy)
RIDER            -> BASE_POS
TV_BOARD         -> BASE_POS
LOYALTY          -> CRM or BASE_POS, according to final pricing policy
```

Dependencies must be checked during package creation and entitlement resolution. A package must not be able to purchase an unusable child module without its required parent.

### 5.2 Capability resolver

Implement one server-side service such as `EntitlementService` or `CapabilitiesService`:

```text
resolveForAuthenticatedUser(user, requestedStoreId?)
resolveForStore(storeId)
hasModule(storeId, moduleKey)
requireModule(storeId, moduleKey)
```

The resolver must:

- Resolve the real store and brand from the database.
- Confirm the store belongs to the active brand.
- Load the store package and its modules.
- Confirm the brand subscription is active and within its allowed grace rules.
- Reject archived/inactive packages.
- Apply module config safely.
- Return disabled capabilities on missing/invalid context.
- Never trust a client-provided package, brand or capability value.

### 5.3 Capability response

Expose an authenticated, store-scoped endpoint such as:

```text
GET /entitlements/current?store_id=<active store>
```

The response should include:

```json
{
  "tenant": { "brandId": 10, "storeId": 25 },
  "subscription": {
    "status": "ACTIVE",
    "packageId": 3,
    "packageCode": "POS_BASIC",
    "expiresAt": "2026-10-27T00:00:00.000Z"
  },
  "modules": ["BASE_POS", "KOT_PRINT", "ACCOUNTING_POS"],
  "capabilities": {
    "pos": true,
    "kotPrint": true,
    "businessDay": true,
    "dailyReports": true,
    "accounting": true,
    "kds": false,
    "marketing": false,
    "website": false,
    "cms": false,
    "crm": false,
    "loyalty": false,
    "rider": false,
    "tvBoard": false,
    "inventory": false,
    "recipes": false
  }
}
```

### 5.4 Backend guard

Add a capability decorator/guard pattern, for example:

```text
@RequireModule('KDS')
@RequireModule('MARKETING')
@RequireModule('ONLINE_WEBSITE')
```

The guard must run after authentication and before the controller. It must protect direct API calls even when the frontend menu is hidden.

## 6. Subscription and tenant policy

The current schema has a brand-level unique Subscription and a store-level package assignment. This must be made an explicit policy rather than an accidental combination.

Recommended policy:

- `Subscription` is the commercial contract for a brand/client.
- `Store.saas_package_id` is the package assigned to a branch.
- The assigned package must belong to the active brand's subscription contract.
- A branch cannot use a package assigned to another brand.
- A package change is effective only after an auditable upgrade/downgrade action.
- Subscription status and expiry apply to all paid capabilities.
- Super Admin can temporarily override capability access only through an audited action.

If branch-level billing is required later, introduce a deliberate branch subscription model rather than silently reusing the brand-level unique constraint.

Required subscription states:

```text
ACTIVE       -> all purchased capabilities available
GRACE_PERIOD -> policy-defined access, visibly marked and audited
EXPIRED      -> paid capabilities disabled
SUSPENDED    -> paid capabilities disabled
ARCHIVED     -> never usable
```

## 7. Module-specific target behavior

### 7.1 POS Basic

Allowed:

- POS order creation and management.
- KOT printing.
- Business Day Start/Close.
- Cash In/Out.
- Daily reports.

Not implied:

- KDS.
- Marketing Hub.
- Website/CMS.
- Rider.
- TV Board.

### 7.2 KDS

Protect:

- Chef authentication/session creation.
- KOT/KDS read, accept, bump and cancel APIs.
- Kitchen dashboard/stations/stock requests where applicable.
- KDS frontend routes.
- TV Board if TV is coupled to KDS by product policy.

Remove KDS permissions from generic POS compatibility shortcuts. A user with POS capability must not receive KDS access unless both role permission and package capability are present.

### 7.3 Marketing Hub

Protect:

- Campaign create/update/delete/archive.
- Campaign approval and lifecycle actions.
- Campaign publication to POS, Website, social and TV.
- Marketing analytics.
- Promotion engine consumption.

If `MARKETING` is absent, campaigns must not apply to orders even if a stale campaign row exists.

### 7.4 Website and CMS

Separate these decisions:

- `ONLINE_WEBSITE`: customer ordering and order tracking.
- `CMS`: banners, pages, SEO, branding and website management.

Public endpoints must always resolve a valid store/brand context. No public endpoint may default to brand/store `1` when context is missing.

### 7.5 CRM and Loyalty

Recommended split:

- `CRM`: customer records, addresses, history and CRM reports.
- `LOYALTY`: earning, redemption and loyalty ledger.

If the business sells them together, the package may include both, but the backend contract must still define the dependency.

### 7.6 Rider and TV Board

Protect REST, sockets, frontend routes and recovery/admin actions. Existing canonical delivery identity must remain mandatory:

```text
entityType + entityId
```

Module gating must not weaken store/business-day isolation or delivery lifecycle rules.

## 8. Marketing, pricing, reporting and accounting contract

### 8.1 One pricing path

POS, Website, Waiter, QR, Kiosk and future ordering channels must call the shared pricing/promotion engine. No channel may calculate its own discount formula.

### 8.2 Order snapshot

Every order that receives a promotion must preserve:

- Gross subtotal.
- Promotion/campaign ID.
- Campaign type and name.
- Campaign discount amount.
- Loyalty discount amount.
- Delivery fee.
- Taxable amount.
- Net total.
- Applied rules.
- Rejected/blocked promotion decisions where applicable.

The OnlineOrder-to-POS twin path must preserve the same financial snapshot. It must never recreate an online sale with `discount: 0` when a discount was actually applied.

### 8.3 Day-close reporting

Daily reports must expose at minimum:

```text
Gross sales
Campaign discounts
Loyalty discounts
Net sales
Tax
Delivery fees
Cash sales
Card/online sales
Refunds
Voids
Cash In
Cash Out
Expected cash
Actual closing cash
Order count
Promotion usage/count
```

### 8.4 Ledger policy decision

Before implementation, approve one accounting policy:

1. Post net sales only and report gross/discount in operational reports; or
2. Post gross revenue plus a contra-revenue discount line; or
3. Post a dedicated marketing expense/subsidy line when D4U or a third party funds the offer.

The selected policy must be used consistently for POS, Website and settlement flows.

## 9. Admin application architecture

### 9.1 Super Admin

Super Admin may:

- Create and edit packages.
- Manage module pricing.
- Assign packages to brands/stores.
- Upgrade/downgrade packages.
- Suspend/renew subscriptions.
- View all modules for administration.
- Override only through audited controls.

### 9.2 Client Admin

Client Admin should see only:

- Purchased modules.
- Permitted sub-features.
- Its own brand and authorized stores.

The menu must be derived from the capability response, not from hardcoded assumptions.

### 9.3 Normal versus detailed menu

If a Normal/Detailed Admin menu is required, implement it as presentation configuration only:

- `NORMAL`: top-level purchased modules and essential actions.
- `DETAILED`: purchased modules plus advanced submenus and reports.

It must never grant access. Backend capabilities and permissions remain authoritative.

## 10. Priority plan

### P0 — Must complete before promising strict add-on isolation

#### P0.1 Central module registry and capability resolver

Deliver:

- Canonical module keys.
- Dependency rules.
- Store/brand/subscription resolution.
- Fail-closed behavior.
- Capability endpoint.

Acceptance:

- Missing package returns disabled capabilities.
- Expired/suspended subscription cannot expose paid modules.
- Cross-brand package lookup is rejected.
- Super Admin behavior is explicit and audited.

#### P0.2 Backend module guard

Protect at least:

- POS/base routes.
- KOT print routes.
- KDS/kitchen routes.
- Marketing routes.
- Website/CMS management routes.
- Rider routes.
- TV Board routes.
- CRM/Loyalty routes.

Acceptance:

- Direct API calls are rejected without the purchased module.
- UI hiding is not used as proof of security.

#### P0.3 POS-only/KDS isolation

Deliver:

- POS-only package with POS + KOT print + day-close/reporting.
- KDS disabled in frontend and backend.
- Remove generic POS-to-KDS permission leakage.

Acceptance:

- POS-only can create and print KOT.
- POS-only cannot open KDS route.
- POS-only cannot call KDS API.
- POS + KDS works normally.

#### P0.4 Tenant boundary hardening

Deliver:

- Replace remaining unconditional tenant bypasses.
- Enforce active JWT store/brand context.
- Remove public brand/store fallback IDs.
- Verify all paid-module queries are tenant-scoped.

Acceptance:

- Brand A cannot read or mutate Brand B data.
- Store A cannot read or mutate Store B data.
- Missing tenant identity fails closed.

### P1 — Required for the rental product to be commercially accurate

#### P1.1 Marketing Hub entitlement

- Remove full-capability fallback for missing package/module.
- Remove frontend `enabled: true` fallbacks.
- Gate campaign CRUD and publication.
- Gate promotion execution.
- Add package-disabled regression tests.

#### P1.2 Promotion financial integrity

- Preserve discount data through OnlineOrder -> POS twin.
- Define gross/net/discount accounting policy.
- Add day-close promotion totals.
- Add ledger/report reconciliation tests.

#### P1.3 Website/CMS entitlement

- Gate online ordering by `ONLINE_WEBSITE`.
- Gate CMS by `CMS`.
- Remove brand `1` public fallback.
- Test branch and brand isolation for banners/campaigns.

#### P1.4 Admin capability-driven menus

- Build shared capability hook/context.
- Hide unavailable modules.
- Protect deep links with a capability boundary.
- Show a clear “module not included” state instead of a broken page.

### P2 — Important product completeness

- CRM and Loyalty entitlement separation.
- Rider and TV Board package guards.
- Inventory, Recipes and Vendors package guards.
- Advanced Analytics package guard.
- Package upgrade/downgrade effective-date rules.
- Subscription grace-period policy and UI.
- Capability cache invalidation after package changes.
- Audit log for entitlement changes.

### P3 — Later commercial and operational improvements

- Usage limits and quotas.
- Per-module configuration editor.
- Branch-level pricing.
- Feature trials.
- Add-on proration.
- Invoice generation.
- Billing reminders.
- Customer self-service upgrade requests.
- Website live-preview dashboard combining CMS, campaigns and menu state.

## 11. Parallel workstreams

Work may proceed in parallel only where the dependency is respected.

| Workstream | Scope | Dependency |
|---|---|---|
| A | Module registry and capability resolver | None; first foundation |
| B | POS/KOT/KDS guard | A |
| C | Marketing entitlement and pricing | A; financial policy for ledger work |
| D | Website/CMS entitlement | A; tenant hardening |
| E | CRM/Loyalty entitlement | A |
| F | Rider/TV entitlement | A; preserve delivery identity contract |
| G | Admin capability menus | A; can prototype after endpoint contract |
| H | Accounting/promotion reconciliation | Pricing data contract and accounting policy |
| I | Tenant boundary hardening | Can start audit immediately; changes must be coordinated with A |

Each workstream must modify only its declared files and must include focused behavioral tests.

## 12. Implementation and audit protocol

For every small task:

1. Codex receives one narrowly scoped implementation task.
2. No database reset, seed, truncate or production data mutation.
3. Codex runs focused tests, type checks and builds.
4. Antigravity receives a read-only independent audit prompt.
5. Antigravity must inspect actual code, not only the implementation report.
6. Antigravity reports PASS, PARTIAL, FAIL or NOT VERIFIED with exact evidence.
7. No commit/push/deploy before PASS.
8. Deployment is a separate approved step after audit PASS.
9. After deployment, perform read-only smoke checks and regression checks.

## 13. Required test matrix

Every entitlement implementation must test:

### Package states

- Active package with module: allowed.
- Active package without module: rejected.
- Missing package: rejected.
- Inactive/archived package: rejected.
- Expired subscription: rejected.
- Suspended subscription: rejected.
- Grace period: policy-specific and explicit.

### Tenant states

- Same brand and store: allowed when entitled.
- Same brand, wrong store: rejected where store-scoped.
- Wrong brand: rejected.
- Missing active store: rejected.
- Client-supplied unrelated package/module: ignored/rejected.
- Super Admin: explicit controlled access.

### Frontend states

- Entitled module appears in menu.
- Non-entitled module is hidden.
- Direct deep link shows blocked state.
- Capability loading failure fails closed.
- Package change refreshes capabilities.

### Ordering/accounting regression states

- POS-only order creates/prints KOT.
- POS-only order never enters KDS UI/API.
- Marketing-disabled order receives no campaign discount.
- Marketing-enabled POS and Website calculate the same promotion.
- Online discount survives POS twin creation.
- Day-close gross, discount, net and cash totals reconcile.
- Existing delivery, rider, KDS identity and business-day tests remain green.

## 14. Files currently central to this plan

### Backend

- `d4u-pos-backend/prisma/schema.prisma`
- `d4u-pos-backend/src/modules/core/subscription/subscription.service.ts`
- `d4u-pos-backend/src/common/guards/subscription.guard.ts`
- `d4u-pos-backend/src/common/guards/permissions.guard.ts`
- `d4u-pos-backend/src/common/utils/tenant.util.ts`
- `d4u-pos-backend/src/modules/business/marketing/*`
- `d4u-pos-backend/src/modules/business/pos-orders/*`
- `d4u-pos-backend/src/modules/business/online-orders/*`
- `d4u-pos-backend/src/modules/business/kots/*`
- `d4u-pos-backend/src/modules/business/kitchen/*`
- `d4u-pos-backend/src/modules/business/cms/*`
- `d4u-pos-backend/src/modules/business/accounting/*`
- `d4u-pos-backend/src/modules/business/rider/*`

### Admin

- `d4u-admin/src/App.tsx`
- `d4u-admin/src/context/PackageContext.tsx`
- `d4u-admin/src/context/AdminContext.tsx`
- `d4u-admin/src/pages/SuperAdmin.tsx`
- `d4u-admin/src/pages/StoreManager.tsx`
- `d4u-admin/src/pages/SetupWizard.tsx`
- `d4u-admin/src/pages/MarketingHub.tsx`
- `d4u-admin/src/pages/CmsManager.tsx`
- `d4u-admin/src/pages/StaffPermissions.tsx`

### Client applications

- `d4u-pos-client/src/App.tsx`
- `d4u-pos-client/src/KitchenDisplay.tsx`
- `d4u-pos-client/src/StitchKDS.tsx`
- `d4u-pos-client/src/pages/TvBoard.tsx`
- `d4u-pos-client/src/TVDisplay.tsx`
- `d4u-rider/src/App.tsx`
- `d4u-website/src/*`

## 15. Current known risks to resolve

1. Global `SubscriptionGuard` checks subscription existence/status but does not universally check requested module entitlement.
2. Marketing capability resolution currently has permissive behavior when package/module is missing.
3. Admin Marketing capability error handling is fail-open.
4. Generic POS permission compatibility includes KDS permissions and must be separated.
5. Website/CMS routes and public fallback identity need strict package and tenant checks.
6. Discount data must remain intact through OnlineOrder -> POS twin and settlement.
7. Accounting currently needs an explicit decision for discount journal treatment.
8. Store-level package and brand-level subscription relationship needs a final commercial rule.
9. Admin navigation is not universally package-driven.
10. No authoritative Normal/Detailed Admin menu-level entitlement was found.
11. Existing `validateTenantAccess` users need a complete active-workspace audit.

## 16. Definition of done for the SaaS entitlement project

The project is ready for commercial package delivery only when all of the following are true:

- A POS-only client can operate POS, KOT printing, Business Day and daily reports.
- The same POS-only client cannot access KDS, Rider, Website, Marketing, CMS, TV or other unpurchased modules through direct API calls or deep links.
- A POS + KDS client can use the complete POS/KOT/KDS flow.
- Marketing campaigns apply only when the MARKETING capability is active.
- Website/CMS features apply only when their capabilities are active.
- Promotion results are identical across POS and Website for the same store/cart.
- Discounts, taxes, delivery fees, loyalty and net totals reconcile in reports and accounting according to the approved policy.
- Brand/store isolation is enforced server-side.
- Subscription expiry and suspension disable paid capabilities according to policy.
- Package changes are audited and capability caches refresh safely.
- All focused, integration and regression tests pass.
- Antigravity independently audits the actual implementation and reports PASS.
- Only then may the approved deployment workflow run.

## 17. Immediate next task

Implement **P0.1 — Central module registry and fail-closed capability resolver** only.

Do not yet change every module controller. First establish and test the authoritative capability contract. After its independent audit PASS, implement P0.2/P0.3 in separate batches.

This sequencing prevents different agents from creating competing package checks and reduces the risk of breaking already-stable POS ordering, KOT, delivery and accounting behavior.

