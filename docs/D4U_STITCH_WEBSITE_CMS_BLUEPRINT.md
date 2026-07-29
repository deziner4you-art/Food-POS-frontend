# Title: D4U Stitch Website & Website CMS Modernization Blueprint
**Version:** 1.0
**Last Updated:** July 2026
**Purpose:** The scoped execution blueprint for modernizing the D4U customer Website and its Website CMS to the "Stitch" visual identity — website and website-CMS only, nothing else.
**Dependencies:** `docs/D4U_MASTER_ARCHITECTURE_BLUEPRINT.md`, `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md`, `docs/API_CONTRACT.md`, `docs/FRONTEND_BACKEND_MAPPING.md`
**Related Documents:** `docs/AI_TEAM_PROGRESS.md`, `docs/CHANGELOG_AI.md`
**Author:** AI Chief Software Architect
**Status:** DRAFT — architecture only, no implementation has started

**Relationship to other documents:** This document does not modify, override, or conflict with `docs/D4U_MASTER_ARCHITECTURE_BLUEPRINT.md`. Every rule in that document's Architecture Philosophy (§2) — Simple, Maintainable, Scalable, Migration Safe, Offline First, Real-Time First, Backward Compatible, Production Safe — governs everything below. This document narrows the broader `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` (which covers the full Stitch-to-D4U surface, including the wider Admin/HQ portal) down to exactly two consumers: the customer Website and the Website CMS. Where the two Stitch documents overlap, this one is the authoritative execution reference for Website/Website-CMS work; the master document remains authoritative for everything else (Staff/RBAC, Analytics/HQ, SEO ownership decisions, etc.).

---

## 1. Vision

The D4U customer Website and its Website CMS are functionally complete and already live-wired to the real backend — real store selection, real catalog hierarchy, real cart, real banners, real campaigns, real sockets. What they lack is the premium visual identity captured in the Stitch prototype: a dark, gold-accented, enterprise-grade aesthetic with confident typography, glowing accents, and a coherent card/badge/button language.

The vision is a **visual-only transformation**: a customer landing on the D4U website, or an operator opening the Website CMS, should see the Stitch aesthetic — while every fetch call, every socket event, every piece of state management, and every backend contract underneath remains exactly what it is today. Nothing about *how the site works* changes. Only *how it looks* changes.

---

## 2. Scope

### In scope
- **Website (`d4u-website/`):** `App.tsx`'s three view modes (`StitchLanding.tsx` desktop, `KioskMode.tsx`, `MobileMode.tsx`), `BranchSelectorModal.tsx`, and all customer-facing screens reachable from them (home/landing, menu/catalog, cart, checkout).
- **Website CMS:** the subset of `d4u-admin/` that manages *website content*, not the whole ERP: `CmsManager.tsx` (Banners/Settings/Modules), `MarketingHub.tsx` (promotions/campaigns that surface on the website), and the *website-facing* parts of `MenuManager.tsx` (catalog content that renders on the website's menu page — not its enterprise bulk-ops backend logic, which is untouched regardless).
- Design token extraction and the shared theme system used by both of the above.

### Explicitly out of scope
- The rest of `d4u-admin` — `StaffPermissions.tsx` (RBAC, not marketing bios), `InventoryManager.tsx`, `RecipeManager.tsx`, `PurchaseManager.tsx`, `CustomersManager.tsx`, `SuperAdmin.tsx`, `OwnerApp.tsx`, `SetupWizard.tsx`, `BootstrapMode.tsx`, `StoreManager.tsx`, `RecycleBin.tsx`, `HealthDashboard.tsx`, `Dashboard.tsx`/`HQOverview.tsx` (real analytics, not styled here).
- `d4u-pos-client` in its entirety (POS, KDS, Waiter, TV) — no Stitch equivalent exists and it is not part of this modernization.
- `d4u-pos-backend` in its entirety — no schema, endpoint, service, or migration work of any kind.
- Net-new backend-dependent features called out in `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §9 (SEO module, wishlist, customer self-service account, public staff/team-showcase, order-placement confirmation) — these require their own scoping and are not authorized by this document.

---

## 3. Non-Negotiable Rules

These carry forward unchanged from the originating task brief and from `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §2, restated here because this document is the one engineers will execute against directly:

1. **DO NOT rewrite the backend.** Zero changes to `d4u-pos-backend`.
2. **DO NOT create a new CMS.** The Website CMS is the existing `d4u-admin` pages listed in §2. Stitch's `CMSLayout.tsx` and its mock CRUD screens are a visual reference only.
3. **DO NOT replace authentication.** `d4u-admin`'s JWT + refresh-token session stays exactly as implemented in `utils/session.ts` and `App.tsx`.
4. **DO NOT replace RBAC.** No nav-gating, permission-checking, or route-guarding logic changes.
5. **DO NOT replace Multi-Tenant.** `store_id`/`brand_id`/branch-context plumbing (`AdminContext`, `BranchSelectorModal`, backend `store_id` scoping) is untouched.
6. **DO NOT replace APIs.** Every endpoint in `docs/API_CONTRACT.md` remains the contract, byte-for-byte. This blueprint introduces zero new confirmed endpoints.
7. **DO NOT implement anything from this document without separate, explicit approval.** This is architecture only.
8. **Every rule above must also satisfy the Master Architecture Blueprint's philosophy** (§2 of that document): changes must remain Simple, Maintainable, Scalable, Migration Safe, Offline First, Real-Time First, Backward Compatible, and Production Safe. A reskin that breaks offline resilience, real-time updates, or backward compatibility is a violation of this document even if it looks correct.

---

## 4. Website Upgrade Strategy

**Principle:** reskin `d4u-website`'s existing three view-mode components in place. `App.tsx`'s `viewMode` state machine (`'landing' | 'kiosk' | 'mobile'`, derived from `window.innerWidth`) and the `BranchSelectorModal` gate are not touched — they are the correct, working architecture and Stitch has no equivalent responsive-mode system to replace them with.

- **`StitchLanding.tsx` (desktop, `viewMode === 'landing'`):** re-skin section by section against Stitch's `HomePage.tsx` and `MenuPage.tsx` layouts — hero, promotions strip, featured categories, best sellers, services, reviews, staff/team, branch locator, menu/catalog grid, cart drawer, checkout. Each section is a targeted JSX/className change against a section that already has live data bound to it.
- **`KioskMode.tsx`:** apply the same token system at a kiosk-appropriate density; adopt Stitch's category-sidebar pattern from `MenuPage.tsx` (already independently planned — see the pending sidebar-navigation plan for this exact screen). Fix the underlying hardcoded 5-category bug (§8) as part of this same pass, since the sidebar work touches the same category-derivation code anyway.
- **`MobileMode.tsx`:** apply tokens; keep the existing horizontal "story ring" category-chip pattern (a sidebar does not fit a phone-width screen — this was already the deliberate call in the pending sidebar plan) but fix its hardcoded/capped category list from the same underlying bug fix.
- **`BranchSelectorModal.tsx`:** reskin only; the forced-gate UX pattern (block all content until a store is chosen) stays as-is — Stitch's Header dropdown branch-switcher is a *secondary* pattern for switching branches after entry, not a replacement for the initial gate.
- **No routing added in this phase.** Stitch's dedicated `AboutPage`/`ContactPage`/`PromotionsPage`/`CustomerAccountPage` remain out of scope for the Website Upgrade Strategy until the routing decision (`docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §9.4) is made — that decision is upstream of this document and is not re-litigated here.
- **New UI with no current equivalent** (`ProductQuickViewModal.tsx`, `OrderTrackerModal.tsx`) is Phase 4 work (see §10), not part of the initial reskin, and — for `OrderTrackerModal` specifically — must be wired to the real `order_updated` socket event, never Stitch's fake `setTimeout` simulation.

---

## 5. Website CMS Upgrade Strategy

**Principle:** reskin the in-scope `d4u-admin` pages (§2) in place. `App.tsx`'s router, RBAC nav gating, `AdminContext`, and `apiFetch` client are not touched.

- **`CmsManager.tsx` (Banners/Settings/Modules tabs):** reskin against Stitch's `CMSHeroSliderView.tsx` — card layout, priority/visibility badges, modal form styling. The real multipart image-upload flow and `BANNERS`/`SETTINGS`/`MODULES` tab logic stay exactly as implemented.
- **`MarketingHub.tsx`:** reskin against Stitch's `CMSPromotionHubView.tsx` for the campaign-card visuals only. The real module's scheduling, multi-channel publish (web/POS/Facebook/Instagram/TV), and social OAuth flows are materially more advanced than Stitch's mock and are not simplified to match it.
- **`MenuManager.tsx` (website-facing content only):** reskin the *card and table styling* against Stitch's `CMSMenuManagerView.tsx`. The real enterprise DataTable — bulk category/group assignment, CSV import/export, hierarchy filters, sorting, audit logging (Sprint 28.8D) — is a strict superset of Stitch's simple mock table and must not be simplified toward it under any circumstance.
- **Explicitly excluded from this phase:** `CMSDashboardView.tsx`/`CMSAnalyticsView.tsx` styling work is deferred until `Dashboard.tsx`/`HQOverview.tsx`'s real data sources are confirmed (open question in `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §9.9) — those pages are HQ/ERP-wide, not website-CMS-scoped, and are out of this document's scope per §2 regardless.
- **Explicitly excluded:** `CMSStaffManagerView.tsx` / `CMSSEOView.tsx` — both map to net-new or misnamed concerns (§9 of the master document) and are not part of the Website CMS as currently scoped.

---

## 6. Screen Mapping

| Stitch screen | Real D4U screen | In this document's scope? |
|---|---|---|
| `HomePage.tsx` | `StitchLanding.tsx` (landing sections) | Yes — §4 |
| `MenuPage.tsx` | `StitchLanding.tsx` / `KioskMode.tsx` / `MobileMode.tsx` catalog view | Yes — §4 |
| Cart (via `CartDrawer.tsx`) | Existing cart drawer in `StitchLanding.tsx` | Yes — §4 |
| Checkout (via `CheckoutView.tsx`) | Existing checkout flow in `StitchLanding.tsx` | Yes — §4 (reskin only; field-set differs, see §8) |
| `PromotionsPage.tsx`, `AboutPage.tsx`, `ContactPage.tsx` | No dedicated route today | No — blocked on routing decision, not in this phase |
| `CustomerAccountPage.tsx` | No current equivalent | No — net new, blocked on customer-auth confirmation |
| `CMSHeroSliderView.tsx` | `CmsManager.tsx` (Banners tab) | Yes — §5 |
| `CMSPromotionHubView.tsx` | `MarketingHub.tsx` | Yes — §5 |
| `CMSMenuManagerView.tsx` | `MenuManager.tsx` (website-facing styling only) | Yes — §5 |
| `CMSLayout.tsx` | `d4u-admin/src/App.tsx` `AdminLayout` | No — never replaced (§3.2) |
| `CMSDashboardView.tsx`, `CMSAnalyticsView.tsx` | `Dashboard.tsx` / `HQOverview.tsx` | No — HQ/ERP-wide, out of scope |
| `CMSStaffManagerView.tsx` | `StaffPermissions.tsx` (not equivalent) | No — misnamed concern, out of scope |
| `CMSSEOView.tsx` | None | No — net new, separately scoped |

---

## 7. Component Mapping

| Stitch component | Real D4U file | Action |
|---|---|---|
| `Header.tsx` | `StitchLanding.tsx` header section | Visual port only — real header drives live cart/branch/search state |
| `Footer.tsx` | `StitchLanding.tsx` footer section | Visual port only |
| `ProductCard.tsx` | Product card markup in `StitchLanding.tsx` / `KioskMode.tsx` / `MobileMode.tsx` | Visual port; omit or stub the favorite/wishlist affordance (no backend concept exists yet) |
| `CartDrawer.tsx` | Real cart drawer | Visual port only — real quantity/promo logic untouched |
| `CheckoutView.tsx` | Real checkout flow | Visual port only — do not port Stitch's `Order`/payment field set wholesale (see §8) |
| `Hero3DCanvas.tsx` | None (purely decorative) | Optional drop-in as-is, no data dependency |
| `ProductQuickViewModal.tsx` | None | Deferred to Phase 4 (§10) — net new, structurally close to real `ModifierGroup`/`ModifierOption` model |
| `OrderTrackerModal.tsx` | None | Deferred to Phase 4 (§10) — must consume real `order_updated` socket event, never a fake timer |
| `CMSHeroSliderView.tsx` card/modal patterns | `CmsManager.tsx` Banners tab | Visual port only |
| `CMSPromotionHubView.tsx` card patterns | `MarketingHub.tsx` campaign cards | Visual port only |
| `CMSMenuManagerView.tsx` table/card patterns | `MenuManager.tsx` | Visual port only — real DataTable logic (bulk-assign, CSV, sorting, audit) is a strict superset and is never simplified |

---

## 8. API Mapping

No new endpoints are introduced. This table confirms which Stitch mock data already has a real, live backing call (per `d4u-website/App.tsx` and `docs/API_CONTRACT.md`) versus what remains unconfirmed and must be verified before the corresponding screen is reskinned.

| Data | Real endpoint | Status |
|---|---|---|
| Category groups / categories / products (menu) | `GET /catalog/category-groups/hierarchy/store/:store_id?channel=website` + `GET /catalog/products` | Confirmed, already live in `App.tsx` |
| Hero banners | `GET /cms/banners` | Confirmed, already live |
| Promotions/campaigns | `GET /marketing/campaign?store_id=&channel=web` | Confirmed, already live |
| Branch/store list | `GET /stores` | Confirmed, already live |
| Realtime campaign updates | `socket.io` `marketing_update` | Confirmed, already live |
| Order status tracking | `socket.io` `order_updated` | Confirmed to exist and be connected; **currently unconsumed by any UI** — must be wired before any `OrderTrackerModal` work |
| Order placement (checkout submit) | Not yet located in this pass | **Must be confirmed before reskinning `CheckoutView.tsx`'s submit flow** — do not assume a shape, verify against the live code first |
| Website CMS banner CRUD | `POST /cms/banners` (multipart), `GET /cms/settings/:id` | Confirmed, already live in `CmsManager.tsx` |
| Marketing campaign CRUD | Existing `MarketingHub.tsx` endpoints (scheduling, social publish, capabilities gating via `GET /marketing/capabilities?store_id=`) | Confirmed, already live |
| Product/category CRUD for website content | `docs/API_CONTRACT.md` Section 4 (Sprint 28.8D: `GET/POST /catalog/products`, `/catalog/categories`, bulk-assign endpoints, CSV import/export) | Confirmed, already live in `MenuManager.tsx` |

**Known gap, out of scope here:** `INITIAL_SEO_CONFIG` has no backing endpoint at all — this is not addressed by this document (see `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §9.6).

---

## 9. Theme System

- **Mechanism:** both `d4u-website` and `d4u-admin` already use Tailwind v4's CSS-native `@theme` blocks (no `tailwind.config.js` in either project) — the same mechanism Stitch itself uses. Token porting is therefore additive CSS, not a build-system change.
- **Token set to port** (from `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §5): background scale (`#0C0C0E`/`#121215`/`#16130B`/`#1A1A1D`), gold accent (`#D4AF37`, hover `#ffe088`, deep `#8C6D1F`), semantic colors (emerald/rose/amber — already standard Tailwind, no new tokens needed), `gold-glow`/`gold-glow-hover`/`glass-panel` utility classes, large-radius shape language (`rounded-2xl`/`rounded-3xl`, pill nav/buttons), two-font display/sans typography split.
- **Coexistence with existing tokens:** `d4u-website` already defines `brand-dark`/`brand-light`/`brand-yellow`/`brand-pink`. Default recommendation for this scoped effort: introduce the Stitch gold/dark tokens as the new primary theme and treat the existing `brand-*` tokens as deprecated once the visual migration is complete, rather than maintaining two live palettes indefinitely. This is a recommendation, not a decision — final call rests with the user per `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §9.1.
- **Motion:** Stitch uses the `motion` package for micro-interactions; neither `d4u-website` nor `d4u-admin` currently depends on it. Default recommendation for this scoped effort: replicate the specific transitions used in this Website/Website-CMS scope with plain CSS transitions rather than adding a new runtime dependency, unless a specific interaction proves impractical without it. Final call rests with the user per `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §9.2.
- **Application order:** tokens are ported once, centrally, before any screen-level reskin work begins (Sprint 0 in §10) — no screen should be reskinned against ad-hoc inline colors that get retrofitted into tokens later.

---

## 10. Sprint Roadmap

Numbering continues the "Phase" language from `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §11, narrowed to Website/Website-CMS only. **No sprint below is authorized to start until this document and its open questions are explicitly approved.**

| Sprint | Scope | Depends on |
|---|---|---|
| **Sprint 0 — Theme Foundation** | Port design tokens (§9) into both projects' `@theme` blocks; resolve token-coexistence and `motion` decisions | §9 decisions |
| **Sprint 1 — Website Landing Reskin** | `StitchLanding.tsx`: hero, promotions strip, featured categories, best sellers, services, reviews, staff, branch locator sections | Sprint 0 |
| **Sprint 2 — Website Menu/Cart/Checkout Reskin** | `StitchLanding.tsx` menu/catalog grid + cart drawer + checkout visual layer; confirm order-placement endpoint first (§8) | Sprint 0 |
| **Sprint 3 — Kiosk & Mobile Reskin** | `KioskMode.tsx`, `MobileMode.tsx` token application + category-sidebar/story-ring pattern + underlying hardcoded-category bug fix (§4) | Sprint 0, Sprint 2 (shares category logic) |
| **Sprint 4 — Website CMS Reskin** | `CmsManager.tsx` (Banners/Settings/Modules), `MarketingHub.tsx` campaign cards, `MenuManager.tsx` website-facing card/table styling | Sprint 0 |
| **Sprint 5 — Net-New Website UI (conditionally authorized)** | `ProductQuickViewModal.tsx`, `OrderTrackerModal.tsx` (wired to real `order_updated`) | Sprints 1–2; explicit go-ahead per screen |
| **Deferred, not scheduled** | Routing-dependent pages (`AboutPage`/`ContactPage`/`PromotionsPage`/`CustomerAccountPage`), SEO module, wishlist, staff/team-showcase | Resolution of `docs/D4U_STITCH_UI_MASTER_BLUEPRINT.md` §9 open questions |

---

## 11. QA Checklist

To be run after **every** sprint above, before merge:

**Build & type safety**
- [ ] `npx tsc --noEmit` clean in `d4u-website` and `d4u-admin` (against the correct app-specific tsconfig, not a project-references root that silently checks nothing)
- [ ] No new console errors/warnings in the browser dev console on load of every touched screen

**Functional parity (nothing behavioral changed)**
- [ ] Every `fetch()` call present before the sprint is still present, unchanged, in the touched files
- [ ] `socket.io` connection still established; `join_store`, `marketing_update` (and `order_updated` once Sprint 5 wires it) still fire and are handled
- [ ] Cart add/remove/quantity-update logic produces identical totals before and after
- [ ] Checkout submits successfully end-to-end against the real backend (not just visually renders)
- [ ] `BranchSelectorModal` gate still blocks content until a store is chosen; branch switch still clears cart and refetches catalog/CMS data
- [ ] Website CMS: banner create/edit/delete, campaign create/edit/schedule/publish, and menu product/category edits all still round-trip to the real backend correctly
- [ ] RBAC nav gating in `d4u-admin` unchanged — no nav item appears/disappears differently than before the sprint
- [ ] JWT session/refresh behavior unchanged — no new login prompts, no premature logout

**Visual/responsive**
- [ ] Desktop, kiosk-width (~800px), and mobile-width (~400px) all render correctly for every touched screen
- [ ] All Stitch tokens (colors, radii, glow effects) applied consistently — no leftover mixed old/new styling within a single screen
- [ ] No horizontal scroll or layout overflow introduced at any breakpoint

**Data integrity**
- [ ] No category/product/branch data is fabricated, hardcoded, or silently dropped by the reskin (this is the exact class of bug already present in `KioskMode.tsx`/`MobileMode.tsx`'s hardcoded category list — verify it is not reintroduced or left unfixed where the sprint touches that code)
- [ ] Every list/grid that previously showed N real items still shows all N items after the reskin

**Sign-off**
- [ ] Cross-checked against this document's Screen/Component/API mapping tables — nothing shipped outside the sprint's declared scope
- [ ] `docs/AI_TEAM_PROGRESS.md` and `docs/CHANGELOG_AI.md` updated per the existing multi-agent protocol

---

## 12. Rollback Plan

Because every sprint in this blueprint is **visual-only** (no state shape changes, no API changes, no schema changes), rollback is materially lower-risk than a typical feature rollback — but the plan below still applies deliberately rather than assuming "just revert the commit" is always sufficient.

1. **Branch isolation per sprint.** Each sprint (§10) lands on its own branch/PR, never bundled with another sprint's changes or with unrelated fixes. This keeps `git revert`/`git reset` scoped to exactly one sprint's visual surface.
2. **No destructive edits to data-fetching code.** Per §4/§5, every sprint's diff should be reviewable as "className/JSX structure changed, `fetch`/`socket.io`/state logic unchanged." If a reviewer sees a diff touching a `fetch` call, an event handler's logic, or a state shape, that is a scope violation, not just a rollback candidate — it should be split out before merge, not rolled back after.
3. **Token changes are additive, not destructive, until final cutover.** During Sprints 0–4, new tokens are added alongside (not replacing) existing `brand-*` tokens where feasible, so a single screen's reskin can be reverted without breaking token availability for already-shipped screens. Full deprecation of old tokens (§9) only happens after all in-scope screens are confirmed shipped and stable.
4. **Standard git revert for a single sprint.** If a sprint's reskin ships a regression: `git revert` the sprint's merge commit (or the specific PR's commits) on `main`. Because sprints are visually scoped and isolated, this should cleanly restore the prior screen's appearance without affecting other already-shipped sprints, since those touch disjoint files/sections.
5. **If a regression is discovered in production data behavior (not visual)** — e.g. a category silently disappears, cart totals miscalculate — this is treated as a Sev-1 regardless of the reskin being "visual-only," reverted immediately via step 4, and root-caused via the same `tsc`/static-analysis-first workflow already established for this codebase (compare against the QA checklist item that should have caught it, and add a missing check to §11 if one is found).
6. **No feature flags required.** Because these are pure UI/CSS changes with no new backend dependency and no conditional logic, a flag system is unnecessary overhead for this specific initiative — git branch/PR isolation plus the QA checklist is the agreed-sufficient safety net, consistent with the Master Architecture Blueprint's "Simple" principle (§2 of that document): avoid over-engineering, choose the most direct solution.

---

**End of document. No implementation has been performed. This blueprint requires explicit approval before any code is written, and does not authorize any sprint in §10 to begin on its own.**
