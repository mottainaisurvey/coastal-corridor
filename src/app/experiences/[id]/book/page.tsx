'use client';

/**
 * /experiences/[id]/book — CC-D-01-B AC-3
 *
 * Single-page progressive disclosure booking flow (AC-3b option i).
 *
 * Steps:
 *   1. Slot summary (auto-created on mount from ?slotId= param)
 *   2. Group size selector (stepper, live cost calculation)
 *   3. Contact details (name, email, phone)
 *   4. Confirmation pre-payment (summary, terms, proceed button)
 *
 * State persistence: bookingId stored in URL (?bookingId=...).
 * On reload with bookingId, fetches existing draft and restores step.
 *
 * Session: HttpOnly cookie set by POST /api/bookings/draft on creation.
 *
 * Authentication: PUBLIC (anonymous booking).
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Users, User, Mail, Phone,
  CheckCircle, AlertCircle, RefreshCw, ChevronRight,
  Loader2, Edit2, ShieldCheck,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DraftBooking {
  id: string;
  status: string;
  groupSize: number | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  totalAmount: number | null;
  currency: string | null;
  expiresAt: string;
  experience: {
    id: string;
    name: string;
    capacity: number;
    primaryImage: string | null;
  };
  timeSlot: {
    id: string;
    startDateTime: string;
    endDateTime: string;
    capacity: number;
    spotsBooked: number;
    spotsRemaining: number;
    maxGroupSize: number;
    rate: number | null;
    currency: string;
    status: string;
  };
}

type Step = 1 | 2 | 3 | 4;

type PageState =
  | { status: 'init' }
  | { status: 'creating' }
  | { status: 'loading' }
  | { status: 'error'; message: string; retry?: () => void }
  | { status: 'ready'; draft: DraftBooking; step: Step };

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function inferStep(draft: DraftBooking): Step {
  if (!draft.groupSize) return 2;
  if (!draft.guestName || !draft.guestEmail || !draft.guestPhone) return 3;
  return 4;
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Slot' },
    { n: 2, label: 'Group' },
    { n: 3, label: 'Contact' },
    { n: 4, label: 'Review' },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-medium transition-colors ${
            s.n < current ? 'bg-ocean text-white' :
            s.n === current ? 'bg-ocean text-white ring-2 ring-ocean/30' :
            'bg-ink/10 text-ink/40'
          }`}>
            {s.n < current ? <CheckCircle className="w-4 h-4" /> : s.n}
          </div>
          <span className={`ml-1.5 text-[12px] hidden sm:inline ${s.n === current ? 'text-ink' : 'text-ink/40'}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px mx-2 ${s.n < current ? 'bg-ocean' : 'bg-ink/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Booking summary sidebar ───────────────────────────────────────────────────

function BookingSummary({ draft }: { draft: DraftBooking }) {
  const slot = draft.timeSlot;
  const total = draft.totalAmount;
  const currency = draft.currency ?? slot.currency;

  return (
    <div className="bg-ink/3 rounded-lg p-5 space-y-4 text-[14px]">
      <div className="font-medium text-[15px]">{draft.experience.name}</div>
      <div className="space-y-2 text-ink/60">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-ocean/60" />
          <span>{formatDateTime(slot.startDateTime)}</span>
        </div>
        {draft.groupSize && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0 text-ocean/60" />
            <span>{draft.groupSize} {draft.groupSize === 1 ? 'person' : 'people'}</span>
          </div>
        )}
      </div>
      {total !== null && (
        <div className="border-t border-ink/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-ink/60">Total</span>
            <span className="font-serif text-[18px] font-medium">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 1: Slot summary ──────────────────────────────────────────────────────

function Step1({ draft, onContinue }: { draft: DraftBooking; onContinue: () => void }) {
  const slot = draft.timeSlot;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[22px] font-light mb-1">Your selected slot</h2>
        <p className="text-[14px] text-ink/50">Confirm your slot before choosing your group size.</p>
      </div>

      <div className="border border-ocean/20 rounded-lg p-5 space-y-3 bg-ocean/3">
        <div className="flex items-center gap-2 text-[13px] font-mono uppercase tracking-widest text-ocean">
          <CheckCircle className="w-4 h-4" />Slot confirmed
        </div>
        <div className="text-[16px] font-medium">{formatDateTime(slot.startDateTime)}</div>
        <div className="text-[13px] text-ink/50">
          {slot.spotsRemaining} of {slot.capacity} spots remaining
        </div>
        {slot.rate !== null && (
          <div className="text-[14px] text-ink/70">
            {formatCurrency(slot.rate, slot.currency)} per person
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        className="flex items-center gap-2 px-6 py-3 bg-ocean text-white rounded-md text-[15px] font-medium hover:bg-ocean/90 transition-colors"
      >
        Continue to group size<ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Step 2: Group size ────────────────────────────────────────────────────────

function Step2({
  draft,
  onContinue,
}: {
  draft: DraftBooking;
  onContinue: (groupSize: number) => Promise<void>;
}) {
  const slot = draft.timeSlot;
  const [groupSize, setGroupSize] = useState(draft.groupSize ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitRate = slot.rate ?? null;
  const currency = slot.currency;
  const total = unitRate !== null ? unitRate * groupSize : null;
  const max = slot.maxGroupSize;

  async function handleContinue() {
    setLoading(true);
    setError(null);
    try {
      await onContinue(groupSize);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save group size');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[22px] font-light mb-1">How many people?</h2>
        <p className="text-[14px] text-ink/50">Up to {max} spots available for this slot.</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setGroupSize(g => Math.max(1, g - 1))}
          disabled={groupSize <= 1}
          className="w-10 h-10 rounded-full border border-ink/20 flex items-center justify-center text-[18px] hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          −
        </button>
        <div className="text-center">
          <div className="font-serif text-[36px] font-medium leading-none">{groupSize}</div>
          <div className="text-[12px] text-ink/40 mt-1">{groupSize === 1 ? 'person' : 'people'}</div>
        </div>
        <button
          onClick={() => setGroupSize(g => Math.min(max, g + 1))}
          disabled={groupSize >= max}
          className="w-10 h-10 rounded-full border border-ink/20 flex items-center justify-center text-[18px] hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>

      {total !== null && (
        <div className="p-4 bg-ink/3 rounded-lg">
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-ink/60">{groupSize} × {formatCurrency(unitRate!, currency)}</span>
            <span className="font-serif text-[20px] font-medium">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-ocean text-white rounded-md text-[15px] font-medium hover:bg-ocean/90 disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Continue to contact details<ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Step 3: Contact details ───────────────────────────────────────────────────

function Step3({
  draft,
  onContinue,
}: {
  draft: DraftBooking;
  onContinue: (fields: { guestName: string; guestEmail: string; guestPhone: string }) => Promise<void>;
}) {
  const [name, setName] = useState(draft.guestName ?? '');
  const [email, setEmail] = useState(draft.guestEmail ?? '');
  const [phone, setPhone] = useState(draft.guestPhone ?? '');
  const [touched, setTouched] = useState({ name: false, email: false, phone: false });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const errors = {
    name: touched.name && !name.trim() ? 'Name is required' : null,
    email: touched.email && (!email.trim() || !EMAIL_RE.test(email.trim())) ? 'A valid email is required' : null,
    phone: touched.phone && !phone.trim() ? 'Phone number is required' : null,
  };

  const isValid = name.trim() && email.trim() && EMAIL_RE.test(email.trim()) && phone.trim();

  async function handleContinue() {
    setTouched({ name: true, email: true, phone: true });
    if (!isValid) return;
    setLoading(true);
    setServerError(null);
    try {
      await onContinue({ guestName: name.trim(), guestEmail: email.trim(), guestPhone: phone.trim() });
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Failed to save contact details');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[22px] font-light mb-1">Contact details</h2>
        <p className="text-[14px] text-ink/50">We'll use these details to confirm your booking.</p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-[13px] font-medium mb-1.5">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-ocean/60" />Full name</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, name: true }))}
            placeholder="Your full name"
            className={`w-full px-3 py-2.5 border rounded-md text-[14px] outline-none transition-colors ${
              errors.name ? 'border-red-400 focus:border-red-400' : 'border-ink/20 focus:border-ocean'
            }`}
          />
          {errors.name && <p className="text-[12px] text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-[13px] font-medium mb-1.5">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-ocean/60" />Email address</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            placeholder="your@email.com"
            className={`w-full px-3 py-2.5 border rounded-md text-[14px] outline-none transition-colors ${
              errors.email ? 'border-red-400 focus:border-red-400' : 'border-ink/20 focus:border-ocean'
            }`}
          />
          {errors.email && <p className="text-[12px] text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[13px] font-medium mb-1.5">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-ocean/60" />Phone number</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, phone: true }))}
            placeholder="+234 800 000 0000"
            className={`w-full px-3 py-2.5 border rounded-md text-[14px] outline-none transition-colors ${
              errors.phone ? 'border-red-400 focus:border-red-400' : 'border-ink/20 focus:border-ocean'
            }`}
          />
          {errors.phone && <p className="text-[12px] text-red-500 mt-1">{errors.phone}</p>}
        </div>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{serverError}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-ocean text-white rounded-md text-[15px] font-medium hover:bg-ocean/90 disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Review booking<ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Step 4: Confirmation pre-payment ─────────────────────────────────────────

function Step4({
  draft,
  onEdit,
  onProceed,
}: {
  draft: DraftBooking;
  onEdit: (step: Step) => void;
  onProceed: () => Promise<void>;
}) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slot = draft.timeSlot;
  const total = draft.totalAmount;
  const currency = draft.currency ?? slot.currency;

  async function handleProceed() {
    if (!agreed) return;
    setLoading(true);
    setError(null);
    try {
      await onProceed();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to proceed to payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[22px] font-light mb-1">Review your booking</h2>
        <p className="text-[14px] text-ink/50">Confirm the details below before proceeding to payment.</p>
      </div>

      {/* Booking summary */}
      <div className="border border-ink/10 rounded-lg divide-y divide-ink/10">
        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-1">Experience</div>
          <div className="font-medium">{draft.experience.name}</div>
        </div>
        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-1">Date & Time</div>
          <div className="text-[14px]">{formatDateTime(slot.startDateTime)}</div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-1">Group size</div>
            <div className="text-[14px]">{draft.groupSize} {draft.groupSize === 1 ? 'person' : 'people'}</div>
          </div>
          <button
            onClick={() => onEdit(2)}
            className="flex items-center gap-1 text-[12px] text-ocean hover:underline"
          >
            <Edit2 className="w-3 h-3" />Edit
          </button>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-1">Contact</div>
            <div className="text-[14px]">{draft.guestName}</div>
            <div className="text-[13px] text-ink/50">{draft.guestEmail} · {draft.guestPhone}</div>
          </div>
          <button
            onClick={() => onEdit(3)}
            className="flex items-center gap-1 text-[12px] text-ocean hover:underline"
          >
            <Edit2 className="w-3 h-3" />Edit
          </button>
        </div>
        {total !== null && (
          <div className="p-4 flex items-center justify-between bg-ink/2">
            <div className="font-medium">Total</div>
            <div className="font-serif text-[22px] font-medium">{formatCurrency(total, currency)}</div>
          </div>
        )}
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-ocean"
        />
        <span className="text-[13px] text-ink/70">
          I agree to the experience terms and conditions. I understand that this booking is subject to availability and the operator's cancellation policy.
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <button
        onClick={handleProceed}
        disabled={!agreed || loading}
        className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-ocean text-white rounded-md text-[15px] font-medium hover:bg-ocean/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        Proceed to payment
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BookingFlowPage() {
  const { id: experienceId } = useParams<{ id: string }>();
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const [state, setState] = useState<PageState>({ status: 'init' });

  const slotId    = searchParams.get('slotId');
  const bookingId = searchParams.get('bookingId');

  // ── Initialize draft ───────────────────────────────────────────────────────

  const initDraft = useCallback(async () => {
    // Case A: bookingId in URL — restore existing draft
    if (bookingId) {
      setState({ status: 'loading' });
      try {
        const res = await fetch(`/api/bookings/draft/${bookingId}`);
        if (res.status === 401) {
          // Session cookie mismatch — redirect to detail page
          router.replace(`/experiences/${experienceId}`);
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setState({ status: 'error', message: data.error ?? 'Could not load booking' });
          return;
        }
        const draft: DraftBooking = await res.json();
        setState({ status: 'ready', draft, step: inferStep(draft) });
      } catch {
        setState({ status: 'error', message: 'Network error — please try again' });
      }
      return;
    }

    // Case B: slotId in URL — create new draft
    if (!slotId) {
      router.replace(`/experiences/${experienceId}`);
      return;
    }

    setState({ status: 'creating' });
    try {
      const res = await fetch('/api/bookings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceId, timeSlotId: slotId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          setState({ status: 'error', message: 'This slot is fully booked. Please choose another time.' });
          return;
        }
        setState({ status: 'error', message: data.error ?? 'Could not start booking' });
        return;
      }
      const { bookingId: newId } = data as { bookingId: string };
      // Update URL to include bookingId (no page reload)
      const url = new URL(window.location.href);
      url.searchParams.set('bookingId', newId);
      url.searchParams.delete('slotId');
      router.replace(url.pathname + url.search);
      // Fetch the draft
      const draftRes = await fetch(`/api/bookings/draft/${newId}`);
      const draft: DraftBooking = await draftRes.json();
      setState({ status: 'ready', draft, step: 1 });
    } catch {
      setState({ status: 'error', message: 'Network error — please try again' });
    }
  }, [bookingId, slotId, experienceId, router]);

  useEffect(() => {
    initDraft();
  }, [initDraft]);

  // ── Step transition helpers ────────────────────────────────────────────────

  async function patchDraft(fields: Record<string, unknown>): Promise<DraftBooking> {
    if (state.status !== 'ready') throw new Error('Not ready');
    const res = await fetch(`/api/bookings/draft/${state.draft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 409 && data.code === 'SLOT_FULL') {
        throw new Error('Slot is no longer available. Please go back and choose another time.');
      }
      if (data.fields) {
        const fieldErrors = Object.values(data.fields as Record<string, string>).join(', ');
        throw new Error(fieldErrors);
      }
      throw new Error(data.error ?? 'Update failed');
    }
    return data as DraftBooking;
  }

  async function handleGroupSizeContinue(groupSize: number) {
    const updated = await patchDraft({ groupSize });
    setState(s => s.status === 'ready' ? { ...s, draft: updated, step: 3 } : s);
  }

  async function handleContactContinue(fields: { guestName: string; guestEmail: string; guestPhone: string }) {
    const updated = await patchDraft(fields);
    setState(s => s.status === 'ready' ? { ...s, draft: updated, step: 4 } : s);
  }

  function handleEditStep(step: Step) {
    setState(s => s.status === 'ready' ? { ...s, step } : s);
  }

  async function handleProceedToPayment() {
    if (state.status !== 'ready') return;
    const res = await fetch(`/api/bookings/draft/${state.draft.id}/proceed-to-payment`, {
      method: 'POST',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 409 && (data.code === 'SLOT_FULL' || data.code === 'SLOT_CANCELLED')) {
        throw new Error('Slot is no longer available. Please go back and choose another time.');
      }
      throw new Error(data.error ?? 'Failed to proceed to payment');
    }
    const { paymentUrl } = data as { paymentUrl: string };
    router.push(paymentUrl);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (state.status === 'init' || state.status === 'creating' || state.status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-ocean/50 animate-spin" />
        <p className="text-[14px] text-ink/40">
          {state.status === 'creating' ? 'Starting your booking…' : 'Loading…'}
        </p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-ink/60 max-w-sm">{state.message}</p>
        <div className="flex items-center gap-3">
          {state.retry && (
            <button
              onClick={state.retry}
              className="flex items-center gap-2 px-4 py-2 border border-ink/20 rounded-md text-[13px] hover:bg-ink/5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />Try again
            </button>
          )}
          <Link
            href={`/experiences/${experienceId}`}
            className="flex items-center gap-2 px-4 py-2 bg-ocean text-white rounded-md text-[13px] hover:bg-ocean/90 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />Back to experience
          </Link>
        </div>
      </div>
    );
  }

  const { draft, step } = state;

  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="container-x pt-6 pb-2">
        <Link
          href={`/experiences/${experienceId}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink/50 hover:text-ocean transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />Back to experience
        </Link>
      </div>

      <div className="container-x py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-[28px] md:text-[36px] font-light mb-6">Book your experience</h1>

          <StepIndicator current={step} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main flow */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <Step1
                  draft={draft}
                  onContinue={() => setState(s => s.status === 'ready' ? { ...s, step: 2 } : s)}
                />
              )}
              {step === 2 && (
                <Step2
                  draft={draft}
                  onContinue={handleGroupSizeContinue}
                />
              )}
              {step === 3 && (
                <Step3
                  draft={draft}
                  onContinue={handleContactContinue}
                />
              )}
              {step === 4 && (
                <Step4
                  draft={draft}
                  onEdit={handleEditStep}
                  onProceed={handleProceedToPayment}
                />
              )}
            </div>

            {/* Sidebar summary */}
            <div className="lg:col-span-1">
              <BookingSummary draft={draft} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
