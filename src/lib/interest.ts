// ============================================
// PledgeVault — Interest Calculation Engine
// Supports: Flat, Reducing Balance, Per-Gram
// ============================================

import { InterestMode } from './types';

/**
 * Calculate flat interest.
 * Interest = Principal × Rate × Months
 */
export function calculateFlatInterest(
  principal: number,
  monthlyRate: number, // as percentage (e.g., 1.5 for 1.5%)
  months: number
): number {
  return principal * (monthlyRate / 100) * months;
}

/**
 * Calculate reducing balance interest.
 * Each payment reduces the principal.
 */
export function calculateReducingInterest(
  principal: number,
  monthlyRate: number,
  months: number,
  totalPaid: number = 0
): number {
  const remainingPrincipal = principal - totalPaid;
  if (remainingPrincipal <= 0) return 0;
  return remainingPrincipal * (monthlyRate / 100) * months;
}

/**
 * Calculate per-gram interest.
 * Interest = Weight × Rate per gram per month × Months
 */
export function calculatePerGramInterest(
  weightGrams: number,
  ratePerGramPerMonth: number,
  months: number
): number {
  return weightGrams * ratePerGramPerMonth * months;
}

/**
 * Unified interest calculator.
 */
export function calculateInterest(
  mode: InterestMode,
  params: {
    principal: number;
    monthlyRate: number;
    months: number;
    totalPaid?: number;
    weightGrams?: number;
    ratePerGramPerMonth?: number;
  }
): number {
  switch (mode) {
    case 'flat':
      return calculateFlatInterest(params.principal, params.monthlyRate, params.months);
    case 'reducing':
      return calculateReducingInterest(
        params.principal,
        params.monthlyRate,
        params.months,
        params.totalPaid || 0
      );
    case 'per_gram':
      return calculatePerGramInterest(
        params.weightGrams || 0,
        params.ratePerGramPerMonth || params.monthlyRate,
        params.months
      );
    default:
      return calculateFlatInterest(params.principal, params.monthlyRate, params.months);
  }
}

/**
 * Calculate monthly EMI for flat rate.
 */
export function calculateMonthlyInterestAmount(
  principal: number,
  monthlyRate: number
): number {
  return principal * (monthlyRate / 100);
}

/**
 * Calculate maturity amount (principal + total interest).
 */
export function calculateMaturityAmount(
  principal: number,
  mode: InterestMode,
  monthlyRate: number,
  months: number,
  weightGrams?: number
): number {
  const interest = calculateInterest(mode, {
    principal,
    monthlyRate,
    months,
    weightGrams,
    ratePerGramPerMonth: monthlyRate,
  });
  return principal + interest;
}

/**
 * Calculate elapsed months between start date and current date.
 * Typically used to calculate interest "from the day the loan started".
 */
export function calculateElapsedMonths(startDate: string, endDate: string = new Date().toISOString()): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate difference in months
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  const dayDiff = end.getDate() - start.getDate();
  
  let totalMonths = yearDiff * 12 + monthDiff;
  
  // If even a single day of the next month has started, many shops count it as a full month.
  // We'll calculate a decimal representation for precision, or round up based on shop preference.
  // For most users, decimal is best for transparency.
  
  if (dayDiff > 0) {
    totalMonths += (dayDiff / 30); // Approximate days as part of month
  }
  
  return Math.max(0, totalMonths);
}

/**
 * Calculate accrued interest from start date to today.
 */
export function calculateAccruedInterestFromDates(
  startDate: string,
  mode: InterestMode,
  params: {
    principal: number;
    monthlyRate: number;
    currentDate?: string;
    totalPaid?: number;
    weightGrams?: number;
    ratePerGramPerMonth?: number;
  }
): number {
  const elapsedMonths = calculateElapsedMonths(startDate, params.currentDate);
  return calculateInterest(mode, {
    ...params,
    months: elapsedMonths
  });
}
