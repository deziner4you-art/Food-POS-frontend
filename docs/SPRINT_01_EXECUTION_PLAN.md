# Title: D4U Sprint 1 Execution Plan
**Version:** 3.0
**Last Updated:** July 2026
**Purpose:** The official execution playbook for Sprint 1 (Foundation & Safe Preparation).
**Dependencies:** D4U_PROJECT_AUDIT_AND_REFACTOR_PLAN.md
**Related Documents:** D4U_IMPLEMENTATION_MASTER_ROADMAP.md
**Author:** AI Engineering Manager
**Status:** FINAL

---

## 1. Sprint Objective

The sole objective of Sprint 1 is to safely prepare the existing D4U codebase for the upcoming Enterprise v3 architecture without introducing a single point of production risk. We are laying the foundation, organizing the garage, and sharpening the tools before we start dismantling the engine. Zero downtime, zero broken features.

---

## 2. Sprint Scope

**Included Work:**
- Creating a shared packages architecture (Monorepo readiness).
- Extracting static TypeScript interfaces and DTOs.
- Extracting pure utility functions (e.g., date formats, currency parsers).
- Reorganizing the backend folder structure (`src/modules`) without touching the code inside them.
- Standardizing Linter and Prettier configurations across all 5 apps.

**NOT Included Work (Forbidden in Sprint 1):**
- Modifying Business Logic.
- Modifying Database Schema (No Prisma changes).
- Altering REST API inputs/outputs.
- Touching Socket.io / KDS listeners.
- Touching the Offline Sync Engine (Dexie).
- Modifying any React component rendering or state.

---

## 3. Sprint Tasks

### TASK-101: Initialize Shared Packages Architecture
- **Objective:** Create the foundational directories for shared code.
- **Reason:** To prevent future code duplication across the 5 apps.
- **Risk Level:** Extremely Low.
- **Estimated Time:** 2 Hours.
- **Dependencies:** None.
- **Expected Result:** `packages/shared-types`, `packages/shared-utils`, and `packages/shared-ui` exist with basic `package.json` files.

### TASK-102: Extract Backend Types
- **Objective:** Move static TypeScript interfaces from `d4u-pos-backend` to `shared-types`.
- **Reason:** Frontends currently duplicate backend DTO definitions.
- **Risk Level:** Low.
- **Estimated Time:** 4 Hours.
- **Dependencies:** TASK-101.
- **Expected Result:** Backend imports its types from `@d4u/shared-types`. No API behavior changes.

### TASK-103: Extract Frontend Types
- **Objective:** Consolidate types from `d4u-admin`, `pos-client`, `website`, and `rider` into `shared-types`.
- **Reason:** To ensure a single source of truth for entities like `Order` and `Product`.
- **Risk Level:** Low.
- **Estimated Time:** 4 Hours.
- **Dependencies:** TASK-101.
- **Expected Result:** Redundant type files are deleted; all frontends import from `@d4u/shared-types`.

### TASK-104: Extract Pure Utilities
- **Objective:** Move pure, stateless formatting functions (currency, dates, tax math) into `shared-utils`.
- **Reason:** Eliminates fragmented math bugs across platforms.
- **Risk Level:** Low.
- **Estimated Time:** 3 Hours.
- **Dependencies:** TASK-101.
- **Expected Result:** Applications import `formatCurrency` from `@d4u/shared-utils`.

### TASK-105: Backend Folder Restructuring (Non-Destructive)
- **Objective:** Create `src/modules`, `src/common`, `src/config` and move existing folders into them.
- **Reason:** Prepares the backend for the Modular Monolith blueprint.
- **Risk Level:** Low.
- **Estimated Time:** 4 Hours.
- **Dependencies:** None.
- **Expected Result:** Imports are updated to reflect the new paths. Zero changes to the logic inside the files.

### TASK-106: Linter and Prettier Synchronization
- **Objective:** Enforce identical code style rules across all repositories.
- **Reason:** Standardizes PRs and reduces cognitive load during cross-app refactoring.
- **Risk Level:** Zero.
- **Estimated Time:** 2 Hours.
- **Dependencies:** None.
- **Expected Result:** `npm run lint` passes across the entire monorepo with uniform rules.

---

## 4. Files Allowed To Change

- `package.json` (Across all apps).
- `tsconfig.json` (Across all apps).
- `eslint.config.js` / `.prettierrc`.
- Type definition files (`*.types.ts`, `*.interface.ts`, `dto.ts`).
- Utility files (`utils.ts`, `helpers.ts`, `formatters.ts`).
- Import statement paths at the top of files (ONLY to point to the new shared packages or restructured folders).

---

## 5. Files Forbidden

**UNDER NO CIRCUMSTANCES MUST THESE BE TOUCHED IN SPRINT 1:**

- `d4u-pos-backend/prisma/schema.prisma`
- `d4u-pos-backend/src/app.gateway.ts` (Socket Layer)
- `d4u-pos-backend/src/main.ts`
- `d4u-pos-client/src/App.tsx` (POS Engine)
- `d4u-pos-client/src/db.ts` (Offline Sync Engine)
- `d4u-admin/src/pages/SetupWizard.tsx` (SaaS Logic)
- Any file containing `useState` or `useEffect` hooks.
- Any NestJS `*.service.ts` file containing business logic or Prisma queries (other than updating import paths).

---

## 6. Acceptance Criteria

Sprint 1 is considered **COMPLETE** when:
1. The `packages/` directory exists and is integrated into the workspace.
2. The Backend `src/` directory matches the `modules/`, `common/`, `config/` layout.
3. No business logic, APIs, or database schemas have been altered.
4. All 5 applications compile, build, and start successfully locally.

---

## 7. Testing Checklist

To verify nothing has broken, the following MUST pass:
- [ ] **Build:** Run `npm run build` in all 5 applications. All must succeed.
- [ ] **Lint:** Run `npm run lint`. Zero errors.
- [ ] **Unit Tests:** Run existing Jest tests. 100% pass rate.
- [ ] **Manual Smoke Test:** Start the backend and POS client. Process exactly 1 Cash Order and 1 Card Order. Verify the database saves the order correctly.

---

## 8. Rollback Plan

If a task fails (e.g., circular dependencies break the build after extracting types):
1. **Stop execution immediately.** Do not attempt to "hack" a fix.
2. Revert the specific git commit related to that task.
3. Run `npm install` to reset the workspace symlinks.
4. Re-run the Testing Checklist to verify the baseline is stable before trying the task again.

---

## 9. Code Review Checklist

Before merging any Sprint 1 task:
- [ ] **Coding Standards:** Does it adhere to the strict TypeScript V3 guidelines?
- [ ] **Naming:** Are types PascalCase and utils camelCase?
- [ ] **Folder Structure:** Are the new files exclusively in the permitted `packages/` or updated `modules/` folders?
- [ ] **No Duplicated Code:** Have we ensured the extracted type is no longer duplicated in the source app?
- [ ] **No Breaking Imports:** Do all imports resolve correctly?
- [ ] **No Circular Dependency:** Did extracting this type/util introduce a circular import loop?

---

## 10. Sprint Exit Criteria

Sprint 2 (which will begin the actual structural logic refactoring) can ONLY begin when:
- Sprint 1 Acceptance Criteria are 100% verified.
- The `main` branch passes all CI checks.
- A full database backup of Production has been verified.
- The CTO gives explicit approval to proceed to medium-risk work.

***End of Document.***
