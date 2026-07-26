# Staff Architecture & Entity Review

## 1. Purpose
This document outlines the foundation of the Staff Entity (Users) within the D4U ERP, focusing on its data structure, workspace integration, and future preparedness for Hybrid Context-Aware RBAC.

## 2. Entity Structure (User Model)
The `User` model has been upgraded from a basic POS login system to an enterprise-ready employee ledger.

### Base Fields:
- `id` (Int): Primary Key.
- `name` (String): Full Name.
- `phone` (String): Unique identifier and POS login.
- `hashedPin` (String): Offline POS authentication hash.

### Enterprise Fields (Added in EWO-R005):
- `emp_id` (String): Official Employee ID (e.g., EMP-001).
- `email` (String): Corporate communication.
- `designation` (String): Job Title (e.g., "Head Chef").
- `status` (String): Employment status (`ACTIVE`, `SUSPENDED`, `TERMINATED`).
- `joining_date` (DateTime): For HR tenure tracking.
- `notes` (String): Internal HR comments.

## 3. Workspace Integration & Data Flow
The Staff module natively respects the Global Workspace Context:
1. **Frontend Flow**: `StaffPermissions.tsx` extracts `activeBrandId` and `selectedBranchId` from `useAdminContext()`.
2. **API Request**: The frontend dynamically constructs the fetch URL (e.g., `/users?brand_id=1&store_id=5`).
3. **Backend Filter**: `users.controller.ts` routes the request to the correct Prisma query, returning only the staff relevant to the active workspace. This completely replaces the previous anti-pattern of fetching all staff and filtering them client-side.

## 4. Future RBAC Compatibility (Gap Analysis)
While the *data structure* is now enterprise-ready, the *relational structure* requires one more major refactor before deploying Hybrid Context-Aware RBAC.

**Current Limitation:**
The `User` model directly stores a single `role_id`, `brand_id`, and `store_id`. Because `phone` is `@unique`, a single employee cannot currently operate as a "Store Manager" at Branch A and a "Cashier" at Branch B simultaneously. 

**Recommended Future Architecture (RBAC Implementation):**
To achieve Hybrid RBAC, the system must eventually detach `role_id`, `brand_id`, and `store_id` from the `User` model, and move them into a one-to-many `UserAssignment` relational table:
```prisma
model UserAssignment {
  id       Int
  user_id  Int
  role_id  Int
  brand_id Int?
  store_id Int?
}
```
This architecture will allow a single global Identity (User) to hold multiple overlapping context scopes.
