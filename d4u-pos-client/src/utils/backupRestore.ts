import { db, isValidPosIntegerId } from '../db';

/**
 * Task #3C-3: Pre-validates KOT records in backup data.
 * Every imported KOT must have a finite positive integer store_id and businessDayId.
 * Throws an Error before any destructive DB operations if any record is invalid.
 */
export function validateBackupKots(kots: any[]): void {
  if (!Array.isArray(kots)) {
    throw new Error('Invalid backup: kots must be an array');
  }

  for (let i = 0; i < kots.length; i++) {
    const kot = kots[i];
    const indexLabel = `KOT record at index ${i} (orderId: ${kot?.orderId ?? kot?.order_id ?? 'unknown'})`;

    if (!kot || typeof kot !== 'object') {
      throw new Error(`Invalid backup: ${indexLabel} is not a valid object`);
    }

    if (!isValidPosIntegerId(kot.store_id)) {
      throw new Error(
        `Invalid backup: ${indexLabel} has missing or invalid store_id. Every KOT in backup must have a finite positive integer store_id.`
      );
    }

    if (!isValidPosIntegerId(kot.businessDayId)) {
      throw new Error(
        `Invalid backup: ${indexLabel} has missing or invalid businessDayId. Every KOT in backup must have a finite positive integer businessDayId.`
      );
    }
  }
}

/**
 * Task #3C-3: Restores validated backup data into Dexie.
 * Guarantees that KOT validation runs BEFORE database.transaction and BEFORE db.kots.clear().
 */
export async function restoreBackupData(
  data: any,
  database: any = db
): Promise<void> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup format');
  }

  // Pre-validate KOT identities BEFORE any transaction or destructive clear/add
  if (data.kots) {
    validateBackupKots(data.kots);
  }

  await database.transaction(
    'rw',
    database.kots,
    database.inventory,
    database.crmCustomers,
    database.staffLogs,
    async () => {
      if (data.kots) {
        await database.kots.clear();
        await database.kots.bulkAdd(data.kots);
      }
      if (data.inventory) {
        await database.inventory.clear();
        await database.inventory.bulkAdd(data.inventory);
      }
      if (data.crmCustomers) {
        await database.crmCustomers.clear();
        await database.crmCustomers.bulkAdd(data.crmCustomers);
      }
      if (data.staffLogs) {
        await database.staffLogs.clear();
        await database.staffLogs.bulkAdd(data.staffLogs);
      }
    }
  );
}
