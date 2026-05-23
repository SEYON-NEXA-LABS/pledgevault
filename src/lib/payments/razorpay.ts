/**
 * PledgeVault — Razorpay Payment Stub
 * This utility simulates the Razorpay checkout process for development purposes.
 */

import { supabase } from '../supabase/client';
import { PlanTier, SubscriptionInterval } from '../types';

interface RazorpayStubOptions {
  planId: PlanTier;
  interval: SubscriptionInterval;
  amount: number;
  firmName: string;
  onSuccess: (response: any) => void;
  onModalClose?: () => void;
}

export const razorpayStub = async (options: RazorpayStubOptions) => {
  console.log('--- Razorpay Stub Initialized ---');
  console.log(`Plan: ${options.planId} (${options.interval})`);
  console.log(`Amount: ₹${options.amount}`);
  
  // Create a overlay to simulate the Razorpay Modal
  const overlay = document.createElement('div');
  overlay.id = 'razorpay-stub-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #fff;
    width: 400px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease-out;
  `;

  modal.innerHTML = `
    <div style="background: #2D2D2D; padding: 24px; color: #fff; display: flex; align-items: center; gap: 16px;">
      <div style="width: 48px; height: 48px; background: #3399FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px;">P</div>
      <div>
        <div style="font-weight: 700; font-size: 16px;">PledgeVault</div>
        <div style="font-size: 12px; color: #aaa;">${options.firmName} | Plan: ${options.planId.toUpperCase()}</div>
      </div>
    </div>
    <div style="padding: 24px;">
      <div style="font-size: 14px; margin-bottom: 24px; color: #444;">
        <span style="color: #888;">Order ID:</span> <span style="font-weight: 600;">order_PV_${Math.random().toString(36).slice(2, 9)}</span>
      </div>
      <div style="background: #F8F9FA; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Amount to Pay</div>
        <div style="font-size: 24px; font-weight: 800; color: #111;">₹${new Intl.NumberFormat('en-IN').format(options.amount)}</div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 12px;">Select Payment Method</div>
        <div style="display: grid; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #E8E8E3; border-radius: 8px; cursor: pointer;">
            <input type="radio" name="pay_method" value="upi" checked> <span>UPI (GPay/PhonePe)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #E8E8E3; border-radius: 8px; cursor: pointer;">
            <input type="radio" name="pay_method" value="card"> <span>Debit / Credit Card</span>
          </label>
          <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #E8E8E3; border-radius: 8px; cursor: pointer;">
            <input type="radio" name="pay_method" value="netbanking"> <span>Netbanking</span>
          </label>
        </div>
      </div>
      
      <button id="pay-success-btn" style="width: 100%; padding: 14px; background: #3399FF; color: #fff; border: none; border-radius: 6px; font-weight: 700; font-size: 14px; cursor: pointer; margin-bottom: 12px; transition: background 0.2s;">
        Simulate Success
      </button>
      <button id="pay-cancel-btn" style="width: 100%; padding: 14px; background: #fff; color: #dc3545; border: 1px solid #dc3545; border-radius: 6px; font-weight: 700; font-size: 14px; cursor: pointer;">
        Cancel Payment
      </button>
      
      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #888;">
        Razorpay Stub v1.1 • Development Mode Only
      </div>
    </div>
    <style>
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #pay-success-btn:hover { background: #2288EE !important; }
    </style>
  `;

  document.body.appendChild(overlay);
  overlay.appendChild(modal);

  return new Promise((resolve) => {
    const cleanup = () => {
      document.body.removeChild(overlay);
    };

    document.getElementById('pay-success-btn')?.addEventListener('click', async () => {
      const selectedMethod = (document.querySelector('input[name="pay_method"]:checked') as HTMLInputElement)?.value || 'upi';
      
      const btn = document.getElementById('pay-success-btn') as HTMLButtonElement;
      btn.innerText = 'Verifying Payment...';
      btn.disabled = true;
      
      await new Promise(r => setTimeout(r, 1500));
      
      const startDate = new Date();
      const endDate = new Date();
      if (options.interval === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const mockResult = {
        razorpayPaymentId: `pay_${Math.random().toString(36).slice(2, 11)}`,
        razorpayOrderId: `order_${Math.random().toString(36).slice(2, 11)}`,
        razorpaySignature: Math.random().toString(36).slice(2, 20),
        paymentMethod: selectedMethod,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      cleanup();
      options.onSuccess(mockResult);
      resolve(mockResult);
    });

    document.getElementById('pay-cancel-btn')?.addEventListener('click', () => {
      cleanup();
      if (options.onModalClose) options.onModalClose();
      resolve(null);
    });
  });
};

export const initializeRazorpayPayment = async (options: {
  planId: PlanTier;
  interval: SubscriptionInterval;
  amount: number;
  firmId: string;
  firmName: string;
  firmEmail?: string;
  onSuccess: (response: any) => Promise<void>;
  onModalClose?: () => void;
}) => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId || keyId.startsWith('stub_') || keyId === '') {
    return razorpayStub({
      planId: options.planId,
      interval: options.interval,
      amount: options.amount,
      firmName: options.firmName,
      onSuccess: options.onSuccess,
      onModalClose: options.onModalClose
    });
  }

  // Real checkout flow:
  // 1. Load Razorpay script
  const loaded = await new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  if (!loaded) {
    alert('Razorpay payment gateway failed to load.');
    return null;
  }

  try {
    // 2. Call local API endpoint to generate a secure Razorpay Order ID
    const orderRes = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: options.amount,
        planId: options.planId,
        interval: options.interval,
        firmId: options.firmId
      })
    });
    
    if (!orderRes.ok) {
      const errText = await orderRes.text();
      alert('Failed to generate secure checkout order: ' + errText);
      return null;
    }

    const orderData = await orderRes.json();
    if (!orderData.success) {
      alert('Failed to generate secure checkout order: ' + orderData.error);
      return null;
    }

    // 3. Open Razorpay Checkout Dialog
    return new Promise((resolve) => {
      const rzpOptions = {
        key: keyId,
        amount: options.amount * 100, // in paise subunits
        currency: 'INR',
        name: 'PledgeVault',
        description: `Upgrade to ${options.planId.toUpperCase()} Plan`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          // 4. Verify payment signature securely on the server
          try {
            const verifyRes = await fetch('/api/payments/verify-signature', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                firmId: options.firmId,
                planId: options.planId,
                interval: options.interval,
                amount: options.amount
              })
            });

            if (!verifyRes.ok) {
              const errText = await verifyRes.text();
              alert('Payment verification failed: ' + errText);
              resolve(null);
              return;
            }

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await options.onSuccess({
                paymentMethod: 'razorpay',
                startDate: new Date().toISOString(),
                endDate: options.interval === 'monthly'
                  ? new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
                  : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id
              });
              resolve(response);
            } else {
              alert('Payment verification failed: ' + verifyData.error);
              resolve(null);
            }
          } catch (err: any) {
            alert('Verification failed: ' + err.message);
            resolve(null);
          }
        },
        prefill: {
          name: options.firmName,
          email: options.firmEmail || ''
        },
        theme: {
          color: '#0B1528' // Matches the brand aesthetics
        },
        modal: {
          ondismiss: () => {
            if (options.onModalClose) options.onModalClose();
            resolve(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
    });
  } catch (err: any) {
    alert('Checkout initialization failed: ' + err.message);
    return null;
  }
};
