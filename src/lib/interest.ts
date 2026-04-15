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
