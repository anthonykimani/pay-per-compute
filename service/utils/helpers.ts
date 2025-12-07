export const calculateMinutesFromPayment = (amountPaid: string, pricePerUnit: string): number => {
  return parseFloat(amountPaid) / parseFloat(pricePerUnit);
};

export const formatUSDC = (amount: string | number): string => {
  return parseFloat(amount.toString()).toFixed(6);
};

export const timeUntilExpiry = (expiresAt: Date): number => {
  return Math.ceil((expiresAt.getTime() - Date.now()) / 60000);
};

export const generateSessionToken = (): string => {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const isValidSolanaAddress = (address: string): boolean => {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};