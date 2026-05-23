import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseService } from '@/lib/supabase/service';
import { PlanTier, SubscriptionInterval } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature, 
      firmId, 
      planId, 
      interval, 
      amount 
    } = await request.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay keys not configured on server.' },
        { status: 500 }
      );
    }

    // 1. Verify Razorpay Payment Signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Transaction may be compromised.' },
        { status: 400 }
      );
    }

    // 2. Compute date boundaries
    const startDate = new Date();
    const endDate = new Date();
    if (interval === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // 3. Create active subscription record in the database
    await supabaseService.createSubscription({
      firmId: firmId,
      planId: planId as PlanTier,
      interval: interval as SubscriptionInterval,
      amount: amount,
      currency: 'INR',
      paymentMethod: 'razorpay',
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      razorpayPaymentId,
      razorpayOrderId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error verifying Razorpay Payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
