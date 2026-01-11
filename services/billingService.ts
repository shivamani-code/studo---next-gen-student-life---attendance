import { supabase } from './supabaseClient';

type BillingStatus = {
  ok: boolean;
  accessAllowed: boolean;
  isPaid: boolean;
  status: string;
  trialEndsAt: string | null;
  trialHoursLeft: number | null;
  currentPeriodEnd: string | null;
  razorpaySubscriptionId: string | null;
};

export class BillingService {
  static async getStatus(): Promise<BillingStatus> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      return {
        ok: false,
        accessAllowed: false,
        isPaid: false,
        status: 'unauthenticated',
        trialEndsAt: null,
        trialHoursLeft: null,
        currentPeriodEnd: null,
        razorpaySubscriptionId: null
      };
    }

    const { data, error } = await supabase.functions.invoke('billing-status', {
      body: {},
      headers: { Authorization: `Bearer ${token}` }
    });

    if (error) {
      return {
        ok: false,
        accessAllowed: false,
        isPaid: false,
        status: error.message,
        trialEndsAt: null,
        trialHoursLeft: null,
        currentPeriodEnd: null,
        razorpaySubscriptionId: null
      };
    }

    return data as BillingStatus;
  }

  static async createSubscription(): Promise<{ ok: true; keyId: string; subscriptionId: string } | { ok: false; error: string }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { ok: false, error: 'Not authenticated' };

    const { data, error } = await supabase.functions.invoke('billing-create-subscription', {
      body: {},
      headers: { Authorization: `Bearer ${token}` }
    });

    if (error) {
      const anyErr = error as any;
      const msg = anyErr?.context?.statusText || error.message;
      return { ok: false, error: msg };
    }

    if (!(data as any)?.ok) return { ok: false, error: (data as any)?.error || 'Unable to create subscription' };

    return { ok: true, keyId: (data as any).keyId, subscriptionId: (data as any).subscriptionId };
  }

  static async loadRazorpay(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if ((window as any).Razorpay) return true;

    return new Promise((resolve) => {
      const existing = document.getElementById('razorpay-checkout-js');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  static async openCheckout(args: { keyId: string; subscriptionId: string; onSuccess: () => void; onDismiss: () => void }) {
    const ok = await this.loadRazorpay();
    if (!ok) throw new Error('Failed to load Razorpay checkout');

    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) throw new Error('Razorpay not available');

    const rzp = new RazorpayCtor({
      key: args.keyId,
      subscription_id: args.subscriptionId,
      name: 'Studo',
      description: 'Studo Pro Subscription',
      handler: () => args.onSuccess(),
      modal: { ondismiss: () => args.onDismiss() }
    });

    rzp.open();
  }
}
