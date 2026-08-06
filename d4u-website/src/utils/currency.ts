// D4U does not do currency conversion on the website -- the price stored on
// every product IS the real selling price in PKR, full stop. This used to
// branch on window.d4u_currency (Brand.currency), but that field can be set
// to 'USD' at the brand level for unrelated reasons and there is no actual
// USD pricing/conversion behind it on this site, so honoring it just meant
// showing '$' in front of a PKR number. Always Rs. here, no exceptions.
export const formatCurrency = (amount: number): string => {
  if (amount % 1 !== 0) return `Rs. ${amount.toFixed(2)}`;
  return `Rs. ${amount.toLocaleString()}`;
};
