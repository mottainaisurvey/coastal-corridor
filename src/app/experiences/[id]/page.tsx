'use client';

/**
 * /experiences/[id] — CC-D-01-A AC-4
 *
 * Guest-facing experience detail page.
 *
 * Sections (per Decision 3 / AC-4b):
 *   1. Hero: primary image, title, location, price-from, "Book Now" CTA
 *   2. Description
 *   3. Time slots — next 30 days, grouped by date
 *   4. Meeting point — text + Google Maps link (lat/lng)
 *   5. Duration & capacity
 *   6. Age/fitness requirements (if non-empty)
 *   7. Equipment (provided / required if non-empty)
 *   8. Operator info + verification badge
 *   9. Bottom CTA
 *
 * Public — no auth required.
 * Non-ACTIVE or non-existent IDs return 404.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Clock, Users, Calendar, CheckCircle, AlertCircle,
  ArrowLeft, ExternalLink, RefreshCw, Compass, Shield,
  Thermometer, Dumbbell, Package, ChevronRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimeSlot {
  id:             string;
  startDateTime:  string;
  endDateTime:    string;
  capacity:       number;
  spotsBooked:    number;
  spotsRemaining: number;
  rate:           number | null;
  currency:       string;
  status:         string;
}

interface ExperienceDetail {
  id:                      string;
  name:                    string;
  description:             string;
  experienceType:          string;
  durationMinutes:         number;
  capacity:                number;
  meetingPointDescription: string;
  meetingPointLatitude:    number | null;
  meetingPointLongitude:   number | null;
  pricingModel:            string;
  basePrice:               number;
  baseCurrency:            string;
  ageRestriction:          string | null;
  fitnessRequirement:      string | null;
  weatherDependent:        boolean;
  equipmentProvided:       string[];
  equipmentRequired:       string[];
  verificationLevel:       string | null;
  verifiedAt:              string | null;
  primaryImage:            string | null;
  images:                  { id: string; url: string; caption: string | null; isPrimary: boolean }[];
  operator: {
    displayName:       string | null;
    verificationLevel: string | null;
    verifiedAt:        string | null;
  };
  timeSlots: TimeSlot[];
}

type PageState =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error'; message: string }
  | { status: 'ok'; experience: ExperienceDetail };

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hour${h !== 1 ? 's' : ''}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function groupByDate(slots: TimeSlot[]): Map<string, TimeSlot[]> {
  const map = new Map<string, TimeSlot[]>();
  for (const slot of slots) {
    const key = slot.startDateTime.slice(0, 10); // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(slot);
  }
  return map;
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    TOUR: 'Tour', CHARTER: 'Charter', WORKSHOP: 'Workshop',
    FOOD_EXPERIENCE: 'Food Experience', TRANSPORT: 'Transport',
    EVENT_SPECIALIST: 'Event Specialist', WELLNESS: 'Wellness', OTHER: 'Other',
  };
  return labels[type] ?? type;
}

// ── TimeSlot section ──────────────────────────────────────────────────────────

function TimeSlotsSection({ slots, experienceId }: { slots: TimeSlot[]; experienceId: string }) {
  if (slots.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-[14px] text-amber-700">
        <Calendar className="w-4 h-4 shrink-0" />
        <span>No upcoming dates available for the next 30 days.</span>
      </div>
    );
  }

  const grouped = groupByDate(slots);

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateKey, daySlots]) => (
        <div key={dateKey}>
          <div className="text-[12px] font-mono uppercase tracking-widest text-ink/40 mb-2">
            {formatDate(daySlots[0].startDateTime)}
          </div>
          <div className="space-y-2">
            {daySlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-3 border border-ink/10 rounded-lg hover:border-ocean/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-[14px] font-medium">
                      {formatTime(slot.startDateTime)} – {formatTime(slot.endDateTime)}
                    </div>
                    <div className="text-[12px] text-ink/50 mt-0.5">
                      {slot.spotsRemaining} of {slot.capacity} spots remaining
                    </div>
                  </div>
                  {slot.status === 'FULL' && (
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-red-50 text-red-500 px-2 py-0.5 rounded">
                      Full
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {slot.rate !== null && (
                    <div className="text-right">
                      <div className="text-[14px] font-medium">{formatCurrency(slot.rate, slot.currency)}</div>
                      <div className="text-[10px] text-ink/40">per person</div>
                    </div>
                  )}
                  <Link
                    href={`/experiences/${experienceId}/book?slotId=${slot.id}`}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                      slot.status === 'FULL'
                        ? 'bg-ink/5 text-ink/30 cursor-not-allowed pointer-events-none'
                        : 'bg-ocean text-white hover:bg-ocean/90'
                    }`}
                  >
                    Select<ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExperienceDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    if (!id) return;
    setState({ status: 'loading' });
    fetch(`/api/experiences/${id}`)
      .then(res => {
        if (res.status === 404) { setState({ status: 'notfound' }); return null; }
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data) setState({ status: 'ok', experience: data });
      })
      .catch(err => {
        console.error('[experience detail] fetch error:', err);
        setState({ status: 'error', message: 'Unable to load this experience — please try again.' });
      });
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-[45vh] bg-ink/5 animate-pulse" />
        <div className="container-x py-10 space-y-4 animate-pulse">
          <div className="h-8 bg-ink/5 rounded w-2/3" />
          <div className="h-4 bg-ink/5 rounded w-1/3" />
          <div className="h-4 bg-ink/5 rounded w-full" />
          <div className="h-4 bg-ink/5 rounded w-5/6" />
        </div>
      </div>
    );
  }

  // ── 404 ────────────────────────────────────────────────────────────────────

  if (state.status === 'notfound') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-center px-4">
        <Compass className="w-12 h-12 text-ocean/30" />
        <h1 className="font-serif text-[28px] font-light">Experience not found</h1>
        <p className="text-[14px] text-ink/50">This experience may no longer be available.</p>
        <Link href="/experiences" className="flex items-center gap-2 px-4 py-2 bg-ocean text-white rounded-md text-[13px] hover:bg-ocean/90 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Browse experiences
        </Link>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-ink/60">{state.message}</p>
        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-2 px-4 py-2 border border-ink/20 rounded-md text-[13px] hover:bg-ink/5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />Try again
        </button>
      </div>
    );
  }

  const { experience } = state;
  const hasTimeSlots = experience.timeSlots.length > 0;
  const mapsUrl = experience.meetingPointLatitude && experience.meetingPointLongitude
    ? `https://www.google.com/maps?q=${experience.meetingPointLatitude},${experience.meetingPointLongitude}`
    : null;

  const bookUrl = `/experiences/${experience.id}/book`;

  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="container-x pt-6 pb-2">
        <Link href="/experiences" className="inline-flex items-center gap-1.5 text-[13px] text-ink/50 hover:text-ocean transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />All experiences
        </Link>
      </div>

      {/* Hero */}
      <section className="container-x pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Image */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink/5">
            {experience.primaryImage ? (
              <img
                src={experience.primaryImage}
                alt={experience.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean/10 to-ocean/5">
                <div className="text-center">
                  <Compass className="w-12 h-12 text-ocean/30 mx-auto mb-2" />
                  <span className="text-[12px] text-ink/30 font-mono uppercase tracking-widest">
                    {experience.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Hero info */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-ocean mb-2">
                {typeLabel(experience.experienceType)}
              </div>
              <h1 className="font-serif text-[32px] md:text-[40px] leading-[1.1] font-light mb-3">
                {experience.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[14px] text-ink/60">
                <MapPin className="w-4 h-4 shrink-0 text-ocean/60" />
                <span>{experience.meetingPointDescription}</span>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <div className="text-[11px] text-ink/40 uppercase tracking-widest mb-1">From</div>
              <div className="font-serif text-[36px] font-medium text-ink leading-none">
                {formatCurrency(experience.basePrice, experience.baseCurrency)}
              </div>
              <div className="text-[12px] text-ink/40 mt-1">
                {experience.pricingModel === 'PER_PERSON' ? 'per person' : experience.pricingModel === 'PER_GROUP' ? 'per group' : ''}
              </div>
            </div>

            <div className="flex items-center gap-4 text-[13px] text-ink/60">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-ocean/60" />
                <span>{formatDuration(experience.durationMinutes)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-ocean/60" />
                <span>Up to {experience.capacity} guests</span>
              </div>
            </div>

            {/* CTA — top */}
            {hasTimeSlots ? (
              <Link
                href={bookUrl}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ocean text-white rounded-md text-[15px] font-medium hover:bg-ocean/90 transition-colors"
              >
                Book Now<ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md text-[14px] text-amber-700">
                <Calendar className="w-4 h-4 shrink-0" />
                No upcoming dates available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Detail sections */}
      <section className="container-x pb-16">
        <div className="max-w-3xl space-y-10">

          {/* Description */}
          <div>
            <h2 className="font-serif text-[22px] font-light mb-3">About this experience</h2>
            <p className="text-[15px] text-ink/70 leading-relaxed whitespace-pre-wrap">{experience.description}</p>
          </div>

          {/* Time slots */}
          <div>
            <h2 className="font-serif text-[22px] font-light mb-4">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-ocean/60" />Available dates
              </span>
            </h2>
            <TimeSlotsSection slots={experience.timeSlots} experienceId={experience.id} />
          </div>

          {/* Meeting point */}
          <div>
            <h2 className="font-serif text-[22px] font-light mb-3">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-ocean/60" />Meeting point
              </span>
            </h2>
            <p className="text-[15px] text-ink/70 leading-relaxed mb-3">{experience.meetingPointDescription}</p>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] text-ocean hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />View on Google Maps
              </a>
            )}
          </div>

          {/* Duration & capacity */}
          <div>
            <h2 className="font-serif text-[22px] font-light mb-3">Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-ink/3 rounded-lg">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-1">
                  <Clock className="w-3 h-3" />Duration
                </div>
                <div className="text-[15px] font-medium">{formatDuration(experience.durationMinutes)}</div>
              </div>
              <div className="p-4 bg-ink/3 rounded-lg">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-1">
                  <Users className="w-3 h-3" />Capacity
                </div>
                <div className="text-[15px] font-medium">Up to {experience.capacity} guests</div>
              </div>
              {experience.weatherDependent && (
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-amber-600 mb-1">
                    <Thermometer className="w-3 h-3" />Weather
                  </div>
                  <div className="text-[13px] text-amber-700">Weather dependent</div>
                </div>
              )}
            </div>
          </div>

          {/* Age / fitness requirements */}
          {(experience.ageRestriction || experience.fitnessRequirement) && (
            <div>
              <h2 className="font-serif text-[22px] font-light mb-3">
                <span className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-ocean/60" />Requirements
                </span>
              </h2>
              <div className="space-y-2">
                {experience.ageRestriction && (
                  <div className="flex items-start gap-2 text-[14px] text-ink/70">
                    <CheckCircle className="w-4 h-4 text-ocean/60 mt-0.5 shrink-0" />
                    <span><strong>Age restriction:</strong> {experience.ageRestriction}</span>
                  </div>
                )}
                {experience.fitnessRequirement && (
                  <div className="flex items-start gap-2 text-[14px] text-ink/70">
                    <CheckCircle className="w-4 h-4 text-ocean/60 mt-0.5 shrink-0" />
                    <span><strong>Fitness level:</strong> {experience.fitnessRequirement}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Equipment */}
          {(experience.equipmentProvided.length > 0 || experience.equipmentRequired.length > 0) && (
            <div>
              <h2 className="font-serif text-[22px] font-light mb-3">
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-ocean/60" />Equipment
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {experience.equipmentProvided.length > 0 && (
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-2">Provided</div>
                    <ul className="space-y-1">
                      {experience.equipmentProvided.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-[14px] text-ink/70">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {experience.equipmentRequired.length > 0 && (
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-2">Bring your own</div>
                    <ul className="space-y-1">
                      {experience.equipmentRequired.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-[14px] text-ink/70">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Operator info */}
          {experience.operator.displayName && (
            <div>
              <h2 className="font-serif text-[22px] font-light mb-3">About the operator</h2>
              <div className="flex items-center gap-3 p-4 border border-ink/10 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-ocean/10 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-medium text-ocean">
                    {experience.operator.displayName.slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-medium">{experience.operator.displayName}</span>
                    {experience.operator.verificationLevel && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest bg-green-50 text-green-600 px-2 py-0.5 rounded">
                        <Shield className="w-2.5 h-2.5" />Verified
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-ink/40 mt-0.5">Coastal Corridor Operator</div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="pt-6 border-t border-ink/10">
            {hasTimeSlots ? (
              <Link
                href={bookUrl}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-ocean text-white rounded-md text-[16px] font-medium hover:bg-ocean/90 transition-colors"
              >
                Book Now — {formatCurrency(experience.basePrice, experience.baseCurrency)}
                {experience.pricingModel === 'PER_PERSON' ? ' / person' : ''}
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md text-[14px] text-amber-700 w-fit">
                <Calendar className="w-4 h-4 shrink-0" />
                No upcoming dates available — check back soon.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
