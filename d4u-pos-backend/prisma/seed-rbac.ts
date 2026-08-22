import { PrismaClient } from '@prisma/client';

export async function seedRbac(prisma: PrismaClient) {
  console.log('--- Starting Enterprise RBAC Seeding (Idempotent) ---');

  // 1. Define Permission Groups
  const groupsData = [
    { module_name: 'auth', description: 'Authentication & User Management' },
    { module_name: 'workspace', description: 'Multi-Tenant Workspace Context' },
    { module_name: 'pos', description: 'POS & Operations' },
    { module_name: 'inventory', description: 'Inventory, Stock & Purchasing' },
    { module_name: 'catalog', description: 'Menu Builder — Category Groups & Catalog Structure' },
    { module_name: 'kitchen', description: 'Kitchen Display & Prep' },
    { module_name: 'recipe', description: 'Production & Recipe Costing' },
    { module_name: 'crm', description: 'Customer Relationship Management' },
    { module_name: 'marketing', description: 'Marketing, Loyalty & Discounts' },
    { module_name: 'cms', description: 'Website Content Management System' },
    { module_name: 'finance', description: 'Accounting, Expenses & Payroll' },
    { module_name: 'hr', description: 'Staff HR & Attendance' },
    { module_name: 'delivery', description: 'Delivery Dispatch & Riders' },
    { module_name: 'reports', description: 'Analytics & Reporting' },
    { module_name: 'system', description: 'System Administration' },
  ];

  const groupMap = new Map<string, number>();

  for (const g of groupsData) {
    const group = await prisma.permissionGroup.upsert({
      where: { module_name: g.module_name },
      update: { description: g.description },
      create: g,
    });
    groupMap.set(g.module_name, group.id);
  }
  console.log(`✓ Seeded ${groupMap.size} Permission Groups.`);

  // 2. Define All Permissions (module.resource.action)
  const permissionsData = [
    // Auth
    { group: 'auth', resource: 'users', action: 'read', description: 'View user accounts' },
    { group: 'auth', resource: 'users', action: 'create', description: 'Create user account' },
    { group: 'auth', resource: 'users', action: 'update', description: 'Update user account' },
    { group: 'auth', resource: 'users', action: 'delete', description: 'Delete user account' },
    { group: 'auth', resource: 'roles', action: 'read', description: 'View roles' },
    { group: 'auth', resource: 'roles', action: 'create', description: 'Create custom roles' },
    { group: 'auth', resource: 'roles', action: 'update', description: 'Update role permissions' },
    { group: 'auth', resource: 'roles', action: 'delete', description: 'Delete custom roles' },
    { group: 'auth', resource: 'roles', action: 'assign', description: 'Assign roles to users' },
    { group: 'auth', resource: 'permissions', action: 'read', description: 'View permission library' },
    { group: 'auth', resource: 'permissions', action: 'manage', description: 'Manage permissions' },

    // Workspace
    { group: 'workspace', resource: 'brands', action: 'read', description: 'View brands' },
    { group: 'workspace', resource: 'brands', action: 'create', description: 'Create brand' },
    { group: 'workspace', resource: 'brands', action: 'update', description: 'Update brand' },
    { group: 'workspace', resource: 'brands', action: 'delete', description: 'Delete brand' },
    { group: 'workspace', resource: 'branches', action: 'read', description: 'View branches' },
    { group: 'workspace', resource: 'branches', action: 'create', description: 'Create branch' },
    { group: 'workspace', resource: 'branches', action: 'update', description: 'Update branch' },
    { group: 'workspace', resource: 'branches', action: 'delete', description: 'Delete branch' },
    // Task #2R-B2: 'restore' actions for the recycle-bin routes, following
    // the same precedent as catalog.category_group.restore below.
    { group: 'workspace', resource: 'brands', action: 'restore', description: 'Restore a soft-deleted brand' },
    { group: 'workspace', resource: 'branches', action: 'restore', description: 'Restore a soft-deleted branch' },

    // POS
    { group: 'pos', resource: 'orders', action: 'read', description: 'View POS orders' },
    { group: 'pos', resource: 'orders', action: 'create', description: 'Create POS order' },
    { group: 'pos', resource: 'orders', action: 'update', description: 'Modify active order' },
    { group: 'pos', resource: 'orders', action: 'void', description: 'Void completed order' },
    { group: 'pos', resource: 'orders', action: 'refund', description: 'Process order refund' },
    { group: 'pos', resource: 'orders', action: 'discount', description: 'Apply order discount' },
    { group: 'pos', resource: 'cash_drawer', action: 'open', description: 'Manual drawer open' },
    { group: 'pos', resource: 'cash_drawer', action: 'reconcile', description: 'Close and balance shift' },
    // Task #2R-E3: approved in #2R-E2 -- neither existing cash_drawer action
    // semantically fits the 4 cash-flow.controller.ts routes (open is
    // documented Manager-PIN/grant-required and Cashier doesn't hold it;
    // reconcile means end-of-shift close/balance, not a continuous
    // mid-shift record). This is a distinct action, not a role-assignment
    // workaround for the other two.
    { group: 'pos', resource: 'cash_drawer', action: 'record', description: "Record an operational cash-in or cash-out transaction and view the current shift's cash-drawer history." },
    { group: 'pos', resource: 'tables', action: 'manage', description: 'Table management' },
    { group: 'pos', resource: 'reservations', action: 'manage', description: 'Reservations' },
    { group: 'pos', resource: 'business_day', action: 'read', description: 'Read current and historical business-day information.' },
    { group: 'pos', resource: 'business_day', action: 'start', description: 'Start/open the business day for a store.' },
    { group: 'pos', resource: 'business_day', action: 'close', description: 'Close and reconcile the business day for a store.' },

    // Inventory
    { group: 'inventory', resource: 'categories', action: 'read', description: 'View categories' },
    { group: 'inventory', resource: 'categories', action: 'manage', description: 'Manage categories' },
    { group: 'inventory', resource: 'products', action: 'read', description: 'View products' },
    { group: 'inventory', resource: 'products', action: 'create', description: 'Create product' },
    { group: 'inventory', resource: 'products', action: 'update', description: 'Update product' },
    { group: 'inventory', resource: 'products', action: 'delete', description: 'Delete product' },
    { group: 'inventory', resource: 'stock', action: 'read', description: 'View stock levels' },
    { group: 'inventory', resource: 'stock', action: 'adjust', description: 'Manual stock adjustment' },
    { group: 'inventory', resource: 'transfers', action: 'create', description: 'Request stock transfer' },
    { group: 'inventory', resource: 'transfers', action: 'approve', description: 'Approve stock transfer' },
    { group: 'inventory', resource: 'suppliers', action: 'manage', description: 'Manage vendors & suppliers' },
    { group: 'inventory', resource: 'po', action: 'create', description: 'Create Purchase Order' },
    { group: 'inventory', resource: 'po', action: 'approve', description: 'Approve Purchase Order' },

    // Catalog — Menu Builder (Sprint 28.7: Menu Collection -> Category Group -> Category -> Product)
    { group: 'catalog', resource: 'category_group', action: 'view', description: 'View category groups' },
    { group: 'catalog', resource: 'category_group', action: 'create', description: 'Create category group' },
    { group: 'catalog', resource: 'category_group', action: 'update', description: 'Update category group (incl. reorder, branch/channel assignment)' },
    { group: 'catalog', resource: 'category_group', action: 'delete', description: 'Soft-delete category group' },
    { group: 'catalog', resource: 'category_group', action: 'restore', description: 'Restore a soft-deleted category group' },

    // Kitchen
    { group: 'kitchen', resource: 'tickets', action: 'read', description: 'View KDS tickets' },
    { group: 'kitchen', resource: 'tickets', action: 'bump', description: 'Bump completed ticket' },
    { group: 'kitchen', resource: 'tickets', action: 'recall', description: 'Recall bumped ticket' },
    { group: 'kitchen', resource: 'tickets', action: 'accept', description: 'Accept a KOT and move it into kitchen preparation.' },
    { group: 'kitchen', resource: 'tickets', action: 'cancel', description: 'Cancel a kitchen ticket without cancelling the underlying order.' },
    { group: 'kitchen', resource: 'dashboard', action: 'read', description: 'View KDS dashboard & metrics' },
    { group: 'kitchen', resource: 'stations', action: 'read', description: 'View kitchen stations' },
    { group: 'kitchen', resource: 'stations', action: 'manage', description: 'Create/edit/assign kitchen stations' },
    { group: 'kitchen', resource: 'sessions', action: 'create', description: 'Generate chef PIN / pair kitchen device' },
    { group: 'kitchen', resource: 'sessions', action: 'read', description: 'View connected chef sessions' },
    { group: 'kitchen', resource: 'sessions', action: 'manage', description: 'Disconnect/reconnect chef sessions' },
    { group: 'kitchen', resource: 'stock_requests', action: 'create', description: 'Request stock from the kitchen' },
    { group: 'kitchen', resource: 'stock_requests', action: 'read', description: 'View stock requests' },
    { group: 'kitchen', resource: 'stock_requests', action: 'approve', description: 'Approve/fulfill/reject stock requests' },
    { group: 'kitchen', resource: 'inventory_locks', action: 'create', description: 'Lock (86) an inventory item from the kitchen' },
    { group: 'kitchen', resource: 'inventory_locks', action: 'read', description: 'View inventory locks' },
    { group: 'kitchen', resource: 'inventory_locks', action: 'unlock', description: 'Manager PIN-unlock a locked inventory item' },

    // Recipe
    { group: 'recipe', resource: 'recipes', action: 'read', description: 'View recipes' },
    { group: 'recipe', resource: 'recipes', action: 'manage', description: 'Create/Edit recipe costing' },
    { group: 'recipe', resource: 'bom', action: 'manage', description: 'Bill of Materials' },
    { group: 'recipe', resource: 'production', action: 'create', description: 'Create production order' },
    { group: 'recipe', resource: 'production', action: 'approve', description: 'Approve production order' },

    // CRM
    { group: 'crm', resource: 'customers', action: 'read', description: 'View customers' },
    { group: 'crm', resource: 'customers', action: 'create', description: 'Create customer' },
    { group: 'crm', resource: 'customers', action: 'update', description: 'Update customer' },
    { group: 'crm', resource: 'customers', action: 'delete', description: 'Delete customer' },

    // Marketing
    { group: 'marketing', resource: 'campaigns', action: 'read', description: 'View marketing campaigns' },
    { group: 'marketing', resource: 'campaigns', action: 'publish', description: 'Publish campaign' },
    { group: 'marketing', resource: 'coupons', action: 'create', description: 'Create coupons' },
    { group: 'marketing', resource: 'coupons', action: 'manage', description: 'Manage coupons' },
    { group: 'marketing', resource: 'loyalty', action: 'adjust_points', description: 'Manual loyalty points' },
    { group: 'marketing', resource: 'wallet', action: 'credit_debit', description: 'Wallet adjustments' },

    // CMS
    { group: 'cms', resource: 'content', action: 'edit', description: 'Edit CMS pages & banners' },
    { group: 'cms', resource: 'content', action: 'publish', description: 'Publish CMS changes' },

    // Finance & HR
    { group: 'finance', resource: 'ledgers', action: 'read', description: 'View general ledger' },
    { group: 'finance', resource: 'journals', action: 'create', description: 'Create journal entry' },
    { group: 'finance', resource: 'journals', action: 'post', description: 'Post journal entry' },
    { group: 'finance', resource: 'expenses', action: 'create', description: 'Record expense' },
    { group: 'finance', resource: 'expenses', action: 'approve', description: 'Approve expense' },
    { group: 'finance', resource: 'payroll', action: 'read', description: 'View payroll' },
    { group: 'finance', resource: 'payroll', action: 'approve', description: 'Approve & run payroll' },
    { group: 'finance', resource: 'reports', action: 'export', description: 'Export financial reports' },

    // Task #2R-E6: the coarse 'finance.accounting.{view,create,update,approve,
    // export}' block that used to live here (Task #2C) has been removed.
    // #2R-C1..C4/E1/E4 migrated every real caller onto granular finance.*
    // permissions; #2R-E5's audit confirmed zero executable usages, zero
    // role grants, zero live-user dependency, and zero PermissionsGuard
    // bridge dependency (already removed in #2R-D) before this removal.

    // Finance — Reports (Task #2C): reports.controller.ts's 7 routes require
    // 'finance.reports.view'; the 'finance'+'reports' pairing already exists
    // (see reports.export above) -- this is a new action on that existing
    // resource, not a new resource.
    { group: 'finance', resource: 'reports', action: 'view', description: 'View operational reports (daily/weekly sales, branch analytics, shifts, top products, voids)' },

    // Finance — Accounting sub-modules (Task #2R-C1): granular permissions
    // approved to eventually replace the coarse finance.accounting.* block
    // above for the accounting-controllers cluster (123 routes across 32
    // controllers, audited in #2R-A/#2R-C). finance.accounting.* is left
    // fully intact -- these are additions, not a replacement; no controller
    // decorator is migrated in this task. See #2R-C's report for the full
    // route-to-permission mapping and the STOP items resolved before this
    // list was finalized (Journal vs Journal Entry kept separate; financial
    // statement authoring kept separate from report viewing; POS cash-flow
    // deliberately excluded -- it belongs to pos.cash_drawer, not finance;
    // system-account-mapping + event-catalog treated as one configuration
    // domain).
    { group: 'finance', resource: 'chart_of_accounts', action: 'read', description: 'View chart of accounts (tree, search)' },
    { group: 'finance', resource: 'chart_of_accounts', action: 'create', description: 'Create account groups and accounts' },
    { group: 'finance', resource: 'chart_of_accounts', action: 'update', description: 'Update, disable, or move accounts and groups' },

    { group: 'finance', resource: 'journals', action: 'read', description: 'View journals' },
    { group: 'finance', resource: 'journals', action: 'update', description: 'Update, activate, or deactivate a journal' },

    { group: 'finance', resource: 'journal_entries', action: 'read', description: 'View journal entries' },
    { group: 'finance', resource: 'journal_entries', action: 'create', description: 'Create a journal entry' },
    { group: 'finance', resource: 'journal_entries', action: 'update', description: 'Update a draft journal entry' },
    { group: 'finance', resource: 'journal_entries', action: 'submit', description: 'Submit a journal entry for approval' },
    { group: 'finance', resource: 'journal_entries', action: 'approve', description: 'Approve a submitted journal entry' },
    { group: 'finance', resource: 'journal_entries', action: 'reverse', description: 'Reverse a posted journal entry' },
    { group: 'finance', resource: 'journal_entries', action: 'post', description: 'Manually post a journal entry to the ledger' },

    { group: 'finance', resource: 'vouchers', action: 'read', description: 'View vouchers' },
    { group: 'finance', resource: 'vouchers', action: 'create', description: 'Create a voucher' },
    { group: 'finance', resource: 'vouchers', action: 'update', description: 'Update a voucher' },
    { group: 'finance', resource: 'vouchers', action: 'submit', description: 'Submit a voucher for approval' },
    { group: 'finance', resource: 'vouchers', action: 'approve', description: 'Approve a voucher' },
    { group: 'finance', resource: 'vouchers', action: 'cancel', description: 'Cancel a voucher' },
    { group: 'finance', resource: 'vouchers', action: 'reverse', description: 'Reverse a voucher' },

    { group: 'finance', resource: 'periods', action: 'read', description: 'View accounting periods' },
    { group: 'finance', resource: 'periods', action: 'create', description: 'Create a monthly accounting period' },
    { group: 'finance', resource: 'periods', action: 'close', description: 'Close an accounting period' },
    { group: 'finance', resource: 'periods', action: 'open', description: 'Reopen an accounting period' },
    { group: 'finance', resource: 'periods', action: 'lock', description: 'Lock an accounting period' },
    { group: 'finance', resource: 'periods', action: 'unlock', description: 'Unlock an accounting period' },

    { group: 'finance', resource: 'fiscal_years', action: 'read', description: 'View fiscal years' },
    { group: 'finance', resource: 'fiscal_years', action: 'create', description: 'Create a fiscal year' },
    { group: 'finance', resource: 'fiscal_years', action: 'update', description: 'Update a fiscal year' },
    { group: 'finance', resource: 'fiscal_years', action: 'close', description: 'Close a fiscal year' },
    { group: 'finance', resource: 'fiscal_years', action: 'open', description: 'Reopen a fiscal year' },

    { group: 'finance', resource: 'accounts_payable', action: 'read', description: 'View accounts payable & vendor aging' },
    { group: 'finance', resource: 'accounts_payable', action: 'create', description: 'Record a payable or vendor payment' },

    { group: 'finance', resource: 'accounts_receivable', action: 'read', description: 'View accounts receivable & customer aging' },
    { group: 'finance', resource: 'accounts_receivable', action: 'create', description: 'Record a receivable or customer receipt' },

    { group: 'finance', resource: 'bank_reconciliation', action: 'read', description: 'View a bank reconciliation' },
    { group: 'finance', resource: 'bank_reconciliation', action: 'create', description: 'Import statements, run/match/adjust, or finalize a bank reconciliation' },

    { group: 'finance', resource: 'treasury', action: 'read', description: 'View bank accounts & cash position' },
    { group: 'finance', resource: 'treasury', action: 'create', description: 'Create a bank transfer, cash adjustment, or cash forecast' },

    { group: 'finance', resource: 'budgets', action: 'read', description: 'View budgets & budget-vs-actual' },
    { group: 'finance', resource: 'budgets', action: 'create', description: 'Create a budget' },
    { group: 'finance', resource: 'budgets', action: 'approve', description: 'Approve a budget' },

    { group: 'finance', resource: 'fixed_assets', action: 'read', description: 'View fixed assets' },
    { group: 'finance', resource: 'fixed_assets', action: 'create', description: 'Create a fixed asset' },
    { group: 'finance', resource: 'fixed_assets', action: 'update', description: 'Update a fixed asset' },
    { group: 'finance', resource: 'fixed_assets', action: 'transfer', description: 'Transfer a fixed asset' },
    { group: 'finance', resource: 'fixed_assets', action: 'dispose', description: 'Dispose a fixed asset' },

    { group: 'finance', resource: 'depreciation', action: 'read', description: 'View depreciation schedules & history' },
    { group: 'finance', resource: 'depreciation', action: 'create', description: 'Run or post depreciation' },

    { group: 'finance', resource: 'financial_statements', action: 'create', description: 'Author a financial statement, section, or account mapping' },
    { group: 'finance', resource: 'financial_statements', action: 'build', description: 'Build/generate a financial statement from its template' },

    { group: 'finance', resource: 'compliance', action: 'read', description: 'View compliance checks, certification status, and go-live status' },
    { group: 'finance', resource: 'compliance', action: 'create', description: 'Run a compliance or certification check' },

    { group: 'finance', resource: 'period_closing', action: 'execute', description: 'Execute month-end or year-end closing' },
    { group: 'finance', resource: 'period_closing', action: 'rollback', description: 'Roll back a month-end closing' },

    { group: 'finance', resource: 'system_accounts', action: 'read', description: 'View system account mappings and the system event catalog' },
    { group: 'finance', resource: 'system_accounts', action: 'create', description: 'Create a system account mapping' },
    { group: 'finance', resource: 'system_accounts', action: 'update', description: 'Update a system account mapping' },

    { group: 'hr', resource: 'staff', action: 'read', description: 'View HR staff records' },
    { group: 'hr', resource: 'staff', action: 'manage', description: 'Manage HR profiles & salaries' },
    { group: 'hr', resource: 'attendance', action: 'read', description: 'View shift attendance' },
    { group: 'hr', resource: 'attendance', action: 'update', description: 'Update attendance logs' },

    // Delivery
    { group: 'delivery', resource: 'riders', action: 'read', description: 'View rider fleet' },
    { group: 'delivery', resource: 'riders', action: 'manage', description: 'Manage rider profiles' },
    { group: 'delivery', resource: 'dispatch', action: 'assign', description: 'Assign order to rider' },
    { group: 'delivery', resource: 'dispatch', action: 'claim', description: 'Rider self-claims an unclaimed delivery order' },
    { group: 'delivery', resource: 'dispatch', action: 'update_status', description: 'Progress a claimed delivery through its lifecycle (rider arrived, out for delivery, delivered, cash settlement, etc.)' },
    { group: 'delivery', resource: 'tracking', action: 'read', description: 'Live order tracking' },
    { group: 'delivery', resource: 'tracking', action: 'update', description: 'Rider pushes their own live GPS location for an active delivery' },

    // System
    { group: 'system', resource: 'settings', action: 'read', description: 'Read system settings' },
    { group: 'system', resource: 'settings', action: 'update', description: 'Update global settings' },
    { group: 'system', resource: 'subscription', action: 'read', description: 'View subscription' },
    { group: 'system', resource: 'subscription', action: 'manage', description: 'Manage subscription' },
    { group: 'system', resource: 'audit_logs', action: 'read', description: 'Read audit logs' },
    { group: 'system', resource: 'api', action: 'manage', description: 'Manage API keys' },
  ];

  const permissionMap = new Map<string, number>();

  for (const p of permissionsData) {
    const groupId = groupMap.get(p.group);
    if (!groupId) continue;

    const permKey = `${p.group}.${p.resource}.${p.action}`;
    const permission = await prisma.permission.upsert({
      where: {
        group_id_resource_action: {
          group_id: groupId,
          resource: p.resource,
          action: p.action,
        },
      },
      update: { description: p.description },
      create: {
        group_id: groupId,
        resource: p.resource,
        action: p.action,
        description: p.description,
      },
    });
    permissionMap.set(permKey, permission.id);
  }
  console.log(`✓ Seeded ${permissionMap.size} Atomic Permissions.`);

  // 3. Define Standard Enterprise Roles
  const rolesToSeed = [
    { id: 1, name: 'Cashier' },
    { id: 2, name: 'Manager' },
    { id: 3, name: 'Super Admin' },
    { id: 4, name: 'Business Admin' },
    { id: 5, name: 'Business Owner' },
    { id: 6, name: 'Branch Owner' },
    { id: 7, name: 'Branch Manager' },
    { id: 8, name: 'Account Manager' },
    { id: 9, name: 'Chef' },
    { id: 10, name: 'Waiter' },
    { id: 11, name: 'Rider' },
    { id: 12, name: 'Brand Owner' },
    { id: 13, name: 'Regional Manager' },
    { id: 14, name: 'Assistant Manager' },
    { id: 15, name: 'Kitchen Manager' },
    { id: 16, name: 'Inventory Manager' },
    { id: 17, name: 'Purchase Manager' },
    { id: 18, name: 'Finance Manager' },
    { id: 19, name: 'Accountant' },
    { id: 20, name: 'HR Manager' },
    { id: 21, name: 'Marketing Manager' },
    { id: 22, name: 'Customer Support' },
    { id: 23, name: 'Dispatcher' },
    { id: 24, name: 'Auditor' },
    { id: 25, name: 'Read Only' },
  ];

  const roleMap = new Map<string, number>();

  // Synchronize PostgreSQL sequence to avoid primary key collision
  try {
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Role"', 'id'), COALESCE(max(id), 1)) FROM "Role";`);
  } catch (e) {
    // Ignore if not postgres
  }

  for (const r of rolesToSeed) {
    const existing = await prisma.role.findFirst({ where: { name: r.name } });
    let role;
    if (existing) {
      role = await prisma.role.update({
        where: { id: existing.id },
        data: { name: r.name },
      });
    } else {
      role = await prisma.role.create({
        data: {
          name: r.name,
          permissions: {}, // Backward compatibility layer
        },
      });
    }
    roleMap.set(r.name, role.id);
  }
  console.log(`✓ Seeded ${roleMap.size} Enterprise Roles.`);

  // 4. Define Default Role-Permission Assignments
  const rolePermissionAssignments: Record<string, string[]> = {
    'Super Admin': Array.from(permissionMap.keys()), // All permissions
    'Brand Owner': Array.from(permissionMap.keys()).filter((k) => !k.startsWith('system.subscription')),
    // Task #2O-A: pos.business_day.read/start/close added -- provisioning
    // ahead of the planned business-day.controller.ts sales.view/sales.create
    // -> pos.business_day.* migration (Task #2O-B), which requires every role
    // currently reaching those 4 routes via the sales.* compatibility bridge
    // to hold the real permission first. Nothing else in this array changed.
    //
    // Task #2P-F: kitchen.tickets.accept/cancel added (per the approved
    // #2P-D design) -- kitchen.tickets.bump already existed here and is not
    // duplicated.
    'Branch Manager': [
      'pos.orders.read', 'pos.orders.create', 'pos.orders.update', 'pos.orders.void', 'pos.orders.refund', 'pos.orders.discount',
      'pos.cash_drawer.open', 'pos.cash_drawer.reconcile', 'pos.cash_drawer.record', 'pos.tables.manage', 'pos.reservations.manage',
      'inventory.products.read', 'inventory.stock.read', 'inventory.stock.adjust', 'inventory.transfers.create', 'inventory.transfers.approve',
      'catalog.category_group.view',
      'kitchen.tickets.read', 'kitchen.tickets.bump', 'kitchen.tickets.recall',
      'kitchen.dashboard.read', 'kitchen.stations.read', 'kitchen.stations.manage',
      'kitchen.sessions.create', 'kitchen.sessions.read', 'kitchen.sessions.manage',
      'kitchen.stock_requests.read', 'kitchen.stock_requests.approve',
      'kitchen.inventory_locks.read', 'kitchen.inventory_locks.unlock',
      'crm.customers.read', 'crm.customers.create', 'crm.customers.update',
      'finance.expenses.create', 'hr.attendance.read', 'delivery.dispatch.assign',
      'pos.business_day.read', 'pos.business_day.start', 'pos.business_day.close',
      'kitchen.tickets.accept', 'kitchen.tickets.cancel'
    ],
    // Task #2N-A: pos.tables.manage added -- provisioning ahead of the
    // planned tables.controller.ts sales.view/sales.update -> pos.tables.manage
    // migration (Task #2N), which found Cashier had no fallback once the
    // sales.* compatibility bridge is no longer in the picture for that
    // controller. Nothing else in this array changed.
    // Task #2P-A: kitchen.tickets.read added -- provisioning ahead of the
    // planned kots.controller.ts sales.view -> kitchen.tickets.read
    // migration (per Task #2P's mapping analysis), since this role reaches
    // the KOT read routes today only via the sales.* compatibility bridge.
    //
    // Task #2P-F: kitchen.tickets.accept/bump/cancel added (per the approved
    // #2P-D design) -- this role currently reaches PATCH /kots/:id/status
    // (all 3 target statuses) only via the sales.* compatibility bridge.
    'Cashier': [
      'pos.orders.read', 'pos.orders.create', 'pos.orders.update', 'pos.orders.discount', 'pos.cash_drawer.reconcile', 'pos.cash_drawer.record',
      'crm.customers.read', 'crm.customers.create', 'pos.tables.manage',
      'pos.business_day.read', 'pos.business_day.start', 'pos.business_day.close',
      'kitchen.tickets.read',
      'kitchen.tickets.accept', 'kitchen.tickets.bump', 'kitchen.tickets.cancel'
    ],
    // Task #2G: 'Manager' (role id 2) is a distinct, real, currently-active
    // role -- 3 real users in the live database, none of them provisioned
    // until now. Grant mirrors Branch Manager's POS-relevant subset per the
    // Task #2F least-privilege recommendation; everything outside the
    // POS/customer domain (kitchen.*, inventory.*, finance.*, delivery.*)
    // stays with Branch Manager/other roles, not duplicated here.
    //
    // Task #2N-A: pos.tables.manage added, for the same reason as Cashier
    // above -- Task #2G's original exclusion ("no live route calls /tables
    // yet") is superseded now that Task #2N has a concrete migration plan
    // pending on this grant existing first.
    // Task #2P-A: kitchen.tickets.read added, for the same reason as
    // Cashier above.
    //
    // Task #2P-F: kitchen.tickets.accept/bump/cancel added, for the same
    // reason as Cashier above.
    'Manager': [
      'pos.orders.read', 'pos.orders.create', 'pos.orders.update', 'pos.orders.void', 'pos.orders.refund', 'pos.orders.discount',
      'pos.cash_drawer.open', 'pos.cash_drawer.reconcile', 'pos.cash_drawer.record',
      'crm.customers.read', 'crm.customers.create', 'pos.tables.manage',
      'pos.business_day.read', 'pos.business_day.start', 'pos.business_day.close',
      'kitchen.tickets.read',
      'kitchen.tickets.accept', 'kitchen.tickets.bump', 'kitchen.tickets.cancel'
    ],
    // Task #2I: Waiter is a synthetic terminal-session role (TerminalService,
    // no backing User row) whose entire write/read surface, per the actual
    // frontend (d4u-pos-client/src/App.tsx), is exactly these two calls --
    // GET /pos-orders (App.tsx:991, polls "My Orders") and POST /pos-orders
    // (App.tsx:1655-1694, handleSendTerminalOrder, the only cart action
    // available in Waiter Mode). Task #2H already migrated both routes'
    // decorators to pos.orders.read/create. Deliberately least-privilege:
    // no void/refund/discount/cash_drawer (Waiter never settles or handles
    // cash), no tables (no live route calls /tables at all).
    //
    // Task #2L: re-traced the customer-lookup question Task #2I deferred,
    // independently for read vs. create rather than assuming both:
    //  - READ is required. The cart sidebar's "Customer Mobile (for Points)"
    //    input (App.tsx:3777) is NOT gated by isWaiterMode, and typing a
    //    full phone number there fires lookupCustomerByPhone() (App.tsx:1855)
    //    -> GET /customers/phone/:phone -> crm.customers.read, with no
    //    brand_id dependency anywhere in that call path.
    //  - CREATE is NOT required. All three createCustomer() call sites
    //    (App.tsx:1421 handleCreateKOT, :3368 the Customers-panel "New
    //    Customer" modal, :5038 the Payment-confirm handler) are each bound
    //    to a UI control that only exists in the non-Waiter branch (the
    //    "KOT" cart button, the entire Customers sidebar panel, and the
    //    "Pay" button respectively) -- none is reachable in Waiter Mode.
    //    They'd also fail even if reached: createCustomer's payload requires
    //    brand_id, which Waiter's session never has (confirmed in both
    //    WaiterTerminalLogin.tsx onAuthenticated() call shapes -- PIN login
    //    and session-resume alike only ever set {name, role, store_id,
    //    sessionId, deviceId}, never brand_id). Two independent reasons
    //    crm.customers.create would be a purely speculative grant.
    'Waiter': [
      'pos.orders.read', 'pos.orders.create', 'crm.customers.read'
    ],
    // Task #2P-F: kitchen.tickets.accept/cancel added (per the approved
    // #2P-D design) -- kitchen.tickets.bump already existed here and is not
    // duplicated.
    'Chef': [
      'kitchen.tickets.read', 'kitchen.tickets.bump', 'kitchen.tickets.recall', 'recipe.recipes.read',
      'kitchen.dashboard.read', 'kitchen.stations.read',
      'kitchen.stock_requests.create', 'kitchen.stock_requests.read',
      'kitchen.inventory_locks.create', 'kitchen.inventory_locks.read',
      'kitchen.tickets.accept', 'kitchen.tickets.cancel',
    ],
    // Task #2P-F: kitchen.tickets.accept/cancel added, for the same reason
    // as Chef above.
    'Kitchen Manager': [
      'kitchen.tickets.read', 'kitchen.tickets.bump', 'kitchen.tickets.recall',
      'recipe.recipes.read', 'recipe.recipes.manage', 'recipe.bom.manage', 'recipe.production.create', 'recipe.production.approve',
      'inventory.stock.read',
      'kitchen.dashboard.read', 'kitchen.stations.read', 'kitchen.stations.manage',
      'kitchen.sessions.create', 'kitchen.sessions.read', 'kitchen.sessions.manage',
      'kitchen.stock_requests.create', 'kitchen.stock_requests.read', 'kitchen.stock_requests.approve',
      'kitchen.inventory_locks.create', 'kitchen.inventory_locks.read', 'kitchen.inventory_locks.unlock',
      'kitchen.tickets.accept', 'kitchen.tickets.cancel',
    ],
    'Inventory Manager': [
      'inventory.categories.read', 'inventory.categories.manage', 'inventory.products.read', 'inventory.products.create', 'inventory.products.update',
      'inventory.stock.read', 'inventory.stock.adjust', 'inventory.transfers.create', 'inventory.transfers.approve',
      'inventory.suppliers.manage', 'inventory.po.create', 'inventory.po.approve',
      'catalog.category_group.view', 'catalog.category_group.create', 'catalog.category_group.update',
      'kitchen.stock_requests.read', 'kitchen.stock_requests.approve',
      'kitchen.inventory_locks.read', 'kitchen.inventory_locks.unlock',
    ],
    // Task #2R-C2: expanded per docs/architecture/permission-library.md's
    // Default Role Permission Matrix (Section 5), which explicitly documents
    // Finance Manager as "M + A" (Full Manage + Approval Privileges) and
    // Accountant as "R + E" (Read + Execution) for the Finance/HR column --
    // real repository evidence, not inference from the role's name. Also
    // consistent with docs/architecture/rbac.md's role hierarchy, which
    // places "Finance / Accounting Manager" at Level 1 (Enterprise/HQ scope,
    // same tier as Brand Owner). Both docs predate #2R-C1's 57 new granular
    // permissions (they describe the original 8-permission finance model),
    // so this is the documented "manage + approve everything" principle
    // applied consistently to the newer accounting domains, not a verbatim
    // citation for each one. Finance Manager receives the full superset --
    // everything Accountant's #2R-C1 scope covers, plus every elevated
    // action explicitly excluded from Accountant (approvals, period/
    // fiscal-year control, reversals, treasury transfers, budget approval,
    // fixed-asset disposal/transfer, financial-statement authoring,
    // system-account configuration, period closing, compliance) -- matching
    // the approved separation-of-duties model where those actions are
    // reserved for "Finance Manager or above". finance.reports.view is
    // included too: a pre-existing (not #2R-C1-new) permission Finance
    // Manager was missing despite already holding finance.reports.export,
    // an inconsistency for a manager who can export but not view. The
    // original 8 permissions above are unchanged, only appended to.
    'Finance Manager': [
      'finance.ledgers.read', 'finance.journals.create', 'finance.journals.post',
      'finance.expenses.create', 'finance.expenses.approve', 'finance.payroll.read', 'finance.payroll.approve', 'finance.reports.export',
      'finance.reports.view',
      'finance.chart_of_accounts.read', 'finance.chart_of_accounts.create', 'finance.chart_of_accounts.update',
      'finance.journals.read', 'finance.journals.update',
      'finance.journal_entries.read', 'finance.journal_entries.create', 'finance.journal_entries.update',
      'finance.journal_entries.submit', 'finance.journal_entries.approve', 'finance.journal_entries.reverse', 'finance.journal_entries.post',
      'finance.vouchers.read', 'finance.vouchers.create', 'finance.vouchers.update',
      'finance.vouchers.submit', 'finance.vouchers.approve', 'finance.vouchers.cancel', 'finance.vouchers.reverse',
      'finance.periods.read', 'finance.periods.create', 'finance.periods.close', 'finance.periods.open', 'finance.periods.lock', 'finance.periods.unlock',
      'finance.fiscal_years.read', 'finance.fiscal_years.create', 'finance.fiscal_years.update', 'finance.fiscal_years.close', 'finance.fiscal_years.open',
      'finance.accounts_payable.read', 'finance.accounts_payable.create',
      'finance.accounts_receivable.read', 'finance.accounts_receivable.create',
      'finance.bank_reconciliation.read', 'finance.bank_reconciliation.create',
      'finance.treasury.read', 'finance.treasury.create',
      'finance.budgets.read', 'finance.budgets.create', 'finance.budgets.approve',
      'finance.fixed_assets.read', 'finance.fixed_assets.create', 'finance.fixed_assets.update', 'finance.fixed_assets.transfer', 'finance.fixed_assets.dispose',
      'finance.depreciation.read', 'finance.depreciation.create',
      'finance.financial_statements.create', 'finance.financial_statements.build',
      'finance.compliance.read', 'finance.compliance.create',
      'finance.period_closing.execute', 'finance.period_closing.rollback',
      'finance.system_accounts.read', 'finance.system_accounts.create', 'finance.system_accounts.update',
    ],
    // Task #2R-C1: provisioned per the approved domain-by-domain Accountant
    // scope from #2R-C -- day-to-day recording (journal entries, vouchers,
    // AP/AR, bank reconciliation, depreciation, chart-of-accounts/report
    // viewing), deliberately excluding approval authority (journal
    // entry/voucher/budget approve), period/fiscal-year open-close-lock
    // (segregation of duties), month-end/year-end closing, and
    // system-account-mapping (setup/config) -- all of which stay reserved
    // for Finance Manager or above. Finance Manager's own array above is
    // unchanged; this task did not expand it, since only Accountant's scope
    // was explicitly approved with an itemized grant list.
    'Accountant': [
      'finance.chart_of_accounts.read',
      'finance.journals.create',
      'finance.journal_entries.read', 'finance.journal_entries.create', 'finance.journal_entries.update',
      'finance.journal_entries.submit', 'finance.journal_entries.post',
      'finance.vouchers.read', 'finance.vouchers.create', 'finance.vouchers.submit',
      'finance.periods.read', 'finance.fiscal_years.read',
      'finance.accounts_payable.read', 'finance.accounts_payable.create',
      'finance.accounts_receivable.read', 'finance.accounts_receivable.create',
      'finance.bank_reconciliation.read', 'finance.bank_reconciliation.create',
      'finance.budgets.read',
      'finance.fixed_assets.read', 'finance.fixed_assets.create',
      'finance.depreciation.read', 'finance.depreciation.create',
      'finance.reports.view',
      'finance.compliance.read',
    ],
    // Task #2R-C1: Account Manager evaluated during the accounting RBAC
    // design audit (#2R-A/#2R-C) and found to have zero real grants, zero
    // seed-time metadata, and zero references anywhere else in the repo
    // except one old, unrelated migration script (fix-roles.js) that also
    // gave it empty permissions. Treated as Option 3 (obsolete/unused) per
    // explicit user decision -- left at zero permissions deliberately, not
    // by omission. Revisit only in a dedicated role-cleanup task, not as
    // part of accounting provisioning.
    'Account Manager': [],
    'HR Manager': [
      'hr.staff.read', 'hr.staff.manage', 'hr.attendance.read', 'hr.attendance.update',
      'auth.users.read', 'auth.users.create', 'auth.users.update'
    ],
    'Marketing Manager': [
      'marketing.campaigns.read', 'marketing.campaigns.publish', 'marketing.coupons.create', 'marketing.coupons.manage',
      'marketing.loyalty.adjust_points', 'marketing.wallet.credit_debit', 'cms.content.edit', 'cms.content.publish'
    ],
    // Task #2Q-B1: delivery.tracking.update/delivery.dispatch.claim/
    // delivery.dispatch.update_status added -- per the approved #2Q-B
    // design, provisioning Rider ahead of the planned migration
    // (#2Q-B2) of rider.controller.ts's currently-nonexistent
    // system.create/system.view strings and the addition of a rider-side
    // accepted permission on the shared online-orders/pos-orders
    // delivery-status routes. Nothing else in this array changed.
    'Rider': [
      'delivery.riders.read', 'delivery.tracking.read',
      'delivery.tracking.update', 'delivery.dispatch.claim', 'delivery.dispatch.update_status'
    ],
    'Dispatcher': [
      'delivery.riders.read', 'delivery.riders.manage', 'delivery.dispatch.assign', 'delivery.tracking.read'
    ],
    'Auditor': [
      'system.audit_logs.read', 'finance.ledgers.read', 'finance.payroll.read', 'inventory.stock.read', 'pos.orders.read'
    ],
    'Read Only': Array.from(permissionMap.keys()).filter((k) => k.endsWith('.read')),
    // Task #2O-A: Business Admin/Business Owner/Branch Owner had no
    // rolePermissionAssignments entry at all -- they currently reach the 4
    // Business-Day routes purely through PermissionsGuard's posRoles
    // name-based compatibility bridge (independent of any real permission
    // grant). Provisioned here with only the 3 new Business-Day permissions,
    // ahead of the planned decorator migration (Task #2O-B); no other
    // permission is granted since that's outside this task's scope.
    //
    // Task #2P-A: kitchen.tickets.read added to each, for the same
    // name-based-bridge-only reason -- these 3 roles also currently reach
    // the KOT read routes solely through the sales.* compatibility bridge.
    //
    // Task #2P-F: kitchen.tickets.accept/bump/cancel added to each, for the
    // same name-based-bridge-only reason -- these 3 roles also currently
    // reach PATCH /kots/:id/status solely through the sales.* compatibility
    // bridge.
    //
    // Task #2R-E3: pos.cash_drawer.record deliberately NOT added to these 3
    // roles. #2R-E2 inferred they might need it from their pos.business_day.*
    // grants (immediately upstream of the CashIn gate in d4u-pos-client's
    // App() sequence); #2R-E3's pre-flight re-verification found the CashIn
    // gate (App.tsx ~5824) is role-blind -- it fires for any role that isn't
    // literally 'Waiter'/'Chef', so the code would not block them -- but
    // found zero direct evidence (no reference to these role names anywhere
    // in d4u-pos-client, and they're confirmed d4u-admin back-office users,
    // which has no cash-flow route at all) that they actually log into the
    // POS terminal in practice. Structural code capability is not proof of
    // real usage; per this task's explicit STOP instruction, left ungranted
    // pending a real confirmation, not decided by inference.
    'Business Admin': [
      'pos.business_day.read', 'pos.business_day.start', 'pos.business_day.close',
      'kitchen.tickets.read',
      'kitchen.tickets.accept', 'kitchen.tickets.bump', 'kitchen.tickets.cancel'
    ],
    'Business Owner': [
      'pos.business_day.read', 'pos.business_day.start', 'pos.business_day.close',
      'kitchen.tickets.read',
      'kitchen.tickets.accept', 'kitchen.tickets.bump', 'kitchen.tickets.cancel'
    ],
    'Branch Owner': [
      'pos.business_day.read', 'pos.business_day.start', 'pos.business_day.close',
      'kitchen.tickets.read',
      'kitchen.tickets.accept', 'kitchen.tickets.bump', 'kitchen.tickets.cancel'
    ],
  };

  let totalRolePermissionsCount = 0;

  for (const [roleName, permKeys] of Object.entries(rolePermissionAssignments)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;

    // Collect JSON permissions map for legacy compatibility layer
    const legacyPermissionsJson: Record<string, boolean> = {};

    for (const permKey of permKeys) {
      const permId = permissionMap.get(permKey);
      if (!permId) continue;

      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: roleId,
            permission_id: permId,
          },
        },
        update: {},
        create: {
          role_id: roleId,
          permission_id: permId,
        },
      });

      // Legacy key setting
      const parts = permKey.split('.');
      legacyPermissionsJson[parts[0]] = true; // e.g. pos: true, inventory: true
      legacyPermissionsJson[permKey] = true;   // e.g. pos.orders.read: true
      totalRolePermissionsCount++;
    }

    // Populate Legacy JSON permissions on Role (Compatibility Layer ONLY)
    await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: legacyPermissionsJson,
      },
    });
  }

  console.log(`✓ Seeded ${totalRolePermissionsCount} RolePermission Junctions.`);
  console.log('--- Enterprise RBAC Seeding Completed Successfully ---');
}
