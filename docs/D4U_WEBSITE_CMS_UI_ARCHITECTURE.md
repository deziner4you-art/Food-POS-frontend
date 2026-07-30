# Website CMS — UI Architecture Document (Draft, Pending Approval)

**Status:** DRAFT — no code written. Do not implement until sign-off on Section 8 (Open Questions).
**Scope:** Presentation layer of `d4u-admin/src/pages/CmsManager.tsx` only.
**Frozen (not touched by this doc or its implementation):** backend, API routes, Prisma schema, `useAdminContext`/`AdminContext.tsx`, routing (`/cms` stays `/cms`, still renders the component exported from `CmsManager.tsx`), all existing fetch/save/delete logic, all existing state shape.

---

## 1. Current State Audit (verified against live code, not assumed)

This redesign has to be honest about what the backend actually supports today. I read `CmsManager.tsx` in full and cross-checked every field against `d4u-pos-backend`'s `cms.controller.ts`, `cms.service.ts`, `update-settings.dto.ts`, and the `CmsSettings` Prisma model. Result:

### Real, fully wired (must survive the redesign unchanged)
| Feature | Backend | Notes |
|---|---|---|
| Branch selector | `AdminContext` (`selectedBranchId`) | Drives which store's settings/banners load. "All Branches (Global)" = value `0`. |
| Banners — list | `GET /cms/banners` (public) | |
| Banners — create | `POST /cms/banners` (multipart, `system.create`) | Uploads file to `./uploads`, stores `imageUrl`, `title`, `subtitle`, `linkUrl`, `buttonText`, `isActive`, `displayOrder`. |
| Banners — delete | `DELETE /cms/banners/:id` (`system.delete`) | |
| Settings — read | `GET /cms/settings/:store_id` (public) | |
| Settings — write | `PATCH /cms/settings/:storeId` (`system.update`) | Only these 12 string fields persist: `siteTitle, contactPhone, contactEmail, address, googleMapUrl, facebookUrl, instagramUrl, whatsappNumber, twitterUrl, youtubeUrl, aboutText, companyText`. |
| Modules — 4 feature flags | Same `PATCH` endpoint | `module_auth_enabled, module_kds_enabled, module_loyalty_enabled, module_payments_enabled`. Auto-saves per toggle. |

### Real on the backend, but NOT currently used by the frontend at all
| Capability | Backend | Currently in UI? |
|---|---|---|
| Update an existing banner (`PATCH /cms/banners/:id`, incl. `displayOrder`) | Yes (`system.update`) | **No** — today's UI can only create or delete a banner, never edit/reorder one. |
| Newsletter subscribe (`POST /cms/subscribe`) | Yes (`system.create`) | **No** — no admin surface shows subscriber capture at all. |

### Present in the UI today, but silently dead (confirmed via `UpdateSettingsDto`'s whitelist)
`tiktokUrl`, `threadsUrl`, `linkedinUrl`, `pinterestUrl` — these 4 inputs exist in the current Settings tab and accept typing, but `UpdateSettingsDto` has no matching fields, so Nest's validation pipe strips them before they ever reach Prisma. **They do not persist today.** This is a pre-existing bug, not something this redesign is asked to fix — but it would be dishonest to re-render them as if they work.

### Requested in this task, with zero backend support today
- **SEO** — no `metaTitle`/`metaDescription`/`ogImage`/`canonical` columns anywhere in `CmsSettings` or elsewhere.
- **Pages** — no generic CMS "pages"/content-block model exists. The live website's About/Contact copy is just `aboutText`/`companyText` on `CmsSettings` (i.e. it's already covered by "Site Settings", not a separate system).
- **Media** — no asset library beyond the single ad-hoc file input on the banner-create form. No endpoint to list/browse/reuse previously uploaded images.
- **Homepage Management** (as something distinct from the banner/hero slider) — doesn't exist separately; "Hero Sections" and "Website Banners" are the same real feature under two names.

This matters because of the project's standing rule (established earlier in this engagement and still in force): **never render fake data or a feature that looks functional but isn't wired to anything real.** Section 8 asks you to pick how SEO / Pages / Media are handled given this.

---

## 2. Reference Inspiration — what's actually being borrowed

Not just name-dropping; each reference maps to a concrete pattern used in Section 5-6:

- **Shopify Admin**: left-hand persistent section rail (not top tabs) inside a settings-style page; sticky bottom/top **save bar** that appears only when there are unsaved changes; resource list rows with thumbnail + status badge + row actions.
- **Webflow CMS**: collection-style grid for repeatable items (banners) with hover-reveal actions, drag-handle affordance for order.
- **Framer CMS**: minimal chrome, generous whitespace, single-column focused forms for settings rather than dense multi-column grids, one primary field group visible at a time.
- **Stitch Design System (this project's own token set)**: everything above rendered exclusively through `stitch-*` tokens and the existing `glass-panel`/`accent-glow` utilities — no new colors, no new tokens.

---

## 3. New Information Architecture

Replace the current 3-button top tab-row with a **persistent left section rail inside the CMS page** (Shopify-pattern), while the outer `AdminLayout` sidebar/header stay exactly as they are — this is one level deeper, not a replacement of the app shell.

```
/cms
 └─ CmsManager.tsx (unchanged export, unchanged route)
     └─ CmsShell (new: section rail + branch selector + save bar)
         ├─ Hero & Banners        (real — today's "BANNERS" tab, renamed/reframed)
         ├─ Site Settings         (real — today's "SETTINGS" tab)
         ├─ System Modules        (real — today's "MODULES" tab)
         ├─ SEO                   (inert — see Section 8, Option A/B)
         ├─ Pages                 (inert — see Section 8, Option A/B)
         └─ Media Library         (inert — see Section 8, Option A/B)
```

"Homepage Management" is **not** a separate rail item — it's absorbed into "Hero & Banners" since that already is the homepage's managed content, per the audit above. Presenting it as a second, separate section would imply a second real feature that doesn't exist.

---

## 4. Page-by-page design spec

### 4.1 Shell (`CmsShell`)
- Left rail, sticky, same visual language as `AdminLayout`'s own sidebar but nested one level (Shopify's "section within a section" pattern) — `bg-stitch-panel`, active item `bg-stitch-accent text-stitch-accent-ink`, inactive `text-stitch-muted`.
- Top of the content pane: branch selector (unchanged control/behavior) + a **save bar** that is hidden by default and slides in only when `settings` has unsaved edits, holding the existing `handleSaveSettings` call — this replaces the always-visible "Save All Settings" button, which today saves regardless of whether anything changed.
- Toast success state reuses the same 3-second pattern already in the code, restyled as a small inline pill near the save bar instead of a floating banner.

### 4.2 Hero & Banners (real data, `banners` state)
- Webflow-style collection grid: existing card content (image, title, subtitle, order, delete) kept, restyled with a consistent 16:9 media frame, status badge (`Live` / `Disabled`) instead of the current corner tag, and a hover action row (Delete stays; **no new Edit/Reorder action** unless Section 8 approves using the already-existing-but-unused `PATCH /cms/banners/:id`).
- Upload modal restyled as a two-column layout (image dropzone left, fields right) — same fields, same submit handler, same validation (`customAlert` if no file).
- Empty state restyled, same copy intent ("No banners yet").

### 4.3 Site Settings (real data, `settings` state)
- Broken into labeled sub-groups instead of one flat 2-column grid: **Identity** (title, phone, email, address, map), **Social Links** (facebook/instagram/twitter/youtube — the 4 real ones), **Footer Content** (aboutText, companyText).
- The 4 dead fields (tiktok/threads/linkedin/pinterest): per Section 8, either removed from this pass entirely (cleanest, since they never worked) or visually marked "Not connected yet" — this is a real decision, not a redesign detail, so it's deferred to Section 8 rather than assumed.
- Same inputs, same `onChange` handlers, same submit path.

### 4.4 System Modules (real data)
- Same 4 toggles, same auto-save-on-change behavior (including its existing hardcoded `store_id=1` quirk — untouched, since fixing it would be a business-logic change, out of scope here). Restyled as a cleaner settings-list (icon + label + description + toggle), Shopify-settings-page style.

### 4.5 SEO / Pages / Media Library (no backend today)
Each gets a fully designed **empty/discononnected state** — real layout, real navigation entry, but no fabricated data and no working form fields, so nothing here can be mistaken for a working feature. Exact treatment (build now as inert vs. hide until backend exists) is Section 8, Option A vs B.

---

## 5. Component system (new presentational components, still zero business logic)

All net-new files are pure presentation, accepting the exact same props/data/handlers `CmsManager.tsx` already produces — no new state shape, no new fetches:

- `CmsShell.tsx` — rail + save bar layout
- `CmsSectionNav.tsx` — the left rail item list
- `SaveBar.tsx` — sticky unsaved-changes bar (wraps existing `handleSaveSettings`)
- `BannerGrid.tsx` / `BannerCard.tsx` / `BannerUploadModal.tsx` — decomposed from the existing BANNERS JSX
- `SettingsForm.tsx` (+ `SettingsFieldGroup.tsx`) — decomposed from the existing SETTINGS JSX
- `ModuleToggleList.tsx` — decomposed from the existing MODULES JSX
- `InertSectionPlaceholder.tsx` — shared "not connected" empty state for SEO/Pages/Media
- Everything above consumes only existing `stitch-*` tokens and the existing `stitch-ui` kit (`Button`, `Card`, `Badge`, `SectionHeading`) already sitting unused in `d4u-admin/src/components/stitch-ui/` — this redesign is the first thing that would actually import them, which was explicitly deferred back in Sprint 5.

`CmsManager.tsx` itself becomes a thin composition root: same imports, same hooks, same handlers, same state — its `return (...)` is replaced with `<CmsShell>`, passing the existing state/handlers down as props.

---

## 6. Interaction & state patterns
- Loading: skeleton rows for banners grid / settings form on first fetch (today there's no loading state at all — the page just renders empty until data arrives).
- Empty: existing "No banners" copy, restyled; new empty states for SEO/Pages/Media.
- Error: today errors only go to `console.error` — restyle adds a visible inline error (still no new logic — just rendering the `catch` path that already exists but is currently silent).
- Unsaved changes: save bar visibility tracks a dirty flag derived from comparing `settings` to last-fetched snapshot — new local UI state only, not persisted, not business logic.

## 7. Responsive & accessibility
- Rail collapses to a horizontal scrollable tab strip under `md` breakpoint (mirrors what `AdminLayout`'s own sidebar already does at the app level).
- All interactive elements keep visible focus rings (`focus:border-stitch-accent` already used throughout); toggle switches get `aria-checked`; modal gets focus trap + `Escape` to close (not present today).

## 8. Open Questions — need your decision before any code

1. **SEO / Pages / Media Library — build now as visible-but-inert, or hide the rail entries until backend work lands?**
   - *Option A (build inert):* Rail items exist now, each opens a real empty-state screen clearly labeled "Not connected — no backend yet." Matches Shopify/Webflow's pattern of showing the full IA even before every part is wired.
   - *Option B (hide entirely):* Don't add these rail items until there's a real API. Strictest reading of "never show fake functionality" and "do not change functionality."
2. **The 4 dead social fields (tiktok/threads/linkedin/pinterest)** — remove them from this pass, or keep them visible with a "not saved yet" note?
3. **Banner reorder/edit** — the backend already supports `PATCH /cms/banners/:id` (including `displayOrder`) but the current app never calls it. Wire it up as part of this visual pass (a real, if small, functionality addition), or leave banners create/delete-only exactly as today?
4. **Newsletter subscribe** (`POST /cms/subscribe`) — surface it anywhere in this redesign, or leave it completely alone (out of scope) since nothing today references it?
5. **File split** — approve decomposing `CmsManager.tsx` into the component list in Section 5 (same route, same default export, same hooks/state), rather than a single-file rewrite?

---

## 9. Explicitly out of scope (unchanged by this work)
- `AdminContext.tsx`, `useAdminContext`, all fetch URLs/payloads/methods, RBAC/`RequirePermissions` gates, the `/cms` route itself, `AdminLayout`, the 6-theme token contract, and every other admin page.
