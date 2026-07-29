# API Contract — Backend Endpoints (Claude)

Owner: Claude (backend). Started in Sprint 28 covering Kitchen/KDS (`/kitchen/*`); extended in Sprint 28.7 to cover Menu Builder Category Groups (`/catalog/category-groups/*`); extended in Sprint 28.9 with multi-tenant context fixes to `/auth/login` and `/rider-orders`; extended in Sprint 28.8D with bulk assignment, enriched list, and CSV endpoints under `/catalog/*`. Existing endpoints elsewhere in the API (`/kots`, `/inventory`, `/auth`, `/online-orders`, etc.) are pre-existing and out of scope for this file except where noted under each section's "External Dependencies".

**Last verified:** 2026-07-29 (Sprint 28.8D — Menu Builder Enterprise Management; see Section 4).

---

# Section 4 — Menu Builder: Enterprise Management (Sprint 28.8D)

Extends the existing `/catalog/*` endpoints (`src/modules/business/catalog/catalog.{service,controller}.ts`) — no new controller, no new base route. Everything here is additive; every pre-28.8D `/catalog/*` call still works with its previous parameters unchanged.

## Bulk Assignment

| Endpoint | Method | Body | Response | Permission | Errors |
|---|---|---|---|---|---|
| `/catalog/categories/bulk-assign-group` | POST | `{category_ids: number[], category_group_id: number \| null, updated_by?}` | `{success, updated, category_group_id}` | `catalog.update` | 400 if the group or any category id doesn't exist (names the missing ones) |
| `/catalog/products/bulk-assign-category` | POST | `{product_ids: number[], category_id: number, updated_by?}` | `{success, category_id, assigned_count}` | `catalog.update` | 400 if the category or any product id doesn't exist |

Both run inside a single DB transaction (validate-then-write; nothing is written if validation fails) and write a `SystemAuditLog` row (`BULK_CATEGORY_GROUP_ASSIGNED` / `BULK_PRODUCT_CATEGORY_ASSIGNED`). The product bulk-assign **adds** the category to each product (a raw bulk `INSERT ... ON CONFLICT DO NOTHING` into the `_ProductCategories` join table, one round trip) — it does not remove a product's other existing categories.

## Product List — `GET /catalog/products`

Query params (all optional, all combinable): `store_id, category_id, category_group_id, menu_id, status, search, sort_by, sort_dir`. `search` matches name/sku/barcode (case-insensitive). `sort_by` ∈ `name, price, cost, margin_pct, status, sku, createdAt, updatedAt` (default `createdAt`); invalid values 400.

Every row includes (in addition to the pre-existing full relation objects — `categories[]`, `assigned_stores[]`, `variants[]`, `recipe`, `availabilityRule`, `modifierGroups[]`, `kitchenStation` — all unchanged):

| Field | Source |
|---|---|
| `category_id` / `category_name` | First linked Category's id/name (a product can have several; this is the flat "primary" column for table display) |
| `category_group_id` / `category_group_name` | That category's Category Group, if any |
| `menu_collection_id` / `menu_collection_name` | That category's Menu |
| `modifier_group_names` | `string[]`, from `modifierGroups[]` |
| `recipe_name` | From `recipe`, if linked |
| `kitchen_station_name` | `kitchenStation.name` if `kitchen_station_id` is set, else the legacy `kitchen_station` free-text column |
| `availability_rule_name` | From `availabilityRule`, if linked |
| `updatedAt` | New column (Product never had one before this sprint) |

## Category List — `GET /catalog/categories`

Query params: `store_id, menu_id, category_group_id, sort_by, sort_dir` (all optional). `sort_by` ∈ `name, sort_order, is_active, id` (default `name`).

Each row includes the existing `menu`, `assigned_stores`, `categoryGroup` relations plus a new `product_count: number` (via Prisma `_count`, no extra query).

## Category Groups / Modifier Groups / Availability Rules / Menu Collections — sorting

All four now accept `?sort_by=&sort_dir=asc|desc` on their existing list endpoints:

| Endpoint | Allowed `sort_by` | Default |
|---|---|---|
| `GET /catalog/category-groups` | `name, sort_order, createdAt, updatedAt` | `sort_order` |
| `GET /catalog/modifiers/groups` | `name, id` | `name` |
| `GET /catalog/availability-rules` | `name, type, id` | `name` |
| `GET /catalog/menus` | `name, createdAt, id` | `name` |

An unrecognized `sort_by` or `sort_dir` value 400s (via the shared `resolveOrderBy` helper) rather than silently sorting wrong.

## CSV Export — `GET /catalog/products/export?store_id=` (store_id optional)

Columns, in order: `product_name, sku, barcode, menu_collection, category_group, category, modifier_groups, recipe, kitchen_station, printer_group, kds_group, availability_rule, price, cost, margin, tax, status, description, image_url`. Multi-valued cells (`category`, `modifier_groups`) are `;`-joined, matching the pre-existing convention. Writes a `PRODUCTS_CSV_EXPORTED` audit row.

## CSV Import — `POST /catalog/products/import?store_id=` (unchanged route/params)

**Behavior change from pre-28.8D:** every referenced Category, Category Group, Modifier Group, Availability Rule, Recipe, and Kitchen Station must already exist (matched by exact name, scoped to the store) — a row referencing one that doesn't exist returns a validation error for that row (`results[].action: 'error'`) and creates nothing. **No master data is ever auto-created.** This replaces the old behavior, where a missing Category was silently created. `Printer Group`/`KDS Group` have no master-data table (free-text columns) so they're passed through as-is with no existence check. If both `category_group` and `category` are given, the resolved category must actually belong to that group, or the row errors.

Old pre-28.8D export headers (`name`, `margin_pct`, `tax_rate`) are still accepted as aliases for `product_name`, `margin`, `tax` — a CSV exported before this sprint still imports unchanged. `is_active` (legacy boolean toggle, update-only) and `status` (new `PENDING`/`APPROVED` enum, create or update) are independent columns — neither is inferred from the other. Writes a `PRODUCTS_CSV_IMPORTED` audit row with `{total, created, updated, errors}`.

---

# Section 3 — Auth & Rider: Multi-Tenant Context (Sprint 28.9)

## `POST /auth/login` — response shape change (additive, backward compatible)

The `user` object in the login response now also includes resolved `store`/`brand` records (not just their numeric ids), so any client can display the actual branch/brand name without a follow-up call:

```
user: {
  id, name, phone, role, role_id,
  brand_id: number,   // unchanged
  store_id: number,   // unchanged
  store: { id: number, name: string } | null,   // NEW — the active workspace's real Store row
  brand: { id: number, name: string } | null,   // NEW — the active workspace's real Brand row
  module_permissions,
}
```

`store`/`brand` are resolved from `active_store_id`/`active_brand_id` (the same ids embedded in the JWT), not from the user's raw `store_id`/`brand_id` columns — correct even for a multi-assignment user who has switched workspace. `null` only if the user has no store/brand at all (e.g. a brand-level Head Office account with no store).

## `GET /rider-orders?store_id=X` — `store_id` is now required

Previously optional — omitting it returned every store's delivery orders platform-wide (cross-tenant leak). Now 400s if omitted. Also fixed: the POS-order filter now matches `order_source` case-insensitively (the POS UI saves `"Delivery"`, not `"DELIVERY"`), so POS-originated delivery orders actually appear in the list now (they matched zero rows before).

## Realtime: `join_store` and `order_updated` (no contract change, bug fix only)

`AppGateway`'s `join_store` socket handler now accepts `{store_id: X}`, a bare numeric string (`"67"`), or a full room-name string (`"store_67"`) — previously only the object shape worked, silently breaking any client (`d4u-rider`) that sent a different shape. `KotsService.updateKotStatus` now also broadcasts `order_updated` (room-scoped to `store_${store_id}`, shaped via `formatPosOrderForRider` — identical to what `RiderService.getRiderOrders` returns for POS orders) whenever a delivery-sourced order's KOT reaches `READY` — previously only `kds_update` was broadcast, an event no rider-facing client listens for.

---

# Section 1 — Kitchen / KDS Backend (`/kitchen/*`)

All endpoints are prefixed with the backend's base URL (`http://localhost:3001` in dev). All require a `Authorization: Bearer <token>` header unless noted, per the standard `JwtAuthGuard` + `RequirePermissions` pattern used across the codebase. Under the codebase's current RBAC phase, any request bearing a valid JWT with a `sub` claim passes permission checks regardless of the specific permission string (see `PermissionsGuard`) — the permissions below are what's *declared*, for when stricter enforcement is turned on.

---

## Chef Authentication (`/kitchen/chef-auth`)

PIN-pairing session, mirrors the existing Waiter Terminal pattern (`/terminal/*`). Not a full User/JWT login — no `User` row backs a chef PIN.

| Endpoint | Method | Body | Response | Permission | Errors |
|---|---|---|---|---|---|
| `/kitchen/chef-auth/generate` | POST | `{store_id: number, chef_name: string, kitchen_station_id?: number}` | `{success: true, pin: string, session_id: number}` | `kitchen.sessions.create` | 400 validation |
| `/kitchen/chef-auth/login` | POST | `{pin: string, device_id?: string, device_name?: string}` | `{success, session_id, store_id, chef_name, device_name, kitchen_station_id, access_token}` on success; `{success: false, message}` on invalid/expired PIN | `kitchen.sessions.create` | Returns `success:false` (200), not an HTTP error, for a bad PIN |
| `/kitchen/chef-auth/resume` | POST | `{session_id: number, device_id: string}` | Same shape as login | `kitchen.sessions.create` | 403 if `device_id` doesn't match the session's paired device |
| `/kitchen/chef-auth/heartbeat` | POST | `{session_id: number}` | `{success: true}` | `kitchen.sessions.create` | — |
| `/kitchen/chef-auth/sessions?store_id=X` | GET | — | Array of `ChefSession` rows (+`station`) | `kitchen.sessions.read` | — |
| `/kitchen/chef-auth/sessions/:id/disconnect` | POST | — | `{success, session}` | `kitchen.sessions.manage` | — |
| `/kitchen/chef-auth/sessions/disconnect-all?store_id=X` | POST | — | `{success, count, sessions}` | `kitchen.sessions.manage` | — |
| `/kitchen/chef-auth/sessions/:id/reconnect` | POST | — | `{success, session}` | `kitchen.sessions.create` | — |
| `/kitchen/chef-auth/sessions/:id/logout` | POST | — | `{success, session}` | `kitchen.sessions.manage` | — |

`access_token` is a 12h-expiry JWT: `{sub: "chef-session-<id>", role: "Chef", store_id, active_store_id, chef_session_id, kitchen_station_id}`.

---

## Kitchen Tickets / Dashboard (`/kitchen`)

Operates on the existing `KOT` model — additive, parallel surface to the pre-existing `/kots/*` module (unchanged, still fully functional).

| Endpoint | Method | Body | Response | Permission | Errors |
|---|---|---|---|---|---|
| `/kitchen/tickets?store_id=X&kitchen_station_id=Y` | GET | — | Array of active `KOT` rows (+`order`); `kitchen_station_id` filters to tickets containing at least one item tagged with that station | `kitchen.tickets.read` | — |
| `/kitchen/tickets/:id/accept` | POST | `{user_id?: number}` | Updated `KOT` | `kitchen.tickets.bump` | 400 if ticket not found |
| `/kitchen/tickets/:id/bump` | POST | `{user_id?: number}` | Updated `KOT` (`status: READY`) | `kitchen.tickets.bump` | 400 if not found or already `CANCELLED` |
| `/kitchen/tickets/:id/recall` | POST | `{user_id?: number}` | Updated `KOT` (`status: PREPARING`) | `kitchen.tickets.recall` | 400 if not found or not currently `READY` |
| `/kitchen/dashboard?store_id=X` | GET | — | `{store_id, queue:{new, preparing, total_active}, readyTodayCount, avgPrepTimeMins, oldestActiveTicket, stations, generatedAt}` | `kitchen.dashboard.read` | — |

Every bump/recall/accept also writes a `SystemAuditLog` row and broadcasts a room-scoped (`store_${store_id}`) Socket.IO event: `kitchen_ticket_bumped`, `kitchen_ticket_recalled`, `kitchen_ticket_accepted`.

---

## Kitchen Stations (`/kitchen/stations`)

| Endpoint | Method | Body | Response | Permission | Errors |
|---|---|---|---|---|---|
| `/kitchen/stations?store_id=X` | GET | — | Array of `KitchenStation` rows | `kitchen.stations.read` | — |
| `/kitchen/stations/:id/products` | GET | — | Array of `Product` rows assigned to that station | `kitchen.stations.read` | — |
| `/kitchen/stations` | POST | `{store_id, name, sort_order?}` | Created `KitchenStation` | `kitchen.stations.manage` | 400 if a station with that name already exists for the store |
| `/kitchen/stations/:id` | PATCH | `{name?, is_active?, sort_order?}` | Updated `KitchenStation` | `kitchen.stations.manage` | — |
| `/kitchen/stations/:id` | DELETE | — | `{success, deactivated, station}` — deactivates instead of deleting if any products are still assigned | `kitchen.stations.manage` | — |
| `/kitchen/stations/assign-product` | POST | `{product_id, kitchen_station_id?}` — omit/null to unassign | Updated `Product` | `kitchen.stations.manage` | — |

Broadcasts `kitchen_stations_updated` (room-scoped) on create/update/delete.

---

## Inventory Lock / Manager Unlock (`/kitchen/inventory-locks`)

| Endpoint | Method | Body | Response | Permission | Errors |
|---|---|---|---|---|---|
| `/kitchen/inventory-locks?store_id=X` | GET | — | Array of active `InventoryLock` rows (+`inventory`) | `kitchen.inventory_locks.read` | — |
| `/kitchen/inventory-locks/:inventory_id/status` | GET | — | `{locked: boolean}` | `kitchen.inventory_locks.read` | — |
| `/kitchen/inventory-locks` | POST | `{store_id, inventory_id, kot_id?, reason?, locked_by?}` | Created `InventoryLock` | `kitchen.inventory_locks.create` | 400 if item is already locked |
| `/kitchen/inventory-locks/:id/unlock` | POST | `{manager_pin: string, approved_by: number}` | Updated `InventoryLock` (`is_active: false`) | `kitchen.inventory_locks.unlock` | **403** if `approved_by` isn't a real user or the PIN doesn't match (mirrors `PosOrdersService.voidOrder`'s manager-PIN check exactly — bcrypt-compared against that manager's own `hashedPin`); 400 if lock not found/already released |

While locked, `RecipeAvailabilityService` treats the ingredient as zero stock regardless of its real `quantity`.

---

## Stock Requests (`/kitchen/stock-requests`)

**Confirmed live in production use** — `StitchKDS.tsx`'s `handleStockRequest` calls this exact endpoint (`POST /kitchen/stock-requests` via `apiFetch(..., {auth: true})`) with body `{store_id, inventory_id, requested_qty, unit, reason}`, matching the DTO field-for-field.

| Endpoint | Method | Body | Response | Permission | Errors |
|---|---|---|---|---|---|
| `/kitchen/stock-requests` | POST | `{store_id, inventory_id, requested_qty, unit, kitchen_station_id?, chef_session_id?, requested_by_name?, reason?}` | Created `StockRequest` | `kitchen.stock_requests.create` | 400 if inventory item not found |
| `/kitchen/stock-requests?store_id=X&status=Y` | GET | — | Array of `StockRequest` rows (+`inventory`, `station`) | `kitchen.stock_requests.read` | — |
| `/kitchen/stock-requests/:id/resolve` | POST | `{status: 'APPROVED'\|'FULFILLED'\|'REJECTED', approved_by: number, fulfilled_qty?: number}` | Updated `StockRequest` | `kitchen.stock_requests.approve` | 400 if already `FULFILLED`/`REJECTED` |

Resolving a request does **not** itself move stock — that stays a separate, manual `InventoryItem` adjustment via the existing `inventory.service.ts`, so there's exactly one place stock quantities actually change.

---

## Recipe Availability (`/kitchen/availability`)

| Endpoint | Method | Response | Permission |
|---|---|---|---|
| `/kitchen/availability/product/:id` | GET | `{product_id, product_name, available, maxUnits, limitingIngredient}` | `recipe.recipes.read` |
| `/kitchen/availability/store?store_id=X` | GET | Array of the above, one per recipe-backed active product | `recipe.recipes.read` |
| `/kitchen/availability/unavailable?store_id=X` | GET | Same array, filtered to `available: false` only | `recipe.recipes.read` |

`maxUnits: null` means the product has no recipe attached (stock isn't tracked for it — always available). A locked ingredient (see above) always yields `maxUnits: 0`.

---

## Kitchen: External Dependencies (pre-existing, not part of this module, verified compatible)

The KDS frontend (`StitchKDS.tsx`) also depends on these already-existing endpoints, confirmed working end-to-end against the current backend during Sprint 28.5 integration verification:

| Endpoint | Method | Used for |
|---|---|---|
| `POST /auth/login` | POST | Admin-unlock PIN gate inside the KDS screen (reuses the generic staff login, checks `data.user.role` client-side) |
| `GET /kots?store_id=X` | GET | Main ticket board sync |
| `PATCH /kots/:id/status` | PATCH | Accept (`PREPARING`) / bump (`READY`) |
| `GET /inventory/items/:store_id` | GET | Ingredient stock sync |
| `PATCH /online-orders/:id` | PATCH | Fire-and-forget bridge update for online-order-originated tickets (`kdsStatus`, `prepTimeMinutes`, `estimatedReadyAt`) |
| Socket.IO `kds_update` | — | Triggers a full `syncKOTs()` re-fetch |

No changes were needed to any of these — all confirmed returning `200`/expected shapes with a real Bearer token during live verification.

---

# Section 2 — Menu Builder: Category Groups (`/catalog/category-groups/*`)

Sprint 28.7. Extends the existing Menu Builder hierarchy: **Menu Collection → Category Group → Category → Product**. Products never link directly to a Category Group — only through a Category. Lives in the same `catalog` module as the pre-existing Menu/Category/Product endpoints (`src/modules/business/catalog/`); those endpoints (`/catalog/menus`, `/catalog/categories`, `/catalog/products`, `/catalog/sync/:store_id`) are unchanged and still fully backward compatible.

**Category Groups are OPTIONAL** (business requirement change, Hotfix following Sprint 28.9): `Category.category_group_id` is nullable. A restaurant may run **Menu → Categories → Products** with zero groups. No group is ever auto-created — a category created/imported with no `category_group_id` is simply ungrouped, permanently. There is no "Default Group" concept anymore; if you see one in older data or docs, it's historical and should not be recreated (the runtime logic that ever created one has been deleted).

**Request/response shape note:** the already-shipped admin UI (`d4u-admin/src/pages/MenuManager.tsx`, built by Antigravity/Gemini concurrently with this backend sprint) sends/expects channel visibility as a **nested** object, not flat fields — `channel_visibility: { pos, website, waiter, qr, kiosk, delivery, takeaway }`. The database stores flat `visible_pos` / `visible_website` / `visible_waiter` / `visible_qr_menu` / `visible_kiosk` / `visible_delivery` / `visible_takeaway` boolean columns (used directly in `getStoreHierarchy`'s Prisma filters), but every endpoint below accepts **either** shape on write and always returns **both** (flat columns + a computed `channel_visibility` object) on read. Every response also includes a plain `store_ids: number[]` array alongside the full `assigned_stores` relation array, since the admin UI reads a group straight into its edit form (`{...g}`) and expects `store_ids` as a flat array there.

| Endpoint | Method | Body | Response | Permission | Errors |
|---|---|---|---|---|---|
| `/catalog/category-groups?store_id=X` or `?menu_id=X` | GET | — | Array of `CategoryGroup` (soft-deleted excluded unless `?include_deleted=true`) | `catalog.category_group.view` | — |
| `/catalog/category-groups/:id` | GET | — | `CategoryGroup` + `categories` (+ each category's `products`) | `catalog.category_group.view` | 404 |
| `/catalog/category-groups` | POST | `{name, menu_id?, store_id?, description?, sort_order?, icon?, color?, image_url?, is_active?, store_ids?, channel_visibility?, visible_*?, created_by?}` — one of `menu_id`/`store_id` required | Created `CategoryGroup` | `catalog.category_group.create` | 400 if neither `menu_id` nor `store_id` resolves to a Menu |
| `/catalog/category-groups/:id` | PATCH | Any subset of the create fields | Updated `CategoryGroup` | `catalog.category_group.update` | 404 |
| `/catalog/category-groups/reorder` | POST | `{items: [{id, sort_order}], updated_by?}` | Array of updated `CategoryGroup` | `catalog.category_group.update` | — |
| `/catalog/category-groups/:id/branches` | POST | `{store_ids: number[], updated_by?}` | Updated `CategoryGroup` | `catalog.category_group.update` | 404 |
| `/catalog/category-groups/:id/channels` | POST | `{visible_pos?, visible_website?, visible_waiter?, visible_qr_menu?, visible_kiosk?, visible_delivery?, visible_takeaway?, updated_by?}` (flat — dedicated convenience endpoint; the main POST/PATCH above also accepts the nested `channel_visibility` shape) | Updated `CategoryGroup` | `catalog.category_group.update` | 404 |
| `/catalog/category-groups/:id` | DELETE | — | Soft-deleted `CategoryGroup` (`deleted_at` set). **Never blocks or deletes categories** — any category still in the group becomes ungrouped (`category_group_id: null`) directly; no fallback group is created to hold them (matches the admin UI's own confirm-dialog text: "Categories inside will NOT be deleted, but unassigned") | `catalog.category_group.delete` | 404 |
| `/catalog/category-groups/:id/restore` | POST | — | Restored `CategoryGroup` (`deleted_at: null`) | `catalog.category_group.restore` | 404 |
| `/catalog/category-groups/hierarchy/menu/:menu_id` | GET | — | `Menu` + nested `categoryGroups[].categories[].products[]` (soft-deleted groups excluded; includes system-default groups — this admin-facing endpoint is unchanged by Sprint 28.8A) | `catalog.view` | 404 |
| `/catalog/category-groups/hierarchy/store/:store_id` | GET | See "Navigation Contract" below (Sprint 28.8A) | See below | **Public** (mirrors `/catalog/sync/:store_id`) | 404 if store not found; 400 on an unknown `channel`/`tab` value or an unresolvable `category_group_id` |

Every create/update/delete/restore/reorder/branch-assignment/channel-assignment call writes a `SystemAuditLog` row (`entity: 'CategoryGroup'`).

Every `CategoryGroup` in every response above still includes `is_system_default: boolean` for backward compatibility, but nothing ever sets it `true` anymore (the runtime logic that created such groups was deleted in the Hotfix following Sprint 28.9 — see that entry in `CHANGELOG_AI.md`). Treat it as always `false` going forward; it's kept only in case a stray historical row exists in another environment.

### Navigation Contract (Sprint 28.8A) — `GET /catalog/category-groups/hierarchy/store/:store_id`

Ordering: **System Tabs → Category Groups → Categories → Products**, falling back to **System Tabs → Categories → Products** when a store has no user-created groups yet.

- `system_tabs` — always exactly `[{key:'all_items',label:'All Items'},{key:'discounted',label:'Discounted'}]`. Fixed, hardcoded, never persisted as data. **"All Groups" is deliberately never included** — that's a pre-existing client-side-only "no filter selected" UI sentinel (`d4u-pos-client/src/App.tsx`'s `activeCategoryGroupId === null` state), not something the backend returns.
- `category_groups` — real, user-created groups, each with nested `categories[].products[]`.
- `categories` (top-level, sibling to `category_groups`) — the flat list of ungrouped categories (`category_group_id: null` — the normal state for a restaurant not using groups, and where a category lands after its group is deleted). Always present (empty array if none).

Query params (mutually exclusive with each other, all combinable with `?channel=`):

| Param | Behavior |
|---|---|
| *(none)* | Full contract above: `system_tabs` + `category_groups[]` + flat `categories[]` |
| `?tab=all_items` | "Return all categories" — `{system_tabs, tab, categories: [...every category, real-grouped + flat, flattened]}` |
| `?tab=discounted` | "Return discounted products across all categories" — `{system_tabs, tab, products: [...deduped]}`, computed via `PricingService.hasActivePromotion` (same active-campaign logic POS pricing uses — PERCENTAGE/FLAT/BOGO/BUNDLE/COMBO/FREE_GIFT, not reimplemented) |
| `?category_group_id=X` | "Return only categories belonging to that group" — `{system_tabs, category_group_id, category_group: {id,name,icon,color}, categories: [...]}` |
| `?channel=pos\|website\|waiter\|qr\|kiosk\|delivery\|takeaway` | Narrows `category_groups`/system-default lookup to that channel's visibility flag |

**Existing endpoints extended (additive, backward compatible):**

| Endpoint | Change |
|---|---|
| `POST /catalog/categories` | Accepts optional `category_group_id`. If omitted, auto-resolves to the target Menu's Default Group (creating the Menu too if the store's brand has none yet — same fallback the CSV-import "Unassigned category" fix already used) |
| `PATCH /catalog/categories/:id` | Accepts optional `category_group_id` |
| `GET /catalog/categories` | Each row now also includes the full `categoryGroup` relation object |
| `POST /catalog/menus/:id/duplicate` | Now clones Category Groups too (preserving hierarchy), not just Categories/Products |
| `DELETE /catalog/menus/:id` | Now also deletes the menu's Category Groups (after Categories, before the Menu itself) — `Category.category_group_id` is a required FK, so this ordering is mandatory for the delete to succeed |

**Known gap:** the 5 RBAC permission strings (`catalog.category_group.view/create/update/delete/restore`) are 2-segment, not the `group.resource.action` 3-segment shape used by every other module (`kitchen.tickets.read`, `inventory.categories.manage`, etc.) — this matches the exact literal permission names given in the Sprint 28.7 brief. Internally, `seed-rbac.ts` still seeds them into the Permission table under a 3-segment bookkeeping key (`catalog.category_group.view`, group=`catalog`, resource=`category_group`, action=`view`) for the RBAC admin UI to list/assign — same category="declared but not yet strictly enforced" state as the rest of the RBAC system (`PermissionsGuard` currently allows any authenticated request through regardless of the declared permission string). Also: because the action is `view` not `read`, the `Read Only` role's auto-assignment rule (`.endsWith('.read')`) does **not** pick these up — a one-line fix if that's ever desired.
