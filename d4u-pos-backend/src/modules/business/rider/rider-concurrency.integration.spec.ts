import { PrismaClient } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { RiderService } from './rider.service';

/**
 * Task #2A — Real PostgreSQL Concurrency Integration Test
 *
 * This test uses genuine independent Prisma connections to PostgreSQL.
 * It exercises the real RiderService.claimOrder() implementation without mocking
 * PrismaService, $transaction, $queryRaw, or PostgreSQL locks.
 */
describe('Task #2A — Real PostgreSQL Concurrency Integration Test', () => {
  // Set extended timeout for real multi-connection database operations
  jest.setTimeout(30000);

  let prismaAdmin: PrismaClient;
  let prismaA: PrismaClient;
  let prismaB: PrismaClient;

  const mockGateway = {
    broadcast: jest.fn(),
    broadcastRiderPresence: jest.fn(),
    getActiveRidersList: jest.fn().mockReturnValue([]),
  } as any;

  const createdUserIds: number[] = [];
  const createdOrderIds: number[] = [];

  let testStoreId: number;
  let testRiderA: any;
  let testRiderB: any;

  beforeAll(async () => {
    prismaAdmin = new PrismaClient();
    prismaA = new PrismaClient();
    prismaB = new PrismaClient();

    await prismaAdmin.$connect();
    await prismaA.$connect();
    await prismaB.$connect();

    // Verify real PostgreSQL connection
    const pgCheck: any = await prismaAdmin.$queryRawUnsafe('SELECT version()');
    expect(pgCheck).toBeDefined();

    // Find a valid store and Rider role
    const store = await prismaAdmin.store.findFirst();
    if (!store) throw new Error('No store found in database.');
    testStoreId = store.id;

    const riderRole = await prismaAdmin.role.findFirst({ where: { name: 'Rider' } });
    if (!riderRole) throw new Error('No Rider role found in database.');

    const timestamp = Date.now();

    // Create Rider A
    testRiderA = await prismaAdmin.user.create({
      data: {
        name: `PG Integration Rider A ${timestamp}`,
        phone: `pg-rider-a-${timestamp}`,
        role_id: riderRole.id,
        store_id: testStoreId,
        hashedPin: '1234',
      },
    });
    createdUserIds.push(testRiderA.id);

    // Create Rider B
    testRiderB = await prismaAdmin.user.create({
      data: {
        name: `PG Integration Rider B ${timestamp}`,
        phone: `pg-rider-b-${timestamp}`,
        role_id: riderRole.id,
        store_id: testStoreId,
        hashedPin: '1234',
      },
    });
    createdUserIds.push(testRiderB.id);
  });

  afterAll(async () => {
    // Isolated cleanup: delete only records created during this test run
    try {
      if (createdOrderIds.length > 0) {
        await prismaAdmin.onlineOrder.deleteMany({
          where: { id: { in: createdOrderIds } },
        });
      }
      if (createdUserIds.length > 0) {
        await prismaAdmin.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
    } finally {
      await prismaA.$disconnect();
      await prismaB.$disconnect();
      await prismaAdmin.$disconnect();
    }
  });

  it('TEST A — SAME RIDER: Transaction B blocks on User row lock until Transaction A commits, then rejects', async () => {
    // 1. Create two real READY delivery orders for Rider A
    const orderA = await prismaAdmin.onlineOrder.create({
      data: {
        store_id: testStoreId,
        customer: 'Test Customer Order A',
        customerPhone: '03001000001',
        customerAddress: 'Address A',
        items: JSON.stringify([{ id: 1, name: 'Item A', price: 10, qty: 1 }]),
        totalAmount: '10.00',
        status: 'READY',
        type: 'DELIVERY',
        source: 'Website',
        timePlaced: new Date().toISOString(),
      },
    });
    createdOrderIds.push(orderA.id);

    const orderB = await prismaAdmin.onlineOrder.create({
      data: {
        store_id: testStoreId,
        customer: 'Test Customer Order B',
        customerPhone: '03001000002',
        customerAddress: 'Address B',
        items: JSON.stringify([{ id: 2, name: 'Item B', price: 20, qty: 1 }]),
        totalAmount: '20.00',
        status: 'READY',
        type: 'DELIVERY',
        source: 'Website',
        timePlaced: new Date().toISOString(),
      },
    });
    createdOrderIds.push(orderB.id);

    let lockAcquiredByA = false;
    let releaseBarrierA: () => void;
    const barrierAPromise = new Promise<void>((resolve) => {
      releaseBarrierA = resolve;
    });

    // Wrap prismaA to pause Transaction A after claiming orderA but BEFORE committing to PostgreSQL
    const originalTxA = prismaA.$transaction.bind(prismaA);
    const wrappedPrismaA = new Proxy(prismaA, {
      get(target: any, prop: string) {
        if (prop === '$transaction') {
          return async (callback: any, options: any) => {
            return originalTxA(async (tx: any) => {
              const wrappedTx = new Proxy(tx, {
                get(t: any, p: string) {
                  if (p === '$queryRaw') {
                    return async (...args: any[]) => {
                      const res = await t.$queryRaw(...args);
                      lockAcquiredByA = true;
                      return res;
                    };
                  }
                  if (p === 'onlineOrder') {
                    const orig = t.onlineOrder;
                    return new Proxy(orig, {
                      get(oTarget: any, oProp: string) {
                        if (oProp === 'findUniqueOrThrow') {
                          return async (...oArgs: any[]) => {
                            const res = await oTarget.findUniqueOrThrow(...oArgs);
                            // Claim has occurred inside this uncommitted transaction.
                            // Hold the PostgreSQL transaction open with the User row lock.
                            await barrierAPromise;
                            return res;
                          };
                        }
                        return oTarget[oProp];
                      },
                    });
                  }
                  return t[p];
                },
              });
              return callback(wrappedTx);
            }, options);
          };
        }
        return target[prop];
      },
    });

    const serviceA = new RiderService(wrappedPrismaA, mockGateway);
    const serviceB = new RiderService(prismaB as any, mockGateway);

    // Step 1: Start Transaction A
    const promiseA = serviceA.claimOrder(orderA.id, { sub: testRiderA.id });

    // Wait until Transaction A acquires the row lock
    while (!lockAcquiredByA) {
      await new Promise((r) => setTimeout(r, 25));
    }

    // Step 2: Start Transaction B for the SAME Rider A on Order B (Connection B)
    let txBFinished = false;
    let txBError: any = null;
    let txBResult: any = null;

    const promiseB = serviceB
      .claimOrder(orderB.id, { sub: testRiderA.id })
      .then((res) => {
        txBFinished = true;
        txBResult = res;
      })
      .catch((err) => {
        txBFinished = true;
        txBError = err;
      });

    // Step 3: Prove Transaction B is genuinely BLOCKED by PostgreSQL on the row lock
    await new Promise((r) => setTimeout(r, 450));

    // Inspect PostgreSQL pg_locks for waiting (non-granted) locks
    const blockedLocks: any[] = await prismaAdmin.$queryRawUnsafe(`
      SELECT locktype, mode, granted
      FROM pg_locks
      WHERE NOT granted;
    `);

    // Assertion 1: Transaction B must NOT have finished while A held the row lock
    expect(txBFinished).toBe(false);
    expect(blockedLocks.length).toBeGreaterThanOrEqual(1);
    expect(blockedLocks[0].granted).toBe(false);

    // Step 4: Release barrier to allow Transaction A to COMMIT
    releaseBarrierA!();

    const resA = await promiseA;
    expect(resA.success).toBe(true);

    // Step 5: Transaction B unblocks, evaluates committed state, and rejects
    await promiseB;

    expect(txBFinished).toBe(true);
    expect(txBError).toBeInstanceOf(ConflictException);
    expect(txBError.message).toContain('Finish current delivery first');

    // Step 6: Query real PostgreSQL database and assert exact invariant
    const dbOrderA = await prismaAdmin.onlineOrder.findUnique({ where: { id: orderA.id } });
    const dbOrderB = await prismaAdmin.onlineOrder.findUnique({ where: { id: orderB.id } });

    expect(dbOrderA?.claimedByRiderId).toBe(testRiderA.id);
    expect(dbOrderB?.claimedByRiderId).toBeNull();

    const activeDeliveries = await prismaAdmin.onlineOrder.findMany({
      where: {
        claimedByRiderId: testRiderA.id,
        status: { notIn: ['SETTLED', 'CANCELLED'] },
      },
    });

    expect(activeDeliveries).toHaveLength(1);
    expect(activeDeliveries[0].id).toBe(orderA.id);
  });

  it('TEST B — DIFFERENT RIDERS: Two concurrent claims for different riders both succeed independently', async () => {
    // 1. Create two new READY delivery orders
    const orderC = await prismaAdmin.onlineOrder.create({
      data: {
        store_id: testStoreId,
        customer: 'Test Customer Order C',
        customerPhone: '03001000003',
        customerAddress: 'Address C',
        items: JSON.stringify([{ id: 3, name: 'Item C', price: 15, qty: 1 }]),
        totalAmount: '15.00',
        status: 'READY',
        type: 'DELIVERY',
        source: 'Website',
        timePlaced: new Date().toISOString(),
      },
    });
    createdOrderIds.push(orderC.id);

    const orderD = await prismaAdmin.onlineOrder.create({
      data: {
        store_id: testStoreId,
        customer: 'Test Customer Order D',
        customerPhone: '03001000004',
        customerAddress: 'Address D',
        items: JSON.stringify([{ id: 4, name: 'Item D', price: 25, qty: 1 }]),
        totalAmount: '25.00',
        status: 'READY',
        type: 'DELIVERY',
        source: 'Website',
        timePlaced: new Date().toISOString(),
      },
    });
    createdOrderIds.push(orderD.id);

    // Rider A has active orderA from Test A. Settle orderA so Rider A has 0 active deliveries.
    await prismaAdmin.onlineOrder.update({
      where: { id: createdOrderIds[0] },
      data: { status: 'SETTLED' },
    });

    const serviceRiderA = new RiderService(prismaA as any, mockGateway);
    const serviceRiderB = new RiderService(prismaB as any, mockGateway);

    // Fire concurrent claims for Rider A and Rider B
    const [resDiffA, resDiffB] = await Promise.all([
      serviceRiderA.claimOrder(orderC.id, { sub: testRiderA.id }),
      serviceRiderB.claimOrder(orderD.id, { sub: testRiderB.id }),
    ]);

    expect(resDiffA.success).toBe(true);
    expect(resDiffB.success).toBe(true);

    // Verify real PostgreSQL database state
    const dbOrderC = await prismaAdmin.onlineOrder.findUnique({ where: { id: orderC.id } });
    const dbOrderD = await prismaAdmin.onlineOrder.findUnique({ where: { id: orderD.id } });

    expect(dbOrderC?.claimedByRiderId).toBe(testRiderA.id);
    expect(dbOrderD?.claimedByRiderId).toBe(testRiderB.id);

    const activeA = await prismaAdmin.onlineOrder.findMany({
      where: {
        claimedByRiderId: testRiderA.id,
        status: { notIn: ['SETTLED', 'CANCELLED'] },
      },
    });
    const activeB = await prismaAdmin.onlineOrder.findMany({
      where: {
        claimedByRiderId: testRiderB.id,
        status: { notIn: ['SETTLED', 'CANCELLED'] },
      },
    });

    expect(activeA).toHaveLength(1);
    expect(activeA[0].id).toBe(orderC.id);

    expect(activeB).toHaveLength(1);
    expect(activeB[0].id).toBe(orderD.id);
  });
});
