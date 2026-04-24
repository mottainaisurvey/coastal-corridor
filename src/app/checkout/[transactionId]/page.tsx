'use client';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { ArrowLeft, ShieldCheck, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface TransactionDetail {
  id: string;
  reference: string;
  status: string;
  agreedPriceKobo: string;
  currency: string;
  clientSecret: string | null;
  listing: {
    id: string;
    property: {
      title: string;
      type: string;
    } | null;
    plot: {
      plotId: string;
      destination: { name: string; state: string } | null;
    } | null;
  } | null;
}

// ─── Inner checkout form (rendered inside <Elements>) ───────────────────────

function CheckoutForm({ transaction }: { transaction: TransactionDetail }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const amountNGN = (Number(transaction.agreedPriceKobo) / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account/transactions?ref=${transaction.reference}`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
      setProcessing(false);
      return;
    }

    setSucceeded(true);
    setProcessing(false);
    setTimeout(() => router.push(`/account/transactions?ref=${transaction.reference}`), 2000);
  }

  if (succeeded) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-sage" />
        </div>
        <h2 className="text-xl font-light text-ink mb-2">Payment Received</h2>
        <p className="text-ink/60 text-sm">
          Your payment is being processed. You will receive a confirmation email shortly.
        </p>
        <p className="text-xs text-ink/40 mt-2">Redirecting to your transactions…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order summary */}
      <div className="bg-sand rounded-xl p-5">
        <h3 className="text-sm font-medium text-ink mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink/60">Property</span>
            <span className="text-ink font-medium">
              {transaction.listing?.property?.title || 'Property'}
            </span>
          </div>
          {transaction.listing?.plot?.plotId && (
            <div className="flex justify-between">
              <span className="text-ink/60">Plot ID</span>
              <span className="text-ink">{transaction.listing.plot.plotId}</span>
            </div>
          )}
          {transaction.listing?.plot?.destination && (
            <div className="flex justify-between">
              <span className="text-ink/60">Location</span>
              <span className="text-ink">
                {transaction.listing.plot.destination.name}, {transaction.listing.plot.destination.state}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink/60">Reference</span>
            <span className="text-ink font-mono text-xs">{transaction.reference}</span>
          </div>
          <div className="border-t border-ink/10 pt-2 mt-2 flex justify-between font-medium">
            <span className="text-ink">Total</span>
            <span className="text-ink text-base">{amountNGN}</span>
          </div>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div>
        <h3 className="text-sm font-medium text-ink mb-3">Payment Details</h3>
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'bank_transfer'],
          }}
        />
      </div>

      {error && (
        <div className="bg-laterite/10 border border-laterite/30 rounded-lg p-4 flex items-start gap-2 text-sm text-laterite">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-center gap-2 text-xs text-ink/40">
        <Lock className="w-3.5 h-3.5" />
        <span>Payments are processed securely by Stripe. Your card details are never stored on our servers.</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full bg-ocean text-white py-3.5 rounded-xl text-sm font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay {amountNGN}
          </>
        )}
      </button>
    </form>
  );
}

// ─── Page wrapper ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const transactionId = params.transactionId as string;

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId || !transactionId) return;
    fetch(`/api/transactions?id=${transactionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setFetchError(data.error);
          return;
        }
        const txn = Array.isArray(data.data) ? data.data[0] : data.data;
        if (!txn) {
          setFetchError('Transaction not found');
          return;
        }
        setTransaction(txn);
      })
      .catch(() => setFetchError('Failed to load transaction details'))
      .finally(() => setLoading(false));
  }, [userId, transactionId]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError || !transaction) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-laterite mx-auto mb-4" />
          <p className="text-ink font-medium">{fetchError || 'Transaction not found'}</p>
          <Link href="/account/transactions" className="text-ocean text-sm mt-2 inline-block hover:underline">
            View all transactions
          </Link>
        </div>
      </div>
    );
  }

  // Already completed
  if (transaction.status === 'COMPLETED' || transaction.status === 'ESCROW_FUNDED') {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-sage" />
          </div>
          <h2 className="text-xl font-light text-ink mb-2">Payment Already Received</h2>
          <p className="text-ink/60 text-sm mb-6">This transaction has already been funded.</p>
          <Link href="/account/transactions" className="bg-ocean text-white px-6 py-2.5 rounded-lg text-sm hover:bg-ocean/90 transition-colors">
            View Transactions
          </Link>
        </div>
      </div>
    );
  }

  if (!transaction.clientSecret || !stripePromise) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-ochre mx-auto mb-4" />
          <p className="text-ink font-medium">Payment not yet initialised</p>
          <p className="text-ink/60 text-sm mt-1">
            {!stripePromise
              ? 'Stripe is not configured. Please contact support.'
              : 'This transaction does not have a payment intent. Please contact support.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account/transactions" className="inline-flex items-center gap-2 text-ink/50 hover:text-ink text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Transactions
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-ocean" />
            <h1 className="text-2xl font-light text-ink">Secure Checkout</h1>
          </div>
          <p className="text-ink/60 text-sm">
            Complete your property purchase. Funds are held in escrow until title transfer is confirmed.
          </p>
        </div>

        {/* Checkout form */}
        <div className="bg-white rounded-2xl border border-ink/10 p-8">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: transaction.clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#1a6b8a',
                  colorBackground: '#ffffff',
                  fontFamily: '"Inter Tight", sans-serif',
                  borderRadius: '8px',
                },
              },
            }}
          >
            <CheckoutForm transaction={transaction} />
          </Elements>
        </div>

        {/* Escrow notice */}
        <div className="mt-6 bg-ocean/5 border border-ocean/20 rounded-xl p-4 text-xs text-ink/60 leading-relaxed">
          <strong className="text-ink">Escrow Protection:</strong> Your payment is held in a regulated escrow account and is only released to the seller after title documents have been verified and the transfer is confirmed by both parties. You can cancel and receive a full refund at any point before escrow release.
        </div>
      </div>
    </div>
  );
}
