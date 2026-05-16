// ============================================
// PledgeVault — Gold & Silver Valuation
// ============================================

import { MetalType, GoldPurity, SilverPurity } from './types';
import { GOLD_PURITY_MAP, SILVER_PURITY_MAP } from './constants';

/**
 * Get the purity factor for a given metal and purity hallmark.
 */
export function getPurityFactor(metalType: MetalType, purity: string): number {
  if (metalType === 'gold') {
    const mapped = GOLD_PURITY_MAP[purity as GoldPurity]?.factor;
    if (mapped !== undefined) return mapped;

    // Fallback for custom numeric purity (e.g. "22" for Karat or "916" for Fineness)
    const num = parseFloat(purity);
    if (isNaN(num)) return 1;
    return num <= 24 ? num / 24 : num / 1000;
  }
  
  const mapped = SILVER_PURITY_MAP[purity as SilverPurity]?.factor;
  if (mapped !== undefined) return mapped;
  
  const num = parseFloat(purity);
  if (isNaN(num)) return 1;
  return num > 24 ? num / 1000 : 1; // Silver usually > 24 if fineness, else fallback to 1 (pure)
}

/**
 * Calculate the value of a single pledge item.
 * Value = Net Weight × Purity Factor × Rate per gram (24K/999)
 */
export function calculateItemValue(
  netWeight: number,
  metalType: MetalType,
  purity: string,
  ratePerGram: number // 24K gold or 999 silver rate
): number {
  const factor = getPurityFactor(metalType, purity);
  return Math.round(netWeight * factor * ratePerGram);
}

/**
 * Calculate loan amount from total appraised value.
 * Loan Amount = Total Value × LTV%
 */
export function calculateLoanAmount(totalValue: number, ltvPercent: number): number {
  return Math.round(totalValue * (ltvPercent / 100));
}

/**
 * Calculate total weight from items.
 */
export function calculateTotalWeight(items: { netWeight: number }[]): number {
  return items.reduce((sum, item) => sum + item.netWeight, 0);
}

/**
 * Calculate total appraised value from items.
 */
export function calculateTotalValue(items: { itemValue: number }[]): number {
  return items.reduce((sum, item) => sum + item.itemValue, 0);
}

/**
 * Get current rate for a metal type from settings.
 */
export function getMetalRate(
  metalType: MetalType,
  goldRate24K: number,
  silverRate999: number
): number {
  return metalType === 'gold' ? goldRate24K : silverRate999;
}

/**
 * Get the LTV percentage for a metal type.
 */
export function getDefaultLtv(
  metalType: MetalType,
  ltvGold: number,
  ltvSilver: number
): number {
  return metalType === 'gold' ? ltvGold : ltvSilver;
}
