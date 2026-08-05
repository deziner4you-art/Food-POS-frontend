# Antigravity ↔ Claude Handover Log

Short, dated entries documenting changes made by Claude that the Antigravity
agent (or the next Claude session) should be aware of when picking up work
in this repo. Newest entries at the top.

---

## 2026-08-05 — Website Menu Catalogue: 4-column → 3-column product grid

**Scope:** `d4u-website` Menu/Catalogue frontend only (presentation/layout).

**Why:** At 4 columns per row on desktop, product cards were too narrow —
names wrapped to 2 lines, prices like "Rs. 1498.50" broke mid-string onto
two lines, and the Add To Cart button occasionally wrapped. Font sizes were
never reduced to force a fit; the fix is purely giving cards more width.

**Files changed:**
- `d4u-website/src/pages/MenuPage.tsx` — grid class `grid-cols-1
  sm:grid-cols-2 lg:grid-cols-4` → `grid-cols-1 sm:grid-cols-2
  lg:grid-cols-3` (mobile: 1 col, tablet `sm:`: 2 cols, desktop `lg:`: 3
  cols — same breakpoints as before, only the desktop column count changed).
- `d4u-website/src/components/ProductCard.tsx` — price/button footer row:
  added `min-w-0` on the price block and `whitespace-nowrap` on the price
  and original-price spans (stops "Rs." and the number from breaking onto
  separate lines) and `flex-shrink-0 whitespace-nowrap` on the Add To Cart
  button (stops its label from wrapping). No font-size changes. Also moved
  the discount badge (`-X% OFF`) from bottom-left-of-image to a top-left,
  edge-flush position with larger text, unrelated small ask bundled into
  the same pass.

**Build:** `npm run build` in `d4u-website` — succeeded (`vite build`, no
errors; existing chunk-size advisory is pre-existing/unrelated).

**Not touched:** backend, database, catalogue sync, promotion/discount
calculation logic, currency logic, cart logic, or any other page/component.
