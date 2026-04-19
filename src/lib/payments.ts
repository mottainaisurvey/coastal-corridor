import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export interface PaymentIntentData {
  amount: bigint; // in kobo
  currency: string;
  description: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(data: PaymentIntentData) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    const intent = await stripe.paymentIntents.create({
      amount: Number(data.amount), // Stripe expects amount in smallest currency unit
      currency: data.currency.toLowerCase(),
      description: data.description,
      metadata: data.metadata || {},
    });

    return {
      clientSecret: intent.client_secret,
      intentId: intent.id,
      status: intent.status,
    };
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw error;
  }
}

export async function confirmPayment(intentId: string) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    const intent = await stripe.paymentIntents.retrieve(intentId);
    return {
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
    };
  } catch (error) {
    console.error('Failed to confirm payment:', error);
    throw error;
  }
}

export async function refundPayment(intentId: string, amount?: number) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    const refund = await stripe.refunds.create({
      payment_intent: intentId,
      amount: amount,
    });

    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
    };
  } catch (error) {
    console.error('Failed to refund payment:', error);
    throw error;
  }
}

export async function createConnectAccount(email: string, agentName: string) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      business_profile: {
        name: agentName,
        support_email: email,
      },
    });

    return {
      accountId: account.id,
      onboardingUrl: await getOnboardingUrl(account.id),
    };
  } catch (error) {
    console.error('Failed to create Stripe Connect account:', error);
    throw error;
  }
}

export async function getOnboardingUrl(accountId: string) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/agent/stripe/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/agent/stripe/return`,
    });

    return link.url;
  } catch (error) {
    console.error('Failed to get onboarding URL:', error);
    throw error;
  }
}
