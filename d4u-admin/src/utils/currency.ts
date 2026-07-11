export const formatCurrency = (amount: number): string => {
  const currency = typeof window !== 'undefined' ? (window as any).d4u_currency || 'PKR' : 'PKR';
  
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  if (currency === 'AED') return `AED ${amount.toFixed(2)}`;
  if (currency === 'GBP') return `£${amount.toFixed(2)}`;
  if (currency === 'EUR') return `€${amount.toFixed(2)}`;
  
  return `Rs. ${amount.toLocaleString()}`; // Default PKR
};
