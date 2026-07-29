# Title: D4U Stitch UI Master Blueprint
**Version:** 1.0
**Last Updated:** July 2026
**Purpose:** The official architecture and migration reference for adopting the "Stitch" visual design system into the live D4U Website and Admin CMS frontends, without disturbing backend, auth, RBAC, multi-tenancy, or existing API contracts.
**Dependencies:** `docs/D4U_MASTER_ARCHITECTURE_BLUEPRINT.md`, `docs/API_CONTRACT.md`, `docs/FRONTEND_BACKEND_MAPPING.md`
**Related Documents:** `docs/AI_TEAM_PROGRESS.md`, `docs/CHANGELOG_AI.md`
**Author:** AI Chief Software Architect
**Status:** DRAFT — architecture only, no implementation has started

---

## 1. Executive Summary

"Stitch" (`C:\Users\dezin\Downloads\d4u-restaurant-erp---website-&-cms`) is an AI-Studio-generated, standalone React 19 prototype representing the *intended future visual identity* of the D4U customer website and website-CMS. It is a static, mock-data-only design reference — zero API calls, zero authentication, zero multi-tenancy, string-keyed entities. It was never meant to run in production and must never be treated as a replacement application.

This document is the single source of truth for how the D4U engineering team (human or AI agent) is to fold Stitch's visual language into the real, already-functioning D4U frontends (`d4u-website`, `d4u-admin`) — as a **reskin performed in place**, section by section, inside the existing component tree, never as a wholesale file swap and never by introducing a second routing/state/auth system alongside the one that already exists.

**Guiding rule for the entire migration:** if a Stitch file and its real D4U counterpart disagree on *behavior* (data shape, state management, routing, auth), the real D4U file wins. If they disagree on *appearance* (color, spacing, typography, layout composition), Stitch wins. Nothing in this document authorizes touching backend code, the Prisma schema, authentication, RBAC, or multi-tenant logic.

---

## 2. Scope & Non-Goals

### In scope
- Visual/design-token adoption (color palette, typography, spacing, card/button/badge patterns, motion).
- Reskinning existing page sections in `d4u-website` and `d4u-admin` to match Stitch's layouts.
- Identifying genuinely net-new UI surface (e.g. SEO settings) that has no current D4U equivalent, for separate, explicitly-scoped future work.
- Producing a durable mapping between every Stitch screen and its real D4U counterpart (or "no counterpart — net new") so future implementation sprints have a checklist to work against.

### Explicit non-goals (hard constraints, carried over verbatim from the originating task brief)
- **DO NOT** rewrite the backend (`d4u-pos-backend`).
- **DO NOT** create a new CMS. `d4u-admin`'s existing CMS (`CmsManager.tsx`, `MarketingHub.tsx`, `MenuManager.tsx`, etc.) is the CMS. Stitch's `CMSLayout.tsx` and its mock-data CRUD screens are a *visual reference only*, never a second implementation.
- **DO NOT** replace authentication. `d4u-admin`'s JWT + refresh-token session (`utils/session.ts`), `d4u-pos-client`'s chef/staff auth, and `d4u-website`'s branch-context model all stay exactly as they are.
- **DO NOT** replace RBAC. `RequirePermissions`-gated backend routes and `d4u-admin`'s permission-gated nav items are untouched.
- **DO NOT** replace Multi-Tenant. `store_id`/`brand_id`/branch-context plumbing throughout `AdminContext`, the backend, and `d4u-website`'s `BranchSelectorModal` stays as-is.
- **DO NOT** replace APIs. Every endpoint in `docs/API_CONTRACT.md` remains the contract. Stitch introduces zero new confirmed endpoints (see §7).
- **DO NOT** implement anything as part of producing this document. This blueprint is architecture-only; a future, separately-approved sprint executes it.

---

## 3. Source Projects Inventory

### 3.1 Stitch (reference/design source — read-only, external to this repo)
- Location: `C:\Users\dezin\Downloads\d4u-restaurant-erp---website-&-cms`
- Stack: React 19, Vite 6, Tailwind v4 (`@tailwindcss/vite`), `lucide-react`, `motion`, `recharts`, `@google/genai` (vestigial, unused), `express` (present in devDependencies/scripts, purpose unconfirmed, likely AI-Studio scaffold artifact — not investigated further as it has no bearing on the migration).
- Routing: none — `App.tsx` holds `appMode: 'website' | 'cms'` and `activePage` in local `useState`.
- Data: 100% local mock data (`src/data/mockData.ts`), string-keyed entities (`types.ts`), zero `fetch()` calls anywhere in the codebase.
- 24 source files total (~6,760 lines): `App.tsx`, `types.ts`, `data/mockData.ts`, 8 shared components, 6 public-website pages, 8 CMS pages. Full inventory in Appendix A.

### 3.2 D4U Website — `d4u-website/` (live, production-connected)
- Routing: none — `App.tsx` holds `viewMode: 'landing' | 'kiosk' | 'mobile'` (derived from `window.innerWidth`) plus a hard-gating `BranchSelectorModal` shown until a store is chosen.
- Already live-wired to the real backend: `GET /stores`, `GET /catalog/category-groups/hierarchy/store/:id?channel=website`, `GET /cms/banners`, `GET /cms/settings/:id`, `GET /marketing/campaign?store_id=&channel=web`, plus a `socket.io` connection (`join_store`, `marketing_update`, and an already-wired-but-currently-unconsumed `order_updated` event).
- Files: `App.tsx`, `components/StitchLanding.tsx` (desktop), `components/KioskMode.tsx`, `components/MobileMode.tsx`, `components/BranchSelectorModal.tsx`, `types.ts`, `data/foodItems.ts`, `utils/alerts.tsx`.
- Known pre-existing defect (independent of this migration, documented here because the migration will make it load-bearing — see §9): `types.ts`'s `FoodItem.category` is typed as a hardcoded 5-value literal union (`'Burgers'|'Pizzas'|'Sides'|'Drinks'|'Desserts'`) that does not reflect real branch category data; the runtime assignment (`category: p.__catName`) already silently violates this type. `KioskMode.tsx` and `MobileMode.tsx` additionally hardcode the same 5-category list as literal UI copy rather than deriving it from live data.

### 3.3 D4U Admin — `d4u-admin/` (live, production-connected)
- Routing: `react-router-dom` (`BrowserRouter basename="/admin"`), real JWT login (`POST /auth/login`, phone+PIN, access + refresh token, `x-device-id` device binding, proactive 45-minute silent refresh).
- Multi-tenant context: `AdminContext` (branches, brands, `selectedBranchId`, `isBranchEntered`), RBAC-gated `navItems` array, SaaS package/module gating (e.g. Marketing Hub nav item disappears entirely if the branch's package excludes it).
- Centralized API client: `utils/api.ts` (`apiFetch`, auth headers, 401/403/500 global handling via `d4u:apierror` custom events + `GlobalErrorToast`).
- Pages relevant to this migration: `CmsManager.tsx` (Banners/Settings/Modules tabs), `MarketingHub.tsx` (campaigns, scheduling, social publish), `MenuManager.tsx` (Sprint 28.8D enterprise DataTable: bulk category/group assignment, CSV import/export, hierarchy filters, sorting), `StaffPermissions.tsx` (RBAC user/role management — not a marketing "meet the team" page), `Dashboard.tsx` / `HQOverview.tsx` (live analytics).

### 3.4 D4U POS Client — `d4u-pos-client/`
Out of scope for this document. Stitch has no POS/KDS/Waiter/TV equivalents; nothing in Stitch maps onto this app.

---

## 4. Architecture Principles for This Migration

1. **Reskin in place, never replace the shell.** Every Stitch page becomes new JSX/className content *inside* the existing file that already owns that screen's real data and behavior. No new top-level app, no new router, no new state architecture is introduced anywhere.
2. **Behavior beats appearance.** When a Stitch mock-CRUD screen (e.g. `CMSMenuManagerView.tsx`) is structurally simpler than its real counterpart, only the *visual* patterns (card layout, spacing, color, iconography) are extracted — the simpler mock logic is never allowed to regress real functionality (bulk actions, CSV, pagination, RBAC, audit logging).
3. **One design system, two consumers.** Design tokens are extracted once and applied to both `d4u-website` and `d4u-admin`, since both already use Tailwind v4's CSS-native `@theme` mechanism (no `tailwind.config.js` in either project) — the same mechanism Stitch itself uses, which makes token porting mechanically simple.
4. **No net-new backend surface without a named owner.** Any Stitch screen with no real API to back it (SEO, public staff bios, wishlist/favorites, customer self-service account) is called out explicitly in §7/§9 and is out of scope until separately scoped and approved — it is never silently built against fabricated client-side state.
5. **Realtime stays realtime.** Any Stitch UI that fakes live behavior client-side (e.g. `OrderTrackerModal.tsx`'s `setTimeout`-driven status simulation) must be re-wired to the real, already-connected `socket.io` events before it can ship — never shipped as-is against a fake timer.
6. **Additive only.** Nothing in `docs/API_CONTRACT.md` changes as a result of this migration. If a future phase requires a new endpoint (SEO, wishlist, order placement confirmation, etc.), it is proposed as a new, additive section of that document through the normal sprint process — not assumed here.

---

## 5. Design System Extraction (Stitch → D4U tokens)

| Token category | Stitch value | Action |
|---|---|---|
| Base background | `#0C0C0E` (page), `#121215` (panels), `#16130B` (warm card surface), `#1A1A1D` (inputs/inner surfaces) | Port as new Tailwind `@theme` color tokens in both `d4u-website` and `d4u-admin` |
| Accent (gold) | `#D4AF37`, hover `#ffe088`, deep `#8C6D1F` | Port as `--color-brand-gold` (or equivalent); do not overwrite existing `brand-yellow` token — coexist or formally deprecate, decision required (see §10) |
| Semantic colors | emerald (success/in-stock), rose (destructive/sold-out), amber (discount) | Already standard Tailwind palette — no new tokens needed, just consistent usage |
| Effects | `gold-glow` / `gold-glow-hover` utility classes (box-shadow glow), `glass-panel` (header blur) | Port as reusable utility classes |
| Typography | `font-display` (headings) vs `font-sans` (body) — two-font system | Confirm which font family Stitch's `font-display` resolves to (not yet inspected — index.css not read in this pass) before porting |
| Shape language | Large radii (`rounded-2xl`/`rounded-3xl`), pill-shaped nav/buttons | Port as the default radius scale for reskinned components |
| Motion | `motion` (framer-motion successor) used for micro-interactions; D4U currently has no equivalent dependency in either `d4u-website` or `d4u-admin` | Decision required: add `motion` as a new dependency, or replicate the specific transitions in pure CSS (see §10) |

---

## 6. Component Mapping — Website Surface

| Stitch component | Real D4U owner | Migration action |
|---|---|---|
| `Header.tsx` | `StitchLanding.tsx` header section | Visual port; real header already drives live cart/branch/search state — do not replace its logic |
| `Footer.tsx` | `StitchLanding.tsx` footer section | Straight visual port; branch data already real |
| `ProductCard.tsx` | Product card markup in `StitchLanding.tsx` / `KioskMode.tsx` / `MobileMode.tsx` | Visual port; Stitch's favorite/wishlist affordance has no backend concept today — stub or omit until §9 wishlist decision is made |
| `ProductQuickViewModal.tsx` | *(no current equivalent — net new UI)* | Modifier-group rendering logic is structurally close to the real `ModifierGroup`/`ModifierOption` model — good first candidate to actually build |
| `CartDrawer.tsx` | Existing cart drawer in `StitchLanding.tsx` | Visual port only; real cart already has quantity/promo logic |
| `CheckoutView.tsx` | Existing checkout flow | Reskin only — real `Order`/payment field set differs (§7); do not port Stitch's field list wholesale |
| `OrderTrackerModal.tsx` | *(no current equivalent)* | Net new, but **must** consume the real `order_updated` socket event (already connected in `App.tsx`, currently unused) instead of Stitch's fake `setTimeout` progression |
| `Hero3DCanvas.tsx` | Purely decorative, no data dependency | Safe drop-in as-is if desired — cosmetic only |
| `HomePage.tsx` | `StitchLanding.tsx` landing sections | Reskin section-by-section |
| `MenuPage.tsx` | `StitchLanding.tsx` / `KioskMode.tsx` / `MobileMode.tsx` catalog view | Left category-group sidebar is a genuine structural improvement over today's horizontal pill strip (see the previously-scoped, still-pending sidebar-navigation plan for this exact page) — treat as one migration workstream, not two |
| `PromotionsPage.tsx`, `AboutPage.tsx`, `ContactPage.tsx` | No dedicated routes today (single-scroll landing) | Would require adding real client-side routing to `d4u-website` for the first time — an architectural decision (§10), not a reskin |
| `CustomerAccountPage.tsx` | *(no current equivalent)* | Net new; depends on a customer-facing self-service auth/profile API that has not been confirmed to exist — do not build until confirmed |

## 6.1 Component Mapping — Admin/CMS Surface

| Stitch component | Real D4U owner | Migration action |
|---|---|---|
| `CMSLayout.tsx` | `d4u-admin/src/App.tsx` `AdminLayout` | **Never replace.** Real shell has RBAC nav-item gating, branch/brand context, JWT refresh — Stitch's has none of this |
| `CMSDashboardView.tsx` | `Dashboard.tsx` / `HQOverview.tsx` | Stitch's charts are hardcoded fake arrays; reskin chart *styling* only, real data pipeline stays |
| `CMSHeroSliderView.tsx` | `CmsManager.tsx` (BANNERS tab) | Direct reskin |
| `CMSPromotionHubView.tsx` | `MarketingHub.tsx` | Real module is far more advanced (scheduling, multi-channel publish, social OAuth) — reskin card/list visuals only |
| `CMSMenuManagerView.tsx` | `MenuManager.tsx` | Real module (Sprint 28.8D) is an enterprise DataTable with bulk-assign, CSV import/export, hierarchy filters — Stitch's simple table is a functional step backward; extract visual polish only |
| `CMSStaffManagerView.tsx` | `StaffPermissions.tsx` | **Not equivalent — do not conflate.** Stitch's is public marketing bios (photo/role/specialty dish); real one is RBAC user/permission management. Treat as two separate concepts (see §9) |
| `CMSSEOView.tsx` | *(none)* | Genuinely new module — scope separately |
| `CMSAnalyticsView.tsx` | `Dashboard.tsx` / `HQOverview.tsx` | Same treatment as `CMSDashboardView.tsx` |

---

## 7. API & Data Contract Mapping

Stitch makes zero API calls. The table below maps its mock data shapes to endpoints that **already exist** per `docs/API_CONTRACT.md` and `d4u-website/App.tsx`'s live fetch calls — no new endpoint is introduced by this document.

| Stitch mock data | Real endpoint (already exists) | Status |
|---|---|---|
| `INITIAL_CATEGORY_GROUPS` / `INITIAL_CATEGORIES` / `INITIAL_PRODUCTS` | `GET /catalog/category-groups/hierarchy/store/:store_id?channel=website` + `GET /catalog/products` (Sprint 28.8D enriched) | Confirmed, already consumed |
| `INITIAL_HERO_SLIDES` | `GET /cms/banners` | Confirmed, already consumed |
| `INITIAL_PROMOTIONS` | `GET /marketing/campaign?store_id=&channel=web` | Confirmed, already consumed |
| `INITIAL_BRANCHES` | `GET /stores` | Confirmed, already consumed |
| Order placement (`CheckoutView.tsx`) | Real order-placement endpoint | **Not confirmed in this pass** — website-side checkout POST endpoint needs to be located before `CheckoutView` reskin work begins |
| Order status tracking (`OrderTrackerModal.tsx`) | `socket.io` `order_updated` event | Confirmed to exist and be connected, currently unconsumed by any UI |
| `INITIAL_SEO_CONFIG` | None | Gap — would need new `GET/PUT /cms/seo/:store_id` |
| `INITIAL_CMS_ANALYTICS` | Possibly covered by `Dashboard.tsx`/`HQOverview.tsx`'s existing analytics calls | **Not confirmed in this pass** — those files' fetch calls were not read; confirm before reskinning `CMSAnalyticsView` |
| `INITIAL_STAFF` (public bios) | None | Gap — no `StaffProfile`/public-bio model exists; distinct from the real `User`/RBAC `Staff` model |
| `INITIAL_USER_PROFILE` / `CustomerAccountPage` | Possibly the `Customer` model behind `CustomersManager.tsx` | **Not confirmed** — customer-facing self-service login on the website side has not been confirmed to exist |

---

## 8. Files to Replace / Files to Keep

### Replace: none outright
Nothing in Stitch is a functional superset of its real D4U counterpart. Every Stitch "CMS" screen is simpler than what already ships (no auth, no multi-tenancy, no real persistence, fake charts). "Replacing" a real file with a Stitch file would be a net functional loss. Only the **markup/className bodies inside** existing files are in scope for change:
- `d4u-website/src/components/StitchLanding.tsx`, `KioskMode.tsx`, `MobileMode.tsx` — visual sections only
- `d4u-admin/src/pages/CmsManager.tsx`, `MarketingHub.tsx`, `MenuManager.tsx` — visual sections only
- Tailwind `@theme` token blocks in both projects' CSS entrypoints

### Keep, unmodified in logic
- All of `d4u-pos-backend` (no backend rewrite, per §2)
- `d4u-website/src/App.tsx` — `viewMode` switch, all `fetch`/`socket.io` calls, `BranchSelectorModal`
- `d4u-admin/src/App.tsx` — router shell, JWT login/refresh, RBAC nav gating, `AdminProvider` / `PackageProvider`
- `d4u-admin/src/utils/api.ts` (`apiFetch`, error handling)
- `d4u-admin/src/context/AdminContext.tsx`, `PackageContext.tsx`
- `MenuManager.tsx` business logic (bulk-assign/CSV/DataTable) — styling is a target, logic is not
- All of `d4u-pos-client` (no Stitch equivalent exists for POS/KDS/Waiter/TV)

---

## 9. Open Questions / Decisions Needed Before Implementation

These must be resolved (by the user, or by a scoped follow-up sprint) before any implementation phase begins:

1. **Design-token collision:** `d4u-website` already has its own brand tokens (`brand-dark`/`brand-light`/`brand-yellow`/`brand-pink`). Does Stitch's gold/dark palette *replace* these, or coexist as an alternate theme? Affects every reskin task in §6.
2. **`motion` dependency:** adopt `motion` as a new dependency in both frontends, or hand-replicate specific transitions in CSS to avoid the new dependency surface?
3. **Wishlist/favorites:** Stitch's `ProductCard`/`CustomerAccountPage` assume a persisted favorites list. Does this become a real, scoped backend feature, or is it dropped from the reskin?
4. **Client-side routing for `d4u-website`:** adding `PromotionsPage`/`AboutPage`/`ContactPage`/`CustomerAccountPage` as dedicated screens requires the site to gain real routing (it currently has none). Decide before building any of these four pages.
5. **Customer self-service auth:** does a customer-facing login/profile/order-history API already exist anywhere in the backend (unconfirmed in this pass), and if not, is building one in scope for this initiative or a separate one?
6. **SEO module ownership:** confirmed net-new (§7) — needs its own schema fields, endpoint, and admin page. Should it be scoped as part of this initiative or spun out separately?
7. **Staff/"Team Showcase" naming:** a public marketing bios feature needs a name distinct from the existing RBAC "Staff" (`StaffPermissions.tsx`) to prevent future confusion between the two concerns.
8. **Order-placement endpoint (website checkout):** must be located and confirmed before `CheckoutView.tsx` reskin work starts.
9. **`CMSAnalyticsView`/`CMSDashboardView` real data source:** `Dashboard.tsx`/`HQOverview.tsx`'s actual fetch calls need to be read to confirm what live data is available to style against.

---

## 10. Risk Register

| # | Risk | Mitigation |
|---|---|---|
| 1 | Copy-pasting Stitch's simplified CMS screen *structure* (not just styling) regresses real functionality (e.g. `MenuManager.tsx`'s bulk-assign/CSV work) | Explicit rule in §4.2: extract visual patterns only, never data-handling code |
| 2 | Type-model mismatch: Stitch's single `categoryId`/`categoryGroupId` string refs vs. the real many-to-many `categories: Category[]` array | Every ported component needs its data-binding rewritten per-page, not find-replaced |
| 3 | `d4u-website`'s pre-existing hardcoded 5-category type (`FoodItem.category`) becomes load-bearing once Stitch's category-group sidebar pattern is adopted | Fix the underlying category-derivation bug (§3.2) before or during the Menu page reskin, not after |
| 4 | Staff-module name collision causes a future developer to bind CMS marketing-bio markup directly against RBAC user records | Explicit distinct naming decided in §9.7 before any Staff-related work begins |
| 5 | `OrderTrackerModal.tsx` ships with Stitch's fake `setTimeout` status simulation, showing customers fabricated order status | Must be rewired to the real `order_updated` socket event before any real use (§4.5) |
| 6 | Adding real routing to `d4u-website` for the first time is an architectural change disguised as a page-by-page reskin task | Called out explicitly as a decision point (§9.4), not silently introduced mid-implementation |
| 7 | New dependencies (`motion`, possibly others) expand the frontend bundle/maintenance surface without an explicit decision | Called out explicitly (§9.2) |

---

## 11. Suggested Implementation Phasing (for a future, separately-approved sprint — not authorized by this document)

1. **Phase 0 — Tokens.** Port color/typography/effect tokens into both projects' Tailwind `@theme` blocks. Resolve §9.1 first.
2. **Phase 1 — Static pages.** `AboutPage`/`ContactPage`-style content — lowest state complexity, good validation of the token system, contingent on §9.4's routing decision.
3. **Phase 2 — Transactional website pages.** Home/Menu/Cart/Checkout reskins — must preserve all real cart/pricing/order logic; Menu page reskin folds in the already-pending category-sidebar redesign.
4. **Phase 3 — CMS reskins.** Hero/Promotions/Menu-CMS visual layers over existing `CmsManager.tsx`/`MarketingHub.tsx`/`MenuManager.tsx` — logic untouched.
5. **Phase 4 — Net-new modules (separately scoped).** SEO settings, order tracker (wired to real socket event), product quick-view modal, wishlist (contingent on §9.3), customer account page (contingent on §9.5), staff/team-showcase (contingent on §9.7).

---

## Appendix A: Full Stitch File Inventory (24 files, read in full)

**Root:** `App.tsx`, `types.ts`, `data/mockData.ts`
**Shared components:** `Header.tsx`, `Footer.tsx`, `CartDrawer.tsx`, `CheckoutView.tsx`, `ProductCard.tsx`, `ProductQuickViewModal.tsx`, `OrderTrackerModal.tsx`, `Hero3DCanvas.tsx`
**Public pages:** `HomePage.tsx`, `MenuPage.tsx`, `PromotionsPage.tsx`, `AboutPage.tsx`, `ContactPage.tsx`, `CustomerAccountPage.tsx`
**CMS pages:** `CMSLayout.tsx`, `CMSDashboardView.tsx`, `CMSHeroSliderView.tsx`, `CMSPromotionHubView.tsx`, `CMSMenuManagerView.tsx`, `CMSStaffManagerView.tsx`, `CMSSEOView.tsx`, `CMSAnalyticsView.tsx`

## Appendix B: Relevant D4U Frontend File Inventory

**`d4u-website/src/`:** `App.tsx`, `types.ts`, `data/foodItems.ts`, `main.tsx`, `utils/alerts.tsx`, `components/StitchLanding.tsx`, `components/KioskMode.tsx`, `components/MobileMode.tsx`, `components/BranchSelectorModal.tsx`

**`d4u-admin/src/`:** `App.tsx`, `main.tsx`, `context/AdminContext.tsx`, `context/PackageContext.tsx`, `utils/api.ts`, `utils/session.ts`, `utils/alerts.tsx`, `utils/currency.ts`, `components/GlobalErrorToast.tsx`, `components/DataTable.tsx`, `components/workspace/GlobalHeader.tsx`, `components/workspace/WorkspaceSwitcher.tsx`, `components/workspace/WorkspaceStatus.tsx`, `components/workspace/WorkspaceContextPanel.tsx`, `components/workspace/UnsavedChangesDialog.tsx`, `pages/Dashboard.tsx`, `pages/HQOverview.tsx`, `pages/CmsManager.tsx`, `pages/MarketingHub.tsx`, `pages/MenuManager.tsx`, `pages/StaffPermissions.tsx`, `pages/InventoryManager.tsx`, `pages/RecipeManager.tsx`, `pages/PurchaseManager.tsx`, `pages/CustomersManager.tsx`, `pages/StoreManager.tsx`, `pages/SuperAdmin.tsx`, `pages/OwnerApp.tsx`, `pages/SetupWizard.tsx`, `pages/BootstrapMode.tsx`, `pages/RecycleBin.tsx`, `pages/HealthDashboard.tsx`, `pages/ProductRequestsTab.tsx`

**Out of scope:** all of `d4u-pos-client/src/` (POS, KDS, Waiter, TV, admin-embedded pages) — no Stitch equivalent exists.

---

**End of document. No implementation has been performed. This blueprint requires explicit approval and resolution of §9 before any code is written.**
