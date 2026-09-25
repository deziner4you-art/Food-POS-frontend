# D4U Engineering Architecture & Deployment Reference

==================================================
## 1. DOCUMENT PURPOSE
==================================================
This document serves as the permanent engineering reference for the D4U Restaurant POS project. It preserves the current engineering architecture, repository hierarchy, local development flow, Git workflow, GitHub Actions pipelines, deployment flow, VPS infrastructure, domains/subdomains, frontend applications, backend, database, PM2, Nginx/aaPanel, deployment safety rules, security remediation history, testing and verification, operational rules, and known limitations / pending work for future developers/agents.

This document must be treated as the single source of truth for the system architecture and deployment flow.

==================================================
## 2. SYSTEM OVERVIEW
==================================================
The D4U system is a comprehensive, multi-application Restaurant POS system.

Current applications include:
1. **POS Client**
2. **Admin Panel**
3. **Rider App**
4. **Website**
5. **NestJS Backend/API**

**Backend Architecture:**
- Framework: NestJS (`^11.0.1`)
- Database ORM: Prisma (`^5.22.0`)
- Database: PostgreSQL
- Real-time: Socket.IO (`^4.8.3`)

**Frontend Architecture (POS, Admin, Rider, Website):**
- Library: React (`^19.2.6`)
- Build Tool: Vite (`^8.0.12`)
- Language: TypeScript (`~6.0.2`)
- Styling: Tailwind CSS v4 (`^4.3.1`)

==================================================
## 3. MONOREPO / REPOSITORY HIERARCHY
==================================================
The repository uses a monorepo structure.

```text
Food-POS-frontend/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines
├── d4u-pos-backend/            # NestJS API, Prisma schema, and migrations
│   ├── prisma/
│   └── src/
├── d4u-pos-client/             # React/Vite POS application
│   ├── public/
│   └── src/
├── d4u-admin/                  # React/Vite Admin application
├── d4u-rider/                  # React/Vite Rider application
├── d4u-website/                # React/Vite Website application
├── docs/                       # Engineering documentation (including this file)
├── e2e-demo/                   # E2E Testing scripts/utilities
├── nginx-frontend-routes.conf  # Nginx routing configuration for SPAs
├── package.json                # Root package configurations
└── ...
```

==================================================
## 4. APPLICATION RESPONSIBILITIES
==================================================

### 1. POS Client
- **Purpose**: Primary terminal for taking orders, managing shifts, and kitchen communication.
- **Framework**: React + Vite
- **Development Command**: `npm run dev`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Base Path**: `/` (Root)
- **Production URL**: `https://pos.deziner4you.com/`

### 2. Admin Panel
- **Purpose**: Dashboard for enterprise/business management, analytics, and catalog setup.
- **Framework**: React + Vite
- **Development Port**: `5300`
- **Development Command**: `npm run dev`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Base Path**: `/admin/`
- **Production URL**: `https://pos.deziner4you.com/admin/`

### 3. Rider App
- **Purpose**: Mobile-optimized web app for delivery dispatch and fulfillment.
- **Framework**: React + Vite
- **Development Command**: `npm run dev`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Base Path**: `/rider/`
- **Production URL**: `https://pos.deziner4you.com/rider/`

### 4. Website
- **Purpose**: Customer-facing online ordering portal.
- **Framework**: React + Vite
- **Development Command**: `npm run dev`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Base Path**: `/website/`
- **Production URL**: `https://pos.deziner4you.com/website/`

### 5. Backend API
- **Purpose**: Core API, database interaction, real-time WebSocket broadcasting.
- **Framework**: NestJS
- **Development Port**: `3001`
- **Development Command**: `npm run start:dev`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Production URL**: `https://pos-api.deziner4you.com/`

*(Note: API configuration for frontends and authentication relationships are primarily handled via JWT tokens across these interconnected layers.)*

==================================================
## 5. LOCAL DEVELOPMENT FLOW
==================================================
The local development workflow follows standard Node.js practices for a monorepo setup:

```text
Developer
   ↓
Local repository clone
   ↓
Create/modify code in specific module (e.g., d4u-pos-backend)
   ↓
Run local dev servers (npm run start:dev / npm run dev)
   ↓
Test changes locally
   ↓
Git status
   ↓
Git diff
   ↓
Commit
   ↓
Push to working branch
   ↓
GitHub Actions (if applicable based on branch/tags)
```

- **Frontend Development**: Navigate to the respective frontend directory (e.g., `d4u-pos-client`), install dependencies (`npm ci`), and run `npm run dev`.
- **Backend Development**: Navigate to `d4u-pos-backend`, install dependencies (`npm ci`), run Prisma generate if needed, and start the development server with `npm run start:dev`.

==================================================
## 6. GIT / BRANCHING STRATEGY
==================================================
- **Repository**: `https://github.com/deziner4you-art/Food-POS-frontend.git`
- **Primary Working Branch**: `final-project-after-ahmed-suggestion-security-checks-and-improvements`

**Operational Rules:**
- Never push directly to `main` or `master` unless explicitly approved.
- Never force push.
- Changes should be reviewed before commit/push.
- Deployment-triggering branches/tags must be treated carefully.

**Deployment Trigger Distinction:**
- Pushing standard commits to the working branch triggers `deploy-pos.yml` (Backend + POS).
- Deploying the other frontends (Admin, Rider, Website) requires explicitly pushing specific **tags** (`deploy-d4u-admin-*`, `deploy-d4u-rider-*`, `deploy-d4u-website-*`).

==================================================
## 7. GITHUB ACTIONS DEPLOYMENT ARCHITECTURE
==================================================

### A) `deploy-pos.yml`
- **Name**: Deploy POS & Backend
- **Trigger**: `push` to the working branch.
- **Affected**: Backend API (`d4u-pos-backend`) and POS Client (`d4u-pos-client`).
- **Build Steps**: `npm ci`, `npx prisma generate`, `npm run test`, `npm run build`.
- **Deployment Method**: SCP via SSH.
- **Destination**: `/www/wwwroot/d4u-pos-backend/` & `/www/wwwroot/d4u-pos-client/`.
- **PM2 Handling**: Reloads `d4u-pos-backend`.
- **Validation/Health Check**: Validates `/system/ping` via `curl`.
- **Rollback Behavior**: Aborts if migration fails or health check fails; backs up live directory prior to SCP transfer.
- **Important Secrets**: `VPS_SSH_HOST_POS`, `VPS_SSH_USER_POS`, `VPS_SSH_KEY_POS`.

### B) `deploy-frontends.yml`
- **Name**: Deploy Frontends Safely
- **Trigger**: `push` on tags matching `deploy-d4u-admin-*`.
- **Affected**: Admin Panel (`d4u-admin`).
- **Build Steps**: `npm ci`, `npm run build`.
- **Deployment Method**: Zero-downtime directory swap via SSH (`_new` upload, then `mv`).
- **Destination**: `/www/wwwroot/d4u-admin/`.
- **Validation**: Verifies `index.html` exists before swapping directories.

### C) `deploy-d4u-rider.yml`
- **Name**: Deploy Rider App Safely
- **Trigger**: `push` on tags matching `deploy-d4u-rider-*`.
- **Affected**: Rider App (`d4u-rider`).
- **Build Steps**: `npm ci`, `npm run build`.
- **Deployment Method**: Zero-downtime directory swap via SSH.
- **Destination**: `/www/wwwroot/d4u-rider/`.
- **Validation**: Verifies `index.html` exists before swapping.

### D) `deploy-d4u-website.yml`
- **Name**: Deploy Website Safely
- **Trigger**: `push` on tags matching `deploy-d4u-website-*`.
- **Affected**: Website (`d4u-website`).
- **Build Steps**: `npm ci`, `npm run build`.
- **Deployment Method**: Zero-downtime directory swap via SSH.
- **Destination**: `/www/wwwroot/d4u-website/`.
- **Validation**: Verifies `index.html` exists before swapping.

==================================================
## 8. COMPLETE DEPLOYMENT FLOW
==================================================

```text
LOCAL MACHINE
    |
    | (Git push branch OR Git push tag)
    v
GITHUB REPOSITORY
    |
    | (GitHub Actions triggered based on branch/tag)
    v
GITHUB ACTIONS
    |
    | 1. Build application (npm ci && npm run build)
    | 2. Connect to VPS via SSH/SCP
    | 3. Upload artifacts (direct or to temporary _new directories for safe frontends)
    | 4. Swap directories / restart services (if backend)
    v
CONTABO VPS (62.169.23.170)
    |
    +--> Nginx (aaPanel managed)
    |       |--> Serves Static Frontends (POS, Admin, Rider, Website)
    |
    +--> PM2
    |       |--> Node.js (NestJS Backend API)
    |
    +--> PostgreSQL Database
    |
    v
LIVE DOMAINS
```
*Note: GitHub Actions acts strictly as the CI/CD deployment mechanism. The VPS serves the live application.*

==================================================
## 9. VPS INFRASTRUCTURE
==================================================
- **Host**: Contabo
- **IP**: 62.169.23.170
- **Control Panel**: aaPanel (Port: 17668)
- **Live Directories**:
  - Backend: `/www/wwwroot/d4u-pos-backend/` (Serves API via PM2)
  - POS: `/www/wwwroot/d4u-pos-client/` (Static frontend)
  - Admin: `/www/wwwroot/d4u-admin/` (Static frontend)
  - Rider: `/www/wwwroot/d4u-rider/` (Static frontend)
  - Website: `/www/wwwroot/d4u-website/` (Static frontend)

==================================================
## 10. NGINX ARCHITECTURE
==================================================
Nginx is managed via aaPanel. The SPA routing configuration for the sub-applications is defined in `nginx-frontend-routes.conf` and handles routing for subdirectories under the main domain.

**Base SPA Fallback (Main POS):**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Sub-App Routing (Admin, Rider, Website):**
Each sub-application has a dedicated `location ^~ /<app>/` block mapping to its respective directory, with its own `try_files` SPA fallback.
*Example from `nginx-frontend-routes.conf`:*
```nginx
location ^~ /admin/ {
    alias /www/wwwroot/d4u-admin/;
    index index.html;
    try_files $uri $uri/ /admin/index.html;
}
```

==================================================
## 11. PM2 / BACKEND RUNTIME
==================================================
- **PM2 Process Name**: `d4u-pos-backend`
- **Execution Command**: `node dist/src/main.js`
- **Port**: `3001`
- **Deployment Process**: GitHub Actions runs `npm ci`, `npx prisma generate`, uploads via SCP, runs `npx prisma migrate deploy` via SSH, then reloads PM2 (`pm2 reload d4u-pos-backend`).
- **Health Endpoint**: Validated via `curl -sf http://127.0.0.1:3001/system/ping`. Expected JSON response is `{ "status": "OPERATIONAL" }`.

==================================================
## 12. DATABASE / PRISMA
==================================================
- **Database Engine**: PostgreSQL
- **ORM**: Prisma
- **Production Migrations**: Run automatically during backend deployment via `npx prisma migrate deploy`.
- **Production Generation**: Run during deployment via `npx prisma generate`.
- *(Note: Local development relies on `prisma migrate dev`, which should not be run in production).*

==================================================
## 13. FRONTEND BASE PATHS
==================================================
Vite base paths are critical for deploying multiple SPAs under a single domain to ensure assets resolve properly. Verified paths from `vite.config.ts`:
- **POS**: `/` (Implied root)
- **Admin**: `/admin/`
- **Rider**: `/rider/`
- **Website**: `/website/`

==================================================
## 14. AUTHENTICATION / AUTHORIZATION ARCHITECTURE
==================================================
- **Strategy**: JWT-based authentication.
- **Storage**: Tokens (`d4u_pos_token`, `d4u_pos_refresh_token`) and context (`d4u_pos_device_id`) are stored in `localStorage`.
- **Isolation**: Tenant isolation is enforced via `store_id` and `brand_id` logic on backend controllers and services.
- **RBAC**: Guarded via `@RequirePermissions()` decorators that evaluate User roles against database-seeded permissions.
*(Note: Do not expose credentials, PINs, or JWT secrets in this documentation).*

==================================================
## 15. SECURITY REMEDIATION HISTORY
==================================================
**Completed Work:**
- `#2R-B1/B2`: Granular permissions implemented.
- `#2R-D`: Removed `finance.accounting` bridge.
- `#2R-E1`: Accounting Rules moved to `finance.system_accounts.*`.
- `#2R-E3`: POS cash drawer permission.
- `#2R-E4`: POS Cash Flow route migration.
- `#2R-E6`: Remaining `finance.accounting` cleanup.
- `#2R-F1`: Catalog tenant isolation (Commit: `147222e`).
- `#2R-F2a`: Marketing isolation (Commit: `925a5ce`).
- `#2R-F2c`: Social isolation (Commit: `15cb330`).
- `#2R-G1a`: POS Orders/Tables store isolation (Commit: `22add92`).
- `#2R-G1b1`: Inventory IDOR protection (Commit: `bf6dda2`).

**Pending Future Work:**
- `#2R-G1b2`: Inventory dual-use route scope.
- `#2R-G1c`: Product Requests tenant isolation.
- *Separate Phase*: Full endpoint authorization audit, UserAssignment role verification, authentication hardening, rate limiting, token lifetime, public endpoint audit, Socket.IO security audit. *(Not verified in repository as complete).*

==================================================
## 16. IMPORTANT DEPLOYMENT CHECKPOINTS
==================================================
- `da7efd4`: Frontend POS login fix (Deployed).
- `b81446c`: Safe frontend deployment workflow initial version.
- `12f1c59`: Tag-based Admin deployment workflow. (Tag: `deploy-d4u-admin-v1`)
- `6d0005b`: Rider + Website safe deployment workflows. (Tags: `deploy-d4u-rider-v1`, `deploy-d4u-website-v1`)
*(All these deployments were verified successfully through GitHub Actions).*

==================================================
## 17. DEPLOYMENT SAFETY RULES
==================================================
**NON-NEGOTIABLE ENGINEERING RULES**
1. No direct production changes unless explicitly approved.
2. No force push.
3. No main/master push unless explicitly approved.
4. Inspect `git status` before changes.
5. Inspect `git diff` before commit.
6. Run appropriate build/tests locally before deployment.
7. Deployment-triggering workflows must be understood before pushing.
8. Never expose secrets in documentation.
9. Never commit `.env` or credentials.
10. Do not change Nginx/PM2/database during unrelated frontend work.
11. Preserve rollback/recovery information.
12. Separate security remediation commits from deployment/configuration commits where practical.
13. Do not claim deployment success until the GitHub Actions run AND live application are verified.

==================================================
## 18. LIVE TESTING ENVIRONMENT
==================================================
The project is currently deployed for testing across all environments (POS, Admin, Rider, Website, API). Live testing must verify frontend load, login, API communication, tenant isolation, permissions, role behavior, Socket.IO, routing, and refresh/reload behavior. Destructive tests against live data must not be performed without explicit approval.

==================================================
## 19. KNOWN OPERATIONAL ISSUE / LESSON LEARNED
==================================================
**POS Same-Origin Multi-Session Collision:**
Because `/` (POS) and `/kitchen` operate under the same origin (`https://pos.deziner4you.com`), they share the same `localStorage`. Logging into different roles (e.g., Cashier and Chef) in different tabs of the same browser will cause session token collisions. Testing different roles simultaneously requires separate browsers or incognito windows.

==================================================
## 20. CURRENT SYSTEM STATUS
==================================================
| Component | Local | GitHub | CI/CD | VPS | Live | Notes |
|-----------|-------|--------|-------|-----|------|-------|
| Backend   | ✔     | ✔      | ✔     | ✔   | ✔    | Working |
| POS       | ✔     | ✔      | ✔     | ✔   | ✔    | Working |
| Admin     | ✔     | ✔      | ✔     | ✔   | ✔    | Deployed via tag |
| Rider     | ✔     | ✔      | ✔     | ✔   | ✔    | Deployed via tag |
| Website   | ✔     | ✔      | ✔     | ✔   | ?    | Deployment workflow triggered |

==================================================
## 21. FUTURE ENGINEERING ROADMAP
==================================================
*To be implemented in order:*
1. Complete #2R-G1b2
2. Complete #2R-G1c
3. Full endpoint authorization audit
4. Endpoint → permission mapping audit
5. UserAssignment role authorization verification
6. Authentication hardening audit
7. Public endpoint audit
8. Socket.IO security audit
9. Live security regression testing
10. Final security regression/build/test checkpoint

==================================================
## 22. TROUBLESHOOTING / RECOVERY
==================================================
- **API Unavailable / 502 Bad Gateway**: SSH into the VPS and check PM2. View logs with `pm2 logs d4u-pos-backend --err`.
- **SPA Routing Failure (404 on refresh)**: Verify `nginx-frontend-routes.conf` has the correct `try_files` fallback and the `base` path in `vite.config.ts` matches the subfolder.
- **Frontend Blank Screen**: Check browser console. Ensure Vite base path is correct.
- **GitHub Actions Upload Failure**: Ensure `VPS_SSH_*` secrets are valid.
- **Deployment Upload Failure**: Confirm target directories are writable by the deployment user.

==================================================
## 23. CHANGE CONTROL
==================================================
AUDIT -> PLAN -> APPROVAL -> IMPLEMENT -> LOCAL TEST -> GIT DIFF REVIEW -> COMMIT -> PUSH -> GITHUB ACTIONS -> VPS DEPLOYMENT -> LIVE TEST -> VERIFY -> DOCUMENT

==================================================
## 24. DOCUMENT METADATA
==================================================
- **Document Name**: D4U Engineering Architecture & Deployment Reference
- **Project**: D4U Restaurant POS
- **Repository**: `https://github.com/deziner4you-art/Food-POS-frontend.git`
- **Current Branch**: `final-project-after-ahmed-suggestion-security-checks-and-improvements`
- **Date Created**: 2026-09-16
- **Last Verified Date**: 2026-09-16
- **Documentation Status**: Verified & Current
- *"This document is an engineering reference and must be updated when architecture/deployment changes."*
