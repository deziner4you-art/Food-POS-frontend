import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let prisma: {
    role: { findFirst: jest.Mock };
    user: { findUnique: jest.Mock };
  };

  const makeContext = (
    user: any,
    extra: Record<string, any> = {},
  ): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user, ...extra }),
      }),
    } as unknown as ExecutionContext;
  };

  // reflector.getAllAndOverride is called twice per canActivate: once for
  // PERMISSIONS_KEY, once for IS_PUBLIC_KEY (in that order in the guard).
  const mockMetadata = (
    permissions: string[] | undefined,
    isPublic = false,
  ) => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(permissions)
      .mockReturnValueOnce(isPublic);
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    prisma = {
      role: { findFirst: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      prisma as any,
    );
  });

  it('1. rejects when there is no authenticated user on the request', async () => {
    mockMetadata(['finance.accounting.view']);
    const context = makeContext(null);
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('2. rejects an authenticated user who lacks the required permission (403)', async () => {
    mockMetadata(['finance.accounting.view']);
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: {
        name: 'Rider',
        permissions: { 'delivery.riders.read': true, delivery: true },
      },
    });
    const context = makeContext({ sub: 90 });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('3. allows an authenticated user who has the required permission', async () => {
    mockMetadata(['inventory.stock.read']);
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: {
        name: 'Inventory Manager',
        permissions: { 'inventory.stock.read': true, inventory: true },
      },
    });
    const context = makeContext({ sub: 42 });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('4. multiple required permissions: allows if the user has ANY one of them (matches existing .some() semantics)', async () => {
    mockMetadata(['finance.accounting.view', 'inventory.stock.read']);
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: {
        name: 'Inventory Manager',
        permissions: { 'inventory.stock.read': true, inventory: true },
      },
    });
    const context = makeContext({ sub: 42 });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('4b. multiple required permissions: rejects if the user has NONE of them', async () => {
    mockMetadata(['finance.accounting.view', 'finance.accounting.approve']);
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: {
        name: 'Inventory Manager',
        permissions: { 'inventory.stock.read': true, inventory: true },
      },
    });
    const context = makeContext({ sub: 42 });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('5. allows an endpoint with no permission metadata, without touching the database', async () => {
    mockMetadata(undefined);
    const context = makeContext({ sub: 42 });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.role.findFirst).not.toHaveBeenCalled();
  });

  it('6. Super Admin bypasses the permission check regardless of what was requested', async () => {
    mockMetadata(['system.subscription.manage']);
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: { name: 'Super Admin', permissions: {} },
    });
    const context = makeContext({ sub: 1 });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('6b. Waiter/Chef terminal sessions resolve role by name (synthetic, non-numeric sub) via the Role table, not a User lookup', async () => {
    mockMetadata(['kitchen.tickets.read']);
    prisma.role.findFirst.mockResolvedValue({
      name: 'Chef',
      permissions: { 'kitchen.tickets.read': true, kitchen: true },
    });
    const context = makeContext({ sub: 'chef-session-12', role: 'Chef' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.role.findFirst).toHaveBeenCalledWith({
      where: { name: 'Chef' },
      select: { name: true, permissions: true },
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('7. empty permission metadata array is treated the same as missing metadata (allowed, preserves existing behavior)', async () => {
    mockMetadata([]);
    const context = makeContext({ sub: 42 });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('7b. rejects with a clear error when the resolved role has no Role row / permissions configured', async () => {
    mockMetadata(['pos.orders.read']);
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: null,
    });
    const context = makeContext({ sub: 999 });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('8. a numeric sub always resolves via the database and ignores any role/permissions claim riding along on the payload (anti-spoof)', async () => {
    mockMetadata(['finance.accounting.approve']);
    // Real Cashier in the DB, but the "token" also carries forged-looking
    // role/permissions fields (as if an attacker got a claim injected into
    // an otherwise-valid payload). A numeric sub must still force the real
    // DB lookup and ignore these -- it must NOT take the synthetic-session
    // shortcut just because a `role` string happens to be present.
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: {
        name: 'Cashier',
        permissions: { 'pos.orders.read': true, pos: true },
      },
    });
    const context = makeContext({
      sub: 5,
      role: 'Super Admin',
      permissions: { 'finance.accounting.approve': true },
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 5 },
      select: {
        module_permissions: true,
        role: { select: { name: true, permissions: true } },
      },
    });
  });

  it('8b. request body/query permission fields are never consulted (anti-spoof)', async () => {
    mockMetadata(['finance.accounting.approve']);
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: {
        name: 'Cashier',
        permissions: { 'pos.orders.read': true, pos: true },
      },
    });
    const context = makeContext(
      { sub: 5 },
      {
        body: {
          role: 'Super Admin',
          permissions: ['finance.accounting.approve'],
        },
        query: { permission: 'finance.accounting.approve' },
      },
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('preserves the existing POS-role compatibility shim for the legacy sales.*/finance.accounting.* codes', async () => {
    mockMetadata(['sales.create']);
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: {
        name: 'Cashier',
        permissions: { 'pos.orders.create': true, pos: true },
      },
    });
    const context = makeContext({ sub: 7 });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('does not grant the POS compatibility shim to a role outside the whitelist and without module_permissions.pos', async () => {
    mockMetadata(['sales.create']);
    prisma.user.findUnique.mockResolvedValue({
      module_permissions: null,
      role: {
        name: 'Rider',
        permissions: { 'delivery.riders.read': true, delivery: true },
      },
    });
    const context = makeContext({ sub: 90 });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('public routes bypass the permission check entirely, without touching the database', async () => {
    mockMetadata(['system.subscription.manage'], true);
    const context = makeContext(null);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  // Task #2R-D: finance.accounting.create/finance.accounting.view removed
  // from the posPermissions compatibility bridge. #2R-C1..C4 migrated every
  // real caller of these two legacy strings onto granular finance.*
  // permissions; #2R-C3-D found the bridge access they gave POS-operational
  // roles was accidental/legacy, not an intended grant; #2R-C4-V confirmed
  // via the live database that no user depends on it. sales.*/catalog.view
  // remain untouched -- still load-bearing, unresolved.
  describe('Task #2R-D: finance.accounting.view/create no longer bridged', () => {
    it('finance.accounting.view is no longer granted to a posRole via the compatibility bridge', async () => {
      mockMetadata(['finance.accounting.view']);
      prisma.user.findUnique.mockResolvedValue({
        module_permissions: null,
        role: {
          name: 'Cashier',
          permissions: { 'pos.orders.create': true, pos: true },
        },
      });
      const context = makeContext({ sub: 7 });
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('finance.accounting.create is no longer granted to a posRole via the compatibility bridge', async () => {
      mockMetadata(['finance.accounting.create']);
      prisma.user.findUnique.mockResolvedValue({
        module_permissions: null,
        role: {
          name: 'Cashier',
          permissions: { 'pos.orders.create': true, pos: true },
        },
      });
      const context = makeContext({ sub: 7 });
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('finance.accounting.view is no longer granted via module_permissions.pos === true either', async () => {
      mockMetadata(['finance.accounting.view']);
      prisma.user.findUnique.mockResolvedValue({
        module_permissions: { pos: true },
        role: {
          name: 'Some Custom Role',
          permissions: {},
        },
      });
      const context = makeContext({ sub: 88 });
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('the real granular finance.chart_of_accounts.read permission still works normally for a role that actually holds it', async () => {
      mockMetadata(['finance.chart_of_accounts.read']);
      prisma.user.findUnique.mockResolvedValue({
        module_permissions: null,
        role: {
          name: 'Accountant',
          permissions: { 'finance.chart_of_accounts.read': true, finance: true },
        },
      });
      const context = makeContext({ sub: 200 });
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('Super Admin still bypasses finance.accounting.view/create entirely, unaffected by the bridge change', async () => {
      mockMetadata(['finance.accounting.view']);
      prisma.user.findUnique.mockResolvedValue({
        module_permissions: null,
        role: { name: 'Super Admin', permissions: {} },
      });
      const context = makeContext({ sub: 1 });
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('the sales.* and catalog.view compatibility entries are unaffected -- still bridged for a posRole', async () => {
      mockMetadata(['sales.view']);
      prisma.user.findUnique.mockResolvedValue({
        module_permissions: null,
        role: {
          name: 'Manager',
          permissions: { 'pos.orders.read': true, pos: true },
        },
      });
      const context = makeContext({ sub: 15 });
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });
  });
});
