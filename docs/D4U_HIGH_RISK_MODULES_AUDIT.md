# D4U Enterprise Architecture v3 - High-Risk Module Audit

## 1. Executive Summary

- **Total Remaining Endpoints:** 16
- **Total Remaining `@Body() any` Usages:** 12
- **Total Remaining Inline Object Payloads:** 4
- **New Un-Audited Controllers Discovered:** None (The footprint remains exactly as predicted in TASK-212).

---

## 2. Remaining Modules Grouped by Risk

### 🔴 CRITICAL RISK
These modules handle authentication, core revenue, and complex offline syncing.

#### Module: `core/auth`
| Controller | Route | Method | Current Body Type | Recommended DTO Filename |
|------------|-------|--------|-------------------|--------------------------|
| `auth.controller.ts` | `/auth/login` | POST | Inline `{ phone: string; pin: string }` | `login.dto.ts` |

#### Module: `core/terminal`
| Controller | Route | Method | Current Body Type | Recommended DTO Filename |
|------------|-------|--------|-------------------|--------------------------|
| `terminal.controller.ts` | `/terminal/login` | POST | Inline `{ pin: string }` | `terminal-login.dto.ts` |
| `terminal.controller.ts` | `/terminal/generate` | POST | Inline `{ store_id: number; waiter_name: string }` | `generate-pin.dto.ts` |

#### Module: `business/pos-orders`
| Controller | Route | Method | Current Body Type | Recommended DTO Filename |
|------------|-------|--------|-------------------|--------------------------|
| `pos-orders.controller.ts` | `/pos-orders` | POST | `any` | `create-order.dto.ts` |
| `pos-orders.controller.ts` | `/pos-orders/:id/void` | PATCH | `any` | `void-order.dto.ts` |
| `pos-orders.controller.ts` | `/pos-orders/:id/settle` | PATCH | `any` | `settle-order.dto.ts` |
| `pos-orders.controller.ts` | `/pos-orders/sync-offline` | POST | Inline `{ orders: any[] }` | `sync-offline.dto.ts` |

---

### 🟠 HIGH RISK
These modules handle external web/customer inputs, multi-tenancy, and high-frequency real-time payloads.

#### Module: `business/online-orders`
| Controller | Route | Method | Current Body Type | Recommended DTO Filename |
|------------|-------|--------|-------------------|--------------------------|
| `online-orders.controller.ts` | `/online-orders` | POST | `any` | `create-online-order.dto.ts` |
| `online-orders.controller.ts` | `/online-orders/:id/status` | PATCH | `any` | `update-online-status.dto.ts` |
| `online-orders.controller.ts` | `/online-orders/:id/feedback` | POST | `any` | `post-feedback.dto.ts` |

#### Module: `business/rider`
| Controller | Route | Method | Current Body Type | Recommended DTO Filename |
|------------|-------|--------|-------------------|--------------------------|
| `rider.controller.ts` | `/rider/gps` | POST | `any` | `update-gps.dto.ts` |
| `rider.controller.ts` | `/rider/dispatch` | POST | `any` | `dispatch-order.dto.ts` |

#### Module: `core/subscription`
| Controller | Route | Method | Current Body Type | Recommended DTO Filename |
|------------|-------|--------|-------------------|--------------------------|
| `subscription.controller.ts` | `/subscription/onboarding` | POST | `any` | `onboard-client.dto.ts` |
| `subscription.controller.ts` | `/subscription` | PATCH/POST | `any` | `update-subscription.dto.ts` |

---

### 🟡 MEDIUM RISK
Internal admin-only modules, less prone to external attack vectors but still required for global validation readiness.

#### Module: `core/saas-package`
| Controller | Route | Method | Current Body Type | Recommended DTO Filename |
|------------|-------|--------|-------------------|--------------------------|
| `saas-package.controller.ts` | `/saas-package` | POST | `any` | `create-saas-package.dto.ts` |
| `saas-package.controller.ts` | `/saas-package/:id` | PATCH | `any` | `update-saas-package.dto.ts` |

---

## 3. Recommended Execution Order & Justification

1. **`core/auth` & `core/terminal`**
   - **Reason:** Authentication boundaries. These are the absolute most critical entry points to the application. If they break due to validation pipe issues later, the entire system is inaccessible.
2. **`business/pos-orders`**
   - **Reason:** Core revenue driver. The `sync-offline` endpoint relies heavily on massive, nested payloads. We need to tackle this before any global `ValidationPipe` enforcement is activated.
3. **`business/online-orders` & `business/rider`**
   - **Reason:** Handles external, potentially dirty data from customer applications and rider GPS devices. Very high risk of payload malformation.
4. **`core/subscription` & `core/saas-package`**
   - **Reason:** Lower priority since these are internal back-office endpoints, but they must be completed to reach 100% compliance.
