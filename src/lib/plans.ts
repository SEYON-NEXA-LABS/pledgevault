import { PlanTier, PlanLimits } from './types';
import { PLAN_LIMITS, GRACE_PERIOD_DAYS } from './constants';

/**
 * Checks if a subscription is within its validity period or the 7-day grace period.
 */
export function isSubscriptionActive(endDate: string | null | undefined): boolean {
  if (!endDate) return false;
  
  const end = new Date(endDate);
  const now = new Date();
  
  if (now <= end) return true;
  
  const graceEnd = new Date(end);
  graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);
  
  return now <= graceEnd;
}

/**
 * Checks if a firm has exceeded its plan's loan capacity.
 */
export function isWithinLoanLimits(currentCount: number, plan: PlanTier): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return currentCount < limits.maxLoans;
}

/**
 * Higher level check for whether a firm can create a new loan.
 */
export function canCreateLoan(
  currentCount: number, 
  plan: PlanTier, 
  subscriptionEndDate: string | null | undefined
): { allowed: boolean; reason?: 'expired' | 'limit_exceeded' } {
  
  // 1. Check expiration + grace period
  if (!isSubscriptionActive(subscriptionEndDate)) {
    return { allowed: false, reason: 'expired' };
  }
  
  // 2. Check loan capacity
  if (!isWithinLoanLimits(currentCount, plan)) {
    return { allowed: false, reason: 'limit_exceeded' };
  }
  
  return { allowed: true };
}
