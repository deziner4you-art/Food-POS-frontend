# Enterprise RBAC Seed Architecture

## 1. Overview
This document defines the seeding strategy and execution plan for the Enterprise RBAC Permission Library. The seed system populates the `PermissionGroup`, `Permission`, `Role`, and `RolePermission` tables as the Single Source of Truth for all access control, while maintaining backward compatibility with the legacy `Role.permissions` JSON column.

## 2. Seed Files

| File | Purpose |
|---|---|
| `prisma/seed-rbac.ts` | Modular RBAC seeding engine — Permission Groups, Permissions, Roles, RolePermission junctions |
| `prisma/seed.ts` | Main seed orchestrator — calls `seedRbac()` first, then creates demo data |

## 3. Execution & Idempotency

The seed script can be run at any time without risk of duplicates. All operations use Prisma `upsert` keyed on unique constraints:

| Table | Upsert Key |
|---|---|
| `PermissionGroup` | `module_name` |
| `Permission` | `group_id + resource + action` |
| `Role` | `name` (with sequence sync before creation) |
| `RolePermission` | `role_id + permission_id` |

Run command:
```bash
npx ts-node prisma/seed.ts
```

## 4. Verified Seed Statistics (Run 1 & Run 2 Identical)

| Entity | Count |
|---|---|
| Permission Groups | 14 |
| Atomic Permissions | 84 |
| Enterprise Roles | 25 (26 including legacy "Waiter") |
| RolePermission Junctions | 278 |

## 5. Source of Truth Hierarchy

> [!IMPORTANT]
> `RolePermission` is the **Single Source of Truth** for access control (ADR-008).
> `Role.permissions` (JSON) is a **read-only backward compatibility layer** populated by the seed script.
> No future business logic should write to or read from `Role.permissions` for authorization decisions.

## 6. Rollback Strategy
If the seed causes unexpected issues:
1. The seed only performs `upsert` — no destructive deletes on core tables.
2. To reset RBAC tables cleanly:
   ```bash
   npx ts-node -e "require('@prisma/client'); ..."
   ```
   Or use Prisma Studio to manually truncate `RolePermission`, `Permission`, `PermissionGroup`.
3. Core data (`User`, `Order`, `Brand`, `Store`) is completely unaffected.

## 7. Future Expansion
To add a new module's permissions:
1. Add a new entry to `groupsData` in `seed-rbac.ts`.
2. Add atomic permission entries to `permissionsData` following the `module.resource.action` convention.
3. Add default role assignments to `rolePermissionAssignments` as needed.
4. Re-run `npx ts-node prisma/seed.ts` — the script is idempotent and will add only new entries.
