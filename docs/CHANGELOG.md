## [Unreleased] - EWO-RST-003 (Inventory Production Ready)
### Added
- `prisma/schema.prisma`: Extended `Product` with `barcode`, `description`, `internal_notes`. Extended `ProductVariant` with `sku`, `barcode`, `cost`. Extended `InventoryItem` with `sku`, `barcode`, `max_stock`.
- `d4u-pos-backend`: Added `POST /inventory/adjust`, `GET /inventory/items/:id/history`, and `GET /inventory/low-stock/:store_id` endpoints. Added safe transaction deletion handling in `deleteInventoryItem`.
- `d4u-admin/src/pages/InventoryManager.tsx`: Added real-time material search input, stock purchase, and unit management.
### Regression
- `npx tsc --noEmit` PASS (0 errors in frontend & backend).
- `POST /inventory/adjust`, `GET /inventory/low-stock/1`, and `GET /inventory/items/id/history` verified via live API tests.

## [Unreleased] - EWO-RST-002 (Branch-Level Suspension & Lifecycle Management)
### Added
- `prisma/schema.prisma`: Extended `Store` model with `status` (`ACTIVE`, `SUSPENDED`, `MAINTENANCE`, `RECYCLED`), `status_reason`, `status_changed_by`, `status_changed_at`, `resume_at`.
- `d4u-pos-backend`: Added `PATCH /stores/:id/lifecycle` endpoint and `updateStoreLifecycle` method in `StoresService`.
- `d4u-admin/src/pages/HQOverview.tsx`: Removed operational Suspend button from Brand header card. Implemented Branch-level Status Badges (Green/Yellow/Blue/Red), Suspend/Resume toggle, Maintenance Mode toggle, and Recycle Bin action on every Branch card.
### Regression
- `npx tsc --noEmit` PASS (0 errors frontend & backend).
- `PATCH /stores/1/lifecycle` (SUSPENDED -> ACTIVE) live API verified.

## [Unreleased] - EWO-I001 (Enterprise Authentication Implementation Phase 1)
### Added
- `prisma/schema.prisma`: Added `RefreshToken` model with `user_id`, `token_hash`, `device_id`, `session_id`, `is_revoked`, `expires_at` for multi-device session management.
- `src/modules/core/auth/dto/session.dto.ts`: New `RefreshTokenDto` and `SelectWorkspaceDto`.
### Changed
- `src/modules/core/auth/auth.service.ts`: Full refactor — new JWT payload (`sub`, `assignment_ids[]`, `active_assignment_id`, `session_id`, `device_id`). No permissions or roles embedded. Refresh token rotation via `RefreshToken` table with token theft detection (reuse triggers full session revocation). Multi-device support.
- `src/modules/core/auth/auth.controller.ts`: Added `POST /auth/select-workspace`, `POST /auth/revoke-sessions/:userId`. Updated refresh/logout to accept `device_id`.
### Regression
- Login: PASS
- Refresh Rotation: PASS
- Token Reuse Rejection (Theft Detection): PASS
- TypeScript: PASS (0 errors)
- Backend Boot: PASS

## [Unreleased] - EWO-R012 (Enterprise Authentication Integration Architecture)
### Added
- Created `docs/architecture/authentication.md` defining the complete login flow, JWT structure, session lifecycle, multi-assignment workspace selection, and security model.
### Changed
- Updated `docs/architecture/authorization.md` to reference the upstream Authentication Architecture.
- Updated `docs/architecture/identity.md` to reference the Authentication and Authorization flows.
- Architecture review completed (No code, JWT, login, or frontend changes made).

## [Unreleased] - EWO-R011 (Enterprise Authorization Flow & Middleware Architecture)
### Added
- Created `docs/architecture/authorization.md` defining the complete request lifecycle, middleware responsibilities, Redis caching strategy, failure handling matrix, and audit requirements.
### Changed
- Updated `docs/architecture/rbac.md` to reference the authorization flow architecture.
- Updated `docs/architecture/identity.md` to reference the authorization flow and caching documents.
- Architecture review completed (No code, middleware, or guards implemented).

## [Unreleased] - EWO-R010 (Enterprise RBAC Seed Implementation)
### Added
- Created `prisma/seed-rbac.ts`: Idempotent RBAC seeding engine (Permission Groups, Permissions, Roles, RolePermission junctions).
- Created `docs/architecture/rbac-seeding.md`: Seeding architecture, idempotency guarantees, rollback strategy.
### Changed
- Updated `prisma/seed.ts` to call `seedRbac()` as the first step, making it the canonical boot sequence.
- Updated `docs/architecture/database-rbac.md`: Phase 2 marked as COMPLETED.
- Updated `docs/architecture/permission-library.md`: Seed statistics logged.
### Seed Results
- PermissionGroups: 14 | Permissions: 84 | Roles: 25 | RolePermissions: 278
- Idempotency: Verified (Run 1 = Run 2, zero duplicate rows).

## [Unreleased] - EWO-R009 (Enterprise Permission Library & Seed Architecture)
### Added
- Created `docs/architecture/permission-library.md` establishing the master permission catalogue, permission groups, default role matrix, and high-risk permission classifications.
### Changed
- Updated `docs/architecture/permissions.md` and `docs/architecture/rbac.md` to reference the permission library and seed strategy.
- Architecture and seed strategy completed (No code or authorization implementation).

## [Unreleased] - EWO-R008 (Enterprise RBAC Database Foundation)
### Added
- Created `docs/architecture/database-rbac.md` outlining the Phase 1 relational schema foundation.
- Added `PermissionGroup`, `Permission`, `RolePermission`, `UserAssignment`, and `RoleInheritance` models to `schema.prisma`.
### Changed
- Preserved legacy fields in `User` and `Role` to maintain backward compatibility during Phase 1.

## [Unreleased] - EWO-R007 (Enterprise Permission Architecture)
### Added
- Created `docs/architecture/permissions.md` outlining naming conventions, caching, auditing, and conflict resolution.
### Changed
- Updated `docs/architecture/rbac.md` and `docs/architecture/identity.md` to reference the final permission model.
- Architecture review completed (No implementation).

## [Unreleased] - EWO-R006 (Enterprise Identity Architecture)
### Added
- Created `docs/architecture/identity.md` outlining the future `UserAssignment` entity.
### Changed
- Updated `docs/architecture/rbac.md` to incorporate Identity assignment decoupling.
- Finalized Architecture (No implementation, strictly design).

## [Unreleased] - EWO-R005 (Staff Foundation Recovery)
### Added
- Enterprise entity fields to `User` model (`emp_id`, `email`, `designation`, `status`, `joining_date`, `notes`).
### Changed
- Refactored `StaffPermissions.tsx` to natively use Workspace Context for API fetching, removing client-side filtering.
- Updated `users.controller.ts` and `users.service.ts` to respect `brand_id` and `store_id`.

## [Unreleased] - EWO-R003 (CRM Foundation Recovery)
### Changed
- Fixed `CustomersManager.tsx` to dynamically consume Workspace Context (`activeBrandId`, `selectedBranchId`).
- Modified `CustomersController` and `CustomersService` to accept and filter by `store_id` (via `Order` relations).

## [Unreleased] - EWO-R002 (Workspace Integration Audit)
### Added
- Completed Workspace Integration Audit Matrix and appended to `ENTERPRISE_RECOVERY.md`.
- Identified CRM (Hardcoded context) and Website CMS (Local selector) as failing modules.

## [Unreleased] - EWO-R001 (Workspace Recovery)
### Added
- Reintegrated `GlobalHeader` into `App.tsx`'s `AdminLayout` wrapper.
- Restored Global Workspace Context (Brand/Branch switcher and Status).



## [Unreleased] - AUDIT FIX SPRINT-001
### Added
- Global JwtAuthGuard and PermissionsGuard.
- Security decorators (@Public, @RequirePermissions, @CurrentUser).
### Changed
- Protected all 54 endpoints globally in AppModule.


## [Unreleased] - AUDIT FIX SPRINT-001B
### Added
- Bcrypt hashing with Lazy Migration.
- ThrottlerGuard for rate limiting /auth/login.
- Refresh token rotation and DB revocation.
