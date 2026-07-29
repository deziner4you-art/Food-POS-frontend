# Title: D4U Enterprise Migration Blueprint
**Version:** 1.0
**Last Updated:** July 2026
**Purpose:** The authoritative source of truth for migrating the D4U Website, Website CMS, and Marketing Hub toward the Stitch visual language, and for identifying the real backend/API work this requires. Built fresh from direct inspection of the current codebase — not derived from, or reconciled against, any prior gap-analysis document.
**Sources used:** (1) The current D4U Enterprise project — `d4u-pos-backend` module structure inspected directly (`src/modules/business/*`, `src/modules/core/*`); `d4u-website` and `d4u-admin` inspected directly (live `fetch`/`apiFetch` calls, component structure) across this engagement's prior sprints. (2) The Stitch reference project (`C:\Users\dezin\Downloads\d4u-restaurant-erp---website-&-cms`) — all 24 source files read in full. (3) The current backend implementation, verified by directory listing at authoring time, not assumed from memory.
**Explicitly NOT used:** `docs/ENTERPRISE_GAP_ANALYSIS.md`, `docs/D4U_ERP_GAP_ANALYSIS.md`, or any other pre-existing gap report — this document supersedes them for the specific scope of the Website/CMS/Marketing-Hub migration.
**Related documents:** `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` (component/screen mapping), `docs/D4U_STITCH_WEBSITE_CMS_BLUEPRINT.md` (execution sprints, now through Sprint 5), `docs/API_CONTRACT.md` (existing endpoint reference)
**Author:** AI Chief Software Architect
**Status:** DRAFT — architecture only, nothing in this document has been implemented

---

## 0. Ground Truth — Current Backend Module Map

Verified directly against `d4u-pos-backend/src/modules/` at authoring time:

**Core:** `auth`, `stores` (Brand/Store multi-tenancy), `subscription`, `terminal`, `users` (RBAC)
**Business:** `catalog` (Menu/Category Group/Category/Product/Modifier/Availability — includes `category-group.util.ts`, dedicated `availability`/`modifier` controllers), `cms` (single flat module: banners + site settings), `marketing` (`marketing.controller/service.ts` + a *separate* `social.controller/service.ts` for OAuth/social publish), `customers` (includes `loyalty.constants.ts` — a real loyalty/points system already exists), `online-orders`, `pos-orders`, `kots`, `kitchen`, `recipes`, `inventory`, `vendor`, `product-requests`, `tables`, `deal`, `rider`, `business-day`, `cash-flow`, `accounting`, `reports`.

This map is the factual basis for every claim below about what already exists vs. what's genuinely missing.

---

## 1. What Will Be Replaced

**At the architecture level: nothing.** This constraint has held across every sprint of this engagement and continues to hold — no backend module, no auth mechanism, no RBAC model, no multi-tenant scoping, and no existing API contract is being replaced.

**At the visual layer, the following ARE being replaced, deliberately:**

- Every hardcoded, ad-hoc Tailwind color literal (`slate-*`, `gray-*`, `brand-yellow`/`brand-dark`/`brand-pink`, raw hex like `#4edea3`/`#141b2b`/`#ec4899`) currently scattered across `d4u-website` and `d4u-admin` component `className` strings — replaced by the token-driven Design System (`stitch-bg/panel/card/surface/border/ink/muted/accent/accent-hover/accent-deep/accent-ink/success/danger`) built in Sprint 0 and already active via `initStitchTheme()`.
- The Stitch reference project itself is never adopted as a running application — its React tree, mock data, and lack of auth/multi-tenancy are discarded entirely. Only its visual language (palette, spacing, typography, card/badge/button shapes) survives, absorbed into the real D4U components in place.

**Explicitly not replaced, called out because it would be easy to assume otherwise:** the CMS's flat 3-tab structure (Banners/Settings/Modules) is not being replaced with Stitch's more granular per-concern page layout (Hero Slider view / Promotion Hub view / etc. as separate routes) — that's a structural decision addressed in §3, not a wholesale swap.

---

## 2. What Will Be Reused

**100% of the backend**, unmodified:
- `core/auth` (JWT + refresh token session, phone+PIN login, device binding)
- `core/users` (RBAC, permission checks)
- `core/stores` (Brand/Store multi-tenancy)
- `core/subscription` (SaaS package/module gating)
- `business/catalog` in its entirety — the Menu Collection → Category Group → Category → Product hierarchy, bulk-assign endpoints, CSV import/export, sorting/filtering (Sprint 28.8D), audit logging
- `business/cms` (banners, settings)
- `business/marketing` + `business/social` (campaigns, scheduling, multi-channel publish, OAuth linking)
- `business/customers` (customer records + loyalty points/tier — already real, already backed by a database model)
- Every other business module (`online-orders`, `kots`, `kitchen`, `inventory`, `recipes`, `vendor`, `rider`, etc.) — completely out of scope for this migration, untouched

**100% of the existing frontend business logic**, unmodified:
- Cart math (`getSubtotal`/`getDiscountAmount`/`getTax`/`getDeliveryFee`/`getGrandTotal`), coupon application, checkout validation, order placement (`POST /online-orders`) in `d4u-website`
- CSV import/export logic, bulk-assign toolbar logic, audit-log-triggering actions in `d4u-admin`'s `MenuManager.tsx`
- Campaign scheduling, multi-channel publish targeting, social OAuth flow in `MarketingHub.tsx`
- The already-built Design System + Theme Engine (Sprint 0): `stitch-theme.css` (6 themes), `theme-engine.ts` (framework-agnostic core), `useStitchTheme.ts` (React hook), `ThemeSwitcher.tsx` — all four are explicitly designed to be portable to `d4u-pos-client` (POS/KDS) and any future module without modification.

---

## 3. What Will Be Integrated

This is the section that answers "how should Website, Website CMS, and Marketing Hub work together" — some of this integration already exists at the API level (confirmed by direct inspection of live `fetch` calls); some does not yet exist and is a real gap.

### Already integrated (verified, not assumed)
- **CMS Banners → Website Hero**: `d4u-admin/CmsManager.tsx` writes via `POST /cms/banners`; `d4u-website/App.tsx` reads the same `GET /cms/banners` and renders them in the hero slider. Confirmed live end-to-end.
- **Marketing Campaigns → Website Promotions**: `MarketingHub.tsx` creates/schedules campaigns; `d4u-website/App.tsx` reads `GET /marketing/campaign?store_id=&channel=web`, and a `socket.io` `marketing_update` event triggers a live refetch. Confirmed live end-to-end, including realtime push.
- **Menu Builder (`MenuManager.tsx`) → Website Menu**: category/product/hierarchy changes flow through `business/catalog`'s existing endpoints, consumed by the Website via `GET /catalog/category-groups/hierarchy/store/:id?channel=website` and `GET /catalog/products`. Confirmed.
- **SaaS module gating**: `MarketingHub`'s nav visibility already checks `GET /marketing/capabilities?store_id=` — the CMS itself already respects the subscription/package system.

### Not yet integrated — real gaps (confirmed absent by inspection, not inferred)
- **Order confirmation realtime push**: the backend already emits a `socket.io` `order_updated` event (confirmed wired and connected in `d4u-website/App.tsx`'s `useEffect`), but no UI currently subscribes to it for a live "your order just moved to Kitchen Preparing" toast/banner on the Website outside the dedicated Track Order panel. This is a frontend wiring gap, not a backend gap — the event already exists.
- **Customer loyalty/account self-service on the Website**: `business/customers` already has a real database-backed loyalty model (`loyalty.constants.ts` confirms point tiers exist server-side), but `d4u-website` has no login/profile/order-history screen consuming it. Stitch's mockup assumes this (`CustomerAccountPage.tsx`, `UserProfile` type) but it's a **UI + API-exposure gap**, not a from-scratch data-model gap — see §4/§5.
- **CMS ↔ Marketing Hub, shared "publish target" concept**: both modules independently know about `store_id`/`channel`, but there's no single place that shows an operator "here is everything currently live on the Website right now" (banners + active campaigns + menu status) in one view — each is managed and gated separately today. Worth a future consolidated "Website Live Preview" dashboard (see Risk/Recommendation, §4).

---

## 4. Backend Changes Required

Every item below is **additive only** — a new module, new table, or new field. Nothing here modifies an existing module's behavior, schema, or contract.

| # | Change | Why | Owning module (new or existing) |
|---|---|---|---|
| 1 | **SEO settings model** — meta title/description/canonical URL/JSON-LD schema per store | Stitch's `CMSSEOView.tsx` has no current D4U equivalent at all; genuinely net-new | New: extend `business/cms` with an `SeoSettings` sub-resource, or a new `business/seo` module if `cms` shouldn't grow further |
| 2 | **Public "Team/Staff Showcase" model** — name, role, bio, photo, specialty dish, display order, visibility | Distinct from `core/users`' RBAC staff accounts (different concern, different audience — marketing content, not login credentials). Must not be modeled as `User` records. | New: small module or a `cms` sub-resource, e.g. `TeamMember` |
| 3 | **Wishlist / Favorites** — customer ↔ product many-to-many with a timestamp | `business/customers` exists but has no favorites concept today | Extend `business/customers` with a `CustomerFavorite` join table |
| 4 | **Customer-facing authentication** — needs verification: does `core/auth` currently support a customer-role login distinct from staff/admin phone+PIN login? Not confirmed present. | Required before any self-service account page can exist on the Website | Either extend `core/auth` with a customer login path, or confirm and document if one already exists under a role I haven't traced yet — **this must be verified before scoping §5's endpoint, not assumed either way** |
| 5 | **Review/Rating model** — product-level star rating + review count, tied to a completed order | Stitch shows ratings on every product card; D4U's `Product` model (per Sprint 28.8D work) has no such field | Extend `business/catalog`'s `Product`, or a new lightweight `business/reviews` module if review text/moderation is wanted later |

**Not required — explicitly checked and ruled out:**
- No change needed to `business/marketing`'s campaign engine — it already supports everything the Website consumes.
- No change needed to `business/cms`'s banner model — already fit for purpose.
- No change needed to `business/catalog`'s hierarchy, bulk-assign, or CSV logic — Sprint 28.8D already covers the enterprise functionality; this migration only touches its UI.

---

## 5. APIs Required

Additive-only proposals, to be appended to `docs/API_CONTRACT.md` as new sections once approved — **none of these are authorized for implementation by this document.**

| Endpoint (proposed) | Purpose | Depends on backend change # |
|---|---|---|
| `GET /cms/seo/:store_id` | Fetch current SEO meta config for a store | 1 |
| `PUT /cms/seo/:store_id` | Update SEO meta config | 1 |
| `GET /cms/team/:store_id` | Public team/staff bios for the Website's "About" content | 2 |
| `POST /cms/team` / `PATCH /cms/team/:id` / `DELETE /cms/team/:id` | CMS-side management of team member entries | 2 |
| `GET /customers/:id/favorites` | List a customer's saved/favorited products | 3, 4 |
| `POST /customers/:id/favorites` / `DELETE /customers/:id/favorites/:productId` | Add/remove a favorite | 3, 4 |
| `POST /auth/customer-login` (or confirmed equivalent) | Customer self-service login for the Website account page | 4 — **verify existing auth surface first** |
| `GET /customers/:id/orders` | Order history for the self-service account page (may already exist under a different consumer — verify before building) | 4 |
| `GET /catalog/products/:id/reviews`, `POST /catalog/products/:id/reviews` | Read/submit product reviews, if review text (not just a numeric rating) is wanted | 5 |

**No new endpoints required** for: CMS banners, marketing campaigns, catalog hierarchy/products, bulk-assign, CSV import/export, or realtime order updates — all already exist and already work end-to-end (§3).

---

## 6. Explicit Non-Goals (carried forward, still binding)

- Do not rewrite `d4u-pos-backend`.
- Do not create a second CMS system — extend the existing `business/cms` module and `d4u-admin` pages.
- Do not replace authentication, RBAC, or multi-tenant scoping anywhere.
- Do not replace any existing, working API contract.
- Every "backend change required" in §4 is a proposal requiring separate, explicit approval before any schema migration or endpoint is written — this document authorizes analysis only.

---

**End of document. No implementation has been performed. This is the source of truth for scoping future, separately-approved migration sprints — it does not itself authorize any of them to begin.**
