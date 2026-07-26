import { PrismaClient } from '@prisma/client';

export async function seedRbac(prisma: PrismaClient) {
  console.log('--- Starting Enterprise RBAC Seeding (Idempotent) ---');

  // 1. Define Permission Groups
  const groupsData = [
    { module_name: 'auth', description: 'Authentication & User Management' },
    { module_name: 'workspace', description: 'Multi-Tenant Workspace Context' },
    { module_name: 'pos', description: 'POS & Operations' },
    { module_name: 'inventory', description: 'Inventory, Stock & Purchasing' },
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

    // POS
    { group: 'pos', resource: 'orders', action: 'read', description: 'View POS orders' },
    { group: 'pos', resource: 'orders', action: 'create', description: 'Create POS order' },
    { group: 'pos', resource: 'orders', action: 'update', description: 'Modify active order' },
    { group: 'pos', resource: 'orders', action: 'void', description: 'Void completed order' },
    { group: 'pos', resource: 'orders', action: 'refund', description: 'Process order refund' },
    { group: 'pos', resource: 'orders', action: 'discount', description: 'Apply order discount' },
    { group: 'pos', resource: 'cash_drawer', action: 'open', description: 'Manual drawer open' },
    { group: 'pos', resource: 'cash_drawer', action: 'reconcile', description: 'Close and balance shift' },
    { group: 'pos', resource: 'tables', action: 'manage', description: 'Table management' },
    { group: 'pos', resource: 'reservations', action: 'manage', description: 'Reservations' },

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

    // Kitchen
    { group: 'kitchen', resource: 'tickets', action: 'read', description: 'View KDS tickets' },
    { group: 'kitchen', resource: 'tickets', action: 'bump', description: 'Bump completed ticket' },
    { group: 'kitchen', resource: 'tickets', action: 'recall', description: 'Recall bumped ticket' },

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
    { group: 'hr', resource: 'staff', action: 'read', description: 'View HR staff records' },
    { group: 'hr', resource: 'staff', action: 'manage', description: 'Manage HR profiles & salaries' },
    { group: 'hr', resource: 'attendance', action: 'read', description: 'View shift attendance' },
    { group: 'hr', resource: 'attendance', action: 'update', description: 'Update attendance logs' },

    // Delivery
    { group: 'delivery', resource: 'riders', action: 'read', description: 'View rider fleet' },
    { group: 'delivery', resource: 'riders', action: 'manage', description: 'Manage rider profiles' },
    { group: 'delivery', resource: 'dispatch', action: 'assign', description: 'Assign order to rider' },
    { group: 'delivery', resource: 'tracking', action: 'read', description: 'Live order tracking' },

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
    'Branch Manager': [
      'pos.orders.read', 'pos.orders.create', 'pos.orders.update', 'pos.orders.void', 'pos.orders.refund', 'pos.orders.discount',
      'pos.cash_drawer.open', 'pos.cash_drawer.reconcile', 'pos.tables.manage', 'pos.reservations.manage',
      'inventory.products.read', 'inventory.stock.read', 'inventory.stock.adjust', 'inventory.transfers.create', 'inventory.transfers.approve',
      'kitchen.tickets.read', 'kitchen.tickets.bump', 'kitchen.tickets.recall',
      'crm.customers.read', 'crm.customers.create', 'crm.customers.update',
      'finance.expenses.create', 'hr.attendance.read', 'delivery.dispatch.assign'
    ],
    'Cashier': [
      'pos.orders.read', 'pos.orders.create', 'pos.orders.update', 'pos.orders.discount', 'pos.cash_drawer.reconcile',
      'crm.customers.read', 'crm.customers.create'
    ],
    'Chef': [
      'kitchen.tickets.read', 'kitchen.tickets.bump', 'kitchen.tickets.recall', 'recipe.recipes.read'
    ],
    'Kitchen Manager': [
      'kitchen.tickets.read', 'kitchen.tickets.bump', 'kitchen.tickets.recall',
      'recipe.recipes.read', 'recipe.recipes.manage', 'recipe.bom.manage', 'recipe.production.create', 'recipe.production.approve',
      'inventory.stock.read'
    ],
    'Inventory Manager': [
      'inventory.categories.read', 'inventory.categories.manage', 'inventory.products.read', 'inventory.products.create', 'inventory.products.update',
      'inventory.stock.read', 'inventory.stock.adjust', 'inventory.transfers.create', 'inventory.transfers.approve',
      'inventory.suppliers.manage', 'inventory.po.create', 'inventory.po.approve'
    ],
    'Finance Manager': [
      'finance.ledgers.read', 'finance.journals.create', 'finance.journals.post',
      'finance.expenses.create', 'finance.expenses.approve', 'finance.payroll.read', 'finance.payroll.approve', 'finance.reports.export'
    ],
    'HR Manager': [
      'hr.staff.read', 'hr.staff.manage', 'hr.attendance.read', 'hr.attendance.update',
      'auth.users.read', 'auth.users.create', 'auth.users.update'
    ],
    'Marketing Manager': [
      'marketing.campaigns.read', 'marketing.campaigns.publish', 'marketing.coupons.create', 'marketing.coupons.manage',
      'marketing.loyalty.adjust_points', 'marketing.wallet.credit_debit', 'cms.content.edit', 'cms.content.publish'
    ],
    'Rider': [
      'delivery.riders.read', 'delivery.tracking.read'
    ],
    'Dispatcher': [
      'delivery.riders.read', 'delivery.riders.manage', 'delivery.dispatch.assign', 'delivery.tracking.read'
    ],
    'Auditor': [
      'system.audit_logs.read', 'finance.ledgers.read', 'finance.payroll.read', 'inventory.stock.read', 'pos.orders.read'
    ],
    'Read Only': Array.from(permissionMap.keys()).filter((k) => k.endsWith('.read')),
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
