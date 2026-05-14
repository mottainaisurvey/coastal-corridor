'use client';

/**
 * /experiences/checkout/[experienceBookingId] — CC-D-01-C AC-3c
 *
 * Stripe Elements checkout page for USD/GBP-priced experience bookings.
 * Parallel to /checkout/[transactionId] for real-estate transactions;
 * does NOT use the Transaction model (per CC-D-01-C scope discipline).
 *
 * Flow:
 *   1. Fetch booking details + Stripe client secret from
 *      GET /api/experiences/checkout/[experienceBookingId]
 *   2. Render Stripe Elements with PaymentElement
 *   3. On payment success: redirect to /booking-complete/[experienceBookingId]
 *   4. Stripe webhook (payment_intent.succeeded) confirms the booking
 *      server-side (AC-4b)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { ArrowLeft, ShieldCheck, CheckCircle, AlertCircle, Calendar, Users } from 'lucide-react';

// ─── Stripe Promise ───────────────────────────────────────────────────────────
// publishableKey is loaded from the API response to avoid hardcoding
let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripePromise(publishableKey: string) {
  if (!stripePromise && publishableKey) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingDetails {
  id: string;
  experienceName: string;
  totalAmount: string;
  currency: string;
  numberOfParticipants: number;
  slotDateTime: string;
  guestEmail: string;
}

// ─── Inner Checkout Form ──────────────────────────────────────────────────────
function ExperienceCheckoutForm({ booking }: { booking: BookingDetails }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setPaymentError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking-complete/${booking.id}`,
        receipt_email: booking.guestEmail,
      },
    });

    if (error) {
      setPaymentError(error.message ?? 'Payment failed. Please try again.');
      setIsSubmitting(false);
    }
    // On success, Stripe redirects to return_url automatically
  };

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: booking.currency,
  }).format(parseFloat(booking.totalAmount));

  const formattedDate = new Date(booking.slotDateTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking summary */}
      <div className="bg-sand rounded-xl p-4 space-y-3">
        <h3 className="font-medium text-ink text-sm">Booking Summary</h3>
        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-ocean mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-ink text-sm font-medium">{booking.experienceName}</p>
            <p className="text-ink/60 text-xs">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-ocean flex-shrink-0" />
          <p className="text-ink/70 text-sm">
            {booking.numberOfParticipants} {booking.numberOfParticipants === 1 ? 'participant' : 'participants'}
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-ink/10">
          <span className="text-ink/60 text-sm">Total</span>
          <span className="text-ink font-semibold text-lg">{formattedAmount}</span>
        </div>
      </div>

      {/* Stripe PaymentElement */}
      <div>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error display */}
      {paymentError && (
        <div className="flex items-start gap-2 bg-laterite/5 border border-laterite/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-laterite mt-0.5 flex-shrink-0" />
          <p className="text-laterite text-sm">{paymentError}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="w-full bg-ocean text-white py-3 rounded-xl font-medium text-sm hover:bg-ocean/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          `Pay ${formattedAmount}`
        )}
      </button>
    </form>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function ExperienceCheckoutPage({
  params,
}: {
  params: { experienceBookingId: string };
}) {
  const { experienceBookingId } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string>('');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  useEffect(() => {
    fetch(`/api/experiences/checkout/${experienceBookingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          if (data.paymentStatus === 'PAID' || data.paymentStatus === 'CONFIRMED') {
            setAlreadyPaid(true);
          } else {
            setError(data.error);
          }
          return;
        }
        setClientSecret(data.clientSecret);
        setPublishableKey(data.publishableKey);
        setBooking(data.booking);
      })
      .catch(() => setError('Failed to load checkout details'))
      .finally(() => setLoading(false));
  }, [experienceBookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (alreadyPaid) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-sage" />
          </div>
          <h2 className="text-xl font-light text-ink mb-2">Payment Already Received</h2>
          <p className="text-ink/60 text-sm mb-6">This booking has already been paid.</p>
          <Link
            href={`/booking-complete/${experienceBookingId}`}
            className="bg-ocean text-white px-6 py-2.5 rounded-lg text-sm hover:bg-ocean/90 transition-colors"
          >
            View Booking
          </Link>
        </div>
      </div>
    );
  }

  if (error || !clientSecret || !booking) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-laterite mx-auto mb-4" />
          <p className="text-ink font-medium">{error || 'Checkout unavailable'}</p>
          <Link href="/experiences" className="text-ocean text-sm mt-2 inline-block hover:underline">
            Browse experiences
          </Link>
        </div>
      </div>
    );
  }

  const resolvedStripePromise = getStripePromise(publishableKey);

  return (
    <div className="min-h-screen bg-sand">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/experiences/${booking.id}`}
            className="inline-flex items-center gap-2 text-ink/50 hover:text-ink text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Experience
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-ocean" />
            <h1 className="text-2xl font-light text-ink">Secure Checkout</h1>
          </div>
          <p className="text-ink/60 text-sm">
            Complete your experience booking. Your payment is processed securely.
          </p>
        </div>

        {/* Checkout form */}
        <div className="bg-white rounded-2xl border border-ink/10 p-8">
          {resolvedStripePromise ? (
            <Elements
              stripe={resolvedStripePromise}
              options={{
                clientSecret,
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
              <ExperienceCheckoutForm booking={booking} />
            </Elements>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-ochre mx-auto mb-2" />
              <p className="text-ink/60 text-sm">Stripe is not configured.</p>
            </div>
          )}
        </div>

        {/* Security notice */}
        <div className="mt-6 bg-ocean/5 border border-ocean/20 rounded-xl p-4 text-xs text-ink/60 leading-relaxed">
          <strong className="text-ink">Secure Payment:</strong> Your payment is processed securely by Stripe. Coastal Corridor does not store your card details. You will receive a confirmation email once your booking is confirmed.
        </div>
      </div>
    </div>
  );
}
