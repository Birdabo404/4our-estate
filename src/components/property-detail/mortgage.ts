export type RatePreset = {
  id: "pagibig" | "bank-fixed-1" | "bank-fixed-5";
  label: string;
  detail: string;
  annualRate: number;
  /** Largest loan the lender extends; the balance would need other financing. */
  loanCap: number | null;
};

/** Indicative 2026 rates. Pag-IBIG's housing loan ceiling is ₱6M. */
export const RATE_PRESETS: readonly RatePreset[] = [
  { id: "pagibig", label: "Pag-IBIG", detail: "3-yr fixed", annualRate: 6.25, loanCap: 6_000_000 },
  { id: "bank-fixed-1", label: "Bank", detail: "1-yr fixed", annualRate: 6.5, loanCap: null },
  { id: "bank-fixed-5", label: "Bank", detail: "5-yr fixed", annualRate: 7.75, loanCap: null },
];

export const DOWN_PAYMENT = { min: 10, max: 50, step: 5, initial: 20 } as const;
export const TERM_YEARS = { min: 5, max: 30, step: 5, initial: 20 } as const;

export type Estimate = {
  downPayment: number;
  principal: number;
  monthly: number;
  totalInterest: number;
};

/** Standard amortization: P · r / (1 − (1 + r)^−n), with r the monthly rate. */
export function estimate(price: number, downPercent: number, annualRate: number, years: number): Estimate {
  const downPayment = Math.round((price * downPercent) / 100);
  const principal = price - downPayment;
  const months = years * 12;
  const rate = annualRate / 100 / 12;
  const monthly = rate === 0 ? principal / months : (principal * rate) / (1 - (1 + rate) ** -months);
  return { downPayment, principal, monthly, totalInterest: monthly * months - principal };
}
