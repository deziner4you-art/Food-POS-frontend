import { TablesService } from './tables.service';

describe('TablesService stale occupancy protection', () => {
  function makeClient(table: any, currentOrder: any, openDay: any = { id: 10 }) {
    return {
      restaurantTable: {
        findUnique: jest.fn().mockResolvedValue(table),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({ ...table, ...data })),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      order: { findUnique: jest.fn().mockResolvedValue(currentOrder) },
      businessDay: { findFirst: jest.fn().mockResolvedValue(openDay) },
    } as any;
  }

  it('clears a terminal old table pointer and assigns the new order', async () => {
    const table = { id: 1, store_id: 1, label: 'T1', status: 'OCCUPIED', current_order_id: 9 };
    const client = makeClient(table, { id: 9, store_id: 1, status: 'SETTLED', business_day_id: 10 });
    const result = await new TablesService(client).assignTable(1, 'T1', 20, client);

    expect(result).toMatchObject({ status: 'OCCUPIED', current_order_id: 20 });
    expect(client.restaurantTable.update).toHaveBeenCalledTimes(2);
  });

  it('clears a previous-business-day pointer before assigning the new order', async () => {
    const table = { id: 1, store_id: 1, label: 'T1', status: 'OCCUPIED', current_order_id: 9 };
    const client = makeClient(table, { id: 9, store_id: 1, status: 'PENDING', business_day_id: 9 }, { id: 10 });
    const result = await new TablesService(client).assignTable(1, 'T1', 20, client);

    expect(result.current_order_id).toBe(20);
  });

  it('still rejects a genuinely active order in the current business day', async () => {
    const table = { id: 1, store_id: 1, label: 'T1', status: 'OCCUPIED', current_order_id: 9 };
    const client = makeClient(table, { id: 9, store_id: 1, status: 'PENDING', business_day_id: 10 });

    await expect(new TablesService(client).assignTable(1, 'T1', 20, client))
      .rejects.toThrow('Table T1 is already occupied by order #9');
  });
});
