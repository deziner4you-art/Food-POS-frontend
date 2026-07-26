# Enterprise Authentication Integration Architecture

> **Separation of Concerns**
> - **Authentication** = WHO the user is (Identity Proof)
> - **Authorization** = WHAT the user may do (Permission Evaluation)
> - **Workspace** = WHERE the user may operate (Scope Enforcement)
> These three responsibilities are completely independent and must never bleed into each other.

> [!IMPORTANT]
> **EWO-I001 Implementation Status**: COMPLETE. The Authentication service, refresh token rotation, multi-device session management, and token theft detection are fully implemented and regression-verified.

---

## 1. Authentication Flow
The authentication system proves identity only. It does not evaluate permissions or determine workspace scope.

```
Client: POST /auth/login { phone, pin }
  ↓
Rate Limiting Guard (ThrottlerGuard)
  ↓
Credential Verification:
  - Lookup User by phone
  - Compare pin against bcrypt hashedPin
  - Check User.status = ACTIVE
  ↓
Identity Confirmed → Identity Service
  ↓
Assignment Lookup:
  - Fetch all ACTIVE UserAssignment records for this user
  - If count = 0 → 401 Unauthorized (No active assignment)
  ↓
Workspace Selection (see Section 5)
  ↓
JWT Generation:
  - Access Token (short-lived)
  - Refresh Token (long-lived, stored in DB)
  ↓
Response: { access_token, refresh_token, active_workspace }
```

---

## 2. JWT Structure

### Access Token Payload
```json
{
  "sub": 123,                      // user_id
  "name": "Ali Manager",            // Display name (for frontend)
  "assignment_ids": [5, 12, 31],    // Active UserAssignment IDs
  "active_assignment_id": 12,       // The currently selected workspace context
  "active_brand_id": 2,             // Resolved from active_assignment_id
  "active_store_id": 7,             // Resolved from active_assignment_id
  "session_id": "uuid-v4",          // For forced logout / revocation
  "device_id": "uuid-v4",           // For concurrent session management
  "iat": 1700000000,
  "exp": 1700003600                 // Short-lived: 1 hour
}
```
> **Key Rule**: No permission strings are embedded in the JWT. Permissions are resolved at request time from Redis / DB. This ensures permission changes take effect immediately without requiring re-login.

### Refresh Token
```json
{
  "sub": 123,
  "session_id": "uuid-v4",
  "device_id": "uuid-v4",
  "iat": 1700000000,
  "exp": 1700604800                 // Long-lived: 7 days
}
```
- Stored as a hashed value in the `RefreshToken` DB table.
- One active token per device session.
- Token Rotation: Every refresh call issues a new Refresh Token and revokes the old one.

---

## 3. Session Lifecycle

| Event | Behavior |
|---|---|
| Login | Issue Access Token + Refresh Token. Create `RefreshToken` DB record. |
| Request | Access Token validated by JwtAuthGuard. No DB lookup for short-lived requests. |
| Access Token Expired | Client uses Refresh Token at `POST /auth/refresh`. |
| Refresh Call | Validate Refresh Token. Verify it exists and is not revoked in DB. Issue new token pair. Rotate (revoke old). |
| Logout | Mark `RefreshToken` DB record as revoked. The Access Token expires naturally. |
| Forced Logout | Admin triggers `session_id` revocation. All Refresh Tokens for that `session_id` are revoked. Access Token expires within TTL (max 1 hour). |
| PIN Change | Revoke all `RefreshToken` records for the user. Force re-login on all devices. |
| Assignment Changed | Redis `rbac:user:{user_id}` cache is evicted. Permissions resolve correctly on next request. No re-login required unless `active_assignment_id` is the changed assignment. |

---

## 4. Multi-Assignment Workspace Selection Strategy

When a user holds multiple active `UserAssignment` records, the login flow must resolve which workspace becomes the `active_assignment_id` in the JWT:

### Resolution Order (Automatic)
1. **Remembered Workspace**: If the device has a stored preference (`device_id` mapped to a last-used `assignment_id`), use that automatically.
2. **Primary Assignment**: If no remembered workspace, select the `UserAssignment` where `is_primary = true`.
3. **First Available**: If no primary is flagged, select the first `ACTIVE` assignment ordered by `effective_from` descending.
4. **Manual Selection (UI)**: If the user has multiple assignments and none of the above are resolved (or the user explicitly requests it), the login response returns a `workspace_selection_required: true` flag along with a list of available assignments. The frontend presents a workspace picker. The user selects, and the client calls `POST /auth/select-workspace { assignment_id }` to receive a contextualized JWT.

### Example Scenario
| Assignment | Brand | Branch | Role |
|---|---|---|---|
| ID: 5 | Brand A | Branch 1 | Manager |
| ID: 12 | Brand A | Branch 2 | Cashier |
| ID: 31 | Brand B | (Brand-level) | Regional Manager |

- On first login: `workspace_selection_required: true` is returned with all 3 options.
- User selects Assignment ID 12. JWT is issued with `active_assignment_id: 12, active_store_id: [Branch 2 ID]`.
- On next login from the same device: Remembered workspace (ID 12) is selected automatically.
- User can switch workspace at runtime via `POST /auth/switch-workspace { assignment_id }` without full re-authentication.

---

## 5. Session Management

| Scenario | Strategy |
|---|---|
| **Single Device** | One active `RefreshToken` record per user. |
| **Multiple Devices** | One `RefreshToken` record per `device_id`. |
| **Concurrent Sessions** | Allowed by default. Admin can view active sessions and force-revoke individual ones. |
| **Forced Logout (Admin)** | Set `RefreshToken.is_revoked = true` for all records for the user. Access Token expires naturally within its TTL. |
| **Role/Assignment Changed** | Evict Redis permission cache for `user_id`. No re-login needed unless active assignment was the one changed. |

---

## 6. Security Model

| Threat | Mitigation |
|---|---|
| **Replay Attack** | Access tokens are short-lived (1h). Refresh tokens are single-use (rotated on every `/auth/refresh`). |
| **Token Theft (Refresh)** | Rotation detects reuse: if a revoked Refresh Token is presented, the server revokes ALL sessions for that user and triggers a security alert. |
| **Concurrent Refresh Race** | A DB-level unique constraint + transaction on Refresh Token ID prevents double-issuance. |
| **Brute Force** | ThrottlerGuard on `/auth/login` limits attempts per IP per minute. |
| **Device Trust** | `device_id` is a client-generated UUID stored in secure storage. Future phases can implement device fingerprinting and trust scoring. |

---

## 7. Refresh Token Strategy
1. **Client calls** `POST /auth/refresh { refresh_token }`.
2. Backend verifies the hash of the Refresh Token exists in DB and `is_revoked = false`.
3. Backend marks the current Refresh Token as `is_revoked = true` (rotation).
4. Backend issues a new Access Token + a new Refresh Token.
5. The new Refresh Token is stored in DB.
6. Atomic DB transaction ensures no token is ever used twice.

---

## 8. Future Compatibility
- **OAuth / SSO**: The `session_id` and `device_id` pattern is compatible with OAuth device flows.
- **WebAuthn / Biometrics**: The PIN verification step can be replaced/supplemented with platform authenticators without changing any downstream authorization logic.
- **Multi-Factor Authentication**: An `mfa_verified` boolean can be added to the JWT payload. Sensitive endpoints can require `mfa_verified: true` via a dedicated decorator without changing the core RBAC flow.
