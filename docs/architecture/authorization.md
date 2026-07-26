# Enterprise Authorization Flow & Middleware Architecture

## 1. Complete Request Flow
Every inbound request to the D4U ERP backend undergoes a strict, multi-stage lifecycle before reaching any business logic. The upstream Authentication layer (which proves identity and issues the JWT) is defined in the [Enterprise Authentication Architecture](file:///g:/RESTAURANT_POS_WITH_BACKEND/docs/architecture/authentication.md).

1. **Request**: The HTTP request hits the API Gateway / NestJS boundary with `Authorization: Bearer <JWT>` and target headers (e.g., `x-brand-id`, `x-store-id`).
2. **Authentication (JwtAuthGuard)**: Validates token signature, expiration, and ensures the user is not globally suspended.
3. **JWT Validation & Unpacking**: Extracts the `user_id` and an array of `UserAssignment` IDs from the token payload.
4. **UserAssignment Resolution**: For the specific `[target_brand, target_store]` requested, the system filters the extracted `UserAssignments` to find those that are currently `ACTIVE` and match the target scope.
5. **Role & Inheritance Resolution**: For the matching assignments, the associated `Role` IDs are retrieved. If `RoleInheritance` applies, child `Role` IDs are recursively aggregated.
6. **Permission Resolution (Cache)**: The system fetches the flattened list of granted permissions (e.g., `pos.orders.void`) for the aggregated roles from the Redis cache.
7. **Workspace Scope Validation**: Confirms the user's active assignments explicitly grant access to the `target_store_id` or `target_brand_id`.
8. **Permission Match (PermissionsGuard)**: Checks if the required permission (defined by `@RequirePermissions`) exists in the resolved permission list.
9. **Business Rule Validation**: Service-level validation (e.g., checking if the order is already voided).
10. **Controller -> Service -> Database**: Execution of the requested action.
11. **Audit Logging**: Asynchronous recording of the high-risk action or failed authorization.

## 2. Middleware & Guard Responsibilities

### Authentication (JwtAuthGuard)
- Verifies token cryptography.
- Handles Token refresh signals.
- Rejects malformed or expired tokens (`401 Unauthorized`).

### Authorization (PermissionsGuard)
- Intercepts requests utilizing the `@RequirePermissions` decorator.
- Extracts requested module, resource, and action.
- Executes the permission resolution logic against the user's cached assignment matrix.

### Workspace Validation (ScopeGuard)
- Extracts `store_id` or `brand_id` from the URL, body, or headers.
- Ensures the user holds a valid `UserAssignment` for that specific scope.
- Prevents cross-branch privilege escalation (`403 Forbidden`).

### Request Context Middleware
- Attaches the resolved `User` and `ActiveScope` objects to the Express Request object, allowing Controllers to easily access `req.user.id` and `req.scope.store_id`.

## 3. Caching Strategy
Permissions are evaluated on every single request. To maintain sub-10ms overhead, Redis is utilized.

- **Redis Key Structure**: `rbac:user:{user_id}:assignments` -> Stores a hash of assignment IDs and their flattened permission arrays.
- **Cache Hit**: Permissions are read directly from memory.
- **Cache Miss**: Fallback to PostgreSQL. The DB computes the flattened permissions via joins (`UserAssignment` -> `Role` -> `RolePermission` -> `Permission`) and writes the result back to Redis.
- **Invalidation Strategy**: 
  - When an Admin modifies a `Role` or `RolePermission`, a system-wide invalidation event clears all `rbac:user:*` keys associated with that role.
  - When HR alters a `UserAssignment`, only that specific `rbac:user:{user_id}` key is evicted.
- **JWT Refresh Behaviour**: JWTs contain `Assignment` IDs, not permissions. Changing permissions instantly takes effect via Redis invalidation without requiring the user to log out and receive a new JWT.

## 4. Failure Handling Matrix

| Scenario | System Response | Audit Action |
|---|---|---|
| Expired JWT | `401 Unauthorized` | None |
| Disabled User | `401 Unauthorized` | Log Access Denied |
| Inactive/Expired Assignment | Assignment Ignored -> `403 Forbidden` | None |
| Branch / Brand Mismatch | `403 Forbidden` | Log Privilege Escalation Attempt |
| Missing Permission | `403 Forbidden` | Log Privilege Escalation Attempt |
| Role Conflict | Union Merge (Additive). No Conflict. | None |
| Cache Miss | DB Fallback, Rehydrate Cache | None |
| Redis Offline | Degraded Mode (Direct DB Query) | Alert DevOps |
| Database Offline | `503 Service Unavailable` | Alert DevOps |

## 5. Audit Strategy
Compliance and security require strict event logging. The `AuditLog` service intercepts:
- **Permission Denied (403)**: Logged with `user_id`, `attempted_action`, and `target_scope`.
- **Permission Granted (High Risk)**: Actions like `.delete`, `.void`, `.export` are logged upon successful completion (`200 OK`).
- **Role/Assignment Changed**: Any mutation to `RolePermission` or `UserAssignment` is logged, recording the Admin (`created_by` / `updated_by`) who made the change.

## 6. Security & Performance Recommendations
- **Default Deny**: All backend endpoints must implicitly deny access unless decorated.
- **JWT Size Limits**: Do not embed full permission arrays inside the JWT to prevent HTTP Header bloat and token truncation.
- **No Wildcards in DB**: Avoid `*` permissions in the database. Expand wildcards at assignment/seed time to ensure explicit evaluation arrays in Redis.
- **Fail Closed**: If Redis and the Database are both unreachable during a permission check, the system must fail closed (`503/403`) rather than defaulting to `Allow`.

## 7. Future Compatibility
The decoupled nature of the Request Context Middleware ensures that when new platforms (e.g., GraphQL or WebSockets) are introduced, the core authorization engine (Cache + Assignments) remains identical. Only the extraction layer (Headers vs. WebSocket context) changes.
