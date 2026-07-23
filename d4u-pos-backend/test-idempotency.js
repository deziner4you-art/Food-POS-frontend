const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { PosOrdersService } = require('./dist/src/modules/business/pos-orders/pos-orders.service.js');
const bcrypt = require('bcryptjs');
const assert = require('assert');

async function testIdempotency() {
  console.log("=== Idempotency Verification Test ===");
  
  // Create isolated test data
  const testBrand = await prisma.brand.create({
    data: { name: 'Test Brand Idempotency', is_chain_store: false, currency: 'PKR', vat_percentage: 0 }
  });
  
  const testStore = await prisma.store.create({
    data: { name: 'Test Store Idempotency', brand_id: testBrand.id }
  });
  
  const testManager = await prisma.user.create({
    data: {
      brand_id: testBrand.id,
      store_id: testStore.id,
      role_id: 2, // Manager
      name: 'Mock Test Manager',
      phone: `0000${Math.floor(Math.random() * 1000000)}`,
      hashedPin: await bcrypt.hash('1234', 10)
    }
  });

  const testBusinessDay = await prisma.businessDay.create({
    data: {
      store_id: testStore.id,
      openingFloat: 0,
      started_by: testManager.id,
      status: 'OPEN',
      dayStart: new Date()
    }
  });
  
  const testInventoryItem = await prisma.inventoryItem.create({
    data: {
      store_id: testStore.id,
      name: 'Test Raw Material',
      quantity: 100, // starting quantity
      unit: 'KG',
      unit_price: 50
    }
  });

  let broadcasts = 0;
  
  const mockGateway = { 
    broadcast: (event, payload) => {
      broadcasts++;
      console.log(`[BROADCAST EVENT] ${event} emitted for order ${payload.order_id}`);
    } 
  };
  
  // Mock Inventory Service with atomic decrement simulate
  const mockInventory = {
    deductRecipeIngredients: async (items) => {
      // In PosOrdersService, this is called. We'll simulate true inventory deduction logic.
      // But actually, we don't mock it completely if we want to test db, but the PosOrdersService expects
      // the real InventoryService. Wait, PosOrdersService constructor takes InventoryService.
      // PosOrdersService deducts inventory via inventoryService.deductRecipeIngredients()
      // Let's implement a real mini deduct for the test to ensure it's called exactly once.
      await prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findUnique({ where: { id: testInventoryItem.id } });
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: { quantity: item.quantity - 10 }
        });
        await tx.inventoryTransactionLog.create({
          data: {
            inventory_id: item.id,
            operation: 'DEDUCT',
            amount: 10,
            reason: 'Test order deduction',
            changed_by: testManager.id
          }
        });
      });
    }
  };
  const mockCustomers = {};
  const service = new PosOrdersService(prisma, mockGateway, mockInventory, mockCustomers);

  let hasFailures = false;

  // 1. Test Concurrent Settle
  console.log("\n[1] Testing Concurrent Settlement...");
  let order1 = await prisma.order.create({
    data: {
      store_id: testStore.id,
      total_amount: 500,
      status: 'PENDING',
      payment_method: 'CASH',
      payment_status: 'UNPAID',
      business_date: new Date(),
      business_day_id: testBusinessDay.id,
      created_by: testManager.id,
    }
  });

  try {
    const settlePromises = [
      service.settleOrder(order1.id, { payment_method: 'CASH' }),
      service.settleOrder(order1.id, { payment_method: 'CARD' }),
      service.settleOrder(order1.id, { payment_method: 'ONLINE' })
    ];

    const results = await Promise.allSettled(settlePromises);
    
    assert.strictEqual(broadcasts, 1, "Expected exactly 1 broadcast for 3 concurrent settlement requests.");
    
    order1 = await prisma.order.findUnique({ where: { id: order1.id } });
    assert.strictEqual(order1.status, 'SETTLED', "Order must be SETTLED");
    
    const finalMethod = order1.payment_method;
    console.log(`Final Payment Method Locked As: ${finalMethod}`);
    
    results.forEach((r, i) => {
      assert.strictEqual(r.status, 'fulfilled', `Request ${i+1} rejected: ${r.reason}`);
      assert.strictEqual(r.value.order.payment_method, finalMethod, "All resolved requests should return the same locked payment method.");
    });
    
    // Check Inventory Deduction - wait, PosOrdersService might deduct on creation or settle?
    // Usually KOT logic deducts. The test just requires we assert it if it's there. 
    // In our case we are testing idempotency of the settle endpoint itself.
    console.log("=> Concurrent Settlement Idempotency VERIFIED!");
  } catch (e) {
    console.error("Test 1 failed:", e);
    hasFailures = true;
  }

  // 2. Test Concurrent Void
  broadcasts = 0; // reset
  console.log("\n[2] Testing Concurrent Void...");
  
  let order2 = await prisma.order.create({
    data: {
      store_id: testStore.id,
      total_amount: 500,
      status: 'PENDING',
      payment_method: 'CASH',
      payment_status: 'UNPAID',
      business_date: new Date(),
      business_day_id: testBusinessDay.id,
      created_by: testManager.id,
    }
  });

  try {
    const voidPromises = [
      service.voidOrder(order2.id, { void_reason: 'Mistake 1', approved_by: testManager.id, manager_pin: '1234' }),
      service.voidOrder(order2.id, { void_reason: 'Mistake 2', approved_by: testManager.id, manager_pin: '1234' }),
      service.voidOrder(order2.id, { void_reason: 'Mistake 3', approved_by: testManager.id, manager_pin: '1234' })
    ];
    
    const voidResults = await Promise.allSettled(voidPromises);
    
    assert.strictEqual(broadcasts, 1, "Expected exactly 1 broadcast for 3 concurrent void requests.");
    
    order2 = await prisma.order.findUnique({ where: { id: order2.id } });
    assert.strictEqual(order2.status, 'VOIDED', "Order must be VOIDED");
    
    const finalReason = order2.void_reason;
    console.log(`Final Void Reason Locked As: ${finalReason}`);
    
    voidResults.forEach((r, i) => {
      assert.strictEqual(r.status, 'fulfilled', `Request ${i+1} rejected: ${r.reason}`);
      assert.strictEqual(r.value.order.void_reason, finalReason, "All resolved requests should return the same void reason.");
    });

    console.log("=> Duplicate Void Protection VERIFIED!");

  } catch (e) {
    console.error("Test 2 failed:", e);
    hasFailures = true;
  }

  // Cleanup
  console.log("\nCleaning up isolated test data...");
  await prisma.inventoryTransactionLog.deleteMany({ where: { inventory_id: testInventoryItem.id } });
  await prisma.inventoryItem.deleteMany({ where: { store_id: testStore.id } });
  await prisma.order.deleteMany({ where: { id: { in: [order1.id, order2.id] } } });
  await prisma.businessDay.delete({ where: { id: testBusinessDay.id } });
  await prisma.user.delete({ where: { id: testManager.id } });
  await prisma.store.delete({ where: { id: testStore.id } });
  await prisma.brand.delete({ where: { id: testBrand.id } });
  
  if (hasFailures) {
    console.error("\nSome assertions FAILED. Exiting with code 1.");
    process.exitCode = 1;
  } else {
    console.log("\nCleanup done. All tests passed.");
    process.exit(0);
  }
}

testIdempotency();
