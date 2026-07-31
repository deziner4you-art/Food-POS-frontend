# Title: Phase 1 Handover — Website Migration to Stitch Architecture
**Version:** 1.0
**Last Updated:** July 2026
**Purpose:** Handover record for Phase 1 of `docs/D4U_ENTERPRISE_MIGRATION_BLUEPRINT.md`'s execution plan (`C:\Users\dezin\.claude\plans\pure-exploring-sketch.md`). Phase 1 is accepted; this document is the record of what shipped, what remains, and what Phase 2 should know before starting.
**Branch:** `feature/stitch-website-migration`
**Commit:** `7d4ad23` — "feat(website): Phase 1 - migrate to Stitch-structured responsive architecture"
**Status:** ACCEPTED (Phase 1) — Phase 2 not started

---

## 1. What Was Completed

- Replaced the old `viewMode` component-swap (`StitchLanding`/`KioskMode`/`MobileMode` picked by `window` state) with real `react-router-dom` routing and a single shared, responsive page-component tree, matching the Stitch reference project's page structure (Home/Menu/Promotions/About/Contact/Account/Checkout/Track).
- Built `StoreContext` + `useStoreData`/`useStores` hooks that consolidate every fetch (`/stores`, catalog hierarchy, `/cms/banners`, `/cms/settings/:id`, `/marketing/campaign`) and own the **single** socket.io connection for the new route tree — fixes a real pre-existing bug where the old three components each opened their own socket at module scope, meaning up to three simultaneous connections per page load regardless of which view rendered.
- Kiosk implemented as a behavioral mode flag (`?mode=kiosk`) layered on the shared components, per your resolved decision — adjusts nav visibility, add-to-cart tap-target size, and forces cash/pickup at checkout. **Partial**: does not yet have its own large-format touchscreen layout distinct from the desktop/tablet grid.
- Migrated unique business logic out of the legacy components before they were quarantined:
  - `MobileMode.tsx`'s customer auth (phone login/register via `online-orders/auth/*`), loyalty points display, and order-history lookup → new `AccountPage.tsx`.
  - `MobileMode.tsx`'s working `order_updated` live-tracking (confirmed better than the old desktop implementation) → new `TrackOrderPage.tsx`.
- Quarantined `StitchLanding.tsx`, `KioskMode.tsx`, `MobileMode.tsx`, `LandingMode.tsx` unchanged into `src/legacy/`, reachable via `/legacy?mode=kiosk|mobile` for rollback — **not deleted**.
- Fixed a pre-existing type bug: `FoodItem.category` was hardcoded to a 5-value literal union that never matched real branch data (root cause of Kiosk/Mobile's known category-derivation bug from earlier sprints).
- Found and fixed a bug introduced during this phase itself: the new router was missing `basename="/website"` (matching the project's existing `vite.config.ts` `base: '/website/'`) — would have 404'd every route in the deployed environment. Caught via route-level `curl` smoke tests before being reported as done.
- Verified: `tsc --noEmit` clean, `vite build` succeeds, every route (including the legacy escape hatch, both `kiosk` and `mobile` modes) returns 200 under the real `/website/` base path.

## 2. Files Changed

**Modified:** `d4u-website/package.json`, `package-lock.json` (added `react-router-dom`), `src/App.tsx` (full rewrite — routing shell), `src/types.ts` (category type fix, added `StoreSummary`/`CustomerProfile`)

**Added:**
- `src/context/StoreContext.tsx` — global store/cart/auth state
- `src/hooks/useStoreData.ts` — fetch + socket consolidation
- `src/routes/PublicLayout.tsx` — Header/Footer/CartDrawer shell
- `src/components/shared/{Header,Footer,CartDrawer}.tsx`
- `src/pages/{HomePage,MenuPage,PromotionsPage,AboutPage,ContactPage,AccountPage,CheckoutPage,TrackOrderPage}.tsx`
- `src/utils/cartMath.ts` — shared subtotal/discount/tax/delivery/total calculations

**Renamed (quarantined, content unchanged):** `src/components/{StitchLanding,KioskMode,MobileMode,LandingMode}.tsx` → `src/legacy/*.tsx`

## 3. Remaining Work (before Phase 1 can be called fully closed)

1. **Live-browser visual parity check against `legacy/`** — this environment has no live browser. Only route-resolution and build-success were verified, not that the rendered UI actually matches/exceeds the old one on a real store's data.
2. **Product variant selection is currently missing from the new architecture.** The old `StitchLanding.tsx` had a "Select Variant/Size" modal and an "Add-ons" modal, both explicitly deferred out of scope in an earlier sprint and **not yet rebuilt** in `MenuPage.tsx`/`CartDrawer.tsx`. Today, `MenuPage.tsx` calls `addToCart` directly regardless of whether a product has variants — any product with size options has no way to select one. This is a functional gap, not a cosmetic one.
3. **Feedback/rating submission was not migrated.** `MobileMode.tsx` had a working post-delivery star-rating + comment flow (`POST /online-orders/:id/feedback`); `TrackOrderPage.tsx` does not yet include it.
4. **Rewards/Loyalty redemption UI not ported.** `AccountPage.tsx` shows loyalty points but not the old digital VIP-card / "redeem points for a discount" flow that existed in legacy `StitchLanding.tsx`'s Rewards tab.
5. **Manual coupon-code entry still doesn't exist** (flagged as missing in an earlier sprint too — coupons are only ever applied via a Promotions-page button click).
6. **Kiosk's dedicated large-tap-target layout** is still just the desktop grid with minor size tweaks, not a true kiosk-specific composition (idle-timeout, on-screen keypad, payment-success modal from the old `KioskMode.tsx` are not yet migrated).
7. `legacy/LandingMode.tsx` (confirmed dead code) is still present — kept intentionally until the parity gate closes.

## 4. Risks

- **Highest priority: missing variant/add-ons selection is a real functional regression**, not just an incomplete port — needs to be fixed before Phase 1 can be considered truly at parity, independent of the CMS/Marketing/Menu-Builder work in later phases.
- **`/legacy` still double-connects sockets.** The quarantined files were moved unchanged, so `StitchLanding.tsx`/`KioskMode.tsx`/`MobileMode.tsx` each still instantiate their own `io(BACKEND_URL)` at module scope. Visiting `/legacy` opens that socket *in addition to* the new `StoreContext`'s socket, since both mount under the same `StoreProvider`. Acceptable as a temporary cost for a rollback-only path, but should not persist once `/legacy` is retired.
- **No live-browser verification performed at all.** Everything reported as "working" is inferred from `tsc`, `vite build`, and HTTP-status route checks — none of it confirms the UI actually renders correctly or that cart/checkout/auth flows succeed end-to-end against live data.
- **Kiosk behavioral gaps**: no idle-timeout/reset (the plan already noted the old Kiosk didn't have one either, so this isn't a regression, but it also means the "walk-up public terminal" safety property the mission implied still doesn't exist anywhere).

## 5. Recommendations for Phase 2

1. **Do not start Phase 2 (Website CMS) until item 2 above (variant/add-ons selection) is fixed.** It's a customer-facing ordering-flow gap on the surface Phase 2 doesn't touch, so it can be fixed in parallel or just before Phase 2 without blocking CMS work, but it should not be left indefinitely — a customer literally cannot order a product with size options on the new site today.
2. **Get a real live-browser pass before trusting Phase 1's parity claim.** Either test `/website/`, `/website/menu`, `/website/checkout`, `/website/account`, `/website/legacy?mode=kiosk`, and `/website/legacy?mode=mobile` yourself against a real store, or use a browser-automation tool if one becomes available in this environment.
3. **Phase 2 is scoped to `d4u-admin`'s `CmsManager.tsx` only** per the approved plan — it does not depend on any of the open Website items above, so it can proceed independently once you're ready, but the variant/add-ons/feedback/rewards gaps should stay tracked, not forgotten, since they're real product-facing regressions from the old site.
4. Keep `src/legacy/` exactly as-is (do not edit it) until a live parity pass is done — it's the rollback path referenced in risk #2 above.

---

**End of handover. Phase 2 has not been started.**
