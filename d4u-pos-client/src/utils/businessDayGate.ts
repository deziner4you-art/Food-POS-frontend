export type CashFlowLike = {
  type?: unknown;
  comment?: unknown;
  amount?: unknown;
};

/** Only the cashier's opening-float entry can unlock the POS cash-in gate. */
export function isOpeningCashFlow(flow: CashFlowLike): boolean {
  return flow?.type === 'OPENING_FLOAT' ||
    (flow?.type === 'CASH_IN' && flow?.comment === 'Opening Float');
}

export function getOpeningCashInTotal(flows: CashFlowLike[]): number {
  return flows
    .filter(isOpeningCashFlow)
    .reduce((sum, flow) => sum + Number(flow.amount || 0), 0);
}
