import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const { amount, planId, interval, firmId } = await request.json();

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay keys not configured on server.' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Amount in subunits (e.g. paise. 1 INR = 100 paise)
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${firmId}_${Date.now().toString().slice(-8)}`,
      notes: {
        firmId,
        planId,
        interval,
      },
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: any) {
    console.error('Error creating Razorpay Order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
