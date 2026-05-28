'use client';

/**
 * CC-D-01-E: /booking-complete/[bookingId]
 *
 * Guest-facing post-payment confirmation page. Three states:
 *   1. CONFIRMED + PAID  → success state with full booking details
 *   2. PENDING_PAYMENT   → "payment processing" state with auto-refresh
 *   3. Anything else     → error/not-found state
 *
 * Public (no auth required — anonymous guest).
 * Security: displays only non-sensitive fields. No payment provider IDs,
 * admin notes, or internal tokens are rendered.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BookingConfirmationData {
  id: string;
  status: string;
  paymentStatus: string;
  numberOfParticipants: number;
  participantNames: string[];
  totalAmount: string;
  currency: string;
  specialRequirements: string | null;
  pickupRequested: boolean;
  pickupAddress: string | null;
  createdAt: string;
  experience: {
    name: string;
    meetingPointDescription: string;
    meetingPointLatitude: string;
    meetingPointLongitude: string;
    durationMinutes: number;
    primaryImageUrl: string | null;
    operator: {
      displayName: string | null;
      businessName: string | null;
      email: string;
    };
  };
  timeSlot: {
    startDateTime: string;
    endDateTime: string;
  };
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRef(id: string): string {
  return `CC-EXP-${id.slice(0, 8).toUpperCase()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };
  const sym = symbols[currency] ?? currency + ' ';
  return `${sym}${num.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
}

function googleMapsUrl(lat: string, lng: string, label: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(label)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SuccessState({ booking }: { booking: BookingConfirmationData }) {
  const { experience, timeSlot } = booking;
  const operatorName = experience.operator.displayName ?? experience.operator.businessName ?? 'Your Operator';
  const mapsUrl = googleMapsUrl(
    experience.meetingPointLatitude,
    experience.meetingPointLongitude,
    experience.meetingPointDescription
  );

  return (
    <div className="min-h-screen bg-[#f5f1ea] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="bg-[#0a0e12] text-[#f5f1ea] rounded-t-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">✓</div>
            <div>
              <h1 className="text-2xl font-light">Booking Confirmed!</h1>
              <p className="text-sm text-[#f5f1ea]/60">Ref: {formatRef(booking.id)}</p>
            </div>
          </div>
          {experience.primaryImageUrl && (
            <img
              src={experience.primaryImageUrl}
              alt={experience.name}
              className="w-full h-48 object-cover rounded-lg mt-4"
              loading="lazy"
            />
          )}
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-b-xl divide-y divide-gray-100 shadow-sm">
          {/* Experience */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-[#0a0e12] mb-1">{experience.name}</h2>
            <p className="text-sm text-gray-500">with {operatorName}</p>
          </div>

          {/* Date & time */}
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Date</p>
              <p className="text-sm font-medium text-[#0a0e12]">{formatDate(timeSlot.startDateTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Time</p>
              <p className="text-sm font-medium text-[#0a0e12]">
                {formatTime(timeSlot.startDateTime)} – {formatTime(timeSlot.endDateTime)}
              </p>
            </div>
          </div>

          {/* Participants & amount */}
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Participants</p>
              <p className="text-sm font-medium text-[#0a0e12]">{booking.numberOfParticipants}</p>
              {booking.participantNames.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{booking.participantNames.join(', ')}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Paid</p>
              <p className="text-sm font-medium text-[#0a0e12]">
                {formatCurrency(booking.totalAmount, booking.currency)}
              </p>
            </div>
          </div>

          {/* Meeting point */}
          <div className="p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Meeting Point</p>
            <p className="text-sm text-[#0a0e12] mb-2">{experience.meetingPointDescription}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              View on Google Maps →
            </a>
          </div>

          {/* Guest contact */}
          <div className="p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Your Contact Details</p>
            <div className="space-y-1 text-sm text-[#0a0e12]">
              <p><span className="text-gray-400">Name:</span> {booking.guestName}</p>
              <p><span className="text-gray-400">Email:</span> {booking.guestEmail}</p>
              {booking.guestPhone && (
                <p><span className="text-gray-400">Phone:</span> {booking.guestPhone}</p>
              )}
            </div>
          </div>

          {/* Special requirements */}
          {booking.specialRequirements && (
            <div className="p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Special Requirements</p>
              <p className="text-sm text-[#0a0e12]">{booking.specialRequirements}</p>
            </div>
          )}

          {/* Pickup */}
          {booking.pickupRequested && booking.pickupAddress && (
            <div className="p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pickup Address</p>
              <p className="text-sm text-[#0a0e12]">{booking.pickupAddress}</p>
            </div>
          )}

          {/* Operator contact */}
          <div className="p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Your Operator</p>
            <p className="text-sm font-medium text-[#0a0e12]">{operatorName}</p>
            <a
              href={`mailto:${experience.operator.email}`}
              className="text-xs text-blue-600 hover:underline"
            >
              {experience.operator.email}
            </a>
          </div>

          {/* What happens next */}
          <div className="p-6 bg-[#f5f1ea] rounded-b-xl">
            <h3 className="text-sm font-medium text-[#0a0e12] mb-2">What happens next</h3>
            <p className="text-sm text-gray-600">
              {operatorName} has been notified of your booking and will contact you at{' '}
              <strong>{booking.guestEmail}</strong> with final details — including any pickup logistics
              and what to bring. A confirmation email has been sent to you.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Reference: <strong>{formatRef(booking.id)}</strong>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/experiences" className="text-sm text-gray-500 hover:text-[#0a0e12]">
            ← Browse more experiences
          </Link>
        </div>
      </div>
    </div>
  );
}

function PendingState({ bookingId, elapsed }: { bookingId: string; elapsed: number }) {
  const showFallback = elapsed >= 60;

  return (
    <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-xl shadow-sm p-10">
          <div className="w-12 h-12 border-4 border-[#0a0e12] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-xl font-light text-[#0a0e12] mb-3">
            We&apos;re confirming your payment
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            This usually takes just a few seconds. Please don&apos;t close this page.
          </p>
          {showFallback ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-600">
                Taking longer than expected?
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-[#0a0e12] text-[#f5f1ea] text-sm rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                Refresh now
              </button>
              <p className="text-xs text-gray-400">
                If the issue persists,{' '}
                <a href="mailto:support@coastalcorridor.africa" className="text-blue-600 hover:underline">
                  contact support
                </a>{' '}
                with reference: <strong>{bookingId.slice(0, 8).toUpperCase()}</strong>
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Auto-refreshing in a moment…</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-xl shadow-sm p-10">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-500 text-2xl">✕</span>
          </div>
          <h1 className="text-xl font-light text-[#0a0e12] mb-3">
            {message ?? "We couldn't find that booking"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Your payment may not have completed, or the booking link may be incorrect.
          </p>
          <div className="space-y-3">
            <Link
              href="/experiences"
              className="block w-full py-2 px-4 bg-[#0a0e12] text-[#f5f1ea] text-sm rounded-lg hover:bg-[#1a2030] transition-colors text-center"
            >
              Browse experiences
            </Link>
            <a
              href="mailto:support@coastalcorridor.africa"
              className="block text-xs text-blue-600 hover:underline"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BookingCompletePage() {
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirmation`);
      if (res.status === 404) {
        setError('not-found');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError('error');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setBooking(data);
      setLoading(false);
    } catch {
      setError('error');
      setLoading(false);
    }
  }, [bookingId]);

  // Initial fetch
  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Auto-refresh for pending state (every 5s for first 60s)
  useEffect(() => {
    if (!booking || booking.status !== 'PENDING' || booking.paymentStatus !== 'PENDING') return;

    const interval = setInterval(() => {
      setElapsed(e => e + 5);
      if (elapsed < 60) {
        fetchBooking();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [booking, elapsed, fetchBooking]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0a0e12] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error === 'not-found') {
    return <ErrorState message="We couldn't find that booking" />;
  }

  if (error) {
    return <ErrorState message="Your payment didn't complete" />;
  }

  if (!booking) {
    return <ErrorState />;
  }

  // Pending payment state
  if (booking.status === 'PENDING' && booking.paymentStatus === 'PENDING') {
    return <PendingState bookingId={bookingId} elapsed={elapsed} />;
  }

  // Success state
  if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
    return <SuccessState booking={booking} />;
  }

  // Any other state (CANCELLED, FAILED, etc.)
  return <ErrorState message="Your payment didn't complete" />;
}
