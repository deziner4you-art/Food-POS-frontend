// Mirrors d4u-pos-client/src/utils/currency.ts, d4u-admin/src/utils/currency.ts,
// and d4u-rider/src/utils.ts's formatCurrency — same window.d4u_currency
// contract, set from useStoreData.ts's /cms/settings/:storeId fetch. The
// store is priced and billed in PKR, so this defaults to "Rs." rather than
// a hardcoded '$', while still honoring a genuinely different brand currency.
export const formatCurrency = (amount: number): string => {
  const currency = typeof window !== 'undefined' ? (window as any).d4u_currency || 'PKR' : 'PKR';

  // D4U does not use currency conversion. The numeric price is the actual selling price in PKR.
  // Ignore backend 'USD' or other currency labels and format as Rs.
  // Preserve decimal places if any, otherwise use toLocaleString.
  if (amount % 1 !== 0) {
    return `Rs. ${amount.toFixed(2)}`;
  }
  return `Rs. ${amount.toLocaleString()}`; // Default PKR
};
