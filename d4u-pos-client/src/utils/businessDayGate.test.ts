import { describe, expect, it } from 'vitest';
import { getOpeningCashInTotal, isOpeningCashFlow } from './businessDayGate';

describe('business-day cash gate', () => {
  it('recognizes the explicit cashier opening-float marker', () => {
    expect(isOpeningCashFlow({ type: 'OPENING_FLOAT', amount: 5000 })).toBe(true);
  });

  it('keeps online settlement CASH_IN separate from cashier opening cash', () => {
    expect(isOpeningCashFlow({ type: 'CASH_IN', comment: 'Online Order #28 Cash Settlement', amount: 1200 })).toBe(false);
  });

  it('preserves compatibility with older opening-float records', () => {
    expect(isOpeningCashFlow({ type: 'CASH_IN', comment: 'Opening Float', amount: 3000 })).toBe(true);
  });

  it('sums only opening cash entries', () => {
    expect(getOpeningCashInTotal([
      { type: 'OPENING_FLOAT', amount: 5000 },
      { type: 'CASH_IN', comment: 'Online Order #28 Cash Settlement', amount: 1200 },
      { type: 'CASH_IN', comment: 'Opening Float', amount: 3000 },
      { type: 'CASH_OUT', amount: 400 },
    ])).toBe(8000);
  });
});
