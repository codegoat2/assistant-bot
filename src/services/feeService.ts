/**
 * Fee Calculation Service
 * Calculates exchange fees based on hardcoded defaults and payment methods.
 */

export const DEFAULT_FEE_PERCENTAGE = 10; // 10% default fee

// Minimum fees in USD for payment methods
export const MINIMUM_FEES: Record<string, number> = {
  PAYPAL: 5,
  REVOLUT: 2,
  WISE: 0,
  BANK_TRANSFER: 0,
  CASH_IN_PERSON: 0,
  OTHER: 0,
};

export const PAYMENT_METHODS = [
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'REVOLUT', label: 'Revolut' },
  { value: 'WISE', label: 'Wise' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH_IN_PERSON', label: 'Cash In Person' },
  { value: 'OTHER', label: 'Other' },
];

export const CRYPTOCURRENCIES = [
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'LTC', label: 'Litecoin (LTC)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'USDC', label: 'USDC (USDC)' },
];

export const FIAT_CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
];

export interface FeeCalculation {
  userAmount: number;
  feePercentage: number;
  feeAmount: number;
  minimumFee: number;
  finalFee: number;
  finalAmount: number;
}

/**
 * Calculate fees for an exchange
 * @param amount Amount the user is sending/receiving in fiat
 * @param paymentMethod Payment method (determines minimum fee)
 * @returns Calculated fee breakdown
 */
export function calculateFees(
  amount: number,
  paymentMethod: string
): FeeCalculation {
  const feePercentage = DEFAULT_FEE_PERCENTAGE;
  const percentageFee = amount * (feePercentage / 100);
  const minimumFee = MINIMUM_FEES[paymentMethod] || 0;
  
  // Use the higher of percentage fee or minimum fee
  const finalFee = Math.max(percentageFee, minimumFee);
  const finalAmount = amount - finalFee;

  return {
    userAmount: amount,
    feePercentage,
    feeAmount: Math.round(percentageFee * 100) / 100,
    minimumFee,
    finalFee: Math.round(finalFee * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
  };
}

/**
 * Format fee calculation for display
 */
export function formatFeeBreakdown(
  crypto: string,
  fiat: string,
  paymentMethod: string,
  userAmount: number,
  fees: FeeCalculation
): string {
  const lines = [
    `**Exchange Details:**`,
    `From: ${crypto}`,
    `To: ${fiat}`,
    `Payment Method: ${paymentMethod}`,
    ``,
    `**Amount Breakdown:**`,
    `Amount: **${fiat} ${userAmount.toFixed(2)}**`,
    `Fee (${fees.feePercentage}%): **${fiat} ${fees.feeAmount.toFixed(2)}**`,
  ];

  // Show if minimum fee applied
  if (fees.finalFee > fees.feeAmount) {
    lines.push(
      `Minimum Fee Applied: **${fiat} ${fees.minimumFee.toFixed(2)}**`
    );
  }

  lines.push(
    ``,
    `**You will receive:**`,
    `**${fiat} ${fees.finalAmount.toFixed(2)}**`
  );

  return lines.join('\n');
}
